# Pipeline Resilience Architecture

## Overview

This document describes the comprehensive resilience features implemented in the TechScanIQ pipeline following the DEV-003 requirements. The architecture ensures the pipeline can handle errors gracefully and continue providing value even in degraded conditions.

## Architecture Principles

### 1. **Fail Gracefully, Never Completely**
- Every critical operation has multiple fallback strategies
- Partial results are always better than no results
- Users are informed of degraded operations

### 2. **Progressive Enhancement**
- Start with the best possible approach
- Fall back to simpler methods when needed
- Always have a basic heuristic as final fallback

### 3. **Transparent Monitoring**
- Every phase is monitored and tracked
- Clear logging of all resilience actions
- Comprehensive health reports available

## Core Components

### 1. Retry Logic (`utils/retry.ts`)

**Purpose**: Handles transient failures with exponential backoff

**Features**:
- Configurable retry attempts and delays
- Exponential backoff to prevent overwhelming services
- Conditional retry based on error type
- Special handling for AI model invocations

**Usage Example**:
```typescript
const result = await retryWithBackoff(
  async () => await model.invoke(prompt),
  {
    maxRetries: 3,
    initialDelay: 2000,
    retryIf: (error) => !error.message.includes('api key')
  }
);
```

### 2. Circuit Breaker (`utils/circuit-breaker.ts`)

**Purpose**: Prevents cascading failures by stopping requests to failing services

**States**:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service is failing, requests are rejected immediately
- **HALF_OPEN**: Testing if service has recovered

**Features**:
- Automatic state transitions based on failure patterns
- Configurable thresholds and timeouts
- Global registry for all circuit breakers
- State change notifications

**Usage Example**:
```typescript
const breaker = CircuitBreakerRegistry.getBreaker('api-service');
try {
  const result = await breaker.execute(async () => 
    await apiService.call()
  );
} catch (error) {
  // Handle circuit open or operation failure
}
```

### 3. Error Enhancement (`utils/error-helper.ts`)

**Purpose**: Provides actionable error messages and recovery suggestions

**Features**:
- Analyzes errors to determine type and retryability
- Adds helpful suggestions for common errors
- Creates user-friendly error messages
- Comprehensive error logging with context

**Error Types**:
- `api`: API-related errors (rate limits, quotas)
- `network`: Network connectivity issues
- `validation`: Input validation errors
- `configuration`: Config/auth errors
- `unknown`: Unclassified errors

### 4. Heuristic Analysis Fallback

**Purpose**: Provides basic analysis when all AI models fail

**Features**:
- Pattern matching on collected evidence
- Technology keyword extraction
- Gap and opportunity identification
- Tool recommendations based on patterns

**Triggers**:
- All AI models fail (primary, fallback, safe parameters)
- Circuit breaker is open for model services
- Critical errors in model invocation

### 5. Pipeline Monitor (`utils/pipeline-monitor.ts`)

**Purpose**: Tracks pipeline health and performance metrics

**Metrics Tracked**:
- Phase duration and status
- Error counts and types
- Retry and fallback occurrences
- Evidence collection statistics
- Circuit breaker states

**Health Status Levels**:
- `healthy`: All systems operating normally
- `degraded`: Some failures but pipeline continues
- `critical`: Major failures affecting results

## Implementation Details

### Phase Health Checks

Before transitioning between phases, the pipeline performs health checks:

```typescript
interface PhaseHealth {
  phase: string;
  status: 'healthy' | 'degraded' | 'failed';
  evidenceCount: number;
  errors: string[];
  canProceed: boolean;
}
```

**Health Check Criteria**:
- Minimum evidence count threshold
- Required data fields present
- No critical errors in previous phase
- Circuit breakers not in OPEN state

### Error Handling Hierarchy

1. **Primary Attempt**: Use configured model and parameters
2. **Safe Parameters**: Retry with default temperature/settings
3. **Fallback Model**: Try alternative model (e.g., gpt-4)
4. **Heuristic Analysis**: Use pattern matching as last resort

### Example: Analysis Phase Resilience

```typescript
try {
  // Level 1: Primary model with circuit breaker
  analysis = await circuitBreaker.execute(async () => {
    return await retryModelInvocation(
      () => model.invoke(prompt),
      'primary-model',
      { maxRetries: 2 }
    );
  });
} catch (error) {
  // Level 2: Retry with safe parameters
  if (error.message.includes('temperature')) {
    const safeModel = new ChatOpenAI({ temperature: 1 });
    analysis = await safeModel.invoke(prompt);
  }
  
  // Level 3: Fallback to different model
  if (!analysis) {
    const fallbackModel = new ChatOpenAI({ modelName: 'gpt-4' });
    analysis = await fallbackModel.invoke(prompt);
  }
  
  // Level 4: Heuristic analysis
  if (!analysis) {
    analysis = performHeuristicAnalysis(evidence, thesis);
  }
}
```

