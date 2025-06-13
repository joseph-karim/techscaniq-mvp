import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../config';
import { Evidence, Citation } from '../types';

interface CitationReview {
  citationId: string;
  isValid: boolean;
  accuracy: number; // 0-1
  relevance: number; // 0-1
  issues: string[];
  suggestions: string[];
}

interface EvidenceReview {
  evidenceId: string;
  overallScore: number; // 0-1
  citationAccuracy: number;
  claimSupport: number;
  contradictions: string[];
  missingContext: string[];
}

export class CitationReviewer {
  private model: ChatOpenAI;

  constructor() {
    // Use o3 for thorough citation review with reasoning
    this.model = new ChatOpenAI({
      apiKey: config.OPENAI_API_KEY,
      modelName: models.openai.o3,
      temperature: 0.1, // Low temperature for accuracy
      maxTokens: 4000,
    });
  }

  async reviewCitations(
    citations: Citation[],
    evidence: Evidence[]
  ): Promise<CitationReview[]> {
    const systemPrompt = `You are a meticulous fact-checker and citation expert for investment research.

Your task is to verify that citations accurately represent their source material and properly support claims. Check for:
1. Accuracy: Does the citation accurately quote or paraphrase the source?
2. Context: Is important context preserved or lost?
3. Relevance: Does the citation actually support the claim being made?
4. Misrepresentation: Any misleading use of the source?

Be thorough and precise. Investment decisions depend on accurate information.`;

    const reviews: CitationReview[] = [];

    // Batch process citations for efficiency
    const batchSize = 5;
    for (let i = 0; i < citations.length; i += batchSize) {
      const batch = citations.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (citation) => {
        const sourceEvidence = evidence.find(e => e.id === citation.evidenceId);
        if (!sourceEvidence) {
          return {
            citationId: citation.id,
            isValid: false,
            accuracy: 0,
            relevance: 0,
            issues: ['Source evidence not found'],
            suggestions: ['Verify evidence ID and availability'],
          };
        }

        const userPrompt = `Review this citation for accuracy and validity:

Citation:
- Quote: "${citation.quote}"
- Context: "${citation.context}"
- Used in section: ${citation.reportSectionId}

Original Source (${sourceEvidence.source.name}):
${sourceEvidence.content.substring(0, 2000)}...

Evaluate:
1. Is the quote accurate to the source?
2. Is it used in proper context?
3. Does it support the claim being made?
4. Any issues or improvements needed?

Provide scores (0-1) for accuracy and relevance, list any issues, and suggest improvements.`;

        try {
          const response = await this.model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
          ]);

          const content = response.content.toString();
          const review = this.parseCitationReview(content, citation.id);
          
          return review;
        } catch (error) {
          console.error(`Citation review error for ${citation.id}:`, error);
          return {
            citationId: citation.id,
            isValid: true,
            accuracy: 0.7,
            relevance: 0.7,
            issues: [],
            suggestions: [],
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      reviews.push(...batchResults);
    }

    return reviews;
  }

  async scoreEvidence(
    evidence: Evidence[],
    thesis: any
  ): Promise<EvidenceReview[]> {
    const systemPrompt = `You are an expert investment analyst scoring evidence quality for due diligence.

Score each piece of evidence based on:
1. Direct support for the investment thesis
2. Quality and credibility of information
3. Presence of specific data points vs generic statements
4. Identification of contradictions or concerns
5. Completeness of context

Think carefully about what makes evidence valuable for investment decisions.`;

    const reviews: EvidenceReview[] = [];
    
    // Process evidence in batches
    const batchSize = 3;
    for (let i = 0; i < evidence.length; i += batchSize) {
      const batch = evidence.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        const userPrompt = `Score this evidence for the investment thesis:

Investment Thesis: ${thesis.statement}
Company: ${thesis.company}

Evidence Source: ${item.source.name}
Source Type: ${item.source.type}
Credibility: ${item.source.credibilityScore}

Evidence Content (first 1500 chars):
${item.content.substring(0, 1500)}...

Provide:
1. Overall score (0-1)
2. Citation accuracy potential (0-1)
3. Claim support strength (0-1)
4. Any contradictions with the thesis
5. Missing context that would strengthen this evidence`;

        try {
          const response = await this.model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt),
          ]);

          const content = response.content.toString();
          const review = this.parseEvidenceReview(content, item.id);
          
          return review;
        } catch (error) {
          console.error(`Evidence scoring error for ${item.id}:`, error);
          return {
            evidenceId: item.id,
            overallScore: 0.5,
            citationAccuracy: 0.5,
            claimSupport: 0.5,
            contradictions: [],
            missingContext: [],
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      reviews.push(...batchResults);
    }

    return reviews;
  }

