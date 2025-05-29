class DOMCollector {
  constructor() {
    this.collected = false;
    this.domData = null;
  }

  async collectDOMData() {
    if (this.collected) return this.domData;

    console.log('Collecting DOM data...');
    
    const data = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      
      // Basic page structure
      html: {
        doctype: document.doctype ? document.doctype.name : null,
        lang: document.documentElement.lang,
        charset: document.characterSet,
        fullHTML: document.documentElement.outerHTML
      },
      
      // Meta information
      meta: this.collectMetaTags(),
      
      // Scripts and styles
      scripts: this.collectScripts(),
      styles: this.collectStyles(),
      
      // Links and resources
      links: this.collectLinks(),
      images: this.collectImages(),
      
      // Forms and inputs
      forms: this.collectForms(),
      
      // Technology detection
      technologies: this.detectTechnologies(),
      
      // Performance data
      performance: this.collectPerformanceData(),
      
      // Console logs (if any)
      consoleLogs: this.getConsoleLogs(),
      
      // Page structure analysis
      structure: this.analyzePageStructure()
    };

    this.domData = data;
    this.collected = true;
    return data;
  }

  collectMetaTags() {
    const metaTags = [];
    document.querySelectorAll('meta').forEach(meta => {
      const tag = {};
      for (const attr of meta.attributes) {
        tag[attr.name] = attr.value;
      }
      metaTags.push(tag);
    });
    return metaTags;
  }

  collectScripts() {
    const scripts = [];
    document.querySelectorAll('script').forEach(script => {
      scripts.push({
        src: script.src,
        type: script.type,
        async: script.async,
        defer: script.defer,
        inline: !script.src,
        content: script.src ? null : script.innerHTML.substring(0, 1000), // First 1KB of inline scripts
        attributes: this.getElementAttributes(script)
      });
    });
    return scripts;
  }

  collectStyles() {
    const styles = [];
    
    // External stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      styles.push({
        type: 'external',
        href: link.href,
        media: link.media,
        attributes: this.getElementAttributes(link)
      });
    });
    
    // Inline styles
    document.querySelectorAll('style').forEach(style => {
      styles.push({
        type: 'inline',
        content: style.innerHTML.substring(0, 1000), // First 1KB
        attributes: this.getElementAttributes(style)
      });
    });
    
    return styles;
  }

  collectLinks() {
    const links = [];
    document.querySelectorAll('a[href]').forEach(link => {
      links.push({
        href: link.href,
        text: link.textContent.trim().substring(0, 100),
        title: link.title,
        target: link.target,
        rel: link.rel
      });
    });
    return links.slice(0, 100); // Limit to first 100 links
  }

  collectImages() {
    const images = [];
    document.querySelectorAll('img').forEach(img => {
      images.push({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading
      });
    });
    return images.slice(0, 50); // Limit to first 50 images
  }

  collectForms() {
    const forms = [];
    document.querySelectorAll('form').forEach(form => {
      const inputs = [];
      form.querySelectorAll('input, select, textarea').forEach(input => {
        inputs.push({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          required: input.required
        });
      });
      
      forms.push({
        action: form.action,
        method: form.method,
        inputs: inputs
      });
    });
    return forms;
  }

  detectTechnologies() {
    const technologies = {
      frameworks: [],
      libraries: [],
      analytics: [],
      fonts: [],
      cdn: []
    };

    // Check for common frameworks/libraries
    const checks = {
      'React': () => window.React || document.querySelector('[data-reactroot]'),
      'Vue.js': () => window.Vue || document.querySelector('[data-v-]'),
      'Angular': () => window.angular || document.querySelector('[ng-app]'),
      'jQuery': () => window.jQuery || window.$,
      'Bootstrap': () => document.querySelector('[class*="bootstrap"]') || document.querySelector('.container'),
      'Tailwind CSS': () => document.querySelector('[class*="w-"]') || document.querySelector('[class*="text-"]'),
      'Next.js': () => window.__NEXT_DATA__,
      'Nuxt.js': () => window.__NUXT__,
      'Gatsby': () => window.___gatsby,
      'Material-UI': () => document.querySelector('[class*="MuiButton"]'),
      'Chakra UI': () => document.querySelector('[class*="chakra"]'),
      'Ant Design': () => document.querySelector('[class*="ant-"]')
    };

    for (const [tech, check] of Object.entries(checks)) {
      try {
        if (check()) {
          technologies.frameworks.push(tech);
        }
      } catch (e) {
        // Ignore errors in detection
      }
    }

    // Check for analytics
    if (window.gtag || window.ga) technologies.analytics.push('Google Analytics');
    if (window.fbq) technologies.analytics.push('Facebook Pixel');
    if (window.mixpanel) technologies.analytics.push('Mixpanel');

    // Check for fonts
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    if (fontLinks.length > 0) technologies.fonts.push('Google Fonts');

    return technologies;
  }

  collectPerformanceData() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null,
        resourceCount: performance.getEntriesByType('resource').length
      };
    } catch (e) {
      return null;
    }
  }

  getConsoleLogs() {
    // This is limited - we can't capture existing console logs
    // But we can capture future ones by overriding console methods
    return {
      note: 'Console logging capture would require injection at document start'
    };
  }

  analyzePageStructure() {
    return {
      totalElements: document.querySelectorAll('*').length,
      divCount: document.querySelectorAll('div').length,
      spanCount: document.querySelectorAll('span').length,
      buttonCount: document.querySelectorAll('button').length,
      inputCount: document.querySelectorAll('input').length,
      hasNavigation: !!document.querySelector('nav'),
      hasHeader: !!document.querySelector('header'),
      hasFooter: !!document.querySelector('footer'),
      hasMain: !!document.querySelector('main'),
      uniqueClasses: [...new Set(Array.from(document.querySelectorAll('[class]')).map(el => el.className))].length,
      uniqueIds: document.querySelectorAll('[id]').length
    };
  }

  getElementAttributes(element) {
    const attrs = {};
    for (const attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }
}

// Global DOM collector
const domCollector = new DOMCollector();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'collectDOM':
          const domData = await domCollector.collectDOMData();
          sendResponse({ success: true, data: domData });
          break;
          
        case 'refreshAndCollect':
          // Store the collection request
          sessionStorage.setItem('techscan_collect', 'true');
          sessionStorage.setItem('techscan_pageType', request.pageType || 'unknown');
          
          // Refresh the page
          window.location.reload();
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

// Auto-collect if we're supposed to (after page refresh)
window.addEventListener('load', () => {
  if (sessionStorage.getItem('techscan_collect') === 'true') {
    sessionStorage.removeItem('techscan_collect');
    
    // Give the page a moment to fully load
    setTimeout(async () => {
      try {
        console.log('Auto-collecting after page refresh...');
        const domData = await domCollector.collectDOMData();
        
        // Store in chrome storage
        const pageType = sessionStorage.getItem('techscan_pageType') || 'unknown';
        sessionStorage.removeItem('techscan_pageType');
        
        const evidenceItem = {
          type: 'dom_collection',
          pageType: pageType,
          timestamp: new Date().toISOString(),
          data: domData
        };
        
        const storageKey = `evidence_${Date.now()}`;
        
        console.log('Storing evidence item:', storageKey, evidenceItem);
        
        await chrome.storage.local.set({
          [storageKey]: evidenceItem
        });
        
        console.log('DOM data collected and stored successfully');
        
        // Verify storage
        const stored = await chrome.storage.local.get(storageKey);
        console.log('Verification - stored item:', stored);
        
      } catch (error) {
        console.error('Error in auto-collect:', error);
      }
    }, 2000);
  }
});