## Configuration

### Resilience Modes

1. **Default**: Balanced for production use
   - 3 retries with 2s initial delay
   - Circuit breaker: 5 failures to open
   - All fallbacks enabled

2. **Strict**: Fails fast for testing
   - 1 retry only
   - Circuit breaker: 3 failures to open
   - No fallbacks enabled

3. **Lenient**: Maximum resilience
   - 5 retries with longer delays
   - Circuit breaker: 10 failures to open
   - All fallbacks enabled

4. **Development**: Quick failures for debugging
   - 2 retries with short delays
   - Verbose logging
   - All fallbacks enabled

### Environment Variables

```bash
# Set resilience mode
RESILIENCE_MODE=default|strict|lenient|development

# Enable/disable monitoring
PIPELINE_MONITORING=true|false

# Set log level
LOG_LEVEL=error|warn|info|debug
```

## Monitoring and Alerts

### Real-time Monitoring

The pipeline monitor tracks all phases in real-time:

```typescript
const monitor = PipelineMonitor.getInstance();
monitor.startPhase('deepResearch');
// ... phase execution ...
monitor.endPhase('deepResearch', 'completed', evidenceCount);
```

### Health Reports

Generate comprehensive health reports:

```typescript
const health = monitor.getHealth();
const report = monitor.generateReport();
```

**Report Includes**:
- Overall pipeline status
- Phase-by-phase breakdown
- Error summaries
- Performance metrics
- Circuit breaker states
- Recommendations

### Alert Conditions

**Critical Alerts**:
- Pipeline failures > 3 consecutive runs
- Circuit breaker open for > 5 minutes
- Evidence collection < 10% of expected
- All model fallbacks exhausted

**Warning Alerts**:
- Phase duration > 2x average
- Retry count > threshold
- Degraded mode activations
- Partial failures in non-critical phases

## Testing

### Unit Tests

Test individual resilience components:
- Retry logic with various failure scenarios
- Circuit breaker state transitions
- Error enhancement accuracy
- Heuristic analysis output

### Integration Tests

Test full pipeline resilience:
- Cascading failures
- Recovery from degraded states
- Partial result delivery
- Performance under stress

### Chaos Testing

Introduce random failures:
- Network timeouts
- API rate limits
- Model unavailability
- Invalid responses

## Best Practices

### 1. **Always Log Context**
```typescript
logErrorWithContext(error, {
  operation: 'analyzeFindings',
  phase: 'primary-analysis',
  data: { company, evidenceCount }
});
```

### 2. **Use Circuit Breakers for External Services**
```typescript
const searchBreaker = CircuitBreakerRegistry.getBreaker('web-search');
const result = await searchBreaker.execute(() => searchTool.search(query));
```

### 3. **Record Metrics for Monitoring**
```typescript
monitor.recordError('phaseName', error.message);
monitor.recordRetry('phaseName');
monitor.recordFallback('phaseName');
```

### 4. **Implement Progressive Fallbacks**
- Start with the best approach
- Fall back progressively
- Always have a final fallback

### 5. **Validate Health Before Proceeding**
```typescript
const health = checkPhaseHealth(state, 'currentPhase');
if (!health.canProceed) {
  return skipToReportGeneration(state);
}
```

## Troubleshooting

### Common Issues

1. **Circuit Breaker Stuck Open**
   - Check service availability
   - Review error logs
   - Manually reset if needed

2. **Excessive Retries**
   - Verify retry conditions
   - Check for persistent errors
   - Review backoff settings

3. **Degraded Results**
   - Check evidence collection
   - Verify model availability
   - Review fallback triggers

### Recovery Procedures

1. **Manual Circuit Breaker Reset**
```typescript
CircuitBreakerRegistry.getBreaker('service-name').reset();
```

2. **Force Strict Mode**
```typescript
process.env.RESILIENCE_MODE = 'strict';
```

3. **Generate Health Report**
```typescript
const report = PipelineMonitor.getInstance().generateReport();
console.log(report);
```

## Future Enhancements

1. **Predictive Failure Detection**
   - ML-based failure prediction
   - Proactive fallback activation
   - Resource pre-allocation

2. **Dynamic Configuration**
   - Runtime config updates
   - A/B testing resilience strategies
   - Adaptive thresholds

3. **Enhanced Monitoring**
   - Real-time dashboards
   - Historical trend analysis
   - Automated anomaly detection

4. **Advanced Fallbacks**
   - Cached result reuse
   - Partial result combination
   - Community model fallbacks

## Conclusion

The resilience architecture ensures TechScanIQ can handle various failure scenarios while continuing to provide value to users. By implementing multiple layers of error handling, fallback strategies, and comprehensive monitoring, the pipeline achieves high reliability and user satisfaction even in adverse conditions.