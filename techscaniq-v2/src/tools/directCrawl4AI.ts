import axios from 'axios';
import * as cheerio from 'cheerio';
import { Evidence } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as xml2js from 'xml2js';

export interface Crawl4AIOptions {
  extractionType?: 'full_content' | 'pricing_plans' | 'customer_logos' | 'company_info' | 'recent_posts' | 'documentation';
  screenshotEnabled?: boolean;
  llmExtraction?: boolean;
  maxDepth?: number;
  useSitemap?: boolean;
  maxPages?: number;
  priorityThreshold?: number; // Sitemap priority threshold (0-1)
}

export class DirectCrawl4AI {
  private async fetchSitemap(domain: string): Promise<string[]> {
    const sitemapUrls = [
      `https://${domain}/sitemap.xml`,
      `https://${domain}/sitemap_index.xml`,
      `https://${domain}/sitemap-index.xml`,
      `https://${domain}/robots.txt`, // Check robots.txt for sitemap location
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await axios.get(sitemapUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000,
        });
        
        if (sitemapUrl.endsWith('robots.txt')) {
          // Parse robots.txt for sitemap location
          const sitemapMatch = response.data.match(/Sitemap:\s*(.+)/i);
          if (sitemapMatch && sitemapMatch[1]) {
            const foundSitemapUrl = sitemapMatch[1].trim();
            const sitemapResponse = await axios.get(foundSitemapUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              timeout: 10000,
            });
            return this.parseSitemap(sitemapResponse.data);
          }
        } else {
          // Parse XML sitemap
          return this.parseSitemap(response.data);
        }
      } catch (error) {
        console.log(`Sitemap not found at ${sitemapUrl}`);
      }
    }
    
    return [];
  }
  
  private async parseSitemap(xmlContent: string): Promise<string[]> {
    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);
      const urls: string[] = [];
      
      // Handle sitemap index
      if (result.sitemapindex && result.sitemapindex.sitemap) {
        const sitemapUrls = result.sitemapindex.sitemap.map((s: any) => s.loc[0]);
        
        // Fetch each sitemap in the index
        for (const sitemapUrl of sitemapUrls) {
          try {
            const response = await axios.get(sitemapUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              timeout: 10000,
            });
            const childUrls = await this.parseSitemap(response.data);
            urls.push(...childUrls);
          } catch (error) {
            console.error(`Failed to fetch sitemap ${sitemapUrl}`);
          }
        }
      }
      
      // Handle regular sitemap
      if (result.urlset && result.urlset.url) {
        result.urlset.url.forEach((urlEntry: any) => {
          if (urlEntry.loc && urlEntry.loc[0]) {
            const url = urlEntry.loc[0];
            const priority = urlEntry.priority ? parseFloat(urlEntry.priority[0]) : 0.5;
            const lastmod = urlEntry.lastmod ? new Date(urlEntry.lastmod[0]) : null;
            
            // Add URL with metadata for filtering
            urls.push(url);
          }
        });
      }
      
      return urls;
    } catch (error) {
      console.error('Failed to parse sitemap:', error);
      return [];
    }
  }
  
  private intelligentUrlSelection(urls: string[], options: Crawl4AIOptions): string[] {
    const { extractionType, maxPages = 10, priorityThreshold = 0.3 } = options;
    
    // Filter URLs based on extraction type
    let filteredUrls = urls;
    
    switch (extractionType) {
      case 'pricing_plans':
        filteredUrls = urls.filter(url => 
          /pricing|plans?|cost|subscription|buy|purchase/i.test(url)
        );
        break;
        
      case 'customer_logos':
        filteredUrls = urls.filter(url => 
          /customer|client|testimonial|case.?stud|success|portfolio/i.test(url)
        );
        break;
        
      case 'company_info':
        filteredUrls = urls.filter(url => 
          /about|company|team|mission|vision|values|history|leadership/i.test(url)
        );
        break;
        
      case 'recent_posts':
        filteredUrls = urls.filter(url => 
          /blog|news|article|post|update|announcement/i.test(url)
        );
        break;
        
      case 'documentation':
        filteredUrls = urls.filter(url => 
          /doc|api|guide|tutorial|reference|developer|sdk/i.test(url)
        );
        break;
    }
    
    // If no specific URLs found, use general important pages
    if (filteredUrls.length === 0) {
      const importantPatterns = [
        /^\/?$/,  // Home page
        /about/i,
        /product|service|solution/i,
        /pricing/i,
        /contact/i,
        /feature/i,
      ];
      
      filteredUrls = urls.filter(url => 
        importantPatterns.some(pattern => pattern.test(url))
      );
    }
    
    // Limit to maxPages
    return filteredUrls.slice(0, maxPages);
  }
  
  private async fetchPage(url: string): Promise<{ html: string; status: number }> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 30000,
        maxRedirects: 5,
      });
      
      return {
        html: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, (error as any).message);
      throw error;
    }
  }

  private extractContent(html: string, extractionType: string): any {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    switch (extractionType) {
      case 'pricing_plans':
        return this.extractPricing($);
      
      case 'customer_logos':
        return this.extractCustomers($);
      
      case 'company_info':
        return this.extractCompanyInfo($);
      
      case 'recent_posts':
        return this.extractBlogPosts($);
      
      case 'documentation':
        return this.extractDocumentation($);
      
      case 'full_content':
      default:
        return this.extractFullContent($);
    }
  }

  private extractFullContent($: cheerio.CheerioAPI): any {
    const content = {
      title: $('title').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      headings: {
        h1: $('h1').map((_, el) => $(el).text().trim()).get(),
        h2: $('h2').map((_, el) => $(el).text().trim()).get(),
        h3: $('h3').map((_, el) => $(el).text().trim()).get(),
      },
      links: {
        internal: [] as string[],
        external: [] as string[],
      },
      images: $('img').map((_, el) => ({
        src: $(el).attr('src'),
        alt: $(el).attr('alt'),
      })).get(),
      mainContent: $('main, article, [role="main"], .content, #content')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000), // Limit content length
    };
    
    // Extract links
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          // Get the base URL or use the current page URL
          const baseHref = $('base').attr('href');
          const currentHostname = baseHref ? new URL(baseHref).hostname : '';
          
          if (href.startsWith('http') && (!currentHostname || !href.includes(currentHostname))) {
            content.links.external.push(href);
          } else if (!href.startsWith('#') && !href.startsWith('mailto:')) {
            content.links.internal.push(href);
          }
        } catch (urlError) {
          // If URL parsing fails, treat as internal link
          if (!href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('http')) {
            content.links.internal.push(href);
          }
        }
      }
    });
    
    return content;
  }

  private extractPricing($: cheerio.CheerioAPI): any {
    const pricing = {
      plans: [] as any[],
      currency: '',
      features: [] as string[],
    };
    
    // Look for common pricing patterns
    $('.pricing-card, .price-box, .plan, [class*="pricing"]').each((_, el) => {
      const $el = $(el);
      const plan = {
        name: $el.find('h2, h3, .plan-name, .title').first().text().trim(),
        price: $el.find('.price, .amount, [class*="price"]').first().text().trim(),
        features: $el.find('li, .feature').map((_, f) => $(f).text().trim()).get(),
      };
      if (plan.name || plan.price) {
        pricing.plans.push(plan);
      }
    });
    
    // Extract currency
    const priceText = $('.price, .amount').first().text();
    if (priceText.includes('$')) pricing.currency = 'USD';
    else if (priceText.includes('€')) pricing.currency = 'EUR';
    else if (priceText.includes('£')) pricing.currency = 'GBP';
    else if (priceText.includes('C$')) pricing.currency = 'CAD';
    
    return pricing;
  }

  private extractCustomers($: cheerio.CheerioAPI): any {
    return {
      logos: $('img[alt*="customer"], img[alt*="client"], img[src*="customer"], img[src*="client"]')
        .map((_, el) => ({
          src: $(el).attr('src'),
          alt: $(el).attr('alt'),
          title: $(el).attr('title'),
        }))
        .get(),
      testimonials: $('.testimonial, .review, [class*="testimonial"]').map((_, el) => ({
        text: $(el).text().trim(),
        author: $(el).find('.author, .name').text().trim(),
      })).get(),
      caseStudies: $('a[href*="case-study"], a[href*="success-story"]').map((_, el) => ({
        title: $(el).text().trim(),
        href: $(el).attr('href'),
      })).get(),
    };
  }

  private extractCompanyInfo($: cheerio.CheerioAPI): any {
    return {
      about: $('.about, #about, [class*="about-us"]').text().trim().substring(0, 2000),
      mission: $('[class*="mission"], .mission').text().trim(),
      vision: $('[class*="vision"], .vision').text().trim(),
      values: $('.values li, [class*="value"] li').map((_, el) => $(el).text().trim()).get(),
      teamSize: this.extractNumber($('body').text(), /(\d+)\s*(employees|team members|people)/i),
      founded: this.extractNumber($('body').text(), /(founded|established|since)\s*(\d{4})/i, 2),
      locations: $('.location, .office, address').map((_, el) => $(el).text().trim()).get(),
    };
  }

  private extractBlogPosts($: cheerio.CheerioAPI): any {
    return {
      posts: $('.blog-post, article, .post, [class*="article"]').slice(0, 10).map((_, el) => {
        const $el = $(el);
        return {
          title: $el.find('h2, h3, .title').first().text().trim(),
          excerpt: $el.find('.excerpt, .summary, p').first().text().trim().substring(0, 200),
          date: $el.find('.date, time, [class*="date"]').text().trim(),
          link: $el.find('a').first().attr('href'),
        };
      }).get(),
    };
  }

  private extractDocumentation($: cheerio.CheerioAPI): any {
    return {
      sections: $('.docs-section, .documentation section, nav a').map((_, el) => ({
        title: $(el).text().trim(),
        href: $(el).attr('href') || $(el).find('a').attr('href'),
      })).get(),
      apiEndpoints: $('code:contains("/api/"), code:contains("endpoint")').map((_, el) => 
        $(el).text().trim()
      ).get(),
      codeExamples: $('pre code, .code-block').slice(0, 5).map((_, el) => 
        $(el).text().trim().substring(0, 500)
      ).get(),
    };
  }

  private extractNumber(text: string, pattern: RegExp, group: number = 1): number | null {
    const match = text.match(pattern);
    if (match && match[group]) {
      const num = parseInt(match[group].replace(/\D/g, ''), 10);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  public async extract(url: string, options: Crawl4AIOptions = {}): Promise<Evidence[]> {
    console.log(`🕷️ DirectCrawl4AI extracting from ${url}`);
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // If sitemap is enabled, discover and crawl multiple pages
      if (options.useSitemap) {
        console.log(`📍 Fetching sitemap for ${domain}...`);
        const sitemapUrls = await this.fetchSitemap(domain);
        
        if (sitemapUrls.length > 0) {
          console.log(`✅ Found ${sitemapUrls.length} URLs in sitemap`);
          
          // Intelligently select URLs based on extraction type
          const selectedUrls = this.intelligentUrlSelection(sitemapUrls, options);
          console.log(`🎯 Selected ${selectedUrls.length} relevant URLs for ${options.extractionType || 'full_content'}`);
          
          // Extract from multiple pages
          const evidencePromises = selectedUrls.map(pageUrl => 
            this.extractSinglePage(pageUrl, options)
              .catch(err => {
                console.error(`Failed to extract ${pageUrl}:`, err);
                return null;
              })
          );
          
          const results = await Promise.all(evidencePromises);
          return results.filter(e => e !== null) as Evidence[];
        } else {
          console.log('⚠️ No sitemap found, falling back to single page extraction');
        }
      }
      
      // Single page extraction
      const evidence = await this.extractSinglePage(url, options);
      return evidence ? [evidence] : [];
      
    } catch (error) {
      console.error(`❌ Crawl4AI extraction failed for ${url}:`, (error as any).message);
      return [];
    }
  }
  
  private async extractSinglePage(url: string, options: Crawl4AIOptions): Promise<Evidence | null> {
    try {
      const { html, status } = await this.fetchPage(url);
      const content = this.extractContent(html, options.extractionType || 'full_content');
      
      const evidence: Evidence = {
        id: uuidv4(),
        researchQuestionId: 'crawl4ai-extraction',
        pillarId: 'technical',
        source: {
          type: 'web',
          name: 'Crawl4AI Direct Extraction',
          url,
          publishDate: new Date(),
          author: 'Crawl4AI',
          credibilityScore: 0.9,
        },
        content: JSON.stringify({
          url,
          status,
          extractionType: options.extractionType || 'full_content',
          data: content,
          extractedAt: new Date().toISOString(),
        }, null, 2),
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'DirectCrawl4AI',
          extractionType: options.extractionType,
          wordCount: JSON.stringify(content).length,
          language: 'en',
          keywords: [],
          confidence: 0.85,
        } as any,
        qualityScore: {
          overall: 0.85,
          components: {
            relevance: 0.9,
            credibility: 0.9,
            recency: 1.0,
            specificity: 0.8,
            bias: 0.1,
            depth: 0.8,
          },
          reasoning: 'Direct web extraction with structured parsing',
        },
        createdAt: new Date(),
      };
      
      return evidence;
    } catch (error) {
      console.error(`Failed to extract ${url}:`, (error as any).message);
      return null;
    }
  }

  public async extractMultiple(urls: { url: string; extractionType?: string }[]): Promise<Evidence[]> {
    const results = await Promise.all(
      urls.map(({ url, extractionType }) => 
        this.extract(url, { extractionType: extractionType as any })
          .catch(err => {
            console.error(`Failed to extract ${url}:`, err);
            return [];
          })
      )
    );
    
    return results.flat();
  }
}