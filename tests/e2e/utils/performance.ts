import fs from 'fs/promises';
import path from 'path';

export interface PerformanceMetrics {
  timestamp: number;
  name: string;
  duration: number;
  memoryUsage?: number;
  cpuUsage?: number;
  custom?: Record<string, any>;
}

export interface PerformanceReport {
  testName: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  metrics: PerformanceMetrics[];
  summary: {
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    avgMemoryUsage: number;
    maxMemoryUsage: number;
    p95Duration: number;
    p99Duration: number;
  };
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private activeMeasurements: Map<string, number> = new Map();
  private reportDir: string = 'performance-reports';
  
  constructor(reportDir?: string) {
    if (reportDir) {
      this.reportDir = reportDir;
    }
  }
  
  startMeasure(name: string): void {
    this.activeMeasurements.set(name, Date.now());
  }
  
  endMeasure(name: string, metadata?: Record<string, any>): PerformanceMetrics {
    const startTime = this.activeMeasurements.get(name);
    if (!startTime) {
      throw new Error(`No active measurement found for ${name}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const metric: PerformanceMetrics = {
      timestamp: endTime,
      name,
      duration,
      memoryUsage: this.getCurrentMemoryUsage(),
      custom: metadata
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);
    this.activeMeasurements.delete(name);
    
    return metric;
  }
  
  record(metrics: any): void {
    // Record browser metrics
    const performanceMetric: PerformanceMetrics = {
      timestamp: Date.now(),
      name: 'browser-metrics',
      duration: 0,
      custom: metrics
    };
    
    if (!this.metrics.has('browser-metrics')) {
      this.metrics.set('browser-metrics', []);
    }
    
    this.metrics.get('browser-metrics')!.push(performanceMetric);
  }
  
  getMetrics(name: string): PerformanceMetrics[] {
    return this.metrics.get(name) || [];
  }
  
  getAllMetrics(): Map<string, PerformanceMetrics[]> {
    return this.metrics;
  }
  
  async generateReport(testName?: string): Promise<PerformanceReport> {
    const allMetrics = Array.from(this.metrics.values()).flat();
    
    if (allMetrics.length === 0) {
      throw new Error('No metrics recorded');
    }
    
    const startTime = Math.min(...allMetrics.map(m => m.timestamp - m.duration));
    const endTime = Math.max(...allMetrics.map(m => m.timestamp));
    const durations = allMetrics.map(m => m.duration).filter(d => d > 0);
    const memoryUsages = allMetrics.map(m => m.memoryUsage).filter(Boolean) as number[];
    
    const report: PerformanceReport = {
      testName: testName || 'performance-test',
      startTime,
      endTime,
      totalDuration: endTime - startTime,
      metrics: allMetrics,
      summary: {
        avgDuration: this.calculateAverage(durations),
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        avgMemoryUsage: this.calculateAverage(memoryUsages),
        maxMemoryUsage: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
        p95Duration: this.calculatePercentile(durations, 95),
        p99Duration: this.calculatePercentile(durations, 99)
      }
    };
    
    // Save report to file
    await this.saveReport(report);
    
    return report;
  }
  
  async saveReport(report: PerformanceReport): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${report.testName}-${timestamp}.json`;
    const filepath = path.join(this.reportDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    
    // Also save a summary HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlFilepath = path.join(this.reportDir, `${report.testName}-${timestamp}.html`);
    await fs.writeFile(htmlFilepath, htmlReport);
    
    console.log(`Performance report saved to: ${filepath}`);
    console.log(`HTML report saved to: ${htmlFilepath}`);
  }
  
  async saveLighthouseReport(testName: string, lhr: any): Promise<void> {
    await fs.mkdir(this.reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lighthouse-${testName}-${timestamp}.json`;
    const filepath = path.join(this.reportDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(lhr, null, 2));
    console.log(`Lighthouse report saved to: ${filepath}`);
  }
  
  private getCurrentMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.heapUsed;
  }
  
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }
  
  private calculatePercentile(numbers: number[], percentile: number): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  private generateHTMLReport(report: PerformanceReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Report - ${report.testName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1, h2 {
      color: #333;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .metric-card {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #007bff;
    }
    .metric-card h3 {
      margin: 0 0 10px 0;
      color: #555;
      font-size: 14px;
    }
    .metric-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .chart {
      margin: 20px 0;
      height: 300px;
      background-color: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance Report: ${report.testName}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <p>Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s</p>
    
    <h2>Summary</h2>
    <div class="summary">
      <div class="metric-card">
        <h3>Average Duration</h3>
        <div class="value">${report.summary.avgDuration.toFixed(0)}ms</div>
      </div>
      <div class="metric-card">
        <h3>Max Duration</h3>
        <div class="value">${report.summary.maxDuration.toFixed(0)}ms</div>
      </div>
      <div class="metric-card">
        <h3>P95 Duration</h3>
        <div class="value">${report.summary.p95Duration.toFixed(0)}ms</div>
      </div>
      <div class="metric-card">
        <h3>P99 Duration</h3>
        <div class="value">${report.summary.p99Duration.toFixed(0)}ms</div>
      </div>
      <div class="metric-card">
        <h3>Avg Memory Usage</h3>
        <div class="value">${(report.summary.avgMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
      </div>
      <div class="metric-card">
        <h3>Max Memory Usage</h3>
        <div class="value">${(report.summary.maxMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
      </div>
    </div>
    
    <h2>Detailed Metrics</h2>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Name</th>
          <th>Duration (ms)</th>
          <th>Memory Usage (MB)</th>
        </tr>
      </thead>
      <tbody>
        ${report.metrics.map(m => `
          <tr>
            <td>${new Date(m.timestamp).toLocaleString()}</td>
            <td>${m.name}</td>
            <td>${m.duration.toFixed(0)}</td>
            <td>${m.memoryUsage ? (m.memoryUsage / 1024 / 1024).toFixed(1) : 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;
  }
}