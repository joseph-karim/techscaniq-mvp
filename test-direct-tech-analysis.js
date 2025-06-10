import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

async function testDirectTechAnalysis() {
  console.log('🔧 Testing direct technical analysis workers...');
  
  const collectionId = 'test-collection-' + Date.now();
  
  // Test Webtech Analyzer
  console.log('🌐 Testing Webtech Analyzer...');
  const webtechQueue = new Queue('webtech-analyzer', { connection });
  const webtechJob = await webtechQueue.add('analyze', {
    url: 'https://snowplow.io',
    domain: 'snowplow.io',
    company: 'Snowplow',
    collectionId: collectionId
  });
  console.log('✅ Webtech job queued:', webtechJob.id);
  
  // Test Security Scanner
  console.log('🔒 Testing Security Scanner...');
  const securityQueue = new Queue('security-scanner', { connection });
  const securityJob = await securityQueue.add('scan', {
    url: 'https://snowplow.io',
    domain: 'snowplow.io', 
    company: 'Snowplow',
    collectionId: collectionId
  });
  console.log('✅ Security job queued:', securityJob.id);
  
  console.log('⏳ Jobs queued. Check worker logs for results.');
  
  await connection.quit();
  process.exit(0);
}

testDirectTechAnalysis();