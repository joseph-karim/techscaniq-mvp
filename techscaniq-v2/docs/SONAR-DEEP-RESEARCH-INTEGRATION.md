# Perplexity Sonar Deep Research Integration for TechScanIQ

## Executive Summary

Perplexity's Sonar Deep Research API offers a compelling opportunity to enhance TechScanIQ's research capabilities by providing exhaustive, citation-backed market research as a baseline before technical deep-dive analysis. This would create a powerful two-stage research pipeline.

## Sonar Deep Research Capabilities

### Key Features
- **Exhaustive Research**: Searches hundreds of sources (example: 48 queries yielding 95k+ reasoning tokens)
- **Expert-Level Analysis**: Deep subject matter expertise with structured insights
- **Citation Tracking**: Every claim backed by verifiable sources
- **128k Context Window**: Can process extensive information
- **Reasoning Effort Control**: Adjustable depth (low/medium/high)
- **Async API**: Support for long-running research tasks

### Cost Structure
```
Input Tokens:      $2/million
Output Tokens:     $8/million  
Citation Tokens:   $2/million
Search Queries:    $5/1000
Reasoning Tokens:  $3/million
```

## Proposed Architecture: Two-Stage Intelligence Pipeline

### Stage 1: Market Intelligence (Sonar Deep Research)
Handles public domain research for business/market analysis:
- Company overview and history
- Market size and growth (TAM/SAM/SOM)
- Competitive landscape analysis
- Financial performance and metrics
- News, partnerships, and announcements
- Industry trends and regulations
- Customer sentiment and reviews
- Executive team and culture

### Stage 2: Technical Intelligence (Claude Orchestrator)
Focuses on proprietary technical analysis:
- Source code architecture review
- API discovery and documentation
- Infrastructure and scalability assessment
- Technology stack evaluation
- Security posture analysis
- Developer ecosystem health
- Integration capabilities
- Technical debt assessment

## Integration Design

### 1. Enhanced Planner-Agent
```typescript
// src/orchestrator/nodes/enhancedPlanner.ts
interface EnhancedPlannerOutput {
  marketResearchPlan: {
    provider: 'sonar-deep-research';
    reasoningEffort: 'low' | 'medium' | 'high';
    focusAreas: string[];
    estimatedCost: number;
    asyncJobId?: string;
  };
  technicalResearchPlan: {
    args: AtomicResearchGoal[];
    tools: string[];
    budget: ResourceBudget;
  };
  sequencing: 'parallel' | 'market-first' | 'technical-first';
}

export async function enhancedPlannerNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const { thesis } = state;
  
  // Determine research strategy based on thesis type
  const strategy = determineResearchStrategy(thesis);
  
  // Plan market research with Sonar
  const marketPlan = {
    provider: 'sonar-deep-research' as const,
    reasoningEffort: getReasoningEffort(thesis),
    focusAreas: getMarketFocusAreas(thesis),
    estimatedCost: estimateSonarCost(thesis),
  };
  
  // Plan technical research with existing tools
  const technicalPlan = await planTechnicalResearch(thesis);
  
  return {
    metadata: {
      ...state.metadata,
      researchPlan: {
        marketResearchPlan: marketPlan,
        technicalResearchPlan: technicalPlan,
        sequencing: strategy.sequencing,
        totalEstimatedCost: marketPlan.estimatedCost + technicalPlan.budget.cost,
      }
    }
  };
}

function getReasoningEffort(thesis: InvestmentThesis): 'low' | 'medium' | 'high' {
  // Use high effort for critical pillars
  const criticalPillars = thesis.pillars.filter(p => p.weight > 0.3);
  
  if (criticalPillars.length > 2) return 'high';
  if (thesis.type === 'turnaround') return 'high'; // Complex analysis needed
  if (thesis.type === 'accelerate-growth') return 'medium';
  return 'low';
}
```

