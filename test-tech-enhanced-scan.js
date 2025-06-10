import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

async function triggerTechEnhancedScan() {
  console.log('🚀 Starting tech-enhanced evidence collection for Snowplow...');
  
  const evidenceQueue = new Queue('evidence-collection', { connection });
  
  const job = await evidenceQueue.add('collect', {
    scanRequestId: '9f332d98-093e-4186-8e6d-c060728836b4',
    company: 'Snowplow',
    domain: 'snowplow.io',
    depth: 2,
    investmentThesis: 'accelerate-organic-growth',
    primaryCriteria: ['customer_reviews', 'competitive_analysis', 'technical_architecture']
  });
  
  console.log('✅ Evidence collection job queued:', job.id);
  console.log('📋 This will include Claude-orchestrated technical analysis phase');
  console.log('🔧 Technical tools: Playwright, Webtech Analyzer, Security Scanner');
  
  await connection.quit();
  process.exit(0);
}

triggerTechEnhancedScan();