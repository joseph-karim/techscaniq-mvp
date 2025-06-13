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

// Use the new orchestrator queue
const orchestratorQueue = new Queue('evidence-orchestrator', { connection });
const reportQueue = new Queue('report-generation', { connection });

async function testCleanPipeline() {
  console.log('=== TESTING CLEAN PIPELINE ===\n');
  console.log('This uses:');
  console.log('- Flexible evidence storage (no schema bottlenecks)');
  console.log('- Intelligent orchestration with Claude');
  console.log('- Technical tool integration');
  console.log('- Citation generation\n');

  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';

  // Step 1: Orchestrated Evidence Collection
  console.log('Step 1: Starting intelligent evidence collection...');
  
  const evidenceJob = await orchestratorQueue.add(
    'collect-evidence',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth',
      workflow: 'intelligent' // Use intelligent orchestration
    }
  );

  console.log(`✓ Evidence job created: ${evidenceJob.id}`);

  // Monitor collection
  let collectionId;
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await evidenceJob.getState();
    
    // Check collection status
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('id, status, evidence_count, metadata')
      .eq('metadata->>scan_request_id', scanRequestId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const collection = collections?.[0];
    const evidenceCount = collection?.metadata?.evidence_raw?.length || 0;
    
    console.log(`[${i*5}s] Job: ${state}, Evidence collected: ${evidenceCount}`);
    
    if (state === 'completed') {
      collectionId = await evidenceJob.returnvalue?.collectionId;
      console.log(`\n✓ Evidence collection completed! Collection ID: ${collectionId}`);
      break;
    } else if (state === 'failed') {
      console.error('\n✗ Evidence collection failed:', await evidenceJob.failedReason);
      return;
    }
  }

  if (!collectionId) {
    console.error('\n✗ Evidence collection timed out');
    return;
  }

  // Check what was collected
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('metadata')
    .eq('id', collectionId)
    .single();

  const evidence = collection?.metadata?.evidence_raw || [];
  console.log(`\nCollected ${evidence.length} evidence items`);
  
  if (evidence.length > 0) {
    console.log('\nSample evidence:');
    evidence.slice(0, 3).forEach((e, i) => {
      console.log(`  ${i+1}. [${e.source || e.type}] ${e.question || e.url || 'No description'}`);
    });
  }

  // Step 2: Generate Report
  console.log('\nStep 2: Generating report with citations...');
  
  const reportJob = await reportQueue.add(
    'generate-report',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth',
      collectionId
    }
  );

  console.log(`✓ Report job created: ${reportJob.id}`);

  // Monitor report generation
  for (let i = 0; i < 24; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await reportJob.getState();
    
    if (state === 'completed') {
      const result = await reportJob.returnvalue;
      console.log('\n✓ Report generated!');
      console.log(`  Report ID: ${result.reportId}`);
      console.log(`  Investment Score: ${result.investmentScore}`);
      console.log(`  Citations: ${result.citationCount}`);
      console.log(`\n  View at: http://localhost:5173/reports/${result.reportId}`);
      break;
    } else if (state === 'failed') {
      console.error('\n✗ Report generation failed:', await reportJob.failedReason);
      return;
    }
  }

  await connection.quit();
  console.log('\n✅ Pipeline test complete!');
}

testCleanPipeline().catch(console.error);