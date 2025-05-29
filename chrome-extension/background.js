class EvidenceCollector {
  constructor() {
    this.networkRequests = new Map();
    this.isCollecting = false;
    this.currentTabId = null;
  }

  async startCollection(tabId) {
    console.log('Starting evidence collection for tab:', tabId);
    this.isCollecting = true;
    this.currentTabId = tabId;
    this.networkRequests.clear();

    try {
      // Attach debugger to capture network events
      await chrome.debugger.attach({ tabId }, '1.3');
      
      // Enable network domain
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
      await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable');
      await chrome.debugger.sendCommand({ tabId }, 'Page.enable');

      // Set up event listeners
      chrome.debugger.onEvent.addListener(this.handleDebuggerEvent.bind(this));

      console.log('Debugger attached and network enabled');
      return true;
    } catch (error) {
      console.error('Failed to start collection:', error);
      this.isCollecting = false;
      return false;
    }
  }

  handleDebuggerEvent(source, method, params) {
    if (source.tabId !== this.currentTabId) return;

    switch (method) {
      case 'Network.requestWillBeSent':
        this.handleNetworkRequest(params);
        break;
      case 'Network.responseReceived':
        this.handleNetworkResponse(params);
        break;
      case 'Network.loadingFinished':
        this.handleLoadingFinished(params);
        break;
      case 'Network.loadingFailed':
        this.handleLoadingFailed(params);
        break;
    }
  }

  handleNetworkRequest(params) {
    const requestId = params.requestId;
    this.networkRequests.set(requestId, {
      id: requestId,
      url: params.request.url,
      method: params.request.method,
      headers: params.request.headers,
      postData: params.request.postData,
      timestamp: params.timestamp,
      type: params.type,
      initiator: params.initiator,
      response: null,
      body: null,
      error: null
    });
  }

  handleNetworkResponse(params) {
    const requestId = params.requestId;
    const request = this.networkRequests.get(requestId);
    if (request) {
      request.response = {
        status: params.response.status,
        statusText: params.response.statusText,
        headers: params.response.headers,
        mimeType: params.response.mimeType,
        encoding: params.response.encoding,
        fromCache: params.response.fromDiskCache || params.response.fromServiceWorker
      };
    }
  }

  async handleLoadingFinished(params) {
    const requestId = params.requestId;
    const request = this.networkRequests.get(requestId);
    if (request && this.shouldCaptureBody(request)) {
      try {
        const response = await chrome.debugger.sendCommand(
          { tabId: this.currentTabId },
          'Network.getResponseBody',
          { requestId }
        );
        request.body = response.body;
        request.base64Encoded = response.base64Encoded;
      } catch (error) {
        console.log('Could not get response body for:', request.url, error.message);
      }
    }
  }

  handleLoadingFailed(params) {
    const requestId = params.requestId;
    const request = this.networkRequests.get(requestId);
    if (request) {
      request.error = params.errorText;
    }
  }

  shouldCaptureBody(request) {
    // Capture bodies for important resource types
    const capturableTypes = [
      'Document', 'Script', 'Stylesheet', 'XHR', 'Fetch', 
      'WebSocket', 'Manifest', 'Other'
    ];
    
    const capturableMimeTypes = [
      'text/html', 'application/json', 'text/css', 
      'application/javascript', 'text/javascript',
      'application/xml', 'text/xml', 'text/plain'
    ];

    return capturableTypes.includes(request.type) ||
           (request.response && capturableMimeTypes.some(mime => 
             request.response.mimeType?.includes(mime)));
  }

  async stopCollection() {
    console.log('Stopping evidence collection');
    this.isCollecting = false;
    
    if (this.currentTabId) {
      try {
        await chrome.debugger.detach({ tabId: this.currentTabId });
      } catch (error) {
        console.log('Error detaching debugger:', error);
      }
    }

    chrome.debugger.onEvent.removeListener(this.handleDebuggerEvent);
    this.currentTabId = null;
  }

  async getCollectedData() {
    const requests = Array.from(this.networkRequests.values());
    
    return {
      timestamp: new Date().toISOString(),
      url: requests.find(r => r.type === 'Document')?.url || 'unknown',
      totalRequests: requests.length,
      requests: requests,
      summary: this.generateSummary(requests)
    };
  }

  generateSummary(requests) {
    const byType = {};
    const byStatus = {};
    const domains = new Set();
    let totalSize = 0;

    requests.forEach(req => {
      // By type
      byType[req.type] = (byType[req.type] || 0) + 1;
      
      // By status
      if (req.response) {
        byStatus[req.response.status] = (byStatus[req.response.status] || 0) + 1;
      }
      
      // Domains
      try {
        domains.add(new URL(req.url).hostname);
      } catch (e) {}
      
      // Size estimation
      if (req.body && !req.base64Encoded) {
        totalSize += req.body.length;
      }
    });

    return {
      requestsByType: byType,
      responsesByStatus: byStatus,
      uniqueDomains: Array.from(domains),
      estimatedTotalSize: totalSize,
      jsFiles: requests.filter(r => r.type === 'Script').length,
      cssFiles: requests.filter(r => r.type === 'Stylesheet').length,
      apiCalls: requests.filter(r => ['XHR', 'Fetch'].includes(r.type)).length,
      images: requests.filter(r => r.type === 'Image').length
    };
  }
}

// Global collector instance
const collector = new EvidenceCollector();

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'startCollection':
          const success = await collector.startCollection(request.tabId);
          sendResponse({ success });
          break;
          
        case 'stopCollection':
          await collector.stopCollection();
          sendResponse({ success: true });
          break;
          
        case 'getCollectedData':
          const data = await collector.getCollectedData();
          sendResponse({ success: true, data });
          break;
          
        case 'isCollecting':
          sendResponse({ isCollecting: collector.isCollecting });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (collector.currentTabId === tabId) {
    collector.stopCollection();
  }
});