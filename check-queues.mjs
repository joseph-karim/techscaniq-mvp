#!/usr/bin/env node
import Redis from 'ioredis';
import { Queue } from 'bullmq';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null,
});

async function checkQueues() {
  const queues = [
    'evidence-orchestrator',
    'evidence-collection', 
    'deep-searcher',
    'crawl4ai-extraction',
    'skyvern-discovery',
    'playwright-crawler',
    'webtech-analyzer',
    'security-scanner'
  ];

  for (const queueName of queues) {
    const queue = new Queue(queueName, { connection });
    
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();
    const delayed = await queue.getDelayedCount();
    
    console.log(`\n${queueName}:`);
    console.log(`  Waiting: ${waiting}`);
    console.log(`  Active: ${active}`);
    console.log(`  Completed: ${completed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Delayed: ${delayed}`);
    
    // Get sample of waiting jobs
    if (waiting > 0) {
      const jobs = await queue.getWaiting(0, 2);
      console.log('  Sample waiting jobs:');
      jobs.forEach(job => {
        console.log(`    - Job ${job.id}: ${job.name || 'unnamed'}`);
      });
    }
  }
  
  await connection.quit();
}

checkQueues().catch(console.error);