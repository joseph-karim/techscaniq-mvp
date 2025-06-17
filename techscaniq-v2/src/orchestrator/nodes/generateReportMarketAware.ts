import { ResearchState, ReportSection, Citation } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { getTechnicalMoatEvaluationPrompt } from '../../prompts/market-context-aware-prompts';
import { MarketContext } from '../../types';

// Use Claude Opus 4 for report generation
const claudeModel = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.2,
  maxTokens: 8192,
});

// Use o3-pro for final investment recommendation
const o3ProModel = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: models.openai.o3Pro,
  temperature: 0.1,
});

export async function generateReportMarketAwareNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📝 Generating market-aware investment report...');
  
  try {
    const { thesis, evidence, qualityScores, metadata } = state;
    const marketContext = metadata?.marketContext as MarketContext;
    const marketSignals = metadata?.marketSignals;
    
    if (!marketContext) {
      console.warn('No market context found, using standard report generation');
      return generateStandardReport(state);
    }
    
    console.log(`📊 Generating report for ${marketContext.targetCustomerSize} market context`);
    
    // Filter high-quality evidence
    const highQualityEvidence = evidence.filter(e => 
      qualityScores && qualityScores[e.id] >= 0.7
    ).sort((a, b) => (qualityScores?.[b.id] || 0) - (qualityScores?.[a.id] || 0));
    
    console.log(`Using ${highQualityEvidence.length} high-quality evidence pieces`);
    
    // Generate report sections with market awareness
    const sections: Record<string, ReportSection> = {};
    const allCitations: Citation[] = [];
    
    // 1. Executive Summary with Market Context
    const execSummary = await generateMarketAwareSection(
      'Executive Summary',
      state,
      highQualityEvidence,
      marketContext,
      marketSignals
    );
    sections['executive_summary'] = execSummary.section;
    allCitations.push(...execSummary.citations);
    
    // 2. Market-Contextualized Technology Assessment
    const techAssessment = await generateMarketAwareTechSection(
      state,
      highQualityEvidence.filter(e => e.pillarId === 'tech-architecture'),
      marketContext,
      marketSignals
    );
    sections['tech_assessment'] = techAssessment.section;
    allCitations.push(...techAssessment.citations);
    
    // 3. Market Position Analysis
    const marketAnalysis = await generateMarketPositionSection(
      state,
      highQualityEvidence.filter(e => e.pillarId === 'market-position'),
      marketContext,
      marketSignals
    );
    sections['market_analysis'] = marketAnalysis.section;
    allCitations.push(...marketAnalysis.citations);
    
    // 4. Financial Review with Market Context
    const financialReview = await generateMarketAwareSection(
      'Financial Review',
      state,
      highQualityEvidence.filter(e => e.pillarId === 'financial-health'),
      marketContext,
      marketSignals
    );
    sections['financial_review'] = financialReview.section;
    allCitations.push(...financialReview.citations);
    
    // 5. Market-Specific Risk Assessment
    const riskAssessment = await generateMarketAwareRiskSection(
      state,
      highQualityEvidence,
      marketContext,
      marketSignals
    );
    sections['risk_assessment'] = riskAssessment.section;
    allCitations.push(...riskAssessment.citations);
    
    // 6. Market Fit Analysis (New Section)
    const marketFit = await generateMarketFitSection(
      state,
      highQualityEvidence,
      marketContext,
      marketSignals
    );
    sections['market_fit'] = marketFit.section;
    allCitations.push(...marketFit.citations);
    
    // 7. Investment Recommendation with Market Context
    const recommendation = await generateMarketAwareRecommendation(
      state, 
      sections,
      marketContext,
      marketSignals
    );
    sections['recommendation'] = recommendation.section;
    allCitations.push(...recommendation.citations);
    
    console.log(`✅ Market-aware report generated:`);
    console.log(`   Sections: ${Object.keys(sections).length}`);
    console.log(`   Citations: ${allCitations.length}`);
    console.log(`   Market: ${marketContext.targetCustomerSize}`);
    console.log(`   Market Leader: ${marketContext.competitiveContext.marketLeader}`);
    
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
          marketContext: marketContext.targetCustomerSize,
        },
      },
    };
    
  } catch (error) {
    console.error('❌ Market-aware report generation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'generate_report_market_aware',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

async function generateMarketAwareSection(
  sectionName: string,
  state: ResearchState,
  relevantEvidence: any[],
  marketContext: MarketContext,
  marketSignals: any
): Promise<{ section: ReportSection; citations: Citation[] }> {
  try {
    const systemPrompt = `You are an expert investment analyst writing a ${sectionName} for ${state.thesis.company}.

CRITICAL MARKET CONTEXT:
- Target Market: ${marketContext.targetCustomerSize}
- Primary Buyers: ${marketContext.primaryBuyers.join(', ')}
- Market Leader: ${marketContext.competitiveContext.marketLeader} (${marketContext.competitiveContext.marketLeaderShare}% share)
- Customer Count: ${marketSignals?.customerCount || 'Unknown'}
- Retention Rate: ${marketSignals?.retentionRate || 'Unknown'}%

When writing this section:
1. Frame all analysis through the lens of the ${marketContext.targetCustomerSize} market
2. Compare to what's normal/expected for this market segment
3. Highlight what matters to ${marketContext.primaryBuyers.join(' and ')}
4. Use market-appropriate benchmarks

Output JSON format:
{
  "content": "Section content with market context woven throughout",
  "keyFindings": ["finding1", "finding2"],
  "marketSpecificInsights": ["insight1 about ${marketContext.targetCustomerSize} fit"],
  "risks": ["risk1 for ${marketContext.targetCustomerSize} market"],
  "opportunities": ["opportunity1 in ${marketContext.targetCustomerSize} segment"],
  "supportingData": [
    {
      "dataPoint": "specific metric or fact",
      "marketContext": "why this matters for ${marketContext.targetCustomerSize}",
      "confidence": 0.0-1.0
    }
  ],
  "citations": [
    {
      "text": "quoted text",
      "source": "source name",
      "relevance": "market relevance"
    }
  ]
}`;

    const userPrompt = `Write the ${sectionName} for ${state.thesis.company}.

Key evidence to incorporate:
${relevantEvidence.slice(0, 5).map(e => 
  `- ${e.content.substring(0, 200)}... (Quality: ${((state.qualityScores?.[e.id] || 0) * 100).toFixed(0)}%)`
).join('\n')}

Remember: This is for investors evaluating ${state.thesis.company} as a ${marketContext.targetCustomerSize} play.`;

    const response = await claudeModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    // Parse response
    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse section JSON');
    }
    
    const sectionData = JSON.parse(jsonMatch[0]);

    // Create citations with unique IDs
    const citations: Citation[] = sectionData.citations.map((c: any) => ({
      id: uuidv4(),
      evidenceId: uuidv4(),
      reportSectionId: sectionName.toLowerCase().replace(/\s+/g, '_'),
      quote: c.text,
      context: `${c.source} - ${c.relevance || sectionName}`,
      createdAt: new Date(),
    }));

    return {
      section: {
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        pillarId: getPillarIdForSection(sectionName),
        title: sectionName,
        content: sectionData.content,
        score: calculateMarketAwareScore(sectionData, marketContext),
        weight: getMarketAdjustedWeight(sectionName, marketContext),
        keyFindings: sectionData.keyFindings,
        risks: sectionData.risks || [],
        opportunities: sectionData.opportunities || [],
        metadata: {
          marketSpecificInsights: sectionData.marketSpecificInsights,
          marketContext: marketContext.targetCustomerSize,
        },
      },
      citations,
    };
  } catch (error) {
    console.error(`Error generating market-aware ${sectionName}:`, error);
    return generateFallbackSection(sectionName);
  }
}

async function generateMarketAwareTechSection(
  state: ResearchState,
  techEvidence: any[],
  marketContext: MarketContext,
  marketSignals: any
): Promise<{ section: ReportSection; citations: Citation[] }> {
  const systemPrompt = `You are evaluating ${state.thesis.company}'s technology for the ${marketContext.targetCustomerSize} market.

REMEMBER: Technical excellence is relative to market needs!
- SMB: Values stability, ease of use, integrations over cutting-edge tech
- Enterprise: Needs scale, security, compliance, APIs
- Developer: Requires excellent DX, SDKs, documentation

Market Context:
- Target: ${marketContext.targetCustomerSize}
- Tech Sophistication: ${marketContext.technicalSophistication}
- Typical Stack: ${marketContext.industryNorms.typicalTechStack.join(', ')}

Evaluate:
1. Is the technology APPROPRIATE for ${marketContext.targetCustomerSize}?
2. Does it integrate with what ${marketContext.targetCustomerSize} companies use?
3. Are "limitations" actually fine for this market?
4. What technical investments make sense for this market?

${getTechnicalMoatEvaluationPrompt(state.thesis.company, marketContext)}

Output the same JSON format as other sections.`;

  const userPrompt = `Evaluate ${state.thesis.company}'s technology architecture.

Key technical evidence:
${techEvidence.slice(0, 7).map(e => 
  `- ${e.content.substring(0, 150)}...`
).join('\n')}

Market signals:
- Customer Count: ${marketSignals?.customerCount || 'Unknown'}
- Avg Contract Value: ${marketSignals?.avgContractValue ? `$${marketSignals.avgContractValue.toLocaleString()}` : 'Unknown'}
- Retention: ${marketSignals?.retentionRate || 'Unknown'}%

Provide a balanced assessment for ${marketContext.targetCustomerSize} investors.`;

  try {
    const response = await claudeModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse tech assessment JSON');
    }
    
    const sectionData = JSON.parse(jsonMatch[0]);

    const citations: Citation[] = sectionData.citations.map((c: any) => ({
      id: uuidv4(),
      evidenceId: uuidv4(),
      reportSectionId: 'tech_assessment',
      quote: c.text,
      context: `${c.source} - Market-aware tech analysis`,
      createdAt: new Date(),
    }));

    return {
      section: {
        id: 'tech_assessment',
        pillarId: 'tech-architecture',
        title: `Technology Assessment for ${marketContext.targetCustomerSize} Market`,
        content: sectionData.content,
        score: calculateMarketAwareScore(sectionData, marketContext),
        weight: getMarketAdjustedWeight('Technology Assessment', marketContext),
        keyFindings: sectionData.keyFindings,
        risks: sectionData.risks || [],
        opportunities: sectionData.opportunities || [],
        metadata: {
          marketAppropriateness: sectionData.marketAppropriateness,
          technicalDebtRelevance: sectionData.technicalDebtRelevance,
        },
      },
      citations,
    };
  } catch (error) {
    console.error('Error generating market-aware tech assessment:', error);
    return generateFallbackSection('Technology Assessment');
  }
}

