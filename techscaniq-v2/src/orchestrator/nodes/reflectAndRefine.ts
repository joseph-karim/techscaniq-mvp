import { ResearchState, ResearchQuestion, ThesisPillar } from '../../types';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models, thresholds } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { ReflectionAnalysisSchema, parseStructuredOutput } from '../../schemas/structured-outputs';
import { v4 as uuidv4 } from 'uuid';

// Use Claude Opus 4 for orchestration
const model = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.3,
  maxTokens: 8192, // Ensure we get complete responses
});

export async function reflectAndRefineNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('🔍 Reflecting on evidence and identifying gaps...');
  
  try {
    const { thesis, evidence, qualityScores, researchQuestions, iterationCount } = state;
    
    // Analyze evidence coverage and quality by pillar
    const pillarAnalysis = analyzePillarCoverage(thesis, evidence, qualityScores || {});
    
    // Create a simpler reflection prompt focused on key gaps
    const reflectionPrompt = `
Analyze the research progress for ${thesis.company}.

Current Evidence: ${evidence.length} pieces collected
Quality: ${Object.values(qualityScores || {}).length} pieces scored
Pillars: ${thesis.pillars.map(p => p.name).join(', ')}

Identify the TOP 3 critical gaps that must be filled.

Return ONLY a JSON object:
{
  "gaps": [
    {
      "pillarId": "pillar-id",
      "type": "missing_data",
      "description": "Brief gap description (max 20 words)",
      "importance": "critical",
      "suggestedQueries": ["query1", "query2"]
    }
  ],
  "refinements": {
    "focusAreas": ["area1", "area2"],
    "adjustments": ["adjustment1"]
  },
  "recommendNextIteration": ${iterationCount < 2}
}`;

    const response = await model.invoke([
      new SystemMessage("You are a research analyst. Return only valid JSON."),
      new HumanMessage(reflectionPrompt),
    ]);

    // Parse response more robustly
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
      // Provide default reflection
      reflectionAnalysis = {
        gaps: thesis.pillars.slice(0, 3).map(p => ({
          pillarId: p.id,
          type: 'missing_data',
          description: `Need more data for ${p.name}`,
          importance: 'high',
          suggestedQueries: [`${thesis.company} ${p.name.toLowerCase()}`]
        })),
        refinements: {
          focusAreas: ['financial metrics', 'competitive analysis'],
          adjustments: ['expand search scope']
        },
        recommendNextIteration: iterationCount < 2
      };
    }
    
    // Generate refined queries based on gaps
    const refinedQueries = await generateRefinedQueriesFromGaps(
      thesis,
      reflectionAnalysis.gaps,
      evidence
    );
    
    console.log(`📋 Reflection complete:`);
    console.log(`   Iteration: ${iterationCount + 1}/${state.maxIterations}`);
    console.log(`   Evidence collected: ${evidence.length}`);
    console.log(`   Gaps identified: ${reflectionAnalysis.gaps.length}`);
    console.log(`   Key insights: ${reflectionAnalysis.insights.length}`);
    console.log(`   Next steps: ${reflectionAnalysis.nextSteps.length}`);
    
    return {
      iterationCount: iterationCount + 1,
      metadata: {
        ...state.metadata,
        currentQueries: refinedQueries,
        gaps: reflectionAnalysis.gaps,
        insights: reflectionAnalysis.insights,
        nextSteps: reflectionAnalysis.nextSteps,
        pillarAnalysis: pillarAnalysis,
        lastReflection: new Date(),
      },
    };
    
  } catch (error) {
    console.error('❌ Reflection failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'reflect_and_refine',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}

function analyzePillarCoverage(
  thesis: any,
  evidence: any[],
  qualityScores: Record<string, number>
): Record<string, any> {
  const analysis: Record<string, any> = {};
  
  thesis.pillars.forEach((pillar: ThesisPillar) => {
    const pillarEvidence = evidence.filter(e => e.pillarId === pillar.id);
    const highQualityEvidence = pillarEvidence.filter(e => 
      qualityScores[e.id] >= thresholds.minEvidenceQuality
    );
    
    analysis[pillar.id] = {
      name: pillar.name,
      weight: pillar.weight,
      totalEvidence: pillarEvidence.length,
      highQualityEvidence: highQualityEvidence.length,
      averageQuality: pillarEvidence.length > 0
        ? pillarEvidence.reduce((sum, e) => sum + (qualityScores[e.id] || 0), 0) / pillarEvidence.length
        : 0,
      coverage: calculateCoverage(pillar, pillarEvidence),
      needsMoreEvidence: highQualityEvidence.length < thresholds.minEvidencePerPillar,
    };
  });
  
  return analysis;
}

function calculateCoverage(pillar: ThesisPillar, evidence: any[]): number {
  // Calculate how well the evidence covers the pillar's key aspects
  const keywordsCovered = new Set<string>();
  
  evidence.forEach(e => {
    // Check content for pillar keywords
    const content = e.content.toLowerCase();
    (pillar.keyQuestions || pillar.questions).forEach((question: string) => {
      const keywords = extractKeywords(question);
      keywords.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          keywordsCovered.add(keyword);
        }
      });
    });
  });
  
  const totalKeywords = (pillar.keyQuestions || pillar.questions).reduce((sum: number, q: string) => 
    sum + extractKeywords(q).length, 0
  );
  
  return totalKeywords > 0 ? keywordsCovered.size / totalKeywords : 0;
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - can be enhanced with NLP
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'how', 'what', 'when', 'where', 'why', 'a', 'an']);
  return text
    .split(/\W+/)
    .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()))
    .map(word => word.toLowerCase());
}

