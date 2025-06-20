import { Browser, chromium, Page, BrowserContext } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { io, Socket } from 'socket.io-client';
import { mockServer } from '../mocks/server';
import { TestDataGenerator } from '../utils/test-data';
import { PerformanceMonitor } from '../utils/performance';

export interface E2ETestContext {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  supabase: SupabaseClient;
  websocket: Socket;
  mockServer: typeof mockServer;
  testData: TestDataGenerator;
  performance: PerformanceMonitor;
}

export interface ScanProgress {
  stage: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
  data?: any;
}

export abstract class PipelineE2ETest {
  protected context!: E2ETestContext;
  
  async setup(): Promise<void> {
    // Start mock servers
    await mockServer.start();
    
    // Initialize browser
    this.context = {} as E2ETestContext;
    this.context.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0
    });
    
    this.context.context = await this.context.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });
    
    this.context.page = await this.context.context.newPage();
    
    // Set up request interception
    await this.context.page.route('**/*', (route) => {
      if (this.shouldMockRequest(route.request())) {
        return this.handleMockedRequest(route);
      }
      return route.continue();
    });
    
    // Initialize test utilities
    this.context.supabase = createClient(
      process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.context.websocket = io(process.env.TEST_WS_URL || 'http://localhost:4000', {
      autoConnect: false,
      transports: ['websocket'],
    });
    
    this.context.testData = new TestDataGenerator();
    this.context.performance = new PerformanceMonitor();
    this.context.mockServer = mockServer;
    
    // Set up performance monitoring
    this.context.page.on('metrics', (metrics) => {
      this.context.performance.record(metrics);
    });
    
    // Set up console logging for debugging
    this.context.page.on('console', (msg) => {
      if (process.env.DEBUG) {
        console.log(`Browser console [${msg.type()}]:`, msg.text());
      }
    });
    
    // Set up request/response logging
    if (process.env.DEBUG) {
      this.context.page.on('request', (request) => {
        console.log('Request:', request.method(), request.url());
      });
      
      this.context.page.on('response', (response) => {
        console.log('Response:', response.status(), response.url());
      });
    }
  }
  
  async teardown(): Promise<void> {
    // Disconnect websocket
    if (this.context.websocket?.connected) {
      this.context.websocket.disconnect();
    }
    
    // Close browser
    await this.context.browser?.close();
    
    // Stop mock server
    await mockServer.stop();
    
    // Generate performance report
    if (this.context.performance) {
      await this.context.performance.generateReport();
    }
  }
  
  protected abstract shouldMockRequest(request: any): boolean;
  protected abstract handleMockedRequest(route: any): Promise<void>;
  
  // Utility methods for common test operations
  protected async waitForPipelineCompletion(
    scanId: string,
    timeout: number = 120000
  ): Promise<void> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const status = await this.getScanStatus(scanId);
          
          if (status === 'completed') {
            clearInterval(checkInterval);
            resolve();
          } else if (status === 'failed') {
            clearInterval(checkInterval);
            const error = await this.getScanError(scanId);
            reject(new Error(`Scan ${scanId} failed: ${error}`));
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error(`Scan ${scanId} timed out after ${timeout}ms`));
          }
        } catch (error) {
          clearInterval(checkInterval);
          reject(error);
        }
      }, 1000);
    });
  }
  
  protected async getScanStatus(scanId: string): Promise<string> {
    const { data, error } = await this.context.supabase
      .from('scans')
      .select('status')
      .eq('id', scanId)
      .single();
    
    if (error) {
      throw new Error(`Failed to get scan status: ${error.message}`);
    }
    
    return data?.status || 'unknown';
  }
  
  protected async getScanError(scanId: string): Promise<string> {
    const { data } = await this.context.supabase
      .from('scans')
      .select('error_message')
      .eq('id', scanId)
      .single();
    
    return data?.error_message || 'Unknown error';
  }
  
  protected async waitForWebSocketConnection(): Promise<void> {
    await this.context.page.waitForFunction(
      () => {
        // @ts-ignore
        return window.__scanWebSocket?.readyState === WebSocket.OPEN;
      },
      { timeout: 10000 }
    );
  }
  
  protected async setupProgressTracking(): Promise<ScanProgress[]> {
    const progressUpdates: ScanProgress[] = [];
    
    await this.context.page.exposeFunction('onProgressUpdate', (update: ScanProgress) => {
      progressUpdates.push(update);
      if (process.env.DEBUG) {
        console.log('Progress update:', update);
      }
    });
    
    await this.context.page.evaluate(() => {
      // @ts-ignore
      if (window.__scanWebSocket) {
        // @ts-ignore
        window.__scanWebSocket.on('progress', (data: any) => {
          // @ts-ignore
          window.onProgressUpdate(data);
        });
      }
    });
    
    return progressUpdates;
  }
  
  protected async login(email: string, password: string): Promise<void> {
    await this.context.page.goto('/login');
    await this.context.page.fill('[data-testid="email-input"]', email);
    await this.context.page.fill('[data-testid="password-input"]', password);
    await this.context.page.click('[data-testid="login-button"]');
    await this.context.page.waitForURL('/dashboard', { timeout: 10000 });
  }
  
  protected async startScan(url: string): Promise<string> {
    await this.context.page.goto('/scan');
    await this.context.page.fill('[data-testid="url-input"]', url);
    await this.context.page.click('[data-testid="start-scan-button"]');
    
    // Wait for scan to start and get scan ID
    await this.context.page.waitForSelector('[data-testid="scan-id"]', { timeout: 10000 });
    const scanId = await this.context.page.getAttribute('[data-testid="scan-id"]', 'data-scan-id');
    
    if (!scanId) {
      throw new Error('Failed to get scan ID');
    }
    
    return scanId;
  }
  
  protected async verifyReportContent(scanId: string): Promise<void> {
    await this.context.page.goto(`/report/${scanId}`);
    await this.context.page.waitForSelector('[data-testid="report-title"]', { timeout: 30000 });
    
    // Verify all required sections are present
    const requiredSections = [
      'technology-section',
      'security-section',
      'performance-section',
      'architecture-section'
    ];
    
    for (const section of requiredSections) {
      await this.context.page.waitForSelector(`[data-testid="${section}"]`, { timeout: 10000 });
    }
  }
  
  protected async measurePageLoadTime(url: string): Promise<number> {
    const startTime = Date.now();
    await this.context.page.goto(url, { waitUntil: 'networkidle' });
    return Date.now() - startTime;
  }
}