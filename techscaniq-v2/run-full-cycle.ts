// Set API key before any imports
process.env.ANTHROPIC_API_KEY = process.argv[2] || process.env.ANTHROPIC_API_KEY || '';
process.env.ENABLE_CRAWL4AI = 'true';
process.env.ENABLE_OPERATOR = 'false';

console.log('Environment setup complete. API key present:', !!process.env.ANTHROPIC_API_KEY);

import { createResearchGraph } from './src/orchestrator/graph';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';

async function main() {
  console.log('📊 Starting Fidelity Canada sales intelligence analysis...\n');
  
  const graph = createResearchGraph();
  
  const initialState = {
    thesis: {
      id: uuidv4(),
      company: 'Fidelity Canada',
      website: 'https://www.fidelity.ca',
      type: 'custom' as const,
      customThesis: 'Sales Intelligence Analysis: Evaluate Fidelity Canada as a potential customer for Interad\'s digital agency services, focusing on their technology needs, digital transformation initiatives, and alignment with our offerings.',
      statement: '',
      pillars: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    evidence: [],
    questions: [],
    report: { content: '', sections: [], citations: [] },
    status: 'interpreting_thesis' as const,
    iterationCount: 0,
    evidenceCount: 0,
    metadata: {
      scanId: '532c3609-788e-45c7-9879-29ab59289ed5',
      reportType: 'sales-intelligence',
      currentQueries: {},
      lastEvidenceGathering: undefined,
      lastQualityEvaluation: undefined,
      salesContext: {
        vendor: 'Interad',
        target: 'Fidelity Canada',
        offering: 'Full-service digital agency',
        evaluationTimeline: 'Q1-Q2 2025',
        company: 'Fidelity Canada',
        budgetRange: { min: 250, max: 2000, currency: 'USD' },
        useCases: [
          'Develop secure online financial tools and calculators',
          'Build compliant online account application forms',
          'Create mobile apps for customer engagement',
          'Implement accessibility compliance for AODA requirements',
          'Modernize legacy web interfaces with responsive UX/UI design'
        ],
        differentiators: [
          'Decades of experience with Canadian financial institutions',
          'Developed hundreds of financial calculators and tools',
          'AODA-certified team ensuring full accessibility compliance',
          '95% local Toronto team enabling close collaboration'
        ],
        decisionCriteria: [
          'Deep expertise in financial services sector',
          'Strong security and compliance track record',
          'WCAG/AODA accessibility certification',
          'Local Toronto presence for close collaboration'
        ],
        competitiveAlternatives: [
          'Accenture Interactive',
          'Deloitte Digital',
          'IBM iX',
          'Publicis Sapient'
        ],
        valueProposition: 'Interad brings 30 years of financial services expertise with proven success at major Canadian banks (including Big Five), specialized financial tool development (hundreds delivered), strong security/compliance understanding, and local Toronto presence for hands-on partnership.',
        idealCustomerProfile: {
          industry: 'Financial Services',
          geography: 'Canada (Toronto/Ontario region)',
          companySize: 'Large Enterprise (1000+ employees)'
        }
      }
    },
    errors: [],
    queuedJobs: []
  };

  try {
    console.log('🔄 Running graph with enhanced evidence gathering...');
    const finalState = await graph.invoke(initialState, {
      recursionLimit: 50,
      callbacks: [{
        onNodeStart: async ({ name }) => {
          console.log(`\n🔹 Starting node: ${name}`);
        },
        onNodeFinish: async ({ name }) => {
          console.log(`✅ Completed node: ${name}`);
        }
      }]
    });
    
    console.log('\n✅ Research completed!');
    console.log(`Evidence collected: ${finalState.evidenceCount}`);
    console.log(`Report length: ${finalState.report.content.length} characters`);
    
    // Save the report
    if (finalState.report.content) {
      const reportPath = `./fidelity-canada-report-${Date.now()}.md`;
      await fs.writeFile(reportPath, finalState.report.content);
      console.log(`\n📄 Report saved to: ${reportPath}`);
    }
    
    // Save the final state for debugging
    const statePath = `./fidelity-canada-state-${Date.now()}.json`;
    await fs.writeFile(statePath, JSON.stringify(finalState, null, 2));
    console.log(`📊 State saved to: ${statePath}`);
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
  }
}

main().catch(console.error);