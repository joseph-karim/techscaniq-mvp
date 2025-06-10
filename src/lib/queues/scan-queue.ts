import { Queue, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

// Queues
export const evidenceCollectionQueue = new Queue('evidence-collection', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 200,
    },
  },
})

export const reportGenerationQueue = new Queue('report-generation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: {
      count: 50,
      age: 7 * 24 * 3600, // 7 days
    },
    removeOnFail: {
      count: 100,
    },
  },
})

// Queue Events for monitoring
export const evidenceQueueEvents = new QueueEvents('evidence-collection', {
  connection,
})

export const reportQueueEvents = new QueueEvents('report-generation', {
  connection,
})

// Helper functions
export async function createScanJob(scanRequest: any) {
  // Step 1: Create evidence collection job
  const evidenceJob = await evidenceCollectionQueue.add(
    'collect-evidence',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: scanRequest.website_url?.replace(/^https?:\/\//, ''),
      investmentThesis: scanRequest.primary_criteria,
      depth: 'comprehensive',
    },
    {
      priority: scanRequest.priority || 0,
      delay: scanRequest.scheduledFor ? new Date(scanRequest.scheduledFor).getTime() - Date.now() : 0,
    }
  )
  
  console.log(`Created evidence collection job: ${evidenceJob.id}`)
  
  // Step 2: Chain report generation job (will wait for evidence collection)
  // Note: Parent dependencies require the FlowProducer API, so we'll use a simpler approach
  // The report worker will check if evidence collection is complete before starting
  const reportJob = await reportGenerationQueue.add(
    'generate-report',
    {
      scanRequestId: scanRequest.id,
      company: scanRequest.company_name,
      domain: scanRequest.website_url?.replace(/^https?:\/\//, ''),
      investmentThesis: scanRequest.primary_criteria,
      evidenceJobId: evidenceJob.id ? String(evidenceJob.id) : undefined,
    },
    {
      priority: scanRequest.priority || 0,
      delay: 5000, // Start after 5 seconds to let evidence collection begin
    }
  )
  
  console.log(`Created report generation job: ${reportJob.id} (will start after ${evidenceJob.id})`)
  
  return {
    evidenceJobId: evidenceJob.id,
    reportJobId: reportJob.id,
  }
}

export async function getJobStatus(jobId: string, queueName: 'evidence-collection' | 'report-generation') {
  const queue = queueName === 'evidence-collection' ? evidenceCollectionQueue : reportGenerationQueue
  const job = await queue.getJob(jobId)
  
  if (!job) {
    return null
  }
  
  const state = await job.getState()
  const progress = job.progress
  
  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  }
}

export async function getQueueMetrics() {
  const [evidenceMetrics, reportMetrics] = await Promise.all([
    getQueueMetricsForQueue(evidenceCollectionQueue),
    getQueueMetricsForQueue(reportGenerationQueue),
  ])
  
  return {
    evidenceCollection: evidenceMetrics,
    reportGeneration: reportMetrics,
  }
}

async function getQueueMetricsForQueue(queue: Queue) {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ])
  
  const paused = 0 // getPausedCount doesn't exist in newer versions
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    total: waiting + active + completed + failed + delayed + paused,
  }
}

// Event listeners for real-time updates
export function subscribeToJobUpdates(
  jobId: string,
  queueName: 'evidence-collection' | 'report-generation',
  callbacks: {
    onProgress?: (progress: number) => void
    onCompleted?: (result: any) => void
    onFailed?: (error: Error) => void
  }
) {
  const events = queueName === 'evidence-collection' ? evidenceQueueEvents : reportQueueEvents
  
  if (callbacks.onProgress) {
    events.on('progress', ({ jobId: id, data }) => {
      if (id === jobId) {
        callbacks.onProgress!(typeof data === 'number' ? data : 0)
      }
    })
  }
  
  if (callbacks.onCompleted) {
    events.on('completed', ({ jobId: id, returnvalue }) => {
      if (id === jobId) {
        callbacks.onCompleted!(returnvalue)
      }
    })
  }
  
  if (callbacks.onFailed) {
    events.on('failed', ({ jobId: id, failedReason }) => {
      if (id === jobId) {
        callbacks.onFailed!(new Error(failedReason))
      }
    })
  }
  
  // Return unsubscribe function
  return () => {
    events.removeAllListeners('progress')
    events.removeAllListeners('completed')
    events.removeAllListeners('failed')
  }
}