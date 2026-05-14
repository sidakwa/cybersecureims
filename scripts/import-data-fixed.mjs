import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const excelDir = '/Users/watz/Downloads/OneDrive_1_06-05-2026';

async function getOrganizationId() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('Error getting organization:', error);
    return '11111111-1111-1111-1111-111111111111';
  }
  
  return data[0]?.id || '11111111-1111-1111-1111-111111111111';
}

// Process all Excel files
async function processAllFiles(orgId) {
  const files = [
    'UCI_Controls_Validation_Program_v3.0.xlsx',
    'Seacom_CSI_Programme_Module5_P06_UCI_v1.0.xlsx'
  ];
  
  let totalSuccess = 0;
  let totalError = 0;
  
  for (const file of files) {
    const filePath = path.join(excelDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${file}`);
      continue;
    }
    
    console.log(`\n📖 Processing: ${file}`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`   Found ${data.length} rows`);
    console.log(`   Columns:`, Object.keys(data[0] || {}).slice(0, 10));
    
    let success = 0;
    let error = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Try to extract data from various possible column names
      const record = {
        organization_id: orgId,
        wp: row['WP'] || row['Work Package'] || row['wp'] || '',
        iso_ref: row['ISO Ref'] || row['ISO Reference'] || row['iso_ref'] || '',
        iso_control: row['ISO Control'] || row['iso_control'] || '',
        control_code: row['Control Code'] || row['Control ID'] || row['control_code'] || row['UCI Control #'] || '',
        control_name: row['Control Name'] || row['control_name'] || row['Control Title'] || '',
        outsurance_domain: row['OUTsurance Domain'] || row['Domain'] || row['outsurance_domain'] || '',
        outsurance_family: row['OUTsurance Family'] || row['Family'] || row['outsurance_family'] || '',
        uci_status: row['UCI Status'] || row['Status'] || row['uci_status'] || 'Req. Verify',
        checks: parseInt(row['Checks'] || row['checks'] || row['# Checks'] || 0),
        current_maturity: row['Curr. Maturity'] || row['Current Maturity'] || row['current_maturity'] || 'L0',
        target_maturity: row['Target Maturity'] || row['target_maturity'] || 'L3',
        risk_tier: row['Risk Tier'] || row['Tier'] || row['risk_tier'] || 'T2',
        verification_method: row['Verification Method'] || row['verification_method'] || '',
        evidence_type: row['Evidence Type'] || row['evidence_type'] || '',
        responsible: row['Responsible'] || row['responsible'] || '',
        accountable: row['Accountable'] || row['accountable'] || '',
        sprint: row['Sprint'] || row['sprint'] || '',
        target_date: row['Target Date'] || row['target_date'] || '',
        evidence_date: row['Evidence Date'] || row['evidence_date'] || '',
        outcome: row['Outcome'] || row['outcome'] || 'Pending',
        validation_notes: row['Validation Notes'] || row['Notes'] || row['validation_notes'] || ''
      };
      
      // Skip completely empty rows
      if (!record.control_code && !record.control_name) {
        continue;
      }
      
      try {
        const { error: insertError } = await supabase
          .from('uci_controls_full')
          .insert([record]);
        
        if (insertError) {
          error++;
          console.error(`   ❌ Row ${i + 1} error:`, insertError.message);
        } else {
          success++;
          if (success % 10 === 0) {
            process.stdout.write(`\r   📈 Progress: ${success} inserted, ${error} errors`);
          }
        }
      } catch (err) {
        error++;
        console.error(`   ❌ Row ${i + 1} exception:`, err.message);
      }
    }
    
    console.log(`\n   ✅ ${file}: ${success} inserted, ${error} errors`);
    totalSuccess += success;
    totalError += error;
  }
  
  return { totalSuccess, totalError };
}

// Create table function
async function createTableIfNotExists() {
  console.log('📋 Checking/Creating uci_controls_full table...');
  
  // First, check if table exists by trying to select from it
  try {
    const { error } = await supabase.from('uci_controls_full').select('count', { count: 'exact', head: true });
    if (!error) {
      console.log('✅ Table already exists');
      return;
    }
  } catch (err) {
    console.log('Table does not exist, creating...');
  }
  
  // Create table via SQL - you'll need to run this manually in Supabase
  console.log('\n⚠️ Please run this SQL in your Supabase SQL editor:\n');
  console.log(`CREATE TABLE IF NOT EXISTS uci_controls_full (
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

ALTER TABLE uci_controls_full ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view UCI controls" ON uci_controls_full
  FOR SELECT USING (true);

CREATE POLICY "Users can insert UCI controls" ON uci_controls_full
  FOR INSERT WITH CHECK (true);
`);
  
  console.log('\nAfter running the SQL, press Enter to continue...');
  await new Promise(resolve => process.stdin.once('data', resolve));
}

async function main() {
  console.log('🚀 Starting UCI Controls Import...\n');
  
  const orgId = await getOrganizationId();
  console.log(`📁 Organization ID: ${orgId}`);
  
  await createTableIfNotExists();
  
  const { totalSuccess, totalError } = await processAllFiles(orgId);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful inserts: ${totalSuccess}`);
  console.log(`❌ Errors: ${totalError}`);
  console.log('='.repeat(50));
  
  if (totalSuccess > 0) {
    console.log('\n✨ Import completed successfully!');
    console.log('\n🔍 Verify by running in Supabase SQL:');
    console.log('   SELECT COUNT(*) FROM uci_controls_full;');
  }
}

main().catch(console.error);
