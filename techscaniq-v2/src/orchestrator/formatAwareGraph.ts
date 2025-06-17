import { StateGraph, StateGraphArgs } from '@langchain/langgraph';
import { ResearchState } from '../types';

// Import standard nodes
import { interpretThesisNode } from './nodes/interpretThesis';
import { generateQueriesNode } from './nodes/generateQueries';
import { gatherEvidenceNode } from './nodes/gatherEvidence';
import { evaluateQualityNode } from './nodes/evaluateQuality';
import { reflectAndRefineNode } from './nodes/reflectAndRefine';

// Import format-aware and market-aware nodes
import { generateReportFormatAwareNode } from './nodes/generateReportFormatAware';
import { evaluateQualityMarketAwareNode } from './nodes/evaluateQualityMarketAware';
import { reflectAndRefineMarketAwareNode } from './nodes/reflectAndRefineMarketAware';

// Import Sonar integration
import { sonarResearchNode, sonarResultsNode } from './nodes/sonarResearch';

import { config, thresholds } from '../config';

// Define the workflow
const graphState: StateGraphArgs<ResearchState>['channels'] = {
  // Input
  thesis: {
    value: (old: any, next: any) => next ?? old,
    default: () => ({
      statement: '',
      company: '',
      pillars: [],
      successCriteria: [],
    }),
  },
  
  // Processing state
  researchQuestions: {
    value: (old: any, next: any) => next ?? old,
    default: () => [],
  },
  evidence: {
    value: (old: any[], next: any[]) => next ?? old,
    default: () => [],
  },
  qualityScores: {
    value: (old: any, next: any) => ({ ...(old || {}), ...(next || {}) }),
    default: () => ({}),
  },
  reportSections: {
    value: (old: any, next: any) => ({ ...(old || {}), ...(next || {}) }),
    default: () => ({}),
  },
  citations: {
    value: (old: any, next: any) => next ?? old,
    default: () => [],
  },
  
  // Market intelligence state
  sonarJobId: {
    value: (old: any, next: any) => next ?? old,
    default: () => undefined,
  },
  sonarInsights: {
    value: (old: any, next: any) => next ?? old,
    default: () => undefined,
  },
  
  // Control flow
  status: {
    value: (old: any, next: any) => next ?? old,
    default: () => 'initializing',
  },
  iterationCount: {
    value: (old: number, next: number) => next ?? old,
    default: () => 0,
  },
  maxIterations: {
    value: (old: any, next: any) => next ?? old,
    default: () => config.MAX_RESEARCH_ITERATIONS || 3,
  },
  
  // Metadata
  metadata: {
    value: (old: any, next: any) => ({ ...(old || {}), ...(next || {}) }),
    default: () => ({
      startTime: new Date(),
      logs: [],
    }),
  },
  errors: {
    value: (old: any, next: any) => [...(old || []), ...(next || [])],
    default: () => [],
  },
};

// Create the graph
const workflow = new StateGraph<ResearchState>({
  channels: graphState,
});

// Add nodes
workflow.addNode('interpret_thesis', interpretThesisNode);
workflow.addNode('sonar_research', sonarResearchNode);
workflow.addNode('sonar_results', sonarResultsNode);
workflow.addNode('generate_queries', generateQueriesNode);
workflow.addNode('gather_evidence', gatherEvidenceNode);

// Choose quality evaluation based on settings
workflow.addNode('evaluate_quality', (state: ResearchState) => {
  // Use market-aware evaluation if market context is enabled
  if (state.metadata?.useMarketContext !== false) {
    return evaluateQualityMarketAwareNode(state);
  }
  return evaluateQualityNode(state);
});

// Choose reflection based on settings
workflow.addNode('reflect_and_refine', (state: ResearchState) => {
  // Use market-aware reflection if market context is enabled
  if (state.metadata?.useMarketContext !== false) {
    return reflectAndRefineMarketAwareNode(state);
  }
  return reflectAndRefineNode(state);
});

// Always use format-aware report generation
workflow.addNode('generate_report', generateReportFormatAwareNode);

// Set entry point
workflow.addEdge('__start__', 'interpret_thesis' as any);

// Add edges with conditional routing
workflow.addConditionalEdges(
  'interpret_thesis' as any,
  (state: ResearchState) => {
    // Skip Sonar if disabled
    if (state.metadata?.useSonar === false) {
      return 'generate_queries';
    }
    return 'sonar_research';
  },
  {
    'sonar_research': 'sonar_research' as any,
    'generate_queries': 'generate_queries' as any,
  } as any
);

// Sonar processing flow
workflow.addEdge('sonar_research' as any, 'sonar_results' as any);
workflow.addEdge('sonar_results' as any, 'generate_queries' as any);
workflow.addEdge('generate_queries' as any, 'gather_evidence' as any);
workflow.addEdge('gather_evidence' as any, 'evaluate_quality' as any);

// Reflection routing
workflow.addConditionalEdges(
  'evaluate_quality' as any,
  shouldReflect,
  {
    'reflect': 'reflect_and_refine' as any,
    'report': 'generate_report' as any,
  } as any
);

// Iteration routing
workflow.addConditionalEdges(
  'reflect_and_refine' as any,
  (state: ResearchState) => {
    if (state.iterationCount < (state.maxIterations || 3)) {
      return 'continue';
    }
    return 'finalize';
  },
  {
    'continue': 'generate_queries' as any,
    'finalize': 'generate_report' as any,
  } as any
);

// Terminal node
workflow.addEdge('generate_report' as any, '__end__' as any);

