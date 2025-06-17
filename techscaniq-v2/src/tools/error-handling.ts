import { logger } from '../utils/logger';

// Error types
export class ResearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public source: string,
    public retryable: boolean = false,
    public fallbackService?: string
  ) {
    super(message);
    this.name = 'ResearchError';
  }
}

export class APIError extends ResearchError {
  constructor(
    message: string,
    public statusCode: number,
    source: string,
    public retryAfter?: number
  ) {
    const retryable = statusCode >= 500 || statusCode === 429;
    super(message, `API_${statusCode}`, source, retryable);
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
};

// Service-specific retry configs
export const SERVICE_RETRY_CONFIGS: Record<string, RetryConfig> = {
  perplexity: {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2
  },
  crawl4ai: {
    maxRetries: 2,
    initialDelay: 5000,
    maxDelay: 30000,
    backoffMultiplier: 1.5
  },
  skyvern: {
    maxRetries: 1,
    initialDelay: 10000,
    maxDelay: 30000,
    backoffMultiplier: 1
  }
};

// Fallback chain configuration
export const FALLBACK_CHAINS: Record<string, string[]> = {
  'perplexity-sonar': ['perplexity-pro', 'claude-web-search', 'serp-api'],
  'crawl4ai': ['playwright-crawler', 'puppeteer-crawler', 'jina-reader'],
  'skyvern': ['selenium-automation', 'manual-discovery'],
  'public-data': ['sec-edgar', 'crunchbase', 'pitchbook']
};

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (error instanceof ResearchError && !error.retryable) {
        throw error;
      }

      // Handle rate limit with specific delay
      if (error instanceof APIError && error.retryAfter) {
        delay = error.retryAfter * 1000;
      }

      // Log retry attempt
      logger.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        delay
      });

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error as Error);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Calculate next delay with backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000,
    private halfOpenRequests: number = 3
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open' && Date.now() - this.lastFailureTime > this.resetTimeout) {
      this.state = 'half-open';
      this.failures = 0;
    }

    // Reject if circuit is open
    if (this.state === 'open') {
      throw new ResearchError(
        'Circuit breaker is open - service temporarily unavailable',
        'CIRCUIT_OPEN',
        'circuit-breaker',
        true
      );
    }

    try {
      const result = await fn();
      
      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.error('Circuit breaker opened due to excessive failures', {
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Service health monitor
export class ServiceHealthMonitor {
  private metrics: Map<string, ServiceMetrics> = new Map();

  recordSuccess(service: string, latency: number) {
    const metrics = this.getOrCreateMetrics(service);
    metrics.successCount++;
    metrics.totalRequests++;
    metrics.averageLatency = 
      (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;
    metrics.lastSuccessTime = Date.now();
  }

  recordFailure(service: string, error: Error) {
    const metrics = this.getOrCreateMetrics(service);
    metrics.failureCount++;
    metrics.totalRequests++;
    metrics.lastError = error.message;
    metrics.lastFailureTime = Date.now();
  }

  getHealth(service: string): ServiceHealth {
    const metrics = this.metrics.get(service);
    if (!metrics) {
      return { status: 'unknown', uptime: 0, errorRate: 0 };
    }

    const errorRate = metrics.failureCount / metrics.totalRequests;
    const uptime = 1 - errorRate;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    if (errorRate < 0.05) {
      status = 'healthy';
    } else if (errorRate < 0.2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      uptime: uptime * 100,
      errorRate: errorRate * 100,
      averageLatency: metrics.averageLatency,
      lastError: metrics.lastError,
      lastFailureTime: metrics.lastFailureTime
    };
  }

  getAllHealth(): Record<string, ServiceHealth> {
    const health: Record<string, ServiceHealth> = {};
    this.metrics.forEach((_, service) => {
      health[service] = this.getHealth(service);
    });
    return health;
  }

  private getOrCreateMetrics(service: string): ServiceMetrics {
    if (!this.metrics.has(service)) {
      this.metrics.set(service, {
        successCount: 0,
        failureCount: 0,
        totalRequests: 0,
        averageLatency: 0,
        lastSuccessTime: 0,
        lastFailureTime: 0,
        lastError: ''
      });
    }
    return this.metrics.get(service)!;
  }
}

interface ServiceMetrics {
  successCount: number;
  failureCount: number;
  totalRequests: number;
  averageLatency: number;
  lastSuccessTime: number;
  lastFailureTime: number;
  lastError: string;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  uptime: number;
  errorRate: number;
  averageLatency?: number;
  lastError?: string;
  lastFailureTime?: number;
}

// Error handler factory
export function createErrorHandler(service: string, healthMonitor?: ServiceHealthMonitor) {
  return async function handleError(error: Error): Promise<void> {
    // Log error
    logger.error(`${service} error:`, {
      service,
      error: error.message,
      stack: error.stack
    });

    // Record failure in health monitor
    if (healthMonitor) {
      healthMonitor.recordFailure(service, error);
    }

    // Determine if error is retryable
    if (error instanceof APIError) {
      if (error.statusCode === 401) {
        logger.error(`${service}: Invalid API key or authentication`);
        // Could trigger notification to admins
      } else if (error.statusCode === 429) {
        logger.warn(`${service}: Rate limit exceeded, will retry after ${error.retryAfter}s`);
      } else if (error.statusCode >= 500) {
        logger.warn(`${service}: Server error, will retry`);
      }
    }
  };
}

// Fallback executor
export async function executeWithFallback<T>(
  primary: () => Promise<T>,
  fallbacks: Array<() => Promise<T>>,
  serviceName: string
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    logger.warn(`Primary service ${serviceName} failed, trying fallbacks`, {
      error: primaryError instanceof Error ? primaryError.message : 'Unknown error'
    });

    let lastError = primaryError;
    
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        logger.info(`Trying fallback ${i + 1} for ${serviceName}`);
        return await fallbacks[i]();
      } catch (fallbackError) {
        lastError = fallbackError;
        logger.warn(`Fallback ${i + 1} failed for ${serviceName}`, {
          error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        });
      }
    }

    throw lastError;
  }
}