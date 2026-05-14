import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function migrateExistingData() {
  console.log('Starting migration to multi-tenant...');
  
  // Create default organization if not exists
  const defaultOrgId = '11111111-1111-1111-1111-111111111111';
  
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', defaultOrgId)
    .single();
  
  if (!org) {
    await supabase.from('organizations').insert({
      id: defaultOrgId,
      name: 'Default Organization',
      subdomain: 'default',
      subscription_tier: 'enterprise'
    });
    console.log('Created default organization');
  }
  
  // Update all tables with organization_id
  const tables = [
    'profiles', 'audits', 'tasks', 'risks', 'complaints',
    'suppliers', 'haccp_plans', 'incidents', 'documents',
    'quality_qcps', 'quality_ncrs', 'pest_sightings',
    'pest_control_programmes'
  ];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .update({ organization_id: defaultOrgId })
      .is('organization_id', null);
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
    } else {
      console.log(`Updated ${table}`);
    }
  }
  
  console.log('Migration completed!');
}

migrateExistingData();
