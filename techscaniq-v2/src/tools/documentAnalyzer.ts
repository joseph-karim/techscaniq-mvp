import axios from 'axios';
import * as cheerio from 'cheerio';
import { PlaywrightCrawler } from 'crawlee';
const pdfParse = require('pdf-parse');
import { ChatOpenAI } from '@langchain/openai';
import { config, models } from '../config';

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
          await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

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
}