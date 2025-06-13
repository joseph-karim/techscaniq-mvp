import searchWorker from './searchWorker';
import analysisWorker from './analysisWorker';
import qualityWorker from './qualityWorker';
import orchestrationWorker from './orchestrationWorker';
import technicalWorker from './technicalWorker';
import { Worker } from 'bullmq';

// Export all workers
export const workers = {
  search: searchWorker,
  analysis: analysisWorker,
  quality: qualityWorker,
  orchestration: orchestrationWorker,
  technical: technicalWorker,
};

// Worker management
export async function startAllWorkers() {
  console.log('Starting all queue workers...');
  
  // Workers start automatically when imported
  // Log worker status
  Object.entries(workers).forEach(([name, worker]) => {
    console.log(`✅ ${name} worker started`);
  });
  
  return workers;
}

export async function stopAllWorkers() {
  console.log('Stopping all queue workers...');
  
  const stopPromises = Object.entries(workers).map(async ([name, worker]) => {
    try {
      await worker.close();
      console.log(`✅ ${name} worker stopped`);
    } catch (error) {
      console.error(`❌ Error stopping ${name} worker:`, error);
    }
  });
  
  await Promise.all(stopPromises);
  console.log('All workers stopped');
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down workers...');
  await stopAllWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down workers...');
  await stopAllWorkers();
  process.exit(0);
});