async function generateMarketFitSection(
  state: ResearchState,
  evidence: any[],
  marketContext: MarketContext,
  marketSignals: any
): Promise<{ section: ReportSection; citations: Citation[] }> {
  const systemPrompt = `Analyze ${state.thesis.company}'s product-market fit for the ${marketContext.targetCustomerSize} segment.

Key Questions:
1. How well does the product serve ${marketContext.primaryBuyers.join(' and ')}?
2. Does the pricing model fit ${marketContext.targetCustomerSize} budgets?
3. Are the features aligned with ${marketContext.targetCustomerSize} needs?
4. How does it compare to ${marketContext.competitiveContext.marketLeader}?
5. What's the switching cost/friction for ${marketContext.targetCustomerSize}?

Market Signals:
- Customer Count: ${marketSignals?.customerCount || 'Unknown'}
- Retention: ${marketSignals?.retentionRate || 'Unknown'}%
- Growth Strategy: ${marketSignals?.growthStrategy || 'Unknown'}

Rate the market fit on multiple dimensions and provide evidence.`;

  const userPrompt = `Analyze market fit for ${state.thesis.company} in the ${marketContext.targetCustomerSize} segment.

Use this evidence:
${evidence.filter(e => 
  e.content.toLowerCase().includes('customer') ||
  e.content.toLowerCase().includes('user') ||
  e.content.toLowerCase().includes('integration') ||
  e.content.toLowerCase().includes('pricing')
).slice(0, 5).map(e => `- ${e.content.substring(0, 150)}...`).join('\n')}`;

  try {
    const response = await claudeModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse market fit JSON');
    }
    
    const sectionData = JSON.parse(jsonMatch[0]);

    return {
      section: {
        id: 'market_fit',
        pillarId: 'market-position',
        title: `${marketContext.targetCustomerSize} Market Fit Analysis`,
        content: sectionData.content,
        score: calculateMarketFitScore(marketSignals, marketContext),
        weight: 0.20, // High weight for market fit
        keyFindings: sectionData.keyFindings,
        risks: sectionData.risks || [],
        opportunities: sectionData.opportunities || [],
        metadata: {
          fitDimensions: sectionData.fitDimensions,
          competitivePosition: sectionData.competitivePosition,
        },
      },
      citations: [],
    };
  } catch (error) {
    console.error('Error generating market fit analysis:', error);
    return generateFallbackSection('Market Fit Analysis');
  }
}

