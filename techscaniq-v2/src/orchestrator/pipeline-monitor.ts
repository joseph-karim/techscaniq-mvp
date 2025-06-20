import * as readline from 'readline';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

export interface PipelineStatus {
  runId: string;
  phase: string;
  startTime: Date;
  currentTime: Date;
  evidenceCollected: number;
  toolsExecuted: number;
  errors: number;
  progress: {
    evidenceGathering?: { current: number; total: number };
    reportGeneration?: { sections: string[]; currentSection?: string };
    synthesis?: { chunks: number; processed: number };
  };
  lastActivity: string;
  estimatedTimeRemaining?: string;
}

export class PipelineMonitor extends EventEmitter {
  private status: PipelineStatus;
  private logFile: string;
  private statusFile: string;
  private updateInterval: NodeJS.Timer | null = null;
  private rl: readline.Interface | null = null;
  
  constructor(runId: string, logDir: string = './logs') {
    super();
    
    this.status = {
      runId,
      phase: 'initializing',
      startTime: new Date(),
      currentTime: new Date(),
      evidenceCollected: 0,
      toolsExecuted: 0,
      errors: 0,
      progress: {},
      lastActivity: 'Pipeline started'
    };
    
    this.logFile = path.join(logDir, `${runId}.log`);
    this.statusFile = path.join(logDir, `${runId}.status.json`);
  }
  
  async start(): Promise<void> {
    // Create log directory
    await fs.mkdir(path.dirname(this.logFile), { recursive: true });
    
    // Start status updates
    this.updateInterval = setInterval(() => this.updateStatus(), 1000);
    
    // Setup user input handling
    this.setupUserInput();
    
    // Initial status display
    this.displayStatus();
  }
  
