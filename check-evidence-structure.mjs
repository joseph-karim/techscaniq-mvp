#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvidenceStructure() {
  const scanId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  // Check if evidence_items table exists and what columns it has
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', '%evidence%');
    
  console.log('Evidence-related tables:', tables?.map(t => t.table_name));
  
  // Try different evidence table names
  const tableNames = ['evidence_items', 'evidence_chunks', 'evidence_collections'];
  
  for (const tableName of tableNames) {
    console.log(`\nChecking ${tableName}...`);
    
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('scan_request_id', scanId)
      .limit(1);
      
    if (!error) {
      console.log(`✓ ${tableName} exists`);
      console.log(`  Count for scan: ${count}`);
      if (data && data.length > 0) {
        console.log(`  Sample structure:`, Object.keys(data[0]));
      }
    } else {
      console.log(`✗ ${tableName}: ${error.message}`);
    }
  }
  
  // Check evidence_collections with evidence_chunks relationship
  console.log('\nChecking evidence through collections...');
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('scan_request_id', scanId);
    
  if (collections && collections.length > 0) {
    console.log(`Found ${collections.length} evidence collections`);
    
    // Check evidence_chunks
    const collectionIds = collections.map(c => c.id);
    const { data: chunks, count: chunkCount } = await supabase
      .from('evidence_chunks')
      .select('*', { count: 'exact' })
      .in('evidence_collection_id', collectionIds)
      .limit(5);
      
    console.log(`Found ${chunkCount} evidence chunks`);
    if (chunks && chunks.length > 0) {
      console.log('Sample chunk structure:', Object.keys(chunks[0]));
      console.log('Sample chunk data:', {
        chunk_type: chunks[0].chunk_type,
        source: chunks[0].source,
        confidence: chunks[0].confidence_score
      });
    }
  }
}

checkEvidenceStructure().catch(console.error);