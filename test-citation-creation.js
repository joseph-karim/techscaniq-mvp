import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCitationCreation() {
  // Get the latest evidence collection
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('id, company_name')
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (!collections || collections.length === 0) {
    console.log('No evidence collection found');
    return;
  }
  
  const collection = collections[0];
  console.log(`Using collection ${collection.id} for ${collection.company_name}`);
  
  // Get some evidence items
  const { data: evidenceItems } = await supabase
    .from('evidence_items')
    .select('id, type, content_data')
    .eq('collection_id', collection.id)
    .limit(3);
    
  if (!evidenceItems || evidenceItems.length === 0) {
    console.log('No evidence items found');
    return;
  }
  
  console.log(`Found ${evidenceItems.length} evidence items`);
  
  // Create a test report
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({
      company_name: 'Test Citation Company',
      investment_score: 75,
      tech_health_score: 80,
      tech_health_grade: 'B',
      report_data: {
        sections: {
          test: {
            title: 'Test Section',
            content: 'This is test content for citation injection.'
          }
        }
      },
      evidence_count: evidenceItems.length,
      citation_count: evidenceItems.length,
      report_version: 'test',
      ai_model_used: 'test'
    })
    .select()
    .single();
    
  if (reportError) {
    console.error('Error creating test report:', reportError);
    return;
  }
  
  console.log(`Created test report ${report.id}`);
  
  // Create test citations
  const citations = evidenceItems.map((item, index) => ({
    report_id: report.id,
    claim_id: `cite-test-${index + 1}`,
    evidence_item_id: item.id,
    section: 'test-section',
    citation_text: item.content_data?.summary || 'Test citation text',
    citation_number: index + 1,
    confidence_score: 0.8
  }));
  
  console.log('\nAttempting to insert citations:');
  citations.forEach((c, i) => {
    console.log(`${i + 1}. Evidence item: ${c.evidence_item_id}`);
  });
  
  const { error: citationError } = await supabase
    .from('report_citations')
    .insert(citations);
    
  if (citationError) {
    console.error('\nError inserting citations:', citationError);
  } else {
    console.log('\nSuccessfully inserted citations!');
    
    // Verify they were inserted
    const { data: insertedCitations, count } = await supabase
      .from('report_citations')
      .select('*', { count: 'exact' })
      .eq('report_id', report.id);
      
    console.log(`Verified: ${count} citations in database`);
  }
  
  // Clean up
  console.log('\nCleaning up test data...');
  await supabase.from('report_citations').delete().eq('report_id', report.id);
  await supabase.from('reports').delete().eq('id', report.id);
}

testCitationCreation().catch(console.error);