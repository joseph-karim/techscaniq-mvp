import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReport(scanRequestId) {
  console.log(`\n=== Checking Report for Scan Request ID: ${scanRequestId} ===`);

  try {
    // 1. Fetch the scan request
    const { data: scanRequest, error: scanRequestError } = await supabase
      .from('scan_requests')
      .select('id, company_name, status, report_id, created_at')
      .eq('id', scanRequestId)
      .single();

    if (scanRequestError || !scanRequest) {
      console.error(`Error fetching scan request ${scanRequestId}:`, scanRequestError?.message || 'Scan request not found');
      return;
    }
    console.log('\nScan Request Data:', scanRequest);

    const reportIdFromScan = scanRequest.report_id;

    if (!reportIdFromScan) {
      console.log('No report_id found in scan_request. Report likely not generated or linked yet.');
    } else {
      console.log(`\nFound report_id in scan_request: ${reportIdFromScan}`);

      // 2. Fetch the report using the report_id from scan_request
      console.log(`\nFetching report from 'reports' table with ID: ${reportIdFromScan}...`);
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportIdFromScan)
        .single();

      if (reportError || !report) {
        console.error(`Error fetching report with ID ${reportIdFromScan} from 'reports' table:`, reportError?.message || 'Report not found');
      } else {
        console.log('\nReport Data from \'reports\' table:');
        console.log(`  Report ID: ${report.id}`);
        console.log(`  Company Name: ${report.company_name}`);
        console.log(`  Executive Summary: ${report.executive_summary ? report.executive_summary.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`  Investment Score: ${report.investment_score}`);
        console.log(`  Evidence Collection ID: ${report.evidence_collection_id}`);
        console.log(`  Created At: ${report.created_at}`);

        // 3. Fetch citations for this report
        console.log(`\nFetching citations for report ID ${reportIdFromScan} from 'report_citations' table...`);
        const { data: citations, error: citationsError } = await supabase
          .from('report_citations')
          .select('citation_number, claim_id, evidence_item_id, citation_text')
          .eq('report_id', reportIdFromScan)
          .order('citation_number');

        if (citationsError) {
          console.error('Error fetching citations:', citationsError);
        } else {
          console.log(`\nCitations Found (${citations.length}):`);
          citations.slice(0, 5).forEach(c => console.log(`  - Num: ${c.citation_number}, Claim ID: ${c.claim_id}, Evidence ID: ${c.evidence_item_id}, Text: "${c.citation_text ? c.citation_text.substring(0, 50) + '...' : 'N/A'}"`));
          if (citations.length > 5) {
            console.log(`  ... and ${citations.length - 5} more citations.`);
          }
        }
      }
    }

    // 4. General summary of all reports (as before)
    console.log('\n=== Overall Reports Summary ===');
    const { data: allReports, error: allReportsError } = await supabase
      .from('reports')
      .select('id, company_name, created_at', { count: 'exact' });

    if (allReportsError) {
      console.error('Error fetching all reports summary:', allReportsError);
    } else {
      console.log(`Total reports in database: ${allReports?.length || 0}`);
      if (allReports && allReports.length > 0) {
        console.log('Last few reports:');
        allReports.slice(-3).forEach(r => console.log(`  - ID: ${r.id}, Company: ${r.company_name}, Created: ${r.created_at}`));
      }
    }

  } catch (e) {
    console.error('An unexpected error occurred:', e);
  }
}

const scanRequestIdFromArg = process.argv[2];
if (!scanRequestIdFromArg) {
  console.error('Usage: node check-complete-report.js <scan_request_id>');
  process.exit(1);
}

checkReport(scanRequestIdFromArg); 