/**
 * Resilience configuration for the pipeline
 * Allows fine-tuning of retry, circuit breaker, and fallback behaviors
 */

export interface ResilienceConfig {
  // Retry settings
  retry: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  
  // Circuit breaker settings
  circuitBreaker: {
    threshold: number;
    timeout: number;
    resetTimeout: number;
  };
  
  // Health check settings
  healthCheck: {
    minEvidenceCount: number;
    maxEvidenceCount: number;
    degradedThreshold: number;
  };
  
  // Fallback settings
  fallback: {
    enableHeuristicAnalysis: boolean;
    enableModelFallback: boolean;
    fallbackModels: string[];
  };
  
  // Monitoring settings
  monitoring: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    metricsEnabled: boolean;
  };
}

// Default configuration - balanced for production use
export const defaultResilienceConfig: ResilienceConfig = {
  retry: {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffFactor: 2,
  },
  
  circuitBreaker: {
    threshold: 5,
    timeout: 60000, // 1 minute
    resetTimeout: 30000, // 30 seconds
  },
  
  healthCheck: {
    minEvidenceCount: 100,
    maxEvidenceCount: 2000,
    degradedThreshold: 500,
  },
  
  fallback: {
    enableHeuristicAnalysis: true,
    enableModelFallback: true,
    fallbackModels: ['gpt-4', 'gpt-3.5-turbo'],
  },
  
  monitoring: {
    enabled: true,
    logLevel: 'info',
    metricsEnabled: true,
  },
};

// Strict mode - fails fast, no fallbacks
export const strictResilienceConfig: ResilienceConfig = {
  retry: {
    maxRetries: 1,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
  },
  
  circuitBreaker: {
    threshold: 3,
    timeout: 30000,
    resetTimeout: 60000,
  },
  
  healthCheck: {
    minEvidenceCount: 500,
    maxEvidenceCount: 2000,
    degradedThreshold: 1000,
  },
  
  fallback: {
    enableHeuristicAnalysis: false,
    enableModelFallback: false,
    fallbackModels: [],
  },
  
  monitoring: {
    enabled: true,
    logLevel: 'error',
    metricsEnabled: true,
  },
};

// Lenient mode - maximum resilience, always delivers results
export const lenientResilienceConfig: ResilienceConfig = {
  retry: {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 60000,
    backoffFactor: 1.5,
  },
  
  circuitBreaker: {
    threshold: 10,
    timeout: 120000,
    resetTimeout: 10000,
  },
  
  healthCheck: {
    minEvidenceCount: 10,
    maxEvidenceCount: 5000,
    degradedThreshold: 50,
  },
  
  fallback: {
    enableHeuristicAnalysis: true,
    enableModelFallback: true,
    fallbackModels: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-32k'],
  },
  
  monitoring: {
    enabled: true,
    logLevel: 'debug',
    metricsEnabled: true,
  },
};

// Development mode - verbose logging, quick failures for debugging
export const developmentResilienceConfig: ResilienceConfig = {
  retry: {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
  },
  
  circuitBreaker: {
    threshold: 3,
    timeout: 10000,
    resetTimeout: 5000,
  },
  
  healthCheck: {
    minEvidenceCount: 50,
    maxEvidenceCount: 1000,
    degradedThreshold: 200,
  },
  
  fallback: {
    enableHeuristicAnalysis: true,
    enableModelFallback: true,
    fallbackModels: ['gpt-4', 'gpt-3.5-turbo'],
  },
  
  monitoring: {
    enabled: true,
    logLevel: 'debug',
    metricsEnabled: true,
  },
};

// Get configuration based on environment
export function getResilienceConfig(mode?: 'default' | 'strict' | 'lenient' | 'development'): ResilienceConfig {
  const configMode = mode || process.env.RESILIENCE_MODE || 'default';
  
  switch (configMode) {
    case 'strict':
      return strictResilienceConfig;
    case 'lenient':
      return lenientResilienceConfig;
    case 'development':
      return developmentResilienceConfig;
    default:
      return defaultResilienceConfig;
  }
}