// Reflection decision function
function shouldReflect(state: ResearchState): string {
  const { evidence, qualityScores, iterationCount, maxIterations, metadata } = state;
  
  // Calculate quality metrics
  const avgQualityScore = calculateAverageQualityScore(qualityScores || {});
  const hasEnoughEvidence = evidence.length >= thresholds.targetEvidenceCount;
  const belowQualityThreshold = avgQualityScore < thresholds.minEvidenceQuality;
  const canIterate = iterationCount < (maxIterations || 3);
  
  // Apply market-specific thresholds if market context exists
  if (metadata?.marketContext && metadata?.useMarketContext !== false) {
    const marketThresholds = getMarketSpecificThresholds(metadata.marketContext.targetCustomerSize);
    const hasMarketCoverage = checkMarketCoverage(evidence, metadata.marketContext);
    
    if (!hasMarketCoverage && canIterate) {
      console.log('📊 Insufficient market-specific evidence, continuing iteration');
      return 'reflect';
    }
    
    if (evidence.length >= marketThresholds.minEvidence && 
        avgQualityScore >= marketThresholds.qualityThreshold) {
      console.log('✅ Market-specific thresholds met, proceeding to report');
      return 'report';
    }
  }
  
  // Standard reflection logic
  if (!hasEnoughEvidence || (belowQualityThreshold && canIterate)) {
    return 'reflect';
  }
  
  return 'report';
}

function calculateAverageQualityScore(qualityScores: Record<string, number>): number {
  const scores = Object.values(qualityScores);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getMarketSpecificThresholds(targetCustomerSize: string): { minEvidence: number; qualityThreshold: number } {
  const thresholds: Record<string, { minEvidence: number; qualityThreshold: number }> = {
    SMB: { minEvidence: 15, qualityThreshold: 0.65 },
    'Mid-Market': { minEvidence: 20, qualityThreshold: 0.70 },
    Enterprise: { minEvidence: 25, qualityThreshold: 0.75 },
    Developer: { minEvidence: 20, qualityThreshold: 0.80 },
    Consumer: { minEvidence: 15, qualityThreshold: 0.65 },
  };
  
  return thresholds[targetCustomerSize] || { minEvidence: 20, qualityThreshold: 0.70 };
}

function checkMarketCoverage(evidence: any[], marketContext: any): boolean {
  const requiredAspects = getRequiredMarketAspects(marketContext.targetCustomerSize);
  const coveredAspects = new Set<string>();
  
  evidence.forEach(e => {
    const content = e.content.toLowerCase();
    requiredAspects.forEach(aspect => {
      if (content.includes(aspect.toLowerCase())) {
        coveredAspects.add(aspect);
      }
    });
  });
  
  return coveredAspects.size >= requiredAspects.length * 0.7;
}

function getRequiredMarketAspects(targetCustomerSize: string): string[] {
  const aspects: Record<string, string[]> = {
    SMB: ['integration', 'ease of use', 'pricing', 'support', 'quickbooks'],
    Enterprise: ['security', 'compliance', 'scalability', 'api', 'sla'],
    Developer: ['api', 'documentation', 'sdk', 'github', 'performance'],
    'Mid-Market': ['integration', 'scalability', 'support', 'pricing'],
    Consumer: ['user experience', 'mobile', 'pricing', 'reviews'],
  };
  
  return aspects[targetCustomerSize] || ['pricing', 'features', 'support'];
}

// Compile the graph
export const formatAwareGraph = workflow.compile();

// Export function to run research with format awareness
export async function runFormatAwareResearch(thesis: any, options?: {
  maxIterations?: number;
  reportType?: 'sales-intelligence' | 'pe-due-diligence';
  useSonar?: boolean;
  useMarketContext?: boolean;
}) {
  const initialState: Partial<ResearchState> = {
    thesis,
    status: 'initializing',
    iterationCount: 0,
    maxIterations: options?.maxIterations || 3,
    metadata: {
      startTime: new Date(),
      logs: [],
      reportType: options?.reportType || 'pe-due-diligence',
      useSonar: options?.useSonar !== false,
      useMarketContext: options?.useMarketContext !== false,
    },
  };
  
  try {
    console.log(`🚀 Starting ${options?.reportType || 'pe-due-diligence'} research...`);
    console.log(`   Market Context: ${options?.useMarketContext !== false ? 'Enabled' : 'Disabled'}`);
    console.log(`   Sonar Integration: ${options?.useSonar !== false ? 'Enabled' : 'Disabled'}`);
    
    // Add progress monitoring
    const startTime = Date.now();
    let lastLog = Date.now();
    
    // Use stream to monitor progress
    const stream = await formatAwareGraph.stream(initialState, { 
      streamMode: 'values',
    });
    
    let finalState: any;
    let stepCount = 0;
    
    for await (const state of stream) {
      stepCount++;
      finalState = state;
      
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      
      // Log progress every 15 seconds
      if (now - lastLog > 15000) {
        console.log(`\n⏱️  Progress Update [${elapsed}s elapsed]:`);
        console.log(`   Steps completed: ${stepCount}`);
        console.log(`   Evidence collected: ${state.evidence?.length || 0}`);
        console.log(`   Iterations: ${state.iterationCount || 0}/${state.maxIterations || 3}`);
        if (state.currentQueries?.length) {
          console.log(`   Active queries: ${state.currentQueries.length}`);
        }
        if (state.errors?.length) {
          console.log(`   ⚠️  Errors encountered: ${state.errors.length}`);
        }
        lastLog = now;
      }
    }
    
    const result = finalState;
    
    console.log(`\n✅ Research complete!`);
    console.log(`   Total time: ${Math.floor((Date.now() - startTime) / 1000)}s`);
    console.log(`   Report Type: ${result.metadata?.reportType}`);
    console.log(`   Sections Generated: ${Object.keys(result.reportSections || {}).length}`);
    
    return result;
  } catch (error) {
    console.error('Format-aware research failed:', error);
    throw error;
  }
}