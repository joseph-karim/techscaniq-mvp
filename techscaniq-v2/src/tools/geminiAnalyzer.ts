import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, models } from '../config';

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  entities: {
    companies: string[];
    people: string[];
    technologies: string[];
    metrics: string[];
  };
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  relevantQuotes: string[];
  investmentRelevance: number; // 0-1
}

export class GeminiAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: models.google.geminiFlash2,
      generationConfig: {
        temperature: 0.2,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
  }

  async analyzeContent(content: string, context: {
    company: string;
    pillar: string;
    question?: string;
  }): Promise<AnalysisResult> {
    const prompt = `Analyze this content for investment due diligence on ${context.company}.

Focus area: ${context.pillar}
${context.question ? `Specific question: ${context.question}` : ''}

Content to analyze:
${content.substring(0, 10000)}

Extract:
1. Brief summary (2-3 sentences)
2. Key investment-relevant points (bullet points)
3. Named entities:
   - Companies mentioned
   - People (executives, analysts, etc.)
   - Technologies/products
   - Specific metrics/numbers
4. Overall sentiment
5. Most relevant quotes for investment analysis
6. Investment relevance score (0-1)

Output as JSON:
{
  "summary": "...",
  "keyPoints": ["point1", "point2"],
  "entities": {
    "companies": [],
    "people": [],
    "technologies": [],
    "metrics": []
  },
  "sentiment": "positive|negative|neutral|mixed",
  "relevantQuotes": ["quote1", "quote2"],
  "investmentRelevance": 0.0-1.0
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from Gemini response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the response
      return {
        summary: analysis.summary || 'No summary available',
        keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
        entities: {
          companies: Array.isArray(analysis.entities?.companies) ? analysis.entities.companies : [],
          people: Array.isArray(analysis.entities?.people) ? analysis.entities.people : [],
          technologies: Array.isArray(analysis.entities?.technologies) ? analysis.entities.technologies : [],
          metrics: Array.isArray(analysis.entities?.metrics) ? analysis.entities.metrics : [],
        },
        sentiment: analysis.sentiment || 'neutral',
        relevantQuotes: Array.isArray(analysis.relevantQuotes) ? analysis.relevantQuotes : [],
        investmentRelevance: typeof analysis.investmentRelevance === 'number' ? 
          Math.min(1, Math.max(0, analysis.investmentRelevance)) : 0.5,
      };
    } catch (error) {
      console.error('Gemini analysis error:', error);
      // Return a basic analysis on error
      return {
        summary: 'Analysis failed',
        keyPoints: [],
        entities: {
          companies: [],
          people: [],
          technologies: [],
          metrics: [],
        },
        sentiment: 'neutral',
        relevantQuotes: [],
        investmentRelevance: 0.3,
      };
    }
  }

  async extractMetrics(content: string, company: string): Promise<{
    metrics: Array<{
      name: string;
      value: string;
      context: string;
    }>;
    dates: Array<{
      date: string;
      event: string;
    }>;
  }> {
    const prompt = `Extract all business metrics and important dates from this content about ${company}.

Content:
${content.substring(0, 8000)}

Find:
1. All business metrics (revenue, growth rates, user counts, etc.) with their values and context
2. Important dates and events

Output as JSON:
{
  "metrics": [
    {"name": "metric name", "value": "value with units", "context": "surrounding context"}
  ],
  "dates": [
    {"date": "date/period", "event": "what happened"}
  ]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { metrics: [], dates: [] };
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        metrics: Array.isArray(data.metrics) ? data.metrics : [],
        dates: Array.isArray(data.dates) ? data.dates : [],
      };
    } catch (error) {
      console.error('Metric extraction error:', error);
      return { metrics: [], dates: [] };
    }
  }

  async compareEvidence(evidencePieces: Array<{
    source: string;
    content: string;
  }>): Promise<{
    agreements: string[];
    contradictions: string[];
    uniqueInsights: Record<string, string[]>;
  }> {
    const prompt = `Compare these evidence pieces and identify agreements, contradictions, and unique insights.

${evidencePieces.map((e, i) => `Source ${i + 1} (${e.source}):\n${e.content.substring(0, 1000)}\n`).join('\n---\n')}

Analyze:
1. Points where sources agree
2. Contradictions between sources
3. Unique insights from each source

Output as JSON:
{
  "agreements": ["point 1", "point 2"],
  "contradictions": ["contradiction 1", "contradiction 2"],
  "uniqueInsights": {
    "Source 1": ["insight 1", "insight 2"],
    "Source 2": ["insight 1", "insight 2"]
  }
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { agreements: [], contradictions: [], uniqueInsights: {} };
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return {
        agreements: Array.isArray(analysis.agreements) ? analysis.agreements : [],
        contradictions: Array.isArray(analysis.contradictions) ? analysis.contradictions : [],
        uniqueInsights: analysis.uniqueInsights || {},
      };
    } catch (error) {
      console.error('Evidence comparison error:', error);
      return { agreements: [], contradictions: [], uniqueInsights: {} };
    }
  }
}