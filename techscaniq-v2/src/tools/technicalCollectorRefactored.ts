import axios from 'axios';
import * as tls from 'tls';
import * as dns from 'dns/promises';
import * as https from 'https';
import { DirectCrawl4AI } from './directCrawl4AI';

interface TechnicalProfile {
  url: string;
  infrastructure: {
    ssl: SSLInfo | null;
    dns: DNSInfo;
    headers: Record<string, string>;
    networking: NetworkingInfo;
  };
  performance: PerformanceMetrics;
  security: SecurityAssessment;
  apis: APIDiscovery;
  technologies: any;
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
  totalSize: number;
  responseTime: number;
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

export class TechnicalCollector {
  private crawl4ai: DirectCrawl4AI;

  constructor() {
    this.crawl4ai = new DirectCrawl4AI();
  }

  async collectTechnicalData(domain: string): Promise<any> {
    // Convert domain to URL if needed
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const profile = await this.collectTechnicalProfile(url);
    
    // Transform to expected format for LangGraph integration
    return {
      httpInfo: {
        headers: profile.infrastructure.headers,
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
      const startTime = Date.now();
      
      // Collect various technical data in parallel
      const [
        ssl,
        dns,
        httpData,
        crawlData,
      ] = await Promise.all([
        this.collectSSLInfo(url),
        this.collectDNSInfo(url),
        this.collectHTTPData(url),
        this.crawl4ai.extract(url, { extractionType: 'full_content', maxPages: 1 }),
      ]);

      const loadTime = Date.now() - startTime;
      
      // Analyze the collected data
      const apis = this.discoverAPIs(httpData.headers, crawlData);
      const security = this.assessSecurity(url, httpData.headers, ssl);
      const networking = this.analyzeNetworking(httpData.headers, dns);
      
      // Extract technology info from Crawl4AI response
      const technologies = crawlData.length > 0 ? 
        this.extractTechnologies(JSON.parse(crawlData[0].content)) : {};

      return {
        url,
        infrastructure: {
          ssl,
          dns,
          headers: httpData.headers,
          networking,
        },
        performance: {
          pageLoadTime: loadTime,
          totalSize: httpData.size,
          responseTime: httpData.responseTime,
        },
        security,
        apis,
        technologies,
      };
    } catch (error) {
      console.error('Technical collection error:', error);
      throw error;
    }
  }

  private async collectSSLInfo(url: string): Promise<SSLInfo | null> {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'https:') {
        return null;
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

        socket.on('error', () => resolve(null));
        socket.setTimeout(5000, () => {
          socket.destroy();
          resolve(null);
        });
      });
    } catch (error) {
      console.error('SSL collection error:', error);
      return null;
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

  private async collectHTTPData(url: string): Promise<{ headers: Record<string, string>, size: number, responseTime: number }> {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechScanIQ/2.0)',
        },
        timeout: 10000,
        validateStatus: () => true,
        maxRedirects: 5,
      });
      const responseTime = Date.now() - startTime;
      
      // Convert headers to simple object
      const headers: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        }
      });
      
      const size = JSON.stringify(response.data).length;
      
      return { headers, size, responseTime };
    } catch (error) {
      return { headers: {}, size: 0, responseTime: 0 };
    }
  }

  private discoverAPIs(headers: Record<string, string>, crawlData: any[]): APIDiscovery {
    const apis: APIDiscovery = {
      endpoints: [],
      graphqlEndpoints: [],
      restEndpoints: [],
      websockets: [],
      apiKeys: [],
      sdks: [],
    };

    // Check common API patterns in headers
    if (headers['x-api-version']) {
      apis.endpoints.push(`API Version: ${headers['x-api-version']}`);
    }

    // Analyze crawled content for API references
    if (crawlData.length > 0) {
      try {
        const content = JSON.parse(crawlData[0].content);
        const text = JSON.stringify(content).toLowerCase();
        
        // Look for API patterns
        if (text.includes('/api/')) apis.endpoints.push('REST API detected');
        if (text.includes('/graphql')) apis.graphqlEndpoints.push('GraphQL endpoint detected');
        if (text.includes('websocket') || text.includes('ws://')) apis.websockets.push('WebSocket detected');
        
        // Look for SDK references
        const sdkPatterns = ['sdk', 'api-key', 'client-id', 'app-id'];
        sdkPatterns.forEach(pattern => {
          if (text.includes(pattern)) {
            apis.sdks.push(`${pattern} reference found`);
          }
        });
      } catch (error) {
        // Parsing failed
      }
    }

    return apis;
  }

  private assessSecurity(url: string, headers: Record<string, string>, ssl: SSLInfo | null): SecurityAssessment {
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
    if (!ssl) {
      assessment.vulnerabilities.push('SSL certificate not available');
    }

    return assessment;
  }

  private analyzeNetworking(headers: Record<string, string>, dns: DNSInfo): NetworkingInfo {
    const networking: NetworkingInfo = {};

    // Detect CDN
    if (headers['x-served-by']?.includes('cloudflare') || headers['cf-ray']) {
      networking.cdn = 'Cloudflare';
    } else if (headers['x-amz-cf-id']) {
      networking.cdn = 'AWS CloudFront';
    } else if (headers['x-azure-ref']) {
      networking.cdn = 'Azure CDN';
    } else if (headers['x-fastly-request-id']) {
      networking.cdn = 'Fastly';
    }

    // Detect hosting
    if (headers['x-vercel-id']) {
      networking.hosting = 'Vercel';
    } else if (headers['x-served-by']?.includes('netlify')) {
      networking.hosting = 'Netlify';
    } else if (headers['x-amz-request-id']) {
      networking.hosting = 'AWS';
    } else if (headers['server']?.includes('Microsoft')) {
      networking.hosting = 'Azure';
    }

    // Detect reverse proxy
    if (headers['server']?.toLowerCase().includes('nginx')) {
      networking.reverseProxy = 'Nginx';
    } else if (headers['server']?.toLowerCase().includes('apache')) {
      networking.reverseProxy = 'Apache';
    }

    return networking;
  }

  private extractTechnologies(crawlData: any): any {
    // Extract technology information from Crawl4AI response
    try {
      const data = crawlData.data?.[0] || {};
      return {
        detected: data.technologies || [],
        metadata: data.metadata || {},
      };
    } catch (error) {
      return {};
    }
  }
}