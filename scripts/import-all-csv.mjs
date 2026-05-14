import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const orgId = '11111111-1111-1111-1111-111111111111';

// Import directory
const importDir = '/Users/watz/Downloads/OneDrive_1_06-05-2026/export';

// Mapping configuration for each file type
const importConfigs = [
  // Module 1 - Charter
  {
    file: 'Seacom_CSI_Programme_Module1_Charter_v1.0_Maturity Assessment.csv',
    table: 'maturity_assessment',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'Charter',
      control_id: row['Control ID'] || row['Control'],
      current_maturity: row['Current Maturity'] || row['Maturity'],
      target_maturity: row['Target Maturity'],
      assessment_date: row['Date'] || new Date().toISOString().split('T')[0],
      notes: row['Notes']
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module1_Charter_v1.0_Programme Risk Reg..csv',
    table: 'programme_risk_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'Charter',
      risk_id: row['Risk ID'] || row['ID'],
      risk_description: row['Risk Description'] || row['Description'],
      likelihood: parseInt(row['Likelihood']) || 1,
      impact: parseInt(row['Impact']) || 1,
      risk_score: (parseInt(row['Likelihood']) || 1) * (parseInt(row['Impact']) || 1),
      mitigation: row['Mitigation'],
      owner: row['Owner'],
      status: row['Status'] || 'Open'
    })
  },
  // Module 2 - PAM
  {
    file: 'Seacom_CSI_Programme_Module2_P01_PAM_v1.0_Work Package Register.csv',
    table: 'work_package_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'PAM',
      wp_id: row['WP ID'] || row['ID'],
      wp_name: row['Work Package'] || row['Name'],
      status: row['Status'] || 'In Progress',
      owner: row['Owner'],
      progress_pct: parseInt(row['Progress (%)']) || 0
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module2_P01_PAM_v1.0_Risk Register.csv',
    table: 'programme_risk_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'PAM',
      risk_id: row['Risk ID'] || row['ID'],
      risk_description: row['Risk Description'] || row['Description'],
      likelihood: parseInt(row['Likelihood']) || 1,
      impact: parseInt(row['Impact']) || 1,
      risk_score: (parseInt(row['Likelihood']) || 1) * (parseInt(row['Impact']) || 1),
      mitigation: row['Mitigation'],
      owner: row['Owner'],
      status: row['Status'] || 'Open'
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module2_P01_PAM_v1.0_Maturity Assessment.csv',
    table: 'maturity_assessment',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'PAM',
      control_id: row['Control ID'] || row['Control'],
      current_maturity: row['Current Maturity'] || row['Maturity'],
      target_maturity: row['Target Maturity'],
      assessment_date: row['Date'] || new Date().toISOString().split('T')[0]
    })
  },
  // Module 3 - P02P03P04
  {
    file: 'Seacom_CSI_Programme_Module3_P02P03P04_v1.0_Work Package Register.csv',
    table: 'work_package_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'P02P03P04',
      wp_id: row['WP ID'] || row['ID'],
      wp_name: row['Work Package'] || row['Name'],
      status: row['Status'] || 'In Progress',
      owner: row['Owner'],
      progress_pct: parseInt(row['Progress (%)']) || 0
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module3_P02P03P04_v1.0_Risk Register.csv',
    table: 'programme_risk_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'P02P03P04',
      risk_id: row['Risk ID'] || row['ID'],
      risk_description: row['Risk Description'] || row['Description'],
      likelihood: parseInt(row['Likelihood']) || 1,
      impact: parseInt(row['Impact']) || 1,
      risk_score: (parseInt(row['Likelihood']) || 1) * (parseInt(row['Impact']) || 1),
      mitigation: row['Mitigation'],
      owner: row['Owner'],
      status: row['Status'] || 'Open'
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module3_P02P03P04_v1.0_Maturity Assessment.csv',
    table: 'maturity_assessment',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'P02P03P04',
      control_id: row['Control ID'] || row['Control'],
      current_maturity: row['Current Maturity'] || row['Maturity'],
      target_maturity: row['Target Maturity'],
      assessment_date: row['Date'] || new Date().toISOString().split('T')[0]
    })
  },
  // Module 4 - Neo
  {
    file: 'Seacom_CSI_Programme_Module4_P05_Neo_v1.0_Risk Register.csv',
    table: 'programme_risk_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'Neo',
      risk_id: row['Risk ID'] || row['ID'],
      risk_description: row['Risk Description'] || row['Description'],
      likelihood: parseInt(row['Likelihood']) || 1,
      impact: parseInt(row['Impact']) || 1,
      risk_score: (parseInt(row['Likelihood']) || 1) * (parseInt(row['Impact']) || 1),
      mitigation: row['Mitigation'],
      owner: row['Owner'],
      status: row['Status'] || 'Open'
    })
  },
  // Module 5 - UCI
  {
    file: 'Seacom_CSI_Programme_Module5_P06_UCI_v1.0_WP Register.csv',
    table: 'work_package_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'UCI',
      wp_id: row['WP ID'] || row['ID'],
      wp_name: row['Work Package'] || row['Name'],
      status: row['Status'] || 'In Progress',
      owner: row['Owner'],
      progress_pct: parseInt(row['Progress (%)']) || 0
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module5_P06_UCI_v1.0_Risk Register.csv',
    table: 'programme_risk_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'UCI',
      risk_id: row['Risk ID'] || row['ID'],
      risk_description: row['Risk Description'] || row['Description'],
      likelihood: parseInt(row['Likelihood']) || 1,
      impact: parseInt(row['Impact']) || 1,
      risk_score: (parseInt(row['Likelihood']) || 1) * (parseInt(row['Impact']) || 1),
      mitigation: row['Mitigation'],
      owner: row['Owner'],
      status: row['Status'] || 'Open'
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module5_P06_UCI_v1.0_Sprint Tracker.csv',
    table: 'sprint_tracker',
    processor: (row) => ({
      organization_id: orgId,
      sprint_name: row['Sprint Name'] || row['Sprint'],
      sprint_number: parseInt(row['Sprint #']) || 1,
      start_date: row['Start Date'],
      end_date: row['End Date'],
      planned_items: parseInt(row['Planned']) || 0,
      completed_items: parseInt(row['Completed']) || 0,
      blocked_items: parseInt(row['Blocked']) || 0,
      status: row['Status'] || 'Active'
    })
  },
  {
    file: 'Seacom_CSI_Programme_Module6_P07_OSG_v1.0_Risk Register.csv',
    table: 'programme_risk_register',
    processor: (row) => ({
      organization_id: orgId,
      module_name: 'OSG',
      risk_id: row['Risk ID'] || row['ID'],
      risk_description: row['Risk Description'] || row['Description'],
      likelihood: parseInt(row['Likelihood']) || 1,
      impact: parseInt(row['Impact']) || 1,
      risk_score: (parseInt(row['Likelihood']) || 1) * (parseInt(row['Impact']) || 1),
      mitigation: row['Mitigation'],
      owner: row['Owner'],
      status: row['Status'] || 'Open'
    })
  },
  // UCI Controls Validation Program
  {
    file: 'UCI_Controls_Validation_Program_v3.0_CSI Items.csv',
    table: 'csi_items_register',
    processor: (row) => ({
      organization_id: orgId,
      csi_id: row['CSI ID'] || row['ID'],
      title: row['Title'] || row['Item'],
      description: row['Description'],
      priority: row['Priority'] || 'Medium',
      status: row['Status'] || 'Open',
      owner: row['Owner'],
      target_date: row['Target Date']
    })
  },
  {
    file: 'UCI_Controls_Validation_Program_v3.0_Evidence Request Templates.csv',
    table: 'evidence_templates',
    processor: (row) => ({
      organization_id: orgId,
      control_id: row['Control ID'] || row['Control'],
      evidence_type: row['Evidence Type'],
      description: row['Description'],
      template_url: row['Template URL']
    })
  },
  {
    file: 'UCI_Controls_Validation_Program_v3.0_RASCI.csv',
    table: 'rasci_matrix',
    processor: (row) => ({
      organization_id: orgId,
      activity: row['Activity'] || row['Task'],
      responsible: row['R'],
      accountable: row['A'],
      consulted: row['C'],
      informed: row['I']
    })
  }
];

