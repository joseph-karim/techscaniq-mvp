import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from '../config';
import { runDeepResearch } from '../orchestrator/graph';
import { StorageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';
import { ResearchState, ThesisType } from '../types';
import { queues } from '../services/queue/index';

// Create Fastify instance
const fastify = Fastify({
  logger: true,
});

const storage = new StorageService();

// Register CORS
fastify.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
fastify.get('/api/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
  };
});

// Start research
fastify.post('/api/research/start', async (request, reply) => {
  try {
    const { company, website, thesisType, customThesis, metadata } = request.body as any;

    if (!company || !website || !thesisType) {
      return reply.status(400).send({
        error: 'Missing required fields: company, website, thesisType',
      });
    }

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
      // Direct execution without queues
      runDeepResearch(company, website, thesisType, customThesis).catch(error => {
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
    fastify.log.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Failed to start research');
    return reply.status(500).send({
      error: 'Failed to start research',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get research status
fastify.get('/api/research/:id/status', async (request, reply) => {
  try {
    const { id } = request.params as any;
    
    // Load research state
    const state = await storage.loadResearchState(id);
    
    if (!state) {
      return reply.status(404).send({
        error: 'Research not found',
      });
    }

    // Calculate progress
    const progress = calculateProgress(state);

    return reply.send({
      researchId: id,
      status: state.status,
      progress,
      currentPhase: state.status,
      evidenceCount: state.evidence.length,
      iterationCount: state.iterationCount,
      lastUpdated: state.thesis.updatedAt?.toISOString() || new Date().toISOString(),
      estimatedTimeRemaining: '10-15 minutes',
    });
  } catch (error) {
    fastify.log.error({ error }, 'Failed to get research status');
    return reply.status(500).send({
      error: 'Failed to get research status',
    });
  }
});

// Get report
fastify.get('/api/research/:id/report', async (request, reply) => {
  try {
    const { id } = request.params as any;
    
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
      report: state.report || { content: 'Report generation pending', sections: [], citations: [] },
      evidence: state.evidence.slice(0, 50), // Limit evidence in response
      generatedAt: state.thesis.updatedAt?.toISOString() || new Date().toISOString(),
    });
  } catch (error) {
    fastify.log.error({ error }, 'Failed to get report');
    return reply.status(500).send({
      error: 'Failed to get report',
    });
  }
});

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
  
  return Math.min(Math.round((currentPhaseIndex / (phases.length - 1)) * 100), 100);
}

// Start server
export async function startServer() {
  try {
    await fastify.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    });
    
    fastify.log.info(`Server running on http://${config.API_HOST}:${config.API_PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}