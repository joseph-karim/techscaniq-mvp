#!/usr/bin/env tsx

import * as fs from 'fs';
import * as readline from 'readline';
import chalk from 'chalk';
import { spawn } from 'child_process';

interface PipelineStats {
  startTime: Date;
  evidenceCollected: number;
  perplexityQueries: number;
  toolsExecuted: number;
  errors: number;
  currentPhase: string;
  lastActivity: string;
}

class PipelineMonitor {
  private logFile: string;
  private stats: PipelineStats;
  private tail: any;
  private updateInterval: NodeJS.Timer;
  
  constructor(logFile: string) {
    this.logFile = logFile;
    this.stats = {
      startTime: new Date(),
      evidenceCollected: 0,
      perplexityQueries: 0,
      toolsExecuted: 0,
      errors: 0,
      currentPhase: 'Unknown',
      lastActivity: 'Starting...'
    };
  }
  
  async start() {
    console.clear();
    console.log(chalk.bold.cyan('🚀 Pipeline Monitor - Real-time Status\n'));
    
    // Parse existing log file
    await this.parseExistingLog();
    
    // Start tailing the log file
    this.startTailing();
    
    // Update display every second
    this.updateInterval = setInterval(() => this.updateDisplay(), 1000);
    
    // Setup keyboard input
    this.setupKeyboardInput();
  }
  
  async parseExistingLog() {
    try {
      const content = fs.readFileSync(this.logFile, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        this.parseLine(line);
      }
    } catch (error) {
      console.error('Error reading log file:', error);
    }
  }
  
  startTailing() {
    // Use tail command to follow the log file
    this.tail = spawn('tail', ['-f', this.logFile]);
    
    const rl = readline.createInterface({
      input: this.tail.stdout,
      crlfDelay: Infinity
    });
    
    rl.on('line', (line: string) => {
      this.parseLine(line);
    });
    
    this.tail.stderr.on('data', (data: Buffer) => {
      console.error(`Tail error: ${data}`);
    });
  }
  
  parseLine(line: string) {
    // Update last activity
    if (line.trim()) {
      this.stats.lastActivity = line.substring(0, 100);
    }
    
    // Track evidence collection
    if (line.includes('📄 Extracted')) {
      const match = line.match(/Extracted (\d+) evidence/);
      if (match) {
        this.stats.evidenceCollected += parseInt(match[1]);
      }
    }
    
    // Track Perplexity queries
    if (line.includes('🔍 Perplexity API Request:')) {
      this.stats.perplexityQueries++;
    }
    
    // Track tool executions
    if (line.includes('🔧 Calling tool:')) {
      this.stats.toolsExecuted++;
    }
    
    // Track errors
    if (line.includes('❌') || line.includes('Error') || line.includes('failed')) {
      this.stats.errors++;
    }
    
    // Track phase changes
    if (line.includes('🎯 Interpreting investment thesis')) {
      this.stats.currentPhase = 'Thesis Interpretation';
    } else if (line.includes('🔍 Generating search queries')) {
      this.stats.currentPhase = 'Query Generation';
    } else if (line.includes('🤖 LangGraph Evidence Gathering')) {
      this.stats.currentPhase = 'Evidence Gathering';
    } else if (line.includes('📝 Generating investment report')) {
      this.stats.currentPhase = 'Report Generation';
    } else if (line.includes('✅ Research completed')) {
      this.stats.currentPhase = 'Completed';
    }
  }
  
  updateDisplay() {
    // Move cursor to top
    process.stdout.write('\x1B[H');
    
    const elapsed = this.formatDuration(Date.now() - this.stats.startTime.getTime());
    
    console.log(chalk.bold.cyan('🚀 Pipeline Monitor - Real-time Status\n'));
    
    console.log(chalk.white('📊 Overall Progress:'));
    console.log(chalk.gray(`   Phase: ${chalk.yellow(this.stats.currentPhase)}`));
    console.log(chalk.gray(`   Elapsed: ${elapsed}`));
    console.log();
    
    console.log(chalk.white('📈 Statistics:'));
    console.log(chalk.gray(`   Evidence Collected: ${chalk.green(this.stats.evidenceCollected)} pieces`));
    console.log(chalk.gray(`   Perplexity Queries: ${chalk.blue(this.stats.perplexityQueries)} completed`));
    console.log(chalk.gray(`   Tools Executed: ${chalk.cyan(this.stats.toolsExecuted)} times`));
    console.log(chalk.gray(`   Errors: ${this.stats.errors > 0 ? chalk.red(this.stats.errors) : chalk.green('0')}`));
    console.log();
    
    console.log(chalk.white('💬 Last Activity:'));
    console.log(chalk.gray(`   ${this.stats.lastActivity}...`));
    console.log();
    
    console.log(chalk.dim('─────────────────────────────────────────────────'));
    console.log(chalk.gray('Press Q to quit, S to save stats, R to refresh'));
  }
  
  setupKeyboardInput() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (key: string) => {
      if (key === 'q' || key === 'Q' || key === '\u0003') {
        this.cleanup();
        process.exit(0);
      } else if (key === 's' || key === 'S') {
        this.saveStats();
      } else if (key === 'r' || key === 'R') {
        console.clear();
      }
    });
  }
  
  saveStats() {
    const statsFile = this.logFile.replace('.log', '-stats.json');
    fs.writeFileSync(statsFile, JSON.stringify(this.stats, null, 2));
    console.log(chalk.green(`\n✅ Stats saved to ${statsFile}`));
  }
  
  cleanup() {
    if (this.tail) {
      this.tail.kill();
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
  
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Main execution
const logFile = process.argv[2] || 'cibc-adobe-langgraph-2hr.log';

if (!fs.existsSync(logFile)) {
  console.error(chalk.red(`Log file not found: ${logFile}`));
  process.exit(1);
}

const monitor = new PipelineMonitor(logFile);
monitor.start().catch(console.error);