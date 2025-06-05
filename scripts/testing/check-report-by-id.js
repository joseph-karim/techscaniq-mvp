import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReportById() {
  const reportId = 'b319954b-286a-4dd2-9bc4-f84e73078868';
  console.log(`Checking for report ID: ${reportId}\n`);
  
  // Check reports table
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError) {
    console.error('Error fetching from reports table:', reportError.message);
  } else if (report) {
    console.log('Found report in reports table:');
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Report not found in reports table');
  }
  
  // Check scan_reports table
  console.log('\nChecking scan_reports table...');
  const { data: scanReport, error: scanReportError } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (scanReportError) {
    console.error('Error fetching from scan_reports table:', scanReportError.message);
  } else if (scanReport) {
    console.log('Found report in scan_reports table:');
    console.log(JSON.stringify(scanReport, null, 2));
  } else {
    console.log('Report not found in scan_reports table');
  }
  
  // Check if there are ANY reports in the reports table
  console.log('\nChecking total reports count...');
  const { count, error: countError } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting reports:', countError);
  } else {
    console.log(`Total reports in database: ${count}`);
  }
}

checkReportById(); 