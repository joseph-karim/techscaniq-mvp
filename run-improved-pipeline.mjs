#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Bull from 'bull';
import Redis from 'ioredis';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 3,
});

// Create queue for report generation
const reportGenerationQueue = new Bull('report-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

async function runImprovedPipeline() {
  console.log('=== RUNNING IMPROVED PIPELINE ===\n');
  
  // Find a Snowplow scan with evidence
  const { data: scans } = await supabase
    .from('scan_requests')
    .select('*')
    .ilike('company_name', '%snowplow%')
    .eq('status', 'processing')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!scans || scans.length === 0) {
    console.log('No processing Snowplow scans found');
    return;
  }

  const scan = scans[0];
  console.log(`Using Snowplow scan: ${scan.id}`);
  console.log(`Company: ${scan.company_name}`);
  console.log(`Status: ${scan.status}\n`);

  // Check evidence
  const { data: evidence } = await supabase
    .from('evidence_items')
    .select('*')
    .eq('scan_request_id', scan.id);

  console.log(`Evidence items available: ${evidence?.length || 0}`);

  if (!evidence || evidence.length === 0) {
    console.log('No evidence found. Cannot generate report.');
    return;
  }

  // Group evidence by type
  const evidenceByType = evidence.reduce((acc, item) => {
    acc[item.evidence_type] = (acc[item.evidence_type] || 0) + 1;
    return acc;
  }, {});

  console.log('\nEvidence breakdown:');
  Object.entries(evidenceByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  // Add job to report generation queue with improved approach flag
  console.log('\n=== QUEUEING IMPROVED REPORT GENERATION ===');
  
  const job = await reportGenerationQueue.add('generate-report', {
    scanRequestId: scan.id,
    useImprovedApproach: true, // Flag to use the new staged approach
    reportConfig: {
      sections: [
        'technology_assessment',
        'market_position',
        'financial_metrics',
        'team_organizational',
        'risk_assessment',
        'executive_summary'
      ],
      citationMode: 'mandatory', // Every claim needs citation
      confidenceScoring: true,
      dataGapAcknowledgment: true
    }
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });

  console.log(`✓ Job queued with ID: ${job.id}`);
  console.log(`\nConfiguration:`);
  console.log(`- Use improved approach: YES`);
  console.log(`- Citation mode: mandatory`);
  console.log(`- Confidence scoring: enabled`);
  console.log(`- Data gap acknowledgment: enabled`);
  
  console.log('\n=== MONITORING JOB PROGRESS ===');
  
  // Monitor the job
  let completed = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!completed && attempts < maxAttempts) {
    attempts++;
    
    const jobStatus = await job.getState();
    const progress = await job.progress();
    
    console.log(`\n[${new Date().toLocaleTimeString()}] Status: ${jobStatus}`);
    if (progress) {
      console.log(`Progress: ${JSON.stringify(progress)}`);
    }
    
    if (jobStatus === 'completed') {
      completed = true;
      const result = await job.finished();
      console.log('\n✅ JOB COMPLETED SUCCESSFULLY');
      console.log(`Report ID: ${result.reportId}`);
      
      // Fetch and analyze the new report
      const { data: report } = await supabase
        .from('reports')
        .select('*')
        .eq('id', result.reportId)
        .single();
      
      if (report) {
        console.log('\n=== ANALYZING IMPROVED REPORT ===');
        analyzeReportQuality(report);
      }
      
    } else if (jobStatus === 'failed') {
      completed = true;
      console.log('\n❌ JOB FAILED');
      const failedReason = job.failedReason;
      console.log(`Reason: ${failedReason}`);
    }
    
    if (!completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }
  
  if (!completed) {
    console.log('\n⏱️  Job timed out after 2.5 minutes');
  }
  
  // Clean up
  await redis.quit();
}

function analyzeReportQuality(report) {
  const reportData = report.report_data;
  
  if (!reportData?.sections) {
    console.log('No sections found in report');
    return;
  }
  
  let totalSections = 0;
  let sectionsWithCitations = 0;
  let sectionsWithConfidence = 0;
  let sectionsWithDataGaps = 0;
  let genericSections = 0;
  
  Object.entries(reportData.sections).forEach(([key, section]) => {
    totalSections++;
    
    if (section.content) {
      // Check for citations [X]
      const citationPattern = /\[\d+\]/g;
      const citations = section.content.match(citationPattern);
      if (citations && citations.length > 0) {
        sectionsWithCitations++;
      }
      
      // Check for confidence scores
      if (section.metadata?.confidence || section.content.includes('Confidence:')) {
        sectionsWithConfidence++;
      }
      
      // Check for data gap acknowledgment
      if (section.content.includes('Data Gap') || section.content.includes('data gap')) {
        sectionsWithDataGaps++;
      }
      
      // Check for generic content
      const genericPatterns = ['I apologize', 'cannot provide', 'insufficient evidence'];
      if (genericPatterns.some(p => section.content.includes(p))) {
        genericSections++;
      }
    }
  });
  
  console.log('\nReport Quality Metrics:');
  console.log(`- Total sections: ${totalSections}`);
  console.log(`- Sections with citations: ${sectionsWithCitations} (${Math.round(sectionsWithCitations/totalSections*100)}%)`);
  console.log(`- Sections with confidence scores: ${sectionsWithConfidence}`);
  console.log(`- Sections acknowledging data gaps: ${sectionsWithDataGaps}`);
  console.log(`- Generic/apologetic sections: ${genericSections}`);
  
  if (genericSections === 0) {
    console.log('\n✅ SUCCESS: No generic/apologetic content detected!');
  } else {
    console.log(`\n⚠️  WARNING: ${genericSections} sections still contain generic content`);
  }
  
  // Show a sample of improved content
  const techSection = reportData.sections.technology_assessment || reportData.sections.technology;
  if (techSection?.content) {
    console.log('\nSample of Technology Section:');
    const lines = techSection.content.split('\n').slice(0, 10);
    lines.forEach(line => console.log(line));
    console.log('...');
  }
}

runImprovedPipeline().catch(console.error);