import axios from 'axios';
import { config } from '../config';
import { GoogleGenerativeAI, DynamicRetrievalMode } from '@google/generative-ai';

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
  returnFullResponse?: boolean;
}

export class WebSearchTool {
  private tavilyApiKey?: string;
  private serperApiKey?: string;
  private bingApiKey?: string;
  private perplexityApiKey?: string;
  private genAI: GoogleGenerativeAI;
  private lastGeminiCall: number = 0;
  private geminiMinDelay: number = 2000; // 2 seconds between calls

  constructor() {
    // Use environment variables for API keys
    this.tavilyApiKey = process.env.TAVILY_API_KEY;
    this.serperApiKey = process.env.SERPER_API_KEY;
    this.bingApiKey = process.env.BING_SEARCH_API_KEY;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.genAI = new GoogleGenerativeAI(config.GOOGLE_AI_API_KEY);
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { maxResults = 10 } = options;
    
    console.log(`🔍 Searching for: "${query}"`);
    
    // Try different search providers in order of preference
    try {
      // First try Perplexity Sonar Pro if available
      if (this.perplexityApiKey) {
        console.log('Using Perplexity Sonar Pro');
        return await this.searchWithPerplexity(query, options);
      }
      
      // Then try Gemini with Google Search grounding
      console.log('Using Gemini with Google Search grounding');
      return await this.searchWithGemini(query, options);
    } catch (error) {
      console.error('Primary search failed:', error);
      
      // Don't fall back to mock results - propagate the error
      throw error;
    }
  }

