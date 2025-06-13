import axios from 'axios';
import { config } from '../config';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: Date;
  relevanceScore?: number;
}

interface SearchOptions {
  maxResults?: number;
  dateRange?: string;
  language?: string;
}

export class WebSearchTool {
  private tavilyApiKey?: string;
  private serperApiKey?: string;
  private bingApiKey?: string;

  constructor() {
    // Use environment variables for API keys
    this.tavilyApiKey = process.env.TAVILY_API_KEY;
    this.serperApiKey = process.env.SERPER_API_KEY;
    this.bingApiKey = process.env.BING_SEARCH_API_KEY;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 10 } = options;
    
    // Try different search providers in order of preference
    try {
      if (this.tavilyApiKey) {
        return await this.searchWithTavily(query, options);
      } else if (this.serperApiKey) {
        return await this.searchWithSerper(query, options);
      } else {
        // Fallback to a basic web scraping approach
        return await this.searchWithDuckDuckGo(query, options);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to DuckDuckGo if other providers fail
      return await this.searchWithDuckDuckGo(query, options);
    }
  }

  async searchNews(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Modify query for news-specific search
    const newsQuery = `${query} news OR announcement OR "press release"`;
    const results = await this.search(newsQuery, {
      ...options,
      dateRange: options.dateRange || 'past_year',
    });
    
    // Filter for news sources
    return results.filter(r => 
      r.url.match(/news|press|announcement|reuters|bloomberg|techcrunch|venturebeat/i)
    );
  }

  async searchAcademic(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Search for academic papers and research
    const academicQuery = `${query} site:arxiv.org OR site:scholar.google.com OR site:ssrn.com OR filetype:pdf research paper`;
    return await this.search(academicQuery, options);
  }

  private async searchWithTavily(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.tavilyApiKey,
        query: query,
        max_results: options.maxResults || 10,
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      });

      return response.data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        publishedDate: result.published_date ? new Date(result.published_date) : undefined,
        relevanceScore: result.score,
      }));
    } catch (error) {
      console.error('Tavily search error:', error);
      throw error;
    }
  }

  private async searchWithSerper(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      const response = await axios.post('https://google.serper.dev/search', {
        q: query,
        num: options.maxResults || 10,
      }, {
        headers: {
          'X-API-KEY': this.serperApiKey,
          'Content-Type': 'application/json',
        },
      });

      return response.data.organic.map((result: any) => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        publishedDate: result.date ? new Date(result.date) : undefined,
        relevanceScore: result.position ? 1 - (result.position / 100) : 0.5,
      }));
    } catch (error) {
      console.error('Serper search error:', error);
      throw error;
    }
  }

  private async searchWithDuckDuckGo(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      // Use DuckDuckGo's HTML version (no API key required)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TechScanIQ/2.0)',
        },
      });

      // Basic HTML parsing to extract results
      const results: SearchResult[] = [];
      const resultRegex = /<a\s+class="result__a"\s+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a\s+class="result__snippet"[^>]*>([^<]+)</g;
      
      let match;
      while ((match = resultRegex.exec(response.data)) !== null && results.length < (options.maxResults || 10)) {
        results.push({
          title: this.decodeHtml(match[2]),
          url: match[1],
          snippet: this.decodeHtml(match[3]),
          relevanceScore: 0.7 - (results.length * 0.05), // Decreasing relevance by position
        });
      }

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private decodeHtml(html: string): string {
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, ''); // Remove HTML tags
  }
}