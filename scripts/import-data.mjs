import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set:');
  console.error('  export VITE_SUPABASE_URL="your-url"');
  console.error('  export VITE_SUPABASE_SERVICE_ROLE_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Path to your Excel files
const excelDir = '/Users/watz/Downloads/OneDrive_1_06-05-2026';

// Get organization ID
async function getOrganizationId() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('Error getting organization:', error);
    return null;
  }
  
  return data[0]?.id;
}

// Process UCI Controls file
async function processUCIControls(orgId) {
  const filePath = path.join(excelDir, 'UCI_Controls_Validation_Program_v3.0.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️ UCI Controls file not found at:', filePath);
    return { success: 0, error: 0 };
  }
  
  console.log('📖 Reading UCI Controls file...');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  console.log(`📊 Found ${data.length} rows`);
  
  let success = 0;
  let error = 0;
  
  for (const row of data) {
    try {
      const record = {
        organization_id: orgId,
        wp: row['WP'] || row['wp'] || '',
        iso_ref: row['ISO Ref'] || row['iso_ref'] || '',
        iso_control: row['ISO Control'] || row['iso_control'] || '',
        control_code: row['Control Code'] || row['control_code'] || '',
        control_name: row['Control Name'] || row['control_name'] || '',
        outsurance_domain: row['OUTsurance Domain'] || row['outsurance_domain'] || '',
        outsurance_family: row['OUTsurance Family'] || row['outsurance_family'] || '',
        uci_status: row['UCI Status'] || row['uci_status'] || '',
        checks: parseInt(row['Checks'] || row['checks'] || 0),
        current_maturity: row['Curr. Maturity'] || row['current_maturity'] || '',
        target_maturity: row['Target Maturity'] || row['target_maturity'] || '',
        risk_tier: row['Risk Tier'] || row['risk_tier'] || '',
        verification_method: row['Verification Method'] || row['verification_method'] || '',
        evidence_type: row['Evidence Type'] || row['evidence_type'] || '',
        responsible: row['Responsible'] || row['responsible'] || '',
        accountable: row['Accountable'] || row['accountable'] || '',
        sprint: row['Sprint'] || row['sprint'] || '',
        target_date: row['Target Date'] || row['target_date'] || '',
        evidence_date: row['Evidence Date'] || row['evidence_date'] || '',
        outcome: row['Outcome'] || row['outcome'] || '',
        validation_notes: row['Validation Notes'] || row['validation_notes'] || ''
      };
      
      // Skip empty rows
      if (!record.control_code && !record.control_name) {
        continue;
      }
      
      const { error: insertError } = await supabase
        .from('uci_controls_full')
        .insert([record]);
      
      if (insertError) {
        error++;
        console.error(`Error inserting ${record.control_code}:`, insertError.message);
      } else {
        success++;
        if (success % 10 === 0) {
          process.stdout.write(`\r   📈 Progress: ${success} inserted, ${error} errors`);
        }
      }
    } catch (err) {
      error++;
      console.error(`Error:`, err.message);
    }
  }
  
  console.log(`\n✅ UCI Controls: ${success} inserted, ${error} errors`);
  return { success, error };
}

// Create table if it doesn't exist
async function createTable() {
  console.log('📋 Creating uci_controls_full table if needed...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS uci_controls_full (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      organization_id UUID,
      wp TEXT,
      iso_ref TEXT,
      iso_control TEXT,
      control_code TEXT,
      control_name TEXT,
      outsurance_domain TEXT,
      outsurance_family TEXT,
      uci_status TEXT,
      checks INTEGER,
      current_maturity TEXT,
      target_maturity TEXT,
      risk_tier TEXT,
      verification_method TEXT,
      evidence_type TEXT,
      responsible TEXT,
      accountable TEXT,
      sprint TEXT,
      target_date TEXT,
      evidence_date TEXT,
      outcome TEXT,
      validation_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  
  // Execute via Supabase REST API
  const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  if (error) {
    console.log('Note: If table creation fails, please create it manually in Supabase SQL editor');
    console.log('SQL for manual creation:');
    console.log(createTableSQL);
  } else {
    console.log('✅ Table ready');
  }
}

// Main function
async function main() {
  console.log('🚀 Starting direct import from Excel files...\n');
  
  // Check if files exist
  console.log('📁 Checking for Excel files in:', excelDir);
  const files = fs.readdirSync(excelDir);
  console.log('📄 Found files:', files.filter(f => f.endsWith('.xlsx')).join(', '));
  
  const orgId = await getOrganizationId();
  if (!orgId) {
    console.error('❌ Could not find organization');
    return;
  }
  
  console.log(`📁 Organization ID: ${orgId}`);
  
  // Create table
  await createTable();
  
  // Process the main UCI Controls file
  await processUCIControls(orgId);
  
  console.log('\n✨ Import process complete!');
}

// Run the import
main().catch(console.error);