### 2. Sonar Research Node
```typescript
// src/orchestrator/nodes/sonarResearch.ts
import { PerplexityClient } from '../services/perplexity';

interface SonarResearchResult {
  jobId: string;
  status: 'created' | 'processing' | 'completed' | 'failed';
  content?: string;
  citations?: Citation[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    citationTokens: number;
    searchQueries: number;
    reasoningTokens: number;
  };
  insights?: MarketInsights;
}

export async function sonarResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const { marketResearchPlan } = state.metadata?.researchPlan || {};
  if (!marketResearchPlan) return {};
  
  const client = new PerplexityClient();
  
  // Craft comprehensive research prompt
  const researchPrompt = buildMarketResearchPrompt(state.thesis);
  
  // Submit async research request
  const result = await client.submitDeepResearch({
    model: 'sonar-deep-research',
    messages: [{
      role: 'user',
      content: researchPrompt
    }],
    reasoning_effort: marketResearchPlan.reasoningEffort,
  });
  
  // Store job ID for polling
  return {
    metadata: {
      ...state.metadata,
      sonarJobId: result.id,
      sonarStatus: 'processing',
    }
  };
}

function buildMarketResearchPrompt(thesis: InvestmentThesis): string {
  return `Conduct exhaustive investment research on ${thesis.company}.

Investment Thesis: ${thesis.statement}

Required Analysis:
1. Market Analysis
   - Total Addressable Market (TAM) with sources
   - Market growth rates and trends
   - Competitive landscape and market share
   - Regulatory environment

2. Company Overview
   - Business model and revenue streams
   - Financial performance (revenue, growth, profitability)
   - Recent funding and valuation
   - Key partnerships and customers

3. Competitive Position
   - Main competitors and their strengths
   - Competitive advantages/moats
   - Market positioning
   - Pricing strategy

4. Growth Indicators
   - Customer acquisition trends
   - Product development velocity
   - Geographic expansion
   - Team growth and key hires

5. Risk Factors
   - Market risks
   - Competitive threats
   - Regulatory challenges
   - Technology risks

Provide specific data points, metrics, and recent developments. 
Include all sources for verification.`;
}
```

### 3. Result Polling and Integration
```typescript
// src/orchestrator/nodes/sonarResultCollector.ts
export async function sonarResultCollectorNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const { sonarJobId, sonarStatus } = state.metadata || {};
  
  if (!sonarJobId || sonarStatus === 'completed') return {};
  
  const client = new PerplexityClient();
  const result = await client.getAsyncResult(sonarJobId);
  
  if (result.status === 'completed') {
    // Parse Sonar results into evidence
    const marketEvidence = parseSonarResults(result);
    
    // Extract key insights for technical research
    const marketInsights = extractMarketInsights(result);
    
    return {
      evidence: [...state.evidence, ...marketEvidence],
      metadata: {
        ...state.metadata,
        sonarStatus: 'completed',
        marketInsights,
        sonarUsage: result.usage,
        sonarCost: calculateSonarCost(result.usage),
      }
    };
  }
  
  // Still processing - continue polling
  return {
    metadata: {
      ...state.metadata,
      sonarStatus: result.status,
    }
  };
}

function parseSonarResults(result: SonarResearchResult): Evidence[] {
  const evidence: Evidence[] = [];
  
  // Parse structured sections from Sonar output
  const sections = parseStructuredContent(result.content || '');
  
  sections.forEach(section => {
    // Map to appropriate pillar
    const pillarId = mapSectionToPillar(section.title);
    
    // Extract individual facts with citations
    section.facts.forEach(fact => {
      evidence.push({
        id: uuidv4(),
        pillarId,
        source: {
          type: 'sonar-research',
          name: 'Perplexity Deep Research',
          url: fact.citation?.url || '',
          credibilityScore: 0.9, // High credibility for Sonar
        },
        content: fact.content,
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'sonar-deep-research',
          section: section.title,
          citations: fact.citations,
        }
      });
    });
  });
  
  return evidence;
}
```

