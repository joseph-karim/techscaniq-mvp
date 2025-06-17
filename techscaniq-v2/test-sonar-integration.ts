import { config as dotenvConfig } from 'dotenv';
import { sonarResearch } from './src/tools/sonarDeepResearch';

// Load environment variables
dotenvConfig();

async function testSonarIntegration() {
  console.log('🧪 Testing Sonar Deep Research Integration\n');
  
  // Test company
  const company = 'Stripe';
  const website = 'https://stripe.com';
  const thesisType = 'accelerate-growth';
  
  try {
    // 1. Submit research request
    console.log(`📚 Submitting deep research request for ${company}...`);
    console.log(`   Reasoning effort: HIGH (maximum depth)`);
    
    const jobId = await sonarResearch.submitResearch(
      company,
      website,
      thesisType,
      [
        'API ecosystem and developer adoption metrics',
        'Payment processing market share and growth',
        'Recent product launches and innovations',
        'Competitive positioning vs Square, PayPal, Adyen'
      ]
    );
    
    console.log(`✅ Job submitted: ${jobId}\n`);
    
    // 2. Wait for completion
    console.log('⏳ Waiting for research to complete (this may take 2-5 minutes)...');
    
    const result = await sonarResearch.waitForCompletion(jobId, 300000, 5000); // 5 min timeout, 5s polls
    
    // 3. Display results summary
    console.log('\n📊 Research Results:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Search queries executed: ${result.response?.usage.num_search_queries}`);
    console.log(`   Reasoning tokens used: ${result.response?.usage.reasoning_tokens}`);
    console.log(`   Citations found: ${result.response?.citations.length}`);
    
    // 4. Calculate cost
    const cost = sonarResearch.calculateCost(result.response?.usage);
    console.log(`   Total cost: $${cost.toFixed(2)}\n`);
    
    // 5. Parse to evidence
    console.log('🔄 Converting to evidence format...');
    const evidence = sonarResearch.parseToEvidence(result);
    console.log(`   Evidence items created: ${evidence.length}`);
    
    // 6. Extract insights
    const insights = sonarResearch.extractInsights(result);
    console.log('\n💡 Key Market Insights:');
    console.log(`   TAM: ${insights?.tam.size}`);
    console.log(`   Market Growth: ${insights?.tam.growth}`);
    console.log(`   Competitors: ${insights?.competitors.map(c => c.name).join(', ')}`);
    console.log(`   Revenue: ${insights?.financials.revenue || 'Not disclosed'}`);
    console.log(`   Risks: ${insights?.risks.length} identified`);
    console.log(`   Opportunities: ${insights?.opportunities.length} identified`);
    
    // 7. Sample evidence
    console.log('\n📄 Sample Evidence (first 3 items):');
    evidence.slice(0, 3).forEach((e, i) => {
      console.log(`\n${i + 1}. ${e.metadata?.section}`);
      console.log(`   Content: ${e.content.substring(0, 150)}...`);
      console.log(`   Quality: ${e.qualityScore.overall}`);
      console.log(`   Source: ${e.source.url || 'Perplexity synthesis'}`);
    });
    
    // 8. Save sample output
    const fs = await import('fs/promises');
    await fs.writeFile(
      'sonar-test-output.json',
      JSON.stringify({
        jobId,
        company,
        cost,
        usage: result.response?.usage,
        insights,
        evidenceCount: evidence.length,
        sampleEvidence: evidence.slice(0, 5),
      }, null, 2)
    );
    
    console.log('\n✅ Test completed! Full output saved to sonar-test-output.json');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testSonarIntegration().catch(console.error);