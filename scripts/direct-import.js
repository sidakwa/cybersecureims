const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set:');
  console.error('  export VITE_SUPABASE_URL="your-url"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-key"');
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

// Process UCI Controls file (the main one)
async function processUCIControls(orgId) {
  const filePath = path.join(excelDir, 'UCI_Controls_Validation_Program_v3.0.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('⚠️ UCI Controls file not found');
    return;
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
        wp: row['WP'] || row['wp'],
        iso_ref: row['ISO Ref'] || row['iso_ref'],
        iso_control: row['ISO Control'] || row['iso_control'],
        control_code: row['Control Code'] || row['control_code'],
        control_name: row['Control Name'] || row['control_name'],
        outsurance_domain: row['OUTsurance Domain'] || row['outsurance_domain'],
        outsurance_family: row['OUTsurance Family'] || row['outsurance_family'],
        uci_status: row['UCI Status'] || row['uci_status'],
        checks: parseInt(row['Checks'] || row['checks'] || 0),
        current_maturity: row['Curr. Maturity'] || row['current_maturity'],
        target_maturity: row['Target Maturity'] || row['target_maturity'],
        risk_tier: row['Risk Tier'] || row['risk_tier'],
        verification_method: row['Verification Method'] || row['verification_method'],
        evidence_type: row['Evidence Type'] || row['evidence_type'],
        responsible: row['Responsible'] || row['responsible'],
        accountable: row['Accountable'] || row['accountable'],
        sprint: row['Sprint'] || row['sprint'],
        target_date: row['Target Date'] || row['target_date'],
        evidence_date: row['Evidence Date'] || row['evidence_date'],
        outcome: row['Outcome'] || row['outcome'],
        validation_notes: row['Validation Notes'] || row['validation_notes']
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

// Process the Module files
async function processModuleFiles(orgId) {
  const moduleFiles = [
    'Seacom_CSI_Programme_Module1_Charter_v1.0.xlsx',
    'Seacom_CSI_Programme_Module2_P01_PAM_v1.0.xlsx',
    'Seacom_CSI_Programme_Module3_P02P03P04_v1.0.xlsx',
    'Seacom_CSI_Programme_Module4_P05_Neo_v1.0.xlsx',
    'Seacom_CSI_Programme_Module5_P06_UCI_v1.0.xlsx',
    'Seacom_CSI_Programme_Module6_P07_OSG_v1.0.xlsx'
  ];
  
  for (const moduleFile of moduleFiles) {
    const filePath = path.join(excelDir, moduleFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ${moduleFile} not found`);
      continue;
    }
    
    console.log(`\n📖 Reading ${moduleFile}...`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`📊 Found ${data.length} rows in ${sheetName}`);
    
    // Store module data in a generic table or log it
    console.log(`   Sample data:`, Object.keys(data[0] || {}).slice(0, 5));
  }
}

// Main function
async function main() {
  console.log('🚀 Starting direct import from Excel files...\n');
  
  const orgId = await getOrganizationId();
  if (!orgId) {
    console.error('❌ Could not find organization');
    return;
  }
  
  console.log(`📁 Organization ID: ${orgId}`);
  
  // Process the main UCI Controls file
  await processUCIControls(orgId);
  
  // Process module files
  await processModuleFiles(orgId);
  
  console.log('\n✨ Import process complete!');
}

// Run the import
main().catch(console.error);
