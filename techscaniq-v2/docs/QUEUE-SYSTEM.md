# TechScanIQ Queue System Documentation

## Overview

The TechScanIQ queue system is built on BullMQ and Redis, providing reliable background job processing for evidence gathering, analysis, and quality evaluation tasks.

## Architecture

### Queue Types

1. **Search Queue** (`evidence-search`)
   - Handles web, news, and academic searches
   - Converts results to evidence format
   - Rate limited to 100 searches per minute
   - Concurrency: 5 jobs

2. **Analysis Queue** (`document-analysis`)
   - Content extraction from URLs
   - Technical profile collection
   - Technology stack detection
   - Rate limited to 30 analyses per minute
   - Concurrency: 3 jobs

3. **Quality Queue** (`quality-evaluation`)
   - LLM-based evidence quality scoring
   - Evaluates relevance, credibility, recency, specificity, bias
   - Rate limited to 50 evaluations per minute
   - Concurrency: 10 jobs

4. **Technical Queue** (`technical-analysis`)
   - Deep technical analysis
   - API discovery
   - User flow analysis with Playwright
   - Rate limited to 10 analyses per minute
   - Concurrency: 2 jobs

5. **Orchestration Queue** (`orchestration-tasks`)
   - Coordinates complex workflows
   - Manages job dependencies
   - Creates job flows
   - Concurrency: 5 jobs

## Getting Started

### Prerequisites

1. Redis must be installed and running:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

2. Environment variables:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
USE_QUEUES=true  # Set to false to disable queue processing
```

### Starting Workers

```bash
# Start all workers
npm run workers

# Or in development mode
npm run dev:workers
```

### Testing the Queue System

```bash
# Run queue tests
npm run test:queues
```

## Usage Examples

### Adding Jobs to Queues

```typescript
import { queues, JobPriority } from './src/services/queue';

// Add a search job
const searchJob = await queues.search.add('search', {
  query: 'OpenAI GPT-4 capabilities',
  type: 'web',
  pillarId: 'tech-architecture',
  questionId: 'q-123',
  options: {
    limit: 10,
    dateRange: 'past_year',
  },
}, {
  priority: JobPriority.HIGH,
  delay: 1000, // Delay by 1 second
});

// Add an analysis job
const analysisJob = await queues.analysis.add('analyze', {
  url: 'https://example.com/whitepaper.pdf',
  type: 'content',
  options: {
    extractImages: true,
    extractStructuredData: true,
  },
});

// Add a quality evaluation job
const qualityJob = await queues.quality.add('evaluate', {
  evidence: evidenceObject,
  context: {
    researchQuestion: 'What is the market position?',
    pillarName: 'Market Analysis',
    thesisStatement: 'Company X is a market leader',
  },
});
```

### Monitoring Queue Status

```typescript
import { queueMonitor } from './src/services/queue/monitor';

// Get queue metrics
const metrics = await queueMonitor.getQueueMetrics();
console.table(metrics);

// Get active jobs
const activeJobs = await queueMonitor.getActiveJobs('search');

// Get failed jobs
const failedJobs = await queueMonitor.getFailedJobs('analysis', 20);

// Retry failed jobs
const retriedCount = await queueMonitor.retryAllFailedJobs('search');

// Generate status report
const report = await queueMonitor.generateReport();
console.log(report);
```

### Subscribing to Queue Events

```typescript
queueMonitor.subscribeToQueueEvents('search', {
  onCompleted: (jobId, result) => {
    console.log(`Job ${jobId} completed with ${result.evidence.length} evidence items`);
  },
  onFailed: (jobId, reason) => {
    console.error(`Job ${jobId} failed: ${reason}`);
  },
  onProgress: (jobId, progress) => {
    console.log(`Job ${jobId} is ${progress}% complete`);
  },
});
```

### Creating Job Flows

```typescript
import { FlowProducer } from 'bullmq';
import { connection } from './src/services/queue';

const flowProducer = new FlowProducer({ connection });

// Create a flow with dependent jobs
const flow = await flowProducer.add({
  name: 'research-flow',
  queueName: 'orchestration-tasks',
  data: { stateId: 'research-123' },
  children: [
    {
      name: 'search-web',
      queueName: 'evidence-search',
      data: { query: 'Company X market share', type: 'web' },
      children: [
        {
          name: 'analyze-results',
          queueName: 'document-analysis',
          data: { type: 'content' },
        },
      ],
    },
    {
      name: 'search-news',
      queueName: 'evidence-search',
      data: { query: 'Company X latest news', type: 'news' },
    },
  ],
});
```

## Queue Management

### Pausing and Resuming Queues

```typescript
// Pause a queue
await queueMonitor.pauseQueue('search');

// Resume a queue
await queueMonitor.resumeQueue('search');
```

### Cleaning Old Jobs

```typescript
// Clean completed jobs older than 24 hours
const removed = await queueMonitor.cleanQueue('search', 86400000);
console.log(`Removed ${removed.length} old jobs`);
```

### Draining Queues

```typescript
// Remove all waiting jobs
await queueMonitor.drainQueue('search');
```

## Best Practices

1. **Job Naming**: Use descriptive job names for easier debugging
2. **Priority Levels**: Use appropriate priority levels (CRITICAL=1, HIGH=3, NORMAL=5, LOW=10)
3. **Error Handling**: Jobs automatically retry 3 times with exponential backoff
4. **Progress Tracking**: Update job progress for long-running tasks
5. **Cleanup**: Remove old completed jobs to prevent Redis memory issues
6. **Monitoring**: Regularly check queue metrics and failed jobs
7. **Rate Limiting**: Respect rate limits to avoid overwhelming external services

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis is running: `redis-cli ping`
   - Check REDIS_HOST and REDIS_PORT environment variables

2. **Jobs Not Processing**
   - Ensure workers are running: `npm run workers`
   - Check worker logs for errors
   - Verify queue is not paused

3. **High Memory Usage**
   - Clean old completed jobs regularly
   - Reduce job retention time in queue options
   - Monitor Redis memory: `redis-cli info memory`

4. **Jobs Failing Repeatedly**
   - Check job error details: `await job.getState()`
   - Review worker logs
   - Increase timeout for long-running jobs

### Debug Mode

Enable debug logging:
```bash
DEBUG=bullmq:* npm run workers
```

## Performance Tuning

1. **Concurrency**: Adjust worker concurrency based on system resources
2. **Rate Limiting**: Configure rate limits to match API quotas
3. **Job Batching**: Group similar jobs to reduce overhead
4. **Redis Persistence**: Configure Redis persistence for durability
5. **Connection Pooling**: Use connection pool for high throughput

## Integration with LangGraph

The queue system integrates seamlessly with the LangGraph orchestrator:

1. **Hybrid Processing**: Use `USE_QUEUES=true` for background processing
2. **Direct Mode**: Set `USE_QUEUES=false` for synchronous execution
3. **State Management**: Queue jobs update research state asynchronously
4. **Progress Tracking**: Monitor overall research progress through queues

## Security Considerations

1. **Job Data**: Sanitize job data to prevent injection attacks
2. **API Keys**: Never store API keys in job data
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Access Control**: Secure Redis with authentication
5. **Network**: Use SSL/TLS for Redis connections in production