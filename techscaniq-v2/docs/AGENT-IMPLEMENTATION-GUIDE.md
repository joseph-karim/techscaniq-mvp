# Agent-Centric Control Plane Implementation Guide

## Quick Start Implementation

This guide provides concrete code implementations for enhancing TechScanIQ with the proposed agent-centric control plane.

## 1. Stateless Node Refactoring

### Current (Stateful) vs. New (Stateless) Pattern

```typescript
// ❌ OLD: Node maintains internal state
export async function gatherEvidenceNode(state: ResearchState) {
  const evidence = [];
  // Modifies evidence array internally
  evidence.push(newItem);
  return { evidence };
}

// ✅ NEW: Pure functional transform
export async function gatherEvidenceNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const newEvidence = await collectEvidence(state);
  return {
    evidence: [...state.evidence, ...newEvidence],
    metadata: {
      ...state.metadata,
      lastGatheringAt: new Date(),
      totalEvidenceCount: state.evidence.length + newEvidence.length
    }
  };
}
```

## 2. Planner-Agent Implementation

### Core Types
```typescript
// src/types/agents.ts
export interface AtomicResearchGoal {
  id: string;
  name: string;
  pillarId: string;
  targetCoverage: number;      // 0.0-1.0
  expectedSignals: string[];   // What we expect to find
  tools: ToolBundle[];         // Optimal tool combinations
  maxCalls: number;           // API call budget
  tokenBudget: number;        // LLM token budget
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ToolBundle {
  primary: string;
  fallbacks: string[];
  estimatedCost: number;
  estimatedLatency: number;
}

export interface PlannerOutput {
  args: AtomicResearchGoal[];
  totalBudget: {
    tokens: number;
    cost: number;
    time: number;
  };
  executionStrategy: 'parallel' | 'sequential' | 'hybrid';
}
```

### Planner Agent Node
```typescript
// src/orchestrator/nodes/plannerAgent.ts
import { ChatAnthropic } from '@langchain/anthropic';
import { ResearchState, ThesisType } from '../../types';
import { AtomicResearchGoal, PlannerOutput } from '../../types/agents';

const planner = new ChatAnthropic({
  modelName: 'claude-opus-4-20250514',
  temperature: 0.3,
  maxTokens: 8192,
});

export async function plannerAgentNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const { thesis } = state;
  
  // Load mission template
  const missionTemplate = await loadMissionTemplate(thesis.type);
  
  const plannerPrompt = `You are PlannerAgent for investment research mission ${thesis.id}.

Company: ${thesis.company}
Website: ${thesis.companyWebsite}
Thesis Type: ${thesis.type}
Statement: ${thesis.statement}

Mission Template:
${JSON.stringify(missionTemplate, null, 2)}

Tool Registry:
${JSON.stringify(getToolRegistry(), null, 2)}

Decompose this mission into Atomic Research Goals (ARGs) that:
1. Cover all expected signals in the template
2. Assign optimal tool bundles based on signal type
3. Allocate budget proportional to pillar weights
4. Prioritize based on investment impact