### 4. Enhanced Section-Agent with Market Context
```typescript
// src/orchestrator/nodes/enhancedSectionAgent.ts
export async function enhancedSectionAgentNode(
  arg: AtomicResearchGoal,
  state: ResearchState
): Promise<SectionAgentResult> {
  const { marketInsights } = state.metadata || {};
  
  // Use market insights to guide technical research
  const enrichedContext = {
    ...arg,
    marketContext: marketInsights?.[arg.pillarId] || {},
    competitorTech: marketInsights?.competitors?.map(c => c.techStack) || [],
    industryBenchmarks: marketInsights?.benchmarks || {},
  };
  
  // Run standard section agent with enriched context
  return sectionAgentWithContext(enrichedContext, state);
}
```

## Cost-Benefit Analysis

### Current Approach Costs (per company)
- Web searches: ~200 searches × $0.01 = $2.00
- LLM calls: ~500k tokens × $0.01/1k = $5.00
- Total: ~$7.00

### Sonar Integration Costs
- Sonar Deep Research: ~$3-5 per comprehensive report
- Reduced web searches: ~50 searches × $0.01 = $0.50
- Focused LLM calls: ~300k tokens × $0.01/1k = $3.00
- Total: ~$6.50-8.50

### Benefits
1. **Quality**: Citation-backed, comprehensive market analysis
2. **Speed**: Parallel market + technical research
3. **Coverage**: Hundreds of sources vs. dozens
4. **Reliability**: Reduced hallucination risk
5. **Efficiency**: Technical research can focus on proprietary analysis

## Implementation Plan

### Phase 1: Basic Integration (Week 1)
```typescript
// src/services/perplexity.ts
export class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';
  
  async submitDeepResearch(request: DeepResearchRequest): Promise<AsyncJobResponse> {
    const response = await fetch(`${this.baseUrl}/async/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request }),
    });
    
    return response.json();
  }
  
  async getAsyncResult(jobId: string): Promise<SonarResearchResult> {
    const response = await fetch(
      `${this.baseUrl}/async/chat/completions/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );
    
    return response.json();
  }
}
```

### Phase 2: Orchestration Integration (Week 2)
1. Add Sonar nodes to LangGraph workflow
2. Implement polling mechanism
3. Create evidence parser
4. Add cost tracking

### Phase 3: Optimization (Week 3)
1. Tune reasoning_effort based on thesis type
2. Implement caching for common queries
3. Add fallback to current approach if Sonar fails
4. A/B test quality improvements

## Configuration

```yaml
# config/sonar.yaml
perplexity:
  api_key: ${PERPLEXITY_API_KEY}
  models:
    deep_research:
      max_retries: 3
      polling_interval: 10s
      timeout: 600s
      
  reasoning_effort:
    investment_dd: high
    account_intel: medium
    quick_scan: low
    
  cost_limits:
    per_research: 10.00
    daily: 1000.00
    
  focus_templates:
    market_analysis:
      - "TAM and market growth"
      - "Competitive landscape"
      - "Customer segments"
    financial_analysis:
      - "Revenue and profitability"
      - "Unit economics"
      - "Funding history"
```

## Expected Outcomes

### Quality Improvements
- **Market Coverage**: 10x more sources analyzed
- **Citation Quality**: 100% fact verification
- **Insight Depth**: Expert-level analysis
- **Consistency**: Standardized research format

### Efficiency Gains
- **Time to Insight**: 50% faster initial research
- **Engineer Focus**: 100% on technical analysis
- **Parallel Processing**: Market + technical simultaneously
- **Cost Efficiency**: Similar or lower total cost

## Conclusion

Integrating Perplexity's Sonar Deep Research creates a powerful two-stage intelligence pipeline:
1. **Sonar** handles exhaustive market/business research
2. **Claude Orchestrator** focuses on proprietary technical analysis

This division of labor leverages each system's strengths while providing comprehensive, citation-backed investment research that exceeds current capabilities.