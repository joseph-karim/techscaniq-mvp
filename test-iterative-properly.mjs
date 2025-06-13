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

async function testIterativeResearch() {
  console.log('=== TESTING ITERATIVE RESEARCH WITH TECHNICAL TOOLS ===\n');

  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  // Clear existing evidence
  await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', scanRequestId);

  console.log('Starting iterative research with LangGraph orchestration...\n');
  
  // Queue the ITERATIVE research job (not deep-research)
  const job = await evidenceCollectionQueue.add(
    'iterative-research', // This is key - use the intelligent worker
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth',
      thesisData: {
        criteria: ['market_growth', 'product_market_fit', 'competitive_advantage']
      },
      maxIterations: 2 // Keep it short for testing
    }
  );

  console.log(`✓ Iterative research job created: ${job.id}`);
  console.log('This should orchestrate:');
  console.log('  - Question decomposition');
  console.log('  - Technical tool usage (Skyvern, Playwright, etc)');
  console.log('  - Reflection and gap analysis');
  console.log('  - Evidence storage\n');

  // Monitor for 3 minutes
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await job.getState();
    const { count } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('scan_request_id', scanRequestId);
    
    // Check technical analysis jobs
    const skyvernJobs = await evidenceCollectionQueue.getJobs(['active', 'completed', 'failed']);
    const technicalJobs = skyvernJobs.filter(j => 
      j.data.scanRequestId === scanRequestId && 
      ['discover', 'crawl', 'analyze', 'scan'].includes(j.name)
    );
    
    console.log(`[${i*5}s] Research: ${state}, Evidence: ${count || 0}, Technical jobs: ${technicalJobs.length}`);
    
    if (state === 'completed' || state === 'failed') {
      if (state === 'failed') {
        console.error('\nJob failed:', await job.failedReason);
      } else {
        console.log('\n✓ Research completed!');
        
        // Show what was collected
        const { data: evidence } = await supabase
          .from('evidence_items')
          .select('type, metadata, source_data')
          .eq('scan_request_id', scanRequestId)
          .limit(10);
          
        if (evidence && evidence.length > 0) {
          console.log('\nEvidence collected:');
          const types = {};
          evidence.forEach(e => {
            const source = e.source_data?.tool || e.metadata?.source_tool || 'unknown';
            types[source] = (types[source] || 0) + 1;
          });
          
          Object.entries(types).forEach(([source, count]) => {
            console.log(`  ${source}: ${count} items`);
          });
        }
      }
      break;
    }
  }

  await connection.quit();
  console.log('\n✅ Test complete!');
}

testIterativeResearch().catch(console.error);