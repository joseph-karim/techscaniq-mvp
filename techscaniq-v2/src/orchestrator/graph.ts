import { StateGraph, END } from '@langchain/langgraph';
import { ResearchState, InvestmentThesis, Thesis } from '../types';
import { 
  interpretThesisNode,
  generateQueriesNode,
  gatherEvidenceNode,
  evaluateQualityNode,
  reflectAndRefineNode,
  generateReportNode
} from './nodes';
import { config } from '../config';
import { StorageService } from '../services/storage';

// Create and export the compiled graph
export const researchGraph = createResearchGraph();

// Export function to run research
export async function runResearch(thesis: InvestmentThesis | Thesis, options?: {
  maxIterations?: number;
}) {
  const initialState: Partial<ResearchState> = {
    thesis,
    status: 'initializing',
    iterationCount: 0,
    maxIterations: options?.maxIterations || config.MAX_RESEARCH_ITERATIONS || 3,
    metadata: {
      startTime: new Date(),
      logs: [],
    },
  };
  
  try {
    const result = await researchGraph.invoke(initialState);
    return result;
  } catch (error) {
    console.error('Research failed:', error);
    throw error;
  }
}

// Condition functions
function shouldReflect(state: ResearchState): string {
  const avgQualityScore = calculateAverageQualityScore(state.qualityScores || {});
  const hasEnoughEvidence = state.evidence.length >= config.MIN_EVIDENCE_COUNT;
  const belowQualityThreshold = avgQualityScore < config.QUALITY_THRESHOLD;
  const canIterate = state.iterationCount < (state.maxIterations || config.MAX_RESEARCH_ITERATIONS);

  if (!hasEnoughEvidence || (belowQualityThreshold && canIterate)) {
    return 'reflect';
  }
  return 'report';
}

function calculateAverageQualityScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return values.reduce((sum, score) => sum + score, 0) / values.length;
}

// Create the research workflow graph
export function createResearchGraph() {
  // Define the state schema for LangGraph
  const stateChannels = {
    thesisId: {
      value: (old: string | null, next: string | null) => next ?? old,
      default: () => null as string | null,
    },
    thesis: {
      value: (old: any, next: any) => next ?? old,
      default: () => null,
    },
    researchQuestions: {
      value: (old: any[], next: any[]) => next ?? old,
      default: () => [],
    },
    evidence: {
      value: (old: any[], next: any[]) => next ?? old,
      default: () => [],
    },
    qualityScores: {
      value: (old: Record<string, number>, next: Record<string, number>) => ({ ...old, ...next }),
      default: () => ({}),
    },
    reportSections: {
      value: (old: Record<string, any>, next: Record<string, any>) => ({ ...old, ...next }),
      default: () => ({}),
    },
    citations: {
      value: (old: any[], next: any[]) => next ?? old,
      default: () => [],
    },
    iterationCount: {
      value: (old: number, next: number) => next ?? old,
      default: () => 0,
    },
    maxIterations: {
      value: (old: number, next: number) => next ?? old,
      default: () => config.MAX_RESEARCH_ITERATIONS,
    },
    status: {
      value: (old: string, next: string) => next ?? old,
      default: () => 'initializing',
    },
    errors: {
      value: (old: any[], next: any[]) => [...old, ...next],
      default: () => [],
    },
    metadata: {
      value: (old: any, next: any) => ({ ...old, ...next }),
      default: () => ({}),
    },
  };

  const workflow = new StateGraph<ResearchState>({
    channels: stateChannels,
  } as any);

  // Add nodes
  workflow.addNode('interpret_thesis' as any, interpretThesisNode);
  workflow.addNode('generate_queries' as any, generateQueriesNode);
  workflow.addNode('gather_evidence' as any, gatherEvidenceNode);
  workflow.addNode('evaluate_quality' as any, evaluateQualityNode);
  workflow.addNode('reflect_and_refine' as any, reflectAndRefineNode);
  workflow.addNode('generate_report' as any, generateReportNode);

  // Set entry point
  workflow.addEdge('__start__', 'interpret_thesis' as any);
  
  // Add edges
  workflow.addEdge('interpret_thesis' as any, 'generate_queries' as any);
  workflow.addEdge('generate_queries' as any, 'gather_evidence' as any);
  workflow.addEdge('gather_evidence' as any, 'evaluate_quality' as any);

  // Conditional edge for reflection loop
  workflow.addConditionalEdges(
    'evaluate_quality' as any,
    shouldReflect,
    {
      'reflect': 'reflect_and_refine' as any,
      'report': 'generate_report' as any
    } as any
  );

  workflow.addEdge('reflect_and_refine' as any, 'generate_queries' as any);

  return workflow.compile();
}

