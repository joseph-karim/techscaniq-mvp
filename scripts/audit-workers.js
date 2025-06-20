const fs = require('fs');
const path = require('path');

const workers = [
  'report-generation-worker-v2.ts',
  'report-generation-worker-v3.ts', 
  'evidence-collection-worker-jina.ts'
];

workers.forEach(worker => {
  console.log(`\n=== Checking usage of ${worker} ===`);
  
  // Check imports
  const importCommand = `grep -r "import.*${worker.replace('.ts', '')}" src/`;
  console.log('Import check:', importCommand);
  
  // Check package.json references
  const packageJson = fs.readFileSync('package.json', 'utf8');
  if (packageJson.includes(worker)) {
    console.log('❌ Found in package.json');
  } else {
    console.log('✅ Not in package.json');
  }
  
  // Check if file exists
  const workerPath = `src/workers/${worker}`;
  if (fs.existsSync(workerPath)) {
    console.log('📁 File exists');
    // Check last modified
    const stats = fs.statSync(workerPath);
    console.log('Last modified:', stats.mtime);
  } else {
    console.log('❌ File not found');
  }
});