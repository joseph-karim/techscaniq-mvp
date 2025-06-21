const fs = require('fs').promises;
const path = require('path');

class ReportSyncService {
  constructor() {
    this.sourceDirs = [
      './techscaniq-v2/scripts/data/integrated-results',
      './techscaniq-v2/data/integrated-results'
    ];
    this.targetDir = './public/data/langgraph-reports';
  }

  async syncReports() {
    try {
      console.log('🔄 Starting report sync...');
      
      // Ensure target directory exists
      await fs.mkdir(this.targetDir, { recursive: true });
      
      let totalSynced = 0;
      const processedFiles = new Set();
      
      for (const sourceDir of this.sourceDirs) {
        try {
          // Check if source directory exists
          await fs.access(sourceDir);
          
          // Get all JSON files from source
          const files = await fs.readdir(sourceDir);
          const jsonFiles = files.filter(f => f.endsWith('.json'));
          
          console.log(`📁 Found ${jsonFiles.length} reports in ${sourceDir}`);
          
          for (const file of jsonFiles) {
            // Skip if we've already processed this file from another directory
            if (processedFiles.has(file)) {
              console.log(`⏭️  Skipping duplicate: ${file}`);
              continue;
            }
            
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(this.targetDir, file);
            
            // Check if file needs updating
            const shouldCopy = await this.shouldCopyFile(sourcePath, targetPath);
            
            if (shouldCopy) {
              await fs.copyFile(sourcePath, targetPath);
              console.log(`✅ Synced: ${file}`);
              totalSynced++;
              
              // Also create alias with simpler name for CIBC reports
              if (file.includes('cibc-adobe-integrated')) {
                const simpleName = file.replace(/cibc-adobe-integrated-(.+)\.json$/, 'cibc-latest-$1.json');
                const aliasPath = path.join(this.targetDir, simpleName);
                await fs.copyFile(sourcePath, aliasPath);
                console.log(`🔗 Created alias: ${simpleName}`);
              }
              
              // Create the "latest" version for frontend
              if (file.includes('cibc-adobe-integrated')) {
                const latestPath = path.join(this.targetDir, 'cibc-latest-2025-06-21.json');
                await fs.copyFile(sourcePath, latestPath);
                console.log(`📌 Updated latest CIBC report`);
              }
            } else {
              console.log(`⏸️  Up to date: ${file}`);
            }
            
            processedFiles.add(file);
          }
        } catch (error) {
          console.log(`⚠️  Source directory not accessible: ${sourceDir}`);
        }
      }
      
      // Update sync timestamp
      const syncInfo = {
        lastSync: new Date().toISOString(),
        totalReports: processedFiles.size,
        syncedReports: totalSynced,
        sourceDirs: this.sourceDirs,
        targetDir: this.targetDir
      };
      
      await fs.writeFile(
        path.join(this.targetDir, '.sync-info.json'),
        JSON.stringify(syncInfo, null, 2)
      );
      
      console.log(`\n✨ Report sync completed!`);
      console.log(`📊 Total reports processed: ${processedFiles.size}`);
      console.log(`🔄 Reports synced: ${totalSynced}`);
      console.log(`🕐 Last sync: ${syncInfo.lastSync}`);
      
      return syncInfo;
    } catch (error) {
      console.error('❌ Report sync failed:', error);
      throw error;
    }
  }

  async shouldCopyFile(sourcePath, targetPath) {
    try {
      const [sourceStats, targetStats] = await Promise.all([
        fs.stat(sourcePath),
        fs.stat(targetPath).catch(() => null)
      ]);

      // Copy if target doesn't exist or source is newer
      return !targetStats || sourceStats.mtime > targetStats.mtime;
    } catch {
      return true;
    }
  }

  async getReportMetadata() {
    try {
      const syncInfoPath = path.join(this.targetDir, '.sync-info.json');
      const syncInfo = JSON.parse(await fs.readFile(syncInfoPath, 'utf8'));
      
      const reports = [];
      const files = await fs.readdir(this.targetDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== '.sync-info.json');
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.targetDir, file);
        const stats = await fs.stat(filePath);
        
        try {
          const content = JSON.parse(await fs.readFile(filePath, 'utf8'));
          const evidenceCount = this.countEvidence(content);
          
          reports.push({
            id: file.replace('.json', ''),
            filename: file,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            evidenceCount: evidenceCount,
            title: this.extractTitle(content, file)
          });
        } catch (error) {
          console.error(`Error reading report ${file}:`, error);
        }
      }
      
      return {
        ...syncInfo,
        reports: reports.sort((a, b) => new Date(b.modified) - new Date(a.modified))
      };
    } catch (error) {
      console.error('Error getting report metadata:', error);
      return null;
    }
  }

  countEvidence(data) {
    let count = 0;
    
    if (data.evidence) {
      count += Array.isArray(data.evidence) ? data.evidence.length : 0;
    }
    
    if (data.evidenceItems) {
      count += Array.isArray(data.evidenceItems) ? data.evidenceItems.length : 0;
    }
    
    if (data.sections) {
      for (const section of data.sections) {
        if (section.evidence) {
          count += Array.isArray(section.evidence) ? section.evidence.length : 0;
        }
      }
    }
    
    return count;
  }

  extractTitle(data, filename) {
    if (data.title) return data.title;
    if (data.reportTitle) return data.reportTitle;
    if (data.metadata?.title) return data.metadata.title;
    
    // Generate title from filename
    if (filename.includes('cibc')) {
      return 'CIBC Technical Analysis Report';
    }
    
    return `Technical Analysis Report - ${filename.replace('.json', '')}`;
  }

  async watchForChanges() {
    console.log('🔍 Starting report watcher...');
    
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch(this.sourceDirs, {
      ignored: /[\/\\]\./,
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => {
        console.log(`📄 New report detected: ${path}`);
        this.syncReports();
      })
      .on('change', path => {
        console.log(`📝 Report updated: ${path}`);
        this.syncReports();
      });

    return watcher;
  }
}

// CLI usage
if (require.main === module) {
  const sync = new ReportSyncService();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'watch':
      sync.watchForChanges().then(watcher => {
        console.log('👀 Watching for report changes...');
        console.log('Press Ctrl+C to stop');
      });
      break;
      
    case 'metadata':
      sync.getReportMetadata().then(metadata => {
        console.log('\n📊 Report Metadata:');
        console.log(JSON.stringify(metadata, null, 2));
      });
      break;
      
    case 'sync':
    default:
      sync.syncReports().catch(error => {
        console.error('Sync failed:', error);
        process.exit(1);
      });
      break;
  }
}

module.exports = ReportSyncService;