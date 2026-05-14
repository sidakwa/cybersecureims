#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const supabaseUrl = 'https://hlbcepjpbpzebuddexwm.supabase.co';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log(`${colors.blue}🚀 QMS Document Upload Tool${colors.reset}\n`);
  
  // Get user credentials
  const email = await question('📧 Enter your email: ');
  const password = await question('🔑 Enter your password: ');
  
  console.log(`\n${colors.yellow}🔐 Authenticating...${colors.reset}`);
  
  const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || '');
  
  // Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
    console.log(`${colors.red}❌ Authentication failed: ${authError.message}${colors.reset}`);
    rl.close();
    process.exit(1);
  }
  
  console.log(`${colors.green}✅ Authenticated as: ${authData.user.email}${colors.reset}\n`);
  
  // Get organization ID from user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', authData.user.id)
    .single();
  
  const orgId = profile?.organization_id;
  if (!orgId) {
    console.log(`${colors.red}❌ No organization found for this user${colors.reset}`);
    rl.close();
    process.exit(1);
  }
  
  console.log(`${colors.blue}📁 Organization ID: ${orgId}${colors.reset}`);
  console.log(`${colors.blue}👤 Role: ${profile?.role}${colors.reset}\n`);
  
  // Document category mapping
  const categoryMapping = {
    '1. Policies': 'Policy',
    '2. Procedures': 'Procedure',
    '3. Quality Document': 'Quality Document',
    '4. Work Instructions': 'Work Instruction',
    '5. Forms': 'Form'
  };
  
  let totalUploaded = 0;
  let totalFailed = 0;
  
  // Process each folder
  for (const [folder, category] of Object.entries(categoryMapping)) {
    if (!fs.existsSync(folder)) {
      console.log(`${colors.yellow}⚠️ Folder not found: ${folder}${colors.reset}`);
      continue;
    }
    
    const files = fs.readdirSync(folder);
    const docFiles = files.filter(f => {
      const fullPath = path.join(folder, f);
      return fs.statSync(fullPath).isFile() && 
             !f.startsWith('.DS_Store') &&
             /\.(docx?|pdf|xlsx?|pptx?)$/i.test(f);
    });
    
    if (docFiles.length === 0) continue;
    
    console.log(`\n${colors.blue}📂 Processing ${category} (${docFiles.length} files)...${colors.reset}`);
    
    for (const file of docFiles) {
      const filePath = path.join(folder, file);
      console.log(`  📄 Uploading: ${file}`);
      
      const fileBuffer = fs.readFileSync(filePath);
      const fileExt = path.extname(file).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      if (fileExt === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileExt === '.pdf') mimeType = 'application/pdf';
      else if (fileExt === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (fileExt === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      
      const storagePath = `qms/${folder}/${file}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('food-safety-documents')
        .upload(storagePath, fileBuffer, { cacheControl: '3600', upsert: true });
      
      if (uploadError) {
        console.log(`  ${colors.red}❌ Storage error: ${uploadError.message}${colors.reset}`);
        totalFailed++;
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-safety-documents')
        .getPublicUrl(storagePath);
      
      // Save to documents table
      const docName = file.replace(/\.[^/.]+$/, '');
      
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          name: docName,
          description: `${category} document from QMS system`,
          category: category,
          type: category,
          version: '1.0',
          status: 'Approved',
          owner: authData.user.email,
          file_path: storagePath,
          file_url: publicUrl,
          file_size: fileBuffer.length,
          mime_type: mimeType,
          original_name: file,
          organization_id: orgId,
          created_by: authData.user.id,
          tags: [category.toLowerCase().replace(/ /g, '-'), 'qms']
        });
      
      if (dbError) {
        console.log(`  ${colors.red}❌ DB error: ${dbError.message}${colors.reset}`);
        totalFailed++;
      } else {
        console.log(`  ${colors.green}✅ Success: ${file}${colors.reset}`);
        totalUploaded++;
      }
    }
  }
  
  console.log(`\n${colors.green}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.green}✅ UPLOAD COMPLETE!${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
  console.log(`   📊 Total uploaded: ${totalUploaded}`);
  console.log(`   ❌ Total failed: ${totalFailed}`);
  console.log(`   📁 Organization: ${orgId}`);
  
  rl.close();
}

main().catch(console.error);
