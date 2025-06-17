import { StateGraph, END } from '@langchain/langgraph';
import { ResearchState, ReportSection } from '../types';
import { 
  interpretThesisNode,
  generateQueriesNode,
  gatherEvidenceNode,
  evaluateQualityNode,
  reflectAndRefineNode,
  generateReportNode
} from './nodes';
import {
  sonarMarketResearchNode,
  sonarResultCollectorNode,
  shouldUseSonar,
  waitForSonarCompletion
} from './nodes/sonarMarketResearch';
import { config } from '../config';

/**
 * Enhanced research graph with Sonar Deep Research integration
 * 
 * Flow:
 * 1. Interpret thesis
 * 2. If applicable, start Sonar market research (async)
 * 3. Generate initial queries for technical research
 * 4. Gather evidence (technical focus if Sonar is running)
 * 5. Check Sonar results
 * 6. Evaluate all evidence quality
 * 7. Reflect and refine with market context
 * 8. Generate comprehensive report
 */
export function createEnhancedResearchGraph() {
  const stateChannels = {
    // Existing channels
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
      value: (old: any[], next: any[]) => [...old, ...next],
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
      default: () => config.MAX_RESEARCH_ITERATIONS || 3,
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
  workflow.addNode('interpret_thesis', interpretThesisNode);
  workflow.addNode('sonar_market_research', (state: ResearchState) => sonarMarketResearchNode(state));
  workflow.addNode('generate_queries', enhancedGenerateQueries);
  workflow.addNode('gather_evidence', enhancedGatherEvidence);
  workflow.addNode('sonar_result_collector', (state: ResearchState) => sonarResultCollectorNode(state));
  workflow.addNode('evaluate_quality', evaluateQualityNode);
  workflow.addNode('reflect_and_refine', enhancedReflectAndRefine);
  workflow.addNode('generate_report', enhancedGenerateReport);

  // Set entry point
  workflow.addEdge('__start__', 'interpret_thesis' as any);
  
  // Conditional edge after thesis interpretation
  workflow.addConditionalEdges(
    'interpret_thesis' as any,
    (state) => shouldUseSonar(state) ? 'start_sonar' : 'skip_sonar',
    {
      'start_sonar': 'sonar_market_research' as any,
      'skip_sonar': 'generate_queries' as any
    } as any
  );
  
  // After starting Sonar, continue with queries (parallel execution)
  workflow.addEdge('sonar_market_research' as any, 'generate_queries' as any);
  workflow.addEdge('generate_queries' as any, 'gather_evidence' as any);
  workflow.addEdge('gather_evidence' as any, 'sonar_result_collector' as any);
  workflow.addEdge('sonar_result_collector' as any, 'evaluate_quality' as any);
  
  // Reflection loop
  workflow.addConditionalEdges(
    'evaluate_quality' as any,
    shouldReflectWithMarketContext,
    {
      'reflect': 'reflect_and_refine' as any,
      'report': 'generate_report' as any
    } as any
  );
  
  workflow.addEdge('reflect_and_refine' as any, 'generate_queries' as any);

  return workflow.compile();
}

/**
 * Enhanced query generation that considers market context from Sonar
 */
async function enhancedGenerateQueries(state: ResearchState): Promise<Partial<ResearchState>> {
  const marketContext = state.metadata?.marketContext;
  
  if (marketContext) {
    console.log('🎯 Generating queries with market context from Sonar');
    
    // Modify queries to focus on technical aspects of discovered competitors
    const enhancedState = {
      ...state,
      metadata: {
        ...state.metadata,
        queryContext: {
          competitors: marketContext.competitors,
          // Market size is stored in metadata.marketInsights
          focusAreas: determineTechnicalFocus(marketContext),
        }
      }
    };
    
    return generateQueriesNode(enhancedState);
  }
  
  // Standard query generation
  return generateQueriesNode(state);
}

/**
 * Enhanced evidence gathering that prioritizes based on Sonar insights
 */
async function enhancedGatherEvidence(state: ResearchState): Promise<Partial<ResearchState>> {
  const sonarStatus = state.metadata?.sonarStatus;
  const marketInsights = state.sonarInsights;
  
  if (sonarStatus === 'processing') {
    console.log('🔧 Focusing on technical evidence while Sonar processes market data');
    
    // Filter queries to technical sources
    const currentQueries = state.metadata?.currentQueries;
    const technicalQueries = Array.isArray(currentQueries) 
      ? currentQueries.filter((q: any) => ['github', 'technical', 'api', 'infrastructure'].includes(q.type))
      : [];
    
    const modifiedState = {
      ...state,
      metadata: {
        ...state.metadata,
        currentQueries: { technical: technicalQueries },
      }
    };
    
    return gatherEvidenceNode(modifiedState as ResearchState);
  }
  
  if (marketInsights) {
    console.log('🎯 Gathering evidence with market insights context');
    
    // Enhance queries with competitor tech stacks
    const competitorTech = (marketInsights as any).competitors
      ?.map((c: any) => c.techStack)
      .flat()
      .filter(Boolean);
    
    if (competitorTech.length > 0) {
      console.log(`📊 Comparing against competitor tech: ${competitorTech.join(', ')}`);
    }
  }
  
  return gatherEvidenceNode(state);
}

/**
 * Enhanced reflection that uses market insights for gap analysis
 */
async function enhancedReflectAndRefine(state: ResearchState): Promise<Partial<ResearchState>> {
  const marketInsights = state.sonarInsights;
  
  if (marketInsights) {
    console.log('🔍 Reflecting with comprehensive market context');
    
    // Add market gaps to reflection
    const marketGaps = identifyMarketGaps(state, marketInsights);
    
    const enhancedState = {
      ...state,
      metadata: {
        ...state.metadata,
        // Store gaps in existing structure
        gaps: [
          ...(state.metadata?.gaps || []),
          ...marketGaps,
        ],
      }
    };
    
    return reflectAndRefineNode(enhancedState as ResearchState);
  }
  
  return reflectAndRefineNode(state);
}

/**
 * Enhanced report generation that integrates Sonar insights
 */
async function enhancedGenerateReport(state: ResearchState): Promise<Partial<ResearchState>> {
  const marketInsights = state.sonarInsights;
  
  if (marketInsights) {
    console.log('📄 Generating report with integrated market and technical analysis');
    
    // Create a proper ReportSection for market analysis
    const marketAnalysisSection: ReportSection = {
      id: 'market-analysis',
      pillarId: 'market',
      title: 'Market Analysis',
      content: JSON.stringify({
        tam: (marketInsights as any).tam,
        competitors: (marketInsights as any).competitors,
        financials: (marketInsights as any).financials,
        risks: (marketInsights as any).risks,
        opportunities: (marketInsights as any).opportunities,
      }),
      score: 85,
      weight: 0.25,
      keyFindings: [
        `Market data available from Sonar research`,
      ],
      risks: [],
      opportunities: [],
    };
    
    const enhancedState = {
      ...state,
      reportSections: {
        ...state.reportSections,
        marketAnalysis: marketAnalysisSection,
      },
    };
    
    return generateReportNode(enhancedState as ResearchState);
  }
  
  return generateReportNode(state);
}

// Helper functions

function shouldReflectWithMarketContext(state: ResearchState): string {
  const avgQualityScore = calculateAverageQualityScore(state.qualityScores || {});
  const hasEnoughEvidence = state.evidence.length >= config.MIN_EVIDENCE_COUNT;
  const belowQualityThreshold = avgQualityScore < config.QUALITY_THRESHOLD;
  const canIterate = state.iterationCount < (state.maxIterations || 3);
  
  // Check if we have both market and technical evidence
  const hasMarketEvidence = state.evidence.some(e => 
    e.metadata?.extractionMethod === 'sonar_deep_research'
  );
  const hasTechnicalEvidence = state.evidence.some(e => 
    ['github', 'api', 'technical'].includes(e.source.type)
  );
  
  // Need both types of evidence for comprehensive report
  if (!hasMarketEvidence || !hasTechnicalEvidence) {
    if (canIterate) return 'reflect';
  }
  
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

function determineTechnicalFocus(marketContext: any): string[] {
  const focusAreas: string[] = [];
  
  if (marketContext.competitors?.length > 0) {
    focusAreas.push('Compare technical architecture with competitors');
    focusAreas.push('Identify unique technical advantages');
  }
  
  if (marketContext.growth === 'High' || marketContext.growth?.includes('>20%')) {
    focusAreas.push('Assess infrastructure scalability for rapid growth');
    focusAreas.push('Evaluate API ecosystem for partner integration');
  }
  
  if (marketContext.keyRisks?.some((r: string) => r.toLowerCase().includes('security'))) {
    focusAreas.push('Deep security architecture review');
    focusAreas.push('Compliance and data protection assessment');
  }
  
  return focusAreas;
}

function identifyMarketGaps(state: ResearchState, marketInsights: any): any[] {
  const gaps: any[] = [];
  
  // Check if we have technical data on main competitors
  marketInsights.competitors.forEach((competitor: any) => {
    const hasCompetitorTech = state.evidence.some(e => 
      e.content.toLowerCase().includes(competitor.name.toLowerCase()) &&
      (e.source.type as string) === 'technical'
    );
    
    if (!hasCompetitorTech) {
      gaps.push({
        type: 'competitor_technical',
        description: `Missing technical analysis for competitor ${competitor.name}`,
        priority: 'high',
        suggestedQuery: `${competitor.name} technology stack architecture API`,
      });
    }
  });
  
  // Check if we have evidence supporting market opportunities
  marketInsights.opportunities.forEach((opportunity: string) => {
    const hasOpportunityEvidence = state.evidence.some(e => 
      e.content.toLowerCase().includes(opportunity.toLowerCase())
    );
    
    if (!hasOpportunityEvidence) {
      gaps.push({
        type: 'opportunity_validation',
        description: `Need technical validation for opportunity: ${opportunity}`,
        priority: 'medium',
      });
    }
  });
  
  return gaps;
}

// Cost calculation removed - costs tracked in Sonar node

/**
 * Run enhanced research with Sonar integration
 */
export async function runEnhancedDeepResearch(
  company: string,
  website: string,
  thesisType: string,
  customThesis?: string
): Promise<string> {
  console.log(`🚀 Starting enhanced research with Sonar Deep Research integration`);
  console.log(`📊 Company: ${company} | Type: ${thesisType}`);
  
  const graph = createEnhancedResearchGraph();
  
  // Initialize state (same as before)
  const initialState: ResearchState = {
    thesisId: generateThesisId(),
    thesis: {
      id: generateThesisId(),
      company,
      website,
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
    maxIterations: 3,
    status: 'initializing',
    errors: [],
    metadata: {
      useSonar: shouldUseSonar({ thesis: { type: thesisType, pillars: [] } } as any),
    }
  };
  
  try {
    const finalState = await graph.invoke(initialState);
    
    console.log(`✅ Research completed!`);
    console.log(`📊 Total evidence collected: ${finalState.evidence.length}`);
    console.log(`💰 Total cost: $${(finalState.metadata?.totalResearchCost || 0).toFixed(2)}`);
    
    return finalState.thesisId || 'unknown';
    
  } catch (error) {
    console.error('❌ Enhanced research failed:', error);
    throw error;
  }
}

// Helper functions (reuse from original graph.ts)
function generateThesisId(): string {
  return `thesis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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

function getDefaultPillars(_thesisType: string): any[] {
  // Return thesis-specific pillars (same as original)
  return [
    {
      id: 'market-position',
      name: 'Market Position & Competition',
      weight: 0.3,
      description: 'Market size, competitive landscape, and positioning',
    },
    {
      id: 'tech-architecture',
      name: 'Technology & Architecture',
      weight: 0.25,
      description: 'Technical capabilities, scalability, and innovation',
    },
    {
      id: 'financial-performance',
      name: 'Financial Performance',
      weight: 0.25,
      description: 'Revenue, profitability, and unit economics',
    },
    {
      id: 'team-organization',
      name: 'Team & Organization',
      weight: 0.2,
      description: 'Leadership, talent, and culture',
    }
  ];
}