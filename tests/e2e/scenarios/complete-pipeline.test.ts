import { test, expect } from '@playwright/test';
import { PipelineE2ETest } from '../framework/pipeline-test-base';
import { mockWebsite } from '../fixtures/websites';

class CompletePipelineTest extends PipelineE2ETest {
  protected shouldMockRequest(request: any): boolean {
    // Mock external API calls during tests
    const url = request.url();
    return (
      url.includes('api.openai.com') ||
      url.includes('api.anthropic.com') ||
      url.includes('browserless.io') ||
      url.includes('jina.ai') ||
      url.includes('crawl4ai')
    );
  }
  
  protected async handleMockedRequest(route: any): Promise<void> {
    const url = route.request().url();
    
    if (url.includes('api.anthropic.com') || url.includes('api.openai.com')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'msg_test',
          content: [
            {
              type: 'text',
              text: JSON.stringify(this.context.testData.generateMockAIResponse('technology'))
            }
          ]
        })
      });
    }
    
    if (url.includes('crawl4ai') || url.includes('jina.ai')) {
      const websiteData = this.context.testData.generateWebsiteData('complex');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          html: websiteData.html,
          metadata: {
            technologies: websiteData.technologies
          }
        })
      });
    }
    
    return route.continue();
  }
}

test.describe('Complete Scan-to-Report Pipeline', () => {
  let testContext: CompletePipelineTest;
  
  test.beforeEach(async () => {
    testContext = new CompletePipelineTest();
    await testContext.setup();
  });
  
  test.afterEach(async () => {
    await testContext.teardown();
  });
  
  test('should complete full pipeline for simple website', async () => {
    const { page, performance } = testContext.context;
    
    // Start performance measurement
    performance.startMeasure('full-pipeline');
    
    // 1. Navigate to scan page
    await page.goto('/scan');
    
    // 2. Enter URL and start scan
    const testUrl = 'https://example-tech-company.com';
    await page.fill('[data-testid="url-input"]', testUrl);
    await page.click('[data-testid="start-scan-button"]');
    
    // 3. Verify scan started
    await expect(page.locator('[data-testid="scan-progress"]')).toBeVisible();
    
    // 4. Wait for WebSocket connection
    await testContext.waitForWebSocketConnection();
    
    // 5. Monitor progress updates
    const progressUpdates = await testContext.setupProgressTracking();
    
    // 6. Wait for scan completion
    const scanId = await page.getAttribute('[data-testid="scan-id"]', 'data-scan-id');
    await testContext.waitForPipelineCompletion(scanId!);
    
    // 7. Verify all pipeline stages completed
    expect(progressUpdates).toContainEqual(
      expect.objectContaining({
        stage: 'web_scraping',
        status: 'completed'
      })
    );
    
    expect(progressUpdates).toContainEqual(
      expect.objectContaining({
        stage: 'technology_detection',
        status: 'completed'
      })
    );
    
    expect(progressUpdates).toContainEqual(
      expect.objectContaining({
        stage: 'code_analysis',
        status: 'completed'
      })
    );
    
    expect(progressUpdates).toContainEqual(
      expect.objectContaining({
        stage: 'report_generation',
        status: 'completed'
      })
    );
    
    // 8. Navigate to report
    await page.click('[data-testid="view-report-button"]');
    await page.waitForURL(/\/report\/.+/);
    
    // 9. Verify report content
    await expect(page.locator('[data-testid="report-title"]')).toContainText(testUrl);
    await expect(page.locator('[data-testid="technology-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="performance-section"]')).toBeVisible();
    
    // 10. Verify Serena integration (if enabled)
    if (process.env.ENABLE_SERENA_TESTS === 'true') {
      await expect(page.locator('[data-testid="code-analysis-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="detected-frameworks"]')).toContainText(/React|Vue|Angular/);
    }
    
    // 11. Check performance metrics
    performance.endMeasure('full-pipeline');
    const metrics = performance.getMetrics('full-pipeline')[0];
    
    expect(metrics.duration).toBeLessThan(60000); // 60 seconds
    expect(metrics.memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB
  });
  
  test('should handle pipeline failures gracefully', async () => {
    const { page, mockServer } = testContext.context;
    
    // Mock service to fail
    mockServer.setScenario('scraping-failure');
    
    // Start scan
    await page.goto('/scan');
    await page.fill('[data-testid="url-input"]', 'https://fail-test.com');
    await page.click('[data-testid="start-scan-button"]');
    
    // Wait for error state
    await expect(page.locator('[data-testid="scan-error"]')).toBeVisible({
      timeout: 30000
    });
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /Failed to scrape website|Unable to access the website/
    );
    
    // Verify retry option available
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Test retry functionality
    mockServer.clearScenario();
    await page.click('[data-testid="retry-button"]');
    
    // Should succeed on retry
    await testContext.waitForPipelineCompletion(
      await page.getAttribute('[data-testid="scan-id"]', 'data-scan-id')!
    );
  });
  
  test('should handle concurrent scans', async () => {
    const { page, performance } = testContext.context;
    
    performance.startMeasure('concurrent-scans');
    
    // Start multiple scans
    const scanPromises = [];
    const urls = [
      'https://test-site-1.com',
      'https://test-site-2.com',
      'https://test-site-3.com'
    ];
    
    for (const url of urls) {
      await page.goto('/scan');
      await page.fill('[data-testid="url-input"]', url);
      await page.click('[data-testid="start-scan-button"]');
      
      const scanId = await page.getAttribute('[data-testid="scan-id"]', 'data-scan-id');
      scanPromises.push(testContext.waitForPipelineCompletion(scanId!));
    }
    
    // Wait for all scans to complete
    await Promise.all(scanPromises);
    
    performance.endMeasure('concurrent-scans');
    
    // Verify performance doesn't degrade significantly
    const metrics = performance.getMetrics('concurrent-scans')[0];
    expect(metrics.duration).toBeLessThan(90000); // 90 seconds for 3 scans
  });
  
  test('should persist scan results across page refreshes', async () => {
    const { page } = testContext.context;
    
    // Start a scan
    const scanId = await testContext.startScan('https://persistent-test.com');
    
    // Wait for some progress
    await page.waitForTimeout(5000);
    
    // Refresh the page
    await page.reload();
    
    // Navigate back to scan progress
    await page.goto(`/scan/${scanId}`);
    
    // Verify scan is still running or completed
    const status = await page.locator('[data-testid="scan-status"]').textContent();
    expect(['Running', 'Completed']).toContain(status);
    
    // Wait for completion
    await testContext.waitForPipelineCompletion(scanId);
    
    // Verify report is accessible
    await testContext.verifyReportContent(scanId);
  });
  
  test('should handle large websites efficiently', async () => {
    const { page, performance, mockServer } = testContext.context;
    
    // Setup large response scenario
    mockServer.setScenario('large-response');
    
    performance.startMeasure('large-website-scan');
    
    // Start scan for large website
    const scanId = await testContext.startScan('https://enterprise-platform.com');
    
    // Monitor memory usage during scan
    const memorySnapshots = [];
    const memoryInterval = setInterval(async () => {
      const metrics = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize
          };
        }
        return null;
      });
      
      if (metrics) {
        memorySnapshots.push(metrics);
      }
    }, 1000);
    
    // Wait for completion
    await testContext.waitForPipelineCompletion(scanId, 180000); // 3 minutes timeout
    
    clearInterval(memoryInterval);
    performance.endMeasure('large-website-scan');
    
    // Verify memory usage stayed within bounds
    const maxMemoryUsed = Math.max(...memorySnapshots.map(s => s.usedJSHeapSize));
    expect(maxMemoryUsed).toBeLessThan(1024 * 1024 * 1024); // 1GB limit
    
    // Verify report loads efficiently
    const reportLoadTime = await testContext.measurePageLoadTime(`/report/${scanId}`);
    expect(reportLoadTime).toBeLessThan(3000); // 3 seconds
  });
  
  test('should validate report accuracy', async () => {
    const { page } = testContext.context;
    
    // Start scan with known test website
    const scanId = await testContext.startScan('https://example-tech-company.com');
    await testContext.waitForPipelineCompletion(scanId);
    
    // Navigate to report
    await page.goto(`/report/${scanId}`);
    
    // Verify technology detection accuracy
    const detectedTech = await page.locator('[data-testid="detected-technologies"] .tech-item').allTextContents();
    
    // Should detect common technologies from mock data
    expect(detectedTech).toContain('React');
    expect(detectedTech).toContain('Node.js');
    expect(detectedTech).toContain('PostgreSQL');
    
    // Verify security findings
    const securityScore = await page.locator('[data-testid="security-score"]').textContent();
    expect(parseInt(securityScore!)).toBeGreaterThan(0);
    expect(parseInt(securityScore!)).toBeLessThanOrEqual(100);
    
    // Verify performance metrics
    const performanceMetrics = await page.locator('[data-testid="performance-metrics"]').isVisible();
    expect(performanceMetrics).toBeTruthy();
    
    // Verify code analysis (if available)
    if (await page.locator('[data-testid="code-quality-score"]').isVisible()) {
      const codeQuality = await page.locator('[data-testid="code-quality-score"]').textContent();
      expect(parseInt(codeQuality!)).toBeGreaterThan(0);
    }
  });
  
  test('should handle authentication and authorization', async () => {
    const { page } = testContext.context;
    
    // Try to access scan page without authentication
    await page.goto('/scan');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Login with test credentials
    await testContext.login('test@example.com', 'password123');
    
    // Should now be able to access scan page
    await page.goto('/scan');
    await expect(page).toHaveURL('/scan');
    
    // Verify user info is displayed
    await expect(page.locator('[data-testid="user-email"]')).toContainText('test@example.com');
  });
  
  test('should export reports in multiple formats', async () => {
    const { page } = testContext.context;
    
    // Complete a scan
    const scanId = await testContext.startScan('https://export-test.com');
    await testContext.waitForPipelineCompletion(scanId);
    
    // Navigate to report
    await page.goto(`/report/${scanId}`);
    
    // Test PDF export
    const [pdfDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-pdf"]')
    ]);
    
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
    
    // Test JSON export
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-json"]')
    ]);
    
    expect(jsonDownload.suggestedFilename()).toContain('.json');
    
    // Verify JSON content
    const jsonContent = await jsonDownload.createReadStream();
    const jsonData = JSON.parse(await streamToString(jsonContent));
    
    expect(jsonData).toHaveProperty('scanId', scanId);
    expect(jsonData).toHaveProperty('technologies');
    expect(jsonData).toHaveProperty('security');
    expect(jsonData).toHaveProperty('performance');
  });
});

// Helper function to convert stream to string
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}