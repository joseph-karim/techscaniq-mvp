# Research Pipeline Improvement Plan

## Executive Summary

Based on the OneZero Financial Systems research experience, we've identified critical improvements needed to create a more robust, reliable, and aligned research pipeline. This plan addresses the gaps between research execution and report generation, focusing on PE-specific requirements.

## Current State Analysis

### Issues Identified

1. **Fragmented Research Sources**
   - Perplexity Sonar Deep Research runs successfully but independently
   - Evidence collection workers (Crawl4AI, Skyvern) fail due to API limits or configuration issues
   - No unified orchestration between different research tools
   - Results stored in different formats without standardization

2. **Report-Research Misalignment**
   - Reports use hardcoded demo data instead of actual research findings
   - No automatic mapping between research outputs and report sections
   - Evidence citations don't link to actual collected evidence
   - PE-specific thesis validation not integrated into research flow

3. **Error Handling Gaps**
   - Silent failures with fallback to mock data
   - No retry mechanisms for failed API calls
   - Limited visibility into what research actually completed
   - No quality assessment of collected evidence

4. **PE Context Missing**
   - Golden Gate Capital's investment thesis not driving research priorities
   - Generic research queries instead of thesis-aligned questions
   - No weighting of evidence based on investment criteria
   - Missing competitive benchmarking specific to PE evaluation

## Proposed Architecture

### 1. Unified Research Orchestrator

```typescript
interface UnifiedResearchOrchestrator {
  // Core components
  thesisAnalyzer: InvestmentThesisAnalyzer;
  evidenceCollector: MultiSourceEvidenceCollector;
  qualityAssessor: EvidenceQualityScorer;
  reportMapper: ResearchToReportMapper;
  
  // Execution flow
  async executeResearch(params: ResearchParams): Promise<ResearchResult> {
    // 1. Analyze investment thesis
    const researchPlan = await this.thesisAnalyzer.createResearchPlan(params.thesis);
    
    // 2. Execute multi-source collection with retries
    const evidence = await this.evidenceCollector.gatherEvidence(researchPlan);
    
    // 3. Assess quality and fill gaps
    const qualifiedEvidence = await this.qualityAssessor.assess(evidence);
    
    // 4. Map to report structure
    return this.reportMapper.mapToReport(qualifiedEvidence, params.reportType);
  }
}
```

### 2. Investment Thesis Analyzer

```typescript
interface InvestmentThesisAnalyzer {
  // Extract key pillars and weights from thesis
  extractPillars(thesis: string): ThesisPillar[];
  
  // Generate targeted research questions
  generateQuestions(pillars: ThesisPillar[]): ResearchQuestion[];
  
  // Prioritize based on PE firm's focus
  prioritizeResearch(questions: ResearchQuestion[]): PrioritizedPlan;
}
```

### 3. Multi-Source Evidence Collector

