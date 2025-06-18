import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { config } from '../../../config';
import { Evidence, EvidenceSource } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

interface SkyvernJobData {
  url: string;
  tasks: Array<{
    type: 'navigate' | 'click' | 'fill' | 'extract' | 'screenshot';
    target?: string;
    value?: string;
    description?: string;
  }>;
  metadata?: any;
}

interface SkyvernAPIResponse {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: {
    discovered_urls: string[];
    extracted_data: Record<string, any>;
    screenshots: string[];
    errors: string[];
  };
}

export class SkyvernWorker {
  private worker: Worker;
  private skyvernApiKey: string;
  private skyvernApiUrl: string;

  constructor() {
    this.skyvernApiKey = process.env.SKYVERN_API_KEY || '';
    this.skyvernApiUrl = process.env.SKYVERN_API_URL || 'https://api.skyvern.com/v1';
    
    this.worker = new Worker(
      'skyvern-discovery',
      async (job: Job<SkyvernJobData>) => {
        return this.processJob(job);
      },
      {
        connection: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
        },
        concurrency: 2, // Skyvern tasks can be resource-intensive
      }
    );

    this.setupEventHandlers();
  }

  private async processJob(job: Job<SkyvernJobData>): Promise<Evidence[]> {
    const { url, tasks, metadata } = job.data;
    console.log(`🤖 Starting Skyvern automation for ${url}`);

    try {
      // Create Skyvern task
      const taskResponse = await this.createSkyvernTask(url, tasks);
      
      // Poll for completion
      const result = await this.pollTaskCompletion(taskResponse.task_id);
      
      // Convert results to evidence
      return this.convertToEvidence(result, url, metadata);
    } catch (error) {
      console.error('Skyvern job failed:', error);
      throw error;
    }
  }

  private async createSkyvernTask(url: string, tasks: any[]): Promise<SkyvernAPIResponse> {
    try {
      const response = await axios.post(
        `${this.skyvernApiUrl}/tasks`,
        {
          url,
          workflow: tasks.map(task => ({
            action: task.type,
            ...task,
          })),
          options: {
            screenshot_on_completion: true,
            extract_page_content: true,
            follow_redirects: true,
            max_retries: 3,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.skyvernApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create Skyvern task:', error);
      throw error;
    }
  }

  private async pollTaskCompletion(taskId: string, maxAttempts = 60): Promise<SkyvernAPIResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `${this.skyvernApiUrl}/tasks/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.skyvernApiKey}`,
            },
          }
        );

        const task = response.data;
        
        if (task.status === 'completed' || task.status === 'failed') {
          return task;
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error polling Skyvern task:', error);
      }
    }

    throw new Error('Skyvern task timed out');
  }

  private convertToEvidence(
    skyvernResult: SkyvernAPIResponse,
    url: string,
    metadata: any
  ): Evidence[] {
    const evidence: Evidence[] = [];

    if (!skyvernResult.result) {
      return evidence;
    }

    const { discovered_urls, extracted_data, screenshots } = skyvernResult.result;

    // Evidence from discovered URLs
    if (discovered_urls && discovered_urls.length > 0) {
      const urlEvidence: Evidence = {
        id: uuidv4(),
        researchQuestionId: 'discovered-urls',
        pillarId: 'technical',
        source: {
          type: 'web' as const,
          name: 'Skyvern URL Discovery',
          url: url,
          publishedDate: new Date(),
          author: 'Skyvern',
        },
        content: JSON.stringify({
          discovered_urls,
          total_count: discovered_urls.length,
        }, null, 2),
        metadata: {
          dataType: 'urls',
          extractedDate: new Date(),
          relevanceScore: 0.8,
          tags: ['discovery', 'urls', 'navigation'],
          ...metadata,
        },
        qualityScore: {
          relevance: 0.8,
          credibility: 1.0,
          recency: 1.0,
          completeness: 0.85,
          overall: 0.91,
        },
        createdAt: new Date(),
      };
      evidence.push(urlEvidence);
    }

    // Evidence from extracted data
    if (extracted_data && Object.keys(extracted_data).length > 0) {
      const dataEvidence: Evidence = {
        id: uuidv4(),
        researchQuestionId: 'extracted-data',
        pillarId: 'product',
        source: {
          type: 'web' as const,
          name: 'Skyvern Data Extraction',
          url: url,
          publishedDate: new Date(),
          author: 'Skyvern',
        },
        content: JSON.stringify(extracted_data, null, 2),
        metadata: {
          dataType: 'structured-data',
          extractedDate: new Date(),
          relevanceScore: 0.9,
          tags: ['extraction', 'data', 'structured'],
          ...metadata,
        },
        qualityScore: {
          relevance: 0.9,
          credibility: 1.0,
          recency: 1.0,
          completeness: 0.9,
          overall: 0.95,
        },
        createdAt: new Date(),
      };
      evidence.push(dataEvidence);
    }

    // Evidence from screenshots
    if (screenshots && screenshots.length > 0) {
      const screenshotEvidence: Evidence = {
        id: uuidv4(),
        researchQuestionId: 'visual-evidence',
        pillarId: 'product',
        source: {
          type: 'web' as const,
          name: 'Skyvern Screenshots',
          url: url,
          publishedDate: new Date(),
          author: 'Skyvern',
        },
        content: JSON.stringify({
          screenshot_urls: screenshots,
          count: screenshots.length,
          description: 'Visual evidence of website features and UI',
        }, null, 2),
        metadata: {
          dataType: 'screenshots',
          extractedDate: new Date(),
          relevanceScore: 0.7,
          tags: ['visual', 'ui', 'screenshots'],
          ...metadata,
        },
        qualityScore: {
          relevance: 0.7,
          credibility: 1.0,
          recency: 1.0,
          completeness: 0.8,
          overall: 0.88,
        },
        createdAt: new Date(),
      };
      evidence.push(screenshotEvidence);
    }

    return evidence;
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`✅ Skyvern job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`❌ Skyvern job ${job?.id} failed:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('Skyvern worker error:', err);
    });
  }

  async start(): Promise<void> {
    console.log('🤖 Starting Skyvern worker...');
  }

  async stop(): Promise<void> {
    await this.worker.close();
    console.log('🛑 Skyvern worker stopped');
  }
}