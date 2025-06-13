#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();
import { startAllWorkers, stopAllWorkers } from './src/services/queue/workers';
import { config } from './src/config';

async function testWorkerStartup() {
  console.log('🧪 Testing Worker Startup...\n');

  try {
    console.log(`📡 Redis configuration: ${config.REDIS_HOST}:${config.REDIS_PORT}`);
    console.log(`🔧 Queue mode: ${config.USE_QUEUES ? 'Enabled' : 'Disabled'}\n`);

    // Start workers
    console.log('🚀 Starting workers...');
    const workers = await startAllWorkers();
    
    console.log('\n✅ Workers started successfully:');
    Object.keys(workers).forEach(name => {
      console.log(`  - ${name} worker`);
    });

    // Wait a moment
    console.log('\n⏳ Workers running for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Stop workers
    console.log('\n🛑 Stopping workers...');
    await stopAllWorkers();

    console.log('\n✅ Worker startup test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Worker startup test failed:', error);
    process.exit(1);
  }
}

// Run the test
testWorkerStartup().catch(console.error);