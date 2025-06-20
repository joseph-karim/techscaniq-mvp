import { ResearchState, Evidence, QualityScore } from '../../types';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models, thresholds } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { QualityEvaluationSchema, parseStructuredOutput } from '../../schemas/structured-outputs';
import { StructuredOutputParser, evidenceQualitySchema } from '../../utils/structuredOutputParser';

// Use o3 for quality evaluation as user suggested
// Note: o3 model only supports default temperature (1.0)
const model = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: models.openai.o3,
  // temperature: 1.0 is the default and only supported value for o3
});

export async function evaluateQualityNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('⚖️ Evaluating evidence quality...');
  
  try {
    const { evidence, thesis } = state;
    
    // Filter evidence that hasn't been scored yet
    const unscoredEvidence = evidence.filter(e => e.qualityScore.overall === 0);
    
    if (unscoredEvidence.length === 0) {
      console.log('No unscored evidence to evaluate');
      return {};
    }

    console.log(`Evaluating ${unscoredEvidence.length} pieces of evidence...`);

    // Batch evaluate evidence for efficiency
    const batchSize = 5;
    const updatedEvidence: Evidence[] = [...evidence];
    const qualityScores: Record<string, number> = { ...state.qualityScores };

    for (let i = 0; i < unscoredEvidence.length; i += batchSize) {
      const batch = unscoredEvidence.slice(i, i + batchSize);
      
      const evaluations = await Promise.all(
        batch.map(async (item) => {
          const score = await evaluateEvidenceQuality(item, thesis);
          return { evidenceId: item.id, score };
        })
      );

      // Update evidence with scores
      evaluations.forEach(({ evidenceId, score }) => {
        const index = updatedEvidence.findIndex(e => e.id === evidenceId);
        if (index !== -1) {
          updatedEvidence[index] = {
            ...updatedEvidence[index],
            qualityScore: score,
          };
          qualityScores[evidenceId] = score.overall;
        }
      });
    }

    // Calculate statistics
    const avgQuality = Object.values(qualityScores).reduce((sum, score) => sum + score, 0) / Object.values(qualityScores).length;
    const highQualityCount = Object.values(qualityScores).filter(score => score >= thresholds.minEvidenceQuality).length;
    
    console.log(`✅ Quality evaluation complete:`);
    console.log(`   Average quality: ${(avgQuality * 100).toFixed(1)}%`);
    console.log(`   High quality evidence: ${highQualityCount}/${Object.keys(qualityScores).length}`);

    return {
      evidence: updatedEvidence,
      qualityScores,
      metadata: {
        ...state.metadata,
        qualityStats: {
          averageQuality: avgQuality,
          highQualityCount,
          totalEvaluated: Object.keys(qualityScores).length,
        },
      },
    };

  } catch (error) {
    console.error('❌ Quality evaluation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'evaluate_quality',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}

async function evaluateEvidenceQuality(evidence: Evidence, thesis: any): Promise<QualityScore> {
  // Find matching pillar
  const pillar = thesis.pillars.find((p: any) => p.id === evidence.pillarId) || 
    { name: 'General', id: evidence.pillarId };
  
  // Get success criteria relevant to this evidence
  const successCriteria = thesis.successCriteria || [];
  
  // Use structured prompt
  const { system, prompt } = PROMPTS.qualityEvaluation;

  try {
    // Create structured prompt with limited response length
    const structuredPrompt = StructuredOutputParser.createStructuredPrompt(
      evidenceQualitySchema,
      prompt(evidence, pillar, successCriteria)
    );
    
    const response = await model.invoke([
      new SystemMessage(system),
      new HumanMessage(structuredPrompt),
    ]);

    // Parse with enhanced parser
    const evaluation = StructuredOutputParser.parseJson(
      response.content.toString(),
      evidenceQualitySchema
    );
    
    if (!evaluation) {
      console.warn('Failed to parse quality evaluation, using fallback');
      // Try original parser as fallback
      const fallbackEvaluation = parseStructuredOutput(
        QualityEvaluationSchema,
        response.content.toString()
      );
      return convertToQualityScore(fallbackEvaluation);
    }
    
    // Calculate overall score with weights
    const weights = {
      relevance: 0.35,
      credibility: 0.25,
      recency: 0.15,
      specificity: 0.20,
      bias: 0.05,
    };

    const overall = Object.entries(weights).reduce((sum, [key, weight]) => {
      const scoreKey = key as keyof typeof evaluation;
      const score = typeof evaluation[scoreKey] === 'number' ? evaluation[scoreKey] : 0;
      return sum + (score * weight);
    }, 0);

    return {
      overall,
      components: {
        relevance: evaluation.relevance,
        credibility: evaluation.credibility,
        recency: evaluation.recency,
        specificity: evaluation.specificity,
        bias: evaluation.bias,
        depth: 0.7, // Default depth score
      },
      reasoning: evaluation.reasoning || '',
    };

  } catch (error) {
    console.error('Error evaluating evidence quality:', error);
    // Return default low scores on error
    return {
      overall: 0.3,
      components: {
        relevance: 0.3,
        credibility: evidence.source.credibilityScore,
        recency: 0.3,
        specificity: 0.3,
        bias: 0.5,
        depth: 0.3,
      },
      reasoning: 'Quality evaluation failed',
    };
  }
}

function convertToQualityScore(evaluation: any): QualityScore {
  const weights = {
    relevance: 0.35,
    credibility: 0.25,
    recency: 0.15,
    specificity: 0.20,
    bias: 0.05,
  };

  const overall = Object.entries(weights).reduce((sum, [key, weight]) => {
    const score = evaluation[key] || 0;
    return sum + (score * weight);
  }, 0);

  return {
    overall,
    components: {
      relevance: evaluation.relevance || 0,
      credibility: evaluation.credibility || 0,
      recency: evaluation.recency || 0,
      specificity: evaluation.specificity || 0,
      bias: evaluation.bias || 0,
      depth: 0.7,
    },
    reasoning: evaluation.reasoning || '',
  };
}