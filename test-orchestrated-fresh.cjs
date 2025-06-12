#!/usr/bin/env node
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { Queue } = require('bullmq');

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

async function testOrchestratedFresh() {
  console.log('🚀 Testing Claude-Orchestrated Pipeline with Fresh Scan\n');
  
  // Create a fresh scan request
  const { data: scanRequest, error: scanError } = await supabase
    .from('scan_requests')
    .insert({
      company_name: 'Vercel',
      website_url: 'https://vercel.com',
      primary_criteria: 'digital-transformation',
      requestor_name: 'Test User',
      organization_name: 'Test PE Firm',
      status: 'pending',
      investment_thesis_data: {
        thesisType: 'digital-transformation',
        criteria: [
          {
            name: 'Technology Stack Modernity',
            description: 'Assessment of current technology architecture and cloud readiness',
            weight: 30
          },
          {
            name: 'Innovation Capacity',
            description: 'Ability to innovate and adopt new technologies',
            weight: 25
          },
          {
            name: 'Developer Experience',
            description: 'Quality of developer tools and platform',
            weight: 25
          },
          {
            name: 'Scalability Infrastructure',
            description: 'Infrastructure scalability and performance',
            weight: 20
          }
        ],
        timeHorizon: '3-5 years',
        targetMultiple: '3-5x'
      }
    })
    .select()
    .single();
    
  if (scanError) {
    console.error('❌ Failed to create scan request:', scanError);
    return;
  }
  
  console.log('📋 Created fresh scan request:');
  console.log(`- Company: ${scanRequest.company_name}`);
  console.log(`- Thesis: ${scanRequest.investment_thesis_data?.thesisType}`);
  console.log(`- ID: ${scanRequest.id}`);
  
  // Queue the orchestrated job
  console.log('\n🎯 Queueing Claude-Orchestrated report generation...');
  
  const job = await reportQueue.add('orchestrated-report', {
    scanRequestId: scanRequest.id,
    company: scanRequest.company_name,
    domain: scanRequest.website_url?.replace(/^https?:\/\//, ''),
    investmentThesis: scanRequest.investment_thesis_data?.thesisType
  });
  
  console.log(`✅ Job queued with ID: ${job.id}`);
  console.log('\n🤖 Claude will orchestrate the research process\n');
  
  // Monitor progress
  let lastProgress = 0;
  let lastLog = '';
  
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
      
      console.log('\n📈 Results:');
      console.log(`- Report ID: ${result.reportId}`);
      console.log(`- Research Iterations: ${result.researchIterations}`);
      console.log(`- Evidence Count: ${result.evidenceCount}`);
      console.log(`- Citations: ${result.citationCount}`);
      console.log(`- Investment Score: ${result.investmentScore}%`);
      
      // Clean up the test scan
      await supabase
        .from('scan_requests')
        .delete()
        .eq('id', scanRequest.id);
      
      clearInterval(checkInterval);
      process.exit(0);
    }
    
    if (state === 'failed') {
      console.log('\n❌ Report generation failed!');
      console.log('Error:', jobStatus.failedReason);
      
      // Clean up
      await supabase
        .from('scan_requests')
        .delete()
        .eq('id', scanRequest.id);
        
      clearInterval(checkInterval);
      process.exit(1);
    }
  }, 2000);
}

testOrchestratedFresh().catch(console.error);