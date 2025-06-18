import { runDeepResearch } from './src/orchestrator/graph';

async function testSalesIntelligence() {
  try {
    console.log('Starting sales intelligence research for Fidelity Canada...');
    
    const result = await runDeepResearch(
      'Fidelity Investments Canada',
      'https://www.fidelity.ca',
      'custom',
      'Fidelity Canada represents a prime opportunity for Interads digital agency services',
      {
        reportType: 'sales-intelligence',
        vendorName: 'Interad',
        vendorProfile: {
          name: 'Interad',
          services: ['Web Development', 'Digital Marketing', 'Brand Strategy'],
          strengths: ['Financial sector experience', 'Enterprise solutions', 'Performance optimization']
        }
      }
    );
    
    console.log('Research completed:', result);
  } catch (error) {
    console.error('Research failed:', error);
  }
}

testSalesIntelligence();