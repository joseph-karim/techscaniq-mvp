#!/usr/bin/env tsx
/**
 * Run LangGraph research with checkpoint support
 * 
 * Usage:
 *   # Start new research with checkpointing
 *   npm run research:checkpoint -- --company="CIBC" --vendor="Adobe"
 *   
 *   # Resume from checkpoint
 *   npm run research:checkpoint -- --thread-id="research-CIBC-1234567890" --resume
 *   
 *   # List checkpoints
 *   npm run research:checkpoint -- --thread-id="research-CIBC-1234567890" --list
 */

import { runIntegratedResearch, getCheckpointState, listCheckpoints, CheckpointConfig } from '../src/orchestrator/langgraph-integrated';
import { StorageService } from '../src/services/storage';
import * as dotenv from 'dotenv';

dotenv.config();

interface Args {
  company?: string;
  vendor?: string;
  website?: string;
  products?: string;
  threadId?: string;
  resume?: boolean;
  list?: boolean;
  checkpointId?: string;
}

function parseArgs(): Args {
  const args: Args = {};
  
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace('--', '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    args[cleanKey as keyof Args] = value === undefined ? true : value;
  });
  
  return args;
}

async function main() {
  const args = parseArgs();
  const storage = new StorageService();
  
  // List checkpoints if requested
  if (args.list && args.threadId) {
    console.log(`📋 Listing checkpoints for thread: ${args.threadId}`);
    try {
      const checkpoints = await listCheckpoints(args.threadId);
      console.log(`\nFound ${checkpoints.length} checkpoints:`);
      checkpoints.forEach((cp, idx) => {
        console.log(`\n${idx + 1}. Checkpoint ID: ${cp.checkpoint_id}`);
        console.log(`   Created: ${cp.created_at}`);
        console.log(`   Metadata: ${JSON.stringify(cp.metadata, null, 2)}`);
      });
    } catch (error) {
      console.error('Failed to list checkpoints:', error);
    }
    return;
  }
  
  // Get checkpoint state if requested
  if (args.resume && args.threadId) {
    console.log(`🔄 Resuming from thread: ${args.threadId}`);
    if (args.checkpointId) {
      console.log(`   Using checkpoint: ${args.checkpointId}`);
    }
    
    try {
      // Get current state
      const state = await getCheckpointState(args.threadId, args.checkpointId);
      console.log('\n📊 Current state:');
      console.log(`   Status: ${state.values?.status}`);
      console.log(`   Evidence collected: ${state.values?.evidence?.length || 0}`);
      console.log(`   Current iteration: ${state.values?.metadata?.currentIteration || 0}`);
      console.log(`   Next node: ${state.next?.[0] || 'completed'}`);
      
      // Resume execution
      console.log('\n▶️ Resuming execution...\n');
      
      const checkpointConfig: CheckpointConfig = {
        enabled: true,
        threadId: args.threadId,
        checkpointId: args.checkpointId
      };
      
      // Extract company and website from state
      const company = state.values?.thesis?.company || args.company || 'Unknown';
      const website = state.values?.thesis?.website || args.website || `https://www.${company.toLowerCase()}.com`;
      
      const result = await runIntegratedResearch(
        company,
        website,
        state.values?.thesis?.type || 'sales-intelligence',
        state.values?.metadata,
        checkpointConfig
      );
      
      console.log('\n✅ Research resumed and completed!');
      
      // Save the report
      const reportId = `checkpoint-${args.threadId}-${Date.now()}`;
      await storage.saveLangGraphReport(reportId, result);
      console.log(`📄 Report saved with ID: ${reportId}`);
      
    } catch (error) {
      console.error('Failed to resume from checkpoint:', error);
    }
    return;
  }
  
  // Start new research with checkpointing
  if (args.company) {
    const company = args.company;
    const vendor = args.vendor || 'Vendor';
    const products = args.products || 'Digital Solutions';
    const website = args.website || `https://www.${company.toLowerCase()}.com`;
    
    console.log(`🚀 Starting checkpointed research for ${company}`);
    console.log(`   Vendor: ${vendor}`);
    console.log(`   Products: ${products}`);
    console.log(`   Checkpointing: ENABLED`);
    
    const checkpointConfig: CheckpointConfig = {
      enabled: true
    };
    
    const customThesis = `${vendor} can help ${company} accelerate their digital transformation with ${products}`;
    
    try {
      const startTime = Date.now();
      
      const result = await runIntegratedResearch(
        company,
        website,
        'sales-intelligence',
        {
          vendorContext: { vendor, products: products.split(',').map(p => p.trim()) },
          customThesis,
          timeout: 2 * 60 * 60 * 1000, // 2 hours
        },
        checkpointConfig
      );
      
      const duration = (Date.now() - startTime) / 1000 / 60;
      console.log(`\n✅ Research completed in ${duration.toFixed(2)} minutes!`);
      
      // Save the report
      const reportId = `${company.toLowerCase()}-${vendor.toLowerCase()}-checkpoint-${Date.now()}`;
      await storage.saveLangGraphReport(reportId, result);
      console.log(`📄 Report saved with ID: ${reportId}`);
      
    } catch (error) {
      console.error('Research failed:', error);
      process.exit(1);
    }
  } else {
    console.log(`
Usage:
  # Start new research with checkpointing
  npm run research:checkpoint -- --company="CIBC" --vendor="Adobe" --products="Experience Platform,Analytics"
  
  # Resume from checkpoint
  npm run research:checkpoint -- --thread-id="research-CIBC-1234567890" --resume
  
  # Resume from specific checkpoint
  npm run research:checkpoint -- --thread-id="research-CIBC-1234567890" --checkpoint-id="abc123" --resume
  
  # List checkpoints
  npm run research:checkpoint -- --thread-id="research-CIBC-1234567890" --list
    `);
  }
}

main().catch(console.error);