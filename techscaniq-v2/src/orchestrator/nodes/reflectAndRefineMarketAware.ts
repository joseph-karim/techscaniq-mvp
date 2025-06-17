import { ResearchState, ResearchQuestion, ThesisPillar, MarketContext } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models, thresholds } from '../../config';
import { v4 as uuidv4 } from 'uuid';

// Use Claude Opus 4 for orchestration
const model = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.3,
  maxTokens: 8192,
});

export async function reflectAndRefineMarketAwareNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('🔍 Reflecting on evidence with market context and identifying gaps...');
  
  try {
    const { thesis, evidence, qualityScores, iterationCount, metadata } = state;
    const marketContext = metadata?.marketContext as MarketContext;
    const marketSignals = metadata?.marketSignals;
    
    if (!marketContext) {
      console.warn('No market context found, using standard reflection');
      // Fallback to standard reflection logic
      return reflectWithoutMarketContext(state);
    }
    
    console.log(`📊 Reflecting with market context: ${marketContext.targetCustomerSize}`);
    
    // Analyze evidence coverage and quality by pillar
    const pillarAnalysis = analyzePillarCoverageWithMarketContext(
      thesis, 
      evidence, 
      qualityScores || {},
      marketContext
    );
    
    // Create market-aware reflection prompt
    const reflectionPrompt = `
Analyze the research progress for ${thesis.company} in the context of their ${marketContext.targetCustomerSize} market.

Market Context:
- Target Customers: ${marketContext.targetCustomerSize}
- Primary Buyers: ${marketContext.primaryBuyers.join(', ')}
- Technical Sophistication: ${marketContext.technicalSophistication}
- Market Leader: ${marketContext.competitiveContext.marketLeader} (${marketContext.competitiveContext.marketLeaderShare}%)
- Customer Count: ${marketSignals?.customerCount || 'Unknown'}
- Retention Rate: ${marketSignals?.retentionRate || 'Unknown'}%

Current Evidence: ${evidence.length} pieces collected
Quality: ${Object.values(qualityScores || {}).length} pieces scored
Pillars: ${thesis.pillars.map(p => p.name).join(', ')}

CRITICAL: Identify gaps that are RELEVANT to their ${marketContext.targetCustomerSize} market.
For example:
- If SMB market: Integration with QuickBooks matters more than API rate limits
- If Developer market: GitHub presence and SDK quality are critical
- If Enterprise: Compliance certifications and SLAs are key

Return ONLY a JSON object:
{
  "gaps": [
    {
      "pillarId": "pillar-id",
      "type": "missing_data",
      "description": "Gap description relevant to ${marketContext.targetCustomerSize} market",
      "importance": "critical|high|medium",
      "marketRelevance": "Why this matters for ${marketContext.targetCustomerSize}",
      "suggestedQueries": ["query1", "query2"]
    }
  ],
  "marketSpecificInsights": [
    "Insight about fit for ${marketContext.targetCustomerSize} market"
  ],
  "refinements": {
    "focusAreas": ["area1 relevant to ${marketContext.targetCustomerSize}", "area2"],
    "adjustments": ["adjustment1"]
  },
  "recommendNextIteration": ${iterationCount < 2}
}`;

    const response = await model.invoke([
      new SystemMessage("You are an investment analyst with deep understanding of different market segments. Return only valid JSON."),
      new HumanMessage(reflectionPrompt),
    ]);

    // Parse response
    let reflectionAnalysis;
    try {
      const content = response.content.toString();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reflectionAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      reflectionAnalysis = generateDefaultMarketAwareReflection(thesis, marketContext, iterationCount);
    }
    
    // Generate refined queries based on market-relevant gaps
    const refinedQueries = await generateMarketAwareRefinedQueries(
      thesis,
      reflectionAnalysis.gaps,
      evidence,
      marketContext
    );
    
    console.log(`📋 Market-aware reflection complete:`);
    console.log(`   Market: ${marketContext.targetCustomerSize}`);
    console.log(`   Iteration: ${iterationCount + 1}/${state.maxIterations}`);
    console.log(`   Evidence collected: ${evidence.length}`);
    console.log(`   Market-relevant gaps: ${reflectionAnalysis.gaps.filter((g: any) => g.importance === 'critical').length} critical`);
    console.log(`   Market insights: ${reflectionAnalysis.marketSpecificInsights?.length || 0}`);
    
    return {
      iterationCount: iterationCount + 1,
      metadata: {
        ...state.metadata,
        currentQueries: refinedQueries,
        gaps: reflectionAnalysis.gaps,
        marketSpecificInsights: reflectionAnalysis.marketSpecificInsights,
        // Store refinements in existing structure
        researchPriorities: reflectionAnalysis.refinements,
        pillarAnalysis: pillarAnalysis,
        lastReflection: new Date(),
      },
    };
    
  } catch (error) {
    console.error('❌ Market-aware reflection failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'reflect_and_refine_market_aware',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}

function analyzePillarCoverageWithMarketContext(
  thesis: any,
  evidence: any[],
  qualityScores: Record<string, number>,
  marketContext: MarketContext
): Record<string, any> {
  const analysis: Record<string, any> = {};
  
  // Define market-specific importance weights
  const marketPillarWeights = getMarketSpecificPillarWeights(marketContext);
  
  thesis.pillars.forEach((pillar: ThesisPillar) => {
    const pillarEvidence = evidence.filter(e => e.pillarId === pillar.id);
    const highQualityEvidence = pillarEvidence.filter(e => 
      qualityScores[e.id] >= thresholds.minEvidenceQuality
    );
    
    // Adjust weight based on market context
    const marketAdjustedWeight = marketPillarWeights[pillar.name] || pillar.weight;
    
    analysis[pillar.id] = {
      name: pillar.name,
      originalWeight: pillar.weight,
      marketAdjustedWeight,
      totalEvidence: pillarEvidence.length,
      highQualityEvidence: highQualityEvidence.length,
      averageQuality: pillarEvidence.length > 0
        ? pillarEvidence.reduce((sum, e) => sum + (qualityScores[e.id] || 0), 0) / pillarEvidence.length
        : 0,
      coverage: calculateMarketAwareCoverage(pillar, pillarEvidence, marketContext),
      marketRelevance: assessPillarMarketRelevance(pillar, marketContext),
      needsMoreEvidence: highQualityEvidence.length < thresholds.minEvidencePerPillar,
    };
  });
  
  return analysis;
}

function getMarketSpecificPillarWeights(marketContext: MarketContext): Record<string, number> {
  const weights: Record<string, Record<string, number>> = {
    SMB: {
      'Financial Health': 0.35,  // Critical for SMBs
      'Market Position': 0.20,   // Less critical - niche ok
      'Technology Architecture': 0.15,  // Low - just needs to work
      'Team & Leadership': 0.20,  // Important for stability
      'Growth Strategy': 0.10,    // Lower - organic growth ok
    },
    'Mid-Market': {
      'Financial Health': 0.25,
      'Market Position': 0.25,
      'Technology Architecture': 0.20,
      'Team & Leadership': 0.20,
      'Growth Strategy': 0.10,
    },
    Enterprise: {
      'Financial Health': 0.20,
      'Market Position': 0.30,    // Critical - must be leader
      'Technology Architecture': 0.25,  // High - needs scale
      'Team & Leadership': 0.15,
      'Growth Strategy': 0.10,
    },
    Developer: {
      'Financial Health': 0.15,
      'Market Position': 0.20,
      'Technology Architecture': 0.35,  // Critical for devs
      'Team & Leadership': 0.20,    // Dev credibility matters
      'Growth Strategy': 0.10,
    },
    Consumer: {
      'Financial Health': 0.20,
      'Market Position': 0.30,
      'Technology Architecture': 0.20,
      'Team & Leadership': 0.15,
      'Growth Strategy': 0.15,
    },
  };
  
  return weights[marketContext.targetCustomerSize] || {};
}

function calculateMarketAwareCoverage(
  pillar: ThesisPillar, 
  evidence: any[],
  marketContext: MarketContext
): number {
  // Define market-specific keywords that matter
  const marketKeywords = getMarketSpecificKeywords(marketContext, pillar.name);
  const keywordsCovered = new Set<string>();
  
  evidence.forEach(e => {
    const content = e.content.toLowerCase();
    marketKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        keywordsCovered.add(keyword);
      }
    });
  });
  
  return marketKeywords.length > 0 ? keywordsCovered.size / marketKeywords.length : 0;
}

