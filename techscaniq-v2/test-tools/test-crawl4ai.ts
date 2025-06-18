import { EvidenceCollectorIntegration } from '../src/tools/evidenceCollectorIntegration';
import { spawn } from 'child_process';
import path from 'path';

async function testCrawl4AIPythonScript() {
  console.log('🐍 Testing Crawl4AI Python script availability...\n');
  
  // First check if Python and required packages are installed
  try {
    // Check Python version
    await new Promise((resolve, reject) => {
      const pythonCheck = spawn('python3', ['--version']);
      pythonCheck.stdout.on('data', (data) => {
        console.log(`✅ Python version: ${data.toString().trim()}`);
      });
      pythonCheck.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error('Python3 not found'));
      });
    });

    // Check if crawl4ai is installed
    await new Promise((resolve, reject) => {
      const pipCheck = spawn('python3', ['-c', 'import crawl4ai; print(crawl4ai.__version__)']);
      pipCheck.stdout.on('data', (data) => {
        console.log(`✅ Crawl4AI version: ${data.toString().trim()}`);
      });
      pipCheck.stderr.on('data', (data) => {
        if (data.toString().includes('ModuleNotFoundError')) {
          console.log('❌ Crawl4AI not installed. Install with: pip install crawl4ai');
        }
      });
      pipCheck.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error('Crawl4AI not installed'));
      });
    });

  } catch (error) {
    console.error('❌ Python environment check failed:', error);
    console.log('\n📝 To install required dependencies:');
    console.log('1. Install Python 3.8+');
    console.log('2. Run: pip install -r src/workers/requirements.txt');
    return;
  }
}

async function testCrawl4AIIntegration() {
  console.log('\n🕷️ Testing Crawl4AI Integration...\n');
  
  const collector = new EvidenceCollectorIntegration();
  const testUrl = 'https://www.fidelity.ca';
  const thesis = 'Evaluate Fidelity Canada as a prospect for digital agency services';

  console.log(`Testing ${testUrl}`);
  console.log(`Thesis: ${thesis}`);
  console.time('Crawl4AI collection');
  
  try {
    // Test with limited pages for speed
    const evidence = await collector.collectWithCrawl4AI(testUrl, thesis, 5);
    console.timeEnd('Crawl4AI collection');
    
    console.log(`\n✅ Collection successful!`);
    console.log(`Evidence collected: ${evidence.length} pieces`);
    
    // Show sample evidence
    if (evidence.length > 0) {
      console.log('\n📄 Sample evidence:');
      evidence.slice(0, 3).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.source.name}`);
        console.log(`   URL: ${item.source.url}`);
        console.log(`   Relevance: ${item.metadata.relevanceScore}`);
        console.log(`   Content preview: ${item.content.substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.timeEnd('Crawl4AI collection');
    console.error('❌ Error:', error);
    
    if (error.message.includes('ENOENT')) {
      console.log('\n❗ Python script not found at expected location');
      console.log('Please ensure crawl4ai_documented_deep.py exists in src/workers/');
    }
  }
}

async function testAll() {
  await testCrawl4AIPythonScript();
  await testCrawl4AIIntegration();
}

// Run the tests
testAll().catch(console.error);