async function generateMarketPositionSection(
  state: ResearchState,
  marketEvidence: any[],
  marketContext: MarketContext,
  marketSignals: any
): Promise<{ section: ReportSection; citations: Citation[] }> {
  const systemPrompt = `Analyze ${state.thesis.company}'s position in the ${marketContext.targetCustomerSize} market.

Context:
- Market Leader: ${marketContext.competitiveContext.marketLeader} (${marketContext.competitiveContext.marketLeaderShare}%)
- Typical Features: ${marketContext.competitiveContext.typicalFeatures.join(', ')}

Assess:
1. Market share and growth trajectory
2. Competitive differentiation for ${marketContext.targetCustomerSize}
3. Network effects and switching costs
4. Path to market leadership or profitable niche`;

  try {
    const response = await claudeModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Analyze market position using: ${marketEvidence.length} evidence pieces`),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const sectionData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      section: {
        id: 'market_analysis',
        pillarId: 'market-position',
        title: 'Market Position Analysis',
        content: sectionData.content || 'Market analysis pending',
        score: 70,
        weight: getMarketAdjustedWeight('Market Analysis', marketContext),
        keyFindings: sectionData.keyFindings || [],
        risks: sectionData.risks || [],
        opportunities: sectionData.opportunities || [],
      },
      citations: [],
    };
  } catch (error) {
    return generateFallbackSection('Market Analysis');
  }
}

async function generateMarketAwareRiskSection(
  state: ResearchState,
  evidence: any[],
  marketContext: MarketContext,
  marketSignals: any
): Promise<{ section: ReportSection; citations: Citation[] }> {
  const marketSpecificRisks = getMarketSpecificRisks(marketContext);
  
  const systemPrompt = `Identify risks specific to ${state.thesis.company} serving the ${marketContext.targetCustomerSize} market.

Market-Specific Risk Categories:
${marketSpecificRisks.join('\n')}

Also consider:
- Risks if they try to move up/down market
- Technology risks relative to market needs
- Competitive risks from ${marketContext.competitiveContext.marketLeader}`;

  try {
    const response = await claudeModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Analyze risks using ${evidence.length} evidence pieces`),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const sectionData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      section: {
        id: 'risk_assessment',
        pillarId: 'risks',
        title: `Risk Assessment: ${marketContext.targetCustomerSize} Market`,
        content: sectionData.content || 'Risk assessment pending',
        score: 60,
        weight: 0.15,
        keyFindings: sectionData.keyFindings || [],
        risks: sectionData.risks || marketSpecificRisks,
        opportunities: sectionData.opportunities || [],
      },
      citations: [],
    };
  } catch (error) {
    return generateFallbackSection('Risk Assessment');
  }
}

