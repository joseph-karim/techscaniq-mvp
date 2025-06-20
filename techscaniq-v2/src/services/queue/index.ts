// Stub implementation for queue services when not using Redis queues
// This prevents Redis connection attempts when using LangGraph instead

export const connection = null;

export const queues = null;

export const queueEvents = null;

export const defaultJobOptions = {
  removeOnComplete: {
    age: 3600,
    count: 100,
  },
  removeOnFail: {
    age: 86400,
  },
};

export async function getQueueStatus(queueName: string) {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };
}

export async function getAllQueueStatuses() {
  return {};
}

export async function cleanQueues() {
  console.log('Queue cleaning skipped - queues disabled');
}

export async function gracefulShutdown() {
  console.log('Queue shutdown skipped - queues disabled');
}

// Export type stub for JobPriority
export enum JobPriority {
  HIGH = 1,
  NORMAL = 2,
  LOW = 3
}