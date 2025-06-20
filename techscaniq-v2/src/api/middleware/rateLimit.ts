import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface RateLimitOptions {
  max: number; // Maximum requests
  window: number; // Time window in seconds
  keyGenerator?: (req: any) => string; // Function to generate rate limit key
}

export function createRateLimiter(redis: Redis | null, options: RateLimitOptions) {
  const { max, window, keyGenerator } = options;

  return async function rateLimitMiddleware(request: any, reply: any) {
    // If Redis is not available, skip rate limiting
    if (!redis) {
      return;
    }
    try {
      // Generate rate limit key
      const key = keyGenerator
        ? keyGenerator(request)
        : `ratelimit:${request.ip}`;

      // Get current count
      const current = await redis.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, window);
      }

      // Get TTL for headers
      const ttl = await redis.ttl(key);

      // Set rate limit headers
      reply.header('X-RateLimit-Limit', max);
      reply.header('X-RateLimit-Remaining', Math.max(0, max - current));
      reply.header('X-RateLimit-Reset', new Date(Date.now() + ttl * 1000).toISOString());

      // Check if limit exceeded
      if (current > max) {
        return reply.status(429).send({
          error: 'Too many requests',
          retryAfter: ttl,
        });
      }
    } catch (error) {
      request.log.error({ error }, 'Rate limit error');
      // Don't block request on rate limit errors
    }
  };
}

// Preset rate limiters
export const rateLimiters = {
  // Strict limit for expensive operations
  strict: (redis: Redis | null) => createRateLimiter(redis, {
    max: 10,
    window: 3600, // 1 hour
  }),

  // Standard limit for API calls
  standard: (redis: Redis | null) => createRateLimiter(redis, {
    max: 100,
    window: 3600, // 1 hour
  }),

  // Relaxed limit for read operations
  relaxed: (redis: Redis | null) => createRateLimiter(redis, {
    max: 1000,
    window: 3600, // 1 hour
  }),

  // Per-user rate limiting
  perUser: (redis: Redis | null) => createRateLimiter(redis, {
    max: 50,
    window: 3600, // 1 hour
    keyGenerator: (req) => `ratelimit:user:${req.user?.id || req.ip}`,
  }),

  // Per-API key rate limiting
  perApiKey: (redis: Redis | null) => createRateLimiter(redis, {
    max: 500,
    window: 3600, // 1 hour
    keyGenerator: (req) => `ratelimit:apikey:${req.headers['x-api-key'] || req.ip}`,
  }),
};