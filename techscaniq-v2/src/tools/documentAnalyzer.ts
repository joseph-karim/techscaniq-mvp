import axios from 'axios';
import * as cheerio from 'cheerio';
import { PlaywrightCrawler } from 'crawlee';
import pdfParse from '../utils/pdf-parse';
import { ChatOpenAI } from '@langchain/openai';
import { config, models } from '../config';
import * as fs from 'fs-extra';

export interface ExtractedContent {
  url: string;
  title: string;
  text: string;
  author?: string;  // Add for backwards compatibility
  keywords?: string[];  // Add for backwards compatibility  
  metadata?: {
    author?: string;
    publishDate?: string;
    keywords?: string[];
    description?: string;
  };
}

export class DocumentAnalyzer {
  private llm: ChatOpenAI;
  private crawler: PlaywrightCrawler;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI_API_KEY,
      modelName: models.openai.gpt4oMini,
      temperature: 0.2,
    });

    this.crawler = new PlaywrightCrawler({
      launchContext: {
        launchOptions: {
          headless: true,
        },
      },
      maxRequestsPerCrawl: 10,
      requestHandlerTimeoutSecs: 30,
    });
  }

  async extractWebContent(url: string): Promise<ExtractedContent | null> {
    try {
      // Check if it's a PDF
      if (url.toLowerCase().endsWith('.pdf')) {
        return await this.extractPdfContent(url);
      }

      // Try simple HTTP fetch first (faster)
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TechScanIQ/2.0)',
          },
          timeout: 15000,
          maxContentLength: 5 * 1024 * 1024, // 5MB limit
        });

        if (response.headers['content-type']?.includes('application/pdf')) {
          return await this.extractPdfContent(url);
        }

        return this.parseHtmlContent(response.data, url);
      } catch (error) {
        // If simple fetch fails, try with Playwright for JS-heavy sites
        console.log(`Simple fetch failed for ${url}, trying Playwright...`);
        return await this.extractWithPlaywright(url);
      }
    } catch (error) {
      console.error(`Failed to extract content from ${url}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private parseHtmlContent(html: string, url: string): ExtractedContent {
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, noscript').remove();

    // Extract metadata
    const title = $('title').text() || $('h1').first().text() || '';
    const author = $('meta[name="author"]').attr('content') || 
                   $('meta[property="article:author"]').attr('content') || '';
    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                        $('time').attr('datetime') || '';
    const description = $('meta[name="description"]').attr('content') || '';
    const keywordsStr = $('meta[name="keywords"]').attr('content') || '';
    const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [];

    // Extract main content
    let mainContent = '';
    
    // Try common content selectors
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '#content',
      '.post',
      '.entry-content',
      '.article-body'
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > mainContent.length) {
        mainContent = content;
      }
    }

    // Fallback to body if no main content found
    if (!mainContent) {
      mainContent = $('body').text();
    }

    // Clean up whitespace
    mainContent = mainContent.replace(/\s+/g, ' ').trim();

    return {
      url,
      title,
      text: mainContent,
      metadata: {
        author,
        publishDate,
        keywords,
        description,
      },
    };
  }

  private async extractWithPlaywright(url: string): Promise<ExtractedContent | null> {
    return new Promise((resolve, reject) => {
      let extractedContent: ExtractedContent | null = null;

      this.crawler.router.addDefaultHandler(async ({ page, request }) => {
        try {
          // Wait for content to load
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});

          // Extract content from page
          const content = await page.evaluate(() => {
            // Remove scripts and styles
            const scripts = document.querySelectorAll('script, style, noscript');
            scripts.forEach(s => s.remove());

            // Get title
            const title = document.title || document.querySelector('h1')?.textContent || '';

            // Try to find main content
            const article = document.querySelector('article, main, [role="main"]');
            const mainContent = article?.textContent || document.body.textContent || '';

            // Get metadata
            const getMetaContent = (name: string): string => {
              const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
              return meta?.content || '';
            };

            return {
              title,
              mainContent: mainContent.trim(),
              author: getMetaContent('author') || getMetaContent('article:author'),
              publishDate: getMetaContent('article:published_time') || (document.querySelector('time') as HTMLTimeElement)?.dateTime || '',
              keywords: getMetaContent('keywords').split(',').filter(k => k.trim()),
              description: getMetaContent('description'),
            };
          });

          extractedContent = {
            url: request.url,
            title: content.title,
            text: content.mainContent,
            metadata: {
              author: content.author,
              publishDate: content.publishDate,
              keywords: content.keywords,
              description: content.description,
            },
          };
        } catch (error) {
          console.error('Error in Playwright extraction:', error);
        }
      });

      // Run the crawler
      this.crawler.run([url])
        .then(() => {
          resolve(extractedContent);
        })
        .catch((error) => {
          console.error('Crawler run failed:', error);
          resolve(null);
        });
    });
  }

  private async extractPdfContent(url: string): Promise<ExtractedContent | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 10 * 1024 * 1024, // 10MB limit for PDFs
      });

      const data = await pdfParse(Buffer.from(response.data));

      return {
        url,
        title: data.info?.Title || 'PDF Document',
        text: data.text,
        metadata: {
          author: data.info?.Author,
          keywords: data.info?.Keywords ? data.info.Keywords.split(',').map((k: string) => k.trim()) : [],
        },
      };
    } catch (error) {
      console.error(`Failed to extract PDF content from ${url}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async summarizeContent(content: ExtractedContent, focusAreas?: string[]): Promise<string> {
    const prompt = `
Summarize the following content focusing on investment-relevant information.
${focusAreas ? `Pay special attention to: ${focusAreas.join(', ')}` : ''}

Title: ${content.title}
URL: ${content.url}
Content: ${content.text.substring(0, 3000)}...

Provide a concise summary (max 500 words) highlighting:
1. Key business metrics and data points
2. Product/technology insights
3. Market position and competition
4. Growth indicators
5. Risks or concerns
`;

    try {
      const response = await this.llm.invoke(prompt);
      return response.content.toString();
    } catch (error) {
      console.error('Failed to summarize content:', error instanceof Error ? error.message : String(error));
      return content.text.substring(0, 500) + '...';
    }
  }

  private getMockContent(url: string): ExtractedContent {
    // Generate realistic mock content based on URL patterns
    const mockContents: Record<string, ExtractedContent> = {
      'techcrunch.com': {
        url,
        title: 'Pendo raises $150M Series F at $2.5B valuation to expand product analytics platform',
        text: `
          Pendo, the Raleigh-based product analytics and digital adoption platform, today announced a $150 million Series F funding round led by Thoma Bravo, valuing the company at $2.5 billion. This represents a significant milestone for the 10-year-old company, which has now raised over $356 million in total funding.
          
          The company's platform helps product teams understand how users interact with their applications, providing insights into feature adoption, user journeys, and engagement metrics. Pendo serves over 3,000 customers globally, including Salesforce, Cisco, and Morgan Stanley.
          
          "This investment validates our vision of helping companies create products that customers love," said Todd Olson, CEO and co-founder of Pendo. "We've seen tremendous growth, with revenue increasing 45% year-over-year and our customer base expanding by 60%."
          
          The funding will be used to accelerate product development, particularly in AI-powered analytics and predictive insights. Pendo plans to double its R&D team over the next 18 months and expand its international presence, with new offices planned in London and Singapore.
          
          The product analytics market is expected to reach $16.2 billion by 2025, growing at a CAGR of 13.6%. Pendo faces competition from players like Amplitude, Mixpanel, and FullStory, but has differentiated itself through its integrated approach combining analytics with in-app guidance and feedback collection.
          
          "Pendo has built a comprehensive platform that goes beyond traditional analytics," said Seth Boro, Managing Partner at Thoma Bravo. "Their ability to help companies not just understand but actively improve user experiences positions them well for continued growth."
        `,
        author: 'Sarah Johnson',
        keywords: ['pendo', 'funding', 'series f', 'product analytics', 'thoma bravo'],
        metadata: {
          author: 'Sarah Johnson',
          publishDate: '2023-06-15',
          keywords: ['pendo', 'funding', 'series f', 'product analytics', 'thoma bravo'],
          description: 'Pendo raises $150M Series F funding led by Thoma Bravo at $2.5B valuation',
        },
      },
      'g2.com': {
        url,
        title: 'Pendo Reviews 2024: Details, Pricing, & Features | G2',
        text: `
          Pendo has an overall rating of 4.4 out of 5 stars based on 890 reviews on G2. Users consistently praise its ease of use, comprehensive analytics capabilities, and excellent customer support.
          
          Key Strengths:
          - User-friendly interface that requires no coding knowledge
          - Powerful segmentation and cohort analysis features
          - In-app guides and walkthroughs are highly effective
          - Integration with major tools like Salesforce, Slack, and Jira
          - Real-time data and insights
          
          Common Criticisms:
          - Pricing can be expensive for smaller companies
          - Initial setup and configuration can be complex
          - Limited customization options for reports
          - Mobile analytics capabilities need improvement
          
          Pricing: Pendo uses custom pricing based on monthly active users (MAUs). Based on user reports:
          - Starter plans begin around $20,000/year for up to 20,000 MAUs
          - Growth plans range from $50,000-100,000/year
          - Enterprise plans can exceed $150,000/year
          
          Users report ROI within 6-12 months, with improvements in feature adoption rates of 30-40% on average. The platform is particularly popular among B2B SaaS companies with complex products.
          
          "Pendo transformed how we understand our users. We reduced churn by 25% in the first year," reports a Product Manager at a Fortune 500 technology company.
        `,
        metadata: {
          publishDate: '2024-02-01',
          keywords: ['pendo', 'reviews', 'pricing', 'features', 'user feedback'],
        },
      },
      'venturebeat.com': {
        url,
        title: 'How Pendo is using AI to revolutionize product analytics',
        text: `
          Pendo today unveiled its AI-powered analytics suite, marking a significant evolution in how companies can understand and act on user behavior data. The new features, built on advanced machine learning models, automatically surface insights that would typically require hours of manual analysis.
          
          Key AI Features:
          - Automatic anomaly detection that identifies unusual user behavior patterns
          - Predictive churn analysis with 85% accuracy
          - Natural language querying for non-technical users
          - Automated insight generation and recommendation engine
          
          Early beta customers report significant improvements in their analytics workflows. "What used to take our team days now happens in minutes," said Jennifer Chen, VP of Product at DocuSign. "The AI surfaces insights we would have never found manually."
          
          The AI capabilities are powered by Pendo's proprietary models trained on anonymized data from billions of user interactions across its platform. The company invested over $30 million in AI research over the past two years.
          
          This positions Pendo ahead of competitors in the race to apply AI to product analytics. While Amplitude and Mixpanel have announced AI roadmaps, Pendo is first to market with production-ready features.
          
          The AI features will be available to enterprise customers starting at an additional $25,000/year, with plans to expand to all tiers by Q2 2024.
        `,
        metadata: {
          author: 'Michael Torres',
          publishDate: '2023-11-20',
          keywords: ['pendo', 'ai', 'product analytics', 'machine learning'],
        },
      },
    };

    // Find the best match based on URL
    for (const [domain, content] of Object.entries(mockContents)) {
      if (url.includes(domain)) {
        return { ...content, url };
      }
    }

    // Default mock content if no match found
    return {
      url,
      title: 'Product Analytics and Digital Adoption Platform | Pendo.io',
      text: `
        Pendo is a product analytics platform that helps teams understand user behavior, gather feedback, and guide users to success. The platform combines analytics, in-app messaging, feedback collection, and roadmapping in a single solution.
        
        Key features include retroactive analytics without code, user segmentation, feature tagging, NPS surveys, in-app guides, and product roadmapping. Pendo serves over 3,000 customers across various industries.
        
        The company has raised over $356 million in funding and is valued at $2.5 billion. Pendo competes with Amplitude, Mixpanel, FullStory, and other product analytics providers.
      `,
      metadata: {
        keywords: ['product analytics', 'user behavior', 'pendo'],
      },
    };
  }
}