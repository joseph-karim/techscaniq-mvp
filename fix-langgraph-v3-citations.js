import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLangGraphV3Citations() {
  console.log('Fixing LangGraph v3 citations and sections...\n');

  // 1. Find reports with citation_count > 0 but no actual citations
  const { data: reportsWithIssues } = await supabase
    .from('reports')
    .select('id, company_name, citation_count, report_data, scan_request_id')
    .gt('citation_count', 0)
    .eq('report_version', 'langgraph-v3-thesis')
    .order('created_at', { ascending: false });

  console.log(`Found ${reportsWithIssues?.length || 0} LangGraph v3 reports with citations\n`);

  for (const report of reportsWithIssues || []) {
    console.log(`\nProcessing report ${report.id} for ${report.company_name}`);
    console.log(`- Citation count: ${report.citation_count}`);

    // Check if citations already exist
    const { data: existingCitations } = await supabase
      .from('report_citations')
      .select('count')
      .eq('report_id', report.id);

    const existingCount = existingCitations?.[0]?.count || 0;
    console.log(`- Existing citations in DB: ${existingCount}`);

    if (existingCount > 0) {
      console.log('  ✓ Citations already exist, skipping');
      continue;
    }

    // 2. Fix sections - copy from scan_request to report
    const { data: scanRequest } = await supabase
      .from('scan_requests')
      .select('sections')
      .eq('id', report.scan_request_id)
      .single();

    if (scanRequest?.sections && Object.keys(scanRequest.sections).length > 0) {
      console.log(`- Found ${Object.keys(scanRequest.sections).length} sections in scan_request`);
      
      // Update report with sections
      const updatedReportData = {
        ...report.report_data,
        sections: scanRequest.sections
      };

      const { error: updateError } = await supabase
        .from('reports')
        .update({ report_data: updatedReportData })
        .eq('id', report.id);

      if (updateError) {
        console.error('  ✗ Error updating sections:', updateError.message);
      } else {
        console.log('  ✓ Sections copied to report');
      }
    }

    // 3. Generate citations from evidence references in sections
    // This is a placeholder - in production, we'd need to parse the sections
    // and create proper citations from the evidence references
    console.log('- Note: Citations need to be regenerated from evidence references');
  }

  console.log('\n\nSummary:');
  console.log('- The main issues are:');
  console.log('  1. Sections are saved to scan_requests instead of reports');
  console.log('  2. Citations are not being saved due to missing required fields');
  console.log('  3. Executive memo is an object but being displayed as [object Object]');
  console.log('\n- To fix permanently, update the worker to:');
  console.log('  1. Save sections in report.report_data.sections');
  console.log('  2. Include all required citation fields');
  console.log('  3. Ensure executive_memo is properly saved as JSON');
}

fixLangGraphV3Citations().catch(console.error);