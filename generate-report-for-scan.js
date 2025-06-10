import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const supabase = createClient(
  'https://xngbtpbtivygkxnsexjg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZ2J0cGJ0aXZ5Z2t4bnNleGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzA4NjksImV4cCI6MjA2MzU0Njg2OX0.hw2gZo66-v5bB32B4m17VnwG02_D2xjSPosRV6vNWBc'
);

async function generateReport() {
  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  console.log('\n📝 Generating report for completed evidence collection...');
  
  // Check evidence was collected
  const { data: collection } = await supabase
    .from('evidence_collections')
    .select('*')
    .contains('metadata', { scan_request_id: scanRequestId })
    .single();
    
  console.log('Evidence collection found:', collection?.id);
  console.log('Evidence count:', collection?.evidence_count);
  
  // Queue report generation
  const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
  });
  
  const reportQueue = new Queue('report-generation', { connection });
  
  const reportJob = await reportQueue.add({
    scanRequestId,
    company: 'Snowplow',
    domain: 'snowplow.io',
    investmentThesis: 'accelerate-organic-growth'
  });
  
  console.log('\n✅ Report generation job queued:', reportJob.id);
  console.log('\nReport generation will use Claude to analyze the', collection?.evidence_count, 'evidence items');
  
  // Monitor report generation
  console.log('\nMonitoring report generation...');
  
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
    attempts++;
    
    const job = await reportQueue.getJob(reportJob.id);
    const progress = await job.getProgress();
    
    console.log(`📊 Report generation progress: ${progress}%`);
    
    // Check if report was created
    const { data: report } = await supabase
      .from('reports')
      .select('id, investment_score, tech_health_score, citation_count')
      .eq('scan_request_id', scanRequestId)
      .single();
    
    if (report) {
      console.log('\n✅ Report generated successfully!');
      console.log(`   Report ID: ${report.id}`);
      console.log(`   Investment Score: ${report.investment_score}/100`);
      console.log(`   Tech Health Score: ${report.tech_health_score}/10`);
      console.log(`   Citations: ${report.citation_count}`);
      console.log(`\n📄 View report at: http://localhost:5173/reports/${report.id}`);
      break;
    }
    
    if (job.failedReason) {
      console.error('\n❌ Report generation failed:', job.failedReason);
      break;
    }
  }
  
  // Close queue connection
  await reportQueue.close();
  process.exit(0);
}

generateReport();