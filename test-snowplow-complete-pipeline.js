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

async function testSnowplowCompletePipeline() {
  console.log(chalk.cyan('🚀 Testing Complete Pipeline with Snowplow\n'));

  const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
  });

  try {
    // 1. Create a fresh scan request
    console.log(chalk.yellow('Step 1: Creating new scan request for Snowplow...'));
    
    const { data: scan, error: scanError } = await supabase
      .from('scan_requests')
      .insert({
        company_name: 'Snowplow',
        company_url: 'snowplow.io',
        status: 'pending',
        scan_type: 'deep',
        investment_thesis: 'data_infrastructure',
        investment_focus_areas: ['data_infrastructure', 'cloud_native', 'developer_tools'],
        thesis_tags: ['real-time-analytics', 'data-pipeline', 'event-tracking'],
        metadata: {
          test: true,
          pipeline: 'complete-langgraph',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (scanError) throw scanError;
    
    console.log(chalk.green(`✓ Created scan request: ${scan.id}`));
    console.log(chalk.gray(`  Company: ${scan.company_name}`));
    console.log(chalk.gray(`  URL: ${scan.company_url}`));
    console.log(chalk.gray(`  Type: ${scan.scan_type}`));

    // 2. Queue evidence collection
    console.log(chalk.yellow('\nStep 2: Queueing evidence collection...'));
    
    const evidenceQueue = new Queue('evidence-collection', { connection });
    
    const evidenceJob = await evidenceQueue.add('collect-evidence', {
      scanRequestId: scan.id,
      company: scan.company_name,
      domain: scan.company_url,
      scanType: scan.scan_type,
      investmentThesis: scan.investment_thesis
    });

    console.log(chalk.green(`✓ Evidence collection job queued: ${evidenceJob.id}`));

    // 3. Monitor evidence collection
    console.log(chalk.yellow('\nStep 3: Monitoring evidence collection...'));
    
    let evidenceComplete = false;
    let evidenceAttempts = 0;
    const maxEvidenceAttempts = 60; // 10 minutes

    while (!evidenceComplete && evidenceAttempts < maxEvidenceAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      evidenceAttempts++;

      const jobStatus = await evidenceQueue.getJob(evidenceJob.id);
      const state = await jobStatus?.getState();
      const progress = await jobStatus?.progress;

      process.stdout.write(chalk.gray(`\r⏳ Evidence collection: ${state} | Progress: ${progress || 0}%`));

      if (state === 'completed') {
        evidenceComplete = true;
        const result = jobStatus.returnvalue;
        console.log(chalk.green('\n✅ Evidence collection completed!'));
        console.log(chalk.white(`  Evidence items: ${result.evidenceCount}`));
        console.log(chalk.white(`  Collection ID: ${result.collectionId}`));
        
        // Verify evidence in database
        const { data: evidenceItems, count } = await supabase
          .from('evidence_items')
          .select('*', { count: 'exact' })
          .eq('collection_id', result.collectionId)
          .limit(5);
          
        console.log(chalk.cyan('\n  Sample evidence collected:'));
        evidenceItems?.forEach((item, i) => {
          console.log(chalk.gray(`    ${i + 1}. ${item.title || item.type} (confidence: ${(item.confidence_score * 100).toFixed(0)}%)`));
        });

      } else if (state === 'failed') {
        evidenceComplete = true;
        console.error(chalk.red('\n❌ Evidence collection failed!'));
        console.error(await jobStatus?.failedReason);
        await evidenceQueue.close();
        process.exit(1);
      }
    }

    if (!evidenceComplete) {
      console.error(chalk.red('\n❌ Evidence collection timed out!'));
      await evidenceQueue.close();
      process.exit(1);
    }

    // 4. Queue report generation with LangGraph
    console.log(chalk.yellow('\n\nStep 4: Queueing LangGraph report generation...'));
    
    const reportQueue = new Queue('report-generation', { connection });
    
    const reportJob = await reportQueue.add('langgraph-report', {
      scanRequestId: scan.id,
      company: scan.company_name,
      domain: scan.company_url,
      investmentThesis: scan.investment_thesis
    });

    console.log(chalk.green(`✓ Report generation job queued: ${reportJob.id}`));

    // 5. Monitor LangGraph workflow
    console.log(chalk.yellow('\nStep 5: Monitoring LangGraph workflow...'));
    
    let reportComplete = false;
    let reportAttempts = 0;
    let lastPhase = '';
    const maxReportAttempts = 60;

    while (!reportComplete && reportAttempts < maxReportAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      reportAttempts++;

      const jobStatus = await reportQueue.getJob(reportJob.id);
      const state = await jobStatus?.getState();
      const progress = await jobStatus?.progress;

      process.stdout.write(chalk.gray(`\r⏳ Report generation: ${state} | Progress: ${progress || 0}%`));

      if (state === 'completed') {
        reportComplete = true;
        const result = jobStatus.returnvalue;
        
        console.log(chalk.green('\n\n✅ Report generation completed!'));
        console.log(chalk.white('\nReport Summary:'));
        console.log(chalk.white(`  Report ID: ${result.reportId}`));
        console.log(chalk.white(`  Investment Score: ${result.investmentScore}/100`));
        console.log(chalk.white(`  Citations: ${result.citationCount}`));
        
        // Get full report details
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', result.reportId)
          .single();
          
        if (report) {
          console.log(chalk.white(`  Tech Health Score: ${report.tech_health_score}/100`));
          console.log(chalk.white(`  Tech Health Grade: ${report.tech_health_grade}`));
          console.log(chalk.white(`  Quality Score: ${(report.quality_score * 100).toFixed(0)}%`));
          console.log(chalk.white(`  Evidence Count: ${report.evidence_count}`));
          
          // Check citations
          const { data: citations, count: citationCount } = await supabase
            .from('report_citations')
            .select('*', { count: 'exact' })
            .eq('report_id', report.id)
            .order('citation_number')
            .limit(10);
            
          console.log(chalk.cyan(`\n  Citations (${citationCount} total):`));
          citations?.forEach(c => {
            console.log(chalk.gray(`    [${c.citation_number}] ${c.claim.substring(0, 80)}...`));
          });
          
          // Check embedded citations in content
          const content = JSON.stringify(report.report_data);
          const citationMatches = content.match(/\[\d+\]\(#cite-\d+\)/g);
          console.log(chalk.white(`\n  Embedded citations in content: ${citationMatches?.length || 0}`));
          
          // Show sections
          if (report.report_data?.sections) {
            console.log(chalk.cyan('\n  Report sections:'));
            Object.entries(report.report_data.sections).forEach(([key, section]) => {
              console.log(chalk.gray(`    - ${section.title} (score: ${section.score || 'N/A'})`));
            });
          }
          
          console.log(chalk.green(`\n🔗 View full report: http://localhost:5173/reports/${report.id}`));
        }
        
      } else if (state === 'failed') {
        reportComplete = true;
        console.error(chalk.red('\n❌ Report generation failed!'));
        console.error(await jobStatus?.failedReason);
      }
    }

    // 6. Final validation
    console.log(chalk.yellow('\n\nStep 6: Final validation...'));
    
    // Check scan request status
    const { data: finalScan } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', scan.id)
      .single();
      
    console.log(chalk.white(`\nScan request final status: ${finalScan.status}`));
    
    if (finalScan.status === 'completed') {
      console.log(chalk.green('✅ Complete pipeline test successful!'));
      
      // Summary
      console.log(chalk.cyan('\n📊 Pipeline Summary:'));
      console.log(chalk.white(`  1. Scan request created: ${scan.id}`));
      console.log(chalk.white(`  2. Evidence collected: ${finalScan.evidence_count || 'N/A'} items`));
      console.log(chalk.white(`  3. Report generated: ${finalScan.latest_report_id}`));
      console.log(chalk.white(`  4. Investment score: ${finalScan.investment_score || 'N/A'}/100`));
      console.log(chalk.white(`  5. Tech health score: ${finalScan.tech_health_score || 'N/A'}/100`));
    } else {
      console.log(chalk.red('❌ Pipeline did not complete successfully'));
    }

    await evidenceQueue.close();
    await reportQueue.close();

  } catch (error) {
    console.error(chalk.red('\nError during pipeline test:'), error);
  } finally {
    await connection.quit();
  }

  process.exit(0);
}

// Run the test
testSnowplowCompletePipeline();