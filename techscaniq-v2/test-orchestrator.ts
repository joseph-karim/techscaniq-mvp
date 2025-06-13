import { runDeepResearch } from './src/orchestrator/graph';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig({ path: '../.env.local' });

async function testOrchestrator() {
  console.log('🚀 Testing TechScanIQ 2.0 Orchestrator...\n');
  
  try {
    const company = 'Snowplow';
    const website = 'https://snowplow.io';
    const thesisType = 'accelerate-growth';
    
    console.log(`Company: ${company}`);
    console.log(`Website: ${website}`);
    console.log(`Thesis Type: ${thesisType}`);
    console.log('\n' + '='.repeat(50) + '\n');
    
    const reportId = await runDeepResearch(company, website, thesisType);
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Research completed! Report ID: ${reportId}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testOrchestrator().catch(console.error);