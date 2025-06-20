import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Redis } from 'ioredis';
import { config } from '../config';
import { researchRoutes } from './routes/research';
import { evidenceRoutes } from './routes/evidence';
import { langgraphRoutes } from './routes/langgraph';
import { verifyBearerToken, optionalAuth } from './middleware/auth';
import { rateLimiters } from './middleware/rateLimit';

// Initialize Redis for rate limiting
let redis: Redis | null = null;

if (!config.DISABLE_RATE_LIMITING) {
  try {
    if (config.REDIS_URL) {
      redis = new Redis(config.REDIS_URL);
    } else {
      redis = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis connection failed after 3 attempts. Rate limiting disabled.');
            return null;
          }
          return Math.min(times * 50, 2000);
        },
      });
    }
    
    redis.on('error', (err: any) => {
      console.warn('Redis connection error:', err.message);
      if (err.code === 'ECONNREFUSED' || err.syscall === 'connect') {
        console.warn('Redis not available. Rate limiting disabled.');
        redis = null;
      }
    });
  } catch (error) {
    console.warn('Failed to initialize Redis:', error);
    redis = null;
  }
}

// Create Fastify instance
const fastify = Fastify({
  logger: true,
  trustProxy: true, // For proper IP detection behind proxies
});

// Register plugins
fastify.register(cors, {
  origin: config.NODE_ENV === 'development' ? true : [
    'https://techscaniq.com',
    'https://app.techscaniq.com',
    'https://scan.techscaniq.com',
  ],
  credentials: true,
});

// Register Swagger for API documentation
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'TechScanIQ API',
      description: 'Deep Research Agent Platform for PE Due Diligence',
      version: '2.0.0',
    },
    host: `${config.API_HOST}:${config.API_PORT}`,
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'health', description: 'Health check endpoints' },
      { name: 'research', description: 'Research management endpoints' },
      { name: 'evidence', description: 'Evidence search endpoints' },
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'Bearer token authentication',
      },
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key authentication',
      },
    },
  },
});

// Register Swagger UI
fastify.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
});

// Health check route (no auth required)
fastify.get('/api/health', {
  schema: {
    tags: ['health'],
    summary: 'Health check endpoint',
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string' },
          version: { type: 'string' },
          uptime: { type: 'number' },
        },
      },
    },
  },
}, async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
  };
});

// Register route groups with authentication
fastify.register(async function (fastify) {
  // Add rate limiting if Redis is available
  if (redis) {
    fastify.addHook('onRequest', rateLimiters.standard(redis));
  }
  
  // Research routes - require authentication
  fastify.register(async function (fastify) {
    // TEMPORARILY DISABLED FOR TESTING
    // fastify.addHook('onRequest', verifyBearerToken);
    if (redis) {
      // fastify.addHook('onRequest', rateLimiters.perUser(redis));
    }
    fastify.register(researchRoutes, { prefix: '/research' });
  }, { prefix: '/api' });

  // Evidence routes - optional authentication
  fastify.register(async function (fastify) {
    fastify.addHook('onRequest', optionalAuth);
    if (redis) {
      fastify.addHook('onRequest', rateLimiters.relaxed(redis));
    }
    fastify.register(evidenceRoutes, { prefix: '/evidence' });
  }, { prefix: '/api' });

  // LangGraph routes - require authentication 
  fastify.register(async function (fastify) {
    // TEMPORARILY DISABLED FOR TESTING
    // fastify.addHook('onRequest', verifyBearerToken);
    if (redis) {
      fastify.addHook('onRequest', rateLimiters.perUser(redis));
    }
    fastify.register(langgraphRoutes, { prefix: '/langgraph' });
  }, { prefix: '/api' });
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({ error }, 'Request error');
  
  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation error',
      details: error.validation,
    });
  }
  
  // Handle CORS errors
  if (error.message === 'Not allowed by CORS') {
    return reply.status(403).send({
      error: 'CORS policy violation',
    });
  }
  
  // Default error response
  return reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal server error',
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  
  try {
    await fastify.close();
    if (redis) {
      await redis.quit();
    }
    process.exit(0);
  } catch (error) {
    fastify.log.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
export async function startServer() {
  try {
    await fastify.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    });
    
    fastify.log.info(`Server running on http://${config.API_HOST}:${config.API_PORT}`);
    fastify.log.info(`API documentation available at http://${config.API_HOST}:${config.API_PORT}/documentation`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Export fastify instance for testing
export { fastify };

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}