async function generateMarketAwareRecommendation(
  state: ResearchState,
  reportSections: Record<string, ReportSection>,
  marketContext: MarketContext,
  marketSignals: any
): Promise<{ section: ReportSection; citations: Citation[] }> {
  const systemPrompt = `Generate investment recommendation for ${state.thesis.company} as a ${marketContext.targetCustomerSize} play.

Market Context:
- Target: ${marketContext.targetCustomerSize} (${marketSignals?.customerCount || 'Unknown'} customers)
- Retention: ${marketSignals?.retentionRate || 'Unknown'}%
- Market Leader: ${marketContext.competitiveContext.marketLeader}

Consider:
1. Is this a good ${marketContext.targetCustomerSize} investment?
2. Can they defend/grow in this market?
3. Are the unit economics right for ${marketContext.targetCustomerSize}?
4. Is the technology appropriate (not over/under-built)?

Sections to synthesize:
${Object.values(reportSections).map(s => 
  `- ${s.title}: Score ${s.score}/100`
).join('\n')}`;

  try {
    const response = await o3ProModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage('Generate market-contextualized recommendation'),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const recommendation = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const investmentScore = calculateOverallMarketScore(reportSections, marketContext);

    return {
      section: {
        id: 'recommendation',
        pillarId: 'summary',
        title: 'Investment Recommendation',
        content: formatMarketAwareRecommendation(recommendation, marketContext, investmentScore),
        score: investmentScore,
        weight: 1.0,
        keyFindings: recommendation.keyReasons?.map((r: any) => r.factor) || [],
        risks: recommendation.risks || [],
        opportunities: recommendation.opportunities || [],
      },
      citations: [],
    };
  } catch (error) {
    return generateFallbackSection('Investment Recommendation');
  }
}

