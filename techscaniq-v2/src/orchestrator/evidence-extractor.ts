import { Evidence } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface PerplexityResponse {
  citations?: string[];
  search_results?: any[];
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class EvidenceExtractor {
  /**
   * Extract individual evidence pieces from a Perplexity response
   */
  static extractFromPerplexityResponse(
    response: string | PerplexityResponse,
    query: string,
    researchQuestionId: string
  ): Evidence[] {
    const evidence: Evidence[] = [];
    let data: PerplexityResponse;
    
    try {
      // Parse if string
      if (typeof response === 'string') {
        data = JSON.parse(response);
      } else {
        data = response;
      }
    } catch (error) {
      console.error('Failed to parse Perplexity response:', error);
      return evidence;
    }

    // Extract main content as evidence
    if (data.choices?.[0]?.message?.content) {
      evidence.push({
        id: uuidv4(),
        researchQuestionId,
        pillarId: 'research',
        source: {
          type: 'web',
          name: 'Perplexity Deep Research',
          url: `https://perplexity.ai/search?q=${encodeURIComponent(query)}`,
          publishDate: new Date(),
          author: 'Perplexity AI',
          credibilityScore: 0.9,
        },
        content: data.choices[0].message.content,
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'PerplexityDeepResearch',
          wordCount: data.choices[0].message.content.length,
          language: 'en',
          keywords: extractKeywords(query),
          confidence: 0.9,
        },
        qualityScore: {
          overall: 0.9,
          components: {
            relevance: 0.95,
            credibility: 0.9,
            recency: 1.0,
            specificity: 0.85,
            bias: 0.1,
            depth: 0.95,
          },
          reasoning: 'Deep research from Perplexity with comprehensive analysis',
        },
        createdAt: new Date(),
      });
    }

    // Extract each citation as individual evidence
    if (data.citations && Array.isArray(data.citations)) {
      data.citations.forEach((citation, index) => {
        const url = typeof citation === 'string' ? citation : citation.url || citation;
        if (!url || !url.startsWith('http')) return;

        try {
          const urlObj = new URL(url);
          evidence.push({
            id: uuidv4(),
            researchQuestionId,
            pillarId: 'citation',
            source: {
              type: 'web',
              name: urlObj.hostname,
              url: url,
              publishDate: new Date(),
              author: urlObj.hostname,
              credibilityScore: 0.8,
            },
            content: JSON.stringify({
              url,
              citationIndex: index + 1,
              query,
              title: `Citation from ${urlObj.hostname}`,
            }),
            metadata: {
              extractedAt: new Date(),
              extractionMethod: 'PerplexityCitation',
              wordCount: 100, // Estimated
              language: 'en',
              keywords: extractKeywords(query),
              confidence: 0.8,
            },
            qualityScore: {
              overall: 0.8,
              components: {
                relevance: 0.85,
                credibility: 0.8,
                recency: 0.9,
                specificity: 0.75,
                bias: 0.2,
                depth: 0.7,
              },
              reasoning: 'Citation from Perplexity search results',
            },
            createdAt: new Date(),
          });
        } catch (error) {
          console.error(`Invalid citation URL: ${url}`);
        }
      });
    }

    // Extract each search result as individual evidence
    if (data.search_results && Array.isArray(data.search_results)) {
      data.search_results.forEach((result, index) => {
        if (!result.url || !result.url.startsWith('http')) return;

        evidence.push({
          id: uuidv4(),
          researchQuestionId,
          pillarId: 'search-result',
          source: {
            type: 'web',
            name: result.title || new URL(result.url).hostname,
            url: result.url,
            publishDate: result.date ? new Date(result.date) : new Date(),
            author: new URL(result.url).hostname,
            credibilityScore: 0.75,
          },
          content: JSON.stringify({
            title: result.title,
            url: result.url,
            snippet: result.snippet || result.description || '',
            searchRank: index + 1,
            query,
          }),
          metadata: {
            extractedAt: new Date(),
            extractionMethod: 'PerplexitySearchResult',
            wordCount: (result.snippet || '').length,
            language: 'en',
            keywords: extractKeywords(query),
            confidence: 0.75,
          },
          qualityScore: {
            overall: 0.75,
            components: {
              relevance: 0.8 - (index * 0.01), // Decay by rank
              credibility: 0.75,
              recency: 0.8,
              specificity: 0.7,
              bias: 0.2,
              depth: 0.65,
            },
            reasoning: `Search result rank ${index + 1} from Perplexity`,
          },
          createdAt: new Date(),
        });
      });
    }

    return evidence;
  }

  /**
   * Extract evidence from crawled web pages
   */
  static extractFromCrawledPages(
    pages: any[],
    baseUrl: string,
    researchQuestionId: string
  ): Evidence[] {
    return pages.map((page, index) => ({
      id: uuidv4(),
      researchQuestionId,
      pillarId: 'webpage',
      source: {
        type: 'web',
        name: page.title || `Page from ${new URL(baseUrl).hostname}`,
        url: page.url || baseUrl,
        publishDate: new Date(),
        author: new URL(baseUrl).hostname,
        credibilityScore: 0.85,
      },
      content: JSON.stringify({
        title: page.title,
        url: page.url,
        content: page.content || page.text,
        metadata: page.metadata,
        headings: page.headings,
        links: page.links,
      }),
      metadata: {
        extractedAt: new Date(),
        extractionMethod: 'WebCrawler',
        wordCount: (page.content || page.text || '').length,
        language: 'en',
        keywords: page.keywords || [],
        confidence: 0.85,
      },
      qualityScore: {
        overall: 0.85,
        components: {
          relevance: 0.9,
          credibility: 0.85,
          recency: 1.0,
          specificity: 0.8,
          bias: 0.15,
          depth: 0.85,
        },
        reasoning: 'Direct crawl of company website',
      },
      createdAt: new Date(),
    }));
  }
}

function extractKeywords(query: string): string[] {
  // Simple keyword extraction from query
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(word));
}