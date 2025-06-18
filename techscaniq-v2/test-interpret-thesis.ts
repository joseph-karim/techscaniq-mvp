import { interpretThesisNode } from './src/orchestrator/nodes/interpretThesis';
import { ResearchState } from './src/types';

async function testInterpretThesis() {
  console.log('Testing thesis interpretation...\n');

  const testState: ResearchState = {
    thesis: {
      id: 'test-thesis-123',
      company: 'Fidelity Canada',
      website: 'https://www.fidelity.ca',
      type: 'custom' as any,
      customThesis: 'Sales Intelligence Analysis: Evaluate Fidelity Canada as a potential customer for Interad\'s digital agency services',
      statement: 'Sales Intelligence Analysis',
      pillars: [
        {
          id: 'tech-architecture',
          name: 'Technology & Architecture',
          weight: 0.3,
          keyTerms: ['technology', 'infrastructure', 'digital'],
        }
      ],
      successCriteria: [],
      riskFactors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    evidence: [],
    questions: [],
    report: {
      content: '',
      sections: [],
      citations: []
    },
    status: 'interpreting_thesis' as any,
    iterationCount: 0,
    evidenceCount: 0,
    metadata: {
      reportType: 'sales-intelligence'
    }
  };

  try {
    console.log('Starting interpretation...');
    const startTime = Date.now();
    
    const result = await interpretThesisNode(testState);
    
    const duration = Date.now() - startTime;
    console.log(`\nInterpretation completed in ${duration}ms`);
    console.log('\nResult:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Interpretation failed:', error);
  }
}

testInterpretThesis().catch(console.error);