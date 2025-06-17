import { InvestmentThesis, ResearchParams, ResearchResult, ThesisPillar, ResearchQuestion, PrioritizedPlan, Evidence, ResearchGap, EvidenceSource, EvidenceType, SalesIntelligenceContext, SalesValidation, MarketContext, ThesisAlignmentScore, ThesisValidation, EvidenceMetadata } from '../types/research';
import { PerplexitySonarClient } from '../tools/perplexityClient';
import { Crawl4AIClient } from '../tools/crawl4aiClient';
import { SkyvernClient } from '../tools/skyvernClient';
import { ClaudeAnalysisClient } from '../tools/claudeAnalysisClient';
import { PublicDataAPIClient } from '../tools/publicDataClient';
import { ClaudeOrchestrationClient } from '../tools/claudeOrchestrationClient';
import { DeepResearchClient } from '../tools/deepResearchClient';
import { TechnicalAnalysisClient } from '../tools/technicalAnalysisClient';
import { MarketIntelligenceClient } from '../tools/marketIntelligenceClient';
import { v4 as uuidv4 } from 'uuid';

export interface UnifiedResearchOrchestrator {
  thesisAnalyzer: InvestmentThesisAnalyzer;
  evidenceCollector: MultiSourceEvidenceCollector;
  qualityAssessor: EvidenceQualityScorer;
  reportMapper: ResearchToReportMapper;
  claudeOrchestrator: ClaudeOrchestrationClient;
  
  executeResearch(params: ResearchParams): Promise<ResearchResult>;
}

export interface InvestmentThesisAnalyzer {
  extractPillars(thesis: string): ThesisPillar[];
  generateQuestions(pillars: ThesisPillar[], marketContext: MarketContext): ResearchQuestion[];
  prioritizeResearch(questions: ResearchQuestion[], thesis: InvestmentThesis): PrioritizedPlan;
  analyzeThesisAlignment(evidence: Evidence[], thesis: InvestmentThesis): ThesisAlignmentScore;
}


export interface MultiSourceEvidenceCollector {
  sources: {
    perplexity: PerplexitySonarClient;
    crawl4ai: Crawl4AIClient;
    skyvern: SkyvernClient;
    claude: ClaudeAnalysisClient;
    publicData: PublicDataAPIClient;
    deepResearch: DeepResearchClient;
    technicalAnalysis: TechnicalAnalysisClient;
    marketIntelligence: MarketIntelligenceClient;
  };
  
  gatherEvidence(plan: PrioritizedPlan, thesis: InvestmentThesis): Promise<Evidence[]>;
  gatherSalesEvidence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]>;
  orchestrateDeepDive(evidence: Evidence[], thesis: InvestmentThesis): Promise<Evidence[]>;
}

export interface EvidenceQualityScorer {
  scoreRelevance(evidence: Evidence, thesis: InvestmentThesis, marketContext: MarketContext): number;
  scoreCredibility(source: EvidenceSource): number;
  scoreCompleteness(evidence: Evidence[], requirements: string[]): number;
  identifyGaps(evidence: Evidence[], thesis: InvestmentThesis): ResearchGap[];
  assess(evidence: Evidence[], thesis: InvestmentThesis, marketContext: MarketContext): Promise<Evidence[]>;
  assessSalesEvidence(evidence: Evidence[], salesContext: SalesIntelligenceContext, marketContext: MarketContext): Promise<Evidence[]>;
  rankByThesisAlignment(evidence: Evidence[], thesis: InvestmentThesis): Evidence[];
}

export interface ResearchToReportMapper {
  mapToReport(evidence: Evidence[], reportType: string, thesis?: InvestmentThesis): ResearchResult;
  ensureThesisAlignment(sections: any, thesis: InvestmentThesis): any;
  generateThesisValidation(evidence: Evidence[], thesis: InvestmentThesis): ThesisValidation;
}


export class UnifiedResearchOrchestratorImpl implements UnifiedResearchOrchestrator {
  constructor(
    public thesisAnalyzer: InvestmentThesisAnalyzer,
    public evidenceCollector: MultiSourceEvidenceCollector,
    public qualityAssessor: EvidenceQualityScorer,
    public reportMapper: ResearchToReportMapper,
    public claudeOrchestrator: ClaudeOrchestrationClient
  ) {}

  async executeResearch(params: ResearchParams): Promise<ResearchResult> {
    console.log('🚀 Starting unified research orchestration for:', params.company);
    
    try {
      // Determine research context (PE or Sales)
      const isPE = params.reportType === 'pe-due-diligence';
      const context = isPE ? params.thesis : params.salesContext;
      
      if (!context) {
        throw new Error(`Missing ${isPE ? 'investment thesis' : 'sales context'} for ${params.reportType}`);
      }
      
      // 0. Extract market context using Claude orchestration
      console.log('🌍 Analyzing market context...');
      const marketContext = await this.claudeOrchestrator.analyzeMarketContext(
        params.company,
        params.industry || 'technology'
      );
      
      if (isPE && params.thesis) {
        // PE Due Diligence Flow
        return await this.executePEResearch(params, params.thesis, marketContext);
      } else if (!isPE && params.salesContext) {
        // Sales Intelligence Flow
        return await this.executeSalesResearch(params, params.salesContext, marketContext);
      } else {
        throw new Error('Invalid research parameters');
      }
      
    } catch (error) {
      console.error('❌ Research orchestration failed:', error);
      throw error;
    }
  }
  
  private async executePEResearch(
    params: ResearchParams,
    thesis: InvestmentThesis,
    marketContext: MarketContext
  ): Promise<ResearchResult> {
    // 1. Analyze investment thesis with market context
    console.log('📊 Analyzing investment thesis through market lens...');
    const researchPlan = await this.thesisAnalyzer.createResearchPlan(
      thesis,
      marketContext
    );
    console.log(`Generated ${researchPlan.questions.length} thesis-aligned questions`);
    
    // 2. Claude-orchestrated initial research planning
    console.log('🤖 Claude orchestrating research strategy...');
    const researchStrategy = await this.claudeOrchestrator.planResearchStrategy(
      thesis,
      researchPlan,
      marketContext
    );
    
    // 3. Execute multi-source collection with thesis alignment
    console.log('🔍 Gathering evidence aligned to investment thesis...');
    const evidence = await this.evidenceCollector.gatherEvidence(
      researchPlan,
      thesis
    );
    console.log(`Collected ${evidence.length} evidence items`);
    
    // 4. Deep dive orchestration for gaps
    console.log('🔬 Orchestrating deep dive for thesis validation...');
    const enrichedEvidence = await this.evidenceCollector.orchestrateDeepDive(
      evidence,
      thesis
    );
    
    // 5. Assess quality through thesis lens
    console.log('✅ Assessing evidence quality and thesis alignment...');
    const qualifiedEvidence = await this.qualityAssessor.assess(
      enrichedEvidence,
      thesis,
      marketContext
    );
    console.log(`Qualified ${qualifiedEvidence.length} thesis-aligned evidence items`);
    
    // 6. Analyze thesis alignment
    const alignmentScore = await this.thesisAnalyzer.analyzeThesisAlignment(
      qualifiedEvidence,
      thesis
    );
    console.log(`Thesis alignment: ${alignmentScore.overallAlignment}%`);
    
    // 7. Map to report structure with thesis validation
    console.log('📝 Mapping evidence to report with thesis validation...');
    const result = await this.reportMapper.mapToReport(
      qualifiedEvidence,
      params.reportType,
      thesis
    );
    
    // 8. Final Claude orchestration review
    console.log('🎯 Final thesis validation review...');
    const finalValidation = await this.claudeOrchestrator.validateResearchCompleteness(
      result,
      thesis,
      alignmentScore
    );
    
    result.thesisValidation = finalValidation;
    result.alignmentScore = alignmentScore;
    
    console.log('✨ PE research orchestration complete with thesis validation!');
    return result;
  }
  
  private async executeSalesResearch(
    params: ResearchParams,
    salesContext: SalesIntelligenceContext,
    marketContext: MarketContext
  ): Promise<ResearchResult> {
    // 1. Create sales-focused research plan
    console.log('🎯 Creating sales intelligence research plan...');
    const researchPlan = await this.createSalesResearchPlan(salesContext, marketContext);
    console.log(`Generated ${researchPlan.questions.length} sales-focused questions`);
    
    // 2. Execute multi-source collection for sales intelligence
    console.log('🔍 Gathering sales intelligence evidence...');
    const evidence = await this.evidenceCollector.gatherSalesEvidence(
      researchPlan,
      salesContext
    );
    console.log(`Collected ${evidence.length} evidence items`);
    
    // 3. Assess quality for sales context
    console.log('✅ Assessing evidence quality for sales intelligence...');
    const qualifiedEvidence = await this.qualityAssessor.assessSalesEvidence(
      evidence,
      salesContext,
      marketContext
    );
    
    // 4. Map to sales intelligence report structure
    console.log('📝 Mapping evidence to sales intelligence report...');
    const result = await this.reportMapper.mapToReport(
      qualifiedEvidence,
      params.reportType,
      undefined // No thesis for sales intelligence
    );
    
    // 5. Generate sales validation
    console.log('🎯 Generating sales intelligence validation...');
    const salesValidation = await this.generateSalesValidation(
      qualifiedEvidence,
      salesContext
    );
    
    result.salesValidation = salesValidation;
    
    console.log('✨ Sales intelligence orchestration complete!');
    return result;
  }
  
