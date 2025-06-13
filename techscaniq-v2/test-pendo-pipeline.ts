#!/usr/bin/env tsx
import axios from 'axios';
import { config } from './src/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_BASE = `http://localhost:${config.API_PORT}/api`;
const API_KEY = process.env.API_KEY || 'demo-api-key';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkService(name: string, url: string): Promise<boolean> {
  try {
    await axios.get(url);
    log(`✅ ${name} is running`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${name} is not running`, colors.red);
    return false;
  }
}

async function startResearch() {
  try {
    log('\n🚀 Starting research for Pendo.io with growth thesis...', colors.bright);
    
    const response = await axios.post(
      `${API_BASE}/research/start`,
      {
        company: 'Pendo',
        website: 'https://pendo.io',
        thesisType: 'growth',
        metadata: {
          testRun: true,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );

    const { researchId } = response.data;
    log(`📋 Research ID: ${researchId}`, colors.cyan);
    
    return researchId;
  } catch (error: any) {
    log(`❌ Failed to start research: ${error.message}`, colors.red);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

async function checkProgress(researchId: string) {
  try {
    const response = await axios.get(
      `${API_BASE}/research/${researchId}/status`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    const { status, progress, currentPhase, evidenceCount, iterationCount } = response.data;
    
    log(`\n📊 Research Progress:`, colors.bright);
    log(`   Status: ${status}`, colors.yellow);
    log(`   Progress: ${progress}%`, colors.yellow);
    log(`   Phase: ${currentPhase}`, colors.yellow);
    log(`   Evidence: ${evidenceCount} pieces`, colors.yellow);
    log(`   Iterations: ${iterationCount}`, colors.yellow);
    
    return response.data;
  } catch (error: any) {
    log(`❌ Failed to check progress: ${error.message}`, colors.red);
    throw error;
  }
}

async function getReport(researchId: string) {
  try {
    const response = await axios.get(
      `${API_BASE}/research/${researchId}/report`,
      {
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    if (response.status === 202) {
      log('⏳ Report still being generated...', colors.yellow);
      return null;
    }

    log('\n✅ Report ready!', colors.green);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 202) {
      log('⏳ Report still being generated...', colors.yellow);
      return null;
    }
    log(`❌ Failed to get report: ${error.message}`, colors.red);
    throw error;
  }
}

async function monitorResearch(researchId: string) {
  log('\n👀 Monitoring research progress...', colors.bright);
  
  let completed = false;
  let lastStatus = '';
  let progressBar = '';
  
  while (!completed) {
    try {
      const status = await checkProgress(researchId);
      
      // Update progress bar
      const filledBars = Math.floor(status.progress / 5);
      const emptyBars = 20 - filledBars;
      progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
      
      // Only log if status changed
      if (status.status !== lastStatus) {
        lastStatus = status.status;
        log(`\n[${progressBar}] ${status.progress}% - ${status.status}`, colors.cyan);
      } else {
        // Update progress bar in place
        process.stdout.write(`\r[${progressBar}] ${status.progress}% - ${status.status}`);
      }
      
      if (status.status === 'completed') {
        completed = true;
        log('\n\n🎉 Research completed!', colors.green);
      } else if (status.status === 'failed') {
        throw new Error('Research failed');
      }
      
      if (!completed) {
        await delay(5000); // Check every 5 seconds
      }
    } catch (error) {
      log('\n❌ Error monitoring research:', colors.red);
      throw error;
    }
  }
  
  // Get the final report
  const report = await getReport(researchId);
  if (report) {
    log('\n📄 Report Summary:', colors.bright);
    log(`   Company: ${report.company}`, colors.yellow);
    log(`   Evidence Count: ${report.evidence.length}`, colors.yellow);
    log(`   Thesis Type: ${report.thesis.type}`, colors.yellow);
    
    // Save report to file
    const fs = await import('fs/promises');
    const reportPath = `./reports/pendo-${researchId}.json`;
    await fs.mkdir('./reports', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    log(`\n💾 Report saved to: ${reportPath}`, colors.green);
  }
}

async function main() {
  log('🧪 TechScanIQ Pipeline Test - Pendo.io', colors.bright);
  log('=====================================\n', colors.bright);

  try {
    // Check services
    log('1️⃣ Checking services...', colors.bright);
    const apiRunning = await checkService('API', `${API_BASE}/health`);
    
    if (!apiRunning) {
      log('\n⚠️  API not running. Please start it with: npm run dev:api', colors.yellow);
      return;
    }

    // Start research
    log('\n2️⃣ Starting research...', colors.bright);
    const researchId = await startResearch();
    
    // Monitor progress
    log('\n3️⃣ Monitoring progress...', colors.bright);
    await monitorResearch(researchId);
    
    log('\n✅ Pipeline test completed successfully!', colors.green);
    
  } catch (error: any) {
    log(`\n❌ Pipeline test failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);