import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

async function triggerReport() {
  const scanRequestId = '9f332d98-093e-4186-8e6d-c060728836b4';
  
  console.log('Triggering report generation for scan:', scanRequestId);
  
  const reportQueue = new Queue('report-generation', { connection });
  
  const reportJob = await reportQueue.add('generate', {
    scanRequestId,
    company: 'Snowplow',
    domain: 'snowplow.io',
    investmentThesis: 'accelerate-organic-growth'
  });
  
  console.log('Report job added:', reportJob.id);
  
  await connection.quit();
  process.exit(0);
}

triggerReport();