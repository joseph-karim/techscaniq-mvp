import { test, expect } from '@playwright/test';
import { PerformanceProfiler } from '../utils/performance-profiler';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

test.describe('Pipeline Performance Tests', () => {
  let profiler: PerformanceProfiler;
  
  test.beforeAll(async () => {
    profiler = new PerformanceProfiler();
  });
  
  test.afterAll(async () => {
    await profiler.generateSummaryReport();
  });
  
  test('should meet performance SLAs', async ({ page }) => {
    const scenarios = [
      {
        name: 'small-website',
        url: 'https://simple-blog.com',
        expectedDuration: 30000,
        expectedMemory: 200 * 1024 * 1024
      },
      {
        name: 'medium-website', 
        url: 'https://ecommerce-site.com',
        expectedDuration: 60000,
        expectedMemory: 400 * 1024 * 1024
      },
      {
        name: 'large-website',
        url: 'https://enterprise-app.com',
        expectedDuration: 120000,
        expectedMemory: 800 * 1024 * 1024
      }
    ];
    
    for (const scenario of scenarios) {
      await profiler.profile(scenario.name, async () => {
        await page.goto('/scan');
        await page.fill('[data-testid="url-input"]', scenario.url);
        
        const startTime = Date.now();
        await page.click('[data-testid="start-scan-button"]');
        
        // Monitor resource usage
        const resourceMonitor = await page.evaluateHandle(() => {
          const measurements: any[] = [];
          const interval = setInterval(() => {
            if (performance.memory) {
              measurements.push({
                timestamp: Date.now(),
                memory: performance.memory.usedJSHeapSize,
                cpu: performance.now()
              });
            }
          }, 1000);
          
          return { interval, measurements };
        });
        
        // Wait for completion
        const scanId = await page.getAttribute('[data-testid="scan-id"]', 'data-scan-id');
        await page.waitForSelector('[data-testid="scan-complete"]', {
          timeout: scenario.expectedDuration * 1.5
        });
        
        const endTime = Date.now();
        
        // Stop monitoring
        await page.evaluate((monitor: any) => {
          clearInterval(monitor.interval);
        }, resourceMonitor);
        
        const measurements = await page.evaluate((monitor: any) => monitor.measurements, resourceMonitor);
        
        // Verify performance
        const duration = endTime - startTime;
        const maxMemory = Math.max(...measurements.map((m: any) => m.memory));
        
        expect(duration).toBeLessThan(scenario.expectedDuration);
        expect(maxMemory).toBeLessThan(scenario.expectedMemory);
        
        // Generate performance report
        await profiler.generateReport(scenario.name, {
          duration,
          maxMemory,
          measurements
        });
      });
    }
  });
  
  test('should handle load without degradation', async ({ browser }) => {
    const concurrentUsers = 10;
    const contexts = [];
    
    // Create multiple browser contexts
    for (let i = 0; i < concurrentUsers; i++) {
      contexts.push(await browser.newContext());
    }
    
    // Start concurrent scans
    const scanPromises = contexts.map(async (context, index) => {
      const page = await context.newPage();
      await page.goto('/scan');
      
      const startTime = Date.now();
      await page.fill('[data-testid="url-input"]', `https://test-site-${index}.com`);
      await page.click('[data-testid="start-scan-button"]');
      
      await page.waitForSelector('[data-testid="scan-complete"]', {
        timeout: 180000 // 3 minutes
      });
      
      return Date.now() - startTime;
    });
    
    const durations = await Promise.all(scanPromises);
    
    // Verify no significant degradation
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    
    expect(maxDuration).toBeLessThan(avgDuration * 1.5); // Max 50% slower than average
    
    // Clean up
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
  
  test('should measure report rendering performance', async ({ page }) => {
    // Use a pre-generated report for consistent testing
    const reportId = 'test-report-12345';
    
    // Measure initial load
    await profiler.profile('report-initial-load', async () => {
      await page.goto(`/report/${reportId}`, {
        waitUntil: 'networkidle'
      });
    });
    
    // Run Lighthouse audit
    const chrome = await chromeLauncher.launch({ 
      chromeFlags: ['--headless', '--disable-gpu']
    });
    
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      port: chrome.port
    };
    
    const runnerResult = await lighthouse(`http://localhost:3000/report/${reportId}`, options);
    await chrome.kill();
    
    // Verify Core Web Vitals
    const { lhr } = runnerResult!;
    const metrics = {
      FCP: lhr.audits['first-contentful-paint'].numericValue,
      LCP: lhr.audits['largest-contentful-paint'].numericValue,
      CLS: lhr.audits['cumulative-layout-shift'].numericValue,
      TBT: lhr.audits['total-blocking-time'].numericValue
    };
    
    expect(metrics.FCP).toBeLessThan(1800); // 1.8s
    expect(metrics.LCP).toBeLessThan(2500); // 2.5s
    expect(metrics.CLS).toBeLessThan(0.1);
    expect(metrics.TBT).toBeLessThan(300); // 300ms
    
    // Save Lighthouse report
    await profiler.saveLighthouseReport(reportId, lhr);
  });
  
  test('should measure API response times', async ({ request }) => {
    const endpoints = [
      { path: '/api/scan', method: 'POST', expectedTime: 500 },
      { path: '/api/reports', method: 'GET', expectedTime: 200 },
      { path: '/api/technologies', method: 'GET', expectedTime: 300 }
    ];
    
    for (const endpoint of endpoints) {
      await profiler.profile(`api-${endpoint.path}`, async () => {
        const startTime = Date.now();
        
        const response = await request[endpoint.method.toLowerCase() as 'get' | 'post'](
          `http://localhost:4000${endpoint.path}`,
          endpoint.method === 'POST' ? {
            data: { url: 'https://test.com' }
          } : {}
        );
        
        const responseTime = Date.now() - startTime;
        
        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(endpoint.expectedTime);
      });
    }
  });
  
  test('should handle memory efficiently during long scans', async ({ page }) => {
    const memorySnapshots: number[] = [];
    
    // Start a long-running scan
    await page.goto('/scan');
    await page.fill('[data-testid="url-input"]', 'https://large-enterprise-site.com');
    await page.click('[data-testid="start-scan-button"]');
    
    // Monitor memory for 2 minutes
    const monitoringDuration = 120000; // 2 minutes
    const interval = 5000; // Check every 5 seconds
    const startTime = Date.now();
    
    const memoryMonitor = setInterval(async () => {
      const memoryInfo = await page.evaluate(() => {
        if (performance.memory) {
          return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (memoryInfo) {
        memorySnapshots.push(memoryInfo.usedJSHeapSize);
      }
      
      if (Date.now() - startTime > monitoringDuration) {
        clearInterval(memoryMonitor);
      }
    }, interval);
    
    // Wait for monitoring to complete
    await page.waitForTimeout(monitoringDuration);
    
    // Analyze memory usage
    const initialMemory = memorySnapshots[0];
    const peakMemory = Math.max(...memorySnapshots);
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    
    // Check for memory leaks
    const memoryGrowth = finalMemory - initialMemory;
    const growthPercentage = (memoryGrowth / initialMemory) * 100;
    
    expect(growthPercentage).toBeLessThan(50); // Less than 50% growth
    expect(peakMemory).toBeLessThan(500 * 1024 * 1024); // Peak under 500MB
    
    // Generate memory report
    await profiler.generateMemoryReport({
      snapshots: memorySnapshots,
      initial: initialMemory,
      peak: peakMemory,
      final: finalMemory,
      growthPercentage
    });
  });
  
  test('should optimize database queries', async ({ page, request }) => {
    // Enable query logging for this test
    await request.post('http://localhost:4000/api/debug/enable-query-logging');
    
    // Perform a typical user journey
    await page.goto('/dashboard');
    await page.click('[data-testid="recent-scans"]');
    await page.click('[data-testid="view-report-0"]');
    
    // Get query logs
    const queryLogs = await request.get('http://localhost:4000/api/debug/query-logs');
    const logs = await queryLogs.json();
    
    // Analyze queries
    const slowQueries = logs.filter((q: any) => q.duration > 100); // Queries over 100ms
    const duplicateQueries = findDuplicateQueries(logs);
    
    expect(slowQueries.length).toBe(0);
    expect(duplicateQueries.length).toBe(0);
    
    // Disable query logging
    await request.post('http://localhost:4000/api/debug/disable-query-logging');
  });
  
  test('should handle network failures gracefully', async ({ page, context }) => {
    // Start a scan
    await page.goto('/scan');
    await page.fill('[data-testid="url-input"]', 'https://test-network.com');
    await page.click('[data-testid="start-scan-button"]');
    
    // Wait for scan to start
    await page.waitForTimeout(5000);
    
    // Simulate network offline
    await context.setOffline(true);
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Restore network
    await context.setOffline(false);
    
    // Should auto-reconnect and continue
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible({
      timeout: 10000
    });
    
    // Scan should eventually complete
    await page.waitForSelector('[data-testid="scan-complete"]', {
      timeout: 60000
    });
  });
});

function findDuplicateQueries(logs: any[]): any[] {
  const queryMap = new Map<string, number>();
  const duplicates = [];
  
  for (const log of logs) {
    const query = log.query;
    const count = queryMap.get(query) || 0;
    queryMap.set(query, count + 1);
    
    if (count > 0) {
      duplicates.push(log);
    }
  }
  
  return duplicates;
}