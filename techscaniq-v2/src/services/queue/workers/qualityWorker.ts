import { Worker, Job } from 'bullmq';
import { connection } from '../index';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { config, models } from '../../../config';
import { Evidence, QualityScore } from '../../../types';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

interface QualityJobData {
  evidence: Evidence;
  context: {
    researchQuestion: string;
    pillarName: string;
    thesisStatement: string;
  };
}

interface QualityJobResult {
  success: boolean;
  evidenceId: string;
  qualityScore?: QualityScore;
  error?: string;
}

// Quality evaluation schema
const QualityEvaluationSchema = z.object({
  overall: z.number().min(0).max(1).describe('Overall quality score from 0 to 1'),
  components: z.object({
    relevance: z.number().min(0).max(1).describe('How relevant is this to the research question?'),
    credibility: z.number().min(0).max(1).describe('How credible is the source?'),
    recency: z.number().min(0).max(1).describe('How recent is the information?'),
    specificity: z.number().min(0).max(1).describe('How specific and detailed is the evidence?'),
    bias: z.number().min(0).max(1).describe('How unbiased is the information? (1 = unbiased)'),
  }),
  reasoning: z.string().describe('Detailed explanation of the scoring'),
  missingInformation: z.array(z.string()).optional().describe('What key information is missing?'),
  suggestedFollowUp: z.array(z.string()).optional().describe('Suggested follow-up searches'),
});

export const qualityWorker = new Worker<QualityJobData, QualityJobResult>(
  'quality-evaluation',
  async (job: Job<QualityJobData>) => {
    const { evidence, context } = job.data;
    
    console.log(`[Quality Worker] Evaluating evidence: ${evidence.id}`);
    
    try {
      await job.updateProgress(10);
      
      // Initialize LLM based on config
      const llm = models.qualityEvaluator.model.includes('claude')
        ? new ChatAnthropic({
            anthropicApiKey: config.ANTHROPIC_API_KEY,
            modelName: models.qualityEvaluator.model,
            temperature: models.qualityEvaluator.temperature,
          })
        : new ChatOpenAI({
            openAIApiKey: config.OPENAI_API_KEY,
            modelName: models.qualityEvaluator.model,
            temperature: models.qualityEvaluator.temperature,
          });
      
      await job.updateProgress(20);
      
      // Create evaluation prompt
      const prompt = createQualityEvaluationPrompt(evidence, context);
      
      // Get structured output
      const response = await llm.invoke(prompt, {
        response_format: {
          type: 'json_object',
        },
      });
      
      await job.updateProgress(80);
      
      // Parse and validate response
      const evaluation = QualityEvaluationSchema.parse(
        JSON.parse(response.content as string)
      );
      
      const qualityScore: QualityScore = {
        ...evaluation,
        overall: evaluation.overall,
        components: evaluation.components,
        reasoning: evaluation.reasoning,
        missingInformation: evaluation.missingInformation,
        suggestedFollowUp: evaluation.suggestedFollowUp,
      };
      
      await job.updateProgress(100);
      
      // Log evaluation results
      await job.log(`Quality score: ${qualityScore.overall.toFixed(2)} - ${qualityScore.reasoning.substring(0, 100)}...`);
      
      return {
        success: true,
        evidenceId: evidence.id,
        qualityScore,
      };
      
    } catch (error) {
      console.error(`[Quality Worker] Error:`, error);
      
      await job.log(`Quality evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        evidenceId: evidence.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 quality evaluations concurrently
    limiter: {
      max: 50,
      duration: 60000, // 50 evaluations per minute
    },
  }
);

function createQualityEvaluationPrompt(evidence: Evidence, context: any): string {
  return `# Quality Evaluation Task

## Context
Research Question: ${context.researchQuestion}
Investment Thesis Pillar: ${context.pillarName}
Overall Thesis: ${context.thesisStatement}

## Evidence to Evaluate
Source: ${evidence.source.name} (${evidence.source.url})
Type: ${evidence.source.type}
Published: ${evidence.source.publishDate || 'Unknown'}
Author: ${evidence.source.author || 'Unknown'}

Content:
${evidence.content.substring(0, 2000)}${evidence.content.length > 2000 ? '...' : ''}

## Evaluation Criteria

Evaluate this evidence on the following dimensions:

1. **Relevance** (0-1): How directly does this evidence address the research question?
2. **Credibility** (0-1): How trustworthy is the source and information?
3. **Recency** (0-1): How current is this information?
4. **Specificity** (0-1): How specific and detailed is the evidence?
5. **Bias** (0-1): How unbiased is the information? (1 = completely unbiased)

Provide an overall quality score and detailed reasoning for your evaluation.

Also identify:
- What key information is missing that would strengthen this evidence?
- What follow-up searches would help fill these gaps?

Return your evaluation in the specified JSON format.`;
}

// Worker event handlers
qualityWorker.on('completed', (job) => {
  console.log(`[Quality Worker] Job ${job.id} completed successfully`);
});

qualityWorker.on('failed', (job, err) => {
  console.error(`[Quality Worker] Job ${job?.id} failed:`, err.message);
});

qualityWorker.on('error', (err) => {
  console.error('[Quality Worker] Worker error:', err);
});

export default qualityWorker;