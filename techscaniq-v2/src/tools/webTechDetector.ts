import axios from 'axios';
import * as dns from 'dns/promises';
import { PlaywrightCrawler } from 'crawlee';
import * as cheerio from 'cheerio';

interface TechnologyStack {
  frontend: Technology[];
  backend: Technology[];
  databases: Technology[];
  infrastructure: Technology[];
  analytics: Technology[];
  marketing: Technology[];
  security: Technology[];
  cdn: Technology[];
  frameworks: Technology[];
  libraries: Technology[];
  cms: Technology[];
  ecommerce: Technology[];
}

interface Technology {
  name: string;
  category: string;
  version?: string;
  confidence: number;
  icon?: string;
  website?: string;
  description?: string;
}

interface VendorInfo {
  hosting: string[];
  cdn: string[];
  dns: string[];
  ssl: string;
  analytics: string[];
  payment: string[];
  email: string[];
  support: string[];
}

interface TechDetectionResult {
  url: string;
  technologies: TechnologyStack;
  vendors: VendorInfo;
  performance: {
    loadTime: number;
    size: number;
    requests: number;
  };
  security: {
    httpsEnabled: boolean;
    securityHeaders: Record<string, string>;
    certificates: any;
  };
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    generator?: string;
  };
}

export class WebTechDetector {
  async detectTechnologies(url: string): Promise<TechDetectionResult> {
    console.log(`🔍 Detecting technologies for ${url}`);

    const result: TechDetectionResult = {
      url,
      technologies: {
        frontend: [],
        backend: [],
        databases: [],
        infrastructure: [],
        analytics: [],
        marketing: [],
        security: [],
        cdn: [],
        frameworks: [],
        libraries: [],
        cms: [],
        ecommerce: [],
      },
      vendors: {
        hosting: [],
        cdn: [],
        dns: [],
        ssl: '',
        analytics: [],
        payment: [],
        email: [],
        support: [],
      },
      performance: {
        loadTime: 0,
        size: 0,
        requests: 0,
      },
      security: {
        httpsEnabled: url.startsWith('https'),
        securityHeaders: {},
        certificates: null,
      },
      metadata: {
        title: '',
        description: '',
        keywords: [],
      },
    };

    try {
      // Use Playwright to get full page context
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        requestHandlerTimeoutSecs: 20, // 20 second timeout
        navigationTimeoutSecs: 15, // 15 second navigation timeout
        async requestHandler({ page, request }) {
          const startTime = Date.now();

          // Wait for page to load - use domcontentloaded instead of networkidle to prevent hanging
          await page.waitForLoadState('domcontentloaded');
          result.performance.loadTime = Date.now() - startTime;

          // Get page metadata
          result.metadata.title = await page.title();
          
          const metaDescription = await page.$eval(
            'meta[name="description"]',
            el => el.getAttribute('content')
          ).catch(() => '');
          result.metadata.description = metaDescription || '';

          const metaKeywords = await page.$eval(
            'meta[name="keywords"]',
            el => el.getAttribute('content')
          ).catch(() => '');
          result.metadata.keywords = metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : [];

          const generator = await page.$eval(
            'meta[name="generator"]',
            el => el.getAttribute('content')
          ).catch(() => '');
          if (generator) result.metadata.generator = generator;

          // Get all resources
          const resources = await page.evaluate(() => {
            return performance.getEntriesByType('resource').map(r => ({
              name: r.name,
              type: (r as any).initiatorType,
              size: (r as any).transferSize || 0,
            }));
          });

          result.performance.requests = resources.length;
          result.performance.size = resources.reduce((sum, r) => sum + r.size, 0);

          // Get response headers
          const headers = await page.evaluate(async () => {
            try {
              const response = await fetch(window.location.href, { method: 'HEAD' });
              return Object.fromEntries(response.headers.entries());
            } catch {
              return {};
            }
          });

          // Detect technologies from page context
          const pageDetections = await page.evaluate(() => {
            const detections = {
              frontend: [] as string[],
              libraries: [] as string[],
              analytics: [] as string[],
              frameworks: [] as string[],
              cms: [] as string[],
              ecommerce: [] as string[],
            };

            // Check global variables
            if ((window as any).React || (window as any).ReactDOM) detections.libraries.push('React');
            if ((window as any).Vue) detections.libraries.push('Vue');
            if ((window as any).angular) detections.frameworks.push('Angular');
            if ((window as any).jQuery) detections.libraries.push('jQuery');
            if ((window as any).gtag || (window as any).ga) detections.analytics.push('Google Analytics');
            if ((window as any).fbq) detections.analytics.push('Facebook Pixel');
            if ((window as any).Shopify) detections.ecommerce.push('Shopify');
            if ((window as any).wp || document.querySelector('link[href*="wp-content"]')) detections.cms.push('WordPress');
            if ((window as any).__NEXT_DATA__) detections.frameworks.push('Next.js');
            if ((window as any).__NUXT__) detections.frameworks.push('Nuxt.js');
            if ((window as any).Gatsby) detections.frameworks.push('Gatsby');
            if ((window as any).Webflow) detections.cms.push('Webflow');
            
            // Check for framework indicators in DOM
            if (document.querySelector('[data-reactroot]')) detections.libraries.push('React');
            if (document.querySelector('[ng-version]')) detections.frameworks.push('Angular');
            if (document.querySelector('#__next')) detections.frameworks.push('Next.js');
            if (document.querySelector('#__nuxt')) detections.frameworks.push('Nuxt.js');
            if (document.querySelector('[data-v-]')) detections.libraries.push('Vue');
            
            // Check for analytics scripts
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            scripts.forEach(script => {
              const src = (script as HTMLScriptElement).src;
              if (src.includes('google-analytics.com') || src.includes('googletagmanager.com')) {
                detections.analytics.push('Google Analytics');
              }
              if (src.includes('segment.com') || src.includes('segment.io')) {
                detections.analytics.push('Segment');
              }
              if (src.includes('mixpanel.com')) detections.analytics.push('Mixpanel');
              if (src.includes('amplitude.com')) detections.analytics.push('Amplitude');
              if (src.includes('hotjar.com')) detections.analytics.push('Hotjar');
              if (src.includes('clarity.ms')) detections.analytics.push('Microsoft Clarity');
            });

            return detections;
          });

          // Add detected technologies
          Object.entries(pageDetections).forEach(([category, techs]) => {
            const uniqueTechs = [...new Set(techs as string[])];
            uniqueTechs.forEach(tech => {
              (result.technologies as any)[category].push({
                name: tech,
                category,
                confidence: 0.9,
              });
            });
          });

          // Detect from headers
          if (headers['x-powered-by']) {
            const poweredBy = headers['x-powered-by'];
            if (poweredBy.includes('Express')) {
              result.technologies.backend.push({ name: 'Express.js', category: 'backend', confidence: 0.9 });
            }
            if (poweredBy.includes('Next.js')) {
              result.technologies.frameworks.push({ name: 'Next.js', category: 'framework', confidence: 0.9 });
            }
            if (poweredBy.includes('PHP')) {
              result.technologies.backend.push({ name: 'PHP', category: 'backend', confidence: 0.9 });
            }
          }

          if (headers['server']) {
            const server = headers['server'].toLowerCase();
            if (server.includes('nginx')) {
              result.technologies.infrastructure.push({ name: 'Nginx', category: 'infrastructure', confidence: 0.9 });
            }
            if (server.includes('apache')) {
              result.technologies.infrastructure.push({ name: 'Apache', category: 'infrastructure', confidence: 0.9 });
            }
            if (server.includes('cloudflare')) {
              result.vendors.cdn.push('Cloudflare');
            }
          }

          // Analyze vendors from resources
          resources.forEach(resource => {
            const url = resource.name;
            
            // CDN detection
            if (url.includes('cloudflare')) result.vendors.cdn.push('Cloudflare');
            if (url.includes('cloudfront')) result.vendors.cdn.push('AWS CloudFront');
            if (url.includes('fastly')) result.vendors.cdn.push('Fastly');
            if (url.includes('akamai')) result.vendors.cdn.push('Akamai');
            if (url.includes('bunny.net')) result.vendors.cdn.push('Bunny CDN');
            
            // Analytics
            if (url.includes('google-analytics')) result.vendors.analytics.push('Google Analytics');
            if (url.includes('segment')) result.vendors.analytics.push('Segment');
            if (url.includes('mixpanel')) result.vendors.analytics.push('Mixpanel');
            if (url.includes('amplitude')) result.vendors.analytics.push('Amplitude');
            if (url.includes('heap.io')) result.vendors.analytics.push('Heap');
            
            // Payment
            if (url.includes('stripe')) result.vendors.payment.push('Stripe');
            if (url.includes('paypal')) result.vendors.payment.push('PayPal');
            if (url.includes('square')) result.vendors.payment.push('Square');
            if (url.includes('paddle')) result.vendors.payment.push('Paddle');
            
            // Support
            if (url.includes('intercom')) result.vendors.support.push('Intercom');
            if (url.includes('zendesk')) result.vendors.support.push('Zendesk');
            if (url.includes('drift')) result.vendors.support.push('Drift');
            if (url.includes('crisp.chat')) result.vendors.support.push('Crisp');
            
            // Email
            if (url.includes('sendgrid')) result.vendors.email.push('SendGrid');
            if (url.includes('mailchimp')) result.vendors.email.push('Mailchimp');
            if (url.includes('convertkit')) result.vendors.email.push('ConvertKit');
          });

          // Check meta generator
          if (result.metadata.generator) {
            const gen = result.metadata.generator.toLowerCase();
            if (gen.includes('wordpress')) {
              result.technologies.cms.push({ name: 'WordPress', category: 'cms', confidence: 1.0 });
            }
            if (gen.includes('drupal')) {
              result.technologies.cms.push({ name: 'Drupal', category: 'cms', confidence: 1.0 });
            }
            if (gen.includes('joomla')) {
              result.technologies.cms.push({ name: 'Joomla', category: 'cms', confidence: 1.0 });
            }
            if (gen.includes('wix')) {
              result.technologies.cms.push({ name: 'Wix', category: 'cms', confidence: 1.0 });
            }
          }
        },
      });

