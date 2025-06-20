import axios from 'axios';
import * as dns from 'dns/promises';
import { chromium, Browser, Page } from 'playwright';

export interface AdvancedTechnicalEvidence {
  performanceMetrics?: PerformanceMetrics;
  networkAnalysis?: NetworkAnalysis;
  jsFrameworks?: JavaScriptFrameworks;
  securityPosture?: SecurityPosture;
  apiIntelligence?: APIIntelligence;
  businessIntelligence?: BusinessIntelligence;
}

export interface PerformanceMetrics {
  lighthouse?: LighthouseMetrics;
  coreWebVitals?: CoreWebVitals;
  resourceTimings?: ResourceTiming[];
  renderTimeline?: RenderEvent[];
}

export interface LighthouseMetrics {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface NetworkAnalysis {
  requests: NetworkRequest[];
  thirdPartyDomains: string[];
  cdnUsage: CDNProvider[];
  apiCalls: APICall[];
  websockets: WebSocketConnection[];
}

export interface JavaScriptFrameworks {
  detected: Framework[];
  bundleAnalysis?: BundleInfo;
  dependencies?: string[];
  buildTools?: string[];
}

export interface SecurityPosture {
  subdomains: string[];
  certificateTransparency: CTLog[];
  corsPolicy?: CORSPolicy;
  authenticationMethods: string[];
  rateLimiting?: RateLimitInfo;
}

export interface APIIntelligence {
  graphqlSchema?: string;
  restEndpoints: APIEndpoint[];
  authentication: AuthMethod[];
  documentation?: APIDocumentation;
}

export interface BusinessIntelligence {
  pricing?: PricingModel;
  features?: Feature[];
  integrations?: Integration[];
  customerTestimonials?: Testimonial[];
  supportChannels?: SupportChannel[];
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  size: number;
  duration: number;
  type: string;
  headers: Record<string, string>;
}

interface Framework {
  name: string;
  version?: string;
  confidence: number;
  signals: string[];
}

interface APIEndpoint {
  path: string;
  method: string;
  authenticated: boolean;
  parameters?: Parameter[];
  response?: ResponseSchema;
}

export class AdvancedTechnicalAnalyzer {
  private browser?: Browser;
  
  async analyze(url: string, options: AnalysisOptions = {}): Promise<AdvancedTechnicalEvidence> {
    const evidence: AdvancedTechnicalEvidence = {};
    
    try {
      // Initialize browser if needed
      if (options.useBrowser) {
        this.browser = await chromium.launch({ headless: true });
      }
      
      // Run analyses in parallel where possible
      const analyses = await Promise.allSettled([
        options.performance !== false ? this.analyzePerformance(url) : null,
        options.network !== false ? this.analyzeNetwork(url) : null,
        options.javascript !== false ? this.analyzeJavaScript(url) : null,
        options.security !== false ? this.analyzeSecurity(url) : null,
        options.api !== false ? this.analyzeAPIs(url) : null,
        options.business !== false ? this.analyzeBusinessIntelligence(url) : null,
      ]);
      
      // Collect results
      const [performance, network, javascript, security, api, business] = analyses;
      
      if (performance.status === 'fulfilled' && performance.value) {
        evidence.performanceMetrics = performance.value;
      }
      if (network.status === 'fulfilled' && network.value) {
        evidence.networkAnalysis = network.value;
      }
      if (javascript.status === 'fulfilled' && javascript.value) {
        evidence.jsFrameworks = javascript.value;
      }
      if (security.status === 'fulfilled' && security.value) {
        evidence.securityPosture = security.value;
      }
      if (api.status === 'fulfilled' && api.value) {
        evidence.apiIntelligence = api.value;
      }
      if (business.status === 'fulfilled' && business.value) {
        evidence.businessIntelligence = business.value;
      }
      
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
    
    return evidence;
  }
  
  private async analyzePerformance(url: string): Promise<PerformanceMetrics> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const page = await this.browser.newPage();
    const metrics: PerformanceMetrics = {};
    
    try {
      // Enable performance monitoring
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      // Navigate and wait for load
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Get performance metrics
      const perfData = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        return {
          navigation,
          paint,
          resources: performance.getEntriesByType('resource'),
          memory: (performance as any).memory,
        };
      });
      
