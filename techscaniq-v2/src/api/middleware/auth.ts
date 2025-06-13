import { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

// Bearer token authentication
export async function verifyBearerToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({
        error: 'Invalid or expired token',
      });
    }

    // Attach user to request
    request.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user',
    };

  } catch (error) {
    request.log.error({ error }, 'Authentication error');
    return reply.status(401).send({
      error: 'Authentication failed',
    });
  }
}

// API key authentication (for service-to-service)
export async function verifyApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const apiKey = request.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return reply.status(401).send({
        error: 'Missing API key',
      });
    }

    // In production, you would validate against stored API keys
    // For now, we'll use a simple check
    const validApiKey = process.env.API_KEY || 'demo-api-key';
    
    if (apiKey !== validApiKey) {
      return reply.status(401).send({
        error: 'Invalid API key',
      });
    }

    // Set a service user
    request.user = {
      id: 'service',
      email: 'service@techscaniq.com',
      role: 'service',
    };

  } catch (error) {
    request.log.error({ error }, 'API key authentication error');
    return reply.status(401).send({
      error: 'Authentication failed',
    });
  }
}

// Optional auth - doesn't fail if no auth provided
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  const apiKey = request.headers['x-api-key'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    await verifyBearerToken(request, reply);
  } else if (apiKey) {
    await verifyApiKey(request, reply);
  }
  // If no auth provided, continue without user
}