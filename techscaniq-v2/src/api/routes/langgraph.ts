import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../../services/storage';
import { runIntegratedResearch } from '../../orchestrator/langgraph-integrated';
import { config } from '../../config';

// Request/Response schemas
const GenerateReportBody = z.object({
  company: z.string().min(1),
  website: z.string().url(),
  reportType: z.enum(['sales-intelligence', 'pe-due-diligence']),
  vendorContext: z.object({
    vendor: z.string(),
    products: z.array(z.string()).optional(),
    useCase: z.string().optional(),
  }).optional(),
  thesisContext: z.object({
    investmentThesis: z.string().optional(),
    keyQuestions: z.array(z.string()).optional(),
    focusAreas: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ReportStatusParams = z.object({
  id: z.string().uuid(),
});

const GetReportParams = z.object({
  id: z.string().uuid(),
});

type GenerateReportRequest = FastifyRequest<{
  Body: z.infer<typeof GenerateReportBody>;
}>;

type ReportStatusRequest = FastifyRequest<{
  Params: z.infer<typeof ReportStatusParams>;
}>;

type GetReportRequest = FastifyRequest<{
  Params: z.infer<typeof GetReportParams>;
}>;

export async function langgraphRoutes(fastify: FastifyInstance) {
  const storage = new StorageService();

  // POST /api/langgraph/generate
  fastify.post<{ Body: z.infer<typeof GenerateReportBody> }>(
    '/generate',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            company: { type: 'string', minLength: 1 },
            website: { type: 'string', format: 'uri' },
            reportType: { 
              type: 'string', 
              enum: ['sales-intelligence', 'pe-due-diligence'] 
            },
            vendorContext: { 
              type: 'object',
              properties: {
                vendor: { type: 'string' },
                products: { type: 'array', items: { type: 'string' } },
                useCase: { type: 'string' }
              }
            },
            thesisContext: {
              type: 'object',
              properties: {
                investmentThesis: { type: 'string' },
                keyQuestions: { type: 'array', items: { type: 'string' } },
                focusAreas: { type: 'array', items: { type: 'string' } }
              }
            },
            metadata: { type: 'object' }
          },
          required: ['company', 'website', 'reportType']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              reportId: { type: 'string' },
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
    async (request: GenerateReportRequest, reply: FastifyReply) => {
      try {
        const { company, website, reportType, vendorContext, thesisContext, metadata } = request.body;

        // Generate report ID
        const reportId = uuidv4();

        // Create custom thesis based on report type
        let customThesis = '';
        if (reportType === 'sales-intelligence' && vendorContext) {
          customThesis = `${vendorContext.vendor} can help ${company} accelerate their digital transformation with ${vendorContext.products?.join(', ') || 'our solutions'}`;
        } else if (reportType === 'pe-due-diligence' && thesisContext) {
          customThesis = thesisContext.investmentThesis || `Evaluate ${company} as a potential private equity investment opportunity`;
        }

        // Save initial state
        const initialState = {
          reportId,
          company,
          website,
          reportType,
          status: 'processing',
          createdAt: new Date(),
          metadata: {
            ...metadata,
            vendorContext,
            thesisContext,
          }
        };

        await storage.saveLangGraphReport(reportId, initialState);

        // Start the LangGraph pipeline asynchronously
        fastify.log.info({ reportId, company, reportType }, 'Starting LangGraph pipeline');
        
        runIntegratedResearch(
          company,
          website,
          reportType,
          {
            ...metadata,
            reportId,
            vendorContext,
            thesisContext,
            customThesis,
            // Add callback for status updates
            onStatusUpdate: async (status: string, data?: any) => {
              fastify.log.info({ reportId, status, data }, 'LangGraph status update');
              await storage.saveLangGraphReport(reportId, {
                ...initialState,
                status,
                currentPhase: status,
                evidenceCount: data?.evidenceCount || 0,
                updatedAt: new Date(),
              });
            }
          }
        ).then(async (result: any) => {
          fastify.log.info({ reportId, evidenceCount: result.evidence?.length }, 'LangGraph pipeline completed');
          // Update the report with results
          await storage.saveLangGraphReport(reportId, {
            ...initialState,
            ...result,
            status: 'completed',
            completedAt: new Date(),
          });
        }).catch(async (error: any) => {
          fastify.log.error({ error, reportId }, 'LangGraph pipeline failed');
          await storage.saveLangGraphReport(reportId, {
            ...initialState,
            status: 'failed',
            error: error.message,
            completedAt: new Date(),
          });
        });

        return reply.send({
          reportId,
          status: 'processing',
          message: 'LangGraph report generation started',
          estimatedTime: reportType === 'sales-intelligence' ? '30-60 minutes' : '45-90 minutes',
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to start report generation');
        
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Invalid request data',
            details: error.errors,
          });
        }

        return reply.status(500).send({
          error: 'Failed to start report generation',
        });
      }
    }
  );

  // GET /api/langgraph/:id/status
  fastify.get<{ Params: z.infer<typeof ReportStatusParams> }>(
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
              reportId: { type: 'string' },
              status: { type: 'string' },
              progress: { type: 'number' },
              currentPhase: { type: 'string' },
              evidenceCount: { type: 'number' },
              lastUpdated: { type: 'string' },
              estimatedTimeRemaining: { type: 'string' },
              error: { type: 'string' },
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
    async (request: ReportStatusRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Load report state
        const report = await storage.loadLangGraphReport(id);
        
        if (!report) {
          return reply.status(404).send({
            error: 'Report not found',
          });
        }

        // Calculate progress based on status
        const progressMap: Record<string, number> = {
          'processing': 10,
          'interpreting_thesis': 20,
          'gathering_evidence': 50,
          'evaluating_quality': 70,
          'generating_report': 90,
          'completed': 100,
          'failed': 0,
        };

        const progress = progressMap[report.status] || 0;
        const currentPhase = report.status === 'failed' ? 'Error' : report.status;

        return reply.send({
          reportId: id,
          status: report.status,
          progress,
          currentPhase,
          evidenceCount: report.evidence?.length || 0,
          lastUpdated: report.updatedAt?.toISOString() || report.createdAt.toISOString(),
          estimatedTimeRemaining: report.status === 'completed' ? 'Complete' : 
                                 report.status === 'failed' ? 'Failed' : 
                                 `${Math.round((100 - progress) * 0.6)} minutes`,
          error: report.error,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to get report status');
        return reply.status(500).send({
          error: 'Failed to get report status',
        });
      }
    }
  );

  // GET /api/langgraph/:id
  fastify.get<{ Params: z.infer<typeof GetReportParams> }>(
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
              reportId: { type: 'string' },
              company: { type: 'string' },
              website: { type: 'string' },
              reportType: { type: 'string' },
              thesis: { type: 'object' },
              evidence: { type: 'array' },
              report: { type: 'object' },
              metadata: { type: 'object' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
              completedAt: { type: 'string' },
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
              progress: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: GetReportRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        // Load report
        const report = await storage.loadLangGraphReport(id);
        
        if (!report) {
          return reply.status(404).send({
            error: 'Report not found',
          });
        }

        // Check if report is ready
        if (report.status !== 'completed') {
          const progressMap: Record<string, number> = {
            'processing': 10,
            'interpreting_thesis': 20,
            'gathering_evidence': 50,
            'evaluating_quality': 70,
            'generating_report': 90,
          };

          return reply.status(202).send({
            message: 'Report is still being generated',
            status: report.status,
            progress: progressMap[report.status] || 0,
          });
        }

        return reply.send({
          reportId: id,
          company: report.company,
          website: report.website,
          reportType: report.reportType,
          thesis: report.thesis,
          evidence: report.evidence,
          report: report.report,
          metadata: report.metadata,
          status: report.status,
          createdAt: report.createdAt.toISOString(),
          completedAt: report.completedAt?.toISOString(),
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to get report');
        return reply.status(500).send({
          error: 'Failed to get report',
        });
      }
    }
  );

  // GET /api/langgraph/list
  fastify.get(
    '/list',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            reportType: { type: 'string', enum: ['sales-intelligence', 'pe-due-diligence'] },
            status: { type: 'string', enum: ['processing', 'completed', 'failed'] },
            limit: { type: 'number', minimum: 1, maximum: 100 },
            offset: { type: 'number', minimum: 0 },
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              reports: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    reportId: { type: 'string' },
                    company: { type: 'string' },
                    reportType: { type: 'string' },
                    status: { type: 'string' },
                    createdAt: { type: 'string' },
                    completedAt: { type: 'string' },
                  }
                }
              },
              total: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { reportType, status, limit = 20, offset = 0 } = request.query as any;
        
        // List reports with filters
        const reports = await storage.listLangGraphReports();
        
        // Apply filters
        let filteredReports = reports;
        if (reportType) {
          filteredReports = filteredReports.filter(r => r.reportType === reportType);
        }
        if (status) {
          filteredReports = filteredReports.filter(r => r.status === status);
        }
        
        // Apply pagination
        const total = filteredReports.length;
        const paginatedReports = filteredReports.slice(offset, offset + limit);

        return reply.send({
          reports: paginatedReports.map((r: any) => ({
            reportId: r.id,
            company: r.company,
            reportType: r.reportType,
            status: r.status,
            createdAt: r.createdAt,
            completedAt: r.completedAt,
          })),
          total,
        });
      } catch (error) {
        fastify.log.error({ error }, 'Failed to list reports');
        return reply.status(500).send({
          error: 'Failed to list reports',
        });
      }
    }
  );
}