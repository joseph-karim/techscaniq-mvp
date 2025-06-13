#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simplified approach - just store everything as JSON
async function storeEvidenceSimple(scanRequestId, evidenceArray) {
  // Create a simple evidence collection record
  const { data: collection, error: collectionError } = await supabase
    .from('evidence_collections')
    .insert({
      company_name: 'Snowplow',
      company_website: 'https://snowplow.io',
      status: 'completed',
      collection_type: 'bulk_import',
      evidence_count: evidenceArray.length,
      metadata: {
        scan_request_id: scanRequestId,
        raw_evidence: evidenceArray, // Just dump everything here
        collected_at: new Date().toISOString()
      }
    })
    .select()
    .single();

  if (collectionError) {
    console.error('Collection error:', collectionError);
    return null;
  }

  console.log(`✓ Stored ${evidenceArray.length} evidence items in collection ${collection.id}`);
  return collection.id;
}

// Even simpler - use a general purpose table
async function storeInBlobTable(scanRequestId, data) {
  // If you have a general "data_blobs" or "raw_data" table
  const { data: blob, error } = await supabase
    .from('scan_data_blobs') // or create this table
    .insert({
      scan_request_id: scanRequestId,
      data_type: 'evidence_batch',
      data: data, // JSONB column - store anything
      metadata: {
        count: data.length,
        collected_at: new Date().toISOString(),
        source: 'deep_research'
      }
    })
    .select()
    .single();

  if (error) {
    console.error('Blob storage error:', error);
    return null;
  }

  return blob.id;
}

// Later, use AI to process and structure
async function processWithAI(collectionId) {
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('metadata')
    .eq('id', collectionId)
    .single();

  const rawEvidence = collection.metadata.raw_evidence;

  // Send to Gemini Flash or another LLM
  const prompt = `
    Analyze this evidence collection and extract:
    1. Key business metrics
    2. Technical capabilities
    3. Market position
    4. Investment signals
    
    Evidence: ${JSON.stringify(rawEvidence)}
    
    Return structured JSON with citations.
  `;

  // Process with LLM...
  console.log('Ready to process with AI');
}

// Example usage
const testData = [
  {
    url: 'https://snowplow.io',
    content: 'Snowplow is a behavioral data platform...',
    metadata: { crawled_at: new Date() }
  },
  {
    query: 'Snowplow funding',
    results: ['$40M raised', 'Series B', 'Investors: ...'],
    source: 'search'
  },
  {
    technical_scan: {
      technologies: ['React', 'AWS', 'Kafka'],
      apis: ['REST', 'GraphQL'],
      performance: { load_time: 1.2 }
    }
  }
];

// Just store it
storeEvidenceSimple('9f332d98-093e-4186-8e6d-c060728836b4', testData)
  .then(collectionId => {
    console.log('Collection stored:', collectionId);
    // Later, process with AI
    // processWithAI(collectionId);
  });