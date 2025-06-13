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

async function testFullOrchestrator() {
  console.log('=== TESTING FULL ORCHESTRATOR ===\n');
  console.log('This uses ALL available tools:');
  console.log('- Gemini with Google grounding');
  console.log('- Crawl4AI for deep extraction');
  console.log('- Skyvern for AI browser automation');
  console.log('- Technical scanners (Playwright, WebTech, Security)');
  console.log('- Market intelligence searches');
  console.log('- Direct API/data fetching\n');

  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';

  console.log('Starting comprehensive evidence collection...');
  
  const job = await orchestratorQueue.add(
    'collect-comprehensive',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth'
    }
  );

  console.log(`✓ Job created: ${job.id}\n`);

  // Monitor for 3 minutes
  for (let i = 0; i < 36; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await job.getState();
    
    // Check latest collection
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('id, status, evidence_count, metadata')
      .eq('metadata->>scan_request_id', scanRequestId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const collection = collections?.[0];
    const evidenceCount = collection?.metadata?.evidence_raw?.length || 0;
    
    console.log(`[${i*5}s] Status: ${state}, Evidence: ${evidenceCount}`);
    
    if (state === 'completed') {
      console.log('\n✓ Collection completed!');
      
      if (collection) {
        const evidence = collection.metadata.evidence_raw || [];
        
        // Group by source
        const sources = {};
        evidence.forEach(e => {
          const source = e.source || 'unknown';
          sources[source] = (sources[source] || 0) + 1;
        });
        
        console.log('\nEvidence breakdown by source:');
        Object.entries(sources).forEach(([source, count]) => {
          console.log(`  ${source}: ${count}`);
        });
        
        // Show Gemini grounded results
        const geminiResults = evidence.filter(e => e.source === 'gemini_grounded');
        if (geminiResults.length > 0) {
          console.log('\nSample Gemini grounded results:');
          geminiResults.slice(0, 2).forEach(r => {
            console.log(`  Query: "${r.query}"`);
            console.log(`  Response: ${r.content?.substring(0, 200)}...\n`);
          });
        }
        
        // Show other evidence types
        const otherSources = ['crawl4ai', 'skyvern', 'direct_fetch', 'search_query'];
        otherSources.forEach(source => {
          const items = evidence.filter(e => e.source === source);
          if (items.length > 0) {
            console.log(`\n${source} evidence: ${items.length} items`);
          }
        });
      }
      
      break;
    } else if (state === 'failed') {
      console.error('\n✗ Collection failed:', await job.failedReason);
      break;
    }
  }

  await connection.quit();
  console.log('\n✅ Test complete!');
}

testFullOrchestrator().catch(console.error);