      // Calculate Core Web Vitals
      metrics.coreWebVitals = {
        lcp: await this.getLCP(page),
        fid: 0, // Would need user interaction
        cls: await this.getCLS(page),
        fcp: this.getFCP(perfData.paint),
        ttfb: perfData.navigation.responseStart - perfData.navigation.requestStart,
      };
      
      // Get resource timings
      metrics.resourceTimings = perfData.resources.map((r: any) => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize || 0,
        type: r.initiatorType,
      }));
      
      // Get JS/CSS coverage
      const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage(),
      ]);
      
      // Calculate unused bytes
      const jsUnused = jsCoverage.reduce((acc, entry) => {
        const unused = entry.text.length - entry.ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
        return acc + unused;
      }, 0);
      
      const cssUnused = cssCoverage.reduce((acc, entry) => {
        const unused = entry.text.length - entry.ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
        return acc + unused;
      }, 0);
      
      // Simulated Lighthouse scores (would need actual Lighthouse API)
      metrics.lighthouse = {
        performance: Math.round(100 - (metrics.coreWebVitals.lcp / 25)), 
        accessibility: 85, // Would need axe-core
        bestPractices: 90,
        seo: 95,
        pwa: 60,
      };
      
    } finally {
      await page.close();
    }
    
    return metrics;
  }
  
  private async analyzeNetwork(url: string): Promise<NetworkAnalysis> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const page = await this.browser.newPage();
    const requests: NetworkRequest[] = [];
    const thirdPartyDomains = new Set<string>();
    const apiCalls: APICall[] = [];
    
    try {
      // Monitor network requests
      page.on('request', request => {
        const reqUrl = new URL(request.url());
        const baseUrl = new URL(url);
        
        if (reqUrl.hostname !== baseUrl.hostname) {
          thirdPartyDomains.add(reqUrl.hostname);
        }
        
        // Detect API calls
        if (reqUrl.pathname.includes('/api/') || reqUrl.pathname.includes('/graphql')) {
          apiCalls.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData(),
          });
        }
      });
      
      page.on('response', response => {
        requests.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          size: parseInt(response.headers()['content-length'] || '0'),
          duration: 0, // Would need timing info
          type: response.headers()['content-type'] || 'unknown',
          headers: response.headers(),
        });
      });
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Analyze CDN usage
      const cdnProviders = this.detectCDNs(Array.from(thirdPartyDomains));
      
      return {
        requests,
        thirdPartyDomains: Array.from(thirdPartyDomains),
        cdnUsage: cdnProviders,
        apiCalls,
        websockets: [], // Would need WebSocket monitoring
      };
      
    } finally {
      await page.close();
    }
  }
  
  private async analyzeJavaScript(url: string): Promise<JavaScriptFrameworks> {
    const response = await axios.get(url);
    const html = response.data;
    
    const detected: Framework[] = [];
    
    // Framework detection patterns
    const patterns = [
      { name: 'React', pattern: /react(?:\.production)?\.min\.js|__REACT/i, signals: ['react', 'ReactDOM', '__REACT_DEVTOOLS'] },
      { name: 'Angular', pattern: /angular(?:\.min)?\.js|ng-version/i, signals: ['ng-version', 'angular', '__NG'] },
      { name: 'Vue.js', pattern: /vue(?:\.min)?\.js|Vue\.version/i, signals: ['Vue', '__VUE__', 'v-if'] },
      { name: 'jQuery', pattern: /jquery(?:\.min)?\.js|\$\.fn\.jquery/i, signals: ['jQuery', '$'] },
      { name: 'Next.js', pattern: /_next\/|__NEXT_DATA__/i, signals: ['__NEXT_DATA__', '_next'] },
      { name: 'Nuxt.js', pattern: /_nuxt\/|__NUXT__/i, signals: ['__NUXT__', '_nuxt'] },
      { name: 'Gatsby', pattern: /gatsby|___gatsby/i, signals: ['___gatsby', 'gatsby'] },
      { name: 'Express', pattern: /X-Powered-By.*Express/i, signals: ['express'] },
    ];
    
    // Check patterns
    patterns.forEach(({ name, pattern, signals }) => {
      if (pattern.test(html) || pattern.test(JSON.stringify(response.headers))) {
        const foundSignals = signals.filter(signal => html.includes(signal));
        detected.push({
          name,
          confidence: Math.min(foundSignals.length / signals.length, 1),
          signals: foundSignals,
        });
      }
    });
    
    // Extract script tags for bundle analysis
    const scriptMatches = html.match(/<script[^>]*src="([^"]+)"[^>]*>/gi) || [];
    const scriptUrls = scriptMatches.map((tag: string) => {
      const match = tag.match(/src="([^"]+)"/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    // Detect build tools from URLs
    const buildTools = [];
    if (scriptUrls.some(url => url?.includes('webpack'))) buildTools.push('Webpack');
    if (scriptUrls.some(url => url?.includes('vite'))) buildTools.push('Vite');
    if (scriptUrls.some(url => url?.includes('parcel'))) buildTools.push('Parcel');
    if (scriptUrls.some(url => url?.includes('rollup'))) buildTools.push('Rollup');
    
    return {
      detected,
      buildTools: buildTools.length > 0 ? buildTools : undefined,
      dependencies: scriptUrls,
    };
  }
  
  private async analyzeSecurity(url: string): Promise<SecurityPosture> {
    const domain = new URL(url).hostname;
    
    // Subdomain enumeration (basic)
    const subdomains = await this.enumerateSubdomains(domain);
    
    // Check authentication methods
    const authMethods = await this.detectAuthMethods(url);
    
    return {
      subdomains,
      certificateTransparency: [], // Would need CT log API
      authenticationMethods: authMethods,
      // CORS and rate limiting would need actual testing
    };
  }
  
  private async analyzeAPIs(url: string): Promise<APIIntelligence> {
    const endpoints: APIEndpoint[] = [];
    
    // Common API paths to check
    const apiPaths = [
      '/api/v1/docs',
      '/api/v2/docs',
      '/swagger.json',
      '/openapi.json',
      '/graphql',
      '/.well-known/openapi',
    ];
    
    for (const path of apiPaths) {
      try {
        const response = await axios.get(url + path, { 
          timeout: 5000,
          validateStatus: status => status < 500 
        });
        
        if (response.status === 200) {
          endpoints.push({
            path,
            method: 'GET',
            authenticated: response.headers['www-authenticate'] ? true : false,
          });
          
          // If it's GraphQL, try introspection
          if (path.includes('graphql')) {
            try {
              const introspection = await this.introspectGraphQL(url + path);
              return {
                graphqlSchema: introspection,
                restEndpoints: endpoints,
                authentication: [],
              };
            } catch (e) {
              // Introspection might be disabled
            }
          }
        }
      } catch (e) {
        // Skip failed endpoints
      }
    }
    
    return {
      restEndpoints: endpoints,
      authentication: [],
    };
  }
  
  private async analyzeBusinessIntelligence(url: string): Promise<BusinessIntelligence> {
    // This would require page parsing and AI analysis
    // For now, return structure
    return {
      pricing: undefined,
      features: [],
      integrations: [],
      customerTestimonials: [],
      supportChannels: [],
    };
  }
  
  // Helper methods
  private async getLCP(page: Page): Promise<number> {
    return await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
  }
  
  private async getCLS(page: Page): Promise<number> {
    return await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          resolve(cls);
        }).observe({ entryTypes: ['layout-shift'] });
      });
    });
  }
  
  private getFCP(paintEntries: any[]): number {
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }
  
  private detectCDNs(domains: string[]): CDNProvider[] {
    const cdnPatterns = [
      { name: 'Cloudflare', pattern: /cloudflare|cf-/ },
      { name: 'CloudFront', pattern: /cloudfront|amazonaws/ },
      { name: 'Akamai', pattern: /akamai|akam/ },
      { name: 'Fastly', pattern: /fastly|fsly/ },
      { name: 'StackPath', pattern: /stackpath|highwinds/ },
    ];
    
    const detected: CDNProvider[] = [];
    
    domains.forEach(domain => {
      cdnPatterns.forEach(({ name, pattern }) => {
        if (pattern.test(domain)) {
          const existing = detected.find(cdn => cdn.name === name);
          if (existing) {
            existing.domains.push(domain);
          } else {
            detected.push({ name, domains: [domain] });
          }
        }
      });
    });
    
    return detected;
  }
  
  private async enumerateSubdomains(domain: string): Promise<string[]> {
    const commonSubdomains = [
      'www', 'api', 'app', 'admin', 'blog', 'shop', 'mail',
      'dev', 'staging', 'test', 'mobile', 'portal', 'secure',
    ];
    
    const found: string[] = [];
    
    for (const subdomain of commonSubdomains) {
      try {
        const fullDomain = `${subdomain}.${domain}`;
        await dns.resolve4(fullDomain);
        found.push(fullDomain);
      } catch (e) {
        // Not found
      }
    }
    
    return found;
  }
  
  private async detectAuthMethods(url: string): Promise<string[]> {
    const methods: string[] = [];
    
    try {
      const response = await axios.get(url);
      const html = response.data;
      
      // Check for OAuth providers
      if (html.includes('oauth') || html.includes('OAuth')) methods.push('OAuth');
      if (html.includes('login/google') || html.includes('accounts.google.com')) methods.push('Google OAuth');
      if (html.includes('login/facebook') || html.includes('facebook.com/dialog')) methods.push('Facebook OAuth');
      if (html.includes('login/github') || html.includes('github.com/login')) methods.push('GitHub OAuth');
      
      // Check for other auth methods
      if (html.includes('saml') || html.includes('SAML')) methods.push('SAML');
      if (html.includes('ldap') || html.includes('LDAP')) methods.push('LDAP');
      if (html.includes('two-factor') || html.includes('2fa')) methods.push('2FA');
      
      // Check headers
      if (response.headers['www-authenticate']) {
        const auth = response.headers['www-authenticate'];
        if (auth.includes('Basic')) methods.push('Basic Auth');
        if (auth.includes('Bearer')) methods.push('Bearer Token');
      }
    } catch (e) {
      // Ignore errors
    }
    
    return [...new Set(methods)];
  }
  
  private async introspectGraphQL(endpoint: string): Promise<string> {
    const introspectionQuery = {
      query: `
        query IntrospectionQuery {
          __schema {
            types {
              name
              kind
              description
              fields {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `,
    };
    
    const response = await axios.post(endpoint, introspectionQuery);
    return JSON.stringify(response.data, null, 2);
  }
}

