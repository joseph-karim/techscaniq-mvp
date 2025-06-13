import { runDeepResearch } from './src/orchestrator/graph';

async function testDirectPipeline() {
  console.log('🚀 Testing TechScanIQ Pipeline Directly (without BullMQ)');
  
  const researchData = {
    company: 'Pendo',
    website: 'https://pendo.io',
    thesisType: 'accelerate-growth',
  };
  
  console.log(`\n📊 Starting research for ${researchData.company}`);
  console.log(`Website: ${researchData.website}`);
  console.log(`Thesis: ${researchData.thesisType}`);
  
  try {
    // Run the research directly using the graph
    const reportId = await runDeepResearch(
      researchData.company,
      researchData.website,
      researchData.thesisType
    );
    
    console.log('\n✅ Research completed!');
    console.log('Report ID:', reportId);
    
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testDirectPipeline().catch(console.error);