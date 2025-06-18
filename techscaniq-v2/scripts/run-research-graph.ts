import { runDeepResearch } from '../src/orchestrator/graph';
import { StorageService } from '../src/services/storage';
import { config } from '../src/config';

// Disable queues
process.env.USE_QUEUES = 'false';

async function main() {
  console.log('🚀 Running research graph directly for Fidelity Canada...\n');
  
  const storage = new StorageService();
  
  // Get the existing research state
  const researchId = '8e385c88-9ecc-4816-bd37-ccbce21db92b';
  const existingState = await storage.loadResearchState(researchId);
  
  if (!existingState) {
    console.error('❌ Could not find research state');
    return;
  }
  
  console.log('✅ Found research state:');
  console.log(`   Company: ${existingState.thesis.company}`);
  console.log(`   Status: ${existingState.status}`);
  console.log(`   Type: ${existingState.thesis.type}\n`);
  
  try {
    console.log('📊 Starting research processing...');
    
    // Run the research directly
    const result = await runDeepResearch(
      existingState.thesis.company,
      existingState.thesis.website,
      existingState.thesis.type,
      existingState.thesis.customThesis
    );
    
    console.log('\n✅ Research completed!');
    console.log(`   Evidence collected: ${result.evidence?.length || 0}`);
    console.log(`   Final status: ${result.status}`);
    console.log(`   Iterations: ${result.iterationCount}`);
    
    // Save the results
    await storage.saveResearchState(researchId, result);
    
    console.log('\n📊 Results saved to state file');
    console.log(`   Path: data/states/research_state_${researchId}.json`);
    
  } catch (error) {
    console.error('❌ Research failed:', error);
  }
}

// Run it
main().catch(console.error);