```typescript
interface MultiSourceEvidenceCollector {
  sources: {
    perplexity: PerplexitySonarClient;
    crawl4ai: Crawl4AIClient;
    skyvern: SkyvernClient;
    claude: ClaudeAnalysisClient;
    publicData: PublicDataAPIClient; // SEC, Crunchbase, etc.
  };
  
  async gatherEvidence(plan: ResearchPlan): Promise<Evidence[]> {
    // Parallel execution with fallbacks
    const results = await Promise.allSettled([
      this.sources.perplexity.deepResearch(plan.queries),
      this.sources.crawl4ai.crawlTargets(plan.urls),
      this.sources.skyvern.discoverProducts(plan.products),
      this.sources.claude.analyzeDocuments(plan.documents),
      this.sources.publicData.fetchFinancials(plan.company)
    ]);
    
    // Handle failures gracefully
    return this.mergeAndDedupeResults(results);
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

1. **Create Unified Research Service**
   - Build central orchestrator class
   - Implement thesis analyzer for PE contexts
   - Set up structured evidence storage

2. **Standardize Evidence Format**
   ```typescript
   interface StandardEvidence {
     id: string;
     source: EvidenceSource;
     type: EvidenceType;
     content: string;
     structuredData?: any;
     url?: string;
     confidence: number;
     relevanceScore: number;
     thesisPillarId: string;
     citations: Citation[];
     metadata: EvidenceMetadata;
   }
   ```

3. **Error Handling Framework**
   - Implement retry with exponential backoff
   - Add circuit breakers for failing services
   - Create fallback strategies for each source
   - Build comprehensive logging

### Phase 2: Integration (Week 3-4)

1. **Source Integration Improvements**
   - Fix Perplexity API error handling
   - Configure Crawl4AI for financial sites
   - Set up Skyvern for demo discovery
   - Add Claude for document analysis

2. **Quality Assessment System**
   ```typescript
   interface QualityScorer {
     scoreRelevance(evidence: Evidence, thesis: Thesis): number;
     scoreCredibility(source: EvidenceSource): number;
     scoreCompleteness(evidence: Evidence[], requirements: string[]): number;
     identifyGaps(evidence: Evidence[], thesis: Thesis): ResearchGap[];
   }
   ```

3. **Report Mapping Engine**
   - Auto-generate report sections from evidence
   - Map evidence to citation system
   - Ensure thesis alignment in all sections
   - Generate executive summary from findings

### Phase 3: Enhancement (Week 5-6)

1. **PE-Specific Features**
   - Competitive intelligence module
   - Market sizing automation
   - Financial metrics extraction
   - Management team analysis
   - Exit strategy evaluation

2. **Advanced Analytics**
   - Technical debt quantification
   - Scalability assessment algorithms
   - Security vulnerability scanning
   - Integration readiness scoring

3. **Reporting Improvements**
   - Dynamic report generation
   - Interactive evidence browser
   - Confidence visualization
   - Investment recommendation engine

## Technical Implementation Details

### 1. Research Queue Configuration

```typescript
// research-queue-config.ts
export const RESEARCH_QUEUES = {
  'thesis-analysis': {
    concurrency: 1,
    priority: 100
  },
  'perplexity-sonar': {
    concurrency: 3,
    priority: 90,
    rateLimit: {
      max: 10,
      duration: 60000 // per minute
    }
  },
  'crawl4ai': {
    concurrency: 2,
    priority: 80,
    timeout: 300000 // 5 minutes
  },
  'skyvern': {
    concurrency: 1,
    priority: 70,
    retries: 3
  },
  'report-generation': {
    concurrency: 1,
    priority: 60
  }
};
```

### 2. Evidence Collection Orchestration

```typescript
// evidence-orchestrator.ts
export class EvidenceOrchestrator {
  async orchestrateCollection(
    company: string,
    thesis: InvestmentThesis,
    reportType: ReportType
  ): Promise<CollectedEvidence> {
    // 1. Initialize collection tracking
    const collectionId = uuidv4();
    await this.initializeCollection(collectionId, company);
    
    // 2. Generate research plan from thesis
    const researchPlan = await this.generateResearchPlan(thesis);
    
    // 3. Execute parallel collection
    const evidencePromises = [
      this.collectPerplexityEvidence(company, researchPlan),
      this.collectCrawl4AIEvidence(company, researchPlan),
      this.collectSkyvernEvidence(company, researchPlan),
      this.collectPublicDataEvidence(company)
    ];
    
    // 4. Wait for results with timeout
    const results = await Promise.allSettled(
      evidencePromises.map(p => 
        Promise.race([
          p,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 300000)
          )
        ])
      )
    );
    
    // 5. Process and store results
    return this.processResults(results, collectionId);
  }
}
```

### 3. Report Structure Alignment

```typescript
// report-structure-mapper.ts
export class ReportStructureMapper {
  private reportTemplates = {
    'pe-due-diligence': {
      sections: [
        { id: 'executive-summary', requiredEvidence: ['market-size', 'competitive-position', 'growth-metrics'] },
        { id: 'scoring-analysis', requiredEvidence: ['technical-assessment', 'market-opportunity', 'team-quality'] },
        { id: 'deep-dive', requiredEvidence: ['architecture', 'scalability', 'technical-debt'] },
        { id: 'technical-focus', requiredEvidence: ['performance', 'security', 'infrastructure'] },
        { id: 'risk-register', requiredEvidence: ['market-risks', 'technical-risks', 'competitive-risks'] },
        { id: 'value-creation', requiredEvidence: ['growth-opportunities', 'ma-targets', 'exit-options'] }
      ]
    }
  };
  
