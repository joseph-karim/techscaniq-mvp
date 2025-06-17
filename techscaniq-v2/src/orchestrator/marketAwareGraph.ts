import { StateGraph, StateGraphArgs } from '@langchain/langgraph';
import { ResearchState } from '../types';

// Import standard nodes
import { interpretThesisNode } from './nodes/interpretThesis';
import { generateQueriesNode } from './nodes/generateQueries';
import { gatherEvidenceNode } from './nodes/gatherEvidence';

// Import market-aware nodes
import { evaluateQualityMarketAwareNode } from './nodes/evaluateQualityMarketAware';
import { reflectAndRefineMarketAwareNode } from './nodes/reflectAndRefineMarketAware';
import { generateReportMarketAwareNode } from './nodes/generateReportMarketAware';

// Import Sonar integration if needed
import { sonarMarketResearchNode, sonarResultCollectorNode } from './nodes/sonarMarketResearch';

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
    value: (old: any, next: any) => next ?? old,
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
workflow.addNode('sonar_market_research', (state: ResearchState) => sonarMarketResearchNode(state));
workflow.addNode('process_sonar_results', (state: ResearchState) => sonarResultCollectorNode(state));
workflow.addNode('generate_queries', generateQueriesNode);
workflow.addNode('gather_evidence', gatherEvidenceNode);
workflow.addNode('evaluate_quality', evaluateQualityMarketAwareNode);
workflow.addNode('reflect_and_refine', reflectAndRefineMarketAwareNode);
workflow.addNode('generate_report', generateReportMarketAwareNode);

// Set entry point
workflow.addEdge('__start__', 'interpret_thesis' as any);

// Add edges with market-aware routing
workflow.addEdge('interpret_thesis' as any, 'sonar_market_research' as any);

// Sonar processing flow
workflow.addConditionalEdges(
  'sonar_market_research' as any,
  (state: ResearchState) => {
    if (state.sonarJobId && state.status === 'sonar_submitted') {
      return 'wait_for_sonar';
    }
    return 'generate_queries';
  },
  {
    'wait_for_sonar': 'process_sonar_results' as any,
    'generate_queries': 'generate_queries' as any,
  } as any
);

workflow.addEdge('process_sonar_results' as any, 'generate_queries' as any);
workflow.addEdge('generate_queries' as any, 'gather_evidence' as any);
workflow.addEdge('gather_evidence' as any, 'evaluate_quality' as any);

// Market-aware reflection routing
workflow.addConditionalEdges(
  'evaluate_quality' as any,
  shouldReflectWithMarketContext,
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

// Market-aware reflection decision
function shouldReflectWithMarketContext(state: ResearchState): string {
  const { evidence, qualityScores, iterationCount, maxIterations, metadata } = state;
  const marketContext = metadata?.marketContext;
  
  // Calculate quality metrics
  const avgQualityScore = calculateAverageQualityScore(qualityScores || {});
  const hasEnoughEvidence = evidence.length >= thresholds.targetEvidenceCount;
  const belowQualityThreshold = avgQualityScore < thresholds.minEvidenceQuality;
  const canIterate = iterationCount < (maxIterations || 3);
  
  // Market-specific thresholds
  if (marketContext) {
    const marketThresholds = getMarketSpecificThresholds(marketContext.targetCustomerSize);
    const hasMarketCoverage = checkMarketCoverage(evidence, marketContext);
    
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
    SMB: { minEvidence: 15, qualityThreshold: 0.65 },      // Lower bar
    'Mid-Market': { minEvidence: 20, qualityThreshold: 0.70 },
    Enterprise: { minEvidence: 25, qualityThreshold: 0.75 }, // Higher bar
    Developer: { minEvidence: 20, qualityThreshold: 0.80 },  // High quality needed
    Consumer: { minEvidence: 15, qualityThreshold: 0.65 },
  };
  
  return thresholds[targetCustomerSize] || { minEvidence: 20, qualityThreshold: 0.70 };
}

function checkMarketCoverage(evidence: any[], marketContext: any): boolean {
  // Check if we have evidence covering key market aspects
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
  
  // Need at least 70% coverage
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
export const marketAwareGraph = workflow.compile();

// Export a function to run research with market awareness
export async function runMarketAwareResearch(thesis: any, options?: {
  maxIterations?: number;
  useSonar?: boolean;
}) {
  const initialState: Partial<ResearchState> = {
    thesis,
    status: 'initializing',
    iterationCount: 0,
    maxIterations: options?.maxIterations || 3,
    metadata: {
      startTime: new Date(),
      logs: [],
      useSonar: options?.useSonar !== false, // Default to true
    },
  };
  
  try {
    const result = await marketAwareGraph.invoke(initialState);
    return result;
  } catch (error) {
    console.error('Market-aware research failed:', error);
    throw error;
  }
}