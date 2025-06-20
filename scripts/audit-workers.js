import fs from 'fs';
import path from 'path';

const workers = [
  'report-generation-worker-v2.ts',
  'report-generation-worker-v3.ts',
  'evidence-collection-worker-jina.ts'
];

console.log('=== Legacy Worker Audit ===\n');

workers.forEach(worker => {
  console.log(`\n=== Checking usage of ${worker} ===`);
  
  // Check if file exists
  const workerPath = path.join('src/workers', worker);
  if (fs.existsSync(workerPath)) {
    console.log('📁 File exists');
    // Check last modified
    const stats = fs.statSync(workerPath);
    console.log('Last modified:', stats.mtime);
  } else {
    console.log('❌ File not found');
  }
  
  // Check package.json references
  const packageJson = fs.readFileSync('package.json', 'utf8');
  if (packageJson.includes(worker.replace('.ts', ''))) {
    console.log('❌ Found in package.json');
  } else {
    console.log('✅ Not in package.json');
  }
});

console.log('\n=== Checking queue-config.ts for actual usage ===');
if (fs.existsSync('src/config/queue-config.ts')) {
  const queueConfig = fs.readFileSync('src/config/queue-config.ts', 'utf8');
  console.log('\nWorkers configured in queue-config.ts:');
  const workerPattern = /workerPath:[^']*'([^']+)'/g;
  let match;
  while ((match = workerPattern.exec(queueConfig)) !== null) {
    console.log('  -', match[1]);
  }
}

console.log('\n=== Modern LangGraph v4 Worker Status ===');
const modernWorker = 'src/workers/report-generation-worker-langgraph-v4-backend.ts';
if (fs.existsSync(modernWorker)) {
  console.log('✅ LangGraph v4 worker exists');
  const stats = fs.statSync(modernWorker);
  console.log('Last modified:', stats.mtime);
} else {
  console.log('❌ LangGraph v4 worker not found');
}

console.log('\n=== Python Backend Status ===');
if (fs.existsSync('techscaniq-v2/backend/main.py')) {
  console.log('✅ Python backend exists');
} else {
  console.log('❌ Python backend not found');
}