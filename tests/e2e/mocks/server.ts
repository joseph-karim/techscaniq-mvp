import express, { Express, Request, Response } from 'express';
import { Server } from 'http';
import { TestDataGenerator } from '../utils/test-data';

interface MockScenario {
  name: string;
  handler: (req: Request, res: Response) => void;
}

class MockServer {
  private app: Express | null = null;
  private server: Server | null = null;
  private port: number = 5555;
  private scenarios: Map<string, MockScenario> = new Map();
  private currentScenario: string | null = null;
  private requestDelay: number = 0;
  private testDataGenerator: TestDataGenerator;
  
  constructor() {
    this.testDataGenerator = new TestDataGenerator();
    this.setupDefaultScenarios();
  }
  
  async start(): Promise<void> {
    if (this.server) {
      return; // Already running
    }
    
    this.app = express();
    this.app.use(express.json());
    
    // Middleware to simulate delays
    this.app.use((req, res, next) => {
      if (this.requestDelay > 0) {
        setTimeout(next, this.requestDelay);
      } else {
        next();
      }
    });
    
    // Setup routes
    this.setupRoutes();
    
    return new Promise((resolve) => {
      this.server = this.app!.listen(this.port, () => {
        console.log(`Mock server running on port ${this.port}`);
        resolve();
      });
    });
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null;
          this.app = null;
          resolve();
        });
      });
    }
  }
  
  setScenario(scenarioName: string): void {
    if (!this.scenarios.has(scenarioName)) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }
    this.currentScenario = scenarioName;
  }
  
  clearScenario(): void {
    this.currentScenario = null;
  }
  
  setDelay(delayMs: number): void {
    this.requestDelay = delayMs;
  }
  
  simulateDisconnect(): void {
    // Simulate network disconnection by stopping the server
    if (this.server) {
      this.server.close();
    }
  }
  
  async connect(): Promise<void> {
    // Reconnect after disconnect
    if (!this.server) {
      await this.start();
    }
  }
  
  private setupRoutes(): void {
    if (!this.app) return;
    
    // Mock OpenAI/Anthropic API
    this.app.post('/v1/messages', (req, res) => {
      if (this.currentScenario) {
        const scenario = this.scenarios.get(this.currentScenario);
        if (scenario) {
          return scenario.handler(req, res);
        }
      }
      
      // Default AI response
      res.json({
        id: 'msg_123',
        content: [
          {
            type: 'text',
            text: JSON.stringify(this.testDataGenerator.generateMockAIResponse('technology'))
          }
        ]
      });
    });
    
    // Mock Crawl4AI endpoint
    this.app.post('/api/crawl', (req, res) => {
      const { url } = req.body;
      
      if (this.currentScenario === 'scraping-failure') {
        return res.status(500).json({
          error: 'Failed to scrape website',
          message: 'Unable to access the website'
        });
      }
      
      // Determine website type from URL
      let websiteType: 'simple' | 'complex' | 'enterprise' = 'simple';
      if (url.includes('enterprise')) {
        websiteType = 'enterprise';
      } else if (url.includes('ecommerce') || url.includes('saas')) {
        websiteType = 'complex';
      }
      
      const websiteData = this.testDataGenerator.generateWebsiteData(websiteType);
      
      res.json({
        success: true,
        html: websiteData.html,
        metadata: {
          title: `Test Website - ${url}`,
          description: 'Test website for E2E testing',
          technologies: websiteData.technologies
        }
      });
    });
    
    // Mock Jina API
    this.app.post('/api/jina/parse', (req, res) => {
      const { url } = req.body;
      
      res.json({
        title: `Page Title for ${url}`,
        content: 'Parsed content from Jina',
        links: ['/about', '/products', '/contact'],
        images: ['logo.png', 'hero.jpg']
      });
    });
    
    // Mock Serena MCP endpoint
    this.app.post('/api/serena/analyze', (req, res) => {
      if (this.currentScenario === 'serena-timeout') {
        // Don't respond to simulate timeout
        return;
      }
      
      res.json({
        symbols: [
          {
            name: 'AppComponent',
            kind: 'class',
            children: [
              { name: 'constructor', kind: 'method' },
              { name: 'render', kind: 'method' }
            ]
          }
        ],
        patterns: ['MVC', 'Observer'],
        insights: {
          frameworkDetection: [
            { name: 'React', confidence: 0.95, evidence: 'useState hook found' }
          ],
          securityIssues: []
        }
      });
    });
    
    // Mock security scanner endpoint
    this.app.post('/api/security/scan', (req, res) => {
      res.json(this.testDataGenerator.generateMockAIResponse('security'));
    });
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }
  
  private setupDefaultScenarios(): void {
    // Scraping failure scenario
    this.scenarios.set('scraping-failure', {
      name: 'scraping-failure',
      handler: (req, res) => {
        res.status(500).json({
          error: 'Scraping failed',
          message: 'Failed to scrape website'
        });
      }
    });
    
    // Timeout scenario
    this.scenarios.set('timeout', {
      name: 'timeout',
      handler: (req, res) => {
        // Don't respond to simulate timeout
      }
    });
    
    // Rate limit scenario
    this.scenarios.set('rate-limit', {
      name: 'rate-limit',
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: 60
        });
      }
    });
    
    // Invalid response scenario
    this.scenarios.set('invalid-response', {
      name: 'invalid-response',
      handler: (req, res) => {
        res.status(200).send('Invalid JSON response');
      }
    });
    
    // Partial success scenario
    this.scenarios.set('partial-success', {
      name: 'partial-success',
      handler: (req, res) => {
        res.json({
          success: true,
          data: this.testDataGenerator.generateMockAIResponse('technology'),
          warnings: ['Some features could not be analyzed'],
          errors: ['Failed to analyze /admin section due to authentication']
        });
      }
    });
    
    // Large response scenario
    this.scenarios.set('large-response', {
      name: 'large-response',
      handler: (req, res) => {
        const largeData = {
          technologies: Array(1000).fill(null).map((_, i) => ({
            name: `Technology ${i}`,
            version: `${i}.0.0`,
            confidence: Math.random()
          })),
          files: Array(5000).fill(null).map((_, i) => ({
            path: `/file${i}.js`,
            size: Math.floor(Math.random() * 100000),
            type: 'javascript'
          }))
        };
        
        res.json(largeData);
      }
    });
    
    // Authentication failure scenario
    this.scenarios.set('auth-failure', {
      name: 'auth-failure',
      handler: (req, res) => {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid API key'
        });
      }
    });
  }
}

export const mockServer = new MockServer();