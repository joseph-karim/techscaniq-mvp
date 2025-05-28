import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

const reportId = 'f9f4a4b8-e164-4499-83a0-dabedba6c3de';

async function checkReport() {
  console.log('Checking report:', reportId);
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

  if (!report) {
    console.log('❌ Report not found in database!');
    return;
  }

  console.log('✅ Report found!');
  console.log('Company:', report.company_name);
  console.log('Status:', report.status);
  console.log('Created:', report.created_at);
  console.log('');

  // 2. Check citations
  const { data: citations, error: citationError } = await supabase
    .from('report_citations')
    .select('*')
    .eq('report_id', reportId);

  if (citationError) {
    console.error('Error fetching citations:', citationError);
  } else {
    console.log(`✅ Citations found: ${citations?.length || 0}`);
    if (citations && citations.length > 0) {
      console.log('\nFirst few citations:');
      citations.slice(0, 3).forEach(c => {
        console.log(`- Section: ${c.section_type}, Claim: ${c.claim?.substring(0, 50)}...`);
      });
    }
  }

  // 3. Check evidence items
  const { data: evidence, error: evidenceError } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('company_name', 'Ring4')
    .order('created_at', { ascending: false })
    .limit(5);

  if (evidenceError) {
    console.error('Error fetching evidence:', evidenceError);
  } else {
    console.log(`\n✅ Evidence items found: ${evidence?.length || 0}`);
    if (evidence && evidence.length > 0) {
      console.log('\nEvidence types:');
      evidence.forEach(e => {
        console.log(`- ${e.type} (${e.evidence_id})`);
      });
    }
  }

  // 4. Check scan request
  if (report.scan_request_id) {
    const { data: scanRequest, error: scanError } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', report.scan_request_id)
      .single();

    if (scanError) {
      console.error('Error fetching scan request:', scanError);
    } else if (scanRequest) {
      console.log('\n✅ Linked scan request found:');
      console.log('Scan ID:', scanRequest.id);
      console.log('Domain:', scanRequest.domain);
    }
  }

  // 5. View the report in the frontend
  console.log('\n📋 View the report at:');
  console.log(`http://localhost:5173/reports/${reportId}`);
}

checkReport().catch(console.error); 