import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test evidence insertion with correct schema
async function testEvidenceInsert() {
  const testEvidence = {
    scan_request_id: '9f332d98-093e-4186-8e6d-c060728836b4',
    evidence_id: randomUUID(),
    type: 'webpage_content',
    company_name: 'Snowplow',
    content_data: { 
      raw: 'Test content',
      summary: 'Pipeline test working!',
      processed: 'This is a test evidence item'
    },
    source_data: { 
      tool: 'test', 
      url: 'https://snowplow.io',
      timestamp: new Date().toISOString()
    },
    metadata: { 
      test: true, 
      confidence_score: 0.9,
      processing_stage: 'raw'
    }
  };

  const { data, error } = await supabase
    .from('evidence_items')
    .insert(testEvidence)
    .select();

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Test evidence inserted successfully!');
    console.log('Evidence ID:', data[0].evidence_id);
    
    // Count all evidence
    const { count } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact' })
      .eq('scan_request_id', '9f332d98-093e-4186-8e6d-c060728836b4');
      
    console.log('Total evidence items for this scan:', count);
  }
}

testEvidenceInsert().catch(console.error);