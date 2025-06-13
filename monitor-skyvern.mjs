#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const skyvernQueue = new Queue('skyvern-discovery', { connection });

async function monitorSkyvern() {
  console.log('=== SKYVERN DISCOVERY MONITOR ===\n');
  
  // Check queue status
  const [waiting, active, completed, failed] = await Promise.all([
    skyvernQueue.getWaitingCount(),
    skyvernQueue.getActiveCount(),
    skyvernQueue.getCompletedCount(),
    skyvernQueue.getFailedCount()
  ]);
  
  console.log('📊 Queue Status:');
  console.log(`  Waiting: ${waiting}`);
  console.log(`  Active: ${active}`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Failed: ${failed}`);
  
  // Get recent jobs
  const recentJobs = await skyvernQueue.getJobs(['completed', 'failed'], 0, 10);
  
  if (recentJobs.length > 0) {
    console.log('\n📋 Recent Jobs:');
    for (const job of recentJobs) {
      const status = await job.getState();
      console.log(`\n  Job ${job.id}:`);
      console.log(`    Status: ${status}`);
      console.log(`    URL: ${job.data.targetUrl}`);
      console.log(`    Mode: ${job.data.discoveryMode}`);
      
      if (job.returnvalue) {
        console.log(`    Evidence: ${job.returnvalue.evidenceCount || 0} items`);
        console.log(`    URLs: ${job.returnvalue.discoveredUrls || 0}`);
        console.log(`    APIs: ${job.returnvalue.apiEndpoints || 0}`);
        
        if (job.returnvalue.insights && job.returnvalue.insights.length > 0) {
          console.log(`    Insights:`);
          job.returnvalue.insights.forEach(insight => {
            console.log(`      - ${insight.type}: ${insight.finding}`);
          });
        }
      }
      
      if (job.failedReason) {
        console.log(`    Error: ${job.failedReason}`);
      }
    }
  }
  
  // Check recent Skyvern evidence in database
  const { data: skyvernEvidence, count } = await supabase
    .from('evidence_items')
    .select('*', { count: 'exact' })
    .eq('source', 'skyvern-discovery')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log(`\n🔍 Skyvern Evidence in Database: ${count || 0} total items`);
  
  if (skyvernEvidence && skyvernEvidence.length > 0) {
    console.log('\nRecent discoveries:');
    skyvernEvidence.forEach(item => {
      console.log(`  - [${item.evidence_type}] ${item.title}`);
      
      // Parse and show key discoveries
      try {
        const content = JSON.parse(item.content);
        if (content.discovered_url) {
          console.log(`    → ${content.discovered_url}`);
        }
      } catch (e) {
        // Ignore parse errors
      }
    });
  }
  
  await connection.quit();
}

monitorSkyvern().catch(console.error);