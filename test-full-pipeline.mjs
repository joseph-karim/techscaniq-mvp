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

async function runFullPipeline() {
  console.log('=== TESTING FULL PIPELINE WITH CITATIONS ===\n');

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
  await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', scanRequest.id);

  // Step 1: Deep Research
  console.log('\nStep 1: Running deep research collection...');
  const evidenceJob = await evidenceCollectionQueue.add(
    'deep-research',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.investment_thesis || 'accelerate-organic-growth',
      thesisData: scanRequest.investment_thesis_data,
      depth: 'comprehensive'
    },
    {
      attempts: 1,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    }
  );

  console.log(`✓ Evidence collection job created: ${evidenceJob.id}`);

  // Monitor job progress
  console.log('\nMonitoring evidence collection...');
  let evidenceState = await evidenceJob.getState();
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (evidenceState !== 'completed' && evidenceState !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    evidenceState = await evidenceJob.getState();
    attempts++;
    
    if (attempts % 6 === 0) { // Every 30 seconds
      console.log(`  Status: ${evidenceState} (${attempts * 5}s elapsed)`);
      
      // Check evidence count
      const { count } = await supabase
        .from('evidence_items')
        .select('*', { count: 'exact', head: true })
        .eq('scan_request_id', scanRequest.id);
      
      console.log(`  Evidence items collected: ${count || 0}`);
    }
  }

  if (evidenceState === 'failed') {
    const failedReason = await evidenceJob.failedReason;
    console.error('\n✗ Evidence collection failed:', failedReason);
    return;
  }

  if (evidenceState !== 'completed') {
    console.error('\n✗ Evidence collection timed out');
    return;
  }

  console.log('\n✓ Evidence collection completed!');

  // Get final evidence count
  const { data: evidenceItems, count } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact' })
    .eq('scan_request_id', scanRequest.id);

  console.log(`\n📊 Evidence Summary:`);
  console.log(`Total evidence collected: ${count} items`);
  
  if (evidenceItems && evidenceItems.length > 0) {
    // Show sample evidence
    console.log('\nSample evidence items:');
    evidenceItems.slice(0, 3).forEach(item => {
      console.log(`  - [${item.type}] ${item.metadata?.title || 'No title'}`);
    });
  }

  // Step 2: Generate Report with Citations
  console.log('\nStep 2: Generating report with citations...');
  const reportJob = await reportGenerationQueue.add(
    'langgraph-v3-thesis',
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
        
        // Check citations
        const { data: citations, count: citationCount } = await supabase
          .from('citations')
          .select('*', { count: 'exact' })
          .eq('report_id', report.id)
          .limit(5);
          
        console.log(`\nCitations in database: ${citationCount || 0}`);
        
        if (citations && citations.length > 0) {
          console.log('\nSample citations:');
          citations.forEach((c, i) => {
            console.log(`  ${i+1}. "${c.quote?.substring(0, 80)}..."`);
            console.log(`     Source: ${c.source_url || 'N/A'}`);
          });
        }
        
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
runFullPipeline().catch(console.error);