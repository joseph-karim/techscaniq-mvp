import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function regenerateCitations() {
  console.log('Regenerating citations for LangGraph v3 report...\n');

  // Get the report
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', '23b2d163-ed6e-4458-a440-a8675530c6ba')
    .single();

  if (!report) {
    console.log('Report not found');
    return;
  }

  console.log('Report:', report.company_name);
  console.log('Citation count:', report.citation_count);

  // Get scan request to check for sections
  const { data: scanRequest } = await supabase
    .from('scan_requests')
    .select('sections')
    .eq('id', report.scan_request_id)
    .single();

  // Update report with sections from scan request
  if (scanRequest?.sections && Object.keys(scanRequest.sections).length > 0) {
    const updatedReportData = {
      ...report.report_data,
      sections: scanRequest.sections
    };

    const { error: updateError } = await supabase
      .from('reports')
      .update({ report_data: updatedReportData })
      .eq('id', report.id);

    if (updateError) {
      console.error('Error updating report sections:', updateError);
    } else {
      console.log('✓ Updated report with', Object.keys(scanRequest.sections).length, 'sections');
    }
  }

  // Get evidence collection
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('*')
    .contains('metadata', { scan_request_id: report.scan_request_id })
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!collection) {
    console.log('No evidence collection found');
    return;
  }

  // Get evidence items
  const { data: evidenceItems } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('collection_id', collection.id)
    .order('confidence_score', { ascending: false })
    .limit(15); // Match the citation count

  console.log('\nFound', evidenceItems?.length || 0, 'evidence items');

  // Create citations
  if (evidenceItems && evidenceItems.length > 0) {
    const citations = evidenceItems.map((evidence, index) => ({
      report_id: report.id,
      claim_id: `claim_${evidence.id}_${index + 1}`,
      claim: evidence.content_data?.summary || evidence.title || 'Evidence reference',
      citation_text: evidence.content_data?.summary || evidence.title || '',
      citation_number: index + 1,
      evidence_item_id: evidence.id,
      confidence: Math.round((evidence.confidence_score || 0.8) * 100),
      confidence_score: evidence.confidence_score || 0.8,
      reasoning: `Based on ${evidence.evidence_type || evidence.type} evidence`,
      analyst: 'langgraph-v3-thesis',
      review_date: new Date().toISOString(),
      methodology: 'LangGraph thesis-aligned AI analysis',
      evidence_summary: {
        type: evidence.evidence_type || evidence.type,
        source: evidence.source_url || '',
        confidence: evidence.confidence_score || 0.8,
        content: evidence.content_data
      },
      created_at: new Date().toISOString()
    }));

    console.log('\nInserting', citations.length, 'citations...');
    
    const { error: citationError } = await supabase
      .from('report_citations')
      .insert(citations);

    if (citationError) {
      console.error('Error inserting citations:', citationError);
    } else {
      console.log('✓ Successfully inserted citations');
    }
  }

  // Verify
  const { data: citationCount } = await supabase
    .from('report_citations')
    .select('count')
    .eq('report_id', report.id);

  console.log('\nFinal citation count:', citationCount?.[0]?.count || 0);
}

regenerateCitations().catch(console.error);