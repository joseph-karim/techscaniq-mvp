import { Worker, Job } from 'bullmq';
import { connection } from '../index';
import { TechnicalCollector } from '../../../tools/technicalCollector';
import { OperatorAnalyzer } from '../../../tools/operatorAnalyzer';
import { APIDiscovery } from '../../../tools/apiDiscovery';

interface TechnicalJobData {
  url: string;
  type: 'technical-profile' | 'operator-flow' | 'api-discovery';
  options?: any;
}

interface TechnicalJobResult {
  success: boolean;
  url: string;
  data?: any;
  error?: string;
}

export const technicalWorker = new Worker<TechnicalJobData, TechnicalJobResult>(
  'technical-analysis',
  async (job: Job<TechnicalJobData>) => {
    const { url, type, options } = job.data;
    
    console.log(`[Technical Worker] Processing: ${url} (type: ${type})`);
    
    try {
      await job.updateProgress(10);
      
      let result: TechnicalJobResult = {
        success: true,
        url,
      };
      
      switch (type) {
        case 'technical-profile': {
          const collector = new TechnicalCollector();
          const profile = await collector.collectTechnicalProfile(url);
          
          await job.updateProgress(80);
          
          result.data = profile;
          await job.log(`Collected technical profile with ${Object.keys(profile).length} sections`);
          
          // Cleanup
          await collector.close();
          break;
        }
        
        case 'operator-flow': {
          const operator = new OperatorAnalyzer();
          await operator.initialize();
          
          await job.updateProgress(30);
          
          const flowResult = await operator.analyzeUserFlow(
            url,
            options?.flowDescription || 'Analyze main user interactions'
          );
          
          await job.updateProgress(80);
          
          result.data = flowResult;
          await job.log(`Operator analysis: ${flowResult.success ? 'Success' : 'Failed'}`);
          
          // Cleanup
          await operator.close();
          break;
        }
        
        case 'api-discovery': {
          const apiDiscovery = new APIDiscovery();
          const apis = await apiDiscovery.discoverAPIs(url);
          
          await job.updateProgress(80);
          
          result.data = apis;
          await job.log(`Discovered ${apis.endpoints.length} API endpoints`);
          break;
        }
        
        default:
          throw new Error(`Unknown technical analysis type: ${type}`);
      }
      
      await job.updateProgress(100);
      return result;
      
    } catch (error) {
      console.error(`[Technical Worker] Error:`, error);
      
      await job.log(`Technical analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    connection,
    concurrency: 2, // Only 2 concurrent technical analyses (resource intensive)
    limiter: {
      max: 10,
      duration: 60000, // 10 technical analyses per minute
    },
  }
);

// Worker event handlers
technicalWorker.on('completed', (job) => {
  console.log(`[Technical Worker] Job ${job.id} completed successfully`);
});

technicalWorker.on('failed', (job, err) => {
  console.error(`[Technical Worker] Job ${job?.id} failed:`, err.message);
});

technicalWorker.on('error', (err) => {
  console.error('[Technical Worker] Worker error:', err);
});

export default technicalWorker;