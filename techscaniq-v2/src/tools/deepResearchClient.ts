import { Evidence, InvestmentThesis, ThesisPillar, EvidenceSource, EvidenceType } from '../types/research';
import { PerplexitySonarClient } from './perplexityClient';
import { ClaudeAnalysisClient } from './claudeAnalysisClient';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { retryWithBackoff } from './error-handling';

export class DeepResearchClient {
  constructor(
    private perplexityClient: PerplexitySonarClient,
    private claudeClient: ClaudeAnalysisClient
  ) {}

  async researchPillar(pillar: ThesisPillar, thesis: InvestmentThesis): Promise<Evidence[]> {
    logger.info(`Deep research for pillar: ${pillar.name}`);
    
    try {
      // Generate targeted queries for the pillar
      const queries = this.generatePillarQueries(pillar, thesis);
      
      // Execute deep research for each query
      const evidencePromises = queries.map(query => 
        this.executeDeepQuery(query, pillar, thesis)
      );
      
      const results = await Promise.allSettled(evidencePromises);
      
      // Collect successful results
      const evidence: Evidence[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          evidence.push(...result.value);
        }
      });
      
      // Synthesize findings if we have evidence
      if (evidence.length > 0) {
        const synthesis = await this.synthesizePillarFindings(evidence, pillar, thesis);
        if (synthesis) {
          evidence.push(synthesis);
        }
      }
      
