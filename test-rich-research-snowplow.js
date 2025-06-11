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

async function testRichResearchSnowplow() {
  console.log(chalk.cyan('🚀 Testing Rich Iterative Research with Snowplow\n'));

  const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
  });

  try {
    // 1. Use or create a Snowplow scan request
    console.log(chalk.yellow('Step 1: Finding or creating Snowplow scan request...'));
    
    // First try to find existing Snowplow scan
    let { data: existingScans } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('company_name', 'Snowplow')
      .order('created_at', { ascending: false })
      .limit(1);
    
    let scan = existingScans?.[0];
    
    if (!scan) {
      console.log(chalk.yellow('  No existing Snowplow scan found, using Ring4 for test...'));
      
      // Use existing Ring4 scan as fallback
      const { data: ring4Scans } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('company_name', 'Ring4')
        .limit(1);
      
      scan = ring4Scans?.[0];
      
      if (!scan) {
        throw new Error('No existing scan found to test with');
      }
      
      // Update for our test
      scan.company_name = 'Snowplow (Test)';
      scan.website_url = 'https://snowplow.io';
    }
    
    console.log(chalk.green(`✓ Using scan request: ${scan.id}`));
    console.log(chalk.gray(`  Company: ${scan.company_name}`));
    console.log(chalk.gray(`  URL: ${scan.website_url}`));

    // 2. Queue the rich research job
    console.log(chalk.yellow('\nStep 2: Queueing rich iterative research...'));
    
    const researchQueue = new Queue('rich-iterative-research', { connection });
    
    const job = await researchQueue.add('analyze-snowplow', {
      scanRequestId: scan.id,
      company: scan.company_name,
      domain: 'snowplow.io',
      investmentThesis: scan.investment_thesis_data?.thesis || 'data_infrastructure'
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    console.log(chalk.green(`✓ Research job queued: ${job.id}`));

    // 3. Monitor progress
    console.log(chalk.yellow('\nStep 3: Monitoring research progress...\n'));
    
    let lastPhase = '';
    let complete = false;
    let attempts = 0;
    const maxAttempts = 120; // 20 minutes max
    
    while (!complete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
      attempts++;

      const jobStatus = await researchQueue.getJob(job.id);
      
      if (!jobStatus) {
        console.log(chalk.red('Job not found!'));
        break;
      }

      const state = await jobStatus.getState();
      const progress = jobStatus.progress;
      
      // Show phase updates
      const currentPhase = typeof progress === 'object' ? progress.phase : 'processing';
      if (currentPhase !== lastPhase) {
        console.log(chalk.blue(`\n📍 Phase: ${currentPhase}`));
        lastPhase = currentPhase;
        
        // Show phase-specific details
        if (progress.technicalProfile) {
          console.log(chalk.gray('  Technical Profile:'));
          console.log(chalk.gray(`    - Security: ${progress.technicalProfile.securityGrade}`));
          console.log(chalk.gray(`    - Technologies: ${progress.technicalProfile.technologies.length} detected`));
          console.log(chalk.gray(`    - APIs: ${progress.technicalProfile.detectedAPIs.length} found`));
          console.log(chalk.gray(`    - Competitors: ${progress.competitorProfile?.join(', ') || 'None'}`));
        }
        
        if (progress.automatedChecks) {
          console.log(chalk.gray('  Automated Checks:'));
          console.log(chalk.gray(`    - Run: ${progress.automatedChecks.run}`));
          console.log(chalk.gray(`    - Passed: ${progress.automatedChecks.passed}`));
        }
        
        if (progress.iteration) {
          console.log(chalk.gray(`  Research Iteration: ${progress.iteration}`));
          console.log(chalk.gray(`    - Questions: ${progress.questionsAnswered}/${progress.questionsTotal}`));
          console.log(chalk.gray(`    - Confidence: ${(progress.confidence * 100).toFixed(0)}%`));
        }
      }
      
      const progressPercent = typeof progress === 'number' ? progress : progress?.percent || 0;
      process.stdout.write(chalk.gray(`\r⏳ Status: ${state} | Progress: ${progressPercent}%`));

      if (state === 'completed') {
        complete = true;
        const result = jobStatus.returnvalue;
        
        console.log(chalk.green('\n\n✅ Rich research completed!'));
        console.log(chalk.white('\n📊 Results Summary:'));
        console.log(chalk.white(`  Report ID: ${result.reportId}`));
        console.log(chalk.white(`  Overall Score: ${result.overallScore}/100`));
        console.log(chalk.white(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`));
        console.log(chalk.white(`  Iterations: ${result.iterations}`));
        console.log(chalk.white(`  Automated Checks: ${result.automatedChecks}`));
        console.log(chalk.white(`  Citations: ${result.citationCount}`));
        
        // Show category scores
        if (result.scoresByCategory) {
          console.log(chalk.cyan('\n📈 Category Scores:'));
          Object.entries(result.scoresByCategory).forEach(([category, score]) => {
            console.log(chalk.white(`  ${category}: ${score.value}/100 (${(score.confidence * 100).toFixed(0)}% confidence)`));
            console.log(chalk.gray(`    ${score.details}`));
          });
        }
        
        // Get the full report
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', result.reportId)
          .single();
          
        if (report) {
          console.log(chalk.cyan('\n📋 Report Analysis:'));
          
          // Show technical profile
          if (report.report_data?.technical_profile) {
            const profile = report.report_data.technical_profile;
            console.log(chalk.white('\n  Technical Profile:'));
            console.log(chalk.gray(`    Security Grade: ${profile.securityGrade}`));
            console.log(chalk.gray(`    Security Headers: ${profile.securityHeaders.join(', ')}`));
            console.log(chalk.gray(`    Technologies: ${profile.technologies.join(', ')}`));
            console.log(chalk.gray(`    JS Frameworks: ${profile.javascriptFrameworks.join(', ')}`));
            console.log(chalk.gray(`    Integrations: ${profile.integrations.join(', ')}`));
            console.log(chalk.gray(`    CDN: ${profile.performanceMetrics.cdn}`));
          }
          
          // Show competitor analysis
          if (report.report_data?.competitor_analysis?.length > 0) {
            console.log(chalk.white('\n  Competitive Landscape:'));
            console.log(chalk.gray(`    Identified Competitors: ${report.report_data.competitor_analysis.join(', ')}`));
          }
          
          // Show research summary
          const summary = report.report_data?.research_summary;
          if (summary) {
            console.log(chalk.white('\n  Research Summary:'));
            console.log(chalk.gray(`    Questions Researched: ${summary.questionsTotal}`));
            console.log(chalk.gray(`    Questions Answered: ${summary.questionsAnswered}`));
            console.log(chalk.gray(`    Automated Checks: ${summary.automatedChecksPassed}/${summary.automatedChecksTotal}`));
            console.log(chalk.gray(`    Evidence Items: ${report.evidence_count}`));
          }
          
          // Sample citations
          const { data: citations } = await supabase
            .from('report_citations')
            .select('*')
            .eq('report_id', report.id)
            .order('citation_number')
            .limit(10);
            
          if (citations && citations.length > 0) {
            console.log(chalk.cyan(`\n📚 Sample Citations (${report.citation_count} total):`));
            
            // Show automated check citations
            const automatedCitations = citations.filter(c => 
              c.evidence_summary?.type === 'automated_check'
            );
            if (automatedCitations.length > 0) {
              console.log(chalk.white('\n  From Automated Checks:'));
              automatedCitations.slice(0, 3).forEach(c => {
                console.log(chalk.gray(`    [${c.citation_number}] ${c.claim} (${c.confidence}% confidence)`));
              });
            }
            
            // Show research citations
            const researchCitations = citations.filter(c => 
              c.evidence_summary?.type !== 'automated_check'
            );
            if (researchCitations.length > 0) {
              console.log(chalk.white('\n  From Research:'));
              researchCitations.slice(0, 5).forEach(c => {
                console.log(chalk.gray(`    [${c.citation_number}] ${c.claim.substring(0, 80)}...`));
              });
            }
          }
          
          // Check citation embedding
          const content = JSON.stringify(report.report_data);
          const citationMatches = content.match(/\[\d+\]\(#cite-\d+\)/g);
          console.log(chalk.white(`\n  Citations embedded in content: ${citationMatches?.length || 0}`));
          
          console.log(chalk.green(`\n🔗 View full report: http://localhost:5173/reports/${report.id}`));
        }
        
      } else if (state === 'failed') {
        complete = true;
        const failedReason = await jobStatus.failedReason;
        console.error(chalk.red('\n\n❌ Research failed!'));
        console.error(chalk.red(failedReason));
        
        // Check scan status
        const { data: failedScan } = await supabase
          .from('scan_requests')
          .select('*')
          .eq('id', scan.id)
          .single();
          
        if (failedScan?.error_message) {
          console.error(chalk.red(`\nScan error: ${failedScan.error_message}`));
        }
      }
    }
    
    if (!complete) {
      console.log(chalk.yellow('\n⏱️ Research timed out - checking status...'));
      
      const { data: timeoutScan } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', scan.id)
        .single();
        
      console.log(chalk.yellow(`Final scan status: ${timeoutScan?.status}`));
      if (timeoutScan?.latest_report_id) {
        console.log(chalk.green(`Report was created: ${timeoutScan.latest_report_id}`));
      }
    }

    await researchQueue.close();

  } catch (error) {
    console.error(chalk.red('\nError during test:'), error);
  } finally {
    await connection.quit();
  }

  process.exit(0);
}

// Run the test
testRichResearchSnowplow();