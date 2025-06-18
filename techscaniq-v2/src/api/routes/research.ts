import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { queues } from '../../services/queue/index';
import { StorageService } from '../../services/storage';
import { ResearchState, ThesisType } from '../../types';
import { config } from '../../config';

// Request/Response schemas
const StartResearchBody = z.object({
  company: z.string().min(1),
  website: z.string().url(),
  thesisType: z.enum(['growth', 'efficiency', 'innovation', 'custom']),
  customThesis: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ResearchStatusParams = z.object({
  id: z.string().uuid(),
});

const GetReportParams = z.object({
  id: z.string().uuid(),
});

type StartResearchRequest = FastifyRequest<{
  Body: z.infer<typeof StartResearchBody>;
}>;

type ResearchStatusRequest = FastifyRequest<{
  Params: z.infer<typeof ResearchStatusParams>;
}>;

type GetReportRequest = FastifyRequest<{
  Params: z.infer<typeof GetReportParams>;
}>;

export async function researchRoutes(fastify: FastifyInstance) {
  const storage = new StorageService();

  // POST /api/research/start
  fastify.post<{ Body: z.infer<typeof StartResearchBody> }>(
    '/start',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            company: { type: 'string', minLength: 1 },
            website: { type: 'string', format: 'uri' },
            thesisType: { 
              type: 'string', 
              enum: ['growth', 'efficiency', 'innovation', 'custom'] 
            },
            customThesis: { type: 'string' },
            metadata: { type: 'object' }
          },
          required: ['company', 'website', 'thesisType']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              researchId: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
              estimatedTime: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: StartResearchRequest, reply: FastifyReply) => {
      try {
        const { company, website, thesisType, customThesis, metadata } = request.body;

        // Generate research ID
        const researchId = uuidv4();

        // Create initial research state
        const initialState: ResearchState = {
          thesis: {
            id: researchId,
            company,
            website,
            type: thesisType as ThesisType,
            customThesis,
            statement: '',
            pillars: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          evidence: [],
          questions: [],
          report: {
            content: '',
            sections: [],
            citations: [],
          },
          status: 'interpreting_thesis',
          iterationCount: 0,
          evidenceCount: 0,
          queuedJobs: [],
          metadata,
        };

        // Save initial state
        await storage.saveResearchState(researchId, initialState);

        // Queue the orchestration job
        if (config.USE_QUEUES) {
          const job = await queues.orchestration.add(
            'start-research',
            {
              type: 'start_research',
              stateId: researchId,
              data: {
                company,
                website,
                thesisType,
                customThesis,
                metadata,
              },
            },
            {
              priority: 1,
              removeOnComplete: false,
              removeOnFail: false,
            }
          );

          fastify.log.info({ researchId, jobId: job.id }, 'Research queued');
        } else {
          // Direct execution without queues (for development)
          const { runDeepResearch } = await import('../../orchestrator/graph');
          runDeepResearch(company, website, thesisType, customThesis, metadata).catch(error => {
            fastify.log.error({ error, researchId }, 'Research failed');
          });
        }

        return reply.send({
          researchId,
          status: 'started',
          message: 'Research initiated successfully',
          estimatedTime: '15-30 minutes',
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to start research');
        
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Invalid request data',
            details: error.errors,
          });
        }

        return reply.status(500).send({
          error: 'Failed to start research',
        });
      }
    }
  );

  // GET /api/research/:id/status
  fastify.get<{ Params: z.infer<typeof ResearchStatusParams> }>(
    '/:id/status',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              researchId: { type: 'string' },
              status: { type: 'string' },
              progress: { type: 'number' },
              currentPhase: { type: 'string' },
              evidenceCount: { type: 'number' },
              iterationCount: { type: 'number' },
              lastUpdated: { type: 'string' },
              estimatedTimeRemaining: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: ResearchStatusRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Load research state
        const state = await storage.loadResearchState(id);
        
        if (!state) {
          return reply.status(404).send({
            error: 'Research not found',
          });
        }

        // Calculate progress
        const progress = calculateProgress(state);
        const estimatedTimeRemaining = estimateTimeRemaining(state);

        return reply.send({
          researchId: id,
          status: state.status,
          progress,
          currentPhase: state.status,
          evidenceCount: state.evidence.length,
          iterationCount: state.iterationCount,
          lastUpdated: state.thesis.updatedAt?.toISOString() || new Date().toISOString(),
          estimatedTimeRemaining,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to get research status');
        return reply.status(500).send({
          error: 'Failed to get research status',
        });
      }
    }
  );

  // GET /api/research/:id/report
  fastify.get<{ Params: z.infer<typeof GetReportParams> }>(
    '/:id/report',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              researchId: { type: 'string' },
              company: { type: 'string' },
              thesis: { type: 'object' },
              report: { type: 'object' },
              evidence: { type: 'array' },
              generatedAt: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          202: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: GetReportRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Load research state
        const state = await storage.loadResearchState(id);
        
        if (!state) {
          return reply.status(404).send({
            error: 'Research not found',
          });
        }

        // Check if report is ready
        if (state.status !== 'completed') {
          return reply.status(202).send({
            message: 'Report is still being generated',
            status: state.status,
          });
        }

        return reply.send({
          researchId: id,
          company: state.thesis.company,
          thesis: state.thesis,
          report: state.report,
          evidence: state.evidence.slice(0, 50), // Limit evidence in response
          generatedAt: state.thesis.updatedAt?.toISOString() || new Date().toISOString(),
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to get report');
        return reply.status(500).send({
          error: 'Failed to get report',
        });
      }
    }
  );
}

// Helper functions
function calculateProgress(state: ResearchState): number {
  const phases = [
    'interpreting_thesis',
    'gathering_evidence',
    'evaluating_quality',
    'reflecting',
    'generating_report',
    'completed',
  ];
  
  const currentPhaseIndex = phases.indexOf(state.status);
  if (currentPhaseIndex === -1) return 0;
  
  // Base progress from phase
  const baseProgress = (currentPhaseIndex / (phases.length - 1)) * 100;
  
  // Additional progress within phase
  let phaseProgress = 0;
  if (state.status === 'gathering_evidence') {
    phaseProgress = Math.min(state.evidence.length / config.MIN_EVIDENCE_COUNT, 1) * 20;
  } else if (state.status === 'evaluating_quality') {
    const evaluated = state.evidence.filter(e => e.qualityScore.overall > 0).length;
    phaseProgress = (evaluated / Math.max(state.evidence.length, 1)) * 20;
  }
  
  return Math.min(Math.round(baseProgress + phaseProgress), 100);
}

function estimateTimeRemaining(state: ResearchState): string {
  const elapsedMinutes = (Date.now() - (state.thesis.createdAt?.getTime() || Date.now())) / 60000;
  const progress = calculateProgress(state);
  
  if (progress === 0) return '15-30 minutes';
  if (progress === 100) return 'Complete';
  
  const estimatedTotalMinutes = elapsedMinutes / (progress / 100);
  const remainingMinutes = Math.max(estimatedTotalMinutes - elapsedMinutes, 1);
  
  if (remainingMinutes < 5) return 'Less than 5 minutes';
  if (remainingMinutes < 10) return '5-10 minutes';
  if (remainingMinutes < 20) return '10-20 minutes';
  return `${Math.round(remainingMinutes)} minutes`;
}