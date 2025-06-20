import axios from 'axios';
import * as dns from 'dns/promises';
import * as cheerio from 'cheerio';
import { DirectCrawl4AI } from './directCrawl4AI';

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
  metadata: {
    title: string;
    description: string;
    keywords: string[];
    socialMedia: Record<string, string>;
  };
  signals: {
    hasEcommerce: boolean;
    hasAnalytics: boolean;
    hasMarketing: boolean;
    hasCMS: boolean;
    isWordPress: boolean;
    isShopify: boolean;
  };
}

export class WebTechDetector {
  private crawl4ai: DirectCrawl4AI;
  
  constructor() {
    this.crawl4ai = new DirectCrawl4AI();
  }

  async detectTechnologies(url: string): Promise<TechDetectionResult> {
    console.log(`🔍 Detecting technologies for ${url}`);
    
    const startTime = Date.now();
    
    try {
      // Use Crawl4AI to get the page content
      const evidence = await this.crawl4ai.extract(url, {
        extractionType: 'full_content',
        useSitemap: false,
        maxPages: 1,
      });

      // Also get headers and basic info via axios
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechDetector/1.0)',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      const loadTime = Date.now() - startTime;
      
      // Parse the HTML content
      const html = evidence.length > 0 ? JSON.parse(evidence[0].content).data[0]?.content || response.data : response.data;
      const $ = cheerio.load(html);
      
      // Detect technologies
      const technologies = this.detectFromHTML($, response.headers);
      
      // Detect vendors
      const vendors = await this.detectVendors(url, $, response.headers);
      
      // Extract metadata
      const metadata = this.extractMetadata($);
      
      // Detect signals
      const signals = this.detectSignals($, technologies);
      
      return {
        url,
        technologies,
        vendors,
        performance: {
          loadTime,
          size: html.length,
          requests: 1, // Simplified for now
        },
        metadata,
        signals,
      };
    } catch (error) {
      console.error('Tech detection error:', error);
      throw error;
    }
  }

  private detectFromHTML($: cheerio.CheerioAPI, headers: any): TechnologyStack {
    const technologies: TechnologyStack = {
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
    };

    // Frontend detection
    if ($('script[src*="react"]').length || $('script:contains("React")').length) {
      technologies.frontend.push({ name: 'React', category: 'frontend', confidence: 0.9 });
    }
    if ($('script[src*="vue"]').length || $('[v-cloak]').length) {
      technologies.frontend.push({ name: 'Vue.js', category: 'frontend', confidence: 0.9 });
    }
    if ($('script[src*="angular"]').length || $('[ng-app]').length) {
      technologies.frontend.push({ name: 'Angular', category: 'frontend', confidence: 0.9 });
    }
    if ($('script[src*="jquery"]').length) {
      technologies.libraries.push({ name: 'jQuery', category: 'libraries', confidence: 0.95 });
    }

    // Analytics detection
    if ($('script[src*="google-analytics"]').length || $('script[src*="gtag"]').length) {
      technologies.analytics.push({ name: 'Google Analytics', category: 'analytics', confidence: 0.95 });
    }
    if ($('script[src*="gtm.js"]').length) {
      technologies.analytics.push({ name: 'Google Tag Manager', category: 'analytics', confidence: 0.95 });
    }
    if ($('script[src*="segment.com"]').length) {
      technologies.analytics.push({ name: 'Segment', category: 'analytics', confidence: 0.9 });
    }

    // CMS detection
    if ($('meta[name="generator"][content*="WordPress"]').length || headers['x-powered-by']?.includes('WordPress')) {
      technologies.cms.push({ name: 'WordPress', category: 'cms', confidence: 0.95 });
    }
    if ($('meta[name="generator"][content*="Drupal"]').length) {
      technologies.cms.push({ name: 'Drupal', category: 'cms', confidence: 0.95 });
    }
    if ($('meta[name="generator"][content*="Joomla"]').length) {
      technologies.cms.push({ name: 'Joomla', category: 'cms', confidence: 0.95 });
    }

    // E-commerce detection
    if ($('meta[name="generator"][content*="Shopify"]').length || $('script[src*="shopify"]').length) {
      technologies.ecommerce.push({ name: 'Shopify', category: 'ecommerce', confidence: 0.95 });
    }
    if ($('script[src*="woocommerce"]').length) {
      technologies.ecommerce.push({ name: 'WooCommerce', category: 'ecommerce', confidence: 0.9 });
    }
    if ($('meta[name="generator"][content*="Magento"]').length) {
      technologies.ecommerce.push({ name: 'Magento', category: 'ecommerce', confidence: 0.9 });
    }

    // Backend detection from headers
    if (headers['x-powered-by']) {
      const poweredBy = headers['x-powered-by'];
      if (poweredBy.includes('PHP')) {
        technologies.backend.push({ name: 'PHP', category: 'backend', confidence: 0.9 });
      }
      if (poweredBy.includes('ASP.NET')) {
        technologies.backend.push({ name: 'ASP.NET', category: 'backend', confidence: 0.9 });
      }
      if (poweredBy.includes('Express')) {
        technologies.backend.push({ name: 'Express.js', category: 'backend', confidence: 0.9 });
      }
    }

    // Server detection
    if (headers['server']) {
      const server = headers['server'].toLowerCase();
      if (server.includes('nginx')) {
        technologies.infrastructure.push({ name: 'Nginx', category: 'infrastructure', confidence: 0.95 });
      }
      if (server.includes('apache')) {
        technologies.infrastructure.push({ name: 'Apache', category: 'infrastructure', confidence: 0.95 });
      }
      if (server.includes('cloudflare')) {
        technologies.cdn.push({ name: 'Cloudflare', category: 'cdn', confidence: 0.95 });
      }
    }

    // Framework detection
    if ($('link[href*="bootstrap"]').length || $('script[src*="bootstrap"]').length) {
      technologies.frameworks.push({ name: 'Bootstrap', category: 'frameworks', confidence: 0.9 });
    }
    if ($('link[href*="tailwind"]').length || $('[class*="tw-"]').length) {
      technologies.frameworks.push({ name: 'Tailwind CSS', category: 'frameworks', confidence: 0.85 });
    }

    return technologies;
  }

  private async detectVendors(url: string, $: cheerio.CheerioAPI, headers: any): Promise<VendorInfo> {
    const vendors: VendorInfo = {
      hosting: [],
      cdn: [],
      dns: [],
      ssl: '',
      analytics: [],
      payment: [],
      email: [],
      support: [],
    };

    // CDN detection
    if (headers['x-served-by']?.includes('cloudflare') || headers['cf-ray']) {
      vendors.cdn.push('Cloudflare');
    }
    if (headers['x-amz-cf-id']) {
      vendors.cdn.push('AWS CloudFront');
    }
    if (headers['x-azure-ref']) {
      vendors.cdn.push('Azure CDN');
    }
    if (headers['x-fastly-request-id']) {
      vendors.cdn.push('Fastly');
    }

    // Hosting detection
    if (headers['x-vercel-id']) {
      vendors.hosting.push('Vercel');
    }
    if (headers['x-served-by']?.includes('netlify')) {
      vendors.hosting.push('Netlify');
    }
    if (headers['x-amz-request-id']) {
      vendors.hosting.push('AWS');
    }
    if (headers['x-azure-ref']) {
      vendors.hosting.push('Azure');
    }

    // Analytics vendors
    if ($('script[src*="google-analytics"]').length) {
      vendors.analytics.push('Google Analytics');
    }
    if ($('script[src*="segment.com"]').length) {
      vendors.analytics.push('Segment');
    }
    if ($('script[src*="mixpanel"]').length) {
      vendors.analytics.push('Mixpanel');
    }

    // Payment vendors
    if ($('script[src*="stripe"]').length) {
      vendors.payment.push('Stripe');
    }
    if ($('script[src*="paypal"]').length) {
      vendors.payment.push('PayPal');
    }
    if ($('script[src*="square"]').length) {
      vendors.payment.push('Square');
    }

    // Support vendors
    if ($('script[src*="intercom"]').length) {
      vendors.support.push('Intercom');
    }
    if ($('script[src*="zendesk"]').length) {
      vendors.support.push('Zendesk');
    }
    if ($('script[src*="drift"]').length) {
      vendors.support.push('Drift');
    }

    // DNS detection
    try {
      const hostname = new URL(url).hostname;
      const nsRecords = await dns.resolveNs(hostname).catch(() => []);
      
      if (nsRecords.some(ns => ns.includes('cloudflare'))) {
        vendors.dns.push('Cloudflare DNS');
      }
      if (nsRecords.some(ns => ns.includes('awsdns'))) {
        vendors.dns.push('AWS Route 53');
      }
      if (nsRecords.some(ns => ns.includes('godaddy'))) {
        vendors.dns.push('GoDaddy');
      }
    } catch (error) {
      // DNS lookup failed
    }

    return vendors;
  }

  private extractMetadata($: cheerio.CheerioAPI): any {
    return {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [],
      socialMedia: {
        twitter: $('meta[name="twitter:site"]').attr('content') || '',
        facebook: $('meta[property="fb:app_id"]').attr('content') || '',
        linkedin: $('a[href*="linkedin.com"]').first().attr('href') || '',
      },
    };
  }

  private detectSignals($: cheerio.CheerioAPI, technologies: TechnologyStack): any {
    return {
      hasEcommerce: technologies.ecommerce.length > 0 || 
                    $('[class*="cart"], [id*="cart"], [class*="shop"], [id*="shop"]').length > 0,
      hasAnalytics: technologies.analytics.length > 0,
      hasMarketing: technologies.marketing.length > 0 || 
                    $('script[src*="mailchimp"], script[src*="hubspot"]').length > 0,
      hasCMS: technologies.cms.length > 0,
      isWordPress: technologies.cms.some(t => t.name === 'WordPress'),
      isShopify: technologies.ecommerce.some(t => t.name === 'Shopify'),
    };
  }
}