// Helper functions

function calculateMarketAwareScore(sectionData: any, marketContext: MarketContext): number {
  const baseScore = sectionData.supportingData?.reduce(
    (sum: number, item: any) => sum + (item.confidence || 0.5),
    0
  ) / (sectionData.supportingData?.length || 1) * 100;
  
  // Adjust score based on market appropriateness
  const marketBonus = sectionData.marketSpecificInsights?.length ? 10 : 0;
  
  return Math.min(100, Math.round(baseScore + marketBonus));
}

function getMarketAdjustedWeight(sectionName: string, marketContext: MarketContext): number {
  const weightMap: Record<string, Record<string, number>> = {
    SMB: {
      'Technology Assessment': 0.15,  // Less important
      'Market Analysis': 0.25,
      'Financial Review': 0.35,      // More important
      'Risk Assessment': 0.25,
    },
    Enterprise: {
      'Technology Assessment': 0.30,  // More important
      'Market Analysis': 0.25,
      'Financial Review': 0.20,
      'Risk Assessment': 0.25,
    },
    Developer: {
      'Technology Assessment': 0.40,  // Critical
      'Market Analysis': 0.20,
      'Financial Review': 0.15,
      'Risk Assessment': 0.25,
    },
  };
  
  const defaultWeights: Record<string, number> = {
    'Executive Summary': 0.15,
    'Technology Assessment': 0.25,
    'Market Analysis': 0.25,
    'Financial Review': 0.20,
    'Risk Assessment': 0.15,
  };
  
  return weightMap[marketContext.targetCustomerSize]?.[sectionName] || 
    defaultWeights[sectionName] || 0.1;
}

