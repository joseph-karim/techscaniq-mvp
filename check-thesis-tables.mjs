#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkThesisTables() {
  console.log('Checking thesis-aligned tables...');
  
  const tablesToCheck = [
    'thesis_configurations',
    'scoring_results', 
    'risk_items',
    'value_creation_initiatives',
    'reports'
  ];
  
  for (const table of tablesToCheck) {
    const { error: tableError } = await supabase
      .from(table)
      .select('id')
      .limit(1);
      
    console.log(`- ${table}: ${tableError ? '✗ Not found' : '✓ Exists'}`);
    if (tableError && tableError.code !== '42P01') {
      console.log(`  Error: ${tableError.message}`);
    }
  }
  
  // Check if reports table has thesis columns
  console.log('\nChecking reports table columns...');
  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .select('id, thesis_type, weighted_scores')
    .limit(1);
    
  if (reportError && reportError.message.includes('column')) {
    console.log('- thesis columns: ✗ Not found');
    console.log(`  Need to add columns: thesis_type, weighted_scores, etc.`);
  } else {
    console.log('- thesis columns: ✓ Exist');
  }
  
  // Check scan_requests investment thesis data
  console.log('\nChecking scan_requests investment_thesis_data...');
  const { data: scanData, error: scanError } = await supabase
    .from('scan_requests')
    .select('id, investment_thesis_data')
    .limit(1);
    
  if (scanError && scanError.message.includes('column')) {
    console.log('- investment_thesis_data column: ✗ Not found');
  } else {
    console.log('- investment_thesis_data column: ✓ Exists');
    if (scanData && scanData[0]?.investment_thesis_data) {
      console.log('  Sample data:', JSON.stringify(scanData[0].investment_thesis_data, null, 2));
    }
  }
}

checkThesisTables().catch(console.error);