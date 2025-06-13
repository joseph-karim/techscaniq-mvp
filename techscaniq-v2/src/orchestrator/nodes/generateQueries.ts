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
    const { thesis, researchQuestions } = state;
    
    // Generate queries for each pillar separately to avoid truncation
    const allQueries: Record<string, any[]> = {};
    
    for (const pillar of thesis.pillars) {
      console.log(`   Generating queries for pillar: ${pillar.name}`);
      
      const pillarPrompt = `
You are an expert research strategist. Generate 3-5 highly targeted search queries for the following pillar.

Company: ${thesis.company}
Website: ${thesis.website}
Pillar: ${pillar.name}
Description: ${pillar.description}
Key Questions: ${JSON.stringify(pillar.questions?.slice(0, 3) || [])}

Generate diverse queries using advanced search operators (site:, intitle:, filetype:, etc).
Include queries for: official sources, competitor comparisons, user reviews, technical docs, news.

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

    console.log(`✅ Generated ${totalQueries} search queries across ${Object.keys(allQueries).length} pillars`);

    return {
      researchQuestions: updatedQuestions,
      // Store queries in metadata for the next node
      metadata: {
        ...state.metadata,
        currentQueries: allQueries,
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