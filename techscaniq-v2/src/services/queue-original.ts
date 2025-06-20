import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../config';
import { WebSearchTool } from '../tools/webSearch';
import { DocumentAnalyzer } from '../tools/documentAnalyzer';

// Redis connection
const connection = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
});

// Job queues
export const searchQueue = new Queue('evidence-search', { connection });
export const analysisQueue = new Queue('evidence-analysis', { connection });

// Worker for search jobs
export const searchWorker = new Worker(
  'evidence-search',
  async (job: Job) => {
    const { query, type, options } = job.data;
    const searchTool = new WebSearchTool();
    
    console.log(`Processing search job: ${query}`);
    
    try {
      let results;
      switch (type) {
        case 'news':
          results = await searchTool.searchNews(query, options);
          break;
        case 'academic':
          results = await searchTool.searchAcademic(query, options);
          break;
        default:
          results = await searchTool.search(query, options);
      }
      
      return { success: true, results };
    } catch (error) {
      console.error(`Search job failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
  { connection }
);

// Worker for document analysis jobs
export const analysisWorker = new Worker(
  'evidence-analysis',
  async (job: Job) => {
    const { url } = job.data;
    const analyzer = new DocumentAnalyzer();
    
    console.log(`Processing analysis job: ${url}`);
    
    try {
      const content = await analyzer.extractWebContent(url);
      // await analyzer.close(); // DocumentAnalyzer doesn't have close method
      
      return { success: true, content };
    } catch (error) {
      console.error(`Analysis job failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  },
  { connection }
);

// Queue management functions
export async function addSearchJob(query: string, type: string = 'web', options: any = {}) {
  return await searchQueue.add('search', { query, type, options }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

export async function addAnalysisJob(url: string) {
  return await analysisQueue.add('analyze', { url }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

// Cleanup function
export async function closeQueues() {
  await searchQueue.close();
  await analysisQueue.close();
  await searchWorker.close();
  await analysisWorker.close();
  await connection.quit();
}