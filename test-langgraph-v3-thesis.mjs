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

async function testLangGraphThesisAlignment() {
  console.log('Testing LangGraph v3 with thesis alignment...\n');
  
  // Find a scan request with investment thesis data
  const { data: scanRequests, error: scanError } = await supabase
    .from('scan_requests')
    .select('*')
    .not('investment_thesis_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (scanError || !scanRequests || scanRequests.length === 0) {
    console.error('No scan requests with thesis data found');
    return;
  }
  
  const scanRequest = scanRequests[0];
  console.log('Using scan request:');
  console.log(`- Company: ${scanRequest.company_name}`);
  console.log(`- Thesis Type: ${scanRequest.investment_thesis_data?.thesisType}`);
  console.log(`- ID: ${scanRequest.id}`);
  
  // Check if evidence exists
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('*')
    .eq('company_name', scanRequest.company_name)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (!collections || collections.length === 0) {
    console.log('\n⚠️  No evidence collection found for this company');
    console.log('The LangGraph worker requires evidence to be collected first');
    return;
  }
  
  const collection = collections[0];
  const { data: evidenceItems } = await supabase
    .from('evidence_items')
    .select('id')
    .eq('collection_id', collection.id);
    
  console.log(`\n✓ Found evidence collection with ${evidenceItems?.length || 0} items`);
  
  // Queue the job using standard job name (the worker will detect thesis alignment)
  console.log('\nQueueing LangGraph v3 report generation...');
  
  const job = await reportQueue.add('langgraph-report', {
    scanRequestId: scanRequest.id,
    company: scanRequest.company_name,
    domain: scanRequest.website_url?.replace(/^https?:\/\//, '') || scanRequest.company_name.toLowerCase() + '.com',
    investmentThesis: scanRequest.investment_thesis_data?.thesisType || 'general'
  });
  
  console.log(`✅ Job queued with ID: ${job.id}`);
  console.log('\nThe LangGraph v3 worker will:');
  console.log('- Detect the investment thesis data automatically');
  console.log('- Generate thesis-aligned sections with weighted scoring');
  console.log('- Create risk register and value creation roadmap');
  console.log('- Generate citations properly from evidence');
  
  // Monitor the job
  console.log('\nMonitoring job progress...');
  
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
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', result.reportId)
          .single();
          
        if (report) {
          console.log('\nGenerated Report Summary:');
          console.log(`- Report Type: ${report.report_type}`);
          console.log(`- Thesis Type: ${report.thesis_type || 'standard'}`);
          console.log(`- Total Score: ${report.weighted_scores?.totalScore || report.investment_score}`);
          console.log(`- Citations: ${report.citation_count}`);
          console.log(`- Evidence Count: ${report.evidence_count}`);
          console.log(`- Workflow: ${result.workflow}`);
          
          if (report.report_type === 'thesis-aligned') {
            console.log('\nThesis-Aligned Features:');
            console.log(`- Deep Dive Sections: ${report.deep_dive_sections?.length || 0}`);
            console.log(`- Risk Items: ${report.risk_register?.length || 0}`);
            console.log(`- Value Creation Initiatives: ${report.value_creation_roadmap?.length || 0}`);
            console.log(`- Decision: ${report.recommendation?.decision || 'N/A'}`);
          }
          
          console.log(`\nView the report at: http://localhost:5173/reports/${report.report_type}/${report.id}`);
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

testLangGraphThesisAlignment().catch(console.error);