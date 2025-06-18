// Load environment variables FIRST
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load from the main .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Now import the rest
import { runDeepResearch } from '../src/orchestrator/graph';
import { StorageService } from '../src/services/storage';

async function main() {
  console.log('🚀 Running research graph directly for Fidelity Canada...\n');
  
  // Verify environment variables are loaded
  console.log('Environment check:');
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓ Found' : '✗ Missing'}`);
  console.log(`  GOOGLE_AI_API_KEY: ${process.env.GOOGLE_AI_API_KEY ? '✓ Found' : '✗ Missing'}\n`);
  
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
    console.log('   This may take 10-15 minutes to complete...\n');
    
    // Run the research directly with sales intelligence context
    const result = await runDeepResearch(
      existingState.thesis.company,
      existingState.thesis.website,
      'sales-intelligence', // Force sales intelligence type
      'Sales Intelligence Analysis: Evaluate Fidelity Canada as a prospect for Interad\'s digital agency services',
      existingState.metadata // Pass the full metadata including sales context
    );
    
    console.log('\n✅ Research completed!');
    console.log(`   Evidence collected: ${result.evidence?.length || 0}`);
    console.log(`   Final status: ${result.status}`);
    console.log(`   Iterations: ${result.iterationCount}`);
    
    if (result.evidence && result.evidence.length > 0) {
      console.log('\n📊 Evidence Summary:');
      result.evidence.slice(0, 5).forEach((ev, idx) => {
        console.log(`   ${idx + 1}. ${ev.title || ev.query || 'Evidence piece'}`);
      });
      if (result.evidence.length > 5) {
        console.log(`   ... and ${result.evidence.length - 5} more pieces`);
      }
    }
    
    // Save the results with the original research ID
    const finalState = {
      ...result,
      thesis: {
        ...result.thesis,
        id: researchId, // Keep the original ID
      }
    };
    
    await storage.saveResearchState(researchId, finalState);
    
    console.log('\n📊 Results saved to state file');
    console.log(`   Path: data/states/research_state_${researchId}.json`);
    
    // Update the scan in the database
    if (existingState.metadata?.scanId) {
      console.log('\n📈 Updating scan in database...');
      // We'll need to update the scan via API or direct DB access
      console.log(`   Scan ID: ${existingState.metadata.scanId}`);
    }
    
  } catch (error) {
    console.error('\n❌ Research failed:', error);
    console.error('Stack trace:', error.stack);
    
    // Check for specific error types
    if (error.message?.includes('API key')) {
      console.error('\n⚠️  API key issue detected. Please check your .env file.');
    }
  }
}

// Run it
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});