import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkReport() {
  const reportId = '54d36b34-190c-4085-b3ea-84017a3538bf';
  
  // Check scan_reports table
  const { data: report, error } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('id', reportId)
    .single();
  
  if (error) {
    console.error('Error fetching report:', error);
  } else {
    console.log('Report found in scan_reports:');
    console.log('- ID:', report.id);
    console.log('- Company:', report.company_name);
    console.log('- Created:', report.created_at);
    
    // Check report_data field
    if (report.report_data) {
      console.log('\nReport data found:');
      console.log('- Investment Score:', report.report_data.investmentScore);
      console.log('- Has executive summary:', !!report.report_data.executiveSummary);
      console.log('- Has technology overview:', !!report.report_data.technologyOverview);
      console.log('- Number of risks:', report.report_data.risks?.length || 0);
      console.log('- Has sections:', !!report.report_data.sections);
      
      // Show a sample of the executive summary
      if (report.report_data.executiveSummary) {
        console.log('\nExecutive Summary preview:');
        console.log(report.report_data.executiveSummary.substring(0, 200) + '...');
      }
    } else {
      console.log('\nNO REPORT DATA FOUND - This is why you see fake data!');
    }
  }
  
  // Also check scan_requests
  const { data: scanRequest } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('report_id', reportId)
    .single();
    
  if (scanRequest) {
    console.log('\nLinked scan request:');
    console.log('- Scan ID:', scanRequest.id);
    console.log('- Status:', scanRequest.status);
  }
}

checkReport(); 