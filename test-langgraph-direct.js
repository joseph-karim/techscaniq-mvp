import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
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

async function testLangGraphDirect() {
  console.log('🚀 Testing LangGraph Report Generation (Direct)\n');

  // Known good scan with evidence
  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  const collectionId = 'dd03bff2-1763-44e0-ae06-63dc8ce2c2e7';
  
  console.log(`Using scan: ${scanRequestId}`);
  console.log(`Using collection: ${collectionId}`);

  // Verify evidence exists
  const { count } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collectionId);
    
  console.log(`Evidence items: ${count}\n`);

  // Queue LangGraph report generation
  const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
  });

  const reportQueue = new Queue('report-generation', { connection });

  const job = await reportQueue.add('langgraph-report', {
    scanRequestId,
    company: 'Snowplow',
    domain: 'snowplow.io',
    investmentThesis: 'data_infrastructure'
  });

  console.log(`Job queued: ${job.id}\n`);

  // Monitor progress
  let complete = false;
  let attempts = 0;
  
  while (!complete && attempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
    
    const jobStatus = await reportQueue.getJob(job.id);
    const state = await jobStatus.getState();
    const progress = await jobStatus.progress;
    
    console.log(`Status: ${state}, Progress: ${progress}%`);
    
    if (state === 'completed') {
      complete = true;
      const result = jobStatus.returnvalue;
      console.log('\n✅ Report completed!');
      console.log(`Report ID: ${result.reportId}`);
      console.log(`Investment Score: ${result.investmentScore}`);
      console.log(`Citations: ${result.citationCount}`);
      
      // Check citations in DB
      const { data: citations } = await supabase
        .from('report_citations')
        .select('*')
        .eq('report_id', result.reportId)
        .limit(5);
        
      console.log(`\nCitations in DB: ${citations?.length || 0}`);
      if (citations && citations.length > 0) {
        console.log('Sample citations:');
        citations.forEach(c => {
          console.log(`  [${c.citation_number}] ${c.claim?.substring(0, 50)}...`);
        });
      }
    } else if (state === 'failed') {
      complete = true;
      console.error('\n❌ Job failed:', await jobStatus.failedReason);
    }
  }

  await reportQueue.close();
  process.exit(0);
}

testLangGraphDirect();