async function importCSV(filePath, config) {
  if (!fs.existsSync(filePath)) {
    console.log(`   ⚠️ File not found: ${path.basename(filePath)}`);
    return { success: 0, error: 0 };
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(fileContent, { columns: true, skip_empty_lines: true });
  
  if (rows.length === 0) {
    console.log(`   ⚠️ No data in: ${path.basename(filePath)}`);
    return { success: 0, error: 0 };
  }
  
  console.log(`   📊 Processing ${rows.length} rows...`);
  
  let success = 0;
  let error = 0;
  
  for (const row of rows) {
    try {
      const record = config.processor(row);
      // Skip empty records
      if (!record.control_id && !record.wp_id && !record.risk_id && !record.csi_id && 
          Object.values(record).every(v => !v || v === '')) {
        continue;
      }
      
      const { error: insertError } = await supabase
        .from(config.table)
        .insert([record]);
      
      if (insertError) {
        error++;
        if (error <= 3) {
          console.error(`      Error: ${insertError.message}`);
        }
      } else {
        success++;
      }
    } catch (err) {
      error++;
    }
  }
  
  console.log(`   ✅ ${success} inserted, ${error} errors`);
  return { success, error };
}

async function main() {
  console.log('🚀 Starting comprehensive CSV import...\n');
  console.log(`📁 Import directory: ${importDir}\n`);
  
  let totalSuccess = 0;
  let totalError = 0;
  let processedFiles = 0;
  
  for (const config of importConfigs) {
    const filePath = path.join(importDir, config.file);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n📄 ${config.file} → ${config.table}`);
      const result = await importCSV(filePath, config);
      totalSuccess += result.success;
      totalError += result.error;
      processedFiles++;
    } else {
      console.log(`\n⚠️ Missing: ${config.file}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`📁 Processed files: ${processedFiles}`);
  console.log(`✅ Total records inserted: ${totalSuccess}`);
  console.log(`❌ Total errors: ${totalError}`);
  console.log('='.repeat(50));
  
  // Verify counts
  console.log('\n🔍 Verifying database counts...');
  
  const tables = ['work_package_register', 'programme_risk_register', 'maturity_assessment', 
                  'sprint_tracker', 'csi_items_register', 'evidence_templates', 'rasci_matrix'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`   📊 ${table}: ${count} records`);
    }
  }
  
  console.log('\n✨ Import process complete!');
}

main().catch(console.error);
