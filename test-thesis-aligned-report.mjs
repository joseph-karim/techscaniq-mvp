#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create report generation queue
const reportGenerationQueue = new Queue('report-generation', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

async function testThesisAlignedReport() {
  console.log('=== TESTING THESIS-ALIGNED REPORT GENERATION ===\n');

  // Find a recent scan with investment thesis data
  const { data: scans, error } = await supabase
    .from('scan_requests')
    .select('*')
    .not('investment_thesis_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching scans:', error);
    return;
  }

  console.log(`Found ${scans?.length || 0} scans with investment thesis data\n`);

  if (!scans || scans.length === 0) {
    console.log('Creating a new test scan with thesis data...');
    
    // Create a test scan with investment thesis
    const { data: newScan, error: createError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Snowplow Analytics',
        website_url: 'https://snowplow.io',
        company_description: 'Real-time behavioral data platform for data teams',
        status: 'processing',
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

    if (createError) {
      console.error('Error creating test scan:', createError);
      return;
    }

    console.log(`✓ Created test scan: ${newScan.id}`);
    
    // Add some mock evidence
    const evidenceItems = [
      {
        scan_request_id: newScan.id,
        evidence_type: 'technical_analysis',
        content_data: { 
          text: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration',
          summary: 'Cloud-native architecture on AWS'
        },
        metadata: { source: 'architecture_docs' }
      },
      {
        scan_request_id: newScan.id,
        evidence_type: 'market_analysis',
        content_data: { 
          text: 'Customer base includes 500+ enterprises with 40% YoY growth',
          summary: 'Strong enterprise growth'
        },
        metadata: { source: 'investor_materials' }
      },
      {
        scan_request_id: newScan.id,
        evidence_type: 'technical_analysis',
        content_data: { 
          text: 'CI/CD pipeline with automated testing, deploys 50+ times per week',
          summary: 'Mature DevOps practices'
        },
        metadata: { source: 'engineering_blog' }
      }
    ];

    const { error: evidenceError } = await supabase
      .from('evidence_items')
      .insert(evidenceItems);

    if (evidenceError) {
      console.error('Error creating evidence:', evidenceError);
    } else {
      console.log(`✓ Added ${evidenceItems.length} evidence items`);
    }

    scans = [newScan];
  }

  // Use the first scan with thesis data
  const targetScan = scans[0];
  console.log(`\nUsing scan: ${targetScan.company_name} (${targetScan.id})`);
  console.log(`Thesis type: ${targetScan.investment_thesis_data?.thesisType || targetScan.investment_thesis}`);
  
  // Check evidence count
  const { count: evidenceCount } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact', head: true })
    .eq('scan_request_id', targetScan.id);

  console.log(`Evidence items: ${evidenceCount || 0}`);

  // Queue the thesis-aligned report generation
  console.log('\n=== QUEUEING THESIS-ALIGNED REPORT ===');
  
  const job = await reportGenerationQueue.add('generate-thesis-aligned-report', {
    scanRequestId: targetScan.id
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  console.log(`✓ Job queued with ID: ${job.id}`);
  console.log(`\nMonitoring job progress...`);

  // Monitor job progress
  let completed = false;
  let attempts = 0;
  const maxAttempts = 30; // 2.5 minutes max

  while (!completed && attempts < maxAttempts) {
    attempts++;
    
    const updatedJob = await reportGenerationQueue.getJob(job.id);
    const jobState = await updatedJob.getState();
    const progress = updatedJob.progress;
    
    process.stdout.write(`\r[${new Date().toLocaleTimeString()}] Status: ${jobState}`);
    if (progress) {
      process.stdout.write(` | Progress: ${progress}%`);
    }
    
    if (jobState === 'completed') {
      completed = true;
      const result = updatedJob.returnvalue;
      console.log('\n\n✅ REPORT GENERATED SUCCESSFULLY!');
      console.log(`Report ID: ${result.reportId}`);
      console.log(`\nView the report at:`);
      console.log(`http://localhost:5173/reports/thesis-aligned/${result.reportId}`);
      
      // Fetch and display summary
      const { data: report } = await supabase
        .from('reports')
        .select('weighted_scores, recommendation')
        .eq('id', result.reportId)
        .single();
      
      if (report) {
        console.log('\n=== REPORT SUMMARY ===');
        console.log(`Overall Score: ${report.weighted_scores.totalScore.toFixed(1)}%`);
        console.log(`Threshold: ${report.weighted_scores.threshold}%`);
        console.log(`Decision: ${report.recommendation.decision}`);
        console.log(`\nScore Breakdown:`);
        report.weighted_scores.breakdown.forEach(item => {
          console.log(`- ${item.category}: ${item.rawScore}/100 (${item.weight}% weight)`);
        });
      }
      
    } else if (jobState === 'failed') {
      completed = true;
      console.log('\n\n❌ JOB FAILED');
      const failedReason = updatedJob.failedReason;
      console.log(`Reason: ${failedReason}`);
    }
    
    if (!completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }

  if (!completed) {
    console.log('\n\n⏱️ Job timed out');
  }

  // Close the queue connection
  await reportGenerationQueue.close();
}

testThesisAlignedReport().catch(console.error);