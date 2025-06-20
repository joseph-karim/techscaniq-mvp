import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove legacy scripts
const scriptsToRemove = [
  'worker:evidence',  // uses jina
  'worker:report',    // uses v3
  'worker:report:v2',
  'worker:report:claude',      // Likely also legacy
  'worker:report:langgraph',   // v2 version
  'worker:report:langgraph:mcp', // v3 version
  'workers:all',      // uses jina and v3
];

scriptsToRemove.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`Removing script: ${script}`);
    delete packageJson.scripts[script];
  }
});

// Update scripts to use modern workers
const updatedScripts = {
  // Evidence collection - use crawl4ai as active
  'worker:evidence:active': 'tsx src/workers/evidence-collection-worker-crawl4ai.ts',
  
  // Report generation - use langgraph v4 with backend
  'worker:report:active': 'tsx src/workers/report-generation-worker-langgraph-v4-backend.ts',
  
  // Combined workers - modern stack
  'workers:modern': 'concurrently "npm run worker:evidence:active" "npm run worker:report:active"',
  
  // Development with backend
  'dev:modern': 'concurrently "npm run backend:start" "npm run api:server" "npm run workers:modern"',
  
  // Start everything (frontend + backend + workers)
  'start:all': './scripts/start-with-backend.sh'
};

// Apply updates
Object.assign(packageJson.scripts, updatedScripts);

// Clean up old dev:api commands
const oldDevScripts = ['dev:api:deep', 'dev:api:crawl4ai'];
oldDevScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`Removing old dev script: ${script}`);
    delete packageJson.scripts[script];
  }
});

// Update dev:api commands to use modern workers
packageJson.scripts['dev:api'] = 'concurrently "npm run api:server" "npm run workers:modern"';

// Write back to package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');

console.log('✅ Package.json scripts updated');
console.log('\nRemoved scripts:', scriptsToRemove);
console.log('\nAdded/Updated scripts:', Object.keys(updatedScripts));