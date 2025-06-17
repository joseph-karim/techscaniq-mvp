import { ResearchState, ReportSection, Citation } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { 
  getReportFormat, 
  generateSectionPrompt, 
  validateReportCompleteness,
  SALES_INTELLIGENCE_FORMAT,
  PE_DUE_DILIGENCE_FORMAT
} from '../../prompts/report-formats';

// Use Claude Opus 4 for report generation
const claudeModel = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.2,
  maxTokens: 8192,
});

// Use o3-pro for investment recommendations (PE format only)
const o3ProModel = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: models.openai.o3Pro,
  temperature: 0.1,
});

export async function generateReportFormatAwareNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📝 Generating format-aware report...');
  
  try {
    const { thesis, evidence, qualityScores, metadata } = state;
    
    // Determine report format
    const reportFormat = getReportFormat({
      type: metadata?.reportType as any,
      thesis,
      metadata
    });
    
    console.log(`📊 Using ${reportFormat.type} report format`);
    
    // Filter high-quality evidence
    const highQualityEvidence = evidence.filter(e => 
      qualityScores && qualityScores[e.id] >= 0.7
    ).sort((a, b) => (qualityScores?.[b.id] || 0) - (qualityScores?.[a.id] || 0));
    
    console.log(`Using ${highQualityEvidence.length} high-quality evidence pieces`);
    
    // Generate report sections based on format
    const sections: Record<string, ReportSection> = {};
    const allCitations: Citation[] = [];
    
    // Generate each section defined in the format
    for (const sectionConfig of reportFormat.sections) {
      console.log(`Generating ${sectionConfig.title}...`);
      
      const sectionResult = await generateFormattedSection(
        sectionConfig,
        reportFormat,
        state,
        highQualityEvidence
      );
      
      sections[sectionConfig.id] = sectionResult.section;
      allCitations.push(...sectionResult.citations);
    }
    
    // For PE format, add investment recommendation
    if (reportFormat.type === 'pe-due-diligence') {
      const recommendation = await generateInvestmentRecommendation(state, sections);
      sections['investment_recommendation'] = recommendation.section;
      allCitations.push(...recommendation.citations);
    }
    
    // Validate report completeness
    const validation = validateReportCompleteness(sections, reportFormat);
    
    console.log(`✅ Report generated:`);
    console.log(`   Format: ${reportFormat.type}`);
    console.log(`   Sections: ${Object.keys(sections).length}`);
    console.log(`   Citations: ${allCitations.length}`);
    console.log(`   Completeness: ${(validation.coverage * 100).toFixed(0)}%`);
    if (!validation.isComplete) {
      console.log(`   Missing sections: ${validation.missingSections.join(', ')}`);
    }
    
    return {
      reportSections: sections,
      citations: allCitations,
      status: 'complete',
      metadata: {
        ...state.metadata,
        reportGeneratedAt: new Date(),
        reportFormat: reportFormat.type,
        reportStats: {
          sections: Object.keys(sections).length,
          totalCitations: allCitations.length,
          evidenceUsed: highQualityEvidence.length,
          completeness: validation.coverage,
          missingRequiredSections: validation.missingSections,
        },
      },
    };
    
  } catch (error) {
    console.error('❌ Format-aware report generation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'generate_report_format_aware',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

async function generateFormattedSection(
  sectionConfig: any,
  reportFormat: any,
  state: ResearchState,
  relevantEvidence: any[]
): Promise<{ section: ReportSection; citations: Citation[] }> {
  try {
    // Create section-specific prompt
    const sectionPrompt = generateSectionPrompt(sectionConfig, reportFormat, state);
    
    // System prompt based on report type
    const systemPrompt = reportFormat.type === 'sales-intelligence'
      ? getSalesIntelligenceSystemPrompt()
      : getPEDueDiligenceSystemPrompt();
    
    // Filter evidence relevant to this section
    const sectionEvidence = filterEvidenceForSection(
      relevantEvidence, 
      sectionConfig,
      reportFormat.type
    );
    
    const userPrompt = `
Company: ${state.thesis.company}
Website: ${(state.thesis as any).website || (state.thesis as any).companyWebsite}

${sectionPrompt}

Use the following evidence to support your analysis:
${formatEvidenceForSection(sectionEvidence).substring(0, 15000)}

Output JSON format:
{
  "content": "Main section content in markdown format",
  "keyFindings": ["finding1", "finding2", ...],
  "subsections": {
    "subsection_name": "content for subsection"
  },
  "metrics": {
    "metric_name": {
      "value": "value",
      "source": "evidence source",
      "confidence": 0.0-1.0
    }
  },
  "actionItems": ["action1", "action2"], // For sales intelligence
  "risks": ["risk1", "risk2"], // For PE due diligence
  "opportunities": ["opportunity1", "opportunity2"],
  "supportingData": [
    {
      "dataPoint": "specific fact or metric",
      "source": "source name",
      "relevance": "why this matters",
      "confidence": 0.0-1.0
    }
  ],
  "citations": [
    {
      "text": "quoted text",
      "source": "source name",
      "url": "source url"
    }
  ]
}`;

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
    const citations: Citation[] = (sectionData.citations || []).map((c: any) => ({
      id: uuidv4(),
      evidenceId: uuidv4(),
      reportSectionId: sectionConfig.id,
      quote: c.text,
      context: `${c.source} - ${sectionConfig.title}`,
      createdAt: new Date(),
    }));

    // Build section content with subsections
    let fullContent = sectionData.content + '\n\n';
    
    if (sectionData.subsections && Object.keys(sectionData.subsections).length > 0) {
      Object.entries(sectionData.subsections).forEach(([title, content]) => {
        fullContent += `### ${title}\n\n${content}\n\n`;
      });
    }
    
    // Add metrics if present
    if (sectionData.metrics && Object.keys(sectionData.metrics).length > 0) {
      fullContent += '\n### Key Metrics\n\n';
      Object.entries(sectionData.metrics).forEach(([name, metric]: [string, any]) => {
        fullContent += `- **${name}**: ${metric.value} (${metric.source}, Confidence: ${(metric.confidence * 100).toFixed(0)}%)\n`;
      });
      fullContent += '\n';
    }

    return {
      section: {
        id: sectionConfig.id,
        pillarId: mapSectionToPillar(sectionConfig.id, reportFormat.type),
        title: sectionConfig.title,
        content: fullContent,
        score: calculateSectionScore(sectionData),
        weight: sectionConfig.weight,
        keyFindings: sectionData.keyFindings || [],
        risks: sectionData.risks || [],
        opportunities: sectionData.opportunities || [],
        metadata: {
          subsections: sectionData.subsections,
          metrics: sectionData.metrics,
          actionItems: sectionData.actionItems,
          supportingDataCount: sectionData.supportingData?.length || 0,
        },
      },
      citations,
    };
  } catch (error) {
    console.error(`Error generating ${sectionConfig.title}:`, error);
    return {
      section: {
        id: sectionConfig.id,
        pillarId: 'general',
        title: sectionConfig.title,
        content: `${sectionConfig.title} generation failed.`,
        score: 0,
        weight: sectionConfig.weight,
        keyFindings: [],
        risks: [],
        opportunities: [],
      },
      citations: [],
    };
  }
}

function getSalesIntelligenceSystemPrompt(): string {
  return `You are an expert Sales Intelligence Analyst creating actionable insights for enterprise sales teams.

Your expertise includes:
- Technology landscape analysis and vendor ecosystems
- Identifying buying signals and budget indicators
- Stakeholder mapping and decision-making processes
- Competitive intelligence and displacement opportunities
- Creating compelling value propositions

Focus on:
- Actionable insights that help close deals
- Specific pain points and technology gaps
- Decision maker priorities and initiatives
- Timing signals and budget cycles
- Competitive vulnerabilities

Avoid generic observations. Every insight should help a salesperson engage more effectively.`;
}

function getPEDueDiligenceSystemPrompt(): string {
  return `You are a Senior Investment Analyst at a top-tier private equity firm specializing in technology due diligence.

Your expertise includes:
- Deep technical architecture evaluation
- Market sizing and competitive analysis
- Financial modeling and unit economics
- Risk assessment and mitigation strategies
- Value creation and exit planning

Focus on:
- Investment-grade analysis with quantitative support
- Risk-adjusted returns and downside scenarios
- Scalability constraints and growth vectors
- Competitive moats and defensibility
- Clear go/no-go recommendations

Maintain objectivity and highlight both opportunities and risks.`;
}

function filterEvidenceForSection(
  evidence: any[],
  sectionConfig: any,
  reportType: string
): any[] {
  // Map sections to relevant evidence types
  const sectionEvidenceMap: Record<string, string[]> = {
    // Sales Intelligence sections
    'technology_landscape': ['tech', 'api', 'integration', 'stack', 'infrastructure'],
    'business_priorities': ['strategy', 'initiative', 'transformation', 'priority', 'goal'],
    'buying_signals': ['budget', 'rfp', 'vendor', 'contract', 'procurement', 'pain'],
    'stakeholder_analysis': ['executive', 'cto', 'cio', 'leadership', 'team'],
    'competitive_intelligence': ['competitor', 'vendor', 'partner', 'switch', 'migration'],
    
    // PE Due Diligence sections
    'technology_assessment': ['architecture', 'scalability', 'performance', 'security', 'tech'],
    'market_analysis': ['market', 'tam', 'competition', 'growth', 'industry'],
    'financial_analysis': ['revenue', 'margin', 'cost', 'ltv', 'cac', 'financial'],
    'risk_assessment': ['risk', 'threat', 'vulnerability', 'compliance', 'security'],
    'value_creation': ['opportunity', 'improvement', 'efficiency', 'expansion', 'acquisition'],
  };
  
  const keywords = sectionEvidenceMap[sectionConfig.id] || [];
  
  return evidence.filter(e => {
    const content = e.content.toLowerCase();
    return keywords.some(keyword => content.includes(keyword));
  }).slice(0, 20); // Limit to top 20 pieces
}

function formatEvidenceForSection(evidence: any[]): string {
  return evidence.map((e, idx) => `
Evidence ${idx + 1}:
Source: ${e.source.name}
Type: ${e.source.type}
Content: ${e.content.substring(0, 500)}...
Quality Score: ${(e.qualityScore.overall * 100).toFixed(0)}%
`).join('\n---\n');
}

function mapSectionToPillar(sectionId: string, reportType: string): string {
  const mappings: Record<string, string> = {
    // Sales Intelligence
    'technology_landscape': 'tech-architecture',
    'business_priorities': 'market-position',
    'buying_signals': 'market-position',
    'stakeholder_analysis': 'team-leadership',
    'competitive_intelligence': 'market-position',
    
    // PE Due Diligence
    'technology_assessment': 'tech-architecture',
    'market_analysis': 'market-position',
    'financial_analysis': 'financial-health',
    'risk_assessment': 'risks',
    'value_creation': 'growth-strategy',
  };
  
  return mappings[sectionId] || 'general';
}

function calculateSectionScore(sectionData: any): number {
  let score = 50; // Base score
  
  // Increase score based on content quality indicators
  if (sectionData.keyFindings?.length > 3) score += 10;
  if (sectionData.metrics && Object.keys(sectionData.metrics).length > 2) score += 15;
  if (sectionData.supportingData?.length > 5) score += 10;
  if (sectionData.citations?.length > 3) score += 10;
  
  // Confidence adjustment
  if (sectionData.supportingData?.length > 0) {
    const avgConfidence = sectionData.supportingData.reduce(
      (sum: number, item: any) => sum + (item.confidence || 0.5),
      0
    ) / sectionData.supportingData.length;
    score = score * (0.5 + avgConfidence * 0.5);
  }
  
  return Math.min(100, Math.round(score));
}

async function generateInvestmentRecommendation(
  state: ResearchState,
  reportSections: Record<string, ReportSection>
): Promise<{ section: ReportSection; citations: Citation[] }> {
  try {
    const systemPrompt = `You are the Managing Partner at a top PE firm making the final investment decision.
    
Synthesize all analysis into a clear, actionable recommendation with:
- STRONG BUY: Exceptional opportunity, move fast
- BUY: Good opportunity with manageable risks
- HOLD: Needs more diligence or better terms
- PASS: Risks outweigh potential returns

Be decisive but balanced. Quantify your confidence level.`;

    const sectionSummaries = Object.values(reportSections)
      .map(s => `${s.title} (Score: ${s.score}/100):\n${s.keyFindings.join('\n')}`)
      .join('\n\n');

    const userPrompt = `Based on comprehensive due diligence of ${state.thesis.company}:

${sectionSummaries}

Provide investment recommendation in JSON:
{
  "recommendation": "STRONG_BUY|BUY|HOLD|PASS",
  "confidence": 0.0-1.0,
  "thesisValidation": "how well does evidence support investment thesis",
  "keyDrivers": ["top 3-5 factors driving recommendation"],
  "criticalRisks": ["top 3 risks that could derail investment"],
  "dealTerms": {
    "suggestedValuation": "range or multiple",
    "keyTerms": ["important deal terms"],
    "conditions": ["conditions precedent"]
  },
  "valueCreationPlan": {
    "immediate": ["0-6 month priorities"],
    "shortTerm": ["6-18 month initiatives"],
    "longTerm": ["18+ month goals"]
  },
  "exitScenarios": [
    {
      "type": "IPO|Strategic|Sponsor",
      "timeline": "years",
      "multiple": "expected return multiple"
    }
  ]
}`;

    const response = await o3ProModel.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const recommendation = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const formattedContent = formatInvestmentRecommendation(recommendation);

    return {
      section: {
        id: 'investment_recommendation',
        pillarId: 'summary',
        title: 'Investment Recommendation',
        content: formattedContent,
        score: recommendation.confidence ? recommendation.confidence * 100 : 50,
        weight: 1.0,
        keyFindings: recommendation.keyDrivers || [],
        risks: recommendation.criticalRisks || [],
        opportunities: recommendation.valueCreationPlan?.immediate || [],
        metadata: recommendation,
      },
      citations: [],
    };
  } catch (error) {
    console.error('Error generating investment recommendation:', error);
    return {
      section: {
        id: 'investment_recommendation',
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

function formatInvestmentRecommendation(rec: any): string {
  return `
# Investment Recommendation: ${rec.recommendation || 'PENDING'}

**Confidence Level:** ${((rec.confidence || 0.5) * 100).toFixed(0)}%

## Investment Thesis Validation
${rec.thesisValidation || 'Pending validation'}

## Key Investment Drivers
${(rec.keyDrivers || []).map((d: string) => `- ${d}`).join('\n')}

## Critical Risks
${(rec.criticalRisks || []).map((r: string) => `- ${r}`).join('\n')}

## Recommended Deal Terms
**Valuation Range:** ${rec.dealTerms?.suggestedValuation || 'TBD'}

**Key Terms:**
${(rec.dealTerms?.keyTerms || []).map((t: string) => `- ${t}`).join('\n')}

**Conditions Precedent:**
${(rec.dealTerms?.conditions || []).map((c: string) => `- ${c}`).join('\n')}

## Value Creation Roadmap

### Immediate (0-6 months)
${(rec.valueCreationPlan?.immediate || []).map((i: string) => `- ${i}`).join('\n')}

### Short-term (6-18 months)
${(rec.valueCreationPlan?.shortTerm || []).map((s: string) => `- ${s}`).join('\n')}

### Long-term (18+ months)
${(rec.valueCreationPlan?.longTerm || []).map((l: string) => `- ${l}`).join('\n')}

## Exit Scenarios
${(rec.exitScenarios || []).map((e: any) => 
  `- **${e.type}** in ${e.timeline} targeting ${e.multiple} return`
).join('\n')}
`.trim();
}