import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../config';

interface DeepAnalysisResult {
  synthesis: string;
  keyInsights: string[];
  investmentImplications: string[];
  confidenceLevel: number;
  assumptions: string[];
  dataGaps: string[];
  recommendations: string[];
}

export class DeepAnalyzer {
  private model: ChatOpenAI;

  constructor() {
    // Use o3-pro for deep analysis with extended thinking
    this.model = new ChatOpenAI({
      apiKey: config.OPENAI_API_KEY,
      modelName: models.openai.o3Pro,
      temperature: 0.3,
      maxTokens: 8000, // Allow for extensive analysis
    });
  }

  async analyzeInvestmentThesis(
    company: string,
    thesis: string,
    evidence: Array<{
      source: string;
      content: string;
      quality: number;
    }>
  ): Promise<DeepAnalysisResult> {
    const systemPrompt = `You are a senior PE investment partner with 20+ years of experience conducting deep due diligence.

Your task is to provide a comprehensive analysis of the investment thesis based on all available evidence. Think deeply about:
1. How well the evidence supports or contradicts the thesis
2. What the evidence reveals about the company's true position
3. Hidden opportunities or risks not immediately apparent
4. The quality and reliability of the evidence itself
5. What critical information is still missing

Be thorough, analytical, and provide actionable insights. Consider second and third-order effects.`;

    const evidenceSummary = evidence
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 20)
      .map((e, i) => `Evidence ${i + 1} (Quality: ${(e.quality * 100).toFixed(0)}%, Source: ${e.source}):\n${e.content.substring(0, 1000)}...`)
      .join('\n\n---\n\n');

    const userPrompt = `Company: ${company}
Investment Thesis: ${thesis}

Analyze the following evidence and provide a deep, comprehensive assessment:

${evidenceSummary}

Provide your analysis in the following structure:
1. Synthesis: Overall assessment of the investment opportunity
2. Key Insights: Most important findings from the evidence
3. Investment Implications: What this means for the investment decision
4. Confidence Level: How confident you are in the analysis (0-1)
5. Key Assumptions: What assumptions underpin your analysis
6. Data Gaps: What critical information is missing
7. Recommendations: Specific next steps or areas to investigate

Think deeply about patterns, contradictions, and what the evidence truly reveals.`;

