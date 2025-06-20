import fs from 'fs/promises';
import path from 'path';
import { PerformanceMonitor } from './performance';

export interface ProfileResult {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: any;
}

export interface MemoryReport {
  snapshots: number[];
  initial: number;
  peak: number;
  final: number;
  growthPercentage: number;
}

export class PerformanceProfiler {
  private profiles: Map<string, ProfileResult[]> = new Map();
  private performanceMonitor: PerformanceMonitor;
  private reportDir: string = 'performance-reports';
  
  constructor(reportDir?: string) {
    this.performanceMonitor = new PerformanceMonitor(reportDir);
    if (reportDir) {
      this.reportDir = reportDir;
    }
  }
  
  async profile<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await fn();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      const profileResult: ProfileResult = {
        name,
        duration: endTime - startTime,
        startTime,
        endTime,
        metadata: {
          memoryUsed: endMemory - startMemory,
          startMemory,
          endMemory
        }
      };
      
      if (!this.profiles.has(name)) {
        this.profiles.set(name, []);
      }
      
      this.profiles.get(name)!.push(profileResult);
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      
      const profileResult: ProfileResult = {
        name,
        duration: endTime - startTime,
        startTime,
        endTime,
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
      
      if (!this.profiles.has(name)) {
        this.profiles.set(name, []);
      }
      
      this.profiles.get(name)!.push(profileResult);
      
      throw error;
    }
  }
  
  async generateReport(testName: string, data: any): Promise<void> {
    await this.performanceMonitor.generateReport(testName);
    
    // Save additional data
    await fs.mkdir(this.reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testName}-data-${timestamp}.json`;
    const filepath = path.join(this.reportDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }
  
  async generateSummaryReport(): Promise<void> {
    const summary: any = {
      timestamp: new Date().toISOString(),
      totalProfiles: this.profiles.size,
      profiles: {}
    };
    
    for (const [name, results] of this.profiles.entries()) {
      const durations = results.map(r => r.duration);
      const errors = results.filter(r => r.metadata?.error).length;
      
      summary.profiles[name] = {
        count: results.length,
        avgDuration: this.calculateAverage(durations),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        p95Duration: this.calculatePercentile(durations, 95),
        p99Duration: this.calculatePercentile(durations, 99),
        errorCount: errors,
        errorRate: (errors / results.length) * 100
      };
    }
    
    // Save summary
    await fs.mkdir(this.reportDir, { recursive: true });
    
    const summaryPath = path.join(this.reportDir, 'performance-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Generate HTML summary
    const htmlSummary = this.generateHTMLSummary(summary);
    const htmlPath = path.join(this.reportDir, 'performance-summary.html');
    await fs.writeFile(htmlPath, htmlSummary);
    
    console.log(`Performance summary saved to: ${summaryPath}`);
    console.log(`HTML summary saved to: ${htmlPath}`);
  }
  
  async saveLighthouseReport(testName: string, lhr: any): Promise<void> {
    await this.performanceMonitor.saveLighthouseReport(testName, lhr);
  }
  
  async generateMemoryReport(data: MemoryReport): Promise<void> {
    await fs.mkdir(this.reportDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `memory-report-${timestamp}.json`;
    const filepath = path.join(this.reportDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    
    // Generate memory chart HTML
    const htmlReport = this.generateMemoryChartHTML(data);
    const htmlPath = path.join(this.reportDir, `memory-report-${timestamp}.html`);
    await fs.writeFile(htmlPath, htmlReport);
    
    console.log(`Memory report saved to: ${filepath}`);
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
  
  private generateHTMLSummary(summary: any): string {
    const profileRows = Object.entries(summary.profiles).map(([name, stats]: [string, any]) => `
      <tr>
        <td>${name}</td>
        <td>${stats.count}</td>
        <td>${stats.avgDuration.toFixed(0)}ms</td>
        <td>${stats.minDuration}ms</td>
        <td>${stats.maxDuration}ms</td>
        <td>${stats.p95Duration}ms</td>
        <td>${stats.p99Duration}ms</td>
        <td class="${stats.errorRate > 0 ? 'error' : ''}">${stats.errorRate.toFixed(1)}%</td>
      </tr>
    `).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Summary</title>
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
    h1 {
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #007bff;
      color: white;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .error {
      color: #dc3545;
      font-weight: bold;
    }
    .summary-info {
      background-color: #e9ecef;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Performance Test Summary</h1>
    <div class="summary-info">
      <p><strong>Generated:</strong> ${new Date(summary.timestamp).toLocaleString()}</p>
      <p><strong>Total Profiles:</strong> ${summary.totalProfiles}</p>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Profile Name</th>
          <th>Runs</th>
          <th>Avg Duration</th>
          <th>Min Duration</th>
          <th>Max Duration</th>
          <th>P95</th>
          <th>P99</th>
          <th>Error Rate</th>
        </tr>
      </thead>
      <tbody>
        ${profileRows}
      </tbody>
    </table>
  </div>
</body>
</html>
    `;
  }
  
  private generateMemoryChartHTML(data: MemoryReport): string {
    const chartData = data.snapshots.map((value, index) => ({
      x: index * 5, // Assuming 5-second intervals
      y: value / (1024 * 1024) // Convert to MB
    }));
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Memory Usage Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #555;
      font-size: 14px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
    }
    #memoryChart {
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Memory Usage Report</h1>
    
    <div class="stats">
      <div class="stat-card">
        <h3>Initial Memory</h3>
        <div class="value">${(data.initial / (1024 * 1024)).toFixed(1)} MB</div>
      </div>
      <div class="stat-card">
        <h3>Peak Memory</h3>
        <div class="value">${(data.peak / (1024 * 1024)).toFixed(1)} MB</div>
      </div>
      <div class="stat-card">
        <h3>Final Memory</h3>
        <div class="value">${(data.final / (1024 * 1024)).toFixed(1)} MB</div>
      </div>
      <div class="stat-card">
        <h3>Growth</h3>
        <div class="value">${data.growthPercentage.toFixed(1)}%</div>
      </div>
    </div>
    
    <canvas id="memoryChart" width="400" height="200"></canvas>
  </div>
  
  <script>
    const ctx = document.getElementById('memoryChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Memory Usage (MB)',
          data: ${JSON.stringify(chartData)},
          borderColor: 'rgb(0, 123, 255)',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Memory Usage Over Time'
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Time (seconds)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Memory (MB)'
            },
            min: 0
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
  }
}