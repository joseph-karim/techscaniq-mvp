import { ResearchState, Evidence, QualityScore } from '../../types';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models, thresholds } from '../../config';
import { PROMPTS } from '../../prompts/structured-prompts';
import { QualityEvaluationSchema, parseStructuredOutput } from '../../schemas/structured-outputs';
import { MarketContextService } from '../../services/marketContextService';
import { 
  getMarketAwareTechnicalEvaluationPrompt, 
  TECHNICAL_EVIDENCE_INTERPRETATION, 
  API_QUALITY_RUBRIC
} from '../../prompts/market-context-aware-prompts';
import { MarketContext } from '../../types';

// Use o3 for quality evaluation as user suggested
const model = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: models.openai.o3,
  temperature: 0.1,
});

export async function evaluateQualityMarketAwareNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('⚖️ Evaluating evidence quality with market context...');
  
  try {
    const { evidence, thesis } = state;
    
    // Extract market signals from evidence
    const marketSignals = MarketContextService.extractMarketSignals(evidence);
    
    // Detect market context
    const marketContext = MarketContextService.detectMarketContext(
      thesis.company,
      marketSignals,
      evidence
    );
    
    console.log(`📊 Market Context Detected:`);
    console.log(`   Target Market: ${marketContext.targetCustomerSize}`);
    console.log(`   Primary Buyers: ${marketContext.primaryBuyers.join(', ')}`);
    console.log(`   Technical Sophistication: ${marketContext.technicalSophistication}`);
    console.log(`   Market Leader: ${marketContext.competitiveContext.marketLeader} (${marketContext.competitiveContext.marketLeaderShare}%)`);
    
    // Filter evidence that hasn't been scored yet
    const unscoredEvidence = evidence.filter(e => e.qualityScore.overall === 0);
    
    if (unscoredEvidence.length === 0) {
      console.log('No unscored evidence to evaluate');
      return {
        metadata: {
          ...state.metadata,
          marketContext,
          marketSignals,
        }
      };
    }

    console.log(`Evaluating ${unscoredEvidence.length} pieces of evidence with market awareness...`);

    // Batch evaluate evidence for efficiency
    const batchSize = 5;
    const updatedEvidence: Evidence[] = [...evidence];
    const qualityScores: Record<string, number> = { ...state.qualityScores };

    for (let i = 0; i < unscoredEvidence.length; i += batchSize) {
      const batch = unscoredEvidence.slice(i, i + batchSize);
      
      const evaluations = await Promise.all(
        batch.map(async (item) => {
          const score = await evaluateEvidenceQualityWithMarketContext(
            item, 
            thesis, 
            marketContext,
            marketSignals
          );
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
    
    // Separate technical evidence for market-aware assessment
    const technicalEvidence = updatedEvidence.filter(e => 
      e.pillarId === 'tech-architecture' || 
      e.content.toLowerCase().includes('api') ||
      e.content.toLowerCase().includes('technology') ||
      e.content.toLowerCase().includes('infrastructure')
    );
    
    console.log(`✅ Market-aware quality evaluation complete:`);
    console.log(`   Average quality: ${(avgQuality * 100).toFixed(1)}%`);
    console.log(`   High quality evidence: ${highQualityCount}/${Object.keys(qualityScores).length}`);
    console.log(`   Technical evidence assessed: ${technicalEvidence.length} pieces`);

    return {
      evidence: updatedEvidence,
      qualityScores,
      metadata: {
        ...state.metadata,
        marketContext,
        marketSignals,
        qualityStats: {
          averageQuality: avgQuality,
          highQualityCount,
          totalEvaluated: Object.keys(qualityScores).length,
          technicalEvidenceCount: technicalEvidence.length,
        },
      },
    };

  } catch (error) {
    console.error('❌ Market-aware quality evaluation failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'evaluate_quality_market_aware',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}

async function evaluateEvidenceQualityWithMarketContext(
  evidence: Evidence, 
  thesis: any,
  marketContext: MarketContext,
  marketSignals: any
): Promise<QualityScore> {
  // Find matching pillar
  const pillar = thesis.pillars.find((p: any) => p.id === evidence.pillarId) || 
    { name: 'General', id: evidence.pillarId };
  
  // Get success criteria relevant to this evidence
  const successCriteria = thesis.successCriteria || [];
  
  // Check if this is technical evidence that needs market-aware evaluation
  const isTechnicalEvidence = 
    pillar.name.toLowerCase().includes('tech') ||
    evidence.content.toLowerCase().includes('api') ||
    evidence.content.toLowerCase().includes('infrastructure') ||
    evidence.content.toLowerCase().includes('technology');

  try {
    let systemPrompt: string;
    let userPrompt: string;
    
    if (isTechnicalEvidence) {
      // Use market-aware technical evaluation
      const evaluationPrompt = getMarketAwareTechnicalEvaluationPrompt(thesis.company, marketContext);
      systemPrompt = `You are an expert investment analyst evaluating technical evidence.\n${evaluationPrompt}`;

      userPrompt = `Evaluate this technical evidence for ${thesis.company}:

Evidence: ${evidence.content}
Source: ${evidence.source.name} (Credibility: ${evidence.source.credibilityScore})

Market Context:
- Target Market: ${marketContext.targetCustomerSize}
- Technical Sophistication: ${marketContext.technicalSophistication}
- Customer Count: ${marketSignals.customerCount || 'Unknown'}
- Retention Rate: ${marketSignals.retentionRate || 'Unknown'}%

Assess the technical decisions through the lens of their ${marketContext.targetCustomerSize} market.

Output JSON format:
{
  "relevance": 0.0-1.0,
  "credibility": 0.0-1.0,
  "recency": 0.0-1.0,
  "specificity": 0.0-1.0,
  "bias": 0.0-1.0,
  "marketAppropriateness": 0.0-1.0,
  "reasoning": "explanation",
  "marketContextNotes": "how market context affected scoring",
  "missingInformation": ["item1", "item2"],
  "suggestedFollowUp": ["action1", "action2"]
}`;
    } else {
      // Use standard evaluation for non-technical evidence
      const { system, prompt } = PROMPTS.qualityEvaluation;
      systemPrompt = system;
      userPrompt = prompt(evidence, pillar, successCriteria);
    }

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    // Parse response
    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const evaluation = JSON.parse(jsonMatch[0]);
    
    // Calculate overall score with market-aware weights
    let weights: Record<string, number>;
    
    if (isTechnicalEvidence) {
      // Market-aware weights for technical evidence
      weights = {
        relevance: 0.25,
        credibility: 0.20,
        recency: 0.10,
        specificity: 0.15,
        bias: 0.05,
        marketAppropriateness: 0.25, // High weight for market fit
      };
    } else {
      // Standard weights
      weights = {
        relevance: 0.35,
        credibility: 0.25,
        recency: 0.15,
        specificity: 0.20,
        bias: 0.05,
      };
    }

    const overall = Object.entries(weights).reduce((sum, [key, weight]) => {
      const score = evaluation[key] || 0;
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
        ...(isTechnicalEvidence && { marketAppropriateness: evaluation.marketAppropriateness }),
      },
      reasoning: evaluation.reasoning || '',
      missingInformation: evaluation.missingInformation,
      suggestedFollowUp: evaluation.suggestedFollowUp,
      ...(isTechnicalEvidence && { marketContextNotes: evaluation.marketContextNotes }),
    };

  } catch (error) {
    console.error('Error evaluating evidence quality with market context:', error);
    // Return default low scores on error
    return {
      overall: 0.3,
      components: {
        relevance: 0.3,
        credibility: evidence.source.credibilityScore,
        recency: 0.3,
        specificity: 0.3,
        bias: 0.5,
      },
      reasoning: 'Quality evaluation failed',
    };
  }
}