  private async createSalesResearchPlan(
    salesContext: SalesIntelligenceContext,
    marketContext: MarketContext
  ): Promise<PrioritizedPlan> {
    const questions: ResearchQuestion[] = [];
    
    // Product-market fit questions
    questions.push(
      {
        id: uuidv4(),
        pillarId: 'product-fit',
        question: `How does ${salesContext.company}'s ${salesContext.offering} address ${salesContext.idealCustomerProfile.painPoints?.join(', ')}?`,
        priority: 1,
        marketDependent: true
      },
      {
        id: uuidv4(),
        pillarId: 'product-fit',
        question: `What are the key features and capabilities of ${salesContext.offering}?`,
        priority: 1,
        marketDependent: false
      }
    );
    
    // Competitive positioning questions
    if (salesContext.competitiveAlternatives) {
      questions.push({
        id: uuidv4(),
        pillarId: 'competitive',
        question: `How does ${salesContext.company} compare to ${salesContext.competitiveAlternatives.join(', ')}?`,
        priority: 1,
        marketDependent: true
      });
    }
    
    // ROI and value questions
    questions.push({
      id: uuidv4(),
      pillarId: 'value',
      question: `What ROI do ${salesContext.idealCustomerProfile.industry} companies achieve with ${salesContext.offering}?`,
      priority: 2,
      marketDependent: true
    });
    
    // Use case questions
    salesContext.useCases.forEach((useCase, index) => {
      questions.push({
        id: uuidv4(),
        pillarId: 'use-cases',
        question: `How does ${salesContext.company} support ${useCase}?`,
        priority: 2,
        marketDependent: false
      });
    });
    
    return {
      pillars: [
        { id: 'product-fit', name: 'Product-Market Fit', weight: 0.3, keyTerms: [], keywords: ['features', 'capabilities', 'solution'] },
        { id: 'competitive', name: 'Competitive Positioning', weight: 0.25, keyTerms: [], keywords: ['advantage', 'differentiation', 'comparison'] },
        { id: 'value', name: 'Value & ROI', weight: 0.25, keyTerms: [], keywords: ['roi', 'value', 'benefits', 'cost'] },
        { id: 'use-cases', name: 'Use Cases', weight: 0.2, keyTerms: [], keywords: ['implementation', 'deployment', 'integration'] }
      ],
      questions,
      queries: questions.map(q => q.question),
      urls: [`https://www.${salesContext.company.toLowerCase().replace(/\s+/g, '')}.com`],
      products: [salesContext.offering],
      documents: [],
      company: salesContext.company
    };
  }
  
  private async generateSalesValidation(
    evidence: Evidence[],
    salesContext: SalesIntelligenceContext
  ): Promise<SalesValidation> {
    // Analyze product-market fit
    const productFitEvidence = evidence.filter(e => 
      e.metadata?.pillarId === 'product-fit' || 
      e.content.toLowerCase().includes('feature') ||
      e.content.toLowerCase().includes('capability')
    );
    
    const competitiveEvidence = evidence.filter(e =>
      e.metadata?.pillarId === 'competitive' ||
      salesContext.competitiveAlternatives?.some(comp => 
        e.content.toLowerCase().includes(comp.toLowerCase())
      )
    );
    
    const fitScore = this.calculateProductMarketFit(productFitEvidence, salesContext);
    
    return {
      productMarketFit: fitScore >= 70,
      fitScore,
      keyStrengths: this.extractKeyStrengths(evidence),
      gaps: this.identifySalesGaps(evidence, salesContext),
      competitiveAdvantages: this.extractCompetitiveAdvantages(competitiveEvidence),
      recommendedApproach: this.generateSalesRecommendations(fitScore, evidence, salesContext)
    };
  }
  
  private calculateProductMarketFit(evidence: Evidence[], context: SalesIntelligenceContext): number {
    let score = 0;
    
    // Check pain point coverage
    const painPointsCovered = context.idealCustomerProfile.painPoints?.filter(pain =>
      evidence.some(e => e.content.toLowerCase().includes(pain.toLowerCase()))
    ).length || 0;
    
    const totalPainPoints = context.idealCustomerProfile.painPoints?.length || 1;
    score += (painPointsCovered / totalPainPoints) * 40;
    
    // Check use case coverage
    const useCasesCovered = context.useCases.filter(useCase =>
      evidence.some(e => e.content.toLowerCase().includes(useCase.toLowerCase()))
    ).length;
    
    score += (useCasesCovered / context.useCases.length) * 30;
    
    // Evidence quality bonus
    const avgQuality = evidence.reduce((sum, e) => sum + (e.metadata?.qualityScore || 0), 0) / evidence.length;
    score += (avgQuality / 100) * 30;
    
    return Math.round(score);
  }
  
  private extractKeyStrengths(evidence: Evidence[]): string[] {
    const strengths: string[] = [];
    
    // Look for positive indicators
    const positiveTerms = ['leading', 'innovative', 'comprehensive', 'powerful', 'trusted', 'proven'];
    
    evidence.forEach(e => {
      positiveTerms.forEach(term => {
        if (e.content.toLowerCase().includes(term)) {
          const sentence = e.content.split('.').find(s => s.toLowerCase().includes(term));
          if (sentence && !strengths.includes(sentence)) {
            strengths.push(sentence.trim());
          }
        }
      });
    });
    
    return strengths.slice(0, 5);
  }
  
  private identifySalesGaps(evidence: Evidence[], context: SalesIntelligenceContext): string[] {
    const gaps: string[] = [];
    
    // Check for missing pain point coverage
    context.idealCustomerProfile.painPoints?.forEach(pain => {
      const covered = evidence.some(e => e.content.toLowerCase().includes(pain.toLowerCase()));
      if (!covered) {
        gaps.push(`Limited evidence for addressing: ${pain}`);
      }
    });
    
    // Check for missing use case coverage
    context.useCases.forEach(useCase => {
      const covered = evidence.some(e => e.content.toLowerCase().includes(useCase.toLowerCase()));
      if (!covered) {
        gaps.push(`No clear implementation path for: ${useCase}`);
      }
    });
    
    return gaps;
  }
  
  private extractCompetitiveAdvantages(evidence: Evidence[]): string[] {
    const advantages: string[] = [];
    
    const competitiveTerms = ['better than', 'superior', 'advantage', 'unique', 'only', 'first'];
    
    evidence.forEach(e => {
      competitiveTerms.forEach(term => {
        if (e.content.toLowerCase().includes(term)) {
          const sentence = e.content.split('.').find(s => s.toLowerCase().includes(term));
          if (sentence && !advantages.includes(sentence)) {
            advantages.push(sentence.trim());
          }
        }
      });
    });
    
    return advantages.slice(0, 5);
  }
  
  private generateSalesRecommendations(
    fitScore: number,
    evidence: Evidence[],
    context: SalesIntelligenceContext
  ): string[] {
    const recommendations: string[] = [];
    
    if (fitScore >= 80) {
      recommendations.push('Strong product-market fit - proceed with evaluation');
      recommendations.push('Focus on ROI demonstration and proof of concept');
    } else if (fitScore >= 60) {
      recommendations.push('Moderate fit - request specific use case demonstrations');
      recommendations.push('Clarify implementation approach for key pain points');
    } else {
      recommendations.push('Limited fit - reassess requirements or explore alternatives');
      recommendations.push('Request custom solution capabilities discussion');
    }
    
    // Budget-specific recommendations
    if (context.budgetRange) {
      recommendations.push('Request pricing proposal within specified budget range');
    }
    
    // Timeline-specific recommendations
    if (context.evaluationTimeline) {
      recommendations.push(`Align POC timeline with ${context.evaluationTimeline} evaluation period`);
    }
    
    return recommendations;
  }
}