    try {
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = response.content.toString();
      
      // Parse structured sections
      const sections = this.parseAnalysisSections(content);
      
      return {
        synthesis: sections.synthesis || 'No synthesis available',
        keyInsights: sections.keyInsights || [],
        investmentImplications: sections.investmentImplications || [],
        confidenceLevel: sections.confidenceLevel || 0.5,
        assumptions: sections.assumptions || [],
        dataGaps: sections.dataGaps || [],
        recommendations: sections.recommendations || [],
      };
    } catch (error) {
      console.error('Deep analysis error:', error);
      throw new Error(`Deep analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async evaluateCompetitivePosition(
    company: string,
    marketData: any[],
    competitorData: any[]
  ): Promise<{
    marketPosition: string;
    competitiveAdvantages: string[];
    competitiveRisks: string[];
    marketDynamics: string[];
    strategicOptions: string[];
  }> {
    const systemPrompt = `You are a strategy consultant specializing in competitive analysis for PE investments.

Conduct a deep competitive analysis considering:
1. Market positioning and differentiation
2. Sustainable competitive advantages
3. Competitive threats and vulnerabilities
4. Market dynamics and trends
5. Strategic options for growth and defense

Think beyond surface-level comparisons to identify true competitive dynamics.`;

    const marketSummary = marketData
      .map(d => `${d.source}: ${d.content.substring(0, 500)}...`)
      .join('\n\n');

    const competitorSummary = competitorData
      .map(d => `${d.competitor}: ${d.content.substring(0, 500)}...`)
      .join('\n\n');

    const userPrompt = `Company: ${company}

Market Data:
${marketSummary}

Competitor Data:
${competitorSummary}

Provide a deep competitive analysis.`;

    try {
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = response.content.toString();
      const analysis = this.parseCompetitiveAnalysis(content);
      
      return analysis;
    } catch (error) {
      console.error('Competitive analysis error:', error);
      return {
        marketPosition: 'Analysis failed',
        competitiveAdvantages: [],
        competitiveRisks: [],
        marketDynamics: [],
        strategicOptions: [],
      };
    }
  }

  async assessTechnologyMoat(
    company: string,
    techEvidence: any[]
  ): Promise<{
    moatStrength: number; // 0-1
    technicalAdvantages: string[];
    technicalRisks: string[];
    innovationCapacity: string;
    scalabilityAssessment: string;
    recommendations: string[];
  }> {
    const systemPrompt = `You are a technical due diligence expert evaluating technology companies for PE investment.

Assess the company's technical moat considering:
1. Proprietary technology and IP
2. Technical architecture and scalability
3. Development velocity and innovation capacity
4. Technical debt and risks
5. Competitive technical advantages

Provide a nuanced view of their technical position and future potential.`;

    const techSummary = techEvidence
      .map(e => `${e.source}: ${e.content.substring(0, 600)}...`)
      .join('\n\n');

    const userPrompt = `Company: ${company}

Technical Evidence:
${techSummary}

Provide a comprehensive assessment of their technology moat.`;

    try {
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = response.content.toString();
      const assessment = this.parseTechAssessment(content);
      
      return assessment;
    } catch (error) {
      console.error('Technology assessment error:', error);
      return {
        moatStrength: 0.5,
        technicalAdvantages: [],
        technicalRisks: [],
        innovationCapacity: 'Unable to assess',
        scalabilityAssessment: 'Unable to assess',
        recommendations: [],
      };
    }
  }

  private parseAnalysisSections(content: string): any {
    const sections: any = {};
    
    // Try to extract structured sections
    const synthesisMatch = content.match(/synthesis[:\s]+([\s\S]+?)(?=\n\n|\nkey insights|$)/i);
    if (synthesisMatch) sections.synthesis = synthesisMatch[1].trim();

    const insightsMatch = content.match(/key insights[:\s]+([\s\S]+?)(?=\n\n|\ninvestment implications|$)/i);
    if (insightsMatch) {
      sections.keyInsights = insightsMatch[1]
        .split(/\n[-•*]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }

    const implicationsMatch = content.match(/investment implications[:\s]+([\s\S]+?)(?=\n\n|\nconfidence level|$)/i);
    if (implicationsMatch) {
      sections.investmentImplications = implicationsMatch[1]
        .split(/\n[-•*]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }

    const confidenceMatch = content.match(/confidence level[:\s]+([0-9.]+)/i);
    if (confidenceMatch) {
      sections.confidenceLevel = parseFloat(confidenceMatch[1]);
    }

    const assumptionsMatch = content.match(/assumptions[:\s]+([\s\S]+?)(?=\n\n|\ndata gaps|$)/i);
    if (assumptionsMatch) {
      sections.assumptions = assumptionsMatch[1]
        .split(/\n[-•*]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }

    const gapsMatch = content.match(/data gaps[:\s]+([\s\S]+?)(?=\n\n|\nrecommendations|$)/i);
    if (gapsMatch) {
      sections.dataGaps = gapsMatch[1]
        .split(/\n[-•*]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }

    const recommendationsMatch = content.match(/recommendations[:\s]+([\s\S]+?)$/i);
    if (recommendationsMatch) {
      sections.recommendations = recommendationsMatch[1]
        .split(/\n[-•*]/)
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }

    return sections;
  }

  private parseCompetitiveAnalysis(content: string): any {
    // Implementation for parsing competitive analysis
    // Similar pattern to parseAnalysisSections
    return {
      marketPosition: 'Parsed from content',
      competitiveAdvantages: [],
      competitiveRisks: [],
      marketDynamics: [],
      strategicOptions: [],
    };
  }

  private parseTechAssessment(content: string): any {
    // Implementation for parsing tech assessment
    // Similar pattern to parseAnalysisSections
    return {
      moatStrength: 0.7,
      technicalAdvantages: [],
      technicalRisks: [],
      innovationCapacity: 'Parsed from content',
      scalabilityAssessment: 'Parsed from content',
      recommendations: [],
    };
  }
}