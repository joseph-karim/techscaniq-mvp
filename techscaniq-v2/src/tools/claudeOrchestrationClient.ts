import { Anthropic } from '@anthropic-ai/sdk';
import { InvestmentThesis, MarketContext, PrioritizedPlan, ResearchResult, ThesisAlignmentScore } from '../types/research';
import { logger } from '../utils/logger';
import { retryWithBackoff, SERVICE_RETRY_CONFIGS } from './error-handling';

export class ClaudeOrchestrationClient {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyzeMarketContext(company: string, industry: string): Promise<MarketContext> {
    const prompt = `Analyze the market context for ${company} in the ${industry} industry.
    
    Provide a structured analysis including:
    1. Industry classification and sector
    2. Geographic focus
    3. Market maturity stage (emerging/growth/mature/declining)
    4. Competitive dynamics
    5. Regulatory environment
    
    Format as JSON with fields: industry, sector, geography, marketMaturity, competitiveDynamics, regulatoryEnvironment`;

    try {
      const response = await retryWithBackoff(
        async () => {
          const message = await this.client.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            temperature: 0.2,
            messages: [{
              role: 'user',
              content: prompt
            }]
          });
          
          return message.content[0].type === 'text' ? message.content[0].text : '';
        },
        SERVICE_RETRY_CONFIGS.perplexity
      );

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to default context
      return {
        industry: industry || 'technology',
        sector: 'software',
        geography: 'global',
        marketMaturity: 'growth',
        competitiveDynamics: 'competitive',
        regulatoryEnvironment: 'moderate'
      };
    } catch (error) {
      logger.error('Failed to analyze market context', { error });
      // Return default context
      return {
        industry: industry || 'technology',
        sector: 'software',
        geography: 'global',
        marketMaturity: 'growth',
        competitiveDynamics: 'competitive',
        regulatoryEnvironment: 'moderate'
      };
    }
  }

  async planResearchStrategy(
    thesis: InvestmentThesis,
    researchPlan: PrioritizedPlan,
    marketContext: MarketContext
  ): Promise<ResearchStrategy> {
    // Build context based on what's provided
    const contextParts = [`Company: ${thesis.company}`];
    
    if (thesis.description) {
      contextParts.push(`Investment Thesis: ${thesis.description}`);
    }
    
    if (thesis.pePartner) {
      contextParts.push(`Investment Partner: ${thesis.pePartner}`);
    }
    
    if (thesis.investmentAmount) {
      contextParts.push(`Investment Amount: $${thesis.investmentAmount.toLocaleString()}`);
    }
    
    if (thesis.targetHoldPeriod) {
      contextParts.push(`Target Hold Period: ${thesis.targetHoldPeriod} years`);
    }

    const prompt = `Given the following context and market analysis, create a research strategy:

${contextParts.join('\n')}

Market Context:
- Industry: ${marketContext.industry}
- Market Maturity: ${marketContext.marketMaturity}
- Competitive Dynamics: ${marketContext.competitiveDynamics}

Research Questions (${researchPlan.questions.length}):
${researchPlan.questions.slice(0, 5).map(q => `- ${q.question}`).join('\n')}

Create a focused research strategy that:
1. Prioritizes evidence collection based on validation needs
2. Identifies critical data sources for each pillar
3. Suggests specific analysis approaches
4. Highlights potential red flags to investigate

Format as structured JSON.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      // Parse strategy from response
      return this.parseResearchStrategy(content);
    } catch (error) {
      logger.error('Failed to plan research strategy', { error });
      return {
        priorities: ['Validate core assumptions', 'Assess market opportunity'],
        criticalSources: ['Company financials', 'Market research', 'Competitive analysis'],
        analysisApproaches: ['Quantitative scoring', 'Comparative analysis'],
        redFlags: ['Market saturation', 'Technology obsolescence']
      };
    }
  }

  async validateResearchCompleteness(
    result: ResearchResult,
    thesis: InvestmentThesis,
    alignmentScore: ThesisAlignmentScore
  ): Promise<ThesisValidation> {
    // Build context based on what's provided
    const contextParts = [`Company: ${thesis.company}`];
    
    if (thesis.description) {
      contextParts.push(`Investment Focus: ${thesis.description}`);
    }
    
    if (thesis.pePartner) {
      contextParts.push(`Investment Partner: ${thesis.pePartner}`);
    }

    const prompt = `Validate the completeness of research:

${contextParts.join('\n')}

Research Results:
- Evidence Count: ${result.evidence.length}
- Overall Score: ${result.overallScore}
- Coverage: ${result.metadata.coverage}%

Alignment Analysis:
- Overall Alignment: ${alignmentScore.overallAlignment}%
- Supporting Evidence: ${alignmentScore.supportingEvidence.length}
- Contradicting Evidence: ${alignmentScore.contradictingEvidence.length}
- Gaps: ${alignmentScore.gaps.join(', ')}

Pillar Scores:
${Object.entries(alignmentScore.pillarScores).map(([pillar, score]) => 
  `- ${pillar}: ${score}%`
).join('\n')}

Provide a validation that includes:
1. Whether the research validates the investment opportunity (true/false)
2. Confidence level (0-100)
3. Key findings that support the opportunity
4. Risks identified
5. Opportunities discovered
6. Recommended actions

Be critical and thorough in your assessment.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      
      return this.parseThesisValidation(content, alignmentScore);
    } catch (error) {
      logger.error('Failed to validate research completeness', { error });
      
      // Fallback validation based on scores
      return {
        validated: alignmentScore.overallAlignment >= 70,
        confidenceLevel: alignmentScore.overallAlignment,
        keyFindings: alignmentScore.supportingEvidence.slice(0, 3).map(e => e.content.substring(0, 100)),
        risks: alignmentScore.contradictingEvidence.slice(0, 3).map(e => e.content.substring(0, 100)),
        opportunities: [],
        recommendedActions: alignmentScore.recommendations
      };
    }
  }

  async synthesizeEvidence(evidence: Evidence[], focus: string): Promise<string> {
    const prompt = `Synthesize the following evidence with focus on ${focus}:

${evidence.slice(0, 10).map(e => `- ${e.title}: ${e.content.substring(0, 200)}`).join('\n')}

Provide a concise synthesis that:
1. Identifies key themes
2. Highlights consensus views
3. Notes contradictions
4. Draws actionable insights

Keep the synthesis under 300 words.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      logger.error('Failed to synthesize evidence', { error });
      return `Evidence synthesis unavailable. Found ${evidence.length} relevant items.`;
    }
  }

  private parseResearchStrategy(content: string): ResearchStrategy {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('Failed to parse research strategy JSON', { error });
    }

    // Extract key elements from text
    const priorities = this.extractListItems(content, 'priorit');
    const sources = this.extractListItems(content, 'source');
    const approaches = this.extractListItems(content, 'approach');
    const redFlags = this.extractListItems(content, 'red flag|risk|concern');

    return {
      priorities: priorities.slice(0, 3),
      criticalSources: sources.slice(0, 5),
      analysisApproaches: approaches.slice(0, 3),
      redFlags: redFlags.slice(0, 5)
    };
  }

  private parseThesisValidation(content: string, alignmentScore: ThesisAlignmentScore): ThesisValidation {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('Failed to parse thesis validation JSON', { error });
    }

    // Extract validation from text
    const validated = content.toLowerCase().includes('validated: true') || 
                     content.toLowerCase().includes('thesis is validated');
    
    const confidenceMatch = content.match(/confidence.*?(\d+)/i);
    const confidenceLevel = confidenceMatch ? parseInt(confidenceMatch[1]) : alignmentScore.overallAlignment;

    return {
      validated,
      confidenceLevel,
      keyFindings: this.extractListItems(content, 'finding|support'),
      risks: this.extractListItems(content, 'risk|concern|challenge'),
      opportunities: this.extractListItems(content, 'opportunit'),
      recommendedActions: this.extractListItems(content, 'recommend|action|next step')
    };
  }

  private extractListItems(content: string, pattern: string): string[] {
    const items: string[] = [];
    const regex = new RegExp(`(?:^|\\n)\\s*[-•*]\\s*(.+?)(?=\\n|$)`, 'gim');
    const matches = content.matchAll(regex);
    
    for (const match of matches) {
      const item = match[1].trim();
      if (item.toLowerCase().match(pattern)) {
        items.push(item);
      }
    }

    return items;
  }
}

interface ResearchStrategy {
  priorities: string[];
  criticalSources: string[];
  analysisApproaches: string[];
  redFlags: string[];
}

interface ThesisValidation {
  validated: boolean;
  confidenceLevel: number;
  keyFindings: string[];
  risks: string[];
  opportunities: string[];
  recommendedActions: string[];
}

interface Evidence {
  id: string;
  title: string;
  content: string;
  url?: string;
  confidence: number;
}