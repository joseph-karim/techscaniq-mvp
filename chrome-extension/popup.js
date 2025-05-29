class PopupController {
  constructor() {
    this.currentTab = null;
    this.init();
  }

  async init() {
    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];
    
    // Setup event listeners
    document.getElementById('collectBtn').addEventListener('click', () => this.startCollection());
    document.getElementById('viewDataBtn').addEventListener('click', () => this.viewData());
    document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearData());
    
    // Check if we're currently collecting
    this.updateUI();
    
    // Update stats
    this.updateStats();
  }

  async updateUI() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'isCollecting' });
      const collectBtn = document.getElementById('collectBtn');
      
      if (response.isCollecting) {
        collectBtn.textContent = '⏹️ Stop Collection';
        collectBtn.style.background = '#dc2626';
        this.showStatus('Currently collecting network data...', 'collecting');
      } else {
        collectBtn.textContent = '🔍 Collect & Refresh Page';
        collectBtn.style.background = '#2563eb';
      }
    } catch (error) {
      console.error('Error updating UI:', error);
    }
  }

  async updateStats() {
    try {
      const storage = await chrome.storage.local.get(null);
      const evidenceKeys = Object.keys(storage).filter(key => key.startsWith('evidence_'));
      
      // Debug: log what's in storage
      console.log('Storage keys:', Object.keys(storage));
      console.log('Evidence keys:', evidenceKeys);
      
      if (evidenceKeys.length > 0) {
        document.getElementById('viewDataBtn').disabled = false;
        document.getElementById('exportBtn').disabled = false;
        
        // Show more detailed stats
        const validItems = evidenceKeys.filter(key => storage[key] && storage[key].data);
        const stats = `📊 ${evidenceKeys.length} evidence item(s) collected (${validItems.length} valid)`;
        document.getElementById('stats').textContent = stats;
        document.getElementById('stats').style.display = 'block';
        
        // Debug: log sample evidence item
        if (evidenceKeys.length > 0) {
          console.log('Sample evidence item:', storage[evidenceKeys[0]]);
        }
      } else {
        document.getElementById('viewDataBtn').disabled = true;
        document.getElementById('exportBtn').disabled = true;
        document.getElementById('stats').style.display = 'none';
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  async startCollection() {
    const collectBtn = document.getElementById('collectBtn');
    const pageType = document.getElementById('pageType').value;
    
    try {
      // Check if currently collecting
      const statusResponse = await chrome.runtime.sendMessage({ action: 'isCollecting' });
      
      if (statusResponse.isCollecting) {
        // Stop collection
        await chrome.runtime.sendMessage({ action: 'stopCollection' });
        this.showStatus('Collection stopped', 'success');
        this.updateUI();
        return;
      }

      // Start collection
      collectBtn.disabled = true;
      this.showStatus('Starting collection...', 'collecting');
      
      // Start network collection
      const startResponse = await chrome.runtime.sendMessage({ 
        action: 'startCollection', 
        tabId: this.currentTab.id 
      });
      
      if (!startResponse.success) {
        throw new Error('Failed to start network collection');
      }
      
      // Wait a moment then refresh page to collect everything
      setTimeout(async () => {
        try {
          // Tell content script to refresh and collect DOM
          await chrome.tabs.sendMessage(this.currentTab.id, {
            action: 'refreshAndCollect',
            pageType: pageType
          });
          
          this.showStatus('Page refreshed, collecting data...', 'collecting');
          
          // Stop collection after 10 seconds
          setTimeout(async () => {
            await this.finishCollection();
          }, 10000);
          
        } catch (error) {
          console.error('Error refreshing page:', error);
          this.showStatus('Error: ' + error.message, 'error');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Collection error:', error);
      this.showStatus('Error: ' + error.message, 'error');
      collectBtn.disabled = false;
    }
  }

  async finishCollection() {
    try {
      // Get collected network data
      const networkResponse = await chrome.runtime.sendMessage({ action: 'getCollectedData' });
      
      if (networkResponse.success && networkResponse.data) {
        // Store network data
        const pageType = document.getElementById('pageType').value;
        const evidenceItem = {
          type: 'network_collection',
          pageType: pageType,
          timestamp: new Date().toISOString(),
          data: networkResponse.data
        };
        
        const storageKey = `evidence_network_${Date.now()}`;
        console.log('Storing network evidence:', storageKey, evidenceItem);
        
        await chrome.storage.local.set({
          [storageKey]: evidenceItem
        });
        
        // Verify storage
        const stored = await chrome.storage.local.get(storageKey);
        console.log('Network evidence stored:', stored);
      } else {
        console.warn('No network data received or collection failed');
      }
      
      // Stop collection
      await chrome.runtime.sendMessage({ action: 'stopCollection' });
      
      this.showStatus('Collection completed successfully!', 'success');
      this.updateUI();
      this.updateStats();
      
    } catch (error) {
      console.error('Error finishing collection:', error);
      this.showStatus('Error completing collection: ' + error.message, 'error');
    }
  }

  async viewData() {
    try {
      const storage = await chrome.storage.local.get(null);
      const evidenceKeys = Object.keys(storage).filter(key => key.startsWith('evidence_'));
      
      if (evidenceKeys.length === 0) {
        this.showStatus('No evidence data found', 'error');
        return;
      }
      
      let output = '# TechScan Evidence Collection Report\\n\\n';
      output += `Generated: ${new Date().toISOString()}\\n`;
      output += `Total Evidence Items: ${evidenceKeys.length}\\n\\n`;
      
      for (const key of evidenceKeys) {
        const item = storage[key];
        
        // Safety checks for undefined properties
        if (!item || !item.data) {
          console.warn('Skipping invalid evidence item:', key);
          continue;
        }
        
        output += `## ${item.type || 'unknown'} - ${item.pageType || 'unknown'}\\n`;
        output += `Timestamp: ${item.timestamp || 'unknown'}\\n`;
        
        if (item.type === 'network_collection' && item.data) {
          output += `URL: ${item.data.url || 'unknown'}\\n`;
          output += `Total Requests: ${item.data.totalRequests || 0}\\n`;
          
          if (item.data.summary) {
            output += `Unique Domains: ${item.data.summary.uniqueDomains?.length || 0}\\n`;
            output += `JavaScript Files: ${item.data.summary.jsFiles || 0}\\n`;
            output += `CSS Files: ${item.data.summary.cssFiles || 0}\\n`;
            output += `API Calls: ${item.data.summary.apiCalls || 0}\\n`;
          }
          output += '\\n';
        } else if (item.type === 'dom_collection' && item.data) {
          output += `URL: ${item.data.url || 'unknown'}\\n`;
          output += `Title: ${item.data.title || 'unknown'}\\n`;
          
          if (item.data.structure) {
            output += `Total Elements: ${item.data.structure.totalElements || 0}\\n`;
          }
          
          if (item.data.technologies && item.data.technologies.frameworks) {
            output += `Technologies: ${item.data.technologies.frameworks.join(', ') || 'none detected'}\\n`;
          }
          output += '\\n';
        }
      }
      
      // Create and download file
      const blob = new Blob([output], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      await chrome.downloads.download({
        url: url,
        filename: `techscan-evidence-${Date.now()}.md`
      });
      
      this.showStatus('Evidence report downloaded!', 'success');
      
    } catch (error) {
      console.error('Error viewing data:', error);
      this.showStatus('Error: ' + error.message, 'error');
    }
  }

  async exportData() {
    try {
      const storage = await chrome.storage.local.get(null);
      const evidenceKeys = Object.keys(storage).filter(key => key.startsWith('evidence_'));
      
      if (evidenceKeys.length === 0) {
        this.showStatus('No evidence data to export', 'error');
        return;
      }
      
      // Filter out any invalid evidence items
      const validEvidence = evidenceKeys
        .map(key => storage[key])
        .filter(item => item && typeof item === 'object');
      
      const exportData = {
        timestamp: new Date().toISOString(),
        source: 'TechScan Chrome Extension',
        evidenceCount: validEvidence.length,
        evidence: validEvidence
      };
      
      // Create JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      await chrome.downloads.download({
        url: url,
        filename: `techscan-evidence-${Date.now()}.json`
      });
      
      this.showStatus('Evidence data exported as JSON!', 'success');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showStatus('Error: ' + error.message, 'error');
    }
  }

  async clearData() {
    if (confirm('Are you sure you want to clear all collected evidence data?')) {
      try {
        const storage = await chrome.storage.local.get(null);
        const evidenceKeys = Object.keys(storage).filter(key => key.startsWith('evidence_'));
        
        await chrome.storage.local.remove(evidenceKeys);
        
        this.showStatus('All evidence data cleared', 'success');
        this.updateStats();
        
      } catch (error) {
        console.error('Error clearing data:', error);
        this.showStatus('Error: ' + error.message, 'error');
      }
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});