  async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.rl) {
      this.rl.close();
    }
  }
  
  async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    // Append to log file
    await fs.appendFile(this.logFile, logEntry);
    
    // Update last activity
    this.status.lastActivity = message;
    
    // Emit event for real-time monitoring
    this.emit('log', { timestamp, level, message });
  }
  
  updatePhase(phase: string): void {
    this.status.phase = phase;
    this.log(`Phase changed to: ${phase}`);
    this.emit('phaseChange', phase);
  }
  
  updateProgress(type: 'evidence' | 'tools' | 'sections', current: number, total?: number): void {
    switch (type) {
      case 'evidence':
        this.status.evidenceCollected = current;
        if (total) {
          this.status.progress.evidenceGathering = { current, total };
        }
        break;
      case 'tools':
        this.status.toolsExecuted = current;
        break;
      case 'sections':
        if (!this.status.progress.reportGeneration) {
          this.status.progress.reportGeneration = { sections: [] };
        }
        this.status.progress.reportGeneration.sections.push(`Section ${current}/${total || '?'}`);
        break;
    }
    
    this.emit('progress', { type, current, total });
  }
  
  recordError(error: string): void {
    this.status.errors++;
    this.log(`Error: ${error}`, 'error');
    this.emit('error', error);
  }
  
  private async updateStatus(): Promise<void> {
    this.status.currentTime = new Date();
    
    // Calculate estimated time remaining based on progress
    const elapsed = this.status.currentTime.getTime() - this.status.startTime.getTime();
    if (this.status.progress.evidenceGathering?.total) {
      const percentComplete = this.status.progress.evidenceGathering.current / this.status.progress.evidenceGathering.total;
      if (percentComplete > 0) {
        const estimatedTotal = elapsed / percentComplete;
        const remaining = estimatedTotal - elapsed;
        this.status.estimatedTimeRemaining = this.formatDuration(remaining);
      }
    }
    
    // Save status to file
    await fs.writeFile(this.statusFile, JSON.stringify(this.status, null, 2));
  }
  
  private setupUserInput(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.gray('> ')
    });
    
    console.log(chalk.cyan('\n📌 Interactive commands:'));
    console.log(chalk.gray('  status - Show current status'));
    console.log(chalk.gray('  pause  - Pause pipeline'));
    console.log(chalk.gray('  resume - Resume pipeline'));
    console.log(chalk.gray('  skip   - Skip current phase'));
    console.log(chalk.gray('  abort  - Abort pipeline'));
    console.log(chalk.gray('  help   - Show commands\n'));
    
    this.rl.on('line', (input) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'status':
          this.displayStatus();
          break;
        case 'pause':
          this.emit('userCommand', { command: 'pause' });
          console.log(chalk.yellow('⏸️  Pipeline paused'));
          break;
        case 'resume':
          this.emit('userCommand', { command: 'resume' });
          console.log(chalk.green('▶️  Pipeline resumed'));
          break;
        case 'skip':
          this.emit('userCommand', { command: 'skip' });
          console.log(chalk.yellow('⏭️  Skipping current phase'));
          break;
        case 'abort':
          this.emit('userCommand', { command: 'abort' });
          console.log(chalk.red('🛑 Aborting pipeline'));
          this.stop();
          process.exit(0);
          break;
        case 'help':
          console.log(chalk.cyan('\nAvailable commands:'));
          console.log(chalk.gray('  status, pause, resume, skip, abort, help'));
          break;
        default:
          if (command) {
            console.log(chalk.gray(`Unknown command: ${command}`));
          }
      }
      
      this.rl?.prompt();
    });
  }
  
  private displayStatus(): void {
    console.clear();
    console.log(chalk.bold.cyan(`\n🚀 Pipeline Monitor - ${this.status.runId}\n`));
    
    const elapsed = this.formatDuration(this.status.currentTime.getTime() - this.status.startTime.getTime());
    
    console.log(chalk.white(`📊 Status Overview:`));
    console.log(chalk.gray(`   Phase: ${chalk.yellow(this.status.phase)}`));
    console.log(chalk.gray(`   Elapsed: ${elapsed}`));
    if (this.status.estimatedTimeRemaining) {
      console.log(chalk.gray(`   ETA: ${this.status.estimatedTimeRemaining}`));
    }
    
    console.log(chalk.white(`\n📈 Progress:`));
    console.log(chalk.gray(`   Evidence: ${chalk.green(this.status.evidenceCollected)} pieces`));
    console.log(chalk.gray(`   Tools: ${chalk.blue(this.status.toolsExecuted)} executed`));
    console.log(chalk.gray(`   Errors: ${this.status.errors > 0 ? chalk.red(this.status.errors) : chalk.green('0')}`));
    
    if (this.status.progress.evidenceGathering) {
      const { current, total } = this.status.progress.evidenceGathering;
      const percent = Math.round((current / total) * 100);
      const bar = this.createProgressBar(percent);
      console.log(chalk.gray(`   Evidence Progress: ${bar} ${percent}%`));
    }
    
    if (this.status.progress.reportGeneration?.sections.length) {
      console.log(chalk.gray(`   Report Sections: ${this.status.progress.reportGeneration.sections.length} completed`));
    }
    
    console.log(chalk.white(`\n💬 Last Activity:`));
    console.log(chalk.gray(`   ${this.status.lastActivity}`));
    
    console.log(chalk.dim('\n─────────────────────────────────────────────────\n'));
  }
  
  private createProgressBar(percent: number): string {
    const width = 20;
    const filled = Math.round((width * percent) / 100);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }
  
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  // Static method to monitor existing pipeline from status file
  static async monitorExisting(runId: string, logDir: string = './logs'): Promise<PipelineMonitor> {
    const monitor = new PipelineMonitor(runId, logDir);
    
    try {
      const statusContent = await fs.readFile(monitor.statusFile, 'utf-8');
      monitor.status = JSON.parse(statusContent);
      await monitor.start();
      return monitor;
    } catch (error) {
      throw new Error(`Could not find status for run ${runId}`);
    }
  }
}