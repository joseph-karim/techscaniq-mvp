#!/bin/bash
cd /Users/josephkarim/techscaniq-mvp/techscaniq-v2

# Load environment variables
export ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
export ENABLE_CRAWL4AI="true"
export ENABLE_OPERATOR="false"
export ENABLE_SKYVERN="false"

echo "🚀 Running orchestration with environment variables set..."
echo "API Key present: $([ -n "$ANTHROPIC_API_KEY" ] && echo "Yes" || echo "No")"

# Create a temporary script that runs the orchestration
cat > /tmp/run-orchestration-temp.ts << 'EOF'
import { createResearchGraph } from '../src/orchestrator/graph';
import { v4 as uuidv4 } from 'uuid';

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
        evaluationTimeline: 'Q1-Q2 2025'
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
      const fs = await import('fs/promises');
      const reportPath = `/tmp/fidelity-canada-report-${Date.now()}.md`;
      await fs.writeFile(reportPath, finalState.report.content);
      console.log(`\n📄 Report saved to: ${reportPath}`);
    }
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
  }
}

main().catch(console.error);
EOF

npx tsx /tmp/run-orchestration-temp.ts