import { PlaywrightCrawler, Configuration } from 'crawlee';
import { chromium, Browser, Page } from 'playwright';
import * as tls from 'tls';
import * as dns from 'dns/promises';
import * as net from 'net';
import { promisify } from 'util';
import axios from 'axios';

interface TechnicalProfile {
  url: string;
  infrastructure: {
    ssl: SSLInfo;
    dns: DNSInfo;
    headers: Record<string, string>;
    cookies: CookieInfo[];
    localStorage: Record<string, any>;
    networking: NetworkingInfo;
  };
  performance: PerformanceMetrics;
  security: SecurityAssessment;
  apis: APIDiscovery;
  technologies: TechnologyStack;
  har: any; // Full HAR capture
}

interface SSLInfo {
  issuer: string;
  validFrom: Date;
  validTo: Date;
  protocol: string;
  cipher: string;
  subjectAltNames: string[];
  fingerprint: string;
}

interface DNSInfo {
  ipAddresses: string[];
  nameservers: string[];
  mx: string[];
  txt: string[];
  cname?: string;
  reversePtr?: string[];
}

interface CookieInfo {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
}

interface NetworkingInfo {
  cdn?: string;
  loadBalancer?: string;
  reverseProxy?: string;
  hosting?: string;
  asn?: string;
  location?: string;
}

interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalRequests: number;
  totalSize: number;
  resourceBreakdown: Record<string, { count: number; size: number }>;
}

interface SecurityAssessment {
  hasHttps: boolean;
  hasCsp: boolean;
  hasHsts: boolean;
  hasXFrameOptions: boolean;
  hasCors: boolean;
  vulnerabilities: string[];
  securityHeaders: Record<string, string>;
}

interface APIDiscovery {
  endpoints: string[];
  graphqlEndpoints: string[];
  restEndpoints: string[];
  websockets: string[];
  apiKeys: string[];
  sdks: string[];
}

interface TechnologyStack {
  frontend: string[];
  backend: string[];
  databases: string[];
  analytics: string[];
  cdns: string[];
  frameworks: string[];
  libraries: string[];
  infrastructure: string[];
}

export class TechnicalCollector {
  private browser: Browser | null = null;

  async collectTechnicalData(domain: string): Promise<any> {
    // Convert domain to URL if needed
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const profile = await this.collectTechnicalProfile(url);
    
    // Transform to expected format for LangGraph integration
    return {
      httpInfo: {
        headers: profile.infrastructure.headers,
        cookies: profile.infrastructure.cookies,
        ssl: profile.infrastructure.ssl,
      },
      dnsRecords: profile.infrastructure.dns,
      ports: {
        open: [], // Would need actual port scanning
        services: [],
      },
      subdomains: [], // Would need subdomain enumeration
      technologies: profile.technologies,
      performance: profile.performance,
      security: profile.security,
      apis: profile.apis,
    };
  }

