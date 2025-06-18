import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { config } from '../../config';
import { Evidence } from '../../types';

// Initialize clients
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// Request schemas
const SearchEvidenceBody = z.object({
  query: z.string().min(1),
  filters: z.object({
    thesisId: z.string().uuid().optional(),
    pillarId: z.string().optional(),
    minQuality: z.number().min(0).max(1).optional(),
    sourceType: z.string().optional(),
  }).optional(),
  limit: z.number().min(1).max(100).default(10),
});

type SearchEvidenceRequest = FastifyRequest<{
  Body: z.infer<typeof SearchEvidenceBody>;
}>;

export async function evidenceRoutes(fastify: FastifyInstance) {
  // POST /api/evidence/search
  fastify.post<{ Body: z.infer<typeof SearchEvidenceBody> }>(
    '/search',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            query: { type: 'string', minLength: 1 },
            filters: {
              type: 'object',
              properties: {
                thesisId: { type: 'string', format: 'uuid' },
                pillarId: { type: 'string' },
                minQuality: { type: 'number', minimum: 0, maximum: 1 },
                sourceType: { type: 'string' }
              }
            },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          },
          required: ['query']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              results: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    evidenceId: { type: 'string' },
                    content: { type: 'string' },
                    similarity: { type: 'number' },
                    source: { type: 'object' },
                    qualityScore: { type: 'object' },
                  },
                },
              },
              count: { type: 'number' },
              query: { type: 'string' },
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
    async (request: SearchEvidenceRequest, reply: FastifyReply) => {
      try {
        const { query, filters = {}, limit } = request.body;

        // Generate embedding for the query
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: query,
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Perform similarity search using the match_evidence function
        const { data, error } = await supabase.rpc('match_evidence', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit,
          filter_thesis_id: filters.thesisId || null,
          filter_pillar_id: filters.pillarId || null,
          filter_min_quality: filters.minQuality || null,
          filter_source_type: filters.sourceType || null,
        });

        if (error) {
          fastify.log.error({ error }, 'Failed to search evidence');
          return reply.status(500).send({
            error: 'Failed to search evidence',
          });
        }

        // If we have evidence IDs, fetch the full evidence objects
        // For now, we'll return the search results directly
        const results = (data || []).map((item: any) => ({
          evidenceId: item.evidence_id,
          pillarId: item.pillar_id,
          similarity: item.similarity,
          source: {
            url: item.source_url,
            type: item.source_type,
          },
          qualityScore: {
            overall: item.quality_score,
          },
        }));

        return reply.send({
          results,
          count: results.length,
          query,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to search evidence');
        
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Invalid request data',
            details: error.errors,
          });
        }

        return reply.status(500).send({
          error: 'Failed to search evidence',
        });
      }
    }
  );

  // GET /api/evidence/:id
  fastify.get<{ Params: { id: string } }>(
    '/:id',
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
              evidence: { type: 'object' },
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
    async (request, reply) => {
      try {
        // const { id } = request.params;

        // For now, return a not found error
        // In a full implementation, this would fetch from a evidence table
        return reply.status(404).send({
          error: 'Evidence lookup not yet implemented',
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to get evidence');
        return reply.status(500).send({
          error: 'Failed to get evidence',
        });
      }
    }
  );
}