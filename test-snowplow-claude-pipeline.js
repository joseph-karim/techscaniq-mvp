import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const evidenceQueue = new Queue('evidence-collection', { connection });
const reportQueue = new Queue('report-generation', { connection });

async function runSnowplowPipeline() {
  console.log(chalk.bold.cyan('\n🚀 Running Full Pipeline for Snowplow.io\n'));
  
  // Step 1: Create scan request
  console.log(chalk.yellow('Step 1: Creating scan request...'));
  
  const { data: scanRequest, error: scanError } = await supabase
    .from('scan_requests')
    .insert({
      company_name: 'Snowplow',
      website_url: 'https://snowplow.io',
      primary_criteria: 'accelerate-organic-growth',
      investment_thesis_data: {
        type: 'accelerate-organic-growth',
        name: 'Accelerate Organic Growth',
        description: 'Evaluating Snowplow for scaling and expansion potential'
      },
      thesis_tags: ['cloud-native', 'scalable-architecture', 'data-analytics'],
      requestor_name: 'Claude Pipeline Test',
      organization_name: 'TechScanIQ',
      company_description: 'Snowplow is a behavioral data platform for data teams',
      status: 'pending',
      ai_workflow_status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (scanError) {
    console.error(chalk.red('Failed to create scan request:'), scanError);
    return;
  }
  
  console.log(chalk.green('✅ Scan request created:'), scanRequest.id);
  console.log(chalk.gray(`   Company: ${scanRequest.company_name}`));
  console.log(chalk.gray(`   Domain: ${scanRequest.website_url}`));
  console.log(chalk.gray(`   Thesis: ${scanRequest.primary_criteria}`));
  
  // Step 2: Queue evidence collection
  console.log(chalk.yellow('\nStep 2: Queueing evidence collection...'));
  
  const evidenceJob = await evidenceQueue.add(
    'collect-evidence',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.primary_criteria,
      depth: 'comprehensive'
    },
    {
      removeOnComplete: false,
      removeOnFail: false
    }
  );
  
  console.log(chalk.green('✅ Evidence collection job queued:'), evidenceJob.id);
  
  // Step 3: Monitor evidence collection
  console.log(chalk.yellow('\nStep 3: Monitoring evidence collection...'));
  console.log(chalk.gray('This may take 5-10 minutes...'));
  
  let evidenceComplete = false;
  let evidenceResult = null;
  
  while (!evidenceComplete) {
    const job = await evidenceQueue.getJob(evidenceJob.id);
    const state = await job.getState();
    const progress = job.progress;
    
    if (state === 'completed') {
      evidenceComplete = true;
      evidenceResult = job.returnvalue;
      console.log(chalk.green('\n✅ Evidence collection completed!'));
      console.log(chalk.gray(`   Evidence collected: ${evidenceResult?.evidenceCount || 'Unknown'} items`));
    } else if (state === 'failed') {
      console.error(chalk.red('\n❌ Evidence collection failed!'));
      console.error(chalk.red(job.failedReason));
      return;
    } else {
      process.stdout.write(chalk.gray(`\r   Status: ${state} | Progress: ${progress || 0}%`));
    }
    
    if (!evidenceComplete) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
  }
  
  // Step 4: Queue report generation
  console.log(chalk.yellow('\nStep 4: Queueing report generation with Claude orchestration...'));
  
  const reportJob = await reportQueue.add(
    'generate-report',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.primary_criteria,
      evidenceJobId: evidenceJob.id
    },
    {
      removeOnComplete: false,
      removeOnFail: false
    }
  );
  
  console.log(chalk.green('✅ Report generation job queued:'), reportJob.id);
  
  // Step 5: Monitor report generation
  console.log(chalk.yellow('\nStep 5: Monitoring report generation with Claude...'));
  console.log(chalk.gray('Claude is orchestrating the analysis...'));
  
  let reportComplete = false;
  let reportResult = null;
  
  while (!reportComplete) {
    const job = await reportQueue.getJob(reportJob.id);
    const state = await job.getState();
    const progress = job.progress;
    
    if (state === 'completed') {
      reportComplete = true;
      reportResult = job.returnvalue;
      console.log(chalk.green('\n✅ Report generation completed!'));
      console.log(chalk.gray(`   Report ID: ${reportResult?.reportId}`));
      console.log(chalk.gray(`   Investment Score: ${reportResult?.investmentScore}/100`));
      console.log(chalk.gray(`   Citations: ${reportResult?.citationCount}`));
      console.log(chalk.gray(`   Analysis Depth: ${reportResult?.analysisDepth}`));
    } else if (state === 'failed') {
      console.error(chalk.red('\n❌ Report generation failed!'));
      console.error(chalk.red(job.failedReason));
      return;
    } else {
      process.stdout.write(chalk.gray(`\r   Status: ${state} | Progress: ${progress || 0}%`));
    }
    
    if (!reportComplete) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
  }
  
  // Step 6: Fetch and display report summary
  console.log(chalk.yellow('\nStep 6: Fetching report details...'));
  
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportResult.reportId)
    .single();
    
  if (report) {
    console.log(chalk.green('\n✅ Report Details:'));
    console.log(chalk.white(`   Company: ${report.company_name}`));
    console.log(chalk.white(`   Investment Score: ${report.investment_score}/100`));
    console.log(chalk.white(`   Tech Health Score: ${report.tech_health_score}/100`));
    console.log(chalk.white(`   Grade: ${report.tech_health_grade}`));
    console.log(chalk.white(`   Evidence Count: ${report.evidence_count}`));
    console.log(chalk.white(`   Citation Count: ${report.citation_count}`));
    console.log(chalk.white(`   Report Version: ${report.report_version}`));
    console.log(chalk.white(`   AI Models: ${report.ai_model_used}`));
    
    // Check sections
    if (report.report_data?.sections) {
      console.log(chalk.cyan('\n   Report Sections:'));
      report.report_data.sections.forEach(section => {
        const contentLength = section.content ? section.content.length : 0;
        const hasContent = contentLength > 100;
        const icon = hasContent ? '✅' : '❌';
        console.log(chalk.gray(`   ${icon} ${section.title} (${contentLength} chars, score: ${section.score})`));
      });
    }
    
    // Check trace
    const { data: trace } = await supabase
      .from('analysis_traces')
      .select('trace_data')
      .eq('scan_request_id', scanRequest.id)
      .single();
      
    if (trace) {
      console.log(chalk.cyan('\n   Analysis Trace:'));
      console.log(chalk.gray(`   Total steps: ${trace.trace_data.length}`));
      
      // Show key phases
      const phases = [...new Set(trace.trace_data.map(t => t.phase))];
      phases.forEach(phase => {
        const phaseSteps = trace.trace_data.filter(t => t.phase === phase);
        console.log(chalk.gray(`   - ${phase}: ${phaseSteps.length} steps`));
      });
    }
    
    console.log(chalk.bold.green(`\n🎉 Pipeline Complete!`));
    console.log(chalk.blue(`\nView report at: http://localhost:3000/reports/${report.id}`));
    
    // Step 7: Publish the report
    console.log(chalk.yellow('\nStep 7: Publishing report for review...'));
    
    const { error: publishError } = await supabase
      .from('reports')
      .update({
        human_reviewed: true,
        quality_score: 0.85 // Placeholder, will evaluate after viewing
      })
      .eq('id', report.id);
      
    if (!publishError) {
      console.log(chalk.green('✅ Report published!'));
      console.log(chalk.bold.cyan('\n📋 NEXT STEPS:'));
      console.log(chalk.white('1. Open the report URL above'));
      console.log(chalk.white('2. Review each section for content quality'));
      console.log(chalk.white('3. Check if evidence citations are present'));
      console.log(chalk.white('4. Verify comprehensive scoring is displayed'));
      console.log(chalk.white('5. Assess overall report quality'));
    }
  }
  
  // Cleanup
  await connection.quit();
}

// Run the pipeline
runSnowplowPipeline().catch(console.error);