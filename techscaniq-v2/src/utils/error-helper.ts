/**
 * Error handling utilities with recovery suggestions
 */

export interface EnhancedError {
  message: string;
  suggestion?: string;
  isRetryable: boolean;
  errorType: 'api' | 'network' | 'validation' | 'configuration' | 'unknown';
}

/**
 * Enhance error messages with actionable recovery suggestions
 */
export function enhanceErrorMessage(error: any): string {
  const baseMessage = error.message || 'Unknown error';

  const suggestions: Record<string, string> = {
    'temperature': 'Try using default model parameters or a different model',
    'rate_limit': 'Implement exponential backoff or reduce request frequency',
    'timeout': 'Increase timeout or break operation into smaller chunks',
    'model': 'Fallback to a different model (gpt-4, gpt-3.5-turbo)',
    'api_key': 'Check API key configuration and permissions',
    'network': 'Check network connectivity and retry',
    'econnrefused': 'Service may be down, try again later',
    'invalid_request': 'Check request parameters and format',
    'context_length': 'Reduce input size or use a model with larger context window',
    'insufficient_quota': 'Check API usage limits and billing',
  };

  const suggestion = Object.entries(suggestions).find(([key]) => 
    baseMessage.toLowerCase().includes(key)
  )?.[1];

  return suggestion 
    ? `${baseMessage}\nSuggestion: ${suggestion}`
    : baseMessage;
}

/**
 * Analyze error and provide structured information
 */
export function analyzeError(error: any): EnhancedError {
  const message = error.message || 'Unknown error';
  const lowerMessage = message.toLowerCase();

  // Determine error type
  let errorType: EnhancedError['errorType'] = 'unknown';
  if (lowerMessage.includes('api') || lowerMessage.includes('rate') || lowerMessage.includes('quota')) {
    errorType = 'api';
  } else if (lowerMessage.includes('network') || lowerMessage.includes('econnrefused') || lowerMessage.includes('timeout')) {
    errorType = 'network';
  } else if (lowerMessage.includes('invalid') || lowerMessage.includes('validation')) {
    errorType = 'validation';
  } else if (lowerMessage.includes('config') || lowerMessage.includes('key') || lowerMessage.includes('auth')) {
    errorType = 'configuration';
  }

  // Determine if retryable
  const retryablePatterns = [
    'rate limit',
    'timeout',
    'network',
    'econnreset',
    'econnrefused',
    'temporary',
    '429',
    '503',
    '504',
  ];
  
  const isRetryable = retryablePatterns.some(pattern => lowerMessage.includes(pattern));

  return {
    message: enhanceErrorMessage(error),
    suggestion: getSuggestionForErrorType(errorType),
    isRetryable,
    errorType,
  };
}

/**
 * Get general suggestion based on error type
 */
function getSuggestionForErrorType(errorType: EnhancedError['errorType']): string {
  const suggestions = {
    'api': 'Check API limits, implement rate limiting, or use fallback providers',
    'network': 'Verify network connectivity and implement retry logic',
    'validation': 'Review input parameters and ensure they meet requirements',
    'configuration': 'Verify configuration settings and API credentials',
    'unknown': 'Check logs for more details and contact support if issue persists',
  };

  return suggestions[errorType];
}

/**
 * Create a user-friendly error message for reporting
 */
export function createUserFriendlyError(error: any): string {
  const analysis = analyzeError(error);
  
  const lines = [
    '❌ An error occurred during processing:',
    '',
    `Error: ${error.message || 'Unknown error'}`,
  ];

  if (analysis.suggestion) {
    lines.push('', `💡 ${analysis.suggestion}`);
  }

  if (analysis.isRetryable) {
    lines.push('', '🔄 This error may be temporary. The system will attempt to retry.');
  }

  return lines.join('\n');
}

/**
 * Log error with context for debugging
 */
export function logErrorWithContext(
  error: any,
  context: {
    operation: string;
    phase?: string;
    data?: any;
  }
): void {
  const analysis = analyzeError(error);
  
  console.error(`
=== ERROR REPORT ===
Operation: ${context.operation}
Phase: ${context.phase || 'unknown'}
Error Type: ${analysis.errorType}
Retryable: ${analysis.isRetryable}

Error Details:
${error.stack || error.message || error}

Context Data:
${context.data ? JSON.stringify(context.data, null, 2) : 'None'}

Suggestion: ${analysis.suggestion || 'None'}
==================
`);
}