function getMarketSpecificKeywords(marketContext: MarketContext, pillarName: string): string[] {
  const keywordMap: Record<string, Record<string, string[]>> = {
    SMB: {
      'Technology Architecture': ['quickbooks', 'integration', 'simple', 'reliable', 'uptime'],
      'Market Position': ['small business', 'smb', 'local', 'accountant', 'bookkeeper'],
      'Financial Health': ['profitable', 'cash flow', 'sustainable', 'margins'],
    },
    Enterprise: {
      'Technology Architecture': ['api', 'scalability', 'enterprise', 'sla', 'security', 'compliance'],
      'Market Position': ['fortune 500', 'enterprise', 'global', 'market leader'],
      'Financial Health': ['revenue growth', 'enterprise deals', 'contract value'],
    },
    Developer: {
      'Technology Architecture': ['api', 'sdk', 'github', 'documentation', 'developer experience'],
      'Market Position': ['developer adoption', 'github stars', 'community', 'ecosystem'],
      'Financial Health': ['usage growth', 'developer seats', 'api calls'],
    },
  };
  
  return keywordMap[marketContext.targetCustomerSize]?.[pillarName] || [];
}

function assessPillarMarketRelevance(pillar: ThesisPillar, marketContext: MarketContext): string {
  const relevanceMap: Record<string, Record<string, string>> = {
    SMB: {
      'Technology Architecture': 'Stability and ease of use matter more than cutting-edge tech',
      'Market Position': 'Niche leadership can be valuable in SMB segments',
      'Financial Health': 'Critical - SMBs need vendors who will survive',
    },
    Enterprise: {
      'Technology Architecture': 'Must handle scale, security, and compliance requirements',
      'Market Position': 'Market leadership crucial for enterprise credibility',
      'Financial Health': 'Important but less critical if product is strategic',
    },
    Developer: {
      'Technology Architecture': 'Developer experience and API quality are paramount',
      'Market Position': 'Community adoption matters more than revenue share',
      'Financial Health': 'Less critical if growth and adoption are strong',
    },
  };
  
  return relevanceMap[marketContext.targetCustomerSize]?.[pillar.name] || 
    `Standard importance for ${marketContext.targetCustomerSize} market`;
}