function calculateMarketFitScore(marketSignals: any, marketContext: MarketContext): number {
  let score = 50; // Base score
  
  // Retention rate is a strong signal
  if (marketSignals?.retentionRate) {
    if (marketSignals.retentionRate > 90) score += 20;
    else if (marketSignals.retentionRate > 80) score += 10;
    else if (marketSignals.retentionRate < 70) score -= 10;
  }
  
  // Customer growth
  if (marketSignals?.customerCount) {
    const expectedCustomers = getExpectedCustomerCount(marketContext);
    if (marketSignals.customerCount > expectedCustomers) score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

function getExpectedCustomerCount(marketContext: MarketContext): number {
  const expectations: Record<string, number> = {
    SMB: 10000,      // Many small customers
    'Mid-Market': 1000,
    Enterprise: 100,  // Fewer large customers
    Developer: 50000, // Many individual devs
    Consumer: 100000,
  };
  
  return expectations[marketContext.targetCustomerSize] || 1000;
}

function getMarketSpecificRisks(marketContext: MarketContext): string[] {
  const risks: Record<string, string[]> = {
    SMB: [
      'High customer acquisition costs relative to contract value',
      'Integration partner dependencies',
      'Limited ability to raise prices',
      'Vulnerability to economic downturns',
    ],
    Enterprise: [
      'Long sales cycles',
      'Complex procurement processes',
      'High support costs',
      'Competitor lock-in',
    ],
    Developer: [
      'Open source competition',
      'High technical support needs',
      'Community management costs',
      'Rapid technology changes',
    ],
  };
  
  return risks[marketContext.targetCustomerSize] || ['General market risks'];
}

function formatMarketAwareRecommendation(
  recommendation: any,
  marketContext: MarketContext,
  score: number
): string {
  const marketAssessment = score > 70 
    ? `Strong fit for ${marketContext.targetCustomerSize} market`
    : score > 50
    ? `Moderate fit for ${marketContext.targetCustomerSize} market`
    : `Weak fit for ${marketContext.targetCustomerSize} market`;

  return `
## Recommendation: ${recommendation.recommendation || (score > 60 ? 'INVEST' : 'PASS')}
**Market Fit Assessment:** ${marketAssessment}
**Overall Score:** ${score}/100

### ${marketContext.targetCustomerSize} Market Considerations
${recommendation.marketConsiderations?.join('\n') || 
  `- Appropriately positioned for ${marketContext.targetCustomerSize} buyers
- Technology complexity matches market needs
- Pricing aligns with ${marketContext.targetCustomerSize} budgets`}

### Investment Thesis
${recommendation.thesis || 
  `${score > 60 ? 'Compelling' : 'Challenging'} opportunity in the ${marketContext.targetCustomerSize} segment.`}

### Key Success Factors
${recommendation.keyFactors?.join('\n') || 
  `- Maintain focus on ${marketContext.targetCustomerSize} needs
- Defend against ${marketContext.competitiveContext.marketLeader}
- Optimize unit economics for market segment`}
  `.trim();
}

function calculateOverallMarketScore(
  sections: Record<string, ReportSection>,
  marketContext: MarketContext
): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.values(sections).forEach(section => {
    if (section.id !== 'recommendation') {
      const adjustedWeight = getMarketAdjustedWeight(section.title, marketContext);
      totalScore += section.score * adjustedWeight;
      totalWeight += adjustedWeight;
    }
  });
  
  return Math.round(totalScore / totalWeight);
}

function getPillarIdForSection(sectionName: string): string {
  const mapping: Record<string, string> = {
    'Executive Summary': 'summary',
    'Technology Assessment': 'tech-architecture',
    'Market Analysis': 'market-position',
    'Financial Review': 'financial-health',
    'Risk Assessment': 'risks',
    'Market Fit Analysis': 'market-position',
  };
  return mapping[sectionName] || 'general';
}

function generateFallbackSection(sectionName: string): { section: ReportSection; citations: Citation[] } {
  return {
    section: {
      id: sectionName.toLowerCase().replace(/\s+/g, '_'),
      pillarId: getPillarIdForSection(sectionName),
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

function generateStandardReport(state: ResearchState): Partial<ResearchState> {
  console.warn('Falling back to standard report generation');
  return {
    reportSections: {
      'fallback': {
        id: 'fallback',
        pillarId: 'general',
        title: 'Report Generation Failed',
        content: 'Market context not available',
        score: 0,
        weight: 1,
        keyFindings: [],
        risks: [],
        opportunities: [],
      },
    },
    citations: [],
    status: 'failed',
  };
}