export class InvestmentThesisAnalyzerImpl implements InvestmentThesisAnalyzer {
  extractPillars(thesis: string): ThesisPillar[] {
    // Extract investment pillars specific to PE thesis
    const pillars: ThesisPillar[] = [];
    
    // PE-specific investment pillars with thesis keywords
    const pillarPatterns = [
      { 
        pattern: /platform\s+(consolidation|play|acquisition|roll-up)/gi, 
        name: 'Platform Consolidation', 
        weight: 0.30,
        keywords: ['M&A', 'acquisition', 'consolidation', 'roll-up', 'platform']
      },
      { 
        pattern: /organic\s+(growth|expansion)|revenue\s+growth|market\s+expansion/gi, 
        name: 'Organic Growth', 
        weight: 0.25,
        keywords: ['growth', 'expansion', 'revenue', 'market share', 'penetration']
      },
      { 
        pattern: /operational\s+(improvement|efficiency|excellence)|margin\s+expansion/gi, 
        name: 'Operational Excellence', 
        weight: 0.20,
        keywords: ['efficiency', 'margins', 'optimization', 'cost reduction', 'automation']
      },
      { 
        pattern: /technology\s+(transformation|modernization)|digital\s+transformation/gi, 
        name: 'Technology Transformation', 
        weight: 0.15,
        keywords: ['technology', 'digital', 'modernization', 'cloud', 'AI/ML']
      },
      { 
        pattern: /exit\s+(strategy|multiple|opportunity)|strategic\s+buyer/gi, 
        name: 'Exit Strategy', 
        weight: 0.10,
        keywords: ['exit', 'strategic buyer', 'IPO', 'multiple expansion', 'valuation']
      }
    ];
    
    // Analyze thesis text for pillar presence and weight
    pillarPatterns.forEach(({ pattern, name, weight, keywords }) => {
      const matches = thesis.match(pattern);
      if (matches || keywords.some(kw => thesis.toLowerCase().includes(kw.toLowerCase()))) {
        pillars.push({
          id: uuidv4(),
          name,
          weight: this.adjustWeightByEmphasis(thesis, keywords, weight),
          keyTerms: matches || [],
          keywords
        });
      }
    });
    
    // Normalize weights
    const totalWeight = pillars.reduce((sum, p) => sum + p.weight, 0);
    pillars.forEach(p => p.weight = p.weight / totalWeight);
    
    return pillars;
  }
  
  private adjustWeightByEmphasis(thesis: string, keywords: string[], baseWeight: number): number {
    // Count keyword occurrences to adjust weight
    const thesisLower = thesis.toLowerCase();
    let occurrences = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = thesisLower.match(regex);
      occurrences += matches ? matches.length : 0;
    });
    
    // Adjust weight based on emphasis (more occurrences = higher weight)
    return baseWeight * (1 + Math.min(occurrences * 0.1, 0.5));
  }
  
  generateQuestions(pillars: ThesisPillar[], marketContext: MarketContext): ResearchQuestion[] {
    const questions: ResearchQuestion[] = [];
    
    pillars.forEach(pillar => {
      switch (pillar.name) {
        case 'Platform Consolidation':
          questions.push(
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What are the acquisition targets in the ${marketContext.industry} ${marketContext.geography} market?`, 
              priority: 1,
              marketDependent: true
            },
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `How does the technology architecture support multi-tenant platform consolidation?`, 
              priority: 1,
              marketDependent: false
            },
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What is the integration complexity and cost for typical acquisitions in this ${marketContext.sector}?`, 
              priority: 2,
              marketDependent: true
            }
          );
          break;
          
        case 'Organic Growth':
          questions.push(
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What is the TAM and growth rate for ${marketContext.industry} in ${marketContext.geography}?`, 
              priority: 1,
              marketDependent: true
            },
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `How does the product roadmap align with ${marketContext.marketMaturity} market needs?`, 
              priority: 1,
              marketDependent: true
            },
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What are the customer acquisition costs and LTV in this market segment?`, 
              priority: 2,
              marketDependent: true
            }
          );
          break;
          
        case 'Operational Excellence':
          questions.push(
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What operational inefficiencies exist compared to ${marketContext.industry} benchmarks?`, 
              priority: 1,
              marketDependent: true
            },
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `How can technology automation improve margins in ${marketContext.regulatoryEnvironment} environment?`, 
              priority: 2,
              marketDependent: true
            }
          );
          break;
          
        case 'Technology Transformation':
          // Market-dependent technical questions
          if (marketContext.marketMaturity === 'mature' || marketContext.marketMaturity === 'declining') {
            questions.push(
              { 
                id: uuidv4(), 
                pillarId: pillar.id, 
                question: `How can legacy system modernization unlock new revenue in mature ${marketContext.industry} markets?`, 
                priority: 1,
                marketDependent: true
              }
            );
          } else {
            questions.push(
              { 
                id: uuidv4(), 
                pillarId: pillar.id, 
                question: `How does the technology scale to capture ${marketContext.marketMaturity} market growth?`, 
                priority: 1,
                marketDependent: true
              }
            );
          }
          
          questions.push(
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What technical debt exists and how does it impact ${marketContext.competitiveDynamics}?`, 
              priority: 2,
              marketDependent: true
            }
          );
          break;
          
        case 'Exit Strategy':
          questions.push(
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `Who are the strategic buyers in ${marketContext.industry} and what are their acquisition criteria?`, 
              priority: 2,
              marketDependent: true
            },
            { 
              id: uuidv4(), 
              pillarId: pillar.id, 
              question: `What comparable transactions support exit multiples in ${marketContext.geography} ${marketContext.sector}?`, 
              priority: 3,
              marketDependent: true
            }
          );
          break;
      }
    });
    
    return questions;
  }
  
  prioritizeResearch(questions: ResearchQuestion[], thesis: InvestmentThesis): PrioritizedPlan {
    // Prioritize based on thesis emphasis and dependencies
    const prioritized = questions.sort((a, b) => {
      // First by explicit priority
      if (a.priority !== b.priority) return a.priority - b.priority;
      
      // Then by market dependency (market-dependent questions first)
      if (a.marketDependent && !b.marketDependent) return -1;
      if (!a.marketDependent && b.marketDependent) return 1;
      
      return 0;
    });
    
    return {
      pillars: [],
      questions: prioritized,
      queries: prioritized.map(q => q.question),
      urls: this.generateTargetUrls(thesis),
      products: [thesis.company],
      documents: [],
      company: thesis.company
    };
  }
  
  private generateTargetUrls(thesis: InvestmentThesis): string[] {
    // Generate URLs based on company and thesis focus
    const urls = [
      `https://www.${thesis.company.toLowerCase().replace(/\s+/g, '')}.com`,
      `https://www.crunchbase.com/organization/${thesis.company.toLowerCase().replace(/\s+/g, '-')}`,
      `https://pitchbook.com/profiles/company/${thesis.company.toLowerCase().replace(/\s+/g, '-')}`
    ];
    
    // Add thesis-specific URLs
    if (thesis.description.includes('consolidation')) {
      urls.push('https://www.mergersandinquisitions.com');
    }
    
    return urls;
  }
  
  async createResearchPlan(thesis: InvestmentThesis, marketContext: MarketContext): Promise<PrioritizedPlan> {
    const pillars = this.extractPillars(thesis.description);
    const questions = this.generateQuestions(pillars, marketContext);
    const plan = this.prioritizeResearch(questions, thesis);
    
    plan.pillars = pillars;
    plan.company = thesis.company;
    
    return plan;
  }
  
  async analyzeThesisAlignment(evidence: Evidence[], thesis: InvestmentThesis): Promise<ThesisAlignmentScore> {
    const pillars = this.extractPillars(thesis.description);
    const pillarScores: Record<string, number> = {};
    const supportingEvidence: Evidence[] = [];
    const contradictingEvidence: Evidence[] = [];
    const gaps: string[] = [];
    
    // Score each pillar based on evidence
    pillars.forEach(pillar => {
      const pillarEvidence = evidence.filter(e => e.thesisPillarId === pillar.id);
      const supportCount = pillarEvidence.filter(e => e.metadata?.supports === true).length;
      const contradictCount = pillarEvidence.filter(e => e.metadata?.contradicts === true).length;
      
      if (pillarEvidence.length === 0) {
        pillarScores[pillar.name] = 0;
        gaps.push(`No evidence found for ${pillar.name}`);
      } else {
        pillarScores[pillar.name] = (supportCount / (supportCount + contradictCount)) * 100;
        
        supportingEvidence.push(...pillarEvidence.filter(e => e.metadata?.supports === true));
        contradictingEvidence.push(...pillarEvidence.filter(e => e.metadata?.contradicts === true));
      }
    });
    
    // Calculate weighted overall alignment
    const overallAlignment = pillars.reduce((sum, pillar) => {
      return sum + (pillarScores[pillar.name] || 0) * pillar.weight;
    }, 0);
    
    // Generate recommendations
    const recommendations = this.generateThesisRecommendations(
      pillarScores,
      gaps,
      contradictingEvidence
    );
    
    return {
      overallAlignment: Math.round(overallAlignment),
      pillarScores,
      supportingEvidence,
      contradictingEvidence,
      gaps,
      recommendations
    };
  }
  
  private generateThesisRecommendations(
    pillarScores: Record<string, number>,
    gaps: string[],
    contradictingEvidence: Evidence[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Low scoring pillars
    Object.entries(pillarScores).forEach(([pillar, score]) => {
      if (score < 50) {
        recommendations.push(`Re-evaluate ${pillar} thesis - evidence shows limited support (${score}% alignment)`);
      }
    });
    
    // Critical gaps
    if (gaps.length > 0) {
      recommendations.push(`Conduct additional research to address ${gaps.length} evidence gaps`);
    }
    
    // Contradicting evidence
    if (contradictingEvidence.length > 3) {
      recommendations.push(`Review thesis assumptions - ${contradictingEvidence.length} contradicting data points found`);
    }
    
    return recommendations;
  }
}

