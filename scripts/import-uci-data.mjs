import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

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
const excelDir = '/Users/watz/Downloads/OneDrive_1_06-05-2026';

async function getOrganizationId() {
  return '11111111-1111-1111-1111-111111111111';
}

// Parse UCI Controls - handles the multi-row header format
function parseUCIControlsFile(filePath) {
  console.log(`\n📖 Reading: ${path.basename(filePath)}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to array of arrays to see raw data
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`   Raw rows: ${rawData.length}`);
  
  // Find the header row (look for row with column names like "WP", "Control Code", etc.)
  let headerRowIndex = -1;
  let headers = [];
  
  for (let i = 0; i < Math.min(rawData.length, 20); i++) {
    const row = rawData[i];
    if (row && row.length > 0) {
      const rowStr = JSON.stringify(row).toLowerCase();
      if (rowStr.includes('wp') || rowStr.includes('control') || rowStr.includes('iso')) {
        headerRowIndex = i;
        headers = row;
        console.log(`   Found header at row ${i + 1}:`, headers.slice(0, 8));
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    console.log('   Could not find header row, using row 2 as fallback');
    headerRowIndex = 2;
    headers = rawData[2] || [];
  }
  
  // Extract data rows (after header)
  const dataRows = rawData.slice(headerRowIndex + 1);
  
  // Create mapping function
  const getValue = (row, possibleNames) => {
    for (const name of possibleNames) {
      const idx = headers.findIndex(h => h && h.toString().toLowerCase().includes(name.toLowerCase()));
      if (idx !== -1 && row[idx]) {
        return row[idx].toString().trim();
      }
    }
    return '';
  };
  
  const records = [];
  
  for (const row of dataRows) {
    if (!row || row.length === 0) continue;
    
    const controlCode = getValue(row, ['control code', 'control id', 'uci control', 'code']);
    const controlName = getValue(row, ['control name', 'control title', 'name', 'title']);
    
    // Skip empty rows
    if (!controlCode && !controlName) continue;
    if (controlCode === 'undefined' || controlName === 'undefined') continue;
    
    const record = {
      wp: getValue(row, ['wp', 'work package']),
      iso_ref: getValue(row, ['iso ref', 'iso reference', 'ref']),
      iso_control: getValue(row, ['iso control']),
      control_code: controlCode,
      control_name: controlName,
      outsurance_domain: getValue(row, ['outsurance domain', 'domain']),
      outsurance_family: getValue(row, ['outsurance family', 'family']),
      uci_status: getValue(row, ['uci status', 'status']) || 'Req. Verify',
      checks: parseInt(getValue(row, ['checks', '# checks'])) || 0,
      current_maturity: getValue(row, ['curr. maturity', 'current maturity']) || 'L0',
      target_maturity: getValue(row, ['target maturity']) || 'L3',
      risk_tier: getValue(row, ['risk tier', 'tier']) || 'T2',
      verification_method: getValue(row, ['verification method']),
      evidence_type: getValue(row, ['evidence type']),
      responsible: getValue(row, ['responsible']),
      accountable: getValue(row, ['accountable']),
      sprint: getValue(row, ['sprint']),
      target_date: getValue(row, ['target date']),
      evidence_date: getValue(row, ['evidence date']),
      outcome: getValue(row, ['outcome']) || 'Pending',
      validation_notes: getValue(row, ['validation notes', 'notes'])
    };
    
    if (record.control_code || record.control_name) {
      records.push(record);
    }
  }
  
  console.log(`   Extracted ${records.length} valid records`);
  if (records.length > 0) {
    console.log(`   Sample record:`, JSON.stringify(records[0], null, 2));
  }
  
  return records;
}

// Parse Module5 UCI file
function parseModule5File(filePath) {
  console.log(`\n📖 Reading: ${path.basename(filePath)}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log(`   Raw rows: ${rawData.length}`);
  
  // Look for data starting from row 3 or 4
  let startRow = 3;
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const row = rawData[i];
    if (row && row.length > 0 && (row[0] === 'WP' || row[0] === 'Control' || (row[0] && row[0].toString().includes('WP-')))) {
      startRow = i;
      break;
    }
  }
  
  const records = [];
  
  for (let i = startRow; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length < 3) continue;
    
    const controlCode = row[3] || row[2] || '';
    const controlName = row[4] || row[3] || '';
    
    if (!controlCode && !controlName) continue;
    if (typeof controlCode === 'object') continue;
    
    const record = {
      wp: row[0] || '',
      iso_ref: row[1] || '',
      iso_control: row[2] || '',
      control_code: controlCode.toString().trim(),
      control_name: controlName.toString().trim(),
      outsurance_domain: row[5] || '',
      outsurance_family: row[6] || '',
      uci_status: row[7] || 'Req. Verify',
      checks: parseInt(row[8]) || 0,
      current_maturity: row[9] || 'L0',
      target_maturity: row[10] || 'L3',
      risk_tier: row[11] || 'T2',
      verification_method: row[12] || '',
      evidence_type: row[13] || '',
      responsible: row[14] || '',
      accountable: row[15] || '',
      sprint: row[16] || '',
      target_date: row[17] || '',
      evidence_date: row[18] || '',
      outcome: row[19] || 'Pending',
      validation_notes: row[20] || ''
    };
    
    if (record.control_code) {
      records.push(record);
    }
  }
  
  console.log(`   Extracted ${records.length} valid records`);
  return records;
}

async function importRecords(records, tableName, description) {
  if (records.length === 0) {
    console.log(`   No records to import for ${description}`);
    return { success: 0, error: 0 };
  }
  
  const orgId = await getOrganizationId();
  let success = 0;
  let error = 0;
  
  for (let i = 0; i < records.length; i++) {
    const record = { ...records[i], organization_id: orgId };
    
    try {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([record]);
      
      if (insertError) {
        error++;
        if (error < 5) {
          console.error(`   ❌ Error on row ${i + 1}:`, insertError.message);
        }
      } else {
        success++;
        if (success % 10 === 0) {
          process.stdout.write(`\r   📈 Progress: ${success} inserted, ${error} errors`);
        }
      }
    } catch (err) {
      error++;
    }
  }
  
  console.log(`\n   ✅ ${description}: ${success} inserted, ${error} errors`);
  return { success, error };
}

async function main() {
  console.log('🚀 Starting UCI Controls Data Import...\n');
  
  // Process UCI Controls Validation Program
  const uciFile = path.join(excelDir, 'UCI_Controls_Validation_Program_v3.0.xlsx');
  const uciRecords = parseUCIControlsFile(uciFile);
  await importRecords(uciRecords, 'uci_controls_full', 'UCI Controls Validation Program');
  
  // Process Module 5 UCI
  const module5File = path.join(excelDir, 'Seacom_CSI_Programme_Module5_P06_UCI_v1.0.xlsx');
  if (fs.existsSync(module5File)) {
    const module5Records = parseModule5File(module5File);
    await importRecords(module5Records, 'uci_controls_full', 'Module 5 - P06 UCI');
  }
  
  // Verify import
  console.log('\n🔍 Verifying import...');
  const { count, error } = await supabase
    .from('uci_controls_full')
    .select('*', { count: 'exact', head: true });
  
  if (!error) {
    console.log(`📊 Total records in uci_controls_full: ${count}`);
  }
  
  console.log('\n✨ Import process complete!');
}

main().catch(console.error);
