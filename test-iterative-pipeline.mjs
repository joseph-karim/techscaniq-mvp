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

const evidenceQueue = new Queue('evidence-collection', { connection });

async function testIterativePipeline() {
  console.log('=== TESTING ITERATIVE RESEARCH PIPELINE ===\n');
  console.log('This uses the LangGraph iterative approach with:');
  console.log('- Question decomposition');
  console.log('- Iterative evidence gathering');
  console.log('- Knowledge gap analysis');
  console.log('- Reflection and synthesis');
  console.log('- All available tools (Gemini, Crawl4AI, Skyvern, etc.)\n');

  const scanRequestId = 'iter-' + Date.now();
  
  // Create initial scan request
  await supabase
    .from('scan_requests')
    .insert({
      id: scanRequestId,
      company_name: 'Snowplow',
      company_website: 'https://snowplow.io',
      investment_thesis: 'accelerate-organic-growth',
      primary_criteria: 'data-analytics',
      status: 'in_progress',
      priority: 'high',
      requested_by: 'test-script'
    });

  console.log('Starting iterative research...');
  
  const job = await evidenceQueue.add(
    'iterative-research',
    {
      scanRequestId,
      company: 'Snowplow',
      domain: 'snowplow.io',
      investmentThesis: 'accelerate-organic-growth',
      primaryCriteria: 'data-analytics'
    }
  );

  console.log(`✓ Job created: ${job.id}\n`);

  // Monitor for 5 minutes
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await job.getState();
    
    // Check latest collection
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('metadata->>scan_request_id', scanRequestId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    const collection = collections?.[0];
    const metadata = collection?.metadata || {};
    const evidenceCount = metadata.evidence_raw?.length || 0;
    const iterations = metadata.iterations || 0;
    const phase = metadata.current_phase || 'starting';
    
    console.log(`[${i*5}s] Status: ${state}, Phase: ${phase}, Iterations: ${iterations}, Evidence: ${evidenceCount}`);
    
    if (state === 'completed') {
      console.log('\n✓ Iterative research completed!');
      
      if (collection) {
        const evidence = metadata.evidence_raw || [];
        const trace = metadata.research_trace || [];
        
        // Show research questions
        const questions = metadata.research_questions || [];
        if (questions.length > 0) {
          console.log('\nResearch questions generated:');
          questions.slice(0, 5).forEach(q => {
            console.log(`  - [${q.category}] ${q.question} (${q.status})`);
          });
        }
        
        // Show evidence by source
        const sources = {};
        evidence.forEach(e => {
          const source = e.source || 'unknown';
          sources[source] = (sources[source] || 0) + 1;
        });
        
        console.log('\nEvidence collected by source:');
        Object.entries(sources).forEach(([source, count]) => {
          console.log(`  ${source}: ${count}`);
        });
        
        // Show iterations
        if (trace.length > 0) {
          console.log('\nResearch iterations:');
          trace.forEach((t, idx) => {
            console.log(`  Iteration ${idx + 1}: ${t.phase} - ${t.description || 'No description'}`);
          });
        }
        
        // Check for report
        const { data: reports } = await supabase
          .from('reports')
          .select('*')
          .eq('scan_request_id', scanRequestId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (reports?.[0]) {
          console.log('\n✓ Report generated!');
          console.log(`  Investment score: ${reports[0].investment_score}`);
        }
      }
      
      break;
    } else if (state === 'failed') {
      console.error('\n✗ Research failed:', await job.failedReason);
      break;
    }
  }

  await connection.quit();
  console.log('\n✅ Test complete!');
}

testIterativePipeline().catch(console.error);