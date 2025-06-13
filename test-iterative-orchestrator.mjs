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

async function testIterativeOrchestrator() {
  console.log('=== TESTING ITERATIVE ORCHESTRATOR ===\n');
  console.log('This combines:');
  console.log('- LangGraph iterative research approach');
  console.log('- Comprehensive tool orchestration');
  console.log('- Reflection and gap analysis');
  console.log('- All available tools (Gemini, Crawl4AI, Skyvern, Deep Searcher, etc.)\n');

  const scanRequestId = 'iter-orch-' + Date.now();

  console.log('Starting iterative orchestrated research...');
  
  const job = await orchestratorQueue.add(
    'iterative-orchestrated',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth'
    }
  );

  console.log(`✓ Job created: ${job.id}\n`);

  // Monitor progress
  let lastPhase = '';
  for (let i = 0; i < 90; i++) {
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const state = await job.getState();
    const progress = await job.progress;
    
    // Check collection
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('metadata->>scan_request_id', scanRequestId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const collection = collections?.[0];
    const metadata = collection?.metadata || {};
    const phase = metadata.current_phase || 'starting';
    const iterations = metadata.iterations || 0;
    const confidence = metadata.confidence || 0;
    const evidenceCount = metadata.evidence_raw?.length || 0;
    const trace = metadata.trace || [];
    
    // Show phase changes
    if (phase !== lastPhase) {
      console.log(`\n[Phase Change] ${lastPhase} → ${phase}`);
      lastPhase = phase;
    }
    
    // Show iteration details
    const lastTrace = trace[trace.length - 1];
    if (lastTrace) {
      console.log(`[${i*4}s] Iteration ${lastTrace.iteration || 0} | Evidence: ${evidenceCount} | Confidence: ${confidence}% | Gaps: ${lastTrace.gaps || 0}`);
    } else {
      console.log(`[${i*4}s] State: ${state} | Phase: ${phase}`);
    }
    
    if (state === 'completed') {
      console.log('\n✓ Orchestration completed!');
      
      if (collection) {
        const evidence = metadata.evidence_raw || [];
        
        // Show research questions
        const questions = metadata.research_questions || [];
        if (questions.length > 0) {
          console.log(`\nGenerated ${questions.length} research questions`);
          console.log('Sample questions:');
          questions.slice(0, 3).forEach(q => console.log(`  - ${q}`));
        }
        
        // Show evidence breakdown
        const sources = {};
        evidence.forEach(e => {
          const source = e.source || 'unknown';
          sources[source] = (sources[source] || 0) + 1;
        });
        
        console.log('\nEvidence by source:');
        Object.entries(sources).forEach(([source, count]) => {
          console.log(`  ${source}: ${count}`);
        });
        
        // Show synthesis
        if (metadata.synthesis) {
          console.log('\nSynthesis:');
          console.log(`  Summary: ${metadata.synthesis.summary?.substring(0, 200)}...`);
          console.log(`  Strengths: ${metadata.synthesis.strengths?.length || 0}`);
          console.log(`  Concerns: ${metadata.synthesis.concerns?.length || 0}`);
        }
        
        // Show trace
        console.log('\nIteration trace:');
        trace.forEach(t => {
          console.log(`  Iteration ${t.iteration}: ${t.evidence} evidence, ${t.confidence}% confidence`);
        });
      }
      
      break;
    } else if (state === 'failed') {
      console.error('\n✗ Orchestration failed:', await job.failedReason);
      break;
    }
  }

  await connection.quit();
  console.log('\n✅ Test complete!');
}

testIterativeOrchestrator().catch(console.error);