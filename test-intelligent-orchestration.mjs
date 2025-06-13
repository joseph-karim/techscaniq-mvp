#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { Anthropic } from '@anthropic-ai/sdk';

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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const evidenceCollectionQueue = new Queue('evidence-collection', { connection });
const reportGenerationQueue = new Queue('report-generation', { connection });

async function testIntelligentOrchestration() {
  console.log('=== TESTING INTELLIGENT ORCHESTRATION ===\n');

  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  const company = 'Snowplow';
  const domain = 'snowplow.io';
  const investmentThesis = 'accelerate-organic-growth';
  
  // Clear existing evidence
  await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', scanRequestId);

  console.log('Step 1: Initial Intelligence Gathering\n');
  
  // First, ask Claude what we should investigate
  const planningResponse = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are analyzing ${company} (${domain}) for investment with thesis: ${investmentThesis}.
      
      What are the TOP 5 most critical things we need to investigate to validate this investment thesis?
      Focus on:
      1. Market growth indicators
      2. Product-market fit evidence  
      3. Competitive advantages
      4. Technical capabilities
      5. Customer success metrics
      
      Return as JSON array of specific research questions.`
    }]
  });

  const researchQuestions = JSON.parse(planningResponse.content[0].text);
  console.log('Research Questions:', researchQuestions);

  // Step 2: Queue Iterative Research
  console.log('\nStep 2: Starting Iterative Research Process...\n');
  
  const iterativeJob = await evidenceCollectionQueue.add(
    'iterative-research',
    {
      scanRequestId,
      company,
      domain,
      investmentThesis,
      researchQuestions,
      maxIterations: 3,
      enableTechnicalAnalysis: true
    }
  );

  console.log(`✓ Iterative research job created: ${iterativeJob.id}`);

  // Monitor progress
  let completed = false;
  let iteration = 0;
  
  while (!completed && iteration < 60) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const state = await iterativeJob.getState();
    const { count } = await supabase
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('scan_request_id', scanRequestId);
    
    console.log(`[${iteration * 5}s] Status: ${state}, Evidence: ${count || 0}`);
    
    if (state === 'completed' || state === 'failed') {
      completed = true;
      if (state === 'failed') {
        console.error('Job failed:', await iterativeJob.failedReason);
      }
    }
    
    iteration++;
  }

  // Step 3: Reflection and Analysis
  console.log('\nStep 3: Analyzing Evidence with Intelligence...\n');
  
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('scan_request_id', scanRequestId)
    .limit(100);

  if (evidence && evidence.length > 0) {
    // Send evidence to Claude for analysis
    const analysisResponse = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this evidence for ${company} with investment thesis: ${investmentThesis}
        
        Evidence collected:
        ${JSON.stringify(evidence.slice(0, 10), null, 2)}
        
        Provide:
        1. Investment score (0-100)
        2. Key findings with specific citations
        3. Gaps in evidence that need further investigation
        4. Recommendation with reasoning
        
        Format as JSON with citations referencing evidence_id.`
      }]
    });

    const analysis = JSON.parse(analysisResponse.content[0].text);
    console.log('Analysis Results:', analysis);

    // Step 4: Generate Report with Citations
    console.log('\nStep 4: Generating Intelligent Report...\n');
    
    const reportJob = await reportGenerationQueue.add(
      'intelligent-report',
      {
        scanRequestId,
        company,
        domain,
        investmentThesis,
        analysis,
        evidenceIds: evidence.map(e => e.evidence_id),
        enableCitations: true,
        reportType: 'investment-memo'
      }
    );

    console.log(`✓ Report generation job created: ${reportJob.id}`);
    
    // Wait for report
    let reportComplete = false;
    iteration = 0;
    
    while (!reportComplete && iteration < 24) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const reportState = await reportJob.getState();
      
      if (reportState === 'completed' || reportState === 'failed') {
        reportComplete = true;
        
        if (reportState === 'completed') {
          const result = await reportJob.returnvalue;
          console.log('\n✓ Report generated!');
          console.log(`Report ID: ${result?.reportId}`);
          console.log(`View at: http://localhost:5173/reports/${result?.reportId}`);
        }
      }
      iteration++;
    }
  } else {
    console.log('No evidence collected - orchestration may have failed');
  }

  await connection.quit();
  console.log('\n✅ Orchestration test complete!');
}

testIntelligentOrchestration().catch(console.error);