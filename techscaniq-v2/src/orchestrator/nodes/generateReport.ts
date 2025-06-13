import { ResearchState, ReportSection, Citation } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { ReportSectionSchema, InvestmentRecommendationSchema, parseStructuredOutput } from '../../schemas/structured-outputs';
import { v4 as uuidv4 } from 'uuid';

// Use Claude Opus 4 for report generation
const claudeModel = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.2,
  maxTokens: 8192, // Ensure we get complete responses
});

// Use o3-pro for final investment recommendation
const o3ProModel = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: models.openai.o3Pro,
  temperature: 0.1,
});

export async function generateReportNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📝 Generating investment report...');
  
  try {
    const { thesis, evidence, qualityScores, metadata } = state;
    
    // Filter high-quality evidence
    const highQualityEvidence = evidence.filter(e => 
      qualityScores && qualityScores[e.id] >= 0.7
    ).sort((a, b) => (qualityScores?.[b.id] || 0) - (qualityScores?.[a.id] || 0));
    
    console.log(`Using ${highQualityEvidence.length} high-quality evidence pieces`);
    
    // Generate report sections
    const sections: Record<string, ReportSection> = {};
    const allCitations: Citation[] = [];
    
    // 1. Executive Summary
    const execSummary = await generateSectionWithStructuredPrompt(
      'Executive Summary',
      state,
      highQualityEvidence
    );
    sections['executive_summary'] = execSummary.section;
    allCitations.push(...execSummary.citations);
    
    // 2. Technology Assessment
    const techAssessment = await generateSectionWithStructuredPrompt(
      'Technology Assessment',
      state,
      highQualityEvidence.filter(e => e.pillarId === 'tech-architecture')
    );
    sections['tech_assessment'] = techAssessment.section;
    allCitations.push(...techAssessment.citations);
    
    // 3. Market Analysis
    const marketAnalysis = await generateSectionWithStructuredPrompt(
      'Market Analysis',
      state,
      highQualityEvidence.filter(e => e.pillarId === 'market-position')
    );
    sections['market_analysis'] = marketAnalysis.section;
    allCitations.push(...marketAnalysis.citations);
    
    // 4. Financial Review
    const financialReview = await generateSectionWithStructuredPrompt(
      'Financial Review',
      state,
      highQualityEvidence.filter(e => e.pillarId === 'financial-health')
    );
    sections['financial_review'] = financialReview.section;
    allCitations.push(...financialReview.citations);
    
    // 5. Risk Assessment
    const riskAssessment = await generateSectionWithStructuredPrompt(
      'Risk Assessment',
      state,
      highQualityEvidence
    );
    sections['risk_assessment'] = riskAssessment.section;
    allCitations.push(...riskAssessment.citations);
    
    // 6. Investment Recommendation (using o3-pro)
    const recommendation = await generateInvestmentRecommendation(state, sections);
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
          evidenceUsed: highQualityEvidence.length,
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
    // Use structured prompt for report generation
    const { system, prompt } = PROMPTS.reportGeneration;
    
    const response = await claudeModel.invoke([
      new SystemMessage(system),
      new HumanMessage(prompt(state, sectionName)),
    ]);

    // Parse structured output
    const sectionData = parseStructuredOutput(
      ReportSectionSchema,
      response.content.toString()
    );

    // Create citations with unique IDs
    const citations: Citation[] = sectionData.citations.map((c: any) => ({
      id: uuidv4(),
      evidenceId: c.evidenceId || uuidv4(),
      reportSectionId: sectionName.toLowerCase().replace(/\s+/g, '_'),
      quote: c.text,
      context: `${c.source} - ${sectionName}`,
      pageNumber: c.pageNumber,
      createdAt: new Date(),
    }));

    return {
      section: {
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        pillarId: getPillarIdForSection(sectionName),
        title: sectionName,
        content: sectionData.content,
        score: calculateSectionScore(sectionData),
        weight: getSectionWeight(sectionName),
        keyFindings: sectionData.keyFindings,
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
        weight: 0.1,
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
    // Use o3-pro for final recommendation
    const { system, prompt } = PROMPTS.investmentRecommendation;
    
    const response = await o3ProModel.invoke([
      new SystemMessage(system),
      new HumanMessage(prompt(state, Object.values(reportSections))),
    ]);

    // Parse structured output
    const recommendation = parseStructuredOutput(
      InvestmentRecommendationSchema,
      response.content.toString()
    );

    // Calculate overall investment score
    const investmentScore = recommendation.confidence * 100;

    return {
      section: {
        id: 'recommendation',
        pillarId: 'summary',
        title: 'Investment Recommendation',
        content: formatRecommendation(recommendation),
        score: investmentScore,
        weight: 1.0,
        keyFindings: recommendation.keyReasons.map(r => r.factor),
        risks: recommendation.conditions
          .filter(c => c.importance === 'critical')
          .map(c => c.condition),
        opportunities: recommendation.dealConsiderations
          .map(d => d.recommendation),
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
        weight: 1.0,
        keyFindings: [],
        risks: [],
        opportunities: [],
      },
      citations: [],
    };
  }
}

function formatRecommendation(recommendation: any): string {
  const reasons = recommendation.keyReasons
    .map((r: any) => `• ${r.factor} (${r.impact}, weight: ${(r.weight * 100).toFixed(0)}%)`)
    .join('\n');
    
  const conditions = recommendation.conditions
    .map((c: any) => `• ${c.condition} - ${c.timeline} (${c.importance})`)
    .join('\n');
    
  const dealPoints = recommendation.dealConsiderations
    .map((d: any) => `• ${d.aspect}: ${d.recommendation}\n  Rationale: ${d.rationale}`)
    .join('\n\n');

  return `
## Recommendation: ${recommendation.recommendation}
**Confidence Level:** ${(recommendation.confidence * 100).toFixed(0)}%

### Key Supporting Factors
${reasons}

### Critical Success Conditions
${conditions}

### Deal Structuring Considerations
${dealPoints}
  `.trim();
}

function getPillarIdForSection(sectionName: string): string {
  const mapping: Record<string, string> = {
    'Executive Summary': 'summary',
    'Technology Assessment': 'tech-architecture',
    'Market Analysis': 'market-position',
    'Financial Review': 'financial-health',
    'Risk Assessment': 'risks',
  };
  return mapping[sectionName] || 'general';
}

function getSectionWeight(sectionName: string): number {
  const weights: Record<string, number> = {
    'Executive Summary': 0.15,
    'Technology Assessment': 0.25,
    'Market Analysis': 0.25,
    'Financial Review': 0.20,
    'Risk Assessment': 0.15,
  };
  return weights[sectionName] || 0.1;
}

function calculateSectionScore(sectionData: any): number {
  // Calculate score based on confidence levels in supporting data
  if (!sectionData.supportingData || sectionData.supportingData.length === 0) {
    return 50; // Default neutral score
  }
  
  const avgConfidence = sectionData.supportingData.reduce(
    (sum: number, item: any) => sum + (item.confidence || 0.5),
    0
  ) / sectionData.supportingData.length;
  
  return Math.round(avgConfidence * 100);
}