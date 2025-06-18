import { runResearch } from '../src/orchestrator/graph';
import { v4 as uuidv4 } from 'uuid';

// Set environment variables
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
process.env.ENABLE_CRAWL4AI = 'true';
process.env.ENABLE_OPERATOR = 'false';

async function main() {
  console.log('🚀 Running orchestration directly for Fidelity Canada...\n');
  
  const scanRequestId = '532c3609-788e-45c7-9879-29ab59289ed5';
  
  try {
    const thesis = {
      id: uuidv4(),
      company: 'Fidelity Canada',
      website: 'https://www.fidelity.ca',
      type: 'custom' as const,
      customThesis: 'Sales Intelligence Analysis: Evaluate Fidelity Canada as a potential customer for Interad\'s digital agency services, focusing on their technology needs, digital transformation initiatives, and alignment with our offerings.',
      statement: '',
      pillars: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await runResearch(thesis, {
      metadata: {
        scanId: scanRequestId,
        reportType: 'sales-intelligence',
        salesContext: {
          vendor: 'Interad',
          target: 'Fidelity Canada',
          offering: 'Full-service digital agency providing end-to-end web and mobile solutions',
          evaluationTimeline: 'Q1-Q2 2025'
        }
      }
    });
    
    console.log('\n✅ Orchestration completed!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
  }
}

main().catch(console.error);