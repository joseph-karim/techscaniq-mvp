#!/usr/bin/env node
import dotenv from 'dotenv';
import { Queue } from 'bullmq';

dotenv.config();

async function checkJobProcessing() {
  const reportQueue = new Queue('report-generation', {
    connection: {
      host: 'localhost',
      port: 6379
    }
  });
  
  console.log('Checking recent jobs in report-generation queue...\n');
  
  // Get the last 10 jobs
  const jobs = await reportQueue.getJobs(['completed', 'failed'], 0, 10);
  
  console.log(`Found ${jobs.length} recent jobs:\n`);
  
  for (const job of jobs) {
    const state = await job.getState();
    console.log(`Job ${job.id}:`);
    console.log(`- Name: ${job.name}`);
    console.log(`- State: ${state}`);
    console.log(`- Created: ${new Date(job.timestamp).toLocaleString()}`);
    console.log(`- Data: ${JSON.stringify(job.data)}`);
    
    if (state === 'completed') {
      console.log(`- Result: ${JSON.stringify(job.returnvalue)}`);
    } else if (state === 'failed') {
      console.log(`- Error: ${job.failedReason}`);
    }
    
    console.log('---');
  }
  
  // Check if thesis-aligned jobs exist
  const thesisJobs = jobs.filter(j => j.name === 'generate-thesis-aligned-report');
  console.log(`\nThesis-aligned jobs found: ${thesisJobs.length}`);
  
  await reportQueue.close();
}

checkJobProcessing().catch(console.error);