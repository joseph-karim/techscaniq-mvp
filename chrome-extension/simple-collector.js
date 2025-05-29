// Simple network data collector that captures what you see in DevTools Network tab

class SimpleNetworkCollector {
  constructor() {
    this.requests = [];
    this.isCollecting = false;
  }

  startCollecting() {
    this.isCollecting = true;
    this.requests = [];
    console.log('🔍 Starting simple network collection...');
    
    // Override fetch to capture API calls
    this.originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await this.originalFetch(...args);
      await this.captureRequest('fetch', args[0], response);
      return response;
    };

    // Override XMLHttpRequest
    const collector = this;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._method = method;
      this._url = url;
      return collector.originalXHROpen.call(this, method, url, ...args);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
      this.addEventListener('load', () => {
        collector.captureXHR(this);
      });
      return collector.originalXHRSend.call(this, data);
    };
  }

  async captureRequest(type, url, response) {
    try {
      let responseText = '';
      try {
        responseText = await response.clone().text();
      } catch (e) {
        responseText = '[Could not read response body]';
      }

      this.requests.push({
        type: type,
        url: url.toString(),
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        responseBody: responseText,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Captured ${type} request:`, url.toString());
    } catch (error) {
      console.error('Error capturing request:', error);
    }
  }

  captureXHR(xhr) {
    try {
      this.requests.push({
        type: 'xhr',
        method: xhr._method,
        url: xhr._url,
        status: xhr.status,
        statusText: xhr.statusText,
        responseBody: xhr.responseText,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Captured XHR request:`, xhr._url);
    } catch (error) {
      console.error('Error capturing XHR:', error);
    }
  }

  stopCollecting() {
    this.isCollecting = false;
    
    // Restore original functions
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }
    
    console.log(`🎯 Collection stopped. Captured ${this.requests.length} requests`);
  }

  getAllData() {
    // Get everything visible on the page
    const pageData = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      
      // All the HTML source
      html: document.documentElement.outerHTML,
      
      // All scripts on the page
      scripts: Array.from(document.querySelectorAll('script')).map(script => ({
        src: script.src,
        content: script.src ? null : script.innerHTML,
        type: script.type || 'text/javascript'
      })),
      
      // All stylesheets
      styles: Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(style => ({
        href: style.href || null,
        content: style.href ? null : style.innerHTML,
        type: 'text/css'
      })),
      
      // All network requests we captured
      networkRequests: this.requests,
      
      // Page performance
      performance: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      },
      
      // All meta tags
      meta: Array.from(document.querySelectorAll('meta')).map(meta => ({
        name: meta.name,
        property: meta.property,
        content: meta.content
      })),
      
      // All links
      links: Array.from(document.querySelectorAll('a[href]')).slice(0, 100).map(link => ({
        href: link.href,
        text: link.textContent.trim().substring(0, 50)
      }))
    };
    
    return pageData;
  }
}

// Make it globally available
window.techScanCollector = new SimpleNetworkCollector();