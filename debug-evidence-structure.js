import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEvidenceStructure() {
  // Get a recent scan request
  const { data: scanRequests } = await supabase
    .from('scan_requests')
    .select('id, company_name, status')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Recent scan requests:');
  scanRequests?.forEach(sr => {
    console.log(`- ${sr.company_name}: ${sr.status} (${sr.id})`);
  });
    
  if (!scanRequests || scanRequests.length === 0) {
    console.log('No scan requests found');
    return;
  }
  
  const scanRequest = scanRequests[0];
  console.log(`Checking evidence for ${scanRequest.company_name} (scan ${scanRequest.id})`);
  
  // Find evidence collection
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('id, evidence_count, metadata')
    .contains('metadata', { scan_request_id: scanRequest.id })
    .limit(1);
    
  if (!collections || collections.length === 0) {
    // Try by company name
    const { data: collectionsByName } = await supabase
      .from('evidence_collections')
      .select('id, evidence_count, metadata')
      .eq('company_name', scanRequest.company_name)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!collectionsByName || collectionsByName.length === 0) {
      console.log('No evidence collection found');
      return;
    }
    
    collections[0] = collectionsByName[0];
  }
  
  const collection = collections[0];
  console.log(`\nEvidence collection ${collection.id}:`);
  console.log(`- Evidence count: ${collection.evidence_count}`);
  console.log(`- Metadata:`, collection.metadata);
  
  // Get sample evidence items
  const { data: evidenceItems } = await supabase
    .from('evidence_items')
    .select('id, type, evidence_type, confidence_score, content_data, source_data')
    .eq('collection_id', collection.id)
    .limit(3);
    
  console.log(`\nSample evidence items (${evidenceItems?.length || 0} found):`);
  evidenceItems?.forEach((item, i) => {
    console.log(`\n${i + 1}. Evidence Item:`);
    console.log(`   ID: ${item.id}`);
    console.log(`   Type: ${item.type || item.evidence_type}`);
    console.log(`   Confidence: ${item.confidence_score}`);
    console.log(`   Has content_data: ${!!item.content_data}`);
    console.log(`   Content keys: ${item.content_data ? Object.keys(item.content_data) : 'N/A'}`);
    console.log(`   Source URL: ${item.source_data?.url || 'N/A'}`);
  });
}

debugEvidenceStructure().catch(console.error);