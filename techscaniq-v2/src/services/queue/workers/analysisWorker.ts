import { Worker, Job } from 'bullmq';
import { connection } from '../index';
import { DocumentAnalyzer } from '../../../tools/documentAnalyzer';
import { TechnicalCollector } from '../../../tools/technicalCollector';
import { WebTechDetector } from '../../../tools/webTechDetector';
import { ExtractedContent } from '../../../tools/documentAnalyzer';

interface AnalysisJobData {
  url: string;
  type: 'content' | 'technical' | 'tech-stack';
  options?: {
    extractImages?: boolean;
    extractLinks?: boolean;
    extractStructuredData?: boolean;
    depth?: number;
  };
}

interface AnalysisJobResult {
  success: boolean;
  url: string;
  content?: ExtractedContent;
  technical?: any;
  techStack?: any;
  error?: string;
}

export const analysisWorker = new Worker<AnalysisJobData, AnalysisJobResult>(
  'document-analysis',
  async (job: Job<AnalysisJobData>) => {
    const { url, type, options } = job.data;
    
    console.log(`[Analysis Worker] Processing: ${url} (type: ${type})`);
    
    try {
      await job.updateProgress(10);
      
      let result: AnalysisJobResult = {
        success: true,
        url,
      };
      
      switch (type) {
        case 'content': {
          const analyzer = new DocumentAnalyzer();
          const content = await analyzer.extractWebContent(url);
          
          await job.updateProgress(80);
          
          if (content) {
            result.content = content;
            await job.log(`Extracted ${content.text.length} characters of content`);
          } else {
            throw new Error('Failed to extract content');
          }
          break;
        }
        
        case 'technical': {
          const collector = new TechnicalCollector();
          const technical = await collector.collectTechnicalProfile(url);
          
          await job.updateProgress(80);
          
          result.technical = technical;
          await job.log(`Collected technical profile with ${Object.keys(technical).length} sections`);
          
          // Cleanup
          await collector.close();
          break;
        }
        
        case 'tech-stack': {
          const detector = new WebTechDetector();
          const techStack = await detector.detectTechnologies(url);
          
          await job.updateProgress(80);
          
          result.techStack = techStack;
          const techCount = Object.values(techStack.technologies)
            .reduce((sum, techs) => sum + techs.length, 0);
          await job.log(`Detected ${techCount} technologies`);
          break;
        }
        
        default:
          throw new Error(`Unknown analysis type: ${type}`);
      }
      
      await job.updateProgress(100);
      return result;
      
    } catch (error) {
      console.error(`[Analysis Worker] Error:`, error);
      
      await job.log(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    connection,
    concurrency: 3, // Process 3 analysis jobs concurrently
    limiter: {
      max: 30,
      duration: 60000, // 30 analyses per minute
    },
  }
);

// Worker event handlers
analysisWorker.on('completed', (job) => {
  console.log(`[Analysis Worker] Job ${job.id} completed successfully`);
});

analysisWorker.on('failed', (job, err) => {
  console.error(`[Analysis Worker] Job ${job?.id} failed:`, err.message);
});

analysisWorker.on('error', (err) => {
  console.error('[Analysis Worker] Worker error:', err);
});

// Cleanup on worker shutdown
analysisWorker.on('closing', () => {
  console.log('[Analysis Worker] Shutting down...');
});

export default analysisWorker;