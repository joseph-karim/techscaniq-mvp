/**
 * Test suite for pipeline resilience features
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retryWithBackoff, isRetryableError } from '../utils/retry';
import { CircuitBreaker, CircuitBreakerRegistry } from '../utils/circuit-breaker';
import { enhanceErrorMessage, analyzeError } from '../utils/error-helper';
import { PipelineMonitor } from '../utils/pipeline-monitor';

describe('Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retry operation on failure', async () => {
    let attempts = 0;
    const operation = jest.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    });

    const result = await retryWithBackoff(operation, {
      maxRetries: 3,
      initialDelay: 10,
    });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should not retry non-retryable errors', async () => {
    const operation = jest.fn(async () => {
      throw new Error('Invalid API key');
    });

    await expect(
      retryWithBackoff(operation, {
        maxRetries: 3,
        retryIf: (error) => !error.message.includes('API key'),
      })
    ).rejects.toThrow('Invalid API key');

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should identify retryable errors correctly', () => {
    expect(isRetryableError(new Error('rate limit exceeded'))).toBe(true);
    expect(isRetryableError(new Error('network timeout'))).toBe(true);
    expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
    expect(isRetryableError(new Error('Invalid API key'))).toBe(false);
  });
});

describe('Circuit Breaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-breaker', {
      threshold: 3,
      timeout: 1000,
      resetTimeout: 500,
    });
  });

  it('should open after threshold failures', async () => {
    const failingOp = jest.fn(async () => {
      throw new Error('Service unavailable');
    });

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingOp)).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('OPEN');

    // Should reject without calling operation
    await expect(breaker.execute(failingOp)).rejects.toThrow('Circuit breaker test-breaker is OPEN');
    expect(failingOp).toHaveBeenCalledTimes(3); // Not 4
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    const operation = jest.fn(async () => {
      throw new Error('Failure');
    });

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(operation)).rejects.toThrow();
    }

    expect(breaker.getState()).toBe('OPEN');

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 600));

    // Should be able to try again (HALF_OPEN)
    const successOp = jest.fn(async () => 'success');
    await expect(breaker.execute(successOp)).resolves.toBe('success');
  });
});

describe('Error Enhancement', () => {
  it('should enhance error messages with suggestions', () => {
    const tempError = new Error('temperature must be between 0 and 2');
    const enhanced = enhanceErrorMessage(tempError);
    expect(enhanced).toContain('Try using default model parameters');

    const rateError = new Error('Rate limit exceeded');
    const enhancedRate = enhanceErrorMessage(rateError);
    expect(enhancedRate).toContain('exponential backoff');
  });

  it('should analyze errors correctly', () => {
    const apiError = new Error('API rate limit exceeded');
    const analysis = analyzeError(apiError);
    
    expect(analysis.errorType).toBe('api');
    expect(analysis.isRetryable).toBe(true);
    expect(analysis.suggestion).toContain('rate limiting');

    const authError = new Error('Invalid API key');
    const authAnalysis = analyzeError(authError);
    
    expect(authAnalysis.errorType).toBe('configuration');
    expect(authAnalysis.isRetryable).toBe(false);
  });
});

describe('Pipeline Monitor', () => {
  let monitor: PipelineMonitor;

  beforeEach(() => {
    monitor = PipelineMonitor.getInstance();
    monitor.reset();
  });

  it('should track phase metrics', () => {
    monitor.startPhase('test-phase');
    
    // Simulate some work
    monitor.recordError('test-phase', 'Test error');
    monitor.recordRetry('test-phase');
    monitor.recordFallback('test-phase');
    
    monitor.endPhase('test-phase', 'degraded', 100);

    const health = monitor.getHealth();
    const phase = health.phases.get('test-phase');

    expect(phase).toBeDefined();
    expect(phase?.status).toBe('degraded');
    expect(phase?.evidenceCount).toBe(100);
    expect(phase?.errors.length).toBe(1);
    expect(phase?.retries).toBe(1);
    expect(phase?.fallbacks).toBe(1);
  });

  it('should determine overall health correctly', () => {
    monitor.startPhase('phase1');
    monitor.endPhase('phase1', 'completed');

    monitor.startPhase('phase2');
    monitor.recordError('phase2', 'Error 1');
    monitor.recordError('phase2', 'Error 2');
    monitor.endPhase('phase2', 'degraded');

    const health = monitor.getHealth();
    expect(health.overallStatus).toBe('degraded');
    expect(health.totalErrors).toBe(2);
  });

  it('should generate comprehensive report', () => {
    monitor.startPhase('research');
    monitor.recordError('research', 'Network timeout');
    monitor.recordRetry('research');
    monitor.endPhase('research', 'completed', 500);

    const report = monitor.generateReport();
    
    expect(report).toContain('Pipeline Health Report');
    expect(report).toContain('research:');
    expect(report).toContain('Evidence: 500 pieces');
    expect(report).toContain('Network timeout');
    expect(report).toContain('Retries: 1');
  });
});

describe('Integration Tests', () => {
  it('should handle cascading failures gracefully', async () => {
    const monitor = PipelineMonitor.getInstance();
    monitor.reset();

    // Simulate a phase with multiple failure types
    monitor.startPhase('complex-phase');

    // Simulate retries
    const retryOp = jest.fn(async () => {
      monitor.recordRetry('complex-phase');
      throw new Error('Temporary failure');
    });

    try {
      await retryWithBackoff(retryOp, {
        maxRetries: 2,
        initialDelay: 10,
      });
    } catch (error: any) {
      monitor.recordError('complex-phase', error.message);
    }

    // Simulate fallback
    monitor.recordFallback('complex-phase');
    monitor.endPhase('complex-phase', 'degraded', 50);

    const health = monitor.getHealth();
    const phase = health.phases.get('complex-phase');

    expect(phase?.retries).toBe(2);
    expect(phase?.fallbacks).toBe(1);
    expect(phase?.errors.length).toBe(1);
    expect(phase?.status).toBe('degraded');
  });
});

// Mock implementations for testing
jest.mock('../tools/webSearch', () => ({
  WebSearchTool: jest.fn().mockImplementation(() => ({
    search: jest.fn().mockResolvedValue({ results: [] }),
  })),
}));

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({ content: 'Mock response' }),
  })),
}));