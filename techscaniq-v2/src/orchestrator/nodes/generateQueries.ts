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
    const { thesis, researchQuestions, iterationCount } = state;
    
    // Use structured prompt for query generation
    const { system, prompt } = PROMPTS.queryGeneration;
    
    const response = await model.invoke([
      new SystemMessage(system),
      new HumanMessage(prompt(state)),
    ]);

    // Parse and validate structured output
    const queryResult = parseStructuredOutput(
      QueryGenerationSchema,
      response.content.toString()
    );

    // Count total queries generated
    let totalQueries = 0;
    Object.values(queryResult.queries).forEach(pillarQueries => {
      totalQueries += pillarQueries.length;
    });

    // Update research questions status
    const updatedQuestions = researchQuestions.map(q => {
      if (q.status === 'pending' && queryResult.queries[q.pillarId]) {
        return { ...q, status: 'in_progress' as const };
      }
      return q;
    });

    console.log(`✅ Generated ${totalQueries} search queries across ${Object.keys(queryResult.queries).length} pillars`);

    // Log sample queries for monitoring
    Object.entries(queryResult.queries).forEach(([pillarId, queries]) => {
      const pillar = thesis.pillars.find(p => p.id === pillarId);
      console.log(`   - ${pillar?.name || pillarId}: ${queries.length} queries`);
      if (queries.length > 0 && queries[0]) {
        console.log(`     Sample: "${queries[0].query.substring(0, 60)}..."`);
      }
    });

    return {
      researchQuestions: updatedQuestions,
      // Store queries in metadata for the next node
      metadata: {
        ...state.metadata,
        currentQueries: queryResult.queries,
      },
    };

  } catch (error) {
    console.error('❌ Query generation failed:', error);
    return {
      errors: [...state.errors, {
        timestamp: new Date(),
        phase: 'generate_queries',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}