async function generateMarketAwareRefinedQueries(
  thesis: any,
  gaps: any[],
  existingEvidence: any[],
  marketContext: MarketContext
): Promise<Record<string, any[]>> {
  const systemPrompt = `You are an expert at crafting targeted search queries for investment research.
You understand that different markets require different types of evidence.

Market Context for ${thesis.company}:
- Target Market: ${marketContext.targetCustomerSize}
- Buyers: ${marketContext.primaryBuyers.join(', ')}
- Typical Tech Stack: ${marketContext.industryNorms.typicalTechStack.join(', ')}

Generate queries that will find information RELEVANT to ${marketContext.targetCustomerSize} customers.

Examples:
- SMB: "${thesis.company} QuickBooks integration" instead of "${thesis.company} API documentation"
- Enterprise: "${thesis.company} SOC2 compliance" instead of "${thesis.company} ease of use"
- Developer: "${thesis.company} GitHub SDK" instead of "${thesis.company} customer testimonials"

Output format:
{
  "pillar-id": [
    {
      "query": "market-specific search query",
      "type": "web|news|academic|social",
      "priority": "high|medium|low",
      "marketRationale": "why this matters for ${marketContext.targetCustomerSize}"
    }
  ]
}`;

  const gapsSummary = gaps
    .filter(g => g.importance === 'critical' || g.importance === 'high')
    .map(g => `${g.description} (Market relevance: ${g.marketRelevance || 'General'})`)
    .join('\n');

  const userPrompt = `Company: ${thesis.company}
Sector: ${thesis.metadata?.sector || 'Technology'}
Target Market: ${marketContext.targetCustomerSize}

Critical Gaps to Address:
${gapsSummary}

We already have ${existingEvidence.length} pieces of evidence. 
Generate queries specific to the ${marketContext.targetCustomerSize} market needs.`;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content.toString();
    const queriesMatch = content.match(/\{[\s\S]*\}/);
    
    if (!queriesMatch) {
      throw new Error('Failed to parse refined queries');
    }

    return JSON.parse(queriesMatch[0]);
  } catch (error) {
    console.error('Error generating market-aware queries:', error);
    return generateFallbackMarketQueries(gaps, thesis, marketContext);
  }
}

function generateDefaultMarketAwareReflection(
  thesis: any, 
  marketContext: MarketContext, 
  iterationCount: number
): any {
  const marketSpecificGaps = getDefaultMarketGaps(marketContext, thesis);
  
  return {
    gaps: marketSpecificGaps,
    marketSpecificInsights: [
      `${thesis.company} targets ${marketContext.targetCustomerSize} market with ${marketContext.technicalSophistication} technical requirements`,
      `Key competitors in this space: ${marketContext.competitiveContext.marketLeader}`,
    ],
    refinements: {
      focusAreas: getMarketFocusAreas(marketContext),
      adjustments: ['Prioritize market-specific evidence collection'],
    },
    recommendNextIteration: iterationCount < 2,
  };
}

