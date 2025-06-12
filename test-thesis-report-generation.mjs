#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const reportQueue = new Queue('report-generation', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

async function testThesisAlignedReport() {
  console.log('Testing thesis-aligned report generation...\n');
  
  // First, let's find a scan request with investment thesis data
  const { data: scanRequests, error: scanError } = await supabase
    .from('scan_requests')
    .select('*')
    .not('investment_thesis_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (scanError) {
    console.error('Error fetching scan requests:', scanError);
    return;
  }
  
  console.log(`Found ${scanRequests?.length || 0} scan requests with investment thesis data`);
  
  let targetScan = null;
  
  if (!scanRequests || scanRequests.length === 0) {
    console.log('\nNo scan requests with investment thesis data found. Creating one...');
    
    // Create a new scan request with thesis data
    const { data: newScan, error: createError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Snowplow',
        website_url: 'https://snowplow.io',
        requestor_name: 'Test User',
        organization_name: 'Test PE Firm',
        status: 'processing',
        investment_thesis_data: {
          thesisType: 'accelerate-organic-growth',
          timeHorizon: '3-5 years',
          targetMultiple: '3x',
          focusAreas: ['scalable-architecture', 'cloud-native', 'api-driven'],
          criteria: [
            {
              name: 'Technical Scalability',
              weight: 30,
              description: 'Ability to handle 10x growth without major refactoring'
            },
            {
              name: 'Market Expansion Readiness',
              weight: 25,
              description: 'Architecture supports multi-region, multi-product expansion'
            },
            {
              name: 'Developer Experience',
              weight: 20,
              description: 'Strong APIs, SDKs, and developer documentation'
            },
            {
              name: 'Operational Excellence',
              weight: 15,
              description: 'CI/CD, monitoring, and DevOps maturity'
            },
            {
              name: 'Security & Compliance',
              weight: 10,
              description: 'Enterprise-grade security and compliance certifications'
            }
          ]
        }
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating scan request:', createError);
      return;
    }
    
    targetScan = newScan;
    console.log('✅ Created new scan request:', targetScan.id);
    
    // Create some evidence for this scan
    console.log('\nCreating evidence collection...');
    await createSnowplowEvidence();
    
  } else {
    targetScan = scanRequests[0];
    console.log('\nUsing existing scan request:');
    console.log(`- Company: ${targetScan.company_name}`);
    console.log(`- Thesis Type: ${targetScan.investment_thesis_data?.thesisType}`);
    console.log(`- ID: ${targetScan.id}`);
  }
  
  // Queue the thesis-aligned report generation
  console.log('\nQueueing thesis-aligned report generation...');
  
  const job = await reportQueue.add('generate-thesis-aligned-report', {
    scanRequestId: targetScan.id
  });
  
  console.log(`✅ Job queued with ID: ${job.id}`);
  console.log('\nMonitoring job progress...');
  
  // Monitor the job
  let lastProgress = 0;
  const checkInterval = setInterval(async () => {
    const jobStatus = await reportQueue.getJob(job.id);
    
    if (!jobStatus) {
      console.log('Job not found');
      clearInterval(checkInterval);
      return;
    }
    
    const progress = jobStatus.progress;
    if (progress > lastProgress) {
      console.log(`Progress: ${progress}%`);
      lastProgress = progress;
    }
    
    const state = await jobStatus.getState();
    
    if (state === 'completed') {
      console.log('\n✅ Report generation completed!');
      const result = jobStatus.returnvalue;
      console.log('Result:', result);
      
      // Fetch the generated report
      if (result?.reportId) {
        const { data: report, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', result.reportId)
          .single();
          
        if (report) {
          console.log('\nGenerated Report Summary:');
          console.log(`- Report Type: ${report.report_type}`);
          console.log(`- Thesis Type: ${report.thesis_type}`);
          console.log(`- Total Score: ${report.weighted_scores?.totalScore}`);
          console.log(`- Decision: ${report.recommendation?.decision}`);
          console.log(`- Report ID: ${report.id}`);
          console.log(`\nView the report at: http://localhost:5173/reports/thesis-aligned/${report.id}`);
        }
      }
      
      clearInterval(checkInterval);
      process.exit(0);
    }
    
    if (state === 'failed') {
      console.log('\n❌ Report generation failed!');
      console.log('Error:', jobStatus.failedReason);
      clearInterval(checkInterval);
      process.exit(1);
    }
  }, 1000);
}

async function createSnowplowEvidence() {
  // Create evidence collection
  const { data: collection, error: collectionError } = await supabase
    .from('evidence_collections')
    .insert({
      company_name: 'Snowplow',
      company_website: 'https://snowplow.io',
      evidence_count: 5,
      collection_status: 'complete'
    })
    .select()
    .single();
    
  if (collectionError) {
    console.error('Error creating collection:', collectionError);
    return;
  }
  
  // Create evidence items
  const evidenceItems = [
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'webpage_content',
      source_data: {
        url: 'https://snowplow.io/docs/architecture',
        title: 'Snowplow Architecture Overview',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration. The platform handles billions of events per day with horizontal scaling capabilities.',
        processed: 'Snowplow uses AWS infrastructure with auto-scaling groups and Kubernetes for container orchestration.',
        summary: 'Cloud-native architecture on AWS with Kubernetes'
      },
      metadata: {
        confidence: 85,
        relevance: 90,
        tokens: 28
      }
    },
    {
      collection_id: collection.id,
      evidence_id: crypto.randomUUID(),
      type: 'api_response',
      source_data: {
        url: 'https://snowplow.io/api/customers',
        api: 'customers_api',
        timestamp: new Date().toISOString()
      },
      content_data: {
        raw: 'Customer base includes 500+ enterprises with 40% YoY growth. Key clients include BBC, Strava, and The Economist.',
        processed: 'Customer base includes 500+ enterprises with 40% YoY growth.',
        summary: 'Strong enterprise growth with blue-chip clients'
      },
      metadata: {
        confidence: 90,
        relevance: 85,
        tokens: 32
      }
    }
  ];

  await supabase
    .from('evidence_items')
    .insert(evidenceItems);
    
  console.log('✅ Created evidence collection with items');
}

testThesisAlignedReport().catch(console.error);