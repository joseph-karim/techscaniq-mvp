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

async function testOrchestratedPipeline() {
  console.log('🚀 Testing Claude-Orchestrated Report Generation Pipeline\n');
  
  // Find a scan request with thesis data
  const { data: scanRequests, error: scanError } = await supabase
    .from('scan_requests')
    .select('*')
    .not('investment_thesis_data', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (scanError || !scanRequests || scanRequests.length === 0) {
    console.error('❌ No scan requests with thesis data found');
    return;
  }
  
  const scanRequest = scanRequests[0];
  console.log('📋 Using scan request:');
  console.log(`- Company: ${scanRequest.company_name}`);
  console.log(`- Thesis: ${scanRequest.investment_thesis_data?.thesisType}`);
  console.log(`- ID: ${scanRequest.id}`);
  
  // Check for existing evidence
  const { data: collections } = await supabase
    .from('evidence_collections')
    .select('*')
    .contains('metadata', { scan_request_id: scanRequest.id })
    .limit(1);
    
  if (!collections || collections.length === 0) {
    console.log('\n⚠️  No evidence collection found');
    console.log('The orchestrated system will start fresh research');
  } else {
    const { data: evidenceItems } = await supabase
      .from('evidence_items')
      .select('id')
      .eq('collection_id', collections[0].id);
    console.log(`\n✓ Found evidence collection with ${evidenceItems?.length || 0} items`);
  }
  
  // Queue the orchestrated job
  console.log('\n🎯 Queueing Claude-Orchestrated report generation...');
  
  const job = await reportQueue.add('orchestrated-report', {
    scanRequestId: scanRequest.id,
    company: scanRequest.company_name,
    domain: scanRequest.website_url?.replace(/^https?:\/\//, '') || scanRequest.company_name.toLowerCase() + '.com',
    investmentThesis: scanRequest.investment_thesis_data?.thesisType || 'general'
  });
  
  console.log(`✅ Job queued with ID: ${job.id}`);
  console.log('\n🤖 Claude will now:');
  console.log('1. Analyze current evidence state');
  console.log('2. Plan research strategy based on thesis requirements');
  console.log('3. Execute targeted evidence collection');
  console.log('4. Analyze findings and identify gaps');
  console.log('5. Iterate until sufficient coverage achieved');
  console.log('6. Generate thesis-aligned report with citations');
  
  // Monitor progress
  console.log('\n📊 Monitoring progress...\n');
  
  let lastProgress = 0;
  let lastPhase = '';
  
  const checkInterval = setInterval(async () => {
    const jobStatus = await reportQueue.getJob(job.id);
    
    if (!jobStatus) {
      console.log('Job not found');
      clearInterval(checkInterval);
      return;
    }
    
    const progress = jobStatus.progress;
    const data = jobStatus.data;
    
    // Check for phase updates in job data
    if (jobStatus.returnvalue?.analysisTrace) {
      const trace = jobStatus.returnvalue.analysisTrace;
      const latestTrace = trace[trace.length - 1];
      if (latestTrace && latestTrace.phase !== lastPhase) {
        lastPhase = latestTrace.phase;
        console.log(`📍 Phase: ${lastPhase}`);
        if (latestTrace.plan) {
          console.log(`   Strategy: ${latestTrace.plan.reasoning || 'Analyzing...'}`);
        }
      }
    }
    
    if (progress > lastProgress) {
      const phases = {
        5: 'Initialized - Loading thesis configuration',
        10: 'Research planned - Claude has orchestrated strategy',
        20: 'Executing research tools',
        40: 'Collecting results from tools',
        60: 'Claude analyzing evidence',
        80: 'Generating thesis-aligned sections',
        95: 'Creating executive memo'
      };
      
      console.log(`Progress: ${progress}% - ${phases[progress] || 'Processing...'}`);
      lastProgress = progress;
    }
    
    const state = await jobStatus.getState();
    
    if (state === 'completed') {
      console.log('\n✅ Report generation completed!');
      const result = jobStatus.returnvalue;
      
      if (result) {
        console.log('\n📈 Results:');
        console.log(`- Report ID: ${result.reportId}`);
        console.log(`- Report Type: ${result.reportType}`);
        console.log(`- Investment Score: ${result.investmentScore?.toFixed(1)}%`);
        console.log(`- Citations Generated: ${result.citationCount}`);
        console.log(`- Evidence Analyzed: ${result.evidenceCount}`);
        console.log(`- Research Iterations: ${result.researchIterations}`);
        console.log(`- Workflow: ${result.workflow}`);
        
        // Fetch and display key report details
        if (result.reportId) {
          const { data: report } = await supabase
            .from('reports')
            .select('*')
            .eq('id', result.reportId)
            .single();
            
          if (report) {
            console.log('\n📄 Report Details:');
            console.log(`- Decision: ${report.recommendation?.decision || report.executive_memo?.decision}`);
            console.log(`- Thesis Alignment: ${report.thesis_type}`);
            
            if (report.weighted_scores) {
              console.log('\n📊 Weighted Scoring:');
              console.log(`- Total Score: ${report.weighted_scores.totalScore}%`);
              console.log(`- Pass/Fail: ${report.weighted_scores.passed ? 'PASS' : 'FAIL'}`);
              
              if (report.weighted_scores.breakdown) {
                console.log('- Breakdown:');
                report.weighted_scores.breakdown.forEach(b => {
                  console.log(`  • ${b.category}: ${b.rawScore}/100 (${b.weight}% weight)`);
                });
              }
            }
            
            if (report.metadata?.analysisTrace) {
              console.log('\n🔍 Research Trace:');
              report.metadata.analysisTrace.forEach(trace => {
                console.log(`- ${trace.phase}: ${trace.action || trace.timestamp}`);
              });
            }
            
            console.log(`\n🔗 View report: http://localhost:5173/reports/${report.report_type}/${report.id}`);
          }
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
  }, 2000); // Check every 2 seconds
}

testOrchestratedPipeline().catch(console.error);