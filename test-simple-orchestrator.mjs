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

const orchestratorQueue = new Queue('evidence-orchestrator', { connection });

async function testSimpleOrchestrator() {
  console.log('=== QUICK ORCHESTRATOR TEST ===\n');

  const scanRequestId = 'test-' + Date.now();

  console.log('Queueing job...');
  
  const job = await orchestratorQueue.add(
    'iterative-orchestrated',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth'
    }
  );

  console.log(`✓ Job ${job.id} queued\n`);
  
  // Just wait 30 seconds to see progress
  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await job.getState();
    console.log(`[${i*5}s] Job state: ${state}`);
    
    if (state === 'completed' || state === 'failed') {
      console.log(`\nJob ${state}!`);
      
      if (state === 'failed') {
        console.error('Failed reason:', await job.failedReason);
      }
      
      // Check if collection was created
      const { data: collections } = await supabase
        .from('evidence_collections')
        .select('id, status, evidence_count, metadata')
        .eq('metadata->>scan_request_id', scanRequestId)
        .single();
      
      if (collections) {
        console.log(`\nCollection created: ${collections.id}`);
        console.log(`Evidence count: ${collections.evidence_count}`);
        console.log(`Status: ${collections.status}`);
      }
      
      break;
    }
  }

  await connection.quit();
  console.log('\n✅ Test complete!');
}

testSimpleOrchestrator().catch(console.error);