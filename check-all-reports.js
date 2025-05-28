import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkAllReports() {
  console.log('Checking all recent reports...\n');

  // Get all reports ordered by creation date
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching reports:', error);
    return;
  }

  console.log(`Found ${reports?.length || 0} reports:\n`);

  if (reports && reports.length > 0) {
    reports.forEach((report, index) => {
      console.log(`${index + 1}. Report: ${report.id}`);
      console.log(`   - Title: ${report.title}`);
      console.log(`   - Company: ${report.company_name}`);
      console.log(`   - Status: ${report.status}`);
      console.log(`   - Created: ${report.created_at}`);
      console.log(`   - Has structure: ${!!report.report_structure}`);
      
      // Check for Ring4
      if (report.company_name?.toLowerCase().includes('ring4') || 
          report.title?.toLowerCase().includes('ring4')) {
        console.log('   >>> THIS IS A RING4 REPORT <<<');
      }
      
      console.log('');
    });

    // Get the latest Ring4 report
    const ring4Report = reports.find(r => 
      r.company_name?.toLowerCase().includes('ring4') || 
      r.title?.toLowerCase().includes('ring4')
    );

    if (ring4Report) {
      console.log('\nLatest Ring4 Report Details:');
      console.log('ID:', ring4Report.id);
      console.log('Status:', ring4Report.status);
      
      // Check citations for this report
      const { data: citations } = await supabase
        .from('report_citations')
        .select('*')
        .eq('report_id', ring4Report.id);
        
      console.log('Citations count:', citations?.length || 0);
      
      // Check evidence
      const { data: evidence } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('report_id', ring4Report.id);
        
      console.log('Evidence items count:', evidence?.length || 0);
    }
  }
}

checkAllReports().catch(console.error); 