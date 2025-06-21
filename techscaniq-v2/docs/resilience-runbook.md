# TechScanIQ Resilience Runbook

## Quick Reference

This runbook provides quick solutions for common error scenarios in the TechScanIQ pipeline.

## Error Scenarios and Solutions

### 1. Temperature Parameter Error

**Error**: `temperature must be between 0 and 2`

**Symptoms**:
- Pipeline fails during analysis phase
- Model invocation errors

**Solution**:
```typescript
// The pipeline automatically handles this with fallback to default temperature
// If manual intervention needed:
const safeModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 1, // Use default
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Prevention**:
- Always validate model parameters before deployment
- Use resilience config to set safe defaults

### 2. API Rate Limit Errors

**Error**: `Rate limit exceeded`, `429 Too Many Requests`

**Symptoms**:
- Multiple failed requests
- Circuit breaker may open

**Solution**:
1. Check current rate limit status
2. Implement exponential backoff (automatic)
3. Reduce request frequency if needed

**Manual Override**:
```typescript
// Increase retry delays
const config = getResilienceConfig('lenient');
// This provides longer delays between retries
```

### 3. Model Unavailability

**Error**: `Model not found`, `404`, `Service unavailable`

**Symptoms**:
- Primary model fails
- Fallback models may also fail

**Solution**:
1. Pipeline automatically tries fallback models
2. If all fail, heuristic analysis activates
3. Check model availability:
```bash
curl https://api.openai.com/v1/models
```

**Manual Fallback**:
```typescript
// Force specific model
const fallbackModel = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo', // More stable model
  apiKey: process.env.OPENAI_API_KEY,
});
```

### 4. Circuit Breaker Open

**Error**: `Circuit breaker [name] is OPEN`

**Symptoms**:
- Requests rejected without trying
- Service marked as unavailable

**Solution**:
1. Wait for automatic reset (30 seconds default)
2. Check service health
3. Manual reset if service recovered:
```typescript
CircuitBreakerRegistry.getBreaker('service-name').reset();
```

**Investigation**:
```typescript
// Check circuit breaker stats
const stats = CircuitBreakerRegistry.getStats();
console.log(stats);
```

### 5. Low Evidence Collection

**Error**: Pipeline completes with < 100 evidence pieces

**Symptoms**:
- Degraded analysis quality
- Health check warnings

**Solution**:
1. Check search service availability
2. Verify search queries are appropriate
3. Increase search result limits:
```typescript
const results = await searchTool.search(query, { 
  maxResults: 150, // Increase from 100
  returnFullResponse: true
});
```

### 6. Network Timeouts

**Error**: `ETIMEDOUT`, `ECONNRESET`, `Network timeout`

**Symptoms**:
- Intermittent failures
- Slow pipeline execution

**Solution**:
1. Automatic retries handle most cases
2. Check network connectivity
3. Increase timeout if needed:
```typescript
// In retry config
{
  maxRetries: 5,
  initialDelay: 3000,
  maxDelay: 60000
}
```

### 7. Memory/Resource Issues

**Error**: `JavaScript heap out of memory`

**Symptoms**:
- Pipeline crashes
- Large evidence collections fail

**Solution**:
1. Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm start
```

2. Implement evidence batching:
```typescript
// Process evidence in chunks
const chunkSize = 500;
for (let i = 0; i < evidence.length; i += chunkSize) {
  const chunk = evidence.slice(i, i + chunkSize);
  // Process chunk
}
```

## Monitoring Commands

### Check Pipeline Health
```typescript
const monitor = PipelineMonitor.getInstance();
const health = monitor.getHealth();
console.log(monitor.generateReport());
```

### View Circuit Breaker Status
```typescript
const stats = CircuitBreakerRegistry.getStats();
Object.entries(stats).forEach(([name, stat]) => {
  console.log(`${name}: ${stat.state}`);
});
```

### Force Resilience Mode
```typescript
// For debugging - fail fast
process.env.RESILIENCE_MODE = 'strict';

// For production issues - maximum resilience
process.env.RESILIENCE_MODE = 'lenient';
```

## Emergency Procedures

### 1. Complete Pipeline Failure

If pipeline fails completely:

1. **Enable lenient mode**:
```bash
export RESILIENCE_MODE=lenient
```

2. **Reset all circuit breakers**:
```typescript
CircuitBreakerRegistry.resetAll();
```

