import { Queue } from 'bullmq'
import Redis from 'ioredis'
import { config } from 'dotenv'

// Load environment variables
config()

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

// Queue definitions with their worker mappings
export const QUEUE_DEFINITIONS = {
  // Evidence collection queues
  'evidence-collection': {
    name: 'evidence-collection',
    workerFile: 'evidence-collection-worker-v2.ts',
    concurrency: 3,
    description: 'Basic evidence collection from web pages'
  },
  
  // Report generation queues (multiple approaches)
  'report-generation': {
    name: 'report-generation',
    workerFile: 'report-generation-worker-claude-orchestrated.ts',
    concurrency: 2,
    description: 'Standard report generation with Claude orchestration'
  },
  
  // New research queues
  'unified-research': {
    name: 'unified-research',
    workerFile: 'report-generation-worker-unified.ts',
    concurrency: 2,
    description: 'Unified claim-driven research and report generation'
  },
  
  'iterative-research': {
    name: 'iterative-research',
    workerFile: 'research-worker-iterative.ts',
    concurrency: 2,
    description: 'Chain of RAG iterative research with reflection'
  },
  
  'rich-research': {
    name: 'rich-research',
    workerFile: 'research-worker-rich-iterative.ts',
    concurrency: 2,
    description: 'Rich research with automated tools and technical profiling'
  }
}

// Queue job routing based on scan type and configuration
export function getQueueForScanType(scanType: string, researchMode?: string): string {
  // Route based on research mode if specified
  if (researchMode) {
    switch (researchMode) {
      case 'unified':
        return 'unified-research'
      case 'iterative':
        return 'iterative-research'
      case 'rich':
        return 'rich-research'
      default:
        return 'report-generation'
    }
  }
  
  // Default routing based on scan type
  switch (scanType) {
    case 'deep':
      return 'rich-research' // Use rich research for deep scans
    case 'quick':
      return 'report-generation' // Use standard for quick scans
    default:
      return 'report-generation'
  }
}

// Create queue instances
export const queues: Record<string, Queue> = {}

// Initialize all queues
Object.entries(QUEUE_DEFINITIONS).forEach(([key, config]) => {
  queues[key] = new Queue(config.name, { connection })
})

// Queue management functions
export async function addResearchJob(
  scanRequestId: string,
  company: string,
  domain: string,
  investmentThesis: string,
  scanType: string = 'deep',
  researchMode?: string
) {
  const queueName = getQueueForScanType(scanType, researchMode)
  const queue = queues[queueName]
  
  if (!queue) {
    throw new Error(`Queue ${queueName} not found`)
  }
  
  const jobData = {
    scanRequestId,
    company,
    domain,
    investmentThesis,
    scanType,
    researchMode: researchMode || 'default'
  }
  
  const job = await queue.add(`research-${company}`, jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100 // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
  })
  
  console.log(`Added research job ${job.id} to queue ${queueName}`)
  return job
}

// Evidence collection job
export async function addEvidenceCollectionJob(
  scanRequestId: string,
  company: string,
  domain: string,
  scanType: string = 'standard'
) {
  const queue = queues['evidence-collection']
  
  const job = await queue.add(`collect-${company}`, {
    scanRequestId,
    company,
    domain,
    scanType
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  })
  
  console.log(`Added evidence collection job ${job.id}`)
  return job
}

// Queue status monitoring
export async function getQueueStats() {
  const stats: Record<string, any> = {}
  
  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount()
    ])
    
    stats[name] = {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed
    }
  }
  
  return stats
}

// Cleanup function
export async function closeAllQueues() {
  await Promise.all([
    ...Object.values(queues).map(q => q.close()),
    connection.quit()
  ])
}

// Export for use in workers
export { connection }