Output JSON:
{
  "args": [
    {
      "id": "arg-001",
      "name": "Infrastructure Scalability Analysis",
      "pillarId": "tech-architecture",
      "targetCoverage": 0.9,
      "expectedSignals": ["kubernetes_config", "load_balancing", "auto_scaling"],
      "tools": [
        {
          "primary": "github_analyzer",
          "fallbacks": ["code_search", "tech_blogs"],
          "estimatedCost": 0.05,
          "estimatedLatency": 30
        }
      ],
      "maxCalls": 15,
      "tokenBudget": 50000,
      "priority": "critical"
    }
  ],
  "totalBudget": {
    "tokens": 750000,
    "cost": 21.00,
    "time": 900
  },
  "executionStrategy": "parallel"
}`;

  const response = await planner.invoke([
    { role: 'system', content: 'You are an expert investment research planner. Output only valid JSON.' },
    { role: 'user', content: plannerPrompt }
  ]);

  const plannerOutput: PlannerOutput = JSON.parse(response.content.toString());
  
  return {
    metadata: {
      ...state.metadata,
      plannerOutput,
      atomicResearchGoals: plannerOutput.args,
      totalBudget: plannerOutput.totalBudget,
    },
    // Convert ARGs to research questions for compatibility
    researchQuestions: plannerOutput.args.map(arg => ({
      id: arg.id,
      question: `Investigate ${arg.name} for ${thesis.company}`,
      pillarId: arg.pillarId,
      priority: arg.priority,
      keywords: arg.expectedSignals,
    })),
  };
}

// Mission template loader
async function loadMissionTemplate(thesisType: ThesisType) {
  const templates = {
    'accelerate-growth': {
      expectedSignalCount: 120,
      signalCategories: {
        scalability: [
          'kubernetes_config', 'hpa_settings', 'load_balancer_type',
          'cdn_provider', 'cache_strategy', 'database_sharding'
        ],
        market_position: [
          'market_share', 'competitor_count', 'tam_size',
          'growth_rate', 'customer_segments', 'pricing_power'
        ],
        product_velocity: [
          'release_frequency', 'feature_count', 'api_changes',
          'commit_frequency', 'contributor_growth', 'issue_resolution_time'
        ],
        // ... more categories
      },
      toolPreferences: {
        technical: ['github_analyzer', 'api_discovery', 'tech_stack_detector'],
        market: ['web_search', 'news_aggregator', 'linkedin_scraper'],
        financial: ['sec_filings', 'earnings_calls', 'investor_reports'],
      }
    },
    // ... other thesis types
  };
  
  return templates[thesisType] || templates['accelerate-growth'];
}
```

## 3. Section-Agent with THINK→TOOL→REFLECT Loop

