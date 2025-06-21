/**
 * Retry utility with exponential backoff
 * Provides resilient operation execution with configurable retry behavior
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryIf?: (error: any) => boolean;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryIf = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!retryIf(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Determines if an error is retryable based on common patterns
 */
export function isRetryableError(error: any): boolean {
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Retryable error patterns
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'network',
    'econnreset',
    'econnrefused',
    'enotfound',
    'temporary',
    'too many requests',
    '429',
    '503',
    '504',
  ];
  
  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Enhanced retry specifically for AI model invocations
 */
export async function retryModelInvocation<T>(
  operation: () => Promise<T>,
  modelName: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  return retryWithBackoff(operation, {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffFactor: 2.5,
    retryIf: (error) => {
      const message = error.message?.toLowerCase() || '';
      
      // Non-retryable errors
      if (message.includes('invalid api key') || 
          message.includes('authentication') ||
          message.includes('unauthorized')) {
        return false;
      }
      
      // Always retry rate limits and timeouts
      if (message.includes('rate limit') || 
          message.includes('timeout') ||
          message.includes('429')) {
        console.log(`${modelName}: Retrying due to rate limit/timeout`);
        return true;
      }
      
      // Retry network errors
      return isRetryableError(error);
    },
    ...options
  });
}