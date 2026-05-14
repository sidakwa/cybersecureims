#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://hlbcepjpbpzebuddexwm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Please set VITE_SUPABASE_ANON_KEY environment variable');
  console.error('   Run: export VITE_SUPABASE_ANON_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get organization ID
async function getOrganizationId() {
  // Try Pats Organics first
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Pats Organics')
    .single();
  
  if (org) return org.id;
  
  // Fallback to Default Organization
  const { data: defaultOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Default Organization')
    .single();
  
  return defaultOrg?.id;
}

// Document category mapping
const categoryMapping = {
  '1. Policies': 'Policy',
  '2. Procedures': 'Procedure',
  '3. Quality Document': 'Quality Document',
  '4. Work Instructions': 'Work Instruction',
  '5. Forms': 'Form'
};

async function uploadDocument(filePath, folder, orgId) {
  const fileName = path.basename(filePath);
  const category = categoryMapping[folder];
  const fileBuffer = fs.readFileSync(filePath);
  const fileExt = path.extname(fileName).toLowerCase();
  
  // Determine MIME type
  let mimeType = 'application/octet-stream';
  if (fileExt === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (fileExt === '.pdf') mimeType = 'application/pdf';
  else if (fileExt === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (fileExt === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  
  // Storage path
  const storagePath = `qms/${folder}/${fileName}`;
  
  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('food-safety-documents')
    .upload(storagePath, fileBuffer, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (uploadError) {
    return { success: false, error: uploadError.message };
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('food-safety-documents')
    .getPublicUrl(storagePath);
  
  // Save metadata to documents table
  const docName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  
  const { error: dbError } = await supabase
    .from('documents')
    .insert({
      name: docName,
      description: `${category} document from QMS system`,
      category: category,
      type: category,
      version: '1.0',
      status: 'Approved',
      owner: 'Quality Manager',
      file_path: storagePath,
      file_url: publicUrl,
      file_size: fileBuffer.length,
      mime_type: mimeType,
      original_name: fileName,
      organization_id: orgId,
      tags: [category.toLowerCase().replace(/ /g, '-'), 'qms']
    });
  
  if (dbError) {
    return { success: false, error: dbError.message };
  }
  
  return { success: true };
}

async function uploadAllDocuments() {
  console.log('🚀 Starting QMS Document Upload...\n');
  
  const orgId = await getOrganizationId();
  if (!orgId) {
    console.error('❌ No organization found. Please create an organization first.');
    process.exit(1);
  }
  
  console.log(`📁 Organization ID: ${orgId}\n`);
  
  let totalUploaded = 0;
  let totalFailed = 0;
  
  // Process each folder
  for (const [folder, category] of Object.entries(categoryMapping)) {
    if (!fs.existsSync(folder)) {
      console.log(`⚠️ Folder not found: ${folder}`);
      continue;
    }
    
    const files = fs.readdirSync(folder);
    // Filter for document files (exclude .DS_Store and directories)
    const docFiles = files.filter(f => {
      const fullPath = path.join(folder, f);
      return fs.statSync(fullPath).isFile() && 
             !f.startsWith('.DS_Store') &&
             /\.(docx?|pdf|xlsx?|pptx?)$/i.test(f);
    });
    
    if (docFiles.length === 0) continue;
    
    console.log(`\n📂 Processing ${category} (${docFiles.length} files)...`);
    
    for (const file of docFiles) {
      const filePath = path.join(folder, file);
      console.log(`  📄 Uploading: ${file}`);
      
      const result = await uploadDocument(filePath, folder, orgId);
      
      if (result.success) {
        totalUploaded++;
        console.log(`  ✅ Success: ${file}`);
      } else {
        totalFailed++;
        console.log(`  ❌ Failed: ${file} - ${result.error}`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ UPLOAD COMPLETE!`);
  console.log(`${'='.repeat(50)}`);
  console.log(`   📊 Total uploaded: ${totalUploaded}`);
  console.log(`   ❌ Total failed: ${totalFailed}`);
  console.log(`   📁 Organization: ${orgId}`);
}

uploadAllDocuments().catch(console.error);
