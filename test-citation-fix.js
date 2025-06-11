import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xngbtpbtivygkxnsexjg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCitationFix() {
  console.log('Testing Citation Fix...\n');

  try {
    // 1. Find a recent Snowplow scan with evidence
    const { data: scans } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('company_name', 'Snowplow')
      .eq('status', 'evidence_collected')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!scans || scans.length === 0) {
      console.log('No Snowplow scan with evidence found. Please run a scan first.');
      return;
    }

    const scan = scans[0];
    console.log(`Using scan: ${scan.id}`);
    console.log(`Company: ${scan.company_name}`);
    console.log(`Status: ${scan.status}`);

    // 2. Check evidence collection
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('scan_request_id', scan.id)
      .single();

    if (!collection) {
      console.log('No evidence collection found for this scan.');
      return;
    }

    const { data: evidenceItems } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collection.id)
      .limit(5);

    console.log(`\nEvidence collection: ${collection.id}`);
    console.log(`Evidence items: ${evidenceItems?.length || 0}`);

    // 3. Queue report generation
    console.log('\nQueueing report generation...');
    
    const connection = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null
    });

    const reportQueue = new Queue('report-generation', { connection });

    const job = await reportQueue.add('generate-report', {
      scanRequestId: scan.id,
      company: scan.company_name,
      domain: scan.company_url || 'snowplow.io',
      investmentThesis: scan.investment_thesis || 'data_infrastructure'
    });

    console.log(`Report job queued: ${job.id}`);

    // 4. Monitor progress
    console.log('\nMonitoring report generation...');
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
      attempts++;

      const jobStatus = await reportQueue.getJob(job.id);
      const state = await jobStatus.getState();
      const progress = await jobStatus.progress;

      console.log(`Status: ${state}, Progress: ${progress}%`);

      if (state === 'completed') {
        console.log('\n✅ Report generation completed!');
        
        // Check the report
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('scan_request_id', scan.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (report) {
          console.log(`\nReport ID: ${report.id}`);
          console.log(`Citation count: ${report.citation_count}`);

          // Check citations in database
          const { data: citations } = await supabase
            .from('report_citations')
            .select('*')
            .eq('report_id', report.id)
            .order('citation_number');

          console.log(`\nCitations in database: ${citations?.length || 0}`);
          
          if (citations && citations.length > 0) {
            console.log('\nFirst 3 citations:');
            citations.slice(0, 3).forEach(c => {
              console.log(`  [${c.citation_number}] ${c.claim}`);
              console.log(`    Evidence: ${c.evidence_item_id}`);
              console.log(`    Confidence: ${c.confidence}%`);
            });
          }

          // Check embedded citations in content
          const content = JSON.stringify(report.report_data);
          const citationMatches = content.match(/\[\d+\]\(#cite-\d+\)/g);
          console.log(`\nEmbedded citations in content: ${citationMatches?.length || 0}`);
          
          if (citationMatches && citationMatches.length > 0) {
            console.log('Sample embedded citations:', citationMatches.slice(0, 5));
          }

          // Check executive summary specifically
          if (report.report_data?.executiveSummary?.content) {
            const execCitations = report.report_data.executiveSummary.content.match(/\[\d+\]\(#cite-\d+\)/g);
            console.log(`\nCitations in executive summary: ${execCitations?.length || 0}`);
          }
        }
        
        break;
      } else if (state === 'failed') {
        console.error('\n❌ Report generation failed!');
        console.error(await jobStatus.failedReason);
        break;
      }
    }

    await reportQueue.close();

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testCitationFix();