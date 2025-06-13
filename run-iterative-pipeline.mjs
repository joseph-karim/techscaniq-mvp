#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

dotenv.config();

// Initialize Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create queues
const evidenceCollectionQueue = new Queue('evidence-collection', { connection });
const reportGenerationQueue = new Queue('report-generation', { connection });

async function runIterativePipeline() {
  console.log('=== RUNNING ITERATIVE RESEARCH PIPELINE ===\n');

  // Get existing scan request
  const { data: scans } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!scans || scans.length === 0) {
    console.error('❌ No Snowplow scan request found');
    return;
  }

  const scanRequest = scans[0];
  console.log(`✓ Using scan request: ${scanRequest.id}`);
  console.log(`  Company: ${scanRequest.company_name}`);
  console.log(`  Website: ${scanRequest.website_url}`);

  // Clear existing evidence for clean test
  console.log('\nClearing existing evidence...');
  const { error: deleteError } = await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', scanRequest.id);
    
  if (deleteError) {
    console.error('Error clearing evidence:', deleteError);
  }

  // Create iterative research job
  console.log('\nStep 1: Creating iterative research job...');
  const evidenceJob = await evidenceCollectionQueue.add(
    'iterative-research',  // Correct job name for iterative worker
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.investment_thesis || 'accelerate-organic-growth',
      thesisData: scanRequest.investment_thesis_data,
      iterations: 3,  // Fewer iterations for testing
      searchQueries: [
        'Snowplow analytics architecture scalability',
        'Snowplow customer success stories',
        'Snowplow API technical documentation'
      ]
    },
    {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    }
  );

  console.log(`✓ Iterative research job created: ${evidenceJob.id}`);
  console.log('  Using LangGraph Chain of RAG approach');
  console.log('  Max iterations: 3');

  // Monitor job progress
  console.log('\nMonitoring research progress...');
  let evidenceState = await evidenceJob.getState();
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (evidenceState !== 'completed' && evidenceState !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    evidenceState = await evidenceJob.getState();
    attempts++;
    
    if (attempts % 6 === 0) { // Every 30 seconds
      console.log(`  Status: ${evidenceState} (${attempts * 5}s elapsed)`);
      
      // Check evidence count with correct schema
      const { count } = await supabase
        .from('evidence_items')
        .select('*', { count: 'exact', head: true })
        .eq('scan_request_id', scanRequest.id);
      
      console.log(`  Evidence items collected: ${count || 0}`);
      
      // Check for technical analysis evidence
      const { count: techCount } = await supabase
        .from('evidence_items')
        .select('*', { count: 'exact', head: true })
        .eq('scan_request_id', scanRequest.id)
        .in('source_data->tool', ['skyvern-discovery', 'playwright-crawler', 'webtech-analyzer']);
        
      if (techCount > 0) {
        console.log(`  Technical analysis evidence: ${techCount}`);
      }
    }
  }

  if (evidenceState === 'failed') {
    const failedReason = await evidenceJob.failedReason;
    console.error('\n✗ Iterative research failed:', failedReason);
    
    // Check logs for more details
    const jobData = await evidenceJob.data;
    console.log('Job data:', jobData);
    return;
  }

  if (evidenceState !== 'completed') {
    console.error('\n✗ Research timed out');
    return;
  }

  console.log('\n✓ Iterative research completed!');

  // Get final evidence count and breakdown
  const { data: evidenceItems, count } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact' })
    .eq('scan_request_id', scanRequest.id);

  console.log(`\n📊 Evidence Summary:`);
  console.log(`Total evidence collected: ${count} items`);
  
  if (evidenceItems && evidenceItems.length > 0) {
    // Group by source
    const sourceBreakdown = {};
    evidenceItems.forEach(item => {
      const source = item.source_data?.tool || 'unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });
    
    console.log('\nEvidence by source:');
    Object.entries(sourceBreakdown).forEach(([source, cnt]) => {
      console.log(`  ${source}: ${cnt}`);
    });
    
    // Group by type
    const typeBreakdown = {};
    evidenceItems.forEach(item => {
      typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1;
    });
    
    console.log('\nEvidence by type:');
    Object.entries(typeBreakdown).forEach(([type, cnt]) => {
      console.log(`  ${type}: ${cnt}`);
    });
    
    // Show sample evidence
    console.log('\nSample evidence items:');
    evidenceItems.slice(0, 3).forEach(item => {
      console.log(`  - [${item.type}] ${item.content_data?.summary || 'No summary'}`);
    });
  }

  // Generate report
  console.log('\nStep 2: Creating report generation job...');
  const reportJob = await reportGenerationQueue.add(
    'langgraph-report',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.investment_thesis,
      thesisData: scanRequest.investment_thesis_data,
      evidenceJobId: evidenceJob.id,
      workflow: 'thesis-aligned',
      enableCitations: true
    },
    {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000,
      }
    }
  );

  console.log(`✓ Report generation job created: ${reportJob.id}`);

  // Monitor report generation
  console.log('\nWaiting for report generation...');
  let reportState = await reportJob.getState();
  attempts = 0;

  while (reportState !== 'completed' && reportState !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    reportState = await reportJob.getState();
    attempts++;
    
    if (attempts % 6 === 0) {
      console.log(`  Status: ${reportState} (${attempts * 5}s elapsed)`);
    }
  }

  if (reportState === 'completed') {
    console.log('\n✓ Report generation completed!');
    
    const jobResult = await reportJob.returnvalue;
    if (jobResult && jobResult.reportId) {
      const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('id', jobResult.reportId)
        .single();

      if (report) {
        console.log('\n=== REPORT SUMMARY ===');
        console.log(`Report ID: ${report.id}`);
        console.log(`Investment Score: ${report.investment_score || 'N/A'}`);
        console.log(`Citations: ${report.citation_count || 0}`);
        console.log(`Evidence Used: ${report.evidence_count || 0}`);
        console.log(`\nView report at: http://localhost:5173/reports/${report.id}`);
      }
    }
  } else {
    console.error('\n✗ Report generation failed or timed out');
  }

  // Cleanup
  await connection.quit();
  console.log('\n✅ Pipeline test complete!');
}

// Run the pipeline
runIterativePipeline().catch(console.error);