async function identifyGaps(
  thesis: any,
  evidence: any[],
  pillarAnalysis: Record<string, any>,
  researchQuestions: ResearchQuestion[]
): Promise<any[]> {
  const systemPrompt = `You are an expert investment analyst identifying research gaps in due diligence.

Analyze the evidence collected and identify:
1. Critical information still missing
2. Areas with insufficient high-quality evidence
3. Conflicting information needing clarification
4. Specific data points or metrics not yet found
5. Time-sensitive information that needs updating

Focus on gaps that would materially impact the investment decision.

Output format:
[
  {
    "pillarId": "pillar-id",
    "type": "missing_data|insufficient_evidence|conflicting_info|needs_update",
    "description": "Clear description of the gap",
    "importance": "critical|high|medium",
    "suggestedQueries": ["specific search query 1", "specific search query 2"]
  }
]`;

  const evidenceSummary = Object.entries(pillarAnalysis)
    .map(([id, analysis]) => `${analysis.name}: ${analysis.highQualityEvidence} high-quality pieces, ${(analysis.coverage * 100).toFixed(0)}% coverage`)
    .join('\n');

  const userPrompt = `Company: ${thesis.company}
Investment Thesis: ${thesis.statement}

Evidence Summary by Pillar:
${evidenceSummary}

Key Questions Still Unanswered:
${researchQuestions
  .filter(q => !evidence.some(e => e.researchQuestionId === q.id))
  .map(q => `- ${q.question}`)
  .join('\n')}

Identify the most critical gaps in our research.`;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content.toString();
    const gapsMatch = content.match(/\[[\s\S]*\]/);
    
    if (!gapsMatch) {
      throw new Error('Failed to parse gaps');
    }

    return JSON.parse(gapsMatch[0]);
  } catch (error) {
    console.error('Error identifying gaps:', error);
    return [];
  }
}

async function generateRefinedQueriesFromGaps(
  thesis: any,
  gaps: any[],
  existingEvidence: any[]
): Promise<Record<string, any[]>> {
  const systemPrompt = `You are an expert at crafting targeted search queries for investment research.

Based on identified gaps, generate specific, targeted queries that will find:
- Concrete data points and metrics
- Recent updates and announcements
- Expert analysis and third-party validations
- Technical deep-dives on specific aspects

Make queries specific to ${thesis.company} and avoid generic searches.
Include site-specific searches where relevant (e.g., site:github.com, site:linkedin.com).

Output format:
{
  "pillar-id": [
    {
      "query": "specific search query",
      "type": "web|news|academic|social",
      "priority": "high|medium|low",
      "rationale": "what this query will find"
    }
  ]
}`;

  const gapsSummary = gaps
    .filter(g => g.importance === 'critical' || g.importance === 'high')
    .map(g => `${g.description} (${g.type})`)
    .join('\n');

  const userPrompt = `Company: ${thesis.company}
Sector: ${thesis.metadata?.sector || 'Technology'}

Critical Gaps to Address:
${gapsSummary}

We already have ${existingEvidence.length} pieces of evidence. Generate refined queries to fill the gaps.`;

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
    console.error('Error generating refined queries:', error);
    
    // Fallback: Generate basic queries for gaps
    const fallbackQueries: Record<string, any[]> = {};
    
    gaps.forEach(gap => {
      if (!fallbackQueries[gap.pillarId]) {
        fallbackQueries[gap.pillarId] = [];
      }
      
      gap.suggestedQueries?.forEach((query: string) => {
        fallbackQueries[gap.pillarId].push({
          query: query,
          type: 'web',
          priority: gap.importance === 'critical' ? 'high' : 'medium',
          rationale: gap.description,
        });
      });
    });
    
    return fallbackQueries;
  }
}