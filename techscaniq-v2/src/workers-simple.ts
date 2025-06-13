#!/usr/bin/env node

// Load environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { startAllWorkers } from './services/queue/workers/index';
import { getAllQueueStatuses, cleanQueues } from './services/queue/index';
import { config } from './config';

async function main() {
  console.log('🚀 Starting TechScanIQ Queue Workers...');
  console.log(`📡 Redis: ${config.REDIS_HOST}:${config.REDIS_PORT}`);
  
  try {
    // Start all workers
    const workers = await startAllWorkers();
    console.log(`✅ Started ${Object.keys(workers).length} workers`);
    
    // Monitor queue status every 30 seconds
    setInterval(async () => {
      try {
        const statuses = await getAllQueueStatuses();
        console.log('\n📊 Queue Status:');
        statuses.forEach((status: any) => {
          console.log(`  ${status.name}: ${status.waiting} waiting, ${status.active} active, ${status.completed} completed, ${status.failed} failed`);
        });
      } catch (error) {
        console.error('Error getting queue status:', error);
      }
    }, 30000);
    
    // Clean old jobs every hour
    setInterval(async () => {
      try {
        await cleanQueues();
        console.log('🧹 Cleaned old jobs from queues');
      } catch (error) {
        console.error('Error cleaning queues:', error);
      }
    }, 3600000);
    
    console.log('\n✅ Workers are running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('\n📛 SIGTERM received, shutting down gracefully...');
});

process.on('SIGINT', () => {
  console.log('\n📛 SIGINT received, shutting down gracefully...');
});

// Start the workers
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});