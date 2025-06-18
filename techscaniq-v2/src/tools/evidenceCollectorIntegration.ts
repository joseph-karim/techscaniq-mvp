import { spawn } from 'child_process';
import { Queue, QueueEvents } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { Evidence, EvidenceSource } from '../types';
import { config } from '../config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Crawl4AIResult {
  success: boolean;
  error?: string;
  evidence_count: number;
  pages_crawled: number;
  evidence_items: Array<{
    type: string;
    source: string;
    confidence: number;
    content: {
      title: string;
      url: string;
      summary: string;
      keyword_relevance: number;
      analysis?: any; // LLM analysis if available
    };
  }>;
}

interface SkyvernResult {
  discovered_urls: string[];
  technical_evidence: any[];
  authentication_opportunities: string[];
  api_endpoints: string[];
  product_features: string[];
  screenshots: string[];
}

export class EvidenceCollectorIntegration {
  private crawl4aiScript: string;
  private skyvernQueue: Queue;
  private skyvernQueueEvents: QueueEvents;

  constructor() {
    // Path to existing crawl4ai script
    this.crawl4aiScript = path.join(__dirname, '../../../../src/workers/crawl4ai_documented_deep.py');
    
    // Initialize Skyvern queue
    this.skyvernQueue = new Queue('skyvern-discovery', {
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
    });
    
    // Initialize queue events
    this.skyvernQueueEvents = new QueueEvents('skyvern-discovery', {
      connection: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
      },
    });
  }

  /**
   * Use crawl4ai for deep content collection with BestFirst strategy
   */
  async collectWithCrawl4AI(
    domain: string,
    investmentThesis: string,
    maxPages: number = 200
  ): Promise<Evidence[]> {
    console.log(`🕷️ Starting crawl4ai deep collection for ${domain}`);

    return new Promise((resolve, reject) => {
      const scanRequestId = uuidv4();
      
      const pythonProcess = spawn('python3', [
        this.crawl4aiScript,
        domain,
        investmentThesis,
        scanRequestId,
      ]);

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        outputData += chunk;
        
        // Check for progress updates
        if (chunk.includes('📄 Crawled')) {
          console.log(chunk.trim());
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        reject(new Error('Crawl4AI timeout after 5 minutes'));
      }, 300000); // 5 minute timeout

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error('Crawl4AI error:', errorData);
          reject(new Error(`Crawl4AI process exited with code ${code}`));
          return;
        }

        try {
          // Parse the JSON output
          const lines = outputData.trim().split('\n');
          const resultLine = lines[lines.length - 1]; // Last line should be JSON
          const result: Crawl4AIResult = JSON.parse(resultLine);

          if (!result.success) {
            reject(new Error(result.error || 'Crawl4AI collection failed'));
            return;
          }

          // Convert crawl4ai evidence to our Evidence type
          const evidence: Evidence[] = result.evidence_items.map(item => ({
            id: uuidv4(),
            researchQuestionId: '', // Will be mapped later
            pillarId: this.mapToPillar(item.type),
            source: {
              type: 'web',
              name: item.content.title || 'Unknown',
              url: item.source,
              credibilityScore: this.calculateCredibility(item.source, item.confidence),
              publishDate: undefined,
              author: undefined,
            },
            content: item.content.summary || JSON.stringify(item.content),
            metadata: {
              extractedAt: new Date(),
              extractionMethod: 'crawl4ai_bestfirst',
              wordCount: item.content.summary?.split(/\s+/).length || 0,
              language: 'en',
              keywords: this.extractKeywords(item),
              sentiment: undefined,
              confidence: item.confidence,
              crawl4aiType: item.type,
              keywordRelevance: item.content.keyword_relevance,
              llmAnalysis: item.content.analysis,
            },
            qualityScore: {
              overall: 0, // Will be calculated by quality evaluation node
              components: {
                relevance: item.content.keyword_relevance,
                credibility: item.confidence,
                recency: 0.5, // Default
                specificity: item.content.analysis ? 0.8 : 0.6,
                bias: 0.5,
              },
              reasoning: `Crawl4AI confidence: ${item.confidence}, type: ${item.type}`,
            },
            createdAt: new Date(),
          }));

          console.log(`✅ Crawl4AI collected ${evidence.length} evidence pieces from ${result.pages_crawled} pages`);
          resolve(evidence);
        } catch (error) {
          reject(new Error(`Failed to parse Crawl4AI output: ${error instanceof Error ? error.message : String(error)}`));
        }
      });
    });
  }

  /**
   * Use Skyvern for interactive discovery and demo access
   */
  async discoverWithSkyvern(
    targetUrl: string,
    discoveryMode: 'demo_access' | 'product_discovery' | 'technical_docs' | 'api_endpoints',
    previousFindings?: string[]
  ): Promise<Evidence[]> {
    console.log(`🤖 Starting Skyvern discovery for ${targetUrl} in ${discoveryMode} mode`);

    const job = await this.skyvernQueue.add('discover', {
      scanRequestId: uuidv4(),
      targetUrl,
      discoveryMode,
      iterationContext: {
        previousFindings: previousFindings || [],
        depthLevel: 1,
        authenticationAttempted: false,
        discoveredPaths: [],
      },
    });

    // Wait for job completion
    const result = await job.waitUntilFinished(this.skyvernQueueEvents);

    if (!result || result.error) {
      throw new Error(`Skyvern discovery failed: ${result?.error || 'Unknown error'}`);
    }

    // Convert Skyvern findings to Evidence
    const evidence: Evidence[] = [];
    const skyvernData = result as SkyvernResult;

    // Process discovered URLs
    skyvernData.discovered_urls?.forEach(url => {
      evidence.push(this.createEvidenceFromUrl(url, 'skyvern_discovery', 0.7));
    });

    // Process technical evidence
    skyvernData.technical_evidence?.forEach(tech => {
      evidence.push({
        id: uuidv4(),
        researchQuestionId: '',
        pillarId: 'tech-architecture',
        source: {
          type: 'web',
          name: 'Skyvern Technical Discovery',
          url: targetUrl,
          credibilityScore: 0.8,
        },
        content: JSON.stringify(tech),
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'skyvern_interactive',
          wordCount: JSON.stringify(tech).length,
          language: 'en',
          keywords: ['technical', 'architecture', 'infrastructure'],
          confidence: 0.8,
        },
        qualityScore: {
          overall: 0,
          components: {
            relevance: 0.8,
            credibility: 0.8,
            recency: 0.9,
            specificity: 0.7,
            bias: 0.8,
          },
          reasoning: 'Skyvern interactive discovery',
        },
        createdAt: new Date(),
      });
    });

    // Process API endpoints
    skyvernData.api_endpoints?.forEach(endpoint => {
      evidence.push({
        id: uuidv4(),
        researchQuestionId: '',
        pillarId: 'tech-architecture',
        source: {
          type: 'api',
          name: 'API Endpoint Discovery',
          url: endpoint,
          credibilityScore: 0.9,
        },
        content: `API Endpoint: ${endpoint}`,
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'skyvern_api_discovery',
          wordCount: 10,
          language: 'en',
          keywords: ['api', 'endpoint', 'integration'],
          confidence: 0.9,
        },
        qualityScore: {
          overall: 0,
          components: {
            relevance: 0.9,
            credibility: 0.9,
            recency: 0.9,
            specificity: 0.9,
            bias: 0.9,
          },
          reasoning: 'Direct API endpoint discovery',
        },
        createdAt: new Date(),
      });
    });

    console.log(`✅ Skyvern discovered ${evidence.length} evidence pieces`);
    return evidence;
  }

  /**
   * Combined evidence collection using both tools
   */
  async collectComprehensiveEvidence(
    domain: string,
    investmentThesis: string
  ): Promise<Evidence[]> {
    console.log(`🎯 Starting comprehensive evidence collection for ${domain}`);

    try {
      // Run both collectors in parallel
      const [crawl4aiEvidence, skyvernEvidence] = await Promise.all([
        // Deep content crawl with crawl4ai
        this.collectWithCrawl4AI(domain, investmentThesis, 200),
        
        // Interactive discovery with Skyvern
        Promise.all([
          this.discoverWithSkyvern(`https://${domain}`, 'demo_access'),
          this.discoverWithSkyvern(`https://${domain}`, 'technical_docs'),
          this.discoverWithSkyvern(`https://${domain}/api`, 'api_endpoints'),
        ]).then(results => results.flat()),
      ]);

      // Combine and deduplicate evidence
      const allEvidence = [...crawl4aiEvidence, ...skyvernEvidence];
      const uniqueEvidence = this.deduplicateEvidence(allEvidence);

      console.log(`✅ Total evidence collected: ${uniqueEvidence.length} pieces`);
      console.log(`   - Crawl4AI: ${crawl4aiEvidence.length}`);
      console.log(`   - Skyvern: ${skyvernEvidence.length}`);
      console.log(`   - After deduplication: ${uniqueEvidence.length}`);

      return uniqueEvidence;
    } catch (error) {
      console.error('Comprehensive evidence collection error:', error);
      throw error;
    }
  }

  private mapToPillar(crawl4aiType: string): string {
    const mapping: Record<string, string> = {
      'pricing_info': 'financial-performance',
      'company_info': 'team-organization',
      'technical_docs': 'tech-architecture',
      'customer_evidence': 'market-position',
      'product_info': 'tech-architecture',
      'security_info': 'tech-architecture',
      'integration_info': 'tech-architecture',
      'thought_leadership': 'market-position',
      'llm_analysis': 'comprehensive',
    };

    return mapping[crawl4aiType] || 'general';
  }

  private calculateCredibility(url: string, confidence: number): number {
    // Base credibility on confidence
    let credibility = confidence;

    // Boost for certain domains
    const trustedDomains = ['github.com', 'docs.', 'api.', '.edu', '.gov'];
    if (trustedDomains.some(domain => url.includes(domain))) {
      credibility = Math.min(credibility + 0.1, 0.95);
    }

    return credibility;
  }

  private extractKeywords(item: any): string[] {
    const keywords: string[] = [];
    
    // Extract from type
    if (item.type) {
      keywords.push(...item.type.split('_'));
    }

    // Extract from content if available
    if (item.content.analysis) {
      // Simple keyword extraction from LLM analysis
      const text = JSON.stringify(item.content.analysis).toLowerCase();
      const techKeywords = ['api', 'cloud', 'saas', 'enterprise', 'integration', 'security'];
      keywords.push(...techKeywords.filter(k => text.includes(k)));
    }

    return [...new Set(keywords)];
  }

  private createEvidenceFromUrl(url: string, method: string, confidence: number): Evidence {
    return {
      id: uuidv4(),
      researchQuestionId: '',
      pillarId: 'general',
      source: {
        type: 'web',
        name: 'Discovered URL',
        url,
        credibilityScore: confidence,
      },
      content: `Discovered URL: ${url}`,
      metadata: {
        extractedAt: new Date(),
        extractionMethod: method,
        wordCount: 10,
        language: 'en',
        keywords: [],
        confidence,
      },
      qualityScore: {
        overall: 0,
        components: {
          relevance: confidence,
          credibility: confidence,
          recency: 0.8,
          specificity: 0.5,
          bias: 0.7,
        },
        reasoning: 'URL discovery',
      },
      createdAt: new Date(),
    };
  }

  private deduplicateEvidence(evidence: Evidence[]): Evidence[] {
    const seen = new Set<string>();
    return evidence.filter(e => {
      const key = e.source.url || e.content.substring(0, 100);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}