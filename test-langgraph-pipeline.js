import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLangGraphPipeline() {
  console.log(chalk.cyan('🚀 Testing LangGraph Report Generation Pipeline\n'));

  try {
    // 1. Find or create a test scan
    console.log(chalk.yellow('Step 1: Finding test scan with evidence...'));
    
    let scan = null;
    let collection = null;
    
    // Look for existing Snowplow scan with evidence
    const { data: scans } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('company_name', 'Snowplow')
      .order('created_at', { ascending: false })
      .limit(5);

    if (scans && scans.length > 0) {
      // Try each scan to find one with evidence
      for (const scanCandidate of scans) {
        // Check for evidence collection
        const { data: collections } = await supabase
          .from('evidence_collections')
          .select('*')
          .contains('metadata', { scan_request_id: scanCandidate.id })
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (collections && collections.length > 0) {
          collection = collections[0];
          
          const { count } = await supabase
            .from('evidence_items')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);
            
          if (count > 0) {
            scan = scanCandidate;
            console.log(chalk.green(`✓ Found scan: ${scan.company_name} (${scan.id})`));
            console.log(chalk.gray(`  Status: ${scan.status}`));
            console.log(chalk.gray(`  Evidence collection: ${collection.id}`));
            console.log(chalk.gray(`  Evidence items: ${count}`));
            break;
          }
        }
      }
    }
    
    if (!scan || !collection) {
      console.log(chalk.red('No suitable scan found. Please run evidence collection first.'));
      return;
    }

    // 2. Queue LangGraph report generation
    console.log(chalk.yellow('\nStep 2: Queueing LangGraph report generation...'));
    
    const connection = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null
    });

    const reportQueue = new Queue('report-generation', { connection });

    const job = await reportQueue.add('langgraph-report', {
      scanRequestId: scan.id,
      company: scan.company_name,
      domain: scan.company_url || 'snowplow.io',
      investmentThesis: scan.investment_thesis || 'data_infrastructure'
    }, {
      jobId: `langgraph-${scan.id}-${Date.now()}`
    });

    console.log(chalk.green(`✓ Job queued: ${job.id}`));

    // 3. Monitor LangGraph workflow progress
    console.log(chalk.yellow('\nStep 3: Monitoring LangGraph workflow...'));
    
    let lastPhase = '';
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
      attempts++;

      const jobStatus = await reportQueue.getJob(job.id);
      
      if (!jobStatus) {
        console.log(chalk.red('Job not found!'));
        break;
      }

      const state = await jobStatus.getState();
      const progress = await jobStatus.progress;
      const result = jobStatus.returnvalue;

      // Show phase updates
      if (result?.phases) {
        const currentPhase = result.phases[result.phases.length - 1];
        if (currentPhase !== lastPhase) {
          console.log(chalk.blue(`\n📍 Phase: ${currentPhase}`));
          lastPhase = currentPhase;
        }
      }

      process.stdout.write(chalk.gray(`\r⏳ Status: ${state} | Progress: ${progress}%`));

      if (state === 'completed') {
        console.log(chalk.green('\n\n✅ LangGraph report generation completed!'));
        
        // Display results
        console.log(chalk.white('\nResults:'));
        console.log(chalk.white(`  Report ID: ${result.reportId}`));
        console.log(chalk.white(`  Investment Score: ${result.investmentScore}/100`));
        console.log(chalk.white(`  Citations: ${result.citationCount}`));
        console.log(chalk.white(`  Workflow: ${result.workflow}`));
        
        if (result.phases) {
          console.log(chalk.cyan('\n  Workflow phases completed:'));
          result.phases.forEach((phase, index) => {
            console.log(chalk.gray(`    ${index + 1}. ${phase}`));
          });
        }
        
        // Check the report details
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', result.reportId)
          .single();
          
        if (report) {
          console.log(chalk.cyan('\nReport Analysis:'));
          console.log(chalk.white(`  Tech Health Grade: ${report.tech_health_grade}`));
          console.log(chalk.white(`  Quality Score: ${(report.quality_score * 100).toFixed(0)}%`));
          
          // Check citations
          const { data: citations } = await supabase
            .from('report_citations')
            .select('*')
            .eq('report_id', report.id)
            .order('citation_number')
            .limit(5);
            
          if (citations && citations.length > 0) {
            console.log(chalk.cyan('\n  Sample Citations:'));
            citations.forEach(c => {
              console.log(chalk.gray(`    [${c.citation_number}] ${c.claim.substring(0, 60)}...`));
            });
          }
          
          // Check embedded citations
          const content = JSON.stringify(report.report_data);
          const embeddedCitations = content.match(/\[\d+\]\(#cite-\d+\)/g);
          console.log(chalk.white(`\n  Embedded citations in content: ${embeddedCitations?.length || 0}`));
          
          console.log(chalk.green(`\n🔗 View report: http://localhost:5173/reports/${report.id}`));
        }
        
        break;
      } else if (state === 'failed') {
        const failedReason = await jobStatus.failedReason;
        console.error(chalk.red('\n\n❌ Report generation failed!'));
        console.error(chalk.red(failedReason));
        
        // Check for detailed errors
        const { data: trace } = await supabase
          .from('analysis_traces')
          .select('trace_data')
          .eq('scan_request_id', scan.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (trace?.trace_data) {
          const errors = trace.trace_data.filter(t => t.error);
          if (errors.length > 0) {
            console.log(chalk.red('\nDetailed errors:'));
            errors.forEach(e => {
              console.log(chalk.red(`  - ${e.phase}: ${e.error}`));
            });
          }
        }
        
        break;
      }
    }

    await reportQueue.close();

  } catch (error) {
    console.error(chalk.red('\nError:'), error);
  }

  process.exit(0);
}

// Run the test
testLangGraphPipeline();