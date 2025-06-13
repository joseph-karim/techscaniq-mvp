import { runStreamlinedResearch } from './src/orchestrator/streamlined-graph-simple';

async function testStreamlinedPipeline() {
  console.log('🚀 Testing Streamlined TechScanIQ Pipeline with Vector DB RAG');
  
  const researchData = {
    company: 'Pendo',
    website: 'https://pendo.io',
    thesisType: 'growth',
  };
  
  console.log(`\n📊 Starting research for ${researchData.company}`);
  console.log(`Website: ${researchData.website}`);
  console.log(`Thesis: ${researchData.thesisType}`);
  console.log('\nThis approach uses:');
  console.log('- Smart query generation');
  console.log('- Web search with Gemini grounding');
  console.log('- Vector store for semantic search');
  console.log('- RAG-based analysis');
  console.log('- Concise report generation\n');
  
  try {
    const report = await runStreamlinedResearch(
      researchData.company,
      researchData.website,
      researchData.thesisType
    );
    
    console.log('\n' + '='.repeat(80));
    console.log('INVESTMENT ASSESSMENT REPORT');
    console.log('='.repeat(80) + '\n');
    console.log(report);
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testStreamlinedPipeline().catch(console.error);