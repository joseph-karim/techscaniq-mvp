import { ResearchState, ResearchQuestion } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { QueryGenerationSchema, parseStructuredOutput } from '../../schemas/structured-outputs';

// Use Claude Opus 4 for orchestration
const model = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.3,
  maxTokens: 8192, // Ensure we get complete responses
});

interface SearchQuery {
  query: string;
  type: 'web' | 'news' | 'academic' | 'financial';
  priority: 'high' | 'medium' | 'low';
  filters?: {
    dateRange?: string;
    domain?: string;
    fileType?: string;
  };
}

export async function generateQueriesNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('🔍 Generating search queries...');
  
  try {
    const { thesis, researchQuestions, metadata } = state;
    const reportType = metadata?.reportType || 'pe-due-diligence';
    
    // Check if we have completed Sonar research
    const hasSonarData = metadata?.sonarStatus === 'completed';
    
    // Determine query generation strategy based on report type and phase
    const queryStrategy = determineQueryStrategy(reportType, hasSonarData);
    
    console.log(`📋 Query Strategy: ${queryStrategy.type} for ${reportType}`);
    console.log(`   Phase: ${queryStrategy.phase}`);
    console.log(`   Focus: ${queryStrategy.focus}`);
    
    // Generate queries based on strategy
    const allQueries: Record<string, any[]> = {};
    
    if (queryStrategy.type === 'sonar-primary') {
      // Generate Sonar-focused queries for initial research
      allQueries['sonar'] = generateSonarQueries(thesis, reportType, queryStrategy);
    } else if (queryStrategy.type === 'lightweight-followup') {
      // Generate lightweight follow-up queries
      allQueries['followup'] = await generateFollowUpQueries(state, queryStrategy);
    } else {
      // Fallback to original pillar-based approach for backward compatibility
      for (const pillar of thesis.pillars) {
        console.log(`   Generating queries for pillar: ${pillar.name}`);
        
        const pillarPrompt = buildPillarPrompt(
          thesis, 
          pillar, 
          reportType,
          queryStrategy.focus
        );

        try {
          const response = await model.invoke([
            new SystemMessage("You are a search query expert. Return only valid JSON."),
            new HumanMessage(pillarPrompt),
          ]);
          
          const content = response.content.toString();
          // Extract JSON array from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const queries = JSON.parse(jsonMatch[0]);
            allQueries[pillar.id] = queries;
          } else {
            console.warn(`   ⚠️ No queries generated for ${pillar.name}`);
            allQueries[pillar.id] = [];
          }
        } catch (pillarError) {
          console.error(`   ❌ Failed to generate queries for ${pillar.name}:`, pillarError);
          allQueries[pillar.id] = [];
        }
      }
    }

    // Count total queries generated
    let totalQueries = 0;
    Object.values(allQueries).forEach(pillarQueries => {
      totalQueries += pillarQueries.length;
    });

    // Update research questions status
    const updatedQuestions = (researchQuestions || []).map(q => {
      if (q.status === 'pending' && allQueries[q.pillarId] && allQueries[q.pillarId].length > 0) {
        return { ...q, status: 'in_progress' as const };
      }
      return q;
    });

    console.log(`✅ Generated ${totalQueries} search queries`);

    return {
      researchQuestions: updatedQuestions,
      // Store queries in metadata for the next node
      metadata: {
        ...state.metadata,
        currentQueries: allQueries,
        queryStrategy,
      },
    };

  } catch (error) {
    console.error('❌ Query generation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'generate_queries',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}

/**
 * Determine the query generation strategy based on report type and phase
 */
function determineQueryStrategy(
  reportType: 'sales-intelligence' | 'pe-due-diligence',
  hasSonarData: boolean
): {
  type: 'sonar-primary' | 'lightweight-followup' | 'standard';
  phase: string;
  focus: string[];
} {
  if (!hasSonarData) {
    // Initial phase - prepare for Sonar
    return {
      type: 'sonar-primary',
      phase: 'initial',
      focus: reportType === 'pe-due-diligence' 
        ? ['investment-thesis', 'financial-health', 'market-position', 'value-creation', 'risk-assessment']
        : ['company-landscape', 'buying-signals', 'stakeholders', 'tech-stack', 'competitive-position']
    };
  }
  
  // Follow-up phase after Sonar
  return {
    type: 'lightweight-followup',
    phase: 'refinement',
    focus: reportType === 'pe-due-diligence'
      ? ['technical-validation', 'recent-developments', 'specific-metrics']
      : ['contact-discovery', 'org-charts', 'recent-rfps', 'integration-details']
  };
}

/**
 * Generate Sonar-optimized queries
 */
function generateSonarQueries(
  thesis: any,
  reportType: string,
  strategy: any
): any[] {
  const queries: any[] = [];
  
  if (reportType === 'sales-intelligence') {
    // Sales intelligence queries
    queries.push(
      {
        query: `"${thesis.company}" "digital transformation" OR "technology initiatives" OR "IT spending"`,
        type: 'web',
        priority: 'high',
        rationale: 'Identify technology initiatives and digital transformation efforts',
      },
      {
        query: `"${thesis.company}" "website redesign" OR "digital marketing" OR "customer experience"`,
        type: 'news',
        priority: 'high',
        rationale: 'Find recent digital projects and initiatives',
      },
      {
        query: `"${thesis.company}" CTO OR CIO OR "chief technology" OR "chief information"`,
        type: 'web',
        priority: 'high',
        rationale: 'Identify key technology decision makers',
      },
      {
        query: `"${thesis.company}" "request for proposal" OR RFP OR "vendor selection"`,
        type: 'web',
        priority: 'medium',
        rationale: 'Find procurement activities and vendor selection processes',
      },
      {
        query: `"${thesis.company}" "annual report" OR "investor presentation" budget technology`,
        type: 'financial',
        priority: 'medium',
        rationale: 'Understand technology budget and spending priorities',
      }
    );
  } else {
    // PE due diligence queries
    queries.push(
      {
        query: `"${thesis.company}" revenue OR "financial performance" OR EBITDA`,
        type: 'financial',
        priority: 'high',
        rationale: 'Financial performance metrics',
      },
      {
        query: `"${thesis.company}" "market share" OR competition OR competitors`,
        type: 'web',
        priority: 'high',
        rationale: 'Market position analysis',
      },
      {
        query: `"${thesis.company}" acquisition OR merger OR investment`,
        type: 'news',
        priority: 'medium',
        rationale: 'M&A activity and investment history',
      }
    );
  }
  
  return queries;
}

/**
 * Generate lightweight follow-up queries based on Sonar insights
 */
async function generateFollowUpQueries(
  state: ResearchState,
  strategy: any
): Promise<any[]> {
  const { thesis, metadata } = state;
  const reportType = metadata?.reportType || 'pe-due-diligence';
  
  // Extract gaps from Sonar research
  const gaps = metadata?.gaps || [];
  const marketContext = metadata?.marketContext || {};
  
  const queries: any[] = [];
  
  if (reportType === 'pe-due-diligence') {
    // PE-specific follow-ups focused on investment thesis
    queries.push(
      {
        query: `"${thesis.company}" revenue growth "financial results" OR "earnings report" OR "investor presentation"`,
        type: 'financial',
        priority: 'high',
        rationale: 'Financial performance validation',
      },
      {
        query: `"${thesis.company}" "customer acquisition" OR "market expansion" OR "new markets" OR "geographic expansion"`,
        type: 'news',
        priority: 'high',
        rationale: 'Growth strategy validation',
      },
      {
        query: `"${thesis.company}" "partnership" OR "strategic alliance" OR "channel partner" OR "integration"`,
        type: 'web',
        priority: 'medium',
        rationale: 'Buy-and-build opportunities',
      }
    );
  } else {
    // Sales Intelligence follow-ups
    queries.push(
      {
        query: `site:linkedin.com/in "${thesis.company}" ("CTO" OR "VP Engineering" OR "Director")`,
        type: 'web',
        priority: 'high',
        rationale: 'Key decision makers',
      },
      {
        query: `"${thesis.company}" "RFP" OR "RFI" OR "tender" filetype:pdf`,
        type: 'web',
        priority: 'medium',
        rationale: 'Recent procurement activity',
      },
      {
        query: `site:${thesis.website} "integrations" OR "partners" OR "ecosystem"`,
        type: 'web',
        priority: 'medium',
        rationale: 'Integration opportunities',
      }
    );
  }
  
  // Add gap-specific queries
  gaps.forEach((gap: any) => {
    if (gap.priority === 'high') {
      queries.push({
        query: gap.suggestedQuery || `"${thesis.company}" "${gap.topic}"`,
        type: 'web',
        priority: 'high',
        rationale: `Fill gap: ${gap.topic}`,
      });
    }
  });
  
  return queries;
}

/**
 * Build prompt for pillar-based queries (fallback/standard mode)
 */
function buildPillarPrompt(
  thesis: any,
  pillar: any,
  reportType: string,
  focusAreas: string[]
): string {
  const basePrompt = `
You are an expert research strategist. Generate 3-5 highly targeted search queries for the following pillar.

Company: ${thesis.company}
Website: ${thesis.website}
Report Type: ${reportType}
Pillar: ${pillar.name}
Description: ${pillar.description}
Key Questions: ${JSON.stringify(pillar.questions?.slice(0, 3) || [])}
Focus Areas: ${focusAreas.join(', ')}

Requirements:
- Tailor queries specifically for ${reportType} context
- Use advanced search operators (site:, intitle:, filetype:, etc)
- Include queries for: official sources, competitor comparisons, user reviews, technical docs, news
- Prioritize based on ${reportType === 'pe-due-diligence' ? 'investment decision factors' : 'sales opportunity indicators'}

Return ONLY a JSON array of query objects:
[
  {
    "query": "exact search string",
    "type": "web",
    "priority": "high",
    "rationale": "brief reason (max 10 words)",
    "expectedResults": ["type1", "type2"]
  }
]`;
  
  return basePrompt;
}