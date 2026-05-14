const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define import mappings
const imports = [
  {
    file: 'uci_controls.xlsx',
    sheet: 'UCI Controls',
    table: 'uci_controls_full',
    mapping: {
      'WP': 'wp',
      'ISO Ref': 'iso_ref',
      'ISO Control': 'iso_control',
      'Control Code': 'control_code',
      'Control Name': 'control_name',
      'OUTsurance Domain': 'outsurance_domain',
      'OUTsurance Family': 'outsurance_family',
      'UCI Status': 'uci_status',
      'Checks': 'checks',
      'Curr. Maturity': 'current_maturity',
      'Target Maturity': 'target_maturity',
      'Risk Tier': 'risk_tier',
      'Verification Method': 'verification_method',
      'Evidence Type': 'evidence_type',
      'Responsible': 'responsible',
      'Accountable': 'accountable',
      'Sprint': 'sprint',
      'Target Date': 'target_date',
      'Evidence Date': 'evidence_date',
      'Outcome': 'outcome',
      'Validation Notes': 'validation_notes'
    }
  },
  {
    file: 'framework_controls.xlsx',
    sheet: 'Controls',
    table: 'framework_controls',
    mapping: {
      'Framework': 'framework',
      'Control ID': 'control_id',
      'Domain': 'control_domain',
      'Title': 'control_title',
      'Description': 'control_description',
      'Type': 'control_type',
      'Status': 'status'
    }
  },
  {
    file: 'assets.xlsx',
    sheet: 'Assets',
    table: 'assets',
    mapping: {
      'Asset Name': 'asset_name',
      'Asset Type': 'asset_type',
      'Criticality': 'criticality',
      'Owner': 'owner',
      'Location': 'location',
      'Data Classification': 'data_classification'
    }
  },
  {
    file: 'vulnerabilities.xlsx',
    sheet: 'Vulnerabilities',
    table: 'vulnerabilities',
    mapping: {
      'Title': 'title',
      'Severity': 'severity',
      'CVSS Score': 'cvss_score',
      'CVE ID': 'cve_id',
      'Status': 'status',
      'Remediation Plan': 'remediation_plan'
    }
  },
  {
    file: 'vendors.xlsx',
    sheet: 'Vendors',
    table: 'third_party_vendors',
    mapping: {
      'Vendor Name': 'vendor_name',
      'Vendor Type': 'vendor_type',
      'Risk Rating': 'risk_rating',
      'ISO 27001 Certified': 'iso27001_certified',
      'SOC 2 Available': 'soc2_report_available',
      'Status': 'status'
    }
  }
];

async function importExcelFile(importConfig) {
  const filePath = path.join(__dirname, '../data', importConfig.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${importConfig.file} - skipping`);
    return { success: 0, error: 0, file: importConfig.file };
  }
  
  console.log(`📥 Importing ${importConfig.file}...`);
  
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[importConfig.sheet];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  let success = 0;
  let error = 0;
  
  for (const row of data) {
    try {
      const mappedRow = {};
      for (const [source, target] of Object.entries(importConfig.mapping)) {
        if (row[source] !== undefined) {
          mappedRow[target] = row[source];
        }
      }
      
      // Add organization_id (will be set by RLS trigger)
      const { error: insertError } = await supabase
        .from(importConfig.table)
        .insert([mappedRow]);
      
      if (insertError) throw insertError;
      success++;
    } catch (err) {
      error++;
      console.error(`Error importing row:`, err.message);
    }
  }
  
  console.log(`✅ Imported ${success} records, ${error} errors`);
  return { success, error, file: importConfig.file };
}

async function runAllImports() {
  console.log('🚀 Starting bulk import process...\n');
  
  const results = [];
  for (const importConfig of imports) {
    const result = await importExcelFile(importConfig);
    results.push(result);
  }
  
  console.log('\n📊 Import Summary:');
  console.log('=================');
  let totalSuccess = 0;
  let totalError = 0;
  
  for (const result of results) {
    console.log(`${result.file}: ${result.success} imported, ${result.error} errors`);
    totalSuccess += result.success;
    totalError += result.error;
  }
  
  console.log('=================');
  console.log(`Total: ${totalSuccess} records imported, ${totalError} errors`);
  
  if (totalError === 0) {
    console.log('\n🎉 All imports completed successfully!');
  } else {
    console.log(`\n⚠️  Completed with ${totalError} errors. Please check the logs.`);
  }
}

// Run the import
runAllImports().catch(console.error);