      return evidence;
    } catch (error) {
      logger.error(`Deep research failed for pillar ${pillar.name}`, { error });
      return [];
    }
  }

  async validateEvidence(evidence: Evidence, thesis: InvestmentThesis): Promise<Evidence[]> {
    logger.info(`Validating evidence: ${evidence.title}`);
    
    try {
      // Generate validation queries
      const validationQueries = [
        `Verify: ${evidence.title}`,
        `${thesis.company} ${evidence.content.substring(0, 100)}`,
        `Fact check: ${this.extractKeyClaimFromEvidence(evidence)}`
      ];
      
      const validationResults: Evidence[] = [];
      
      for (const query of validationQueries) {
        const results = await this.perplexityClient.search(query);
        
        results.citations.forEach(citation => {
          validationResults.push({
            id: uuidv4(),
            source: 'deepResearch' as EvidenceSource,
            type: 'document' as EvidenceType,
            title: `Validation: ${citation.title}`,
            content: citation.excerpt,
            url: citation.url,
            confidence: 0.85,
            relevanceScore: 0.8,
            thesisPillarId: evidence.thesisPillarId,
            citations: [],
            metadata: {
              timestamp: new Date().toISOString(),
              validationType: 'evidence-validation',
              originalEvidenceId: evidence.id,
              supports: this.doesValidationSupport(citation.excerpt, evidence.content),
              contradicts: this.doesValidationContradict(citation.excerpt, evidence.content)
            }
          });
        });
      }
      
      return validationResults;
    } catch (error) {
      logger.error('Evidence validation failed', { error });
      return [];
    }
  }

  async explorePillar(pillar: ThesisPillar, thesis: InvestmentThesis): Promise<Evidence[]> {
    logger.info(`Exploring uncovered pillar: ${pillar.name}`);
    
    try {
      // Create comprehensive exploration queries
      const explorationQueries = [
        `${thesis.company} ${pillar.name} analysis`,
        `${thesis.company} ${pillar.keywords?.join(' ')}`,
        `How does ${thesis.company} approach ${pillar.name.toLowerCase()}`,
        `${thesis.company} strategy for ${pillar.name.toLowerCase()}`
      ];
      
      const evidence: Evidence[] = [];
      
      // Execute exploration with retries
      for (const query of explorationQueries) {
        try {
          const results = await retryWithBackoff(
            () => this.perplexityClient.search(query),
            { maxRetries: 2, initialDelay: 1000, maxDelay: 5000, backoffMultiplier: 2 }
          );
          
          results.citations.forEach(citation => {
            evidence.push({
              id: uuidv4(),
              source: 'deepResearch' as EvidenceSource,
              type: 'document' as EvidenceType,
              title: citation.title,
              content: citation.excerpt,
              url: citation.url,
              confidence: 0.8,
              relevanceScore: this.calculatePillarRelevance(citation.excerpt, pillar),
              thesisPillarId: pillar.id,
              citations: [],
              metadata: {
                timestamp: new Date().toISOString(),
                researchType: 'pillar-exploration',
                pillar: pillar.name,
                supports: this.evaluateSupport(citation.excerpt, thesis),
                contradicts: this.evaluateContradiction(citation.excerpt, thesis)
              }
            });
          });
        } catch (error) {
          logger.warn(`Failed to explore query: ${query}`, { error });
        }
      }
      
      return evidence;
    } catch (error) {
      logger.error(`Pillar exploration failed for ${pillar.name}`, { error });
      return [];
    }
  }

  private generatePillarQueries(pillar: ThesisPillar, thesis: InvestmentThesis): string[] {
    const queries: string[] = [];
    
    switch (pillar.name) {
      case 'Platform Consolidation':
        queries.push(
          `${thesis.company} acquisition history and M&A strategy`,
          `${thesis.company} platform integration capabilities`,
          `${thesis.company} multi-tenant architecture`
        );
        break;
        
      case 'Organic Growth':
        queries.push(
          `${thesis.company} revenue growth rate and market expansion`,
          `${thesis.company} customer acquisition and retention metrics`,
          `${thesis.company} market share and TAM analysis`
        );
        break;
        
      case 'Operational Excellence':
        queries.push(
          `${thesis.company} operational efficiency and margins`,
          `${thesis.company} automation and cost reduction initiatives`,
          `${thesis.company} benchmark performance vs competitors`
        );
        break;
        
      case 'Technology Transformation':
        queries.push(
          `${thesis.company} technology stack and architecture`,
          `${thesis.company} cloud migration and modernization`,
          `${thesis.company} AI and ML capabilities`
        );
        break;
        
      case 'Exit Strategy':
        queries.push(
          `${thesis.company} valuation and comparable transactions`,
          `Strategic buyers interested in ${thesis.company} sector`,
          `${thesis.company} IPO readiness and market conditions`
        );
        break;
        
      default:
        // Generic queries for custom pillars
        queries.push(
          `${thesis.company} ${pillar.name}`,
          `${thesis.company} strategy for ${pillar.keywords?.join(' ')}`
        );
    }
    
    return queries;
  }

  private async executeDeepQuery(
    query: string,
    pillar: ThesisPillar,
    thesis: InvestmentThesis
  ): Promise<Evidence[]> {
    try {
      const results = await this.perplexityClient.search(query);
      
      return results.citations.map(citation => ({
        id: uuidv4(),
        source: 'deepResearch' as EvidenceSource,
        type: 'document' as EvidenceType,
        title: citation.title,
        content: citation.excerpt,
        url: citation.url,
        confidence: 0.9,
        relevanceScore: this.calculatePillarRelevance(citation.excerpt, pillar),
        thesisPillarId: pillar.id,
        citations: [],
        metadata: {
          timestamp: new Date().toISOString(),
          query,
          pillar: pillar.name,
          supports: this.evaluateSupport(citation.excerpt, thesis),
          contradicts: this.evaluateContradiction(citation.excerpt, thesis)
        }
      }));
    } catch (error) {
      logger.error(`Deep query failed: ${query}`, { error });
      return [];
    }
  }

  private async synthesizePillarFindings(
    evidence: Evidence[],
    pillar: ThesisPillar,
    thesis: InvestmentThesis
  ): Promise<Evidence | null> {
    try {
      const synthesis = await this.claudeClient.analyzeDocument({
        content: evidence.map(e => `${e.title}: ${e.content}`).join('\n\n'),
        title: `${pillar.name} Analysis for ${thesis.company}`,
        context: `Synthesize findings for ${pillar.name} pillar of investment thesis`
      });
      
      return {
        id: uuidv4(),
        source: 'deepResearch' as EvidenceSource,
        type: 'analysis' as EvidenceType,
        title: synthesis.title,
        content: synthesis.summary,
        url: '',
        confidence: 0.95,
        relevanceScore: 0.95,
        thesisPillarId: pillar.id,
        citations: evidence.map(e => ({
          text: e.title,
          url: e.url
        })),
        metadata: {
          timestamp: new Date().toISOString(),
          synthesisType: 'pillar-synthesis',
          pillar: pillar.name,
          sourceCount: evidence.length,
          supports: evidence.filter(e => e.metadata?.supports).length > evidence.length / 2,
          contradicts: evidence.filter(e => e.metadata?.contradicts).length > evidence.length / 2
        }
      };
    } catch (error) {
      logger.error('Failed to synthesize pillar findings', { error });
      return null;
    }
  }

  private extractKeyClaimFromEvidence(evidence: Evidence): string {
    // Extract the most significant claim or fact from evidence
    const sentences = evidence.content.split(/[.!?]+/);
    
    // Look for sentences with numbers, percentages, or key terms
    const keySentence = sentences.find(s => 
      /\d+%|\$\d+|revenue|growth|market|technology/i.test(s)
    );
    
    return keySentence?.trim() || sentences[0]?.trim() || evidence.title;
  }

  private calculatePillarRelevance(content: string, pillar: ThesisPillar): number {
    const contentLower = content.toLowerCase();
    let relevance = 0;
    
    // Check pillar keywords
    pillar.keywords?.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        relevance += 0.2;
      }
    });
    
    // Check pillar name
    if (contentLower.includes(pillar.name.toLowerCase())) {
      relevance += 0.3;
    }
    
    return Math.min(1, relevance);
  }

  private evaluateSupport(content: string, thesis: InvestmentThesis): boolean {
    const supportingTerms = [
      'growth', 'increase', 'expand', 'opportunity', 'strong',
      'leading', 'advantage', 'innovative', 'successful'
    ];
    
    const contentLower = content.toLowerCase();
    return supportingTerms.some(term => contentLower.includes(term));
  }

  private evaluateContradiction(content: string, thesis: InvestmentThesis): boolean {
    const contradictingTerms = [
      'decline', 'challenge', 'risk', 'weakness', 'threat',
      'competition', 'legacy', 'outdated', 'struggling'
    ];
    
    const contentLower = content.toLowerCase();
    return contradictingTerms.some(term => contentLower.includes(term));
  }

  private doesValidationSupport(validationContent: string, originalContent: string): boolean {
    // Check if validation confirms the original claim
    const validationLower = validationContent.toLowerCase();
    const originalLower = originalContent.toLowerCase();
    
    // Extract key facts from original
    const originalFacts = this.extractFactsFromContent(originalLower);
    
    // Check if validation confirms any facts
    return originalFacts.some(fact => validationLower.includes(fact));
  }

  private doesValidationContradict(validationContent: string, originalContent: string): boolean {
    // Check for contradictory terms
    const contradictionPhrases = [
      'actually', 'however', 'contrary to', 'not true',
      'incorrect', 'disputed', 'false', 'misleading'
    ];
    
    const validationLower = validationContent.toLowerCase();
    return contradictionPhrases.some(phrase => validationLower.includes(phrase));
  }

  private extractFactsFromContent(content: string): string[] {
    const facts: string[] = [];
    
    // Extract numbers and percentages
    const numberMatches = content.match(/\d+%?|\$[\d,]+/g);
    if (numberMatches) {
      facts.push(...numberMatches);
    }
    
    // Extract company-specific terms
    const companyTerms = content.match(/\b\w+\s+(platform|technology|system|solution)\b/gi);
    if (companyTerms) {
      facts.push(...companyTerms.map(t => t.toLowerCase()));
    }
    
    return facts;
  }
}