#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

dotenv.config();

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const evidenceCollectionQueue = new Queue('evidence-collection', { connection });

async function testQuickEvidence() {
  console.log('=== QUICK EVIDENCE TEST ===\n');

  // Clear existing evidence
  await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', '9f332d98-093e-4186-8e6d-c060728836b4');

  // Create a quick evidence job
  const evidenceJob = await evidenceCollectionQueue.add(
    'deep-research',
    {
      scanRequestId: '9f332d98-093e-4186-8e6d-c060728836b4',
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth',
      depth: 'quick' // Quick test
    }
  );

  console.log(`Job created: ${evidenceJob.id}`);
  console.log('Waiting for evidence collection...\n');

  // Monitor for 2 minutes
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await evidenceJob.getState();
    const { count } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('scan_request_id', '9f332d98-093e-4186-8e6d-c060728836b4');
    
    console.log(`[${i*5}s] Status: ${state}, Evidence: ${count || 0}`);
    
    if (state === 'completed' || state === 'failed') {
      if (state === 'failed') {
        console.error('\nJob failed:', await evidenceJob.failedReason);
      } else {
        console.log('\n✓ Job completed successfully!');
      }
      break;
    }
  }

  // Show final evidence
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('evidence_id, type, metadata')
    .eq('scan_request_id', '9f332d98-093e-4186-8e6d-c060728836b4')
    .limit(5);

  if (evidence && evidence.length > 0) {
    console.log('\nStored evidence:');
    evidence.forEach((e, i) => {
      console.log(`  ${i+1}. [${e.type}] ${e.metadata?.title || 'No title'}`);
    });
  }

  await connection.quit();
}

testQuickEvidence().catch(console.error);