export class MultiSourceEvidenceCollectorImpl implements MultiSourceEvidenceCollector {
  constructor(
    public sources: {
      perplexity: PerplexitySonarClient;
      crawl4ai: Crawl4AIClient;
      skyvern: SkyvernClient;
      claude: ClaudeAnalysisClient;
      publicData: PublicDataAPIClient;
      deepResearch: DeepResearchClient;
      technicalAnalysis: TechnicalAnalysisClient;
      marketIntelligence: MarketIntelligenceClient;
    }
  ) {}
  
  async gatherSalesEvidence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]> {
    console.log('🎯 Executing sales-focused evidence collection...');
    
    // Execute sources optimized for sales intelligence
    const results = await Promise.allSettled([
      // Product and feature research
      this.collectProductEvidence(plan, salesContext),
      this.collectPerplexitySalesEvidence(plan, salesContext),
      
      // Competitive research
      this.collectCompetitiveIntelligence(plan, salesContext),
      
      // Customer and use case research
      this.collectCustomerEvidence(plan, salesContext),
      
      // Pricing and ROI research
      this.collectPricingEvidence(plan, salesContext)
    ]);
    
    // Process results
    const allEvidence: Evidence[] = [];
    const errors: string[] = [];
    
    results.forEach((result, index) => {
      const sourceName = ['Product Info', 'General Research', 'Competitive Intel', 'Customer Evidence', 'Pricing/ROI'][index];
      
      if (result.status === 'fulfilled' && result.value) {
        console.log(`✅ ${sourceName}: Collected ${result.value.length} sales evidence items`);
        allEvidence.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`❌ ${sourceName} failed:`, result.reason);
        errors.push(`${sourceName}: ${result.reason.message}`);
      }
    });
    
    console.log(`\n📊 Sales Evidence Collection Summary:`);
    console.log(`- Total evidence collected: ${allEvidence.length}`);
    console.log(`- Successful sources: ${results.filter(r => r.status === 'fulfilled').length}/5`);
    
    return this.mergeAndDedupeResults(allEvidence);
  }
  
  private async collectProductEvidence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]> {
    try {
      // Product-specific queries
      const queries = [
        `${salesContext.company} ${salesContext.offering} features capabilities`,
        `${salesContext.offering} implementation requirements`,
        `${salesContext.offering} technical specifications`
      ];
      
      const evidence: Evidence[] = [];
      
      for (const query of queries) {
        const results = await this.sources.perplexity.search(query);
        results.citations.forEach(citation => {
          evidence.push({
            id: uuidv4(),
            source: 'perplexity' as EvidenceSource,
            type: 'product' as EvidenceType,
            title: citation.title,
            content: citation.excerpt,
            url: citation.url,
            confidence: 0.85,
            relevanceScore: 0.8,
            thesisPillarId: 'product-fit',
            citations: [],
            metadata: {
              timestamp: new Date().toISOString(),
              salesContext: 'product-features',
              pillarId: 'product-fit'
            }
          });
        });
      }
      
      return evidence;
    } catch (error) {
      console.error('Product evidence collection failed:', error);
      throw error;
    }
  }
  
  private async collectCompetitiveIntelligence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]> {
    if (!salesContext.competitiveAlternatives || salesContext.competitiveAlternatives.length === 0) {
      return [];
    }
    
    try {
      const evidence: Evidence[] = [];
      
      // Compare against each competitor
      for (const competitor of salesContext.competitiveAlternatives) {
        const query = `${salesContext.company} vs ${competitor} comparison features pricing`;
        const results = await this.sources.perplexity.search(query);
        
        results.citations.forEach(citation => {
          evidence.push({
            id: uuidv4(),
            source: 'perplexity' as EvidenceSource,
            type: 'competitive' as EvidenceType,
            title: citation.title,
            content: citation.excerpt,
            url: citation.url,
            confidence: 0.8,
            relevanceScore: 0.85,
            thesisPillarId: 'competitive',
            citations: [],
            metadata: {
              timestamp: new Date().toISOString(),
              salesContext: 'competitive-analysis',
              competitor,
              pillarId: 'competitive'
            }
          });
        });
      }
      
      return evidence;
    } catch (error) {
      console.error('Competitive intelligence collection failed:', error);
      throw error;
    }
  }
  
  private async collectCustomerEvidence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]> {
    try {
      const queries = [
        `${salesContext.company} customer case studies ${salesContext.idealCustomerProfile.industry || ''}`,
        `${salesContext.offering} implementation ${salesContext.idealCustomerProfile.companySize || 'enterprise'}`,
        `${salesContext.company} customer reviews testimonials`
      ];
      
      const evidence: Evidence[] = [];
      
      for (const query of queries) {
        const results = await this.sources.perplexity.search(query);
        results.citations.forEach(citation => {
          evidence.push({
            id: uuidv4(),
            source: 'perplexity' as EvidenceSource,
            type: 'customer' as EvidenceType,
            title: citation.title,
            content: citation.excerpt,
            url: citation.url,
            confidence: 0.85,
            relevanceScore: 0.8,
            thesisPillarId: 'use-cases',
            citations: [],
            metadata: {
              timestamp: new Date().toISOString(),
              salesContext: 'customer-evidence',
              pillarId: 'use-cases'
            }
          });
        });
      }
      
      return evidence;
    } catch (error) {
      console.error('Customer evidence collection failed:', error);
      throw error;
    }
  }
  
  private async collectPricingEvidence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]> {
    try {
      const queries = [
        `${salesContext.offering} pricing cost`,
        `${salesContext.company} ROI case studies`,
        `${salesContext.offering} total cost of ownership TCO`
      ];
      
      const evidence: Evidence[] = [];
      
      for (const query of queries) {
        const results = await this.sources.perplexity.search(query);
        results.citations.forEach(citation => {
          evidence.push({
            id: uuidv4(),
            source: 'perplexity' as EvidenceSource,
            type: 'pricing' as EvidenceType,
            title: citation.title,
            content: citation.excerpt,
            url: citation.url,
            confidence: 0.8,
            relevanceScore: 0.75,
            thesisPillarId: 'value',
            citations: [],
            metadata: {
              timestamp: new Date().toISOString(),
              salesContext: 'pricing-roi',
              pillarId: 'value'
            }
          });
        });
      }
      
      return evidence;
    } catch (error) {
      console.error('Pricing evidence collection failed:', error);
      throw error;
    }
  }
  
  private async collectPerplexitySalesEvidence(plan: PrioritizedPlan, salesContext: SalesIntelligenceContext): Promise<Evidence[]> {
    try {
      const queries = plan.questions.slice(0, 5).map(q => q.question);
      const results = await Promise.all(
        queries.map(query => this.sources.perplexity.search(query))
      );
      
      return results.flatMap((result, index) => 
        result.citations.map(citation => ({
          id: uuidv4(),
          source: 'perplexity' as EvidenceSource,
          type: 'document' as EvidenceType,
          title: citation.title,
          content: citation.excerpt,
          url: citation.url,
          confidence: 0.85,
          relevanceScore: 0.8,
          thesisPillarId: plan.questions[index]?.pillarId || '',
          citations: [],
          metadata: {
            timestamp: new Date().toISOString(),
            salesContext: 'general-research',
            pillarId: plan.questions[index]?.pillarId
          }
        }))
      );
    } catch (error) {
      console.error('Perplexity sales evidence collection failed:', error);
      throw error;
    }
  }
  
  async gatherEvidence(plan: PrioritizedPlan, thesis: InvestmentThesis): Promise<Evidence[]> {
    console.log('🎯 Executing thesis-aligned evidence collection...');
    
    // Group questions by market dependency
    const marketDependentQuestions = plan.questions.filter(q => q.marketDependent);
    const technicalQuestions = plan.questions.filter(q => !q.marketDependent);
    
    // Execute sources based on question types
    const results = await Promise.allSettled([
      // Market-dependent research
      this.collectMarketIntelligence(marketDependentQuestions, thesis),
      this.collectPerplexityEvidence(plan, thesis),
      
      // Technical research
      this.collectTechnicalAnalysis(technicalQuestions, thesis),
      this.collectCrawl4AIEvidence(plan, thesis),
      
      // Product discovery
      this.collectSkyvernEvidence(plan, thesis),
      
      // Financial and public data
      this.collectPublicData(plan, thesis),
      
      // Deep research for critical pillars
      this.collectDeepResearch(plan.pillars.slice(0, 2), thesis)
    ]);
    
    // Process results with thesis alignment scoring
    const allEvidence: Evidence[] = [];
    const errors: string[] = [];
    
    results.forEach((result, index) => {
      const sourceName = ['Market Intelligence', 'Perplexity', 'Technical Analysis', 'Crawl4AI', 'Skyvern', 'Public Data', 'Deep Research'][index];
      
      if (result.status === 'fulfilled' && result.value) {
        console.log(`✅ ${sourceName}: Collected ${result.value.length} thesis-aligned evidence items`);
        allEvidence.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`❌ ${sourceName} failed:`, result.reason);
        errors.push(`${sourceName}: ${result.reason.message}`);
      }
    });
    
    // Log collection summary
    console.log(`\n📊 Thesis-Aligned Evidence Collection Summary:`);
    console.log(`- Total evidence collected: ${allEvidence.length}`);
    console.log(`- Successful sources: ${results.filter(r => r.status === 'fulfilled').length}/7`);
    if (errors.length > 0) {
      console.log(`- Failed sources: ${errors.join(', ')}`);
    }
    
    return this.mergeAndDedupeResults(allEvidence);
  }
  
  async orchestrateDeepDive(evidence: Evidence[], thesis: InvestmentThesis): Promise<Evidence[]> {
    console.log('🔬 Orchestrating deep dive for thesis validation...');
    
    // Identify gaps and low-confidence areas
    const lowConfidenceEvidence = evidence.filter(e => e.confidence < 0.7);
    const uncoveredPillars = this.identifyUncoveredPillars(evidence, thesis);
    
    // Claude orchestrates targeted deep dives
    const deepDiveTasks = [
      ...lowConfidenceEvidence.map(e => ({
        type: 'validate',
        evidence: e,
        thesis: thesis
      })),
      ...uncoveredPillars.map(pillar => ({
        type: 'explore',
        pillar: pillar,
        thesis: thesis
      }))
    ];
    
    // Execute deep dives in parallel
    const deepDiveResults = await Promise.allSettled(
      deepDiveTasks.map(task => this.executeDeepDive(task))
    );
    
    // Merge deep dive results with original evidence
    const additionalEvidence: Evidence[] = [];
    deepDiveResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        additionalEvidence.push(...result.value);
      }
    });
    
    console.log(`🔬 Deep dive added ${additionalEvidence.length} evidence items`);
    
    return [...evidence, ...additionalEvidence];
  }
  
  private async executeDeepDive(task: any): Promise<Evidence[]> {
    if (task.type === 'validate') {
      // Validate existing evidence with deeper research
      return this.sources.deepResearch.validateEvidence(task.evidence, task.thesis);
    } else if (task.type === 'explore') {
      // Explore uncovered pillar
      return this.sources.deepResearch.explorePillar(task.pillar, task.thesis);
    }
    
    return [];
  }
  
  private identifyUncoveredPillars(evidence: Evidence[], thesis: InvestmentThesis): ThesisPillar[] {
    const analyzer = new InvestmentThesisAnalyzerImpl();
    const pillars = analyzer.extractPillars(thesis.description);
    
    return pillars.filter(pillar => {
      const pillarEvidence = evidence.filter(e => e.thesisPillarId === pillar.id);
      return pillarEvidence.length < 3; // Less than 3 pieces of evidence
    });
  }
  
  private async collectMarketIntelligence(questions: ResearchQuestion[], thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      const marketInsights = await this.sources.marketIntelligence.analyzeMarket(
        thesis.company,
        questions.map(q => q.question)
      );
      
      return marketInsights.map(insight => ({
        id: uuidv4(),
        source: 'marketIntelligence' as EvidenceSource,
        type: 'market' as EvidenceType,
        title: insight.title,
        content: insight.analysis,
        url: insight.source,
        confidence: insight.confidence,
        relevanceScore: 0.9,
        thesisPillarId: questions[0]?.pillarId || '',
        citations: insight.citations || [],
        metadata: {
          timestamp: new Date().toISOString(),
          marketData: insight.data,
          supports: this.evaluateThesisSupport(insight.analysis, thesis),
          contradicts: this.evaluateThesisContradiction(insight.analysis, thesis)
        }
      }));
    } catch (error) {
      console.error('Market intelligence collection failed:', error);
      throw error;
    }
  }
  
  private async collectTechnicalAnalysis(questions: ResearchQuestion[], thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      const technicalInsights = await this.sources.technicalAnalysis.analyzeTechnology(
        thesis.company,
        questions.map(q => q.question)
      );
      
      return technicalInsights.map(insight => ({
        id: uuidv4(),
        source: 'technicalAnalysis' as EvidenceSource,
        type: 'technical' as EvidenceType,
        title: insight.title,
        content: insight.analysis,
        url: '',
        confidence: insight.confidence,
        relevanceScore: 0.85,
        thesisPillarId: questions.find(q => q.question.includes('technology'))?.pillarId || '',
        citations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          technicalData: insight.data,
          supports: this.evaluateThesisSupport(insight.analysis, thesis),
          contradicts: this.evaluateThesisContradiction(insight.analysis, thesis)
        }
      }));
    } catch (error) {
      console.error('Technical analysis failed:', error);
      throw error;
    }
  }
  
  private async collectDeepResearch(pillars: ThesisPillar[], thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      const deepInsights = await Promise.all(
        pillars.map(pillar => 
          this.sources.deepResearch.researchPillar(pillar, thesis)
        )
      );
      
      return deepInsights.flat();
    } catch (error) {
      console.error('Deep research failed:', error);
      throw error;
    }
  }
  
  private async collectPerplexityEvidence(plan: PrioritizedPlan, thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      const queries = plan.questions.slice(0, 5).map(q => q.question);
      const results = await Promise.all(
        queries.map(query => this.sources.perplexity.search(query))
      );
      
      return results.flatMap((result, index) => 
        result.citations.map(citation => ({
          id: uuidv4(),
          source: 'perplexity' as EvidenceSource,
          type: 'document' as EvidenceType,
          title: citation.title,
          content: citation.excerpt,
          url: citation.url,
          confidence: 0.9,
          relevanceScore: this.calculateThesisRelevance(citation.excerpt, thesis),
          thesisPillarId: plan.questions[index]?.pillarId || '',
          citations: [],
          metadata: {
            timestamp: new Date().toISOString(),
            supports: this.evaluateThesisSupport(citation.excerpt, thesis),
            contradicts: this.evaluateThesisContradiction(citation.excerpt, thesis)
          }
        }))
      );
    } catch (error) {
      console.error('Perplexity evidence collection failed:', error);
      throw error;
    }
  }
  
  private async collectCrawl4AIEvidence(plan: PrioritizedPlan, thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      if (!plan.urls || plan.urls.length === 0) return [];
      
      const results = await this.sources.crawl4ai.crawlPages(plan.urls.slice(0, 5));
      
      return results.map(result => ({
        id: uuidv4(),
        source: 'crawl4ai' as EvidenceSource,
        type: 'webpage' as EvidenceType,
        title: result.title,
        content: result.content,
        url: result.url,
        confidence: 0.85,
        relevanceScore: this.calculateThesisRelevance(result.content, thesis),
        thesisPillarId: this.matchContentToPillar(result.content, plan.pillars),
        citations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          pageMetadata: result.metadata,
          supports: this.evaluateThesisSupport(result.content, thesis),
          contradicts: this.evaluateThesisContradiction(result.content, thesis)
        }
      }));
    } catch (error) {
      console.error('Crawl4AI evidence collection failed:', error);
      throw error;
    }
  }
  
  private async collectSkyvernEvidence(plan: PrioritizedPlan, thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      const productInfo = await this.sources.skyvern.discoverProducts(plan.company);
      
      return productInfo.map(product => ({
        id: uuidv4(),
        source: 'skyvern' as EvidenceSource,
        type: 'product' as EvidenceType,
        title: `${product.name} - Product Discovery`,
        content: product.description,
        url: product.demoUrl,
        confidence: 0.8,
        relevanceScore: 0.75,
        thesisPillarId: plan.pillars.find(p => p.name === 'Technology Transformation')?.id || '',
        citations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          productData: product,
          supports: product.features?.includes('scalable') || product.features?.includes('enterprise'),
          contradicts: product.limitations?.includes('legacy') || product.limitations?.includes('outdated')
        }
      }));
    } catch (error) {
      console.error('Skyvern evidence collection failed:', error);
      // Return empty array for now since Skyvern is having issues
      return [];
    }
  }
  
  private async collectPublicData(plan: PrioritizedPlan, thesis: InvestmentThesis): Promise<Evidence[]> {
    try {
      const financialData = await this.sources.publicData.fetchCompanyData(plan.company);
      
      // Analyze financial data for thesis alignment
      const growthRate = financialData.revenueGrowth || 0;
      const supports = growthRate > 20; // High growth supports most PE theses
      
      return [{
        id: uuidv4(),
        source: 'publicData' as EvidenceSource,
        type: 'financial' as EvidenceType,
        title: `${plan.company} Financial Data`,
        content: JSON.stringify(financialData, null, 2),
        url: financialData.source,
        confidence: 0.95,
        relevanceScore: 0.85,
        thesisPillarId: plan.pillars.find(p => p.name === 'Organic Growth')?.id || '',
        citations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          financialData,
          supports,
          contradicts: !supports && growthRate < 5
        }
      }];
    } catch (error) {
      console.error('Public data collection failed:', error);
      // Return empty array if no public data available
      return [];
    }
  }
  
  private calculateThesisRelevance(content: string, thesis: InvestmentThesis): number {
    const thesisKeywords = thesis.description.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let relevanceScore = 0;
    thesisKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        relevanceScore += 0.1;
      }
    });
    
    return Math.min(1, relevanceScore);
  }
  
  private evaluateThesisSupport(content: string, thesis: InvestmentThesis): boolean {
    const supportingTerms = ['growth', 'expansion', 'increasing', 'opportunity', 'strong', 'leading'];
    const contentLower = content.toLowerCase();
    
    return supportingTerms.some(term => contentLower.includes(term));
  }
  
  private evaluateThesisContradiction(content: string, thesis: InvestmentThesis): boolean {
    const contradictingTerms = ['declining', 'challenges', 'risks', 'competition', 'legacy', 'outdated'];
    const contentLower = content.toLowerCase();
    
    return contradictingTerms.some(term => contentLower.includes(term));
  }
  
  private matchContentToPillar(content: string, pillars: ThesisPillar[]): string {
    let bestMatch = '';
    let highestScore = 0;
    
    pillars.forEach(pillar => {
      let score = 0;
      pillar.keywords?.forEach(keyword => {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          score++;
        }
      });
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = pillar.id;
      }
    });
    
    return bestMatch;
  }
  
  private mergeAndDedupeResults(evidence: Evidence[]): Evidence[] {
    // Remove duplicates and merge similar evidence
    const seen = new Set<string>();
    const dedupedEvidence: Evidence[] = [];
    
    evidence.forEach(item => {
      const key = `${item.url || ''}_${item.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        dedupedEvidence.push(item);
      } else {
        // Merge metadata if duplicate
        const existing = dedupedEvidence.find(e => 
          e.url === item.url && e.title === item.title
        );
        if (existing && item.metadata) {
          existing.metadata = { ...existing.metadata, ...item.metadata };
        }
      }
    });
    
    return dedupedEvidence;
  }
}

export class EvidenceQualityScorerImpl implements EvidenceQualityScorer {
  scoreRelevance(evidence: Evidence, thesis: InvestmentThesis, marketContext: MarketContext): number {
    let score = 0;
    
    // Thesis keyword matching (40%)
    const thesisKeywords = thesis.description.toLowerCase().split(/\s+/);
    const evidenceText = `${evidence.title} ${evidence.content}`.toLowerCase();
    
    thesisKeywords.forEach(keyword => {
      if (evidenceText.includes(keyword)) {
        score += 40 / thesisKeywords.length;
      }
    });
    
    // Market context relevance (30%)
    const marketKeywords = [
      marketContext.industry,
      marketContext.sector,
      marketContext.geography,
      marketContext.marketMaturity
    ].map(k => k.toLowerCase());
    
    marketKeywords.forEach(keyword => {
      if (evidenceText.includes(keyword)) {
        score += 30 / marketKeywords.length;
      }
    });
    
    // Pillar alignment (30%)
    if (evidence.thesisPillarId) {
      score += 30;
    }
    
    return Math.min(100, score);
  }
  
  scoreCredibility(source: EvidenceSource): number {
    const credibilityScores: Record<EvidenceSource, number> = {
      'perplexity': 90,
      'crawl4ai': 85,
      'skyvern': 80,
      'claude': 95,
      'publicData': 95,
      'sec': 100,
      'crunchbase': 90,
      'manual': 70,
      'deepResearch': 95,
      'technicalAnalysis': 90,
      'marketIntelligence': 92
    };
    
    return credibilityScores[source] || 50;
  }
  
  scoreCompleteness(evidence: Evidence[], requirements: string[]): number {
    const fulfilled = requirements.filter(req => 
      evidence.some(e => e.content.toLowerCase().includes(req.toLowerCase()))
    );
    
    return (fulfilled.length / requirements.length) * 100;
  }
  
  identifyGaps(evidence: Evidence[], thesis: InvestmentThesis): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    
    // Check for missing pillar coverage
    const pillarAnalyzer = new InvestmentThesisAnalyzerImpl();
    const pillars = pillarAnalyzer.extractPillars(thesis.description);
    
    pillars.forEach(pillar => {
      const pillarEvidence = evidence.filter(e => e.thesisPillarId === pillar.id);
      
      // Check quantity
      if (pillarEvidence.length === 0) {
        gaps.push({
          id: uuidv4(),
          pillarId: pillar.id,
          description: `No evidence found for ${pillar.name}`,
          severity: 'critical',
          suggestedActions: [
            `Run deep research on ${pillar.name}`,
            `Search for ${pillar.keywords?.join(', ')} in company materials`
          ]
        });
      } else if (pillarEvidence.length < 3) {
        gaps.push({
          id: uuidv4(),
          pillarId: pillar.id,
          description: `Limited evidence for ${pillar.name} (only ${pillarEvidence.length} items)`,
          severity: 'high',
          suggestedActions: [
            `Expand search queries for ${pillar.name}`,
            `Use alternative data sources`
          ]
        });
      }
      
      // Check quality
      const avgConfidence = pillarEvidence.reduce((sum, e) => sum + e.confidence, 0) / (pillarEvidence.length || 1);
      if (avgConfidence < 0.7 && pillarEvidence.length > 0) {
        gaps.push({
          id: uuidv4(),
          pillarId: pillar.id,
          description: `Low confidence evidence for ${pillar.name} (avg: ${Math.round(avgConfidence * 100)}%)`,
          severity: 'medium',
          suggestedActions: [
            `Validate ${pillar.name} evidence with primary sources`,
            `Conduct expert interviews`
          ]
        });
      }
      
      // Check for contradictions
      const contradictions = pillarEvidence.filter(e => e.metadata?.contradicts === true);
      if (contradictions.length > pillarEvidence.length / 2) {
        gaps.push({
          id: uuidv4(),
          pillarId: pillar.id,
          description: `Significant contradicting evidence for ${pillar.name}`,
          severity: 'critical',
          suggestedActions: [
            `Re-evaluate ${pillar.name} thesis assumptions`,
            `Conduct deeper analysis of contradictions`
          ]
        });
      }
    });
    
    return gaps;
  }
  
  async assess(evidence: Evidence[], thesis: InvestmentThesis, marketContext: MarketContext): Promise<Evidence[]> {
    // Score and enhance evidence with thesis alignment
    const assessedEvidence = evidence.map(item => {
      const relevanceScore = this.scoreRelevance(item, thesis, marketContext);
      const credibilityScore = this.scoreCredibility(item.source);
      const qualityScore = (item.confidence * 100 + credibilityScore + relevanceScore) / 3;
      
      return {
        ...item,
        relevanceScore: relevanceScore / 100,
        metadata: {
          ...item.metadata,
          qualityScore,
          credibilityScore,
          relevanceScore,
          thesisAlignment: this.calculateThesisAlignment(item, thesis)
        }
      };
    });
    
    // Rank by thesis alignment
    const rankedEvidence = this.rankByThesisAlignment(assessedEvidence, thesis);
    
    // Filter out low quality evidence but keep contradicting evidence for analysis
    return rankedEvidence.filter(item => 
      (item.metadata.qualityScore || 0) >= 60 || 
      item.metadata.contradicts === true // Keep contradictions for risk analysis
    );
  }
  
  async assessSalesEvidence(evidence: Evidence[], salesContext: SalesIntelligenceContext, marketContext: MarketContext): Promise<Evidence[]> {
    // Score and enhance evidence for sales context
    const assessedEvidence = evidence.map(item => {
      const relevanceScore = this.scoreSalesRelevance(item, salesContext, marketContext);
      const credibilityScore = this.scoreCredibility(item.source);
      const qualityScore = (item.confidence * 100 + credibilityScore + relevanceScore) / 3;
      
      return {
        ...item,
        relevanceScore: relevanceScore / 100,
        metadata: {
          ...item.metadata,
          qualityScore,
          credibilityScore,
          relevanceScore,
          salesAlignment: this.calculateSalesAlignment(item, salesContext)
        }
      };
    });
    
    // Sort by relevance and quality
    const sortedEvidence = assessedEvidence.sort((a, b) => {
      const scoreA = (a.metadata?.qualityScore || 0) + (a.metadata?.salesAlignment || 0);
      const scoreB = (b.metadata?.qualityScore || 0) + (b.metadata?.salesAlignment || 0);
      return scoreB - scoreA;
    });
    
    // Filter out low quality evidence
    return sortedEvidence.filter(item => 
      (item.metadata.qualityScore || 0) >= 50 // Lower threshold for sales
    );
  }
  
  private scoreSalesRelevance(evidence: Evidence, salesContext: SalesIntelligenceContext, marketContext: MarketContext): number {
    let score = 0;
    const evidenceText = `${evidence.title} ${evidence.content}`.toLowerCase();
    
    // Product/offering relevance (40%)
    if (evidenceText.includes(salesContext.offering.toLowerCase())) {
      score += 40;
    }
    
    // Pain point relevance (30%)
    const painPoints = salesContext.idealCustomerProfile.painPoints || [];
    const matchedPainPoints = painPoints.filter(pain => 
      evidenceText.includes(pain.toLowerCase())
    );
    if (painPoints.length > 0) {
      score += (matchedPainPoints.length / painPoints.length) * 30;
    }
    
    // Market context relevance (20%)
    if (evidenceText.includes(marketContext.industry.toLowerCase())) {
      score += 10;
    }
    if (evidenceText.includes(salesContext.idealCustomerProfile.industry?.toLowerCase() || '')) {
      score += 10;
    }
    
    // Use case relevance (10%)
    const matchedUseCases = salesContext.useCases.filter(useCase =>
      evidenceText.includes(useCase.toLowerCase())
    );
    if (salesContext.useCases.length > 0) {
      score += (matchedUseCases.length / salesContext.useCases.length) * 10;
    }
    
    return Math.min(100, score);
  }
  
  private calculateSalesAlignment(evidence: Evidence, salesContext: SalesIntelligenceContext): number {
    let alignment = 0;
    const content = evidence.content.toLowerCase();
    
    // Check offering mention
    if (content.includes(salesContext.offering.toLowerCase())) {
      alignment += 30;
    }
    
    // Check competitive advantage indicators
    const advantageTerms = ['better', 'superior', 'leading', 'unique', 'innovative'];
    if (advantageTerms.some(term => content.includes(term))) {
      alignment += 20;
    }
    
    // Check ROI/value indicators
    const valueTerms = ['roi', 'savings', 'efficiency', 'productivity', 'growth'];
    if (valueTerms.some(term => content.includes(term))) {
      alignment += 25;
    }
    
    // Check customer success indicators
    const successTerms = ['customer success', 'case study', 'testimonial', 'achieved'];
    if (successTerms.some(term => content.includes(term))) {
      alignment += 25;
    }
    
    return alignment;
  }
  
  rankByThesisAlignment(evidence: Evidence[], thesis: InvestmentThesis): Evidence[] {
    return evidence.sort((a, b) => {
      // First priority: thesis alignment
      const alignmentA = a.metadata?.thesisAlignment || 0;
      const alignmentB = b.metadata?.thesisAlignment || 0;
      if (alignmentA !== alignmentB) return alignmentB - alignmentA;
      
      // Second priority: quality score
      const qualityA = a.metadata?.qualityScore || 0;
      const qualityB = b.metadata?.qualityScore || 0;
      if (qualityA !== qualityB) return qualityB - qualityA;
      
      // Third priority: supports thesis
      if (a.metadata?.supports && !b.metadata?.supports) return -1;
      if (!a.metadata?.supports && b.metadata?.supports) return 1;
      
      return 0;
    });
  }
  
  private calculateThesisAlignment(evidence: Evidence, thesis: InvestmentThesis): number {
    let alignment = 0;
    
    // Check if evidence supports or contradicts thesis
    if (evidence.metadata?.supports) alignment += 50;
    if (evidence.metadata?.contradicts) alignment -= 30;
    
    // Check pillar alignment
    if (evidence.thesisPillarId) alignment += 30;
    
    // Check content relevance
    const thesisTerms = thesis.description.toLowerCase().split(/\s+/);
    const matchingTerms = thesisTerms.filter(term => 
      evidence.content.toLowerCase().includes(term)
    );
    alignment += (matchingTerms.length / thesisTerms.length) * 20;
    
    return Math.max(0, Math.min(100, alignment));
  }
}

export class ResearchToReportMapperImpl implements ResearchToReportMapper {
  mapToReport(evidence: Evidence[], reportType: string, thesis: InvestmentThesis): ResearchResult {
    const reportStructure = this.getReportStructure(reportType);
    const mappedSections: Record<string, any> = {};
    
    // Map evidence to sections with thesis context
    reportStructure.sections.forEach(section => {
      const sectionEvidence = this.mapEvidenceToSection(evidence, section, thesis);
      const sectionContent = this.generateThesisAlignedContent(sectionEvidence, section, thesis);
      
      mappedSections[section.id] = {
        title: section.title,
        content: sectionContent,
        evidence: sectionEvidence,
        score: this.calculateSectionScore(sectionEvidence),
        thesisAlignment: this.calculateSectionThesisAlignment(sectionEvidence, thesis)
      };
    });
    
    // Ensure thesis alignment throughout
    const alignedSections = this.ensureThesisAlignment(mappedSections, thesis);
    
    // Generate thesis validation
    const thesisValidation = this.generateThesisValidation(evidence, thesis);
    
    return {
      reportType,
      sections: alignedSections,
      overallScore: this.calculateOverallScore(alignedSections),
      evidence,
      thesisValidation,
      metadata: {
        generatedAt: new Date().toISOString(),
        evidenceCount: evidence.length,
        coverage: this.calculateCoverage(alignedSections),
        thesisAlignmentScore: thesisValidation.confidenceLevel
      }
    };
  }
  
  ensureThesisAlignment(sections: any, thesis: InvestmentThesis): any {
    // Add thesis context to each section
    Object.keys(sections).forEach(sectionId => {
      const section = sections[sectionId];
      
      // Prepend thesis context to executive summary
      if (sectionId === 'executive-summary') {
        section.content = `Investment Thesis: ${thesis.description}\n\n${section.content}`;
      }
      
      // Add thesis validation to scoring analysis
      if (sectionId === 'scoring-analysis') {
        section.content = this.addThesisValidationToScoring(section.content, thesis);
      }
    });
    
    return sections;
  }
  
  generateThesisValidation(evidence: Evidence[], thesis: InvestmentThesis): ThesisValidation {
    const supportingEvidence = evidence.filter(e => e.metadata?.supports === true);
    const contradictingEvidence = evidence.filter(e => e.metadata?.contradicts === true);
    
    const confidenceLevel = (supportingEvidence.length / (evidence.length || 1)) * 100;
    const validated = confidenceLevel >= 70 && contradictingEvidence.length < supportingEvidence.length / 3;
    
    // Extract key findings
    const keyFindings = this.extractKeyFindings(supportingEvidence, thesis);
    
    // Identify risks
    const risks = this.extractRisks(contradictingEvidence, evidence);
    
    // Identify opportunities
    const opportunities = this.extractOpportunities(evidence, thesis);
    
    // Generate recommended actions
    const recommendedActions = this.generateRecommendedActions(
      validated,
      confidenceLevel,
      risks,
      opportunities
    );
    
    return {
      validated,
      confidenceLevel: Math.round(confidenceLevel),
      keyFindings,
      risks,
      opportunities,
      recommendedActions
    };
  }
  
  private getReportStructure(reportType: string) {
    const structures: Record<string, any> = {
      'pe-due-diligence': {
        sections: [
          { 
            id: 'executive-summary', 
            title: 'Executive Summary', 
            requiredEvidence: ['market', 'financials', 'thesis', 'investment rationale'],
            thesisCritical: true
          },
          { 
            id: 'scoring-analysis', 
            title: 'Scoring Analysis', 
            requiredEvidence: ['technical', 'market', 'team', 'growth potential'],
            thesisCritical: true
          },
          { 
            id: 'deep-dive', 
            title: 'Deep Dive', 
            requiredEvidence: ['architecture', 'scalability', 'platform capabilities'],
            thesisCritical: false
          },
          { 
            id: 'technical-focus', 
            title: 'Technical Focus', 
            requiredEvidence: ['stack', 'infrastructure', 'technical debt', 'modernization'],
            thesisCritical: false
          },
          { 
            id: 'risk-register', 
            title: 'Risk Register', 
            requiredEvidence: ['risks', 'mitigation', 'competitive threats'],
            thesisCritical: true
          },
          { 
            id: 'value-creation', 
            title: 'Value Creation', 
            requiredEvidence: ['opportunities', 'growth', 'M&A', 'synergies'],
            thesisCritical: true
          },
          { 
            id: 'evidence', 
            title: 'Evidence', 
            requiredEvidence: [],
            thesisCritical: false
          }
        ]
      },
      'sales-intelligence': {
        sections: [
          { 
            id: 'company-overview', 
            title: 'Company Overview', 
            requiredEvidence: ['company', 'market', 'positioning'],
            thesisCritical: false
          },
          { 
            id: 'product-analysis', 
            title: 'Product Analysis', 
            requiredEvidence: ['product', 'features', 'differentiation'],
            thesisCritical: false
          },
          { 
            id: 'competitive-landscape', 
            title: 'Competitive Landscape', 
            requiredEvidence: ['competitors', 'market share', 'positioning'],
            thesisCritical: false
          },
          { 
            id: 'sales-insights', 
            title: 'Sales Insights', 
            requiredEvidence: ['pricing', 'customers', 'use cases', 'ROI'],
            thesisCritical: false
          }
        ]
      }
    };
    
    return structures[reportType] || structures['pe-due-diligence'];
  }
  
  private mapEvidenceToSection(evidence: Evidence[], section: any, thesis: InvestmentThesis): Evidence[] {
    const sectionEvidence = evidence.filter(item => {
      const content = item.content.toLowerCase();
      const title = item.title.toLowerCase();
      const combinedText = `${title} ${content}`;
      
      // Check if evidence matches section requirements
      const matchesRequirements = section.requiredEvidence.some((req: string) => 
        combinedText.includes(req.toLowerCase())
      );
      
      // For thesis-critical sections, also check pillar alignment
      if (section.thesisCritical && item.thesisPillarId) {
        return matchesRequirements || this.isPillarRelevantToSection(item.thesisPillarId, section.id, thesis);
      }
      
      return matchesRequirements;
    });
    
    // Sort by thesis alignment for critical sections
    if (section.thesisCritical) {
      return sectionEvidence.sort((a, b) => 
        (b.metadata?.thesisAlignment || 0) - (a.metadata?.thesisAlignment || 0)
      );
    }
    
    return sectionEvidence;
  }
  
  private isPillarRelevantToSection(pillarId: string, sectionId: string, thesis: InvestmentThesis): boolean {
    // Map pillars to relevant report sections
    const pillarSectionMap: Record<string, string[]> = {
      'Platform Consolidation': ['executive-summary', 'value-creation', 'technical-focus'],
      'Organic Growth': ['executive-summary', 'scoring-analysis', 'value-creation'],
      'Operational Excellence': ['scoring-analysis', 'deep-dive', 'value-creation'],
      'Technology Transformation': ['technical-focus', 'deep-dive', 'risk-register'],
      'Exit Strategy': ['executive-summary', 'value-creation']
    };
    
    // Find pillar name from thesis
    const analyzer = new InvestmentThesisAnalyzerImpl();
    const pillars = analyzer.extractPillars(thesis.description);
    const pillar = pillars.find(p => p.id === pillarId);
    
    if (!pillar) return false;
    
    return pillarSectionMap[pillar.name]?.includes(sectionId) || false;
  }
  
  private generateThesisAlignedContent(evidence: Evidence[], section: any, thesis: InvestmentThesis): string {
    if (evidence.length === 0) {
      return `Limited evidence collected for ${section.title}. Additional research recommended to validate thesis assumptions.`;
    }
    
    // Group evidence by thesis support
    const supporting = evidence.filter(e => e.metadata?.supports === true);
    const neutral = evidence.filter(e => !e.metadata?.supports && !e.metadata?.contradicts);
    const contradicting = evidence.filter(e => e.metadata?.contradicts === true);
    
    let content = '';
    
    // Start with thesis-supporting evidence
    if (supporting.length > 0) {
      content += `Key findings supporting the investment thesis:\n`;
      content += supporting.slice(0, 3).map(e => `• ${e.content}`).join('\n');
      content += '\n\n';
    }
    
    // Add neutral evidence
    if (neutral.length > 0) {
      content += `Additional insights:\n`;
      content += neutral.slice(0, 2).map(e => `• ${e.content}`).join('\n');
      content += '\n\n';
    }
    
    // Include contradicting evidence for balanced view
    if (contradicting.length > 0 && section.thesisCritical) {
      content += `Considerations and potential challenges:\n`;
      content += contradicting.slice(0, 2).map(e => `• ${e.content}`).join('\n');
      content += '\n\n';
    }
    
    return content;
  }
  
  private addThesisValidationToScoring(content: string, thesis: InvestmentThesis): string {
    const analyzer = new InvestmentThesisAnalyzerImpl();
    const pillars = analyzer.extractPillars(thesis.description);
    
    let thesisSection = '\n\nInvestment Thesis Alignment:\n';
    
    pillars.forEach(pillar => {
      thesisSection += `\n${pillar.name} (Weight: ${Math.round(pillar.weight * 100)}%):\n`;
      thesisSection += `• ${pillar.keywords?.join(', ')}\n`;
    });
    
    return content + thesisSection;
  }
  
  private calculateSectionScore(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0;
    
    const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
    const avgRelevance = evidence.reduce((sum, e) => sum + e.relevanceScore, 0) / evidence.length;
    const avgQuality = evidence.reduce((sum, e) => sum + (e.metadata?.qualityScore || 0), 0) / evidence.length / 100;
    
    return Math.round((avgConfidence + avgRelevance + avgQuality) * 100 / 3);
  }
  
  private calculateSectionThesisAlignment(evidence: Evidence[], thesis: InvestmentThesis): number {
    if (evidence.length === 0) return 0;
    
    const alignmentScores = evidence.map(e => e.metadata?.thesisAlignment || 0);
    return Math.round(alignmentScores.reduce((sum, score) => sum + score, 0) / evidence.length);
  }
  
  private calculateOverallScore(sections: Record<string, any>): number {
    const criticalSections = ['executive-summary', 'scoring-analysis', 'risk-register', 'value-creation'];
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    Object.entries(sections).forEach(([sectionId, section]) => {
      const weight = criticalSections.includes(sectionId) ? 2 : 1;
      weightedScore += (section.score || 0) * weight;
      totalWeight += weight;
    });
    
    return Math.round(weightedScore / totalWeight);
  }
  
  private calculateCoverage(sections: Record<string, any>): number {
    const totalSections = Object.keys(sections).length - 1; // Exclude evidence section
    const populatedSections = Object.values(sections).filter(s => 
      s.id !== 'evidence' && s.evidence && s.evidence.length > 0
    ).length;
    
    return Math.round((populatedSections / totalSections) * 100);
  }
  
  private extractKeyFindings(supportingEvidence: Evidence[], thesis: InvestmentThesis): string[] {
    const findings: string[] = [];
    
    // Group by pillar
    const pillarFindings: Record<string, Evidence[]> = {};
    supportingEvidence.forEach(e => {
      if (e.thesisPillarId) {
        if (!pillarFindings[e.thesisPillarId]) {
          pillarFindings[e.thesisPillarId] = [];
        }
        pillarFindings[e.thesisPillarId].push(e);
      }
    });
    
    // Extract top finding per pillar
    Object.values(pillarFindings).forEach(evidenceList => {
      if (evidenceList.length > 0) {
        const topEvidence = evidenceList.sort((a, b) => 
          (b.metadata?.qualityScore || 0) - (a.metadata?.qualityScore || 0)
        )[0];
        
        findings.push(this.summarizeEvidence(topEvidence));
      }
    });
    
    return findings.slice(0, 5);
  }
  
  private extractRisks(contradictingEvidence: Evidence[], allEvidence: Evidence[]): string[] {
    const risks: string[] = [];
    
    // Direct contradictions
    contradictingEvidence.forEach(e => {
      if (e.metadata?.qualityScore && e.metadata.qualityScore > 70) {
        risks.push(this.summarizeRisk(e));
      }
    });
    
    // Low confidence areas
    const lowConfidenceAreas = allEvidence.filter(e => e.confidence < 0.6);
    if (lowConfidenceAreas.length > 3) {
      risks.push(`Limited visibility into ${lowConfidenceAreas.length} key areas`);
    }
    
    return risks.slice(0, 5);
  }
  
  private extractOpportunities(evidence: Evidence[], thesis: InvestmentThesis): string[] {
    const opportunities: string[] = [];
    
    // High-confidence supporting evidence
    const strongEvidence = evidence.filter(e => 
      e.metadata?.supports === true && 
      e.confidence > 0.8 &&
      e.metadata?.qualityScore && e.metadata.qualityScore > 80
    );
    
    strongEvidence.forEach(e => {
      const opportunity = this.identifyOpportunity(e, thesis);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    });
    
    return opportunities.slice(0, 5);
  }
  
  private generateRecommendedActions(
    validated: boolean,
    confidenceLevel: number,
    risks: string[],
    opportunities: string[]
  ): string[] {
    const actions: string[] = [];
    
    if (validated && confidenceLevel > 80) {
      actions.push('Proceed with investment thesis - strong validation');
      actions.push(`Focus on top ${opportunities.length} value creation opportunities`);
    } else if (validated && confidenceLevel > 60) {
      actions.push('Proceed with caution - moderate thesis validation');
      actions.push('Conduct targeted due diligence on identified risk areas');
    } else {
      actions.push('Re-evaluate investment thesis - limited validation');
      actions.push('Commission primary research to address evidence gaps');
    }
    
    // Risk-specific actions
    if (risks.length > 3) {
      actions.push(`Develop mitigation strategies for ${risks.length} identified risks`);
    }
    
    // Opportunity-specific actions
    if (opportunities.length > 0) {
      actions.push('Prioritize quick wins from identified opportunities');
    }
    
    return actions;
  }
  
  private summarizeEvidence(evidence: Evidence): string {
    // Extract key insight from evidence
    const content = evidence.content.substring(0, 200);
    return content.split('.')[0] + '.';
  }
  
  private summarizeRisk(evidence: Evidence): string {
    // Extract risk from contradicting evidence
    const content = evidence.content.substring(0, 150);
    return 'Risk: ' + content.split('.')[0];
  }
  
  private identifyOpportunity(evidence: Evidence, thesis: InvestmentThesis): string | null {
    const opportunityKeywords = ['opportunity', 'potential', 'growth', 'expansion', 'untapped'];
    const content = evidence.content.toLowerCase();
    
    const hasOpportunity = opportunityKeywords.some(kw => content.includes(kw));
    if (hasOpportunity) {
      const sentence = evidence.content.split('.').find(s => 
        opportunityKeywords.some(kw => s.toLowerCase().includes(kw))
      );
      return sentence ? sentence.trim() : null;
    }
    
    return null;
  }
}