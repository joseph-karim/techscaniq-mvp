import { ResearchState, Evidence, EvidenceSource } from '../../types';
import { queues, JobPriority } from '../../services/queue/index';
import { config } from '../../config';
import { WebSearchTool } from '../../tools/webSearch';
import { DocumentAnalyzer } from '../../tools/documentAnalyzer';
import { EvidenceCollectorIntegration } from '../../tools/evidenceCollectorIntegration';
import { v4 as uuidv4 } from 'uuid';

export async function gatherEvidenceNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📊 Gathering evidence...');
  
  try {
    const { thesis, metadata } = state;
    const queries = metadata?.currentQueries || {};
    
    if (Object.keys(queries).length === 0) {
      console.log('No queries to process');
      return {};
    }

    const allEvidence: Evidence[] = [];
    const searchTool = new WebSearchTool();
    const docAnalyzer = new DocumentAnalyzer();

    // Process queries in parallel batches
    for (const [pillarId, pillarQueries] of Object.entries(queries)) {
      console.log(`Processing ${pillarQueries.length} queries for pillar: ${pillarId}`);
      
      // Batch process queries with concurrency limit
      const batchSize = config.MAX_CONCURRENT_SEARCHES;
      const results = [];
      
      for (let i = 0; i < pillarQueries.length; i += batchSize) {
        const batch = pillarQueries.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (queryObj: any) => {
            try {
              // Execute search based on type
              let searchResults;
              
              switch (queryObj.type) {
                case 'web':
                  searchResults = await searchTool.search(queryObj.query, {
                    maxResults: 10,
                    dateRange: queryObj.filters?.dateRange,
                  });
                  break;
                case 'news':
                  searchResults = await searchTool.searchNews(queryObj.query, {
                    maxResults: 10,
                    dateRange: queryObj.filters?.dateRange || 'past_year',
                  });
                  break;
                case 'academic':
                  searchResults = await searchTool.searchAcademic(queryObj.query, {
                    maxResults: 5,
                  });
                  break;
                default:
                  searchResults = await searchTool.search(queryObj.query, {
                    maxResults: 10,
                  });
              }
              
              // Process each search result
              for (const result of searchResults) {
                try {
                  // Extract content from the URL
                  const extractedContent = await docAnalyzer.extractWebContent(result.url);
                  
                  if (extractedContent && extractedContent.text.length > 100) {
                    // Create evidence entry
                    const evidence: Evidence = {
                      id: uuidv4(),
                      researchQuestionId: '', // Will be mapped later
                      pillarId: pillarId,
                      source: {
                        type: 'web',
                        name: result.title,
                        url: result.url,
                        credibilityScore: calculateCredibilityScore(result.url),
                        publishDate: result.publishedDate,
                        author: extractedContent.author,
                      },
                      content: extractedContent.text,
                      metadata: {
                        extractedAt: new Date(),
                        extractionMethod: 'web_scraper',
                        wordCount: extractedContent.text.split(/\s+/).length,
                        language: 'en',
                        keywords: extractedContent.keywords || [],
                        sentiment: undefined, // Will be analyzed later
                        confidence: result.relevanceScore || 0.7,
                      },
                      qualityScore: {
                        overall: 0, // Will be calculated in evaluation node
                        components: {
                          relevance: 0,
                          credibility: 0,
                          recency: 0,
                          specificity: 0,
                          bias: 0,
                        },
                        reasoning: '',
                      },
                      createdAt: new Date(),
                    };
                    
                    allEvidence.push(evidence);
                  }
                } catch (extractError) {
                  console.warn(`Failed to extract content from ${result.url}:`, extractError instanceof Error ? extractError.message : String(extractError));
                }
              }
              
              return { success: true, query: queryObj.query, resultCount: searchResults.length };
            } catch (searchError) {
              console.error(`Search failed for query "${queryObj.query}":`, searchError instanceof Error ? searchError.message : String(searchError));
              return { success: false, query: queryObj.query, error: searchError instanceof Error ? searchError.message : String(searchError) };
            }
          })
        );
        
        results.push(...batchResults);
        
        // Brief delay between batches to avoid rate limiting
        if (i + batchSize < pillarQueries.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Log batch results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`Pillar ${pillarId}: ${successful}/${results.length} searches successful`);
    }

    // Deduplicate evidence by URL
    const uniqueEvidence = deduplicateEvidence(allEvidence);
    
    console.log(`✅ Gathered ${uniqueEvidence.length} unique pieces of evidence (from ${allEvidence.length} total)`);

    // Update state with new evidence
    return {
      evidence: [...state.evidence, ...uniqueEvidence],
      metadata: {
        ...state.metadata,
        lastEvidenceGathering: new Date(),
        evidenceStats: {
          total: state.evidence.length + uniqueEvidence.length,
          byPillar: countEvidenceByPillar([...state.evidence, ...uniqueEvidence]),
        },
      },
    };

  } catch (error) {
    console.error('❌ Evidence gathering failed:', error);
    return {
      errors: [...state.errors, {
        timestamp: new Date(),
        phase: 'gather_evidence',
        error: error instanceof Error ? error.message : String(error),
        severity: 'critical',
      }],
    };
  }
}

function calculateCredibilityScore(url: string): number {
  // Simple credibility scoring based on domain
  const highCredibilityDomains = [
    'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'techcrunch.com',
    'venturebeat.com', 'forbes.com', 'businessinsider.com', 'cnbc.com',
    'gartner.com', 'mckinsey.com', 'deloitte.com', 'pwc.com',
    '.edu', '.gov', 'arxiv.org', 'ssrn.com',
  ];
  
  const mediumCredibilityDomains = [
    'medium.com', 'substack.com', 'linkedin.com', 'github.com',
    'producthunt.com', 'ycombinator.com', 'reddit.com',
  ];
  
  const domain = new URL(url).hostname.toLowerCase();
  
  if (highCredibilityDomains.some(d => domain.includes(d))) {
    return 0.9;
  } else if (mediumCredibilityDomains.some(d => domain.includes(d))) {
    return 0.7;
  } else {
    return 0.5;
  }
}

function deduplicateEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return evidence.filter(e => {
    const key = e.source.url || e.content.substring(0, 100);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function countEvidenceByPillar(evidence: Evidence[]): Record<string, number> {
  return evidence.reduce((acc, e) => {
    acc[e.pillarId] = (acc[e.pillarId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}