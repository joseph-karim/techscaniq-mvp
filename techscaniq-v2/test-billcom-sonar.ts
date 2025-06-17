import { config as dotenvConfig } from 'dotenv';
import { sonarResearch } from './src/tools/sonarDeepResearch';

// Load environment variables
dotenvConfig();

async function testBillComResearch() {
  console.log('🧪 Testing Sonar Deep Research Integration for Bill.com\n');
  
  // Test company: Bill.com
  const company = 'Bill.com';
  const website = 'https://bill.com';
  const thesisType = 'accelerate-growth';
  
  try {
    // 1. Submit research request
    console.log(`📚 Submitting deep research request for ${company}...`);
    console.log(`   Website: ${website}`);
    console.log(`   Thesis type: ${thesisType}`);
    console.log(`   Reasoning effort: HIGH (maximum depth)`);
    console.log(`   Focus areas:`);
    console.log(`   - SMB financial automation market size and growth`);
    console.log(`   - Competitive positioning vs Intuit, SAP, Oracle`);
    console.log(`   - API ecosystem and integrations`);
    console.log(`   - Recent acquisitions and product expansion\n`);
    
    const jobId = await sonarResearch.submitResearch(
      company,
      website,
      thesisType,
      [
        'SMB financial automation and AP/AR market size and growth trends',
        'Competitive positioning vs QuickBooks, NetSuite, SAP Concur, Coupa',
        'API ecosystem, developer adoption, and integration partnerships',
        'Recent acquisitions (Divvy, Invoice2go) and product expansion strategy',
        'Revenue growth, take rate, payment volume metrics',
        'Customer acquisition costs and net retention rates',
        'AI/ML capabilities for invoice processing and fraud detection',
        'International expansion plans and regulatory compliance'
      ]
    );
    
    console.log(`✅ Job submitted: ${jobId}\n`);
    
    // 2. Wait for completion
    console.log('⏳ Waiting for research to complete (this may take 2-5 minutes)...');
    console.log('   Bill.com is a complex fintech with multiple products, so this may take longer.\n');
    
    const startTime = Date.now();
    const result = await sonarResearch.waitForCompletion(jobId, 600000, 10000); // 10 min timeout, 10s polls
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    // 3. Display results summary
    console.log('\n📊 Research Results:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Search queries executed: ${result.response?.usage.num_search_queries}`);
    console.log(`   Reasoning tokens used: ${result.response?.usage.reasoning_tokens.toLocaleString()}`);
    console.log(`   Total tokens: ${result.response?.usage.total_tokens.toLocaleString()}`);
    console.log(`   Citations found: ${result.response?.citations.length}`);
    
    // 4. Calculate cost
    const cost = sonarResearch.calculateCost(result.response?.usage);
    console.log(`   Total cost: $${cost.toFixed(2)}\n`);
    
    // 5. Parse to evidence
    console.log('🔄 Converting to evidence format...');
    const evidence = sonarResearch.parseToEvidence(result);
    console.log(`   Evidence items created: ${evidence.length}`);
    
    // Group evidence by section
    const evidenceBySection: Record<string, number> = {};
    evidence.forEach(e => {
      const section = e.metadata?.section || 'Unknown';
      evidenceBySection[section] = (evidenceBySection[section] || 0) + 1;
    });
    
    console.log('\n📂 Evidence by section:');
    Object.entries(evidenceBySection).forEach(([section, count]) => {
      console.log(`   ${section}: ${count} items`);
    });
    
    // 6. Extract insights
    const insights = sonarResearch.extractInsights(result);
    console.log('\n💡 Key Market Insights:');
    console.log(`   TAM: ${insights?.tam.size || 'Not found'}`);
    console.log(`   Market Growth: ${insights?.tam.growth || 'Not found'}`);
    console.log(`   Key Competitors: ${insights?.competitors.map(c => c.name).join(', ') || 'Not found'}`);
    console.log(`   Revenue: ${insights?.financials.revenue || 'Not disclosed'}`);
    console.log(`   Growth Rate: ${insights?.financials.growth || 'Not found'}`);
    console.log(`   Funding: ${insights?.financials.funding || 'Not found'}`);
    console.log(`   Risks identified: ${insights?.risks.length || 0}`);
    console.log(`   Opportunities identified: ${insights?.opportunities.length || 0}`);
    
    // 7. Sample evidence - show more detailed examples
    console.log('\n📄 Sample Evidence (top 5 most relevant):');
    const sortedEvidence = evidence.sort((a, b) => 
      (b.qualityScore.overall - a.qualityScore.overall)
    );
    
    sortedEvidence.slice(0, 5).forEach((e, i) => {
      console.log(`\n${i + 1}. [${e.metadata?.section}]`);
      console.log(`   Content: ${e.content.substring(0, 200)}...`);
      console.log(`   Quality: ${(e.qualityScore.overall * 100).toFixed(0)}%`);
      console.log(`   Source: ${e.source.url || 'Perplexity synthesis'}`);
    });
    
    // 8. Show some specific insights if found
    const fullContent = result.response?.choices[0]?.message.content || '';
    
    // Try to extract specific metrics
    console.log('\n📈 Specific Metrics Found:');
    const revenueMatch = fullContent.match(/revenue.*?\$[\d.]+[BMK]/i);
    const growthMatch = fullContent.match(/grow.*?(\d+%)/i);
    const customerMatch = fullContent.match(/(\d+[,\d]*)\s*(?:customers|businesses|SMBs)/i);
    const paymentVolumeMatch = fullContent.match(/payment volume.*?\$[\d.]+[BMK]/i);
    
    if (revenueMatch) console.log(`   ${revenueMatch[0]}`);
    if (growthMatch) console.log(`   Growth rate: ${growthMatch[1]}`);
    if (customerMatch) console.log(`   Customer base: ${customerMatch[0]}`);
    if (paymentVolumeMatch) console.log(`   ${paymentVolumeMatch[0]}`);
    
    // 9. Save full output
    const fs = await import('fs/promises');
    const outputData = {
      jobId,
      company,
      website,
      duration,
      cost,
      usage: result.response?.usage,
      insights,
      evidenceCount: evidence.length,
      evidenceBySection,
      sampleEvidence: sortedEvidence.slice(0, 10),
      fullResponse: fullContent.substring(0, 5000) + '...' // First 5k chars
    };
    
    await fs.writeFile(
      'billcom-sonar-output.json',
      JSON.stringify(outputData, null, 2)
    );
    
    console.log('\n✅ Test completed! Full output saved to billcom-sonar-output.json');
    console.log('\n🎯 Next steps:');
    console.log('   1. Use these market insights to guide technical deep-dive');
    console.log('   2. Focus technical analysis on differentiators vs competitors');
    console.log('   3. Validate claims about AI/ML capabilities in their tech stack');
    console.log('   4. Investigate API quality compared to market leaders');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error && error.message.includes('fetch')) {
      console.error('\n💡 Tip: Make sure your PERPLEXITY_API_KEY is valid and has access to Sonar Deep Research');
    }
    throw error;
  }
}

// Run the test
testBillComResearch().catch(console.error);