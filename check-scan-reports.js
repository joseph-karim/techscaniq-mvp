import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

const reportId = 'f9f4a4b8-e164-4499-83a0-dabedba6c3de';

async function checkScanReports() {
  console.log('Checking scan_reports table...\n');

  // 1. Check if report exists in scan_reports
  const { data: scanReport, error: scanReportError } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (scanReportError && scanReportError.code !== 'PGRST116') {
    console.error('Error fetching scan report:', scanReportError);
    return;
  }

  if (scanReport) {
    console.log('✅ Report found in scan_reports table!');
    console.log('Report ID:', scanReport.id);
    console.log('Company:', scanReport.company_name);
    console.log('Status:', scanReport.status);
    console.log('Created:', new Date(scanReport.created_at).toLocaleString());
    console.log('Report Type:', scanReport.report_type);
  } else {
    console.log('❌ Report NOT found in scan_reports table');
  }

  // 2. Check all recent scan reports
  console.log('\n\nAll recent scan reports:');
  console.log('=' * 80);

  const { data: allReports, error: allError } = await supabase
    .from('scan_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (allError) {
    console.error('Error fetching all reports:', allError);
    return;
  }

  if (allReports && allReports.length > 0) {
    allReports.forEach((report, index) => {
      console.log(`\n${index + 1}. ${report.company_name || 'Unknown'}`);
      console.log(`   ID: ${report.id}`);
      console.log(`   Status: ${report.status}`);
      console.log(`   Type: ${report.report_type}`);
      console.log(`   Created: ${new Date(report.created_at).toLocaleString()}`);
    });
  } else {
    console.log('No reports found in scan_reports table');
  }

  // 3. Check citations for the report
  console.log('\n\nChecking citations:');
  console.log('=' * 80);

  const { data: citations, error: citationsError } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId);

  if (citationsError) {
    console.error('Error fetching citations:', citationsError);
  } else if (citations && citations.length > 0) {
    console.log(`✅ Found ${citations.length} citations for this report`);
    
    // Group by section
    const citationsBySection = {};
    citations.forEach(citation => {
      const section = citation.section_id || 'unknown';
      if (!citationsBySection[section]) {
        citationsBySection[section] = [];
      }
      citationsBySection[section].push(citation);
    });

    Object.entries(citationsBySection).forEach(([section, sectionCitations]) => {
      console.log(`\n  Section: ${section} (${sectionCitations.length} citations)`);
      sectionCitations.slice(0, 3).forEach(citation => {
        console.log(`    - Citation ${citation.citation_number}: Evidence ${citation.evidence_id}`);
      });
      if (sectionCitations.length > 3) {
        console.log(`    ... and ${sectionCitations.length - 3} more`);
      }
    });
  } else {
    console.log('❌ No citations found for this report');
  }

  // 4. Check evidence items
  console.log('\n\nChecking evidence items:');
  console.log('=' * 80);

  const { data: evidence, error: evidenceError } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('report_id', reportId)
    .limit(10);

  if (evidenceError) {
    console.error('Error fetching evidence:', evidenceError);
  } else if (evidence && evidence.length > 0) {
    console.log(`✅ Found ${evidence.length} evidence items`);
    evidence.slice(0, 5).forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title || 'Untitled'}`);
      console.log(`   Type: ${item.evidence_type}`);
      console.log(`   Source: ${item.source}`);
    });
  } else {
    console.log('❌ No evidence items found for this report');
  }
}

checkScanReports().catch(console.error); 