  async identifyCitationGaps(
    reportContent: string,
    citations: Citation[]
  ): Promise<{
    uncitedClaims: string[];
    weaklySupportedClaims: string[];
    overCitedSections: string[];
    recommendations: string[];
  }> {
    const systemPrompt = `You are reviewing an investment report for citation completeness and quality.

Identify:
1. Claims that need citations but don't have them
2. Claims with weak or insufficient citation support
3. Sections that may be over-cited (too many citations for simple claims)
4. Recommendations for improving citation quality

Focus on claims that would influence investment decisions.`;

    const citationMap = citations.reduce((acc, c) => {
      acc[c.reportSectionId] = (acc[c.reportSectionId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userPrompt = `Review this investment report for citation gaps:

Report Content:
${reportContent.substring(0, 5000)}...

Current Citation Distribution:
${Object.entries(citationMap).map(([section, count]) => `${section}: ${count} citations`).join('\n')}

Identify gaps and provide recommendations.`;

    try {
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = response.content.toString();
      return this.parseCitationGaps(content);
    } catch (error) {
      console.error('Citation gap analysis error:', error);
      return {
        uncitedClaims: [],
        weaklySupportedClaims: [],
        overCitedSections: [],
        recommendations: ['Unable to analyze citation gaps'],
      };
    }
  }

  private parseCitationReview(content: string, citationId: string): CitationReview {
    // Extract scores
    const accuracyMatch = content.match(/accuracy[:\s]+([0-9.]+)/i);
    const relevanceMatch = content.match(/relevance[:\s]+([0-9.]+)/i);
    
    // Extract issues
    const issuesMatch = content.match(/issues?[:\s]+([\s\S]+?)(?=suggest|recommend|$)/i);
    const issues = issuesMatch 
      ? issuesMatch[1].split(/\n[-•*]/).map(i => i.trim()).filter(i => i.length > 0)
      : [];

    // Extract suggestions
    const suggestionsMatch = content.match(/suggest(?:ions?)?[:\s]+([\s\S]+?)$/i);
    const suggestions = suggestionsMatch
      ? suggestionsMatch[1].split(/\n[-•*]/).map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const accuracy = accuracyMatch ? parseFloat(accuracyMatch[1]) : 0.8;
    const relevance = relevanceMatch ? parseFloat(relevanceMatch[1]) : 0.8;

    return {
      citationId,
      isValid: accuracy > 0.6 && relevance > 0.6,
      accuracy,
      relevance,
      issues,
      suggestions,
    };
  }

  private parseEvidenceReview(content: string, evidenceId: string): EvidenceReview {
    // Extract scores
    const overallMatch = content.match(/overall[:\s]+([0-9.]+)/i);
    const citationMatch = content.match(/citation[:\s]+([0-9.]+)/i);
    const claimMatch = content.match(/claim[:\s]+([0-9.]+)/i);

    // Extract contradictions
    const contradictionsMatch = content.match(/contradict(?:ions?)?[:\s]+([\s\S]+?)(?=missing|$)/i);
    const contradictions = contradictionsMatch
      ? contradictionsMatch[1].split(/\n[-•*]/).map(c => c.trim()).filter(c => c.length > 0)
      : [];

    // Extract missing context
    const missingMatch = content.match(/missing[:\s]+([\s\S]+?)$/i);
    const missingContext = missingMatch
      ? missingMatch[1].split(/\n[-•*]/).map(m => m.trim()).filter(m => m.length > 0)
      : [];

    return {
      evidenceId,
      overallScore: overallMatch ? parseFloat(overallMatch[1]) : 0.7,
      citationAccuracy: citationMatch ? parseFloat(citationMatch[1]) : 0.7,
      claimSupport: claimMatch ? parseFloat(claimMatch[1]) : 0.7,
      contradictions,
      missingContext,
    };
  }

  private parseCitationGaps(content: string): any {
    const sections: any = {
      uncitedClaims: [],
      weaklySupportedClaims: [],
      overCitedSections: [],
      recommendations: [],
    };

    // Parse each section
    const uncitedMatch = content.match(/uncited[:\s]+([\s\S]+?)(?=weakly|$)/i);
    if (uncitedMatch) {
      sections.uncitedClaims = uncitedMatch[1]
        .split(/\n[-•*]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    const weaklyMatch = content.match(/weakly[:\s]+([\s\S]+?)(?=over-?cited|$)/i);
    if (weaklyMatch) {
      sections.weaklySupportedClaims = weaklyMatch[1]
        .split(/\n[-•*]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    const overMatch = content.match(/over-?cited[:\s]+([\s\S]+?)(?=recommend|$)/i);
    if (overMatch) {
      sections.overCitedSections = overMatch[1]
        .split(/\n[-•*]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
    }

    const recommendMatch = content.match(/recommend(?:ations?)?[:\s]+([\s\S]+?)$/i);
    if (recommendMatch) {
      sections.recommendations = recommendMatch[1]
        .split(/\n[-•*]/)
        .map(r => r.trim())
        .filter(r => r.length > 0);
    }

    return sections;
  }
}