#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(chalk.cyan('🚀 Starting Rich Iterative Research Worker\n'));

// Start the worker process
const workerPath = join(__dirname, 'src/workers/research-worker-rich-iterative.ts');

console.log(chalk.yellow(`Starting worker: ${workerPath}`));

const worker = spawn('npx', ['tsx', workerPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

worker.on('error', (error) => {
  console.error(chalk.red('Worker failed to start:'), error);
  process.exit(1);
});

worker.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(chalk.red(`Worker exited with code ${code} and signal ${signal}`));
    process.exit(1);
  } else {
    console.log(chalk.green('Worker exited successfully'));
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n📡 Gracefully shutting down worker...'));
  worker.kill('SIGTERM');
  
  setTimeout(() => {
    console.log(chalk.red('Force killing worker...'));
    worker.kill('SIGKILL');
    process.exit(1);
  }, 10000);
});

process.on('SIGTERM', () => {
  worker.kill('SIGTERM');
});