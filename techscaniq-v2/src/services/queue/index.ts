import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../../config';

// Redis connection configuration
const redisConfig = {
  host: config.REDIS_HOST || 'localhost',
  port: config.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

// Create connection for BullMQ
export const connection = new Redis(redisConfig);

// Queue definitions
export const queues = {
  search: new Queue('evidence-search', { connection }),
  analysis: new Queue('document-analysis', { connection }),
  quality: new Queue('quality-evaluation', { connection }),
  technical: new Queue('technical-analysis', { connection }),
  api: new Queue('api-discovery', { connection }),
  orchestration: new Queue('orchestration-tasks', { connection }),
};

// Queue events for monitoring
export const queueEvents = {
  search: new QueueEvents('evidence-search', { connection }),
  analysis: new QueueEvents('document-analysis', { connection }),
  quality: new QueueEvents('quality-evaluation', { connection }),
  technical: new QueueEvents('technical-analysis', { connection }),
  api: new QueueEvents('api-discovery', { connection }),
  orchestration: new QueueEvents('orchestration-tasks', { connection }),
};

// Queue configuration defaults
export const defaultJobOptions = {
  removeOnComplete: {
    age: 3600, // 1 hour
    count: 100,
  },
  removeOnFail: {
    age: 86400, // 24 hours
    count: 500,
  },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
};

// Job priority levels
export enum JobPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 3,
  CRITICAL = 1,
}

// Job status monitoring
export async function getQueueStatus(queueName: keyof typeof queues) {
  const queue = queues[queueName];
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return {
    name: queueName,
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}

// Get all queue statuses
export async function getAllQueueStatuses() {
  const statuses = await Promise.all(
    Object.keys(queues).map(name => getQueueStatus(name as keyof typeof queues))
  );
  return statuses;
}

// Clean up old jobs
export async function cleanQueues(olderThan: number = 86400000) { // 24 hours default
  const cleanPromises = Object.values(queues).map(queue => 
    queue.clean(olderThan, 1000, 'completed')
  );
  await Promise.all(cleanPromises);
}

// Graceful shutdown
export async function closeQueues() {
  console.log('Closing queues...');
  
  // Close all queues
  await Promise.all(Object.values(queues).map(queue => queue.close()));
  
  // Close all queue events
  await Promise.all(Object.values(queueEvents).map(events => events.close()));
  
  // Close Redis connection
  await connection.quit();
  
  console.log('Queues closed successfully');
}

// Export types
export type QueueName = keyof typeof queues;
export type QueueJob<T = any> = Job<T>;