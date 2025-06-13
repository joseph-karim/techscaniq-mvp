import { Worker, Job } from 'bullmq';
import { connection } from '../index';
import { WebSearchTool } from '../../../tools/webSearch';
import { Evidence } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

interface SearchJobData {
  query: string;
  type: 'web' | 'news' | 'academic';
  pillarId: string;
  questionId: string;
  options?: {
    limit?: number;
    dateRange?: string;
    domain?: string;
  };
}

interface SearchJobResult {
  success: boolean;
  query: string;
  results: any[];
  evidence?: Evidence[];
  error?: string;
}

export const searchWorker = new Worker<SearchJobData, SearchJobResult>(
  'evidence-search',
  async (job: Job<SearchJobData>) => {
    const { query, type, pillarId, questionId, options } = job.data;
    const searchTool = new WebSearchTool();
    
    console.log(`[Search Worker] Processing: ${query} (type: ${type})`);
    
    try {
      // Update job progress
      await job.updateProgress(10);
      
      // Perform search based on type
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
      
      await job.updateProgress(50);
      
      // Convert search results to evidence format
      const evidence: Evidence[] = results.map((result: any) => ({
        id: uuidv4(),
        researchQuestionId: questionId,
        pillarId: pillarId,
        source: {
          type: type === 'academic' ? 'academic' : 'web',
          name: result.source || result.title,
          url: result.url,
          credibilityScore: calculateCredibility(result, type),
          publishDate: result.publishedAt ? new Date(result.publishedAt) : undefined,
          author: result.author,
        },
        content: result.snippet || result.description || '',
        metadata: {
          extractedAt: new Date(),
          extractionMethod: `${type}_search`,
          wordCount: (result.snippet || result.description || '').split(/\s+/).length,
          language: 'en',
          keywords: extractKeywords(query, result),
          confidence: 0.7,
        },
        qualityScore: {
          overall: 0, // Will be evaluated later
          components: {
            relevance: 0,
            credibility: 0,
            recency: 0,
            specificity: 0,
            bias: 0,
          },
          reasoning: 'Pending quality evaluation',
        },
        createdAt: new Date(),
      }));
      
      await job.updateProgress(100);
      
      // Log results
      await job.log(`Found ${results.length} results for query: ${query}`);
      
      return {
        success: true,
        query,
        results,
        evidence,
      };
    } catch (error) {
      console.error(`[Search Worker] Error:`, error);
      
      // Log error
      await job.log(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        query,
        results: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 search jobs concurrently
    limiter: {
      max: 100,
      duration: 60000, // 100 searches per minute
    },
  }
);

// Helper functions
function calculateCredibility(result: any, type: string): number {
  let score = 0.5; // Base score
  
  // Academic sources get higher credibility
  if (type === 'academic') {
    score += 0.3;
  }
  
  // News from major outlets
  if (result.source && ['Reuters', 'Bloomberg', 'TechCrunch', 'Forbes'].some(s => 
    result.source.includes(s)
  )) {
    score += 0.2;
  }
  
  // Recent content
  if (result.publishedAt) {
    const daysOld = (Date.now() - new Date(result.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 30) score += 0.1;
    if (daysOld < 7) score += 0.1;
  }
  
  return Math.min(score, 0.95);
}

function extractKeywords(query: string, result: any): string[] {
  const keywords = new Set<string>();
  
  // Add query terms
  query.toLowerCase().split(/\s+/).forEach(term => {
    if (term.length > 3) keywords.add(term);
  });
  
  // Extract from title
  if (result.title) {
    result.title.toLowerCase().split(/\s+/).forEach((term: string) => {
      if (term.length > 4 && !['the', 'and', 'for', 'with'].includes(term)) {
        keywords.add(term);
      }
    });
  }
  
  return Array.from(keywords);
}

// Worker event handlers
searchWorker.on('completed', (job) => {
  console.log(`[Search Worker] Job ${job.id} completed successfully`);
});

searchWorker.on('failed', (job, err) => {
  console.error(`[Search Worker] Job ${job?.id} failed:`, err.message);
});

searchWorker.on('error', (err) => {
  console.error('[Search Worker] Worker error:', err);
});

export default searchWorker;