  mapEvidenceToReport(
    evidence: Evidence[],
    reportType: string,
    thesis: InvestmentThesis
  ): MappedReport {
    const template = this.reportTemplates[reportType];
    const mappedSections = {};
    
    for (const section of template.sections) {
      mappedSections[section.id] = this.mapSectionEvidence(
        evidence,
        section.requiredEvidence,
        thesis
      );
    }
    
    return {
      sections: mappedSections,
      unmappedEvidence: this.findUnmappedEvidence(evidence, mappedSections),
      coverageScore: this.calculateCoverage(mappedSections, template)
    };
  }
}
```

## Quality Metrics

### 1. Evidence Quality Scoring

```typescript
interface EvidenceQualityMetrics {
  relevance: number;      // 0-100: How well it matches thesis
  credibility: number;    // 0-100: Source authority
  recency: number;        // 0-100: How current the data is
  completeness: number;   // 0-100: Information completeness
  corroboration: number;  // 0-100: Multiple source validation
}
```

### 2. Research Completeness Dashboard

```typescript
interface ResearchCompleteness {
  overallScore: number;
  byPillar: {
    pillarId: string;
    name: string;
    targetQuestions: number;
    answeredQuestions: number;
    evidenceQuality: number;
    gaps: string[];
  }[];
  criticalGaps: ResearchGap[];
  recommendations: string[];
}
```

## Error Handling Strategy

### 1. Service-Specific Handlers

```typescript
// perplexity-error-handler.ts
export class PerplexityErrorHandler {
  async handleError(error: PerplexityError): Promise<ErrorResolution> {
    if (error.code === 'rate_limit_exceeded') {
      await this.waitForRateLimit(error.retryAfter);
      return { action: 'retry', delay: error.retryAfter };
    }
    
    if (error.code === 'invalid_api_key') {
      await this.notifyAdmins('Invalid Perplexity API key');
      return { action: 'fallback', service: 'claude' };
    }
    
    if (error.code === 'bad_request') {
      const sanitizedQuery = this.sanitizeQuery(error.query);
      return { action: 'retry', modifiedQuery: sanitizedQuery };
    }
    
    return { action: 'skip', reason: error.message };
  }
}
```

### 2. Fallback Chain

```typescript
const FALLBACK_CHAIN = {
  'perplexity-sonar': ['perplexity-pro', 'claude-web-search', 'serp-api'],
  'crawl4ai': ['playwright-crawler', 'puppeteer-crawler', 'jina-reader'],
  'skyvern': ['selenium-automation', 'manual-discovery'],
  'public-data': ['sec-edgar', 'crunchbase', 'pitchbook']
};
```

## Monitoring and Observability

### 1. Research Pipeline Metrics

```typescript
interface PipelineMetrics {
  // Execution metrics
  totalResearchJobs: number;
  successfulJobs: number;
  failedJobs: number;
  averageExecutionTime: number;
  
  // Source metrics
  sourceAvailability: {
    [source: string]: {
      uptime: number;
      averageLatency: number;
      errorRate: number;
    };
  };
  
  // Quality metrics
  averageEvidenceQuality: number;
  reportCompleteness: number;
  thesisAlignmentScore: number;
}
```

### 2. Real-time Dashboard

- Research job status tracking
- Evidence collection progress
- Source health monitoring
- Quality score trends
- Error rate visualization

## Next Steps

1. **Immediate Actions**
   - Fix Perplexity API error handling
   - Implement retry mechanism
   - Create evidence standardization layer

2. **Short-term Goals**
   - Build unified orchestrator
   - Integrate all evidence sources
   - Create report mapping engine

3. **Long-term Vision**
   - AI-powered research planning
   - Automated competitive intelligence
   - Real-time market monitoring
   - Predictive investment scoring

## Success Criteria

1. **Reliability**: 95%+ research job success rate
2. **Coverage**: 90%+ report sections populated with real evidence
3. **Quality**: 85%+ average evidence quality score
4. **Speed**: < 10 minutes for complete research cycle
5. **Alignment**: 100% of findings mapped to investment thesis

## Conclusion

This improved research pipeline will transform how we conduct PE due diligence, ensuring that every report is backed by comprehensive, high-quality evidence that directly aligns with the investment thesis. By addressing the current gaps and implementing robust orchestration, we'll deliver consistent, reliable insights that drive better investment decisions.