  async searchNews(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    // Modify query for news-specific search
    const newsQuery = `${query} news OR announcement OR "press release"`;
    const results = await this.search(newsQuery, {
      ...options,
      dateRange: options.dateRange || 'past_year',
    });
    
    // Filter for news sources - handle cases where url might be missing
    return results.filter(r => {
      if (!r || !r.url || typeof r.url !== 'string') {
        console.warn('Invalid search result:', r);
        return false;
      }
      return r.url.match(/news|press|announcement|reuters|bloomberg|techcrunch|venturebeat/i) !== null;
    });
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

  private async searchWithGemini(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      // Rate limiting to avoid quota errors
      const now = Date.now();
      const timeSinceLastCall = now - this.lastGeminiCall;
      if (timeSinceLastCall < this.geminiMinDelay) {
        await new Promise(resolve => setTimeout(resolve, this.geminiMinDelay - timeSinceLastCall));
      }
      this.lastGeminiCall = Date.now();
      // Use Gemini 1.5 Flash for faster, cheaper search with grounding
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: DynamicRetrievalMode.MODE_DYNAMIC,
              dynamicThreshold: 0.3,
            }
          }
        }],
      });

      // Create a prompt that asks for search results
      const prompt = `Search the web for: "${query}". 
      Return the top ${options.maxResults || 10} most relevant results.
      For each result, provide:
      - Title
      - URL
      - A brief snippet/summary
      - Publication date if available
      - Relevance score (0.0 to 1.0)
      
      Format the response as a JSON array of objects.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the response to extract search results
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          return results.map((r: any) => ({
            title: r.title || '',
            url: r.url || r.URL || '',
            snippet: r.snippet || r.summary || '',
            publishedDate: r.date ? new Date(r.date) : undefined,
            relevanceScore: r.relevance || r.relevanceScore || 0.8,
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
      }

      // If JSON parsing fails, extract results from grounding metadata
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        return groundingMetadata.groundingChunks.map((chunk: any, index: number) => ({
          title: chunk.web?.title || `Result ${index + 1}`,
          url: chunk.web?.uri || '',
          snippet: chunk.web?.snippet || '',
          publishedDate: undefined,
          relevanceScore: 1.0 - (index * 0.05), // Decreasing relevance by position
        }));
      }

      // If no grounding chunks, parse the text response
      const lines = text.split('\n').filter(line => line.trim());
      const results: SearchResult[] = [];
      
      for (let i = 0; i < lines.length && results.length < (options.maxResults || 10); i++) {
        const line = lines[i];
        // Look for URLs in the response
        const urlMatch = line.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          results.push({
            title: lines[i - 1] || 'Search Result',
            url: urlMatch[0],
            snippet: lines[i + 1] || '',
            relevanceScore: 0.8 - (results.length * 0.05),
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Gemini search error:', error);
      throw error;
    }
  }

  private getMockResults(query: string, options: SearchOptions): SearchResult[] {
    // Generate mock results based on the query for testing
    const mockSources = [
      {
        domain: 'techcrunch.com',
        template: (q: string) => ({
          title: `Pendo raises $150M Series F at $2.5B valuation to expand product analytics platform`,
          url: `https://techcrunch.com/2023/pendo-funding-series-f`,
          snippet: `Pendo, the product analytics and digital adoption platform, announced a $150 million Series F funding round led by Thoma Bravo. The company plans to use the funding to accelerate product development and expand globally.`,
          publishedDate: new Date('2023-06-15'),
          relevanceScore: 0.95,
        }),
      },
      {
        domain: 'pendo.io',
        template: (q: string) => ({
          title: `Pendo Product Analytics - Understand User Behavior at Scale`,
          url: `https://www.pendo.io/product/analytics/`,
          snippet: `Pendo's product analytics helps teams understand how users interact with their applications. Track feature adoption, user paths, and engagement metrics without writing code.`,
          publishedDate: new Date('2024-01-10'),
          relevanceScore: 0.9,
        }),
      },
      {
        domain: 'g2.com',
        template: (q: string) => ({
          title: `Pendo Reviews 2024: Details, Pricing, & Features | G2`,
          url: `https://www.g2.com/products/pendo/reviews`,
          snippet: `Pendo has 4.4 stars from 890 reviews. Users praise its ease of use and comprehensive analytics. "Pendo transformed how we understand our users" - Product Manager at Fortune 500.`,
          publishedDate: new Date('2024-02-01'),
          relevanceScore: 0.88,
        }),
      },
      {
        domain: 'venturebeat.com',
        template: (q: string) => ({
          title: `How Pendo is using AI to revolutionize product analytics`,
          url: `https://venturebeat.com/ai/pendo-ai-product-analytics/`,
          snippet: `Pendo launches AI-powered insights that automatically surface user behavior patterns and recommend product improvements. Early customers report 40% faster time to insights.`,
          publishedDate: new Date('2023-11-20'),
          relevanceScore: 0.85,
        }),
      },
      {
        domain: 'bloomberg.com',
        template: (q: string) => ({
          title: `Thoma Bravo's Pendo Investment Signals Continued SaaS Consolidation`,
          url: `https://www.bloomberg.com/news/articles/pendo-thoma-bravo`,
          snippet: `Private equity firm Thoma Bravo's investment in Pendo at a $2.5B valuation highlights the continued consolidation in the SaaS analytics space. The firm sees opportunity in...`,
          publishedDate: new Date('2023-06-16'),
          relevanceScore: 0.82,
        }),
      },
    ];

    // Generate varied results based on query keywords
    const results: SearchResult[] = [];
    const numResults = Math.min(options.maxResults || 10, mockSources.length);
    
    for (let i = 0; i < numResults; i++) {
      const source = mockSources[i % mockSources.length];
      results.push(source.template(query));
    }

    return results;
  }

  private async searchWithPerplexity(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Perplexity API Request:
        Query: ${query}
        Model: sonar-deep-research
        API Key: ${this.perplexityApiKey?.substring(0, 10)}...`);
      
      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-deep-research',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful research assistant. Search the web and return relevant results with citations.'
          },
          {
            role: 'user',
            content: `Search for: ${query}\n\nReturn the top ${options.maxResults || 10} most relevant web results. For each result, provide the title, URL, and a brief summary.`
          }
        ],
        temperature: 0,
        search_domain_filter: [],
        return_images: false,
        search_recency_filter: 'month',
      }, {
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 1800000, // 30 minute timeout for deep research
      });

      const content = response.data.choices[0].message.content;
      const citations = response.data.citations || [];
      const searchResults = response.data.search_results || [];
      
      console.log(`📖 Perplexity Response:
        Has citations: ${citations.length > 0}
        Citations count: ${citations.length}
        Has search_results: ${searchResults.length > 0}
        Search results count: ${searchResults.length}
        Response keys: ${Object.keys(response.data).join(', ')}
        Content length: ${content?.length || 0}`);
      
      // Debug: Log first search result structure
      if (searchResults.length > 0) {
        console.log('First search result structure:', JSON.stringify(searchResults[0], null, 2));
      }
      
      // Extract search results from the search_results field
      let results: SearchResult[] = [];
      
      if (searchResults && searchResults.length > 0) {
        results = searchResults.slice(0, options.maxResults || 10).map((result: any, index: number) => {
          // Handle different possible field names for the snippet/description
          const snippet = result.snippet || result.description || result.content || '';
          
          return {
            title: result.title || `Result ${index + 1}`,
            url: result.url || '',
            snippet: snippet,
            publishedDate: result.date ? new Date(result.date) : undefined,
            relevanceScore: 1.0 - (index * 0.05),
          };
        });
      }
      
      // If no search_results but we have citations, try to use those
      if (results.length === 0 && citations && citations.length > 0) {
        results = citations.slice(0, options.maxResults || 10).map((citation: any, index: number) => {
          // Citations might be just URLs or objects with url property
          const url = typeof citation === 'string' ? citation : citation.url || citation;
          const hostname = url ? new URL(url).hostname : '';
          
          return {
            title: `Source from ${hostname}`,
            url: url,
            snippet: '', // Citations typically don't include snippets
            relevanceScore: 0.9 - (index * 0.05),
          };
        });
      }
      
      // As a last resort, try to parse URLs from content
      if (results.length === 0 && content) {
        const urlRegex = /https?:\/\/[^\s\]]+/g;
        const urls = content.match(urlRegex) || [];
        const uniqueUrls = [...new Set(urls)]; // Remove duplicates
        
        results = uniqueUrls.slice(0, options.maxResults || 10).map((url, index) => ({
          title: `Source from ${new URL(url as string).hostname}`,
          url: url as string,
          snippet: '',
          relevanceScore: 0.8 - (index * 0.05),
        }));
      }
      
      // Ensure all results have valid URLs
      results = results.filter(r => r && r.url && typeof r.url === 'string' && r.url.startsWith('http'));
      
      console.log(`✅ Extracted ${results.length} search results from Perplexity`);
      
      // If returnFullResponse is true, return the entire response for evidence extraction
      if (options.returnFullResponse) {
        return response.data as any;
      }
      
      return results;
    } catch (error) {
      console.error('Perplexity search error:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Failed query:', query);
        
        // For 400 errors, try a simplified query
        if (error.response.status === 400) {
          console.log('🔄 Retrying with simplified query...');
          // Remove problematic operators like site:, filetype:, etc
          const simplifiedQuery = query
            .replace(/site:\S+\s*/g, '')
            .replace(/filetype:\S+\s*/g, '')
            .replace(/intitle:\S+\s*/g, '')
            .trim();
          
          if (simplifiedQuery !== query && simplifiedQuery.length > 0) {
            return this.searchWithPerplexity(simplifiedQuery, options);
          }
        }
      }
      // Propagate the error instead of falling back to mock results
      throw new Error(`Perplexity API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}