import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

const reportId = 'dff23e3a-99d4-46bb-8f58-f17bc363fc30';

async function checkReportIssues() {
  console.log('Checking report issues for:', reportId);
  console.log('=' * 80);

  // 1. Check if report exists
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError) {
    console.error('Error fetching report:', reportError);
    return;
  }

  console.log('\n1. Report found:');
  console.log('- Title:', report.title);
  console.log('- Status:', report.status);
  console.log('- Created:', report.created_at);
  console.log('- Report Structure Keys:', Object.keys(report.report_structure || {}));

  // 2. Check citations
  const { data: citations, error: citationsError } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId);

  console.log('\n2. Citations:');
  if (citationsError) {
    console.error('Error fetching citations:', citationsError);
  } else {
    console.log(`- Total citations: ${citations?.length || 0}`);
    if (citations && citations.length > 0) {
      console.log('- Citation sections:', [...new Set(citations.map(c => c.section))]);
      console.log('- Sample citation:', citations[0]);
    }
  }

  // 3. Check evidence collections
  const { data: collections, error: collectionsError } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('report_id', reportId);

  console.log('\n3. Evidence Collections:');
  if (collectionsError) {
    console.error('Error fetching collections:', collectionsError);
  } else {
    console.log(`- Total collections: ${collections?.length || 0}`);
    if (collections && collections.length > 0) {
      console.log('- Collection statuses:', collections.map(c => `${c.id}: ${c.status}`));
    }
  }

  // 4. Check evidence items
  const { data: evidenceItems, error: evidenceError } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('report_id', reportId);

  console.log('\n4. Evidence Items:');
  if (evidenceError) {
    console.error('Error fetching evidence items:', evidenceError);
  } else {
    console.log(`- Total evidence items: ${evidenceItems?.length || 0}`);
    if (evidenceItems && evidenceItems.length > 0) {
      console.log('- Evidence types:', [...new Set(evidenceItems.map(e => e.evidence_type))]);
      console.log('- Sample evidence item:', evidenceItems[0]);
    }
  }

  // 5. Check if citations reference existing evidence
  if (citations && citations.length > 0 && evidenceItems && evidenceItems.length > 0) {
    console.log('\n5. Citation-Evidence Mapping:');
    const evidenceIds = new Set(evidenceItems.map(e => e.id));
    const citationEvidenceIds = new Set(citations.flatMap(c => c.evidence_ids || []));
    
    console.log('- Evidence IDs available:', evidenceIds.size);
    console.log('- Evidence IDs referenced in citations:', citationEvidenceIds.size);
    
    const missingIds = [...citationEvidenceIds].filter(id => !evidenceIds.has(id));
    if (missingIds.length > 0) {
      console.log('- Missing evidence IDs:', missingIds);
    }
  }

  // 6. Check report structure for citations
  console.log('\n6. Report Structure Analysis:');
  if (report.report_structure) {
    const sections = ['keyFindings', 'vulnerabilities', 'technicalArchitecture', 'businessModel'];
    for (const section of sections) {
      if (report.report_structure[section]) {
        console.log(`- ${section}:`, {
          hasData: !!report.report_structure[section],
          itemCount: Array.isArray(report.report_structure[section]) ? report.report_structure[section].length : 'N/A'
        });
      }
    }
  }

  // 7. Check logs for errors
  const { data: logs, error: logsError } = await supabase
    .from('logs')
    .select('*')
    .eq('report_id', reportId)
    .eq('level', 'error')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n7. Error Logs:');
  if (logsError) {
    console.error('Error fetching logs:', logsError);
  } else {
    console.log(`- Total error logs: ${logs?.length || 0}`);
    if (logs && logs.length > 0) {
      logs.forEach((log, i) => {
        console.log(`\nError ${i + 1}:`, {
          function: log.function_name,
          message: log.message,
          details: log.details,
          timestamp: log.created_at
        });
      });
    }
  }
}

checkReportIssues().catch(console.error); 