import Fastify from 'fastify';
import cors from '@fastify/cors';
import { runDeepResearch } from '../orchestrator/graph';
import { config } from '../config';
import { StorageService } from '../services/storage';

const fastify = Fastify({
  logger: true
});

const storage = new StorageService();

// Register plugins
fastify.register(cors, {
  origin: true
});

// Health check
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date() };
});

// Start new research
fastify.post('/api/research/start', async (request, reply) => {
  try {
    const { company, website, thesisType, customThesis } = request.body as any;

    if (!company || !website || !thesisType) {
      return reply.status(400).send({
        error: 'Missing required fields: company, website, thesisType',
      });
    }

    console.log(`Starting research for ${company}...`);

    // Start research in background
    runDeepResearch(company, website, thesisType, customThesis)
      .then(reportId => {
        console.log(`Research completed: ${reportId}`);
      })
      .catch(error => {
        console.error('Research failed:', error);
      });

    // Return immediately with thesis ID
    const thesisId = `thesis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return reply.send({
      thesisId,
      message: 'Research started successfully',
      estimatedTime: '15-30 minutes',
    });

  } catch (error) {
    console.error('Failed to start research:', error);
    return reply.status(500).send({
      error: 'Failed to start research',
    });
  }
});

// Get research status
interface GetResearchParams {
  thesisId: string;
}

fastify.get<{ Params: GetResearchParams }>('/api/research/:thesisId', async (request, reply) => {
  try {
    const { thesisId } = request.params;
    const state = await storage.loadResearchState(thesisId);

    if (!state) {
      return reply.status(404).send({
        error: 'Research not found',
      });
    }

    return reply.send({
      thesisId,
      status: state.status,
      evidenceCount: state.evidence.length,
      iterationCount: state.iterationCount,
      lastUpdated: state.thesis.updatedAt,
    });

  } catch (error) {
    console.error('Failed to get research status:', error);
    return reply.status(500).send({
      error: 'Failed to get research status',
    });
  }
});

// Start server
export async function startServer() {
  try {
    await fastify.listen({
      port: config.API_PORT,
      host: config.API_HOST
    });
    console.log(`Server running on http://${config.API_HOST}:${config.API_PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}