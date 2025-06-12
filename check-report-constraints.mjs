#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReportConstraints() {
  console.log('Checking reports table constraints...\n');
  
  // Try to insert a minimal report to see what's required
  const testData = {
    scan_request_id: '00000000-0000-0000-0000-000000000000',
    company_name: 'Test Company',
    website_url: 'https://test.com',
    report_type: 'thesis-aligned',
    report_data: {
      test: 'data'
    }
  };
  
  const { error } = await supabase
    .from('reports')
    .insert(testData);
    
  if (error) {
    console.log('Constraint error:', error.message);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
  }
  
  // Check what structure report_data expects
  console.log('\nChecking existing report_data structures...');
  const { data: reports } = await supabase
    .from('reports')
    .select('id, report_type, report_data')
    .limit(3);
    
  if (reports) {
    reports.forEach((report, idx) => {
      console.log(`\nReport ${idx + 1} (${report.report_type || 'unknown'}):`);
      if (report.report_data) {
        console.log('Keys:', Object.keys(report.report_data).join(', '));
      }
    });
  }
}

checkReportConstraints().catch(console.error);