// Types
interface AnalysisOptions {
  useBrowser?: boolean;
  performance?: boolean;
  network?: boolean;
  javascript?: boolean;
  security?: boolean;
  api?: boolean;
  business?: boolean;
}

interface CDNProvider {
  name: string;
  domains: string[];
}

interface APICall {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
}

interface RenderEvent {
  timestamp: number;
  type: string;
  target?: string;
}

interface BundleInfo {
  totalSize: number;
  chunks: ChunkInfo[];
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: number;
}

interface CTLog {
  issuer: string;
  notBefore: Date;
  notAfter: Date;
  dnsNames: string[];
}

interface CORSPolicy {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowCredentials: boolean;
}

interface RateLimitInfo {
  detected: boolean;
  limits?: Record<string, number>;
}

interface AuthMethod {
  type: string;
  endpoints: string[];
}

interface APIDocumentation {
  type: 'swagger' | 'openapi' | 'graphql';
  url: string;
  version?: string;
}

interface PricingModel {
  tiers: PricingTier[];
  currency: string;
  billingCycle: string;
}

interface PricingTier {
  name: string;
  price: number;
  features: string[];
}

interface Feature {
  name: string;
  description: string;
  category: string;
}

interface Integration {
  name: string;
  category: string;
  logo?: string;
}

interface Testimonial {
  author: string;
  company: string;
  content: string;
  rating?: number;
}

interface SupportChannel {
  type: string;
  availability: string;
  responseTime?: string;
}

interface ResponseSchema {
  type: string;
  properties?: Record<string, any>;
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}