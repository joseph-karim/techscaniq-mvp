import * as fs from 'fs/promises';
import * as path from 'path';
import { ResearchState } from '../types';

export class CheckpointManager {
  private checkpointDir: string;
  
  constructor(checkpointDir: string = './checkpoints') {
    this.checkpointDir = checkpointDir;
  }
  
  async saveCheckpoint(runId: string, state: ResearchState, phase: string): Promise<void> {
    try {
      await fs.mkdir(this.checkpointDir, { recursive: true });
      
      const checkpoint = {
        runId,
        phase,
        timestamp: new Date().toISOString(),
        state,
        metadata: {
          evidenceCount: state.evidence?.length || 0,
          status: state.status,
          iterationCount: state.iterationCount,
        }
      };
      
      const filePath = path.join(this.checkpointDir, `${runId}_${phase}.json`);
      await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2));
      
      console.log(`💾 Checkpoint saved: ${phase} (${state.evidence?.length || 0} evidence pieces)`);
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    }
  }
  
  async loadCheckpoint(runId: string): Promise<{ phase: string; state: ResearchState } | null> {
    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpointFiles = files
        .filter(f => f.startsWith(runId) && f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Latest first
      
      if (checkpointFiles.length === 0) {
        return null;
      }
      
      const latestFile = checkpointFiles[0];
      const content = await fs.readFile(path.join(this.checkpointDir, latestFile), 'utf-8');
      const checkpoint = JSON.parse(content);
      
      console.log(`📂 Loaded checkpoint: ${checkpoint.phase} from ${checkpoint.timestamp}`);
      console.log(`   Evidence pieces: ${checkpoint.metadata.evidenceCount}`);
      
      return {
        phase: checkpoint.phase,
        state: checkpoint.state
      };
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
      return null;
    }
  }
  
  async listCheckpoints(): Promise<Array<{ runId: string; phase: string; timestamp: string; evidenceCount: number }>> {
    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.checkpointDir, file), 'utf-8');
            const checkpoint = JSON.parse(content);
            checkpoints.push({
              runId: checkpoint.runId,
              phase: checkpoint.phase,
              timestamp: checkpoint.timestamp,
              evidenceCount: checkpoint.metadata.evidenceCount
            });
          } catch (e) {
            // Skip invalid files
          }
        }
      }
      
      return checkpoints.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (error) {
      return [];
    }
  }
  
  async cleanupOldCheckpoints(daysToKeep: number = 7): Promise<void> {
    try {
      const files = await fs.readdir(this.checkpointDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.checkpointDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`🗑️ Cleaned up old checkpoint: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup checkpoints:', error);
    }
  }
}