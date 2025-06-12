#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReportsColumns() {
  console.log('Checking reports table structure...\n');
  
  // Try to get a sample report
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }
  
  if (reports && reports.length > 0) {
    console.log('Available columns in reports table:');
    Object.keys(reports[0]).forEach(col => {
      console.log(`- ${col}: ${typeof reports[0][col]}`);
    });
  } else {
    console.log('No reports found, trying empty insert to get schema...');
    
    // Try a minimal insert to see required fields
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        company_name: 'Test',
        website_url: 'https://test.com'
      });
      
    if (insertError) {
      console.log('Insert error reveals schema requirements:', insertError.message);
    }
  }
  
  // Try different column combinations
  console.log('\nTesting specific columns...');
  
  const columnsToTest = [
    ['id', 'company_name', 'website_url'],
    ['report_type'],
    ['report_data'],
    ['created_at', 'updated_at'],
    ['scan_request_id']
  ];
  
  for (const cols of columnsToTest) {
    const { error: testError } = await supabase
      .from('reports')
      .select(cols.join(', '))
      .limit(1);
      
    if (testError) {
      console.log(`✗ Columns [${cols.join(', ')}]: ${testError.message.includes('column') ? 'NOT FOUND' : 'ERROR'}`);
    } else {
      console.log(`✓ Columns [${cols.join(', ')}]: EXIST`);
    }
  }
}

checkReportsColumns().catch(console.error);