function getDefaultMarketGaps(marketContext: MarketContext, thesis: any): any[] {
  const gapTemplates: Record<string, any[]> = {
    SMB: [
      {
        type: 'missing_data',
        description: 'Integration quality with SMB tools',
        importance: 'critical',
        marketRelevance: 'SMBs rely heavily on tool integrations',
        suggestedQueries: [`${thesis.company} QuickBooks integration reviews`],
      },
      {
        type: 'missing_data',
        description: 'Ease of use for non-technical users',
        importance: 'high',
        marketRelevance: 'SMB users often lack technical expertise',
        suggestedQueries: [`${thesis.company} user reviews ease of use`],
      },
    ],
    Enterprise: [
      {
        type: 'missing_data',
        description: 'Enterprise security certifications',
        importance: 'critical',
        marketRelevance: 'Enterprise requires compliance',
        suggestedQueries: [`${thesis.company} SOC2 ISO27001 compliance`],
      },
      {
        type: 'missing_data',
        description: 'API capabilities and limits',
        importance: 'high',
        marketRelevance: 'Enterprise needs integration flexibility',
        suggestedQueries: [`${thesis.company} API rate limits enterprise`],
      },
    ],
    Developer: [
      {
        type: 'missing_data',
        description: 'SDK quality and maintenance',
        importance: 'critical',
        marketRelevance: 'Developers need reliable SDKs',
        suggestedQueries: [`${thesis.company} GitHub SDK activity`],
      },
      {
        type: 'missing_data',
        description: 'Developer community engagement',
        importance: 'high',
        marketRelevance: 'Community drives developer adoption',
        suggestedQueries: [`${thesis.company} developer community forum`],
      },
    ],
  };
  
  const gaps = gapTemplates[marketContext.targetCustomerSize] || [];
  return gaps.map(gap => ({
    ...gap,
    pillarId: 'market-position',
  }));
}

function getMarketFocusAreas(marketContext: MarketContext): string[] {
  const focusAreas: Record<string, string[]> = {
    SMB: ['Integration ecosystem', 'User experience', 'Support quality', 'Pricing transparency'],
    Enterprise: ['Security compliance', 'Scalability', 'SLA guarantees', 'Professional services'],
    Developer: ['API design', 'Documentation quality', 'SDK maintenance', 'Community support'],
    'Mid-Market': ['Growth flexibility', 'Integration options', 'Support responsiveness'],
    Consumer: ['User experience', 'Mobile capabilities', 'Pricing', 'Social proof'],
  };
  
  return focusAreas[marketContext.targetCustomerSize] || ['General market fit'];
}

function generateFallbackMarketQueries(
  gaps: any[], 
  thesis: any, 
  marketContext: MarketContext
): Record<string, any[]> {
  const fallbackQueries: Record<string, any[]> = {};
  
  // Generate market-specific queries for each gap
  gaps.forEach(gap => {
    if (!fallbackQueries[gap.pillarId]) {
      fallbackQueries[gap.pillarId] = [];
    }
    
    // Add market-specific query variations
    const marketPrefix = getMarketQueryPrefix(marketContext);
    
    fallbackQueries[gap.pillarId].push({
      query: `${thesis.company} ${marketPrefix} ${gap.description}`,
      type: 'web',
      priority: gap.importance === 'critical' ? 'high' : 'medium',
      marketRationale: gap.marketRelevance || 'General market research',
    });
  });
  
  return fallbackQueries;
}

function getMarketQueryPrefix(marketContext: MarketContext): string {
  const prefixes: Record<string, string> = {
    SMB: 'small business',
    Enterprise: 'enterprise',
    Developer: 'developer API',
    'Mid-Market': 'mid-market',
    Consumer: 'consumer',
  };
  
  return prefixes[marketContext.targetCustomerSize] || '';
}

// Fallback function for when market context is not available
function reflectWithoutMarketContext(state: ResearchState): Partial<ResearchState> {
  console.warn('Falling back to standard reflection without market context');
  // Return minimal update to continue the flow
  return {
    iterationCount: state.iterationCount + 1,
    metadata: {
      ...state.metadata,
      lastReflection: new Date(),
      // Note: Market context was not available for this reflection
    },
  };
}