3. **Check API keys**:
```bash
# Verify all required keys are set
env | grep -E "OPENAI_API_KEY|PERPLEXITY_API_KEY"
```

4. **Run diagnostic**:
```typescript
// Create a diagnostic report
const report = {
  timestamp: new Date().toISOString(),
  health: PipelineMonitor.getInstance().getHealth(),
  circuitBreakers: CircuitBreakerRegistry.getStats(),
  env: {
    resilienceMode: process.env.RESILIENCE_MODE,
    nodeVersion: process.version,
    memory: process.memoryUsage()
  }
};
console.log(JSON.stringify(report, null, 2));
```

### 2. Partial Results Only

If getting degraded results:

1. **Check evidence quality**:
```typescript
const health = checkPhaseHealth(state, 'deepResearch');
console.log(health);
```

2. **Verify model responses**:
```typescript
// Test model directly
const testModel = new ChatOpenAI({ modelName: 'gpt-4' });
const test = await testModel.invoke('Test message');
console.log(test);
```

3. **Review fallback triggers**:
```typescript
// Check what triggered fallbacks
const monitor = PipelineMonitor.getInstance();
const phases = monitor.getHealth().phases;
phases.forEach((phase, name) => {
  if (phase.fallbacks > 0) {
    console.log(`${name} used ${phase.fallbacks} fallbacks`);
  }
});
```

## Preventive Measures

### Daily Health Checks

Run these checks daily:

```typescript
// 1. Test all models
const models = ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'];
for (const modelName of models) {
  try {
    const model = new ChatOpenAI({ modelName });
    await model.invoke('Health check');
    console.log(`✅ ${modelName} is healthy`);
  } catch (error) {
    console.log(`❌ ${modelName} is unhealthy:`, error.message);
  }
}

// 2. Check circuit breakers
const cbStats = CircuitBreakerRegistry.getStats();
const openBreakers = Object.entries(cbStats)
  .filter(([_, stats]) => stats.state === 'OPEN');
if (openBreakers.length > 0) {
  console.warn('Open circuit breakers:', openBreakers);
}

// 3. Review error patterns
// Check logs for recurring errors
```

### Performance Baseline

Maintain performance baselines:

```typescript
const expectedMetrics = {
  deepResearch: { maxDuration: 120000, minEvidence: 500 },
  analyzeFindings: { maxDuration: 30000 },
  generateReport: { maxDuration: 60000 }
};

// Compare actual vs expected
const health = PipelineMonitor.getInstance().getHealth();
health.phases.forEach((phase, name) => {
  const expected = expectedMetrics[name];
  if (expected && phase.duration > expected.maxDuration) {
    console.warn(`${name} exceeded duration threshold`);
  }
});
```

## Contact and Escalation

### Escalation Path

1. **Level 1**: Automatic resilience handles issue
2. **Level 2**: Manual intervention using this runbook
3. **Level 3**: Engineering team involvement
4. **Level 4**: External service provider support

### Key Metrics for Escalation

Escalate if:
- Overall pipeline success rate < 80%
- Circuit breakers open > 10 minutes
- Heuristic fallback used > 50% of runs
- Critical errors in 3+ consecutive runs

## Recovery Verification

After resolving issues:

1. **Run test pipeline**:
```typescript
// Run with minimal test data
const testResult = await runIntegratedResearch(
  testThesis,
  { resilienceMode: 'strict' }
);
```

2. **Verify all phases complete**:
```typescript
const health = PipelineMonitor.getInstance().getHealth();
const allCompleted = Array.from(health.phases.values())
  .every(phase => phase.status === 'completed');
console.log('All phases completed:', allCompleted);
```

3. **Check result quality**:
- Evidence count > minimum threshold
- No fallbacks used
- All circuit breakers closed
- No critical errors logged

## Appendix: Quick Commands

```bash
# Check logs for errors
grep -i "error\|fail" logs/pipeline.log | tail -20

# Monitor in real-time
tail -f logs/pipeline.log | grep -E "error|retry|fallback|circuit"

# Generate health report
node -e "console.log(require('./src/utils/pipeline-monitor').PipelineMonitor.getInstance().generateReport())"

# Reset circuit breakers
node -e "require('./src/utils/circuit-breaker').CircuitBreakerRegistry.resetAll()"

# Test specific model
node -e "new (require('@langchain/openai').ChatOpenAI)({modelName:'gpt-4'}).invoke('test').then(console.log)"
```

Remember: The goal is not just to fix errors but to understand why they occurred and prevent recurrence.