// Main orchestration function
export async function runDeepResearch(
  company: string,
  website: string,
  thesisType: string,
  customThesis?: string
): Promise<string> {
  const graph = createResearchGraph();
  
  // Initialize state
  const initialState: ResearchState = {
    thesisId: generateThesisId(),
    thesis: {
      id: generateThesisId(),
      company,
      website: website,
      companyWebsite: website,
      statement: customThesis || getDefaultThesisStatement(thesisType),
      type: thesisType as any,
      pillars: getDefaultPillars(thesisType),
      successCriteria: [],
      riskFactors: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    researchQuestions: [],
    evidence: [],
    qualityScores: {},
    reportSections: {},
    citations: [],
    iterationCount: 0,
    maxIterations: config.MAX_RESEARCH_ITERATIONS,
    status: 'initializing',
    errors: []
  };

  try {
    // Execute the graph with progress tracking
    const finalState = await graph.invoke(initialState, {
      callbacks: [
        {
          handleLLMStart: async (llm, prompts) => {
            console.log('LLM Start:', llm.name);
          },
          handleLLMEnd: async (output) => {
            console.log('LLM End');
          },
          handleToolStart: async (tool, input) => {
            console.log('Tool Start:', tool.name);
          },
          handleToolEnd: async (output) => {
            console.log('Tool End');
          }
        }
      ]
    });

    // Store the final report
    const reportId = await storeReport(finalState as ResearchState);
    return reportId;

  } catch (error) {
    console.error('Research failed:', error);
    throw new Error(`Deep research failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper functions
function generateThesisId(): string {
  return `thesis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDefaultThesisStatement(thesisType: string): string {
  const statements = {
    'accelerate-growth': 'Target company has strong product-market fit and can achieve 20-40%+ ARR growth with investment in go-to-market and product development.',
    'margin-expansion': 'Target company can improve EBITDA by 10-15 points through operational excellence and cost optimization.',
    'market-expansion': 'Target company can expand into new geographic markets or customer segments to drive growth.',
    'turnaround': 'Target company can be restructured and repositioned for profitability and growth.'
  };
  return statements[thesisType as keyof typeof statements] || statements['accelerate-growth'];
}

function getDefaultPillars(thesisType: string): any[] {
  // This would return thesis-specific pillars
  // For now, returning generic pillars
  return [
    {
      id: 'tech-architecture',
      name: 'Technology & Architecture',
      weight: 0.3,
      description: 'Evaluate the scalability, reliability, and innovation of the technology stack',
      questions: [
        'What is the current technology stack and architecture?',
        'How scalable is the infrastructure for 10x growth?',
        'What are the main technical risks and limitations?',
        'How does the technology compare to competitors?'
      ]
    },
    {
      id: 'market-position',
      name: 'Market Position & Competition',
      weight: 0.25,
      description: 'Assess market share, competitive advantages, and growth potential',
      questions: [
        'What is the total addressable market (TAM)?',
        'Who are the main competitors and their market share?',
        'What are the competitive advantages?',
        'What are the barriers to entry?'
      ]
    },
    {
      id: 'financial-performance',
      name: 'Financial Performance',
      weight: 0.25,
      description: 'Analyze revenue growth, profitability, and unit economics',
      questions: [
        'What are the revenue growth trends?',
        'What are the gross margins and profitability?',
        'What is the customer acquisition cost (CAC) and lifetime value (LTV)?',
        'What is the cash burn rate and runway?'
      ]
    },
    {
      id: 'team-organization',
      name: 'Team & Organization',
      weight: 0.2,
      description: 'Evaluate leadership, talent, and organizational capabilities',
      questions: [
        'Who are the key leaders and their backgrounds?',
        'What is the organizational structure and culture?',
        'How strong is the technical team?',
        'What are the talent acquisition and retention strategies?'
      ]
    }
  ];
}

async function storeReport(state: ResearchState): Promise<string> {
  const storage = new StorageService();
  
  // Store thesis if not already stored
  if (state.thesis.id && !state.thesis.id.startsWith('thesis_')) {
    await storage.storeThesis(state.thesis as InvestmentThesis);
  }
  
  // Store evidence
  if (state.evidence.length > 0) {
    await storage.storeEvidence(state.evidence);
  }
  
  // Store complete report
  return await storage.storeReport(state);
}