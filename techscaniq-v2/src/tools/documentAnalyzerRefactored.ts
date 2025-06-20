import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from '../utils/pdf-parse';
import { ChatOpenAI } from '@langchain/openai';
import { config, models } from '../config';
import { DirectCrawl4AI } from './directCrawl4AI';

export interface ExtractedContent {
  url: string;
  title: string;
  text: string;
  author?: string;
  keywords?: string[];
  metadata?: {
    author?: string;
    publishDate?: string;
    keywords?: string[];
    description?: string;
  };
}

export class DocumentAnalyzer {
  private llm: ChatOpenAI;
  private crawl4ai: DirectCrawl4AI;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI_API_KEY,
      modelName: models.openai.gpt4oMini,
      temperature: 0.2,
    });

    // Use Crawl4AI instead of Crawlee
    this.crawl4ai = new DirectCrawl4AI();
  }

  async extractWebContent(url: string): Promise<ExtractedContent | null> {
    try {
      // Check if it's a PDF
      if (url.toLowerCase().endsWith('.pdf')) {
        return await this.extractPdfContent(url);
      }

      // Use Crawl4AI for web content extraction
      const evidence = await this.crawl4ai.extract(url, {
        extractionType: 'full_content',
        useSitemap: false, // Single page extraction
        maxPages: 1,
      });

      if (evidence.length === 0) {
        return null;
      }

      // Parse the Crawl4AI response
      const crawledData = JSON.parse(evidence[0].content);
      
      // Extract metadata from the crawled content
      const metadata = crawledData.data?.[0] || {};
      
      return {
        url,
        title: metadata.title || crawledData.url || 'Untitled',
        text: metadata.content || metadata.text || '',
        author: metadata.author,
        keywords: metadata.keywords || [],
        metadata: {
          author: metadata.author,
          publishDate: metadata.publishDate || metadata.date,
          keywords: metadata.keywords || [],
          description: metadata.description || metadata.summary,
        },
      };
    } catch (error) {
      console.error('Error extracting web content:', error);
      
      // Fallback to simple HTTP request with cheerio
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 30000,
        });

        const $ = cheerio.load(response.data);
        
        // Remove scripts and styles
        $('script, style').remove();
        
        // Extract text content
        const title = $('title').text() || $('h1').first().text() || 'Untitled';
        const text = $('body').text()
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 50000); // Limit to 50k chars

        // Extract metadata
        const author = $('meta[name="author"]').attr('content');
        const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim());
        const description = $('meta[name="description"]').attr('content');
        const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                          $('time').attr('datetime');

        return {
          url,
          title,
          text,
          author,
          keywords,
          metadata: {
            author,
            publishDate,
            keywords,
            description,
          },
        };
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
        return null;
      }
    }
  }

  async extractPdfContent(url: string): Promise<ExtractedContent | null> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);
      const data = await pdfParse(buffer);

      return {
        url,
        title: data.info?.Title || 'PDF Document',
        text: data.text.slice(0, 50000), // Limit to 50k chars
        author: data.info?.Author,
        keywords: data.info?.Keywords?.split(',').map((k: string) => k.trim()),
        metadata: {
          author: data.info?.Author,
          publishDate: data.info?.CreationDate,
          keywords: data.info?.Keywords?.split(',').map((k: string) => k.trim()),
          description: data.info?.Subject,
        },
      };
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      return null;
    }
  }

  async summarizeContent(content: ExtractedContent): Promise<string> {
    try {
      const prompt = `Summarize the following content in 2-3 paragraphs, focusing on key points and main ideas:

Title: ${content.title}
${content.metadata?.author ? `Author: ${content.metadata.author}` : ''}
${content.metadata?.publishDate ? `Published: ${content.metadata.publishDate}` : ''}

Content: ${content.text.slice(0, 4000)}...

Provide a concise summary that captures the essence of the document.`;

      const response = await this.llm.invoke(prompt);
      return response.content.toString();
    } catch (error) {
      console.error('Error summarizing content:', error);
      return 'Summary generation failed.';
    }
  }
}