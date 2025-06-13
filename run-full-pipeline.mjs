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
  console.log('=== RUNNING FULL PIPELINE: EVIDENCE COLLECTION → REPORT GENERATION ===\n');

  // Step 1: Create or find a scan request
  let scanRequest;
  
  // Check for existing Snowplow scan
  const { data: existingScans } = await supabase
    .from('scan_requests')
    .select('*')
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(1);

  if (existingScans && existingScans.length > 0) {
    scanRequest = existingScans[0];
    console.log(`✓ Using existing scan request: ${scanRequest.id}`);
  } else {
    // Create new scan request
    const { data: newScan, error } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Snowplow',
        website_url: 'https://snowplow.io',
        company_description: 'Customer data infrastructure for AI',
        status: 'pending',
        primary_criteria: 'accelerate-organic-growth',
        investment_thesis: 'accelerate-organic-growth',
        investment_thesis_data: {
          thesisType: 'accelerate-organic-growth',
          criteria: [
            { id: 'c1', name: 'Cloud Architecture Scalability', weight: 30, description: 'Auto-scaling capabilities for 10x growth' },
            { id: 'c2', name: 'Development Velocity & Pipeline', weight: 25, description: 'CI/CD maturity and deployment frequency' },
            { id: 'c3', name: 'Market Expansion Readiness', weight: 25, description: 'Geographic reach and customer acquisition' },
            { id: 'c4', name: 'Code Quality & Technical Debt', weight: 20, description: 'Modular architecture and maintainability' }
          ],
          focusAreas: ['cloud-native', 'scalable-architecture', 'devops-maturity', 'api-driven'],
          timeHorizon: '3-5 years',
          targetMultiple: '5-10x'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scan request:', error);
      return;
    }
    
    scanRequest = newScan;
    console.log(`✓ Created new scan request: ${scanRequest.id}`);
  }

  // Step 2: Clear any existing evidence for clean run
  console.log('\nClearing existing evidence...');
  await supabase
    .from('evidence_items')
    .delete()
    .eq('scan_request_id', scanRequest.id);

  // Step 3: Create evidence collection job (iterative-research worker)
  console.log('\nStep 1: Creating evidence collection job...');
  const evidenceJob = await evidenceCollectionQueue.add(
    'iterative-research',  // Use the LangGraph iterative research worker
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.investment_thesis,
      thesisData: scanRequest.investment_thesis_data,
      depth: 'comprehensive',
      iterations: 5,  // Multiple research iterations
      searchQueries: [
        'Snowplow analytics architecture scalability cloud',
        'Snowplow CI/CD deployment DevOps practices',
        'Snowplow market growth customers enterprise',
        'Snowplow API documentation technical architecture',
        'Snowplow funding revenue growth metrics'
      ]
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    }
  );

  console.log(`✓ Evidence collection job created: ${evidenceJob.id}`);
  console.log('  Job name: iterative-research');
  console.log('  Iterations: 5');
  console.log('  Search queries: 5 targeted queries');

  // Step 4: Wait for evidence collection to complete
  console.log('\nWaiting for evidence collection to complete...');
  let evidenceState = await evidenceJob.getState();
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes max wait

  while (evidenceState !== 'completed' && evidenceState !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
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

  // Check final evidence count
  const { data: evidenceItems, count } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact' })
    .eq('scan_request_id', scanRequest.id);

  console.log(`\nEvidence collected: ${count} items`);
  
  if (evidenceItems && evidenceItems.length > 0) {
    // Show evidence types
    const evidenceTypes = {};
    evidenceItems.forEach(item => {
      evidenceTypes[item.evidence_type] = (evidenceTypes[item.evidence_type] || 0) + 1;
    });
    
    console.log('\nEvidence breakdown:');
    Object.entries(evidenceTypes).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
  }

  // Step 5: Create report generation job (using langgraph-v3 for thesis-aligned)
  console.log('\nStep 2: Creating report generation job...');
  const reportJob = await reportGenerationQueue.add(
    'langgraph-report',  // Use langgraph v3 thesis-aligned worker
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.investment_thesis,
      thesisData: scanRequest.investment_thesis_data,
      evidenceJobId: evidenceJob.id,
      workflow: 'thesis-aligned',
      enableIterativeResearch: true,
      minEvidenceRequired: 50
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
  console.log('  Workflow: thesis-aligned (langgraph-v3)');
  console.log('  Min evidence required: 50');

  // Step 6: Monitor report generation
  console.log('\nWaiting for report generation to complete...');
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

  if (reportState === 'failed') {
    const failedReason = await reportJob.failedReason;
    console.error('\n✗ Report generation failed:', failedReason);
    return;
  }

  if (reportState !== 'completed') {
    console.error('\n✗ Report generation timed out');
    return;
  }

  console.log('\n✓ Report generation completed!');

  // Get the report
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
      console.log(`Investment Score: ${report.investment_score || 0}`);
      console.log(`Citations: ${report.citation_count || 0}`);
      console.log(`Evidence Used: ${report.evidence_count || 0}`);
      console.log(`Quality Score: ${report.quality_score || 0}`);
      
      if (report.report_data?.weightedScores) {
        console.log(`\nWeighted Score: ${report.report_data.weightedScores.totalScore}%`);
        console.log(`Pass/Fail: ${report.report_data.weightedScores.passed ? 'PASS' : 'FAIL'}`);
      }

      console.log(`\nView report at: http://localhost:5173/reports/${report.id}`);
    }
  }

  // Cleanup
  await connection.quit();
  console.log('\n✓ Pipeline completed successfully!');
}

// Run the pipeline
runFullPipeline().catch(console.error);