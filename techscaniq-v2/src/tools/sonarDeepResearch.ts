import { v4 as uuidv4 } from 'uuid';
import { Evidence } from '../types';
import { config } from '../config';

interface SonarDeepResearchRequest {
  model: 'sonar-deep-research' | 'sonar-pro' | 'sonar';
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  reasoning_effort?: 'low' | 'medium' | 'high';
  max_tokens?: number;
}

interface SonarAsyncResponse {
  id: string;
  model: string;
  created_at: number;
  status: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  response?: {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      citation_tokens: number;
      num_search_queries: number;
      reasoning_tokens: number;
    };
    citations: string[];
  };
  error_message?: string;
}

export interface MarketInsights {
  tam: {
    size: string;
    growth: string;
    sources: string[];
  };
  competitors: Array<{
    name: string;
    marketShare?: string;
    strengths: string[];
    techStack?: string[];
  }>;
  financials: {
    revenue?: string;
    growth?: string;
    profitability?: string;
    funding?: string;
  };
  risks: string[];
  opportunities: string[];
}

export class SonarDeepResearch {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';
  
  constructor() {
    this.apiKey = config.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }
  }
  
  /**
   * Submit an async deep research request to Perplexity
   */
  async submitResearch(
    company: string,
    website: string,
    thesisType: string,
    focusAreas: string[] = []
  ): Promise<string> {
    const prompt = this.buildResearchPrompt(company, website, thesisType, focusAreas);
    
    const request: SonarDeepResearchRequest = {
      model: 'sonar-deep-research', // Use sonar-deep-research for highest quality
      messages: [{
        role: 'user',
        content: prompt
      }],
      reasoning_effort: this.getReasoningEffort(thesisType),
    };
    
    // For now, use synchronous endpoint as the async one requires different format
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Sonar API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`📚 Sonar Deep Research completed synchronously`);
    
    // For sync response, return a fake job ID with the result embedded
    return JSON.stringify({ type: 'sync', result });
  }
  
  /**
   * Poll for async research results
   */
  async getResults(jobId: string): Promise<SonarAsyncResponse> {
    // Check if this is a sync response
    try {
      const parsed = JSON.parse(jobId);
      if (parsed.type === 'sync' && parsed.result) {
        // Convert sync response to async format
        return {
          id: jobId,
          model: parsed.result.model,
          created_at: Date.now(),
          status: 'COMPLETED',
          response: {
            choices: parsed.result.choices,
            usage: parsed.result.usage,
            citations: parsed.result.citations || [],
          },
        };
      }
    } catch (e) {
      // Not a sync response, continue with async
    }
    
    const response = await fetch(
      `${this.baseUrl}/async/chat/completions/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Sonar API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Wait for research to complete with polling
   */
  async waitForCompletion(
    jobId: string,
    maxWaitTime: number = 600000, // 10 minutes
    pollInterval: number = 10000    // 10 seconds
  ): Promise<SonarAsyncResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = await this.getResults(jobId);
      
      if (result.status === 'COMPLETED') {
        console.log(`✅ Sonar research completed: ${result.response?.usage.num_search_queries} searches, ${result.response?.usage.reasoning_tokens} reasoning tokens`);
        return result;
      }
      
      if (result.status === 'FAILED') {
        throw new Error(`Sonar research failed: ${result.error_message}`);
      }
      
      console.log(`⏳ Sonar research status: ${result.status}...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Sonar research timed out');
  }
  
  /**
   * Convert Sonar results to Evidence array
   */
  parseToEvidence(result: SonarAsyncResponse): Evidence[] {
    if (!result.response) return [];
    
    const content = result.response.choices[0]?.message.content || '';
    const citations = result.response.citations || [];
    
    // Parse structured sections from the response
    const sections = this.parseStructuredContent(content);
    const evidence: Evidence[] = [];
    
    sections.forEach(section => {
      const pillarId = this.mapSectionToPillar(section.title);
      
      section.facts.forEach(fact => {
        evidence.push({
          id: uuidv4(),
          researchQuestionId: '', // Will be mapped by orchestrator
          pillarId,
          source: {
            type: 'web',
            name: 'Perplexity Deep Research',
            url: fact.sourceUrl || citations[fact.citationIndex] || '',
            credibilityScore: 0.9,
            publishDate: new Date(),
          },
          content: fact.content,
          createdAt: new Date(),
          metadata: {
            extractedAt: new Date(),
            extractionMethod: 'sonar_deep_research',
            wordCount: fact.content.split(/\s+/).length,
            language: 'en',
            keywords: [],
            section: section.title,
            // Store as generic metadata
            llmAnalysis: {
              reasoning_tokens: result.response?.usage?.reasoning_tokens,
              search_queries: result.response?.usage?.num_search_queries,
            },
          },
          qualityScore: {
            overall: 0.85, // High quality by default for Sonar
            components: {
              relevance: 0.9,
              credibility: 0.9,
              recency: 0.8,
              specificity: 0.85,
              bias: 0.1,
              depth: 0.85,
            },
            reasoning: 'High-quality evidence from Sonar Deep Research'
          }
        });
      });
    });
    
    return evidence;
  }
  
  /**
   * Extract market insights from Sonar results
   */
  extractInsights(result: SonarAsyncResponse): MarketInsights | null {
    if (!result.response) return null;
    
    const content = result.response.choices[0]?.message.content || '';
    
    // Use simple regex patterns to extract key insights
    const insights: MarketInsights = {
      tam: {
        size: this.extractPattern(content, /TAM.*?\$[\d.]+[BMK]/i) || 'Unknown',
        growth: this.extractPattern(content, /market.*?grow.*?(\d+%)/i) || 'Unknown',
        sources: [],
      },
      competitors: this.extractCompetitors(content),
      financials: {
        revenue: this.extractPattern(content, /revenue.*?\$[\d.]+[BMK]/i),
        growth: this.extractPattern(content, /revenue grow.*?(\d+%)/i),
        profitability: this.extractPattern(content, /margin.*?(\d+%)/i),
        funding: this.extractPattern(content, /funding.*?\$[\d.]+[BMK]/i),
      },
      risks: this.extractListItems(content, 'risks'),
      opportunities: this.extractListItems(content, 'opportunities'),
    };
    
    return insights;
  }
  
  /**
   * Calculate the cost of a Sonar research request
   */
  calculateCost(usage: any): number {
    if (!usage) return 0;
    
    const costs = {
      input: (usage.prompt_tokens / 1_000_000) * 2,
      output: (usage.completion_tokens / 1_000_000) * 8,
      citations: (usage.citation_tokens / 1_000_000) * 2,
      searches: (usage.num_search_queries / 1000) * 5,
      reasoning: (usage.reasoning_tokens / 1_000_000) * 3,
    };
    
    return Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  }
  
  // Private helper methods
  
  private buildResearchPrompt(
    company: string,
    website: string,
    thesisType: string,
    focusAreas: string[]
  ): string {
    const basePrompt = `Conduct comprehensive investment due diligence research on ${company} (${website}).

Investment Focus: ${this.getThesisFocus(thesisType)}

Required Analysis Sections:

1. MARKET ANALYSIS
   - Total Addressable Market (TAM) size and growth rate
   - Market segmentation and target customers
   - Industry trends and disruptions
   - Regulatory environment

2. COMPETITIVE LANDSCAPE
   - Direct competitors with market share
   - Competitive advantages and moats
   - Product/service differentiation
   - Pricing strategy and positioning

3. COMPANY OVERVIEW
   - Business model and revenue streams
   - Key products and services
   - Geographic presence
   - Company history and milestones

4. FINANCIAL PERFORMANCE
   - Revenue figures and growth rates
   - Profitability and margins
   - Unit economics (CAC, LTV, etc.)
   - Funding history and valuation

5. GROWTH INDICATORS
   - Customer acquisition and retention
   - Product development velocity
   - Market expansion plans
   - Strategic partnerships

6. TEAM AND CULTURE
   - Leadership team backgrounds
   - Key hires and departures
   - Company culture and values
   - Employee growth and reviews

7. RISKS AND CHALLENGES
   - Market risks
   - Competitive threats
   - Technology risks
   - Regulatory challenges

8. OPPORTUNITIES
   - Expansion opportunities
   - Product roadmap potential
   - M&A possibilities
   - Partnership opportunities`;

    if (focusAreas.length > 0) {
      return `${basePrompt}

Additional Focus Areas:
${focusAreas.map(area => `- ${area}`).join('\n')}

Provide specific metrics, data points, and recent developments with sources.`;
    }
    
    return `${basePrompt}

Provide specific metrics, data points, and recent developments with sources.`;
  }
  
  private getReasoningEffort(_thesisType: string): 'low' | 'medium' | 'high' {
    // Always use high effort for maximum depth and quality
    return 'high';
  }
  
  private getThesisFocus(thesisType: string): string {
    const focusMap: Record<string, string> = {
      'accelerate-growth': 'Growth potential and scalability',
      'margin-expansion': 'Operational efficiency and profitability',
      'market-expansion': 'Geographic and market opportunities',
      'turnaround': 'Restructuring potential and recovery path',
      'buy-and-build': 'Platform potential and acquisition targets',
    };
    
    return focusMap[thesisType] || 'General investment opportunity';
  }
  
  private parseStructuredContent(content: string): Array<{
    title: string;
    facts: Array<{
      content: string;
      citationIndex: number;
      sourceUrl?: string;
    }>;
  }> {
    const sections: Array<{title: string; facts: any[]}> = [];
    
    // Split by numbered sections (1. MARKET ANALYSIS, 2. COMPETITIVE LANDSCAPE, etc.)
    const sectionRegex = /\d+\.\s*([A-Z\s]+)\n([\s\S]*?)(?=\d+\.\s*[A-Z]|\n\n\d+\.|\Z)/g;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const sectionContent = match[2].trim();
      const facts: any[] = [];
      
      // Extract bullet points or paragraphs as facts
      const factRegex = /[-•]\s*(.+?)(?=\n[-•]|\n\n|$)/gs;
      let factMatch;
      
      while ((factMatch = factRegex.exec(sectionContent)) !== null) {
        const factContent = factMatch[1].trim();
        
        // Look for citations [1], [2], etc.
        const citationMatch = factContent.match(/\[(\d+)\]/);
        const citationIndex = citationMatch ? parseInt(citationMatch[1]) - 1 : -1;
        
        facts.push({
          content: factContent.replace(/\[\d+\]/g, '').trim(),
          citationIndex,
        });
      }
      
      if (facts.length === 0 && sectionContent.length > 50) {
        // If no bullet points, treat the whole section as one fact
        facts.push({
          content: sectionContent,
          citationIndex: -1,
        });
      }
      
      sections.push({ title, facts });
    }
    
    return sections;
  }
  
  private mapSectionToPillar(sectionTitle: string): string {
    const mapping: Record<string, string> = {
      'MARKET ANALYSIS': 'market-position',
      'COMPETITIVE LANDSCAPE': 'market-position',
      'COMPANY OVERVIEW': 'business-model',
      'FINANCIAL PERFORMANCE': 'financial-performance',
      'GROWTH INDICATORS': 'scalability',
      'TEAM AND CULTURE': 'team-organization',
      'RISKS': 'risk-factors',
      'OPPORTUNITIES': 'growth-potential',
    };
    
    const normalizedTitle = sectionTitle.toUpperCase().replace(/AND|&/g, '').trim();
    
    for (const [key, pillar] of Object.entries(mapping)) {
      if (normalizedTitle.includes(key.replace(/AND|&/g, '').trim())) {
        return pillar;
      }
    }
    
    return 'general';
  }
  
  private extractPattern(content: string, pattern: RegExp): string | undefined {
    const match = content.match(pattern);
    return match ? match[0] : undefined;
  }
  
  private extractCompetitors(content: string): MarketInsights['competitors'] {
    const competitors: MarketInsights['competitors'] = [];
    
    // Look for competitor mentions in competitive landscape section
    const competitorSection = content.match(/competitive landscape[\s\S]*?(?=\d+\.|$)/i);
    if (!competitorSection) return competitors;
    
    // Simple pattern matching for competitor names
    const competitorPatterns = [
      /compet(?:e|ing) with ([A-Z][a-zA-Z\s,&]+)/g,
      /competitors?\s+include ([A-Z][a-zA-Z\s,&]+)/gi,
      /([A-Z][a-zA-Z]+) (?:is|are) (?:a|the) main competitor/gi,
    ];
    
    competitorPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(competitorSection[0])) !== null) {
        const names = match[1].split(/,|and/).map(n => n.trim()).filter(n => n.length > 2);
        names.forEach(name => {
          if (!competitors.find(c => c.name === name)) {
            competitors.push({
              name,
              strengths: [],
            });
          }
        });
      }
    });
    
    return competitors;
  }
  
  private extractListItems(content: string, section: string): string[] {
    const items: string[] = [];
    
    const sectionRegex = new RegExp(`${section}[:\\s]*([\\s\\S]*?)(?=\\d+\\.|$)`, 'i');
    const sectionMatch = content.match(sectionRegex);
    
    if (sectionMatch) {
      const listRegex = /[-•]\s*(.+?)(?=\n[-•]|\n\n|$)/g;
      let match;
      
      while ((match = listRegex.exec(sectionMatch[1])) !== null) {
        items.push(match[1].trim());
      }
    }
    
    return items;
  }
}

// Export a singleton instance
export const sonarResearch = new SonarDeepResearch();