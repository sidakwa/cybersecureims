#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabaseUrl = 'https://hlbcepjpbpzebuddexwm.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('📋 Document Classification Tool\n');
  
  const email = await question('📧 Enter your email: ');
  const password = await question('🔑 Enter your password: ');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email, password
  });
  
  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    process.exit(1);
  }
  
  // Get organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', auth.user.id)
    .single();
  
  const orgId = profile.organization_id;
  
  console.log(`\n📁 Organization: ${orgId}\n`);
  
  // Get all documents without proper classification
  const { data: docs } = await supabase
    .from('documents')
    .select('id, name, type, category')
    .eq('organization_id', orgId)
    .order('name');
  
  console.log(`📄 Found ${docs?.length || 0} documents\n`);
  
  for (const doc of docs || []) {
    console.log(`\n📄 ${doc.name}`);
    console.log(`   Current: Type=${doc.type || 'none'}, Category=${doc.category || 'none'}`);
    
    const newType = await question(`   New Type (Policy/Procedure/Form/Quality Document/Work Instruction): `);
    const newCategory = await question(`   New Category: `);
    
    if (newType || newCategory) {
      const updates = {};
      if (newType) updates.type = newType;
      if (newCategory) updates.category = newCategory;
      updates.tags = [newType?.toLowerCase(), newCategory?.toLowerCase(), 'qms'].filter(Boolean);
      
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', doc.id);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Updated`);
      }
    }
  }
  
  console.log('\n✅ Classification complete!');
  rl.close();
}

main().catch(console.error);
