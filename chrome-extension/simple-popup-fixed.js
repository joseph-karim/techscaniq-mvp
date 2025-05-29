let isCollecting = false;
let collectedData = null;

const toggleBtn = document.getElementById('toggleBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const statusDiv = document.getElementById('status');
const statsDiv = document.getElementById('stats');

function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => statusDiv.style.display = 'none', 3000);
  }
}

function updateStats(data) {
  if (data) {
    const stats = `📊 ${data.networkRequests?.length || 0} network requests
📄 ${data.scripts?.length || 0} scripts found
🎨 ${data.styles?.length || 0} stylesheets
🔗 ${data.links?.length || 0} links`;
    statsDiv.innerHTML = stats;
    statsDiv.style.display = 'block';
    downloadBtn.disabled = false;
  } else {
    statsDiv.style.display = 'none';
    downloadBtn.disabled = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Simple popup loaded');

  toggleBtn.addEventListener('click', async () => {
    try {
      console.log('Toggle button clicked, isCollecting:', isCollecting);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Current tab:', tab);
      
      if (!isCollecting) {
        console.log('Starting collection...');
        showStatus('Injecting collector script...', 'collecting');
        
        // Start collecting
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['simple-collector.js']
        });
        
        console.log('Script injected, starting collector...');
        
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            console.log('Starting collector on page...');
            if (window.techScanCollector) {
              window.techScanCollector.startCollecting();
              return { success: true };
            } else {
              console.error('techScanCollector not found!');
              return { success: false, error: 'Collector not found' };
            }
          }
        });
        
        if (result[0].result.success) {
          isCollecting = true;
          toggleBtn.textContent = '⏹️ Stop & Collect Data';
          toggleBtn.className = 'button stop';
          showStatus('Collecting network requests... (browse the site now)', 'collecting');
        } else {
          showStatus('Failed to start collector', 'error');
        }
        
      } else {
        console.log('Stopping collection...');
        showStatus('Stopping collection and gathering data...', 'collecting');
        
        // Stop and collect
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            console.log('Stopping collector and getting data...');
            if (window.techScanCollector) {
              window.techScanCollector.stopCollecting();
              return window.techScanCollector.getAllData();
            } else {
              console.error('techScanCollector not found during stop!');
              return null;
            }
          }
        });
        
        console.log('Collection result:', result);
        collectedData = result[0].result;
        isCollecting = false;
        toggleBtn.textContent = '🔍 Start Collecting';
        toggleBtn.className = 'button';
        
        if (collectedData) {
          showStatus('Collection complete!', 'success');
          updateStats(collectedData);
        } else {
          showStatus('No data collected', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
      isCollecting = false;
      toggleBtn.textContent = '🔍 Start Collecting';
      toggleBtn.className = 'button';
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!collectedData) return;
    
    try {
      // Create comprehensive report
      const report = {
        timestamp: new Date().toISOString(),
        source: 'TechScan Simple Collector',
        url: collectedData.url,
        title: collectedData.title,
        
        summary: {
          totalNetworkRequests: collectedData.networkRequests?.length || 0,
          totalScripts: collectedData.scripts?.length || 0,
          totalStyles: collectedData.styles?.length || 0,
          pageLoadTime: collectedData.performance?.loadTime || 0
        },
        
        fullData: collectedData
      };
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: `techscan-${new URL(collectedData.url).hostname}-${Date.now()}.json`
      });
      
      showStatus('Data downloaded!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showStatus('Download failed: ' + error.message, 'error');
    }
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear collected data?')) {
      collectedData = null;
      updateStats(null);
      showStatus('Data cleared', 'success');
    }
  });
});