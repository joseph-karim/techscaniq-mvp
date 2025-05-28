import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRing4Reports() {
  console.log('Checking Ring4 reports...\n');
  
  // Check reports table
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('company_name', 'Ring4')
    .order('created_at', { ascending: false });

  if (reportsError) {
    console.error('Error fetching reports:', reportsError);
  } else {
    console.log(`Found ${reports.length} Ring4 reports:`);
    reports.forEach(report => {
      console.log(`\nID: ${report.id}`);
      console.log(`Created: ${report.created_at}`);
      console.log(`Investment Score: ${report.investment_score}`);
      console.log(`Tech Health Score: ${report.tech_health_score}`);
      console.log(`Evidence Collection ID: ${report.evidence_collection_id}`);
    });
  }
  
  // Check scan_reports table
  console.log('\n\nChecking scan_reports table...');
  const { data: scanReports, error: scanReportsError } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('company_name', 'Ring4')
    .order('created_at', { ascending: false });

  if (scanReportsError) {
    console.error('Error fetching scan reports:', scanReportsError);
  } else {
    console.log(`Found ${scanReports.length} Ring4 scan reports:`);
    scanReports.forEach(report => {
      console.log(`\nID: ${report.id}`);
      console.log(`Created: ${report.created_at}`);
      console.log(`Type: ${report.report_type}`);
      console.log(`Website: ${report.website_url}`);
    });
  }
  
  // Check report citations
  if (reports.length > 0) {
    console.log('\n\nChecking citations for latest report...');
    const latestReport = reports[0];
    
    const { data: citations, error: citationsError } = await supabase
      .from('report_citations')
      .select('*')
      .eq('report_id', latestReport.id)
      .limit(5);
      
    if (citationsError) {
      console.error('Error fetching citations:', citationsError);
    } else {
      console.log(`Found ${citations.length} citations for report ${latestReport.id}`);
      citations.forEach(citation => {
        console.log(`\nCitation: ${citation.citation_text}`);
        console.log(`Evidence ID: ${citation.evidence_item_id}`);
        console.log(`Confidence: ${citation.confidence_score}`);
      });
    }
  }
}

checkRing4Reports(); 