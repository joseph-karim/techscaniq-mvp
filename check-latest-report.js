import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

const reportId = 'e0952702-ab52-496d-94e1-c9f8599501aa';

async function checkLatestReport() {
  console.log('Checking latest report:', reportId);
  console.log('=' * 80);

  // 1. Check scan_reports table
  const { data: scanReport, error: scanReportError } = await supabase
    .from('scan_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (scanReportError && scanReportError.code !== 'PGRST116') {
    console.error('Error fetching from scan_reports:', scanReportError);
  }

  if (scanReport) {
    console.log('✅ Report found in scan_reports table!');
    console.log('Company:', scanReport.company_name);
    console.log('Status:', scanReport.status);
    console.log('Type:', scanReport.report_type);
  } else {
    console.log('❌ Report NOT found in scan_reports table');
  }

  // 2. Check reports table (legacy)
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError && reportError.code !== 'PGRST116') {
    console.error('Error fetching from reports:', reportError);
  }

  if (report) {
    console.log('\n✅ Report found in reports table!');
    console.log('Title:', report.title);
    console.log('Status:', report.status);
  } else {
    console.log('\n❌ Report NOT found in reports table');
  }

  // 3. Check citations
  console.log('\n\nChecking citations:');
  console.log('=' * 80);

  const { data: citations, error: citationsError } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId)
    .order('citation_number');

  if (citationsError) {
    console.error('Error fetching citations:', citationsError);
  } else if (citations && citations.length > 0) {
    console.log(`✅ Found ${citations.length} citations!`);
    
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
      console.log(`\nSection: ${section} (${sectionCitations.length} citations)`);
      sectionCitations.slice(0, 3).forEach(citation => {
        console.log(`  [${citation.citation_number}] Evidence: ${citation.evidence_id}`);
        console.log(`      Context: ${citation.context?.substring(0, 100)}...`);
      });
      if (sectionCitations.length > 3) {
        console.log(`  ... and ${sectionCitations.length - 3} more`);
      }
    });
  } else {
    console.log('❌ No citations found');
  }

  // 4. Check evidence collection
  console.log('\n\nChecking evidence collection:');
  console.log('=' * 80);

  // First find the collection ID from the report
  let collectionId = null;
  if (scanReport?.evidence_collection_id) {
    collectionId = scanReport.evidence_collection_id;
  }

  if (collectionId) {
    console.log('Collection ID:', collectionId);

    // Check evidence items
    const { data: evidenceItems, error: evidenceError } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collectionId)
      .limit(10);

    if (evidenceError) {
      console.error('Error fetching evidence:', evidenceError);
    } else if (evidenceItems && evidenceItems.length > 0) {
      console.log(`✅ Found ${evidenceItems.length} evidence items`);
      evidenceItems.slice(0, 5).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title || 'Untitled'}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Type: ${item.evidence_type}`);
        console.log(`   Source: ${item.source}`);
      });
    } else {
      console.log('❌ No evidence items found');
    }
  } else {
    console.log('❌ No evidence collection ID found in report');
  }

  // 5. Check if citations reference valid evidence
  console.log('\n\nValidating citation references:');
  console.log('=' * 80);

  if (citations && citations.length > 0 && evidenceItems) {
    const evidenceIds = new Set(evidenceItems.map(e => e.id));
    let validRefs = 0;
    let invalidRefs = 0;

    citations.forEach(citation => {
      if (citation.evidence_id) {
        if (evidenceIds.has(citation.evidence_id)) {
          validRefs++;
        } else {
          invalidRefs++;
          console.log(`❌ Citation ${citation.citation_number} references non-existent evidence: ${citation.evidence_id}`);
        }
      }
    });

    console.log(`\nValid references: ${validRefs}`);
    console.log(`Invalid references: ${invalidRefs}`);
  }
}

checkLatestReport().catch(console.error); 