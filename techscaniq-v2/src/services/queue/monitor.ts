import { queues, queueEvents, getAllQueueStatuses } from './index';
import { Job } from 'bullmq';

export interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  avgProcessingTime?: number;
  throughput?: number;
}

export interface JobDetails {
  id: string;
  name: string;
  data: any;
  progress: number;
  attempts: number;
  timestamp: number;
  finishedOn?: number;
  processedOn?: number;
  failedReason?: string;
  returnvalue?: any;
}

export class QueueMonitor {
  private metricsCache: Map<string, QueueMetrics> = new Map();
  private jobHistoryCache: Map<string, JobDetails[]> = new Map();

  async getQueueMetrics(queueName?: keyof typeof queues): Promise<QueueMetrics[]> {
    const queuesToCheck = queueName ? [queueName] : Object.keys(queues) as (keyof typeof queues)[];
    const metrics: QueueMetrics[] = [];

    for (const name of queuesToCheck) {
      const queue = queues[name];
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      const paused = 0; // getPausedCount not available in current BullMQ version

      // Calculate average processing time
      const completedJobs = await queue.getCompleted(0, 10);
      let avgProcessingTime = 0;
      if (completedJobs.length > 0) {
        const processingTimes = completedJobs
          .filter(job => job.finishedOn && job.processedOn)
          .map(job => job.finishedOn! - job.processedOn!);
        
        if (processingTimes.length > 0) {
          avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        }
      }

      // Calculate throughput (jobs per minute)
      const throughput = 0; // Calculate based on completed jobs timestamps

      const metric: QueueMetrics = {
        queueName: name,
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
        avgProcessingTime,
        throughput,
      };

      metrics.push(metric);
      this.metricsCache.set(name, metric);
    }

    return metrics;
  }

  async getActiveJobs(queueName: keyof typeof queues): Promise<JobDetails[]> {
    const queue = queues[queueName];
    const jobs = await queue.getActive();
    
    return jobs.map(job => this.formatJobDetails(job));
  }

  async getWaitingJobs(queueName: keyof typeof queues, limit: number = 10): Promise<JobDetails[]> {
    const queue = queues[queueName];
    const jobs = await queue.getWaiting(0, limit);
    
    return jobs.map(job => this.formatJobDetails(job));
  }

  async getCompletedJobs(queueName: keyof typeof queues, limit: number = 10): Promise<JobDetails[]> {
    const queue = queues[queueName];
    const jobs = await queue.getCompleted(0, limit);
    
    return jobs.map(job => this.formatJobDetails(job));
  }

  async getFailedJobs(queueName: keyof typeof queues, limit: number = 10): Promise<JobDetails[]> {
    const queue = queues[queueName];
    const jobs = await queue.getFailed(0, limit);
    
    return jobs.map(job => this.formatJobDetails(job));
  }

  async getJobById(queueName: keyof typeof queues, jobId: string): Promise<JobDetails | null> {
    const queue = queues[queueName];
    const job = await queue.getJob(jobId);
    
    return job ? this.formatJobDetails(job) : null;
  }

  async retryFailedJob(queueName: keyof typeof queues, jobId: string): Promise<boolean> {
    const queue = queues[queueName];
    const job = await queue.getJob(jobId);
    
    if (job && (await job.isFailed())) {
      await job.retry();
      return true;
    }
    
    return false;
  }

  async retryAllFailedJobs(queueName: keyof typeof queues): Promise<number> {
    const queue = queues[queueName];
    const failedJobs = await queue.getFailed();
    
    let retried = 0;
    for (const job of failedJobs) {
      try {
        await job.retry();
        retried++;
      } catch (error) {
        console.error(`Failed to retry job ${job.id}:`, error);
      }
    }
    
    return retried;
  }

  async pauseQueue(queueName: keyof typeof queues): Promise<void> {
    await queues[queueName].pause();
  }

  async resumeQueue(queueName: keyof typeof queues): Promise<void> {
    await queues[queueName].resume();
  }

  async drainQueue(queueName: keyof typeof queues): Promise<void> {
    await queues[queueName].drain();
  }

  async cleanQueue(queueName: keyof typeof queues, grace: number = 0, limit: number = 100): Promise<string[]> {
    const queue = queues[queueName];
    return await queue.clean(grace, limit, 'completed');
  }

  subscribeToQueueEvents(queueName: keyof typeof queues, callbacks: {
    onCompleted?: (jobId: string, returnvalue: any) => void;
    onFailed?: (jobId: string, failedReason: string) => void;
    onProgress?: (jobId: string, progress: number) => void;
    onActive?: (jobId: string) => void;
    onWaiting?: (jobId: string) => void;
  }) {
    const events = queueEvents[queueName];
    
    if (callbacks.onCompleted) {
      events.on('completed', ({ jobId, returnvalue }) => {
        callbacks.onCompleted!(jobId, returnvalue);
      });
    }
    
    if (callbacks.onFailed) {
      events.on('failed', ({ jobId, failedReason }) => {
        callbacks.onFailed!(jobId, failedReason);
      });
    }
    
    if (callbacks.onProgress) {
      events.on('progress', ({ jobId, data }) => {
        callbacks.onProgress!(jobId, typeof data === 'number' ? data : parseInt(data as string) || 0);
      });
    }
    
    if (callbacks.onActive) {
      events.on('active', ({ jobId }) => {
        callbacks.onActive!(jobId);
      });
    }
    
    if (callbacks.onWaiting) {
      events.on('waiting', ({ jobId }) => {
        callbacks.onWaiting!(jobId);
      });
    }
  }

  private formatJobDetails(job: Job): JobDetails {
    return {
      id: job.id || '',
      name: job.name,
      data: job.data,
      progress: typeof job.progress === 'number' ? job.progress : 0,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    };
  }

  async generateReport(): Promise<string> {
    const metrics = await this.getQueueMetrics();
    
    let report = '# Queue Status Report\n\n';
    report += `Generated at: ${new Date().toISOString()}\n\n`;
    
    let totalWaiting = 0;
    let totalActive = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    
    report += '## Queue Metrics\n\n';
    report += '| Queue | Waiting | Active | Completed | Failed | Delayed | Avg Time (ms) | Throughput/min |\n';
    report += '|-------|---------|--------|-----------|--------|---------|---------------|----------------|\n';
    
    for (const metric of metrics) {
      totalWaiting += metric.waiting;
      totalActive += metric.active;
      totalCompleted += metric.completed;
      totalFailed += metric.failed;
      
      report += `| ${metric.queueName} | ${metric.waiting} | ${metric.active} | ${metric.completed} | ${metric.failed} | ${metric.delayed} | ${metric.avgProcessingTime?.toFixed(0) || '-'} | ${metric.throughput || '-'} |\n`;
    }
    
    report += `| **Total** | **${totalWaiting}** | **${totalActive}** | **${totalCompleted}** | **${totalFailed}** | - | - | - |\n\n`;
    
    report += '## Summary\n\n';
    report += `- Total Jobs Processed: ${totalCompleted}\n`;
    report += `- Success Rate: ${totalCompleted > 0 ? ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(2) : 0}%\n`;
    report += `- Current Backlog: ${totalWaiting + totalActive}\n`;
    
    return report;
  }
}

// Singleton instance
export const queueMonitor = new QueueMonitor();