import { ResearchState, ReportSection, Citation } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { config, models } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { ReportSectionSchema, InvestmentRecommendationSchema, parseStructuredOutput } from '../../schemas/structured-outputs';
import { StructuredOutputParser } from '../../utils/structuredOutputParser';
import { v4 as uuidv4 } from 'uuid';

// Use Claude Opus 4 for report generation
const claudeModel = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.2,
  maxTokens: 8192, // Ensure we get complete responses
});

// Use o3-pro for final investment recommendation
const recommendationModel = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: 'o3-pro-2025-06-10',
  temperature: 0.1,
});

// Create structured tool for report section generation
const reportSectionTool = new DynamicStructuredTool({
  name: 'generate_report_section',
  description: 'Generate a structured report section with content, findings, and citations',
  schema: z.object({
    content: z.string().describe('The main content of the report section'),
    keyFindings: z.array(z.string()).describe('Key findings or bullet points'),
    citations: z.array(z.object({
      text: z.string().describe('The quoted text'),
      source: z.string().describe('The source of the citation'),
      evidenceId: z.string().optional().describe('ID of the evidence'),
    })).describe('Citations used in this section'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the analysis'),
    risks: z.array(z.string()).optional().describe('Identified risks'),
    opportunities: z.array(z.string()).optional().describe('Identified opportunities'),
  }),
  func: async (input) => JSON.stringify(input),
});

// Create structured tool for investment recommendations
const investmentRecommendationTool = new DynamicStructuredTool({
  name: 'generate_investment_recommendation',
  description: 'Generate a structured investment recommendation',
  schema: z.object({
    recommendation: z.enum(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).describe('Investment recommendation'),
    confidence: z.number().min(0).max(1).describe('Confidence score between 0 and 1'),
    rationale: z.string().describe('Detailed rationale for the recommendation'),
    keyDrivers: z.array(z.string()).describe('Key drivers of the recommendation'),
    risks: z.array(z.string()).describe('Key risks to consider'),
    nextSteps: z.array(z.string()).describe('Recommended next steps'),
    timeline: z.string().optional().describe('Recommended timeline for action'),
  }),
  func: async (input) => JSON.stringify(input),
});

// Helper functions
function getPillarIdForSection(sectionName: string): string {
  const mapping: Record<string, string> = {
    'Executive Summary': 'summary',
    'Technology Assessment': 'tech-architecture',
    'Market Analysis': 'market-position',
    'Financial Review': 'financial-health',
    'Risk Assessment': 'risk-analysis',
    'Information Gathering Recommendations': 'recommendations',
  };
  return mapping[sectionName] || 'general';
}

function getPillarWeight(state: ResearchState, pillarId: string): number {
  // Use the weights from the investment thesis pillars
  const pillar = state.thesis.pillars?.find(p => p.id === pillarId);
  if (pillar && pillar.weight) {
    return pillar.weight;
  }
  
  // Fallback weights if pillar not found
  const fallbackWeights: Record<string, number> = {
    'summary': 0.10,
    'tech-architecture': 0.25,
    'market-position': 0.25,
    'financial-health': 0.20,
    'risk-analysis': 0.15,
    'recommendations': 0.05,
  };
  
  return fallbackWeights[pillarId] || 0.1;
}

export async function generateReportNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📝 Generating investment report...');
  
  try {
    const { thesis, evidence, qualityScores, metadata } = state;
    
    // Sort evidence by quality score but include ALL evidence
    const sortedEvidence = evidence.sort((a, b) => 
      (b.qualityScore?.overall || 0) - (a.qualityScore?.overall || 0)
    );
    
    // Calculate confidence based on evidence quality distribution
    const avgQualityScore = evidence.reduce((sum, e) => sum + (e.qualityScore?.overall || 0), 0) / evidence.length;
    const highQualityCount = evidence.filter(e => e.qualityScore && e.qualityScore.overall >= 0.7).length;
    const mediumQualityCount = evidence.filter(e => e.qualityScore && e.qualityScore.overall >= 0.5 && e.qualityScore.overall < 0.7).length;
    const lowQualityCount = evidence.filter(e => !e.qualityScore || e.qualityScore.overall < 0.5).length;
    
    // Determine overall confidence level based on evidence quality
    let confidenceLevel: 'high' | 'medium' | 'low' | 'very-low';
    let inferenceApproach: string;
    
    if (avgQualityScore >= 0.7 && highQualityCount >= evidence.length * 0.6) {
      confidenceLevel = 'high';
      inferenceApproach = 'Direct evidence-based analysis with strong supporting data';
    } else if (avgQualityScore >= 0.5 && (highQualityCount + mediumQualityCount) >= evidence.length * 0.5) {
      confidenceLevel = 'medium';
      inferenceApproach = 'Reasonable inferences from mixed-quality evidence with some extrapolation';
    } else if (avgQualityScore >= 0.3) {
      confidenceLevel = 'low';
      inferenceApproach = 'Significant inference required due to limited high-quality evidence';
    } else {
      confidenceLevel = 'very-low';
      inferenceApproach = 'Highly speculative analysis based on weak evidence signals';
    }
    
    console.log(`Using ${evidence.length} total evidence pieces:`);
    console.log(`  - High quality (≥0.7): ${highQualityCount}`);
    console.log(`  - Medium quality (0.5-0.7): ${mediumQualityCount}`);
    console.log(`  - Low quality (<0.5): ${lowQualityCount}`);
    console.log(`  - Average quality score: ${avgQualityScore.toFixed(2)}`);
    console.log(`  - Confidence level: ${confidenceLevel}`);
    console.log(`  - Inference approach: ${inferenceApproach}`);
    
    // Generate report sections
    const sections: Record<string, ReportSection> = {};
    const allCitations: Citation[] = [];
    
    // Add confidence context to metadata for report generation
    const enhancedState = {
      ...state,
      metadata: {
        ...state.metadata,
        confidenceLevel,
        inferenceApproach,
        evidenceQualityDistribution: {
          high: highQualityCount,
          medium: mediumQualityCount,
          low: lowQualityCount,
          average: avgQualityScore
        }
      }
    };
    
    // 1. Executive Summary
    const execSummary = await generateSectionWithStructuredPrompt(
      'Executive Summary',
      enhancedState,
      sortedEvidence
    );
    sections['executive_summary'] = execSummary.section;
    allCitations.push(...execSummary.citations);
    
    // Generate information gathering recommendations based on evidence quality
    let infoGatheringRecommendations: string[] = [];
    
    if (confidenceLevel === 'low' || confidenceLevel === 'very-low') {
      infoGatheringRecommendations = [
        '**Direct Engagement Required**: Schedule meetings with CIBC technology leadership to discuss their digital transformation roadmap',
        '**RFI/RFP Participation**: Submit formal information requests through CIBC\'s procurement channels',
        '**Partner Network Intelligence**: Leverage existing Adobe-CIBC relationships or mutual partners for insider perspectives',
        '**Industry Events**: Attend Canadian banking technology conferences where CIBC executives present',
        '**Vendor Briefings**: Request formal vendor briefing sessions with CIBC\'s innovation and technology teams',
        '**Pilot Program Proposal**: Propose a limited pilot to gather direct implementation insights',
        '**Third-Party Validation**: Engage industry analysts (Gartner, Forrester) who cover CIBC\'s technology initiatives',
        '**Employee Networks**: Connect with current/former CIBC technology employees via LinkedIn for informal insights'
      ];
    } else if (confidenceLevel === 'medium') {
      infoGatheringRecommendations = [
        '**Targeted Intelligence**: Focus on specific technology areas where evidence gaps exist',
        '**Competitive Intelligence**: Analyze recent wins/losses with CIBC competitors',
        '**Partner Ecosystem**: Map CIBC\'s current technology vendor relationships',
        '**Regulatory Filings**: Review detailed technology disclosures in quarterly reports'
      ];
    }
    
    // Add recommendations to enhanced state
    enhancedState.metadata.infoGatheringRecommendations = infoGatheringRecommendations;
    
    // 2. Technology Assessment
    const techAssessment = await generateSectionWithStructuredPrompt(
      'Technology Assessment',
      enhancedState,
      sortedEvidence.filter(e => e.pillarId === 'tech-architecture' || e.pillarId === 'technical' || e.pillarId === 'webpage')
    );
    sections['tech_assessment'] = techAssessment.section;
    allCitations.push(...techAssessment.citations);
    
    // 3. Market Analysis
    const marketAnalysis = await generateSectionWithStructuredPrompt(
      'Market Analysis',
      enhancedState,
      sortedEvidence.filter(e => e.pillarId === 'market-position' || e.pillarId === 'search-result' || e.pillarId === 'research')
    );
    sections['market_analysis'] = marketAnalysis.section;
    allCitations.push(...marketAnalysis.citations);
    
    // 4. Financial Review
    const financialReview = await generateSectionWithStructuredPrompt(
      'Financial Review',
      enhancedState,
      sortedEvidence.filter(e => e.pillarId === 'financial-health' || e.content.toLowerCase().includes('financial') || e.content.toLowerCase().includes('revenue'))
    );
    sections['financial_review'] = financialReview.section;
    allCitations.push(...financialReview.citations);
    
    // 5. Risk Assessment
    const riskAssessment = await generateSectionWithStructuredPrompt(
      'Risk Assessment',
      enhancedState,
      sortedEvidence
    );
    sections['risk_assessment'] = riskAssessment.section;
    allCitations.push(...riskAssessment.citations);
    
    // 6. Information Gathering Recommendations (if confidence is not high)
    if (confidenceLevel !== 'high' && infoGatheringRecommendations.length > 0) {
      const infoGatheringSection: ReportSection = {
        title: 'Recommended Information Gathering Activities',
        content: `Given the ${confidenceLevel} confidence level of our analysis (average evidence quality: ${avgQualityScore.toFixed(2)}), we recommend the following information gathering activities to strengthen the investment thesis:\n\n${infoGatheringRecommendations.join('\n\n')}\n\n**Note**: ${inferenceApproach}. Direct engagement with CIBC stakeholders will significantly improve the accuracy and confidence of our recommendations.`,
        subsections: [],
        keyFindings: infoGatheringRecommendations.map(rec => rec.split(':')[1]?.trim() || rec),
        evidence: [],
        confidence: confidenceLevel as any,
        limitations: [
          `Current analysis based on ${highQualityCount} high-quality, ${mediumQualityCount} medium-quality, and ${lowQualityCount} low-quality evidence pieces`,
          'Limited access to internal CIBC technology roadmaps and strategic plans',
          'Absence of direct stakeholder input or validation'
        ]
      };
      sections['info_gathering'] = infoGatheringSection;
    }
    
    // 7. Investment Recommendation (using o3-pro)
    const recommendation = await generateInvestmentRecommendation(enhancedState, sections);
    sections['recommendation'] = recommendation.section;
    allCitations.push(...recommendation.citations);
    
    console.log(`✅ Report generated with ${Object.keys(sections).length} sections and ${allCitations.length} citations`);
    
    return {
      reportSections: sections,
      citations: allCitations,
      status: 'complete',
      metadata: {
        ...state.metadata,
        reportGeneratedAt: new Date(),
        reportStats: {
          sections: Object.keys(sections).length,
          totalCitations: allCitations.length,
          evidenceUsed: evidence.length,
        },
      },
    };
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'generate_report',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

async function generateSectionWithStructuredPrompt(
  sectionName: string,
  state: ResearchState,
  relevantEvidence: any[]
): Promise<{ section: ReportSection; citations: Citation[] }> {
  try {
    // Create evidence summary for context
    const evidenceSummary = relevantEvidence.slice(0, 20).map(e => ({
      id: e.id,
      source: e.source.name,
      url: e.source.url,
      score: e.qualityScore?.overall || 0,
      snippet: typeof e.content === 'string' ? 
        e.content.substring(0, 200) : 
        JSON.stringify(e.content).substring(0, 200)
    }));

    // Bind the tool to Claude for structured output
    const modelWithTool = claudeModel.bindTools([reportSectionTool]);
    
    // Create focused prompt based on confidence level
    const confidenceContext = state.metadata?.confidenceLevel || 'unknown';
    const inferenceApproach = state.metadata?.inferenceApproach || '';
    
    const systemPrompt = `You are generating the "${sectionName}" section of a sales intelligence report for ${state.thesis.company}.
    
Confidence Level: ${confidenceContext}
Inference Approach: ${inferenceApproach}
Evidence Quality: ${state.metadata?.evidenceQualityDistribution ? 
  `High: ${state.metadata.evidenceQualityDistribution.high}, Medium: ${state.metadata.evidenceQualityDistribution.medium}, Low: ${state.metadata.evidenceQualityDistribution.low}` : 
  'Unknown'}

Important Instructions:
- For HIGH confidence: Make direct, evidence-based claims
- For MEDIUM confidence: Use qualifying language ("appears to", "suggests", "indicates")
- For LOW confidence: Emphasize inference and speculation ("may", "could potentially", "limited evidence suggests")
- Always cite specific evidence when making claims
- Focus on ${state.metadata?.salesContext?.offering || 'digital transformation opportunities'}`;

    const userPrompt = `Generate the ${sectionName} section based on this evidence:

${evidenceSummary.map((e, i) => `
Evidence ${i + 1} (Score: ${e.score}):
- Source: ${e.source}
- URL: ${e.url}
- Content: ${e.snippet}...
`).join('\n')}

Focus on technology gaps, opportunities, and areas where Adobe solutions could add value.
Use the generate_report_section tool to structure your response.`;

    const response = await modelWithTool.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    // Extract the tool call result
    let sectionData;
    if (response.tool_calls && response.tool_calls.length > 0) {
      sectionData = response.tool_calls[0].args;
    } else {
      // Fallback to enhanced parser if no tool call
      const parsed = StructuredOutputParser.parseJson(
        response.content.toString(),
        z.object({
          content: z.string(),
          keyFindings: z.array(z.string()),
          citations: z.array(z.any()),
          confidence: z.string(),
          risks: z.array(z.string()).optional(),
          opportunities: z.array(z.string()).optional(),
        })
      );
      
      if (!parsed) {
        throw new Error('Failed to parse section data');
      }
      
      sectionData = parsed;
    }

    // Create citations with unique IDs
    const citations: Citation[] = (sectionData.citations || []).map((c: any) => ({
      id: uuidv4(),
      evidenceId: c.evidenceId || uuidv4(),
      reportSectionId: sectionName.toLowerCase().replace(/\s+/g, '_'),
      quote: c.text || '',
      context: `${c.source || 'Unknown'} - ${sectionName}`,
      pageNumber: c.pageNumber,
      createdAt: new Date(),
    }));

    return {
      section: {
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        pillarId: getPillarIdForSection(sectionName),
        title: sectionName,
        content: sectionData.content || '',
        score: sectionData.confidence === 'high' ? 0.9 : 
               sectionData.confidence === 'medium' ? 0.7 : 0.5,
        weight: getPillarWeight(state, getPillarIdForSection(sectionName)),
        keyFindings: sectionData.keyFindings || [],
        risks: sectionData.risks || [],
        opportunities: sectionData.opportunities || [],
      },
      citations,
    };
  } catch (error) {
    console.error(`Error generating ${sectionName}:`, error);
    return {
      section: {
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        pillarId: 'general',
        title: sectionName,
        content: `${sectionName} generation failed.`,
        score: 0,
        weight: getPillarWeight(state, getPillarIdForSection(sectionName)),
        keyFindings: [],
        risks: [],
        opportunities: [],
      },
      citations: [],
    };
  }
}

async function generateInvestmentRecommendation(
  state: ResearchState,
  reportSections: Record<string, ReportSection>
): Promise<{ section: ReportSection; citations: Citation[] }> {
  try {
    // Bind the tool to o3-pro for structured output
    const modelWithTool = recommendationModel.bindTools([investmentRecommendationTool]);
    
    // Extract key insights from report sections
    const sectionSummaries = Object.entries(reportSections).map(([key, section]) => ({
      name: section.title,
      keyFindings: section.keyFindings.slice(0, 3),
      score: section.score,
    }));
    
    const confidenceLevel = state.metadata?.confidenceLevel || 'unknown';
    const evidenceQuality = state.metadata?.evidenceQualityDistribution;
    const infoGatheringRecs = state.metadata?.infoGatheringRecommendations || [];
    
    const systemPrompt = `You are making an investment recommendation for Adobe selling to ${state.thesis.company}.
    
Overall Confidence: ${confidenceLevel}
Evidence Quality: ${evidenceQuality ? `High: ${evidenceQuality.high}, Medium: ${evidenceQuality.medium}, Low: ${evidenceQuality.low}` : 'Unknown'}

Key Report Insights:
${sectionSummaries.map(s => `- ${s.name} (Score: ${s.score}): ${s.keyFindings.join('; ')}`).join('\n')}

${infoGatheringRecs.length > 0 ? `\nNote: Due to ${confidenceLevel} confidence, additional information gathering is recommended.` : ''}

Consider the confidence level when making your recommendation:
- HIGH confidence: Strong recommendations based on solid evidence
- MEDIUM confidence: Cautious recommendations with caveats
- LOW confidence: Conservative recommendations with emphasis on information gathering first`;

    const userPrompt = `Based on the comprehensive analysis, provide an investment recommendation for Adobe's opportunity with ${state.thesis.company}.
    
Use the generate_investment_recommendation tool to structure your response.`;

    const response = await modelWithTool.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    // Extract the tool call result
    let recommendationData;
    if (response.tool_calls && response.tool_calls.length > 0) {
      recommendationData = response.tool_calls[0].args;
    } else {
      // Fallback to enhanced parser
      const parsed = StructuredOutputParser.parseJson(
        response.content.toString(),
        z.object({
          recommendation: z.string(),
          confidence: z.number(),
          rationale: z.string(),
          keyDrivers: z.array(z.string()),
          risks: z.array(z.string()),
          nextSteps: z.array(z.string()),
          timeline: z.string().optional(),
        })
      );
      
      if (!parsed) {
        throw new Error('Failed to parse recommendation');
      }
      
      recommendationData = parsed;
    }

    // Calculate overall investment score
    const investmentScore = recommendationData.confidence * 100;

    return {
      section: {
        id: 'recommendation',
        pillarId: 'summary',
        title: 'Investment Recommendation',
        content: `**${recommendationData.recommendation}** (Confidence: ${(recommendationData.confidence * 100).toFixed(0)}%)\n\n${recommendationData.rationale}\n\n**Key Drivers:**\n${recommendationData.keyDrivers.map(d => `- ${d}`).join('\n')}\n\n**Risks:**\n${recommendationData.risks.map(r => `- ${r}`).join('\n')}\n\n**Next Steps:**\n${recommendationData.nextSteps.map(s => `- ${s}`).join('\n')}${recommendationData.timeline ? `\n\n**Timeline:** ${recommendationData.timeline}` : ''}`,
        score: investmentScore,
        weight: getPillarWeight(state, 'summary'),
        keyFindings: recommendationData.keyDrivers,
        risks: recommendationData.risks,
        opportunities: recommendationData.nextSteps,
      },
      citations: [], // Recommendation doesn't need citations as it references other sections
    };
  } catch (error) {
    console.error('Error generating recommendation:', error);
    return {
      section: {
        id: 'recommendation',
        pillarId: 'summary',
        title: 'Investment Recommendation',
        content: 'Recommendation generation failed.',
        score: 0,
        weight: getPillarWeight(state, 'summary'),
        keyFindings: [],
        risks: [],
        opportunities: [],
      },
      citations: [],
    };
  }
}

// Remove duplicate functions - they are already defined at the top of the file