### Section Agent Implementation
```typescript
// src/orchestrator/nodes/sectionAgent.ts
export interface SectionAgentState {
  argId: string;
  coverage: number;
  confidence: number;
  iteration: number;
  marginGain: number;
  openQuestions: string[];
  foundSignals: string[];
  contradictions: Array<{signal: string; sources: string[]}>;
}

export async function sectionAgentNode(
  arg: AtomicResearchGoal,
  evidenceState: Evidence[]
): Promise<SectionAgentResult> {
  const state: SectionAgentState = {
    argId: arg.id,
    coverage: 0,
    confidence: 0,
    iteration: 0,
    marginGain: 1.0,
    openQuestions: [],
    foundSignals: [],
    contradictions: [],
  };

  const maxDepth = 5;
  const τ = 0.88; // Confidence threshold
  const ε = 0.02; // Marginal gain threshold

  while (state.confidence < τ && state.iteration < maxDepth && state.marginGain > ε) {
    const prevConfidence = state.confidence;
    
    // THINK: Plan next queries
    const queries = await think(arg, state, evidenceState);
    
    // TOOLS: Execute searches in parallel
    const newEvidence = await executeTools(arg.tools, queries);
    evidenceState = [...evidenceState, ...newEvidence];
    
    // REFLECT: Update metrics
    state = await reflect(arg, state, evidenceState);
    state.marginGain = state.confidence - prevConfidence;
    state.iteration++;
    
    console.log(`🔄 Section ${arg.name} - Iteration ${state.iteration}:`);
    console.log(`   Coverage: ${(state.coverage * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${(state.confidence * 100).toFixed(1)}%`);
    console.log(`   Marginal Gain: ${(state.marginGain * 100).toFixed(2)}%`);
  }

  return {
    argId: arg.id,
    evidence: evidenceState.filter(e => e.metadata?.argId === arg.id),
    coverage: state.coverage,
    confidence: state.confidence,
    openQuestions: state.openQuestions,
    foundSignals: state.foundSignals,
    exitReason: getExitReason(state, τ, ε, maxDepth),
  };
}

async function think(
  arg: AtomicResearchGoal,
  state: SectionAgentState,
  evidence: Evidence[]
): Promise<SearchQuery[]> {
  const model = new ChatAnthropic({ modelName: 'claude-sonnet-4-20250514' });
  
  const thinkPrompt = `You are researching: ${arg.name}

Expected signals: ${arg.expectedSignals.join(', ')}
Found signals: ${state.foundSignals.join(', ')}
Missing signals: ${arg.expectedSignals.filter(s => !state.foundSignals.includes(s)).join(', ')}

Current coverage: ${(state.coverage * 100).toFixed(1)}%
Open questions: ${state.openQuestions.join('; ')}

Plan the next round of searches to find missing signals. Focus on:
1. Specific, targeted queries
2. Alternative phrasings for hard-to-find signals
3. Domain-specific sources

Output JSON array of search queries with rationale.`;

  const response = await model.invoke([
    { role: 'system', content: 'Output only valid JSON array of {query, type, rationale}' },
    { role: 'user', content: thinkPrompt }
  ]);

  return JSON.parse(response.content.toString());
}

async function reflect(
  arg: AtomicResearchGoal,
  state: SectionAgentState,
  evidence: Evidence[]
): Promise<SectionAgentState> {
  // Calculate coverage
  const foundSignals = new Set<string>();
  evidence.forEach(e => {
    arg.expectedSignals.forEach(signal => {
      if (e.content.toLowerCase().includes(signal.toLowerCase())) {
        foundSignals.add(signal);
      }
    });
  });
  
  const coverage = foundSignals.size / arg.expectedSignals.length;
  
  // Calculate source quality
  const sourceQuality = evidence.reduce((sum, e) => 
    sum + (e.source.credibilityScore || 0.5), 0
  ) / Math.max(evidence.length, 1);
  
  // Detect contradictions
  const contradictions = detectContradictions(evidence, arg.expectedSignals);
  
  // Calculate confidence using sigmoid
  const confidence = calculateConfidence({
    coverage,
    sourceQuality,
    contradictionRatio: contradictions.length / Math.max(foundSignals.size, 1),
    noveltyRate: calculateNoveltyRate(evidence),
  });
  
  // Identify open questions
  const openQuestions = arg.expectedSignals
    .filter(s => !foundSignals.has(s))
    .map(s => `Find evidence for: ${s}`);
  
  return {
    ...state,
    coverage,
    confidence,
    foundSignals: Array.from(foundSignals),
    contradictions,
    openQuestions,
  };
}

function calculateConfidence(metrics: {
  coverage: number;
  sourceQuality: number;
  contradictionRatio: number;
  noveltyRate: number;
}): number {
  const weights = {
    coverage: 0.4,
    quality: 0.3,
    contradictions: -0.2,
    noveltyDecay: -0.1,
  };
  
  const σ = (x: number) => 1 / (1 + Math.exp(-x));
  
  const score = 
    weights.coverage * metrics.coverage +
    weights.quality * metrics.sourceQuality +
    weights.contradictions * metrics.contradictionRatio +
    weights.noveltyDecay * (1 - metrics.noveltyRate);
  
  return σ(score * 5); // Scale factor for sensitivity
}
```

## 4. Gap-Analyzer Implementation

### Gap Analysis Engine
```typescript
// src/orchestrator/nodes/gapAnalyzer.ts
export interface ExpectedEvidenceMatrix {
  missionType: string;
  signals: SignalExpectation[];
  minimumCoverage: Record<string, number>;
}

export interface SignalExpectation {
  id: string;
  pillarId: string;
  description: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  expectedSources: string[];
  validationRules: string[];
}

export interface Gap {
  signalId: string;
  type: 'missing' | 'insufficient' | 'contradictory' | 'outdated';
  criticality: string;
  description: string;
  suggestedActions: MicroAgentSpec[];
}

export interface MicroAgentSpec {
  type: string;
  config: Record<string, any>;
  priority: number;
  estimatedCost: number;
}

export async function gapAnalyzerNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const matrix = await loadExpectedEvidenceMatrix(state.thesis.type);
  const sectionResults = state.metadata?.sectionResults || [];
  
  // Analyze coverage by signal
  const signalCoverage = analyzeSignalCoverage(matrix, sectionResults);
  
  // Identify gaps
  const gaps = identifyGaps(matrix, signalCoverage);
  
  // Generate micro-agent specs for critical gaps
  const microAgents = await generateMicroAgents(gaps.filter(g => g.criticality === 'critical'));
  
  // Check if we meet minimum thresholds
  const meetsThreshold = checkThresholds(signalCoverage, matrix.minimumCoverage);
  
  return {
    metadata: {
      ...state.metadata,
      gapAnalysis: {
        signalCoverage,
        gaps,
        microAgents,
        meetsThreshold,
        timestamp: new Date(),
      }
    },
    status: meetsThreshold ? 'ready_for_synthesis' : 'needs_more_evidence',
  };
}

function analyzeSignalCoverage(
  matrix: ExpectedEvidenceMatrix,
  sectionResults: SectionAgentResult[]
): Record<string, number> {
  const coverage: Record<string, number> = {};
  
  matrix.signals.forEach(signal => {
    const foundInSections = sectionResults.filter(r => 
      r.foundSignals.includes(signal.id)
    );
    
    coverage[signal.id] = foundInSections.length > 0 ? 1.0 : 0.0;
  });
  
  return coverage;
}

async function generateMicroAgents(criticalGaps: Gap[]): Promise<MicroAgentSpec[]> {
  const specs: MicroAgentSpec[] = [];
  
  for (const gap of criticalGaps) {
    switch (gap.type) {
      case 'missing':
        if (gap.signalId.includes('sec_filing')) {
          specs.push({
            type: 'sec_scraper',
            config: {
              company: gap.signalId.split('_')[0],
              filingTypes: ['10-K', '10-Q', '8-K'],
              dateRange: 'last_year',
            },
            priority: 1,
            estimatedCost: 0.10,
          });
        } else if (gap.signalId.includes('patent')) {
          specs.push({
            type: 'patent_searcher',
            config: {
              assignee: gap.signalId.split('_')[0],
              keywords: ['technology', 'innovation'],
              databases: ['uspto', 'epo'],
            },
            priority: 2,
            estimatedCost: 0.15,
          });
        }
        break;
        
      case 'outdated':
        specs.push({
          type: 'news_monitor',
          config: {
            query: gap.description,
            sources: ['reuters', 'bloomberg', 'techcrunch'],
            minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          priority: 3,
          estimatedCost: 0.05,
        });
        break;
    }
  }
  
  // Rate limit spawning
  return specs.slice(0, 5); // Max 5 micro-agents per cycle
}
```

## 5. Router System Implementation

### Intelligent Router
```typescript
// src/orchestrator/router.ts
export interface RouterDecision {
  collection: string;
  reformulatedQuery: string;
  confidence: number;
  fallbacks: string[];
  reasoning: string;
}

export class IntelligentRouter {
  private collections: Map<string, CollectionConfig>;
  
  constructor() {
    this.collections = new Map([
      ['github', {
        domains: ['github.com'],
        strengths: ['code', 'architecture', 'developers', 'issues'],
        queryTransforms: [
          (q: string) => `${q} site:github.com`,
          (q: string) => `${q} language:TypeScript`,
        ],
      }],
      ['linkedin', {
        domains: ['linkedin.com'],
        strengths: ['executives', 'employees', 'company_culture', 'hiring'],
        queryTransforms: [
          (q: string) => `${q} site:linkedin.com/in/`,
          (q: string) => `"${q}" current company`,
        ],
      }],
      ['news', {
        domains: ['reuters.com', 'bloomberg.com', 'techcrunch.com'],
        strengths: ['announcements', 'funding', 'partnerships', 'market_moves'],
        queryTransforms: [
          (q: string) => `${q} announcement OR partnership OR funding`,
        ],
      }],
    ]);
  }
  
  async route(query: string, context: ResearchContext): Promise<RouterDecision[]> {
    const model = new ChatOpenAI({ modelName: 'gpt-4o' });
    
    const routerPrompt = `You are an intelligent search router.

Query: "${query}"
Context: ${context.pillar} research for ${context.company}
Available Collections: ${Array.from(this.collections.keys()).join(', ')}

For each relevant collection, provide:
1. Reformulated query optimized for that source
2. Confidence (0-1) of finding relevant results
3. Reasoning for selection

Output JSON array of router decisions.`;

    const response = await model.invoke(routerPrompt);
    const decisions: RouterDecision[] = JSON.parse(response.content.toString());
    
    // Add fallbacks
    decisions.forEach(decision => {
      decision.fallbacks = this.getFallbacks(decision.collection);
    });
    
    // Filter low-confidence routes
    return decisions.filter(d => d.confidence > 0.3);
  }
  
  private getFallbacks(primary: string): string[] {
    const fallbackMap: Record<string, string[]> = {
      'github': ['gitlab', 'bitbucket', 'web'],
      'linkedin': ['twitter', 'web'],
      'news': ['blogs', 'web'],
    };
    
    return fallbackMap[primary] || ['web'];
  }
}
```

## 6. Integration with Existing Graph

### Enhanced Graph Definition
```typescript
// src/orchestrator/enhancedGraph.ts
import { StateGraph } from '@langchain/langgraph';
import { plannerAgentNode } from './nodes/plannerAgent';
import { sectionAgentPoolNode } from './nodes/sectionAgentPool';
import { gapAnalyzerNode } from './nodes/gapAnalyzer';

export function createEnhancedResearchGraph() {
  const workflow = new StateGraph<ResearchState>({
    channels: {
      // ... existing channels
      atomicResearchGoals: {
        value: (old: any[], next: any[]) => next ?? old,
        default: () => [],
      },
      sectionResults: {
        value: (old: any[], next: any[]) => [...old, ...next],
        default: () => [],
      },
      gapAnalysis: {
        value: (old: any, next: any) => next ?? old,
        default: () => null,
      },
      globalConfidence: {
        value: (old: number, next: number) => next ?? old,
        default: () => 0,
      },
    },
  });

  // Add new nodes
  workflow.addNode('planner', plannerAgentNode);
  workflow.addNode('section_pool', sectionAgentPoolNode);
  workflow.addNode('gap_analyzer', gapAnalyzerNode);
  workflow.addNode('citation_weaver', citationWeaverNode);
  
  // Define flow
  workflow.addEdge('__start__', 'planner');
  workflow.addEdge('planner', 'section_pool');
  workflow.addEdge('section_pool', 'gap_analyzer');
  
  // Conditional edges
  workflow.addConditionalEdges(
    'gap_analyzer',
    (state) => state.globalConfidence >= 0.88 ? 'synthesize' : 'spawn_micro',
    {
      'synthesize': 'citation_weaver',
      'spawn_micro': 'section_pool',
    }
  );
  
  workflow.addEdge('citation_weaver', 'generate_report');
  
  return workflow.compile();
}
```

## Next Steps

1. **Start with Planner-Agent** - Implement ARG decomposition first
2. **Test Section-Agent loops** - Validate confidence mathematics
3. **Build Gap-Analyzer** - Create Expected-Evidence matrices
4. **Integrate Router** - Connect to existing tools
5. **Deploy incrementally** - A/B test against current system

This implementation provides the foundation for a truly intelligent, adaptive research system that knows when to stop, where to look, and what's missing.