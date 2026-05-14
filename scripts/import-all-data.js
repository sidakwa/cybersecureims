const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Get these from: Supabase Dashboard → Project Settings → API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapping configurations for each file
const importConfigs = [
  {
    file: 'Seacom_CSI_Programme_Module1_Charter_v1.0.csv',
    table: 'csi_charter',
    description: 'CSI Programme Charter',
    mapping: (row) => ({
      programme_reference: row['Programme Reference'] || row['programme_reference'],
      programme_title: row['Programme Title'] || row['programme_title'],
      owner: row['Owner'] || row['owner'],
      scope: row['Scope'] || row['scope'],
      maturity_framework: row['Maturity Framework'] || row['maturity_framework'],
      programme_period: row['Programme Period'] || row['programme_period'],
      effort: row['Effort'] || row['effort'],
      risk_appetite: row['Risk Appetite'] || row['risk_appetite']
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module5_P06_UCI_v1.0.csv',
    table: 'uci_controls_full',
    description: 'UCI Controls (P06)',
    mapping: (row) => ({
      wp: row['WP'] || row['wp'],
      iso_ref: row['ISO Ref'] || row['iso_ref'] || row['ISO Reference'],
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
    })
  },
  {
    file: 'UCI_Controls_Validation_Program_v3.0.csv',
    table: 'uci_controls_validation',
    description: 'UCI Controls Validation Program v3.0',
    mapping: (row) => ({
      control_id: row['Control ID'] || row['control_id'],
      control_name: row['Control Name'] || row['control_name'],
      validation_status: row['Validation Status'] || row['validation_status'],
      evidence_link: row['Evidence Link'] || row['evidence_link'],
      validated_by: row['Validated By'] || row['validated_by'],
      validation_date: row['Validation Date'] || row['validation_date'],
      findings: row['Findings'] || row['findings'],
      remediation_plan: row['Remediation Plan'] || row['remediation_plan']
    })
  }
];

// Create tables if they don't exist
async function createTables() {
  console.log('📋 Creating tables if needed...');
  
  // Create UCI controls full table
  const createUCIControlsSQL = `
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
  
  const { error } = await supabase.rpc('exec_sql', { sql: createUCIControlsSQL });
  if (error) {
    // If RPC doesn't exist, try direct query
    console.log('Note: Tables may already exist or need manual creation');
  }
  
  console.log('✅ Tables ready');
}

// Import CSV file
async function importCSVFile(filePath, config) {
  return new Promise((resolve, reject) => {
    const results = [];
    let rowCount = 0;
    let successCount = 0;
    let errorCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        rowCount++;
        const mappedData = config.mapping(data);
        // Filter out empty rows
        if (mappedData.control_name || mappedData.control_code || mappedData.wp) {
          results.push(mappedData);
        }
      })
      .on('end', async () => {
        console.log(`   📊 Processing ${results.length} records...`);
        
        for (const record of results) {
          try {
            const { error } = await supabase
              .from(config.table)
              .insert([record]);
            
            if (error) {
              errorCount++;
              console.error(`   ❌ Error inserting: ${error.message}`);
            } else {
              successCount++;
            }
          } catch (err) {
            errorCount++;
            console.error(`   ❌ Exception: ${err.message}`);
          }
          
          // Show progress every 10 records
          if ((successCount + errorCount) % 10 === 0) {
            process.stdout.write(`\r   📈 Progress: ${successCount + errorCount}/${results.length} (${successCount} success, ${errorCount} errors)`);
          }
        }
        
        console.log(`\n   ✅ Import complete: ${successCount} inserted, ${errorCount} errors`);
        resolve({ success: successCount, error: errorCount, total: results.length });
      })
      .on('error', reject);
  });
}

// Main import function
async function importAllData() {
  console.log('🚀 Starting data import process...\n');
  
  await createTables();
  
  const dataDir = path.join(__dirname, '../data');
  const results = [];
  
  for (const config of importConfigs) {
    const filePath = path.join(dataDir, config.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${config.file} - skipping`);
      continue;
    }
    
    console.log(`\n📥 Importing ${config.description} from ${config.file}...`);
    const result = await importCSVFile(filePath, config);
    results.push({
      file: config.file,
      description: config.description,
      ...result
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  
  let totalSuccess = 0;
  let totalError = 0;
  
  for (const result of results) {
    console.log(`\n📁 ${result.description}:`);
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   ❌ Errors: ${result.error}`);
    console.log(`   📊 Total: ${result.total}`);
    totalSuccess += result.success;
    totalError += result.error;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 GRAND TOTAL: ${totalSuccess} records imported, ${totalError} errors`);
  
  if (totalError === 0) {
    console.log('\n✨ All data imported successfully!');
  } else {
    console.log(`\n⚠️  Completed with ${totalError} errors. Please review the logs.`);
  }
}

// Run the import
importAllData().catch(console.error);