      await crawler.run([url]);

      // Additional checks
      await this.detectHostingAndDNS(url, result);
      await this.checkSecurityHeaders(url, result);

      // Deduplicate vendors
      Object.keys(result.vendors).forEach(key => {
        const vendorKey = key as keyof VendorInfo;
        if (Array.isArray(result.vendors[vendorKey])) {
          (result.vendors as any)[vendorKey] = [...new Set(result.vendors[vendorKey] as string[])];
        }
      });

    } catch (error) {
      console.error('Technology detection error:', error);
    }

    return result;
  }

  private async detectHostingAndDNS(url: string, result: TechDetectionResult) {
    try {
      const hostname = new URL(url).hostname;
      
      // DNS lookup
      const addresses = await dns.resolve4(hostname).catch(() => []);
      
      // Reverse DNS to detect hosting
      for (const ip of addresses) {
        try {
          const hostnames = await dns.reverse(ip);
          hostnames.forEach(host => {
            if (host.includes('amazonaws')) result.vendors.hosting.push('AWS');
            if (host.includes('googleusercontent')) result.vendors.hosting.push('Google Cloud');
            if (host.includes('azure')) result.vendors.hosting.push('Microsoft Azure');
            if (host.includes('digitalocean')) result.vendors.hosting.push('DigitalOcean');
            if (host.includes('linode')) result.vendors.hosting.push('Linode');
            if (host.includes('vultr')) result.vendors.hosting.push('Vultr');
            if (host.includes('vercel')) result.vendors.hosting.push('Vercel');
            if (host.includes('netlify')) result.vendors.hosting.push('Netlify');
          });
        } catch {}
      }

      // Check nameservers
      const nameservers = await dns.resolveNs(hostname).catch(() => []);
      nameservers.forEach(ns => {
        if (ns.includes('cloudflare')) result.vendors.dns.push('Cloudflare');
        if (ns.includes('awsdns')) result.vendors.dns.push('AWS Route 53');
        if (ns.includes('azure-dns')) result.vendors.dns.push('Azure DNS');
        if (ns.includes('google')) result.vendors.dns.push('Google Cloud DNS');
        if (ns.includes('dnsmadeeasy')) result.vendors.dns.push('DNS Made Easy');
      });

    } catch (error) {
      console.error('DNS detection error:', error);
    }
  }

  private async checkSecurityHeaders(url: string, result: TechDetectionResult) {
    try {
      const response = await axios.head(url, { 
        validateStatus: () => true,
        maxRedirects: 5,
      });

      const securityHeaders = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'x-permitted-cross-domain-policies',
      ];

      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          result.security.securityHeaders[header] = response.headers[header];
        }
      });

      // Check for security services
      if (response.headers['cf-ray']) {
        result.technologies.security.push({ 
          name: 'Cloudflare Security', 
          category: 'security', 
          confidence: 1.0 
        });
      }

    } catch (error) {
      console.error('Security headers check error:', error);
    }
  }

  async generateTechReport(detection: TechDetectionResult): Promise<string> {
    const report = [];
    
    report.push(`# Technology Stack Analysis for ${detection.url}\n`);
    
    report.push(`## Overview`);
    report.push(`- **Total Technologies Detected**: ${this.countTechnologies(detection.technologies)}`);
    report.push(`- **Page Load Time**: ${detection.performance.loadTime}ms`);
    report.push(`- **Total Size**: ${(detection.performance.size / 1024 / 1024).toFixed(2)}MB`);
    report.push(`- **HTTP Requests**: ${detection.performance.requests}`);
    report.push(`- **HTTPS Enabled**: ${detection.security.httpsEnabled ? 'Yes' : 'No'}\n`);

    report.push(`## Technology Stack`);
    
    Object.entries(detection.technologies).forEach(([category, techs]) => {
      if (techs.length > 0) {
        report.push(`\n### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        techs.forEach((tech: any) => {
          report.push(`- **${tech.name}**${tech.version ? ` v${tech.version}` : ''} (${Math.round(tech.confidence * 100)}% confidence)`);
        });
      }
    });

    report.push(`\n## Vendors & Services`);
    
    Object.entries(detection.vendors).forEach(([service, vendors]) => {
      if (vendors.length > 0 || (service === 'ssl' && vendors)) {
        report.push(`- **${service.charAt(0).toUpperCase() + service.slice(1)}**: ${Array.isArray(vendors) ? vendors.join(', ') : vendors}`);
      }
    });

    report.push(`\n## Security Analysis`);
    
    const secHeaders = Object.keys(detection.security.securityHeaders);
    report.push(`- **Security Headers**: ${secHeaders.length}/8 recommended headers present`);
    
    if (secHeaders.length > 0) {
      report.push(`  - Present: ${secHeaders.join(', ')}`);
    }

    const missingHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'referrer-policy',
      'permissions-policy',
      'x-permitted-cross-domain-policies',
    ].filter(h => !secHeaders.includes(h));

    if (missingHeaders.length > 0) {
      report.push(`  - Missing: ${missingHeaders.join(', ')}`);
    }

    return report.join('\n');
  }

  private countTechnologies(stack: TechnologyStack): number {
    return Object.values(stack).reduce((sum, techs) => sum + techs.length, 0);
  }
}