  async collectTechnicalProfile(url: string): Promise<TechnicalProfile> {
    console.log(`🔧 Collecting technical profile for ${url}`);
    
    try {
      // Initialize browser if needed
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
        });
      }

      const context = await this.browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (compatible; TechScanIQ/2.0; +https://techscaniq.io)',
      });

      // Enable request interception and HAR recording
      const har: any = { log: { entries: [] } };
      const page = await context.newPage();

      // Collect all network data
      const requests: any[] = [];
      const responses: any[] = [];
      
      page.on('request', request => {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
          timestamp: Date.now(),
        });
      });

      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          timestamp: Date.now(),
        });
      });

      // Navigate and wait for network idle
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      // Collect various technical data in parallel
      const [
        ssl,
        dns,
        headers,
        cookies,
        localStorage,
        performance,
        technologies,
        apis,
        security,
      ] = await Promise.all([
        this.collectSSLInfo(url),
        this.collectDNSInfo(url),
        this.collectHeaders(url),
        this.collectCookies(page),
        this.collectLocalStorage(page),
        this.collectPerformanceMetrics(page, loadTime),
        this.detectTechnologies(page, responses),
        this.discoverAPIs(page, requests, responses),
        this.assessSecurity(url, responses),
      ]);

      // Build HAR data
      har.log.entries = requests.map((req, idx) => ({
        startedDateTime: new Date(req.timestamp).toISOString(),
        request: {
          method: req.method,
          url: req.url,
          headers: Object.entries(req.headers).map(([name, value]) => ({ name, value })),
          postData: req.postData ? { text: req.postData } : undefined,
        },
        response: responses[idx] ? {
          status: responses[idx].status,
          headers: Object.entries(responses[idx].headers).map(([name, value]) => ({ name, value })),
        } : undefined,
      }));

      // Analyze networking infrastructure
      const networking = await this.analyzeNetworking(headers, dns, responses);

      await context.close();

      return {
        url,
        infrastructure: {
          ssl,
          dns,
          headers,
          cookies,
          localStorage,
          networking,
        },
        performance,
        security,
        apis,
        technologies,
        har,
      };
    } catch (error) {
      console.error('Technical collection error:', error);
      throw error;
    }
  }

  private async collectSSLInfo(url: string): Promise<SSLInfo> {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'https:') {
        return null as any;
      }

      return new Promise((resolve, reject) => {
        const options = {
          host: urlObj.hostname,
          port: 443,
          servername: urlObj.hostname,
        };

        const socket = tls.connect(options, () => {
          const cert = socket.getPeerCertificate(true);
          resolve({
            issuer: cert.issuer.CN || cert.issuer.O,
            validFrom: new Date(cert.valid_from),
            validTo: new Date(cert.valid_to),
            protocol: socket.getProtocol() || '',
            cipher: socket.getCipher()?.name || '',
            subjectAltNames: cert.subjectaltname?.split(', ').map(s => s.replace('DNS:', '')) || [],
            fingerprint: cert.fingerprint,
          });
          socket.end();
        });

        socket.on('error', reject);
      });
    } catch (error) {
      console.error('SSL collection error:', error);
      return null as any;
    }
  }

  private async collectDNSInfo(url: string): Promise<DNSInfo> {
    try {
      const hostname = new URL(url).hostname;
      
      const [ipAddresses, mx, txt, ns] = await Promise.allSettled([
        dns.resolve4(hostname).catch(() => []),
        dns.resolveMx(hostname).catch(() => []),
        dns.resolveTxt(hostname).catch(() => []),
        dns.resolveNs(hostname).catch(() => []),
      ]);

      const ips = ipAddresses.status === 'fulfilled' ? ipAddresses.value : [];
      
      // Try reverse DNS
      const reversePtr = await Promise.all(
        ips.map(ip => dns.reverse(ip).catch(() => []))
      );

      return {
        ipAddresses: ips,
        nameservers: ns.status === 'fulfilled' ? ns.value : [],
        mx: mx.status === 'fulfilled' ? mx.value.map(m => m.exchange) : [],
        txt: txt.status === 'fulfilled' ? txt.value.flat() : [],
        reversePtr: reversePtr.flat(),
      };
    } catch (error) {
      console.error('DNS collection error:', error);
      return {
        ipAddresses: [],
        nameservers: [],
        mx: [],
        txt: [],
        reversePtr: [],
      };
    }
  }

  private async collectHeaders(url: string): Promise<Record<string, string>> {
    try {
      const response = await axios.head(url, {
        validateStatus: () => true,
        maxRedirects: 0,
      });
      // Convert headers to simple object
      const headers: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        }
      });
      return headers;
    } catch (error) {
      return {};
    }
  }

  private async collectCookies(page: Page): Promise<CookieInfo[]> {
    const cookies = await page.context().cookies();
    return cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite as string,
    }));
  }

  private async collectLocalStorage(page: Page): Promise<Record<string, any>> {
    return await page.evaluate(() => {
      const storage: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            storage[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            storage[key] = localStorage.getItem(key);
          }
        }
      }
      return storage;
    });
  }

  private async collectPerformanceMetrics(page: Page, loadTime: number): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const breakdown: Record<string, { count: number; size: number }> = {};
      let totalSize = 0;
      
      resources.forEach(resource => {
        const type = resource.initiatorType || 'other';
        if (!breakdown[type]) {
          breakdown[type] = { count: 0, size: 0 };
        }
        breakdown[type].count++;
        breakdown[type].size += resource.transferSize || 0;
        totalSize += resource.transferSize || 0;
      });

      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        firstContentfulPaint: perf.loadEventEnd, // Simplified
        totalRequests: resources.length,
        totalSize,
        resourceBreakdown: breakdown,
      };
    });

    return {
      pageLoadTime: loadTime,
      ...metrics,
      largestContentfulPaint: 0, // Would need additional monitoring
    };
  }

  private async detectTechnologies(page: Page, responses: any[]): Promise<TechnologyStack> {
    // Detect technologies from various sources
    const technologies = await page.evaluate(() => {
      const detected = {
        frontend: [] as string[],
        backend: [] as string[],
        databases: [] as string[],
        analytics: [] as string[],
        cdns: [] as string[],
        frameworks: [] as string[],
        libraries: [] as string[],
        infrastructure: [] as string[],
      };

      // Check for common global variables
      if ((window as any).React) detected.libraries.push('React');
      if ((window as any).Vue) detected.libraries.push('Vue');
      if ((window as any).angular) detected.libraries.push('Angular');
      if ((window as any).jQuery) detected.libraries.push('jQuery');
      if ((window as any).gtag) detected.analytics.push('Google Analytics');
      if ((window as any).Shopify) detected.infrastructure.push('Shopify');
      
      // Check meta tags
      const generator = document.querySelector('meta[name="generator"]');
      if (generator) detected.infrastructure.push(generator.getAttribute('content') || '');

      return detected;
    });

    // Analyze response headers for backend technologies
    responses.forEach(response => {
      const headers = response.headers;
      if (headers['x-powered-by']) {
        technologies.backend.push(headers['x-powered-by']);
      }
      if (headers['server']) {
        technologies.infrastructure.push(headers['server']);
      }
    });

    return technologies;
  }

  private async discoverAPIs(page: Page, requests: any[], responses: any[]): Promise<APIDiscovery> {
    const apis: APIDiscovery = {
      endpoints: [],
      graphqlEndpoints: [],
      restEndpoints: [],
      websockets: [],
      apiKeys: [],
      sdks: [],
    };

    // Analyze requests
    requests.forEach(req => {
      const url = req.url;
      
      if (url.includes('/api/')) {
        apis.endpoints.push(url);
        apis.restEndpoints.push(url);
      }
      
      if (url.includes('/graphql')) {
        apis.graphqlEndpoints.push(url);
      }
      
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        apis.websockets.push(url);
      }
      
      // Check for API keys in URLs
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      params.forEach((value, key) => {
        if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
          apis.apiKeys.push(`${key}=<redacted>`);
        }
      });
    });

    // Check for SDK loads
    const sdks = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts
        .map(s => s.getAttribute('src'))
        .filter(src => src && (
          src.includes('sdk') || 
          src.includes('widget') || 
          src.includes('embed')
        ));
    }) as string[];
    
    apis.sdks = sdks;

    return apis;
  }

  private async assessSecurity(url: string, responses: any[]): Promise<SecurityAssessment> {
    const assessment: SecurityAssessment = {
      hasHttps: url.startsWith('https://'),
      hasCsp: false,
      hasHsts: false,
      hasXFrameOptions: false,
      hasCors: false,
      vulnerabilities: [],
      securityHeaders: {},
    };

    // Check security headers
    const mainResponse = responses.find(r => r.url === url);
    if (mainResponse) {
      const headers = mainResponse.headers;
      
      if (headers['content-security-policy']) {
        assessment.hasCsp = true;
        assessment.securityHeaders['CSP'] = headers['content-security-policy'];
      }
      
      if (headers['strict-transport-security']) {
        assessment.hasHsts = true;
        assessment.securityHeaders['HSTS'] = headers['strict-transport-security'];
      }
      
      if (headers['x-frame-options']) {
        assessment.hasXFrameOptions = true;
        assessment.securityHeaders['X-Frame-Options'] = headers['x-frame-options'];
      }
      
      if (headers['access-control-allow-origin']) {
        assessment.hasCors = true;
        assessment.securityHeaders['CORS'] = headers['access-control-allow-origin'];
      }
    }

    // Basic vulnerability checks
    if (!assessment.hasHttps) {
      assessment.vulnerabilities.push('No HTTPS encryption');
    }
    if (!assessment.hasCsp) {
      assessment.vulnerabilities.push('Missing Content Security Policy');
    }
    if (!assessment.hasHsts) {
      assessment.vulnerabilities.push('Missing HSTS header');
    }

    return assessment;
  }

  private async analyzeNetworking(
    headers: Record<string, string>,
    dns: DNSInfo,
    responses: any[]
  ): Promise<NetworkingInfo> {
    const networking: NetworkingInfo = {};

    // Detect CDN
    if (headers['x-served-by']?.includes('cloudflare')) {
      networking.cdn = 'Cloudflare';
    } else if (headers['x-amz-cf-id']) {
      networking.cdn = 'AWS CloudFront';
    } else if (headers['x-azure-ref']) {
      networking.cdn = 'Azure CDN';
    }

    // Detect hosting
    if (headers['x-vercel-id']) {
      networking.hosting = 'Vercel';
    } else if (headers['x-served-by']?.includes('netlify')) {
      networking.hosting = 'Netlify';
    } else if (headers['x-amz-request-id']) {
      networking.hosting = 'AWS';
    }

    // Detect reverse proxy
    if (headers['x-nginx-proxy']) {
      networking.reverseProxy = 'Nginx';
    } else if (headers['x-haproxy']) {
      networking.reverseProxy = 'HAProxy';
    }

    return networking;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}