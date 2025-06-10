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

async function runDeepResearchPipeline() {
  console.log(chalk.bold.cyan('\n🚀 Running Deep Research Pipeline for Snowplow.io\n'));
  console.log(chalk.yellow('This will collect 50-100+ evidence items using deep research architecture'));
  
  // Step 1: Create scan request
  console.log(chalk.yellow('\nStep 1: Creating scan request...'));
  
  const { data: scanRequest, error: scanError } = await supabase
    .from('scan_requests')
    .insert({
      company_name: 'Snowplow',
      website_url: 'https://snowplow.io',
      primary_criteria: 'accelerate-organic-growth',
      investment_thesis_data: {
        type: 'accelerate-organic-growth',
        name: 'Accelerate Organic Growth',
        description: 'Evaluating Snowplow for scaling and expansion potential',
        focus_areas: ['scalability', 'technology', 'market-position', 'team', 'financials']
      },
      thesis_tags: ['cloud-native', 'scalable-architecture', 'data-analytics'],
      requestor_name: 'Deep Research Test',
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
  console.log(chalk.yellow('\nStep 2: Queueing deep research evidence collection...'));
  
  const evidenceJob = await evidenceQueue.add(
    'collect-evidence',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: 'snowplow.io',
      investmentThesis: scanRequest.primary_criteria,
      primaryCriteria: scanRequest.primary_criteria,
      depth: 'exhaustive' // Maximum depth for deep research
    },
    {
      removeOnComplete: false,
      removeOnFail: false
    }
  );
  
  console.log(chalk.green('✅ Evidence collection job queued:'), evidenceJob.id);
  console.log(chalk.gray('   Using deep research architecture with multiple phases'));
  
  // Step 3: Monitor evidence collection
  console.log(chalk.yellow('\nStep 3: Monitoring deep research progress...'));
  console.log(chalk.gray('This will take 5-15 minutes to collect comprehensive evidence...'));
  
  let evidenceComplete = false;
  let evidenceResult = null;
  let lastProgress = 0;
  
  while (!evidenceComplete) {
    const job = await evidenceQueue.getJob(evidenceJob.id);
    const state = await job.getState();
    const progress = job.progress || 0;
    
    // Check evidence collection status
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('metadata->>scan_request_id', scanRequest.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (state === 'completed') {
      evidenceComplete = true;
      evidenceResult = job.returnvalue;
      console.log(chalk.green('\n✅ Deep research evidence collection completed!'));
      console.log(chalk.gray(`   Evidence collected: ${evidenceResult?.evidenceCount || 'Unknown'} items`));
      console.log(chalk.gray(`   Evidence types: ${evidenceResult?.evidenceTypes?.join(', ') || 'Various'}`));
      console.log(chalk.gray(`   Sources used: ${evidenceResult?.sources?.join(', ') || 'Multiple'}`));
    } else if (state === 'failed') {
      console.error(chalk.red('\n❌ Evidence collection failed!'));
      console.error(chalk.red(job.failedReason));
      return;
    } else {
      if (progress !== lastProgress) {
        console.log(chalk.cyan(`\n📊 Progress: ${progress}%`));
        if (collection) {
          console.log(chalk.gray(`   Evidence items so far: ${collection.evidence_count || 0}`));
          if (collection.metadata?.evidence_types) {
            console.log(chalk.gray(`   Types collected: ${collection.metadata.evidence_types.length}`));
          }
        }
        lastProgress = progress;
      }
    }
    
    if (!evidenceComplete) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
  }
  
  // Analyze evidence collected
  console.log(chalk.yellow('\n📊 Analyzing evidence collection results...'));
  
  const { data: evidenceItems, count } = await supabase
    .from('evidence_items')
    .select('type, confidence_score, source_data', { count: 'exact' })
    .eq('company_name', 'Snowplow')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (evidenceItems && evidenceItems.length > 0) {
    const typeCount = {};
    const sourceCount = {};
    let highConfidenceCount = 0;
    
    evidenceItems.forEach(item => {
      // Count by type
      typeCount[item.type] = (typeCount[item.type] || 0) + 1;
      
      // Count by source
      const source = item.source_data?.tool || 'unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
      
      // Count high confidence
      if (item.confidence_score >= 0.8) highConfidenceCount++;
    });
    
    console.log(chalk.green('\n📈 Evidence Summary:'));
    console.log(chalk.white(`   Total evidence items: ${count}`));
    console.log(chalk.white(`   High confidence items: ${highConfidenceCount}`));
    
    console.log(chalk.cyan('\n   Evidence by type:'));
    Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, cnt]) => {
        console.log(chalk.gray(`     - ${type}: ${cnt}`));
      });
      
    console.log(chalk.cyan('\n   Evidence by source:'));
    Object.entries(sourceCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, cnt]) => {
        console.log(chalk.gray(`     - ${source}: ${cnt}`));
      });
  }
  
  // Step 4: Queue report generation
  console.log(chalk.yellow('\nStep 4: Queueing Claude-orchestrated report generation...'));
  
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
  console.log(chalk.yellow('\nStep 5: Monitoring Claude report generation...'));
  console.log(chalk.gray('Claude will analyze all evidence and generate comprehensive report...'));
  
  let reportComplete = false;
  let reportResult = null;
  
  while (!reportComplete) {
    const job = await reportQueue.getJob(reportJob.id);
    const state = await job.getState();
    const progress = job.progress || 0;
    
    if (state === 'completed') {
      reportComplete = true;
      reportResult = job.returnvalue;
      console.log(chalk.green('\n✅ Report generation completed!'));
      console.log(chalk.gray(`   Report ID: ${reportResult?.reportId}`));
      console.log(chalk.gray(`   Investment Score: ${reportResult?.investmentScore}/100`));
      console.log(chalk.gray(`   Citations: ${reportResult?.citationCount}`));
    } else if (state === 'failed') {
      console.error(chalk.red('\n❌ Report generation failed!'));
      console.error(chalk.red(job.failedReason));
      return;
    } else {
      process.stdout.write(chalk.gray(`\r   Status: ${state} | Progress: ${progress}%`));
    }
    
    if (!reportComplete) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Step 6: Fetch and display report
  console.log(chalk.yellow('\nStep 6: Fetching final report...'));
  
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportResult.reportId)
    .single();
    
  if (report) {
    console.log(chalk.green('\n✅ Report Generated Successfully!'));
    console.log(chalk.white(`   Company: ${report.company_name}`));
    console.log(chalk.white(`   Investment Score: ${report.investment_score}/100`));
    console.log(chalk.white(`   Tech Health Score: ${report.tech_health_score}/100`));
    console.log(chalk.white(`   Grade: ${report.tech_health_grade}`));
    console.log(chalk.white(`   Evidence Used: ${report.evidence_count} items`));
    console.log(chalk.white(`   Citations: ${report.citation_count}`));
    
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
    
    console.log(chalk.bold.green(`\n🎉 Deep Research Pipeline Complete!`));
    console.log(chalk.blue(`\nView report at: http://localhost:3000/reports/${report.id}`));
    
    // Quality assessment
    if (count >= 50) {
      console.log(chalk.bold.green('\n✅ EVIDENCE COLLECTION SUCCESS!'));
      console.log(chalk.green(`   Collected ${count} evidence items (target: 50+)`));
      console.log(chalk.green('   Ready for PE-grade investment decision'));
    } else {
      console.log(chalk.yellow('\n⚠️  Evidence collection below target'));
      console.log(chalk.yellow(`   Collected ${count} items (target: 50+)`));
    }
  }
  
  // Cleanup
  await connection.quit();
}

// Run the pipeline
runDeepResearchPipeline().catch(console.error);