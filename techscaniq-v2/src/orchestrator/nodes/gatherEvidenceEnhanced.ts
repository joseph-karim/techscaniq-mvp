import { ResearchState, Evidence, EvidenceSource } from '../../types';
import { queues, JobPriority } from '../../services/queue/index';
import { config } from '../../config';
import { WebSearchTool } from '../../tools/webSearch';
import { DocumentAnalyzer } from '../../tools/documentAnalyzer';
import { WebTechDetector } from '../../tools/webTechDetector';
import { TechnicalCollector } from '../../tools/technicalCollector';
import { APIDiscovery } from '../../tools/apiDiscovery';
// import { OperatorAnalyzer } from '../../tools/operatorAnalyzer'; // Removed - not effective
import { EvidenceCollectorIntegration } from '../../tools/evidenceCollectorIntegration';
import { v4 as uuidv4 } from 'uuid';
import { toolsConfig, isToolAvailable, getToolTimeout } from '../../config/tools.config';

// Helper function to run tool with timeout
async function runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  toolName: string
): Promise<T | null> {
  const timeout = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error(`${toolName} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  
  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    console.error(`⏱️ ${toolName} failed:`, error);
    return null;
  }
}

export async function gatherEvidenceEnhancedNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📊 Enhanced Evidence Gathering with all available tools...');
  
  try {
    const { thesis, metadata } = state;
    const queries = metadata?.currentQueries || {};
    const targetUrl = (thesis as any).website || (thesis as any).companyWebsite;
    
    if (!targetUrl) {
      console.log('No target website URL found');
      return {};
    }

    const allEvidence: Evidence[] = [];
    
    // Initialize all tools
    const searchTool = new WebSearchTool();
    const docAnalyzer = new DocumentAnalyzer();
    const techDetector = new WebTechDetector();
    const technicalCollector = new TechnicalCollector();
    const apiDiscovery = new APIDiscovery();
    // const operatorAnalyzer = new OperatorAnalyzer(); // Removed
    const evidenceCollector = new EvidenceCollectorIntegration();

    // Phase 1: Direct Website Analysis
    console.log('\n🔍 Phase 1: Direct Website Analysis');
    
    // 1.1 Technology Stack Detection
    if (isToolAvailable('webTechDetector')) {
      try {
        console.log('🔧 Detecting technology stack...');
        const techResult = await runWithTimeout(
          techDetector.detectTechnologies(targetUrl),
          getToolTimeout('webTechDetector'),
          'WebTechDetector'
        );
        
        if (techResult) {
          // Convert tech detection to evidence
          const techEvidence: Evidence = {
            id: uuidv4(),
            researchQuestionId: 'tech-stack',
            pillarId: 'technical',
            source: {
              type: 'web' as const,
              name: 'Technology Stack Analysis',
              url: targetUrl,
              publishDate: new Date(),
              author: 'WebTechDetector',
              credibilityScore: 1.0,
            },
            content: JSON.stringify(techResult, null, 2),
            metadata: {
              extractedAt: new Date(),
              extractionMethod: 'WebTechDetector',
              wordCount: JSON.stringify(techResult).length,
              language: 'en',
              keywords: ['technology', 'infrastructure', 'stack'],
              confidence: 0.95,
            },
            qualityScore: {
              overall: 0.96,
              components: {
                relevance: 0.95,
                credibility: 1.0,
                recency: 1.0,
                specificity: 0.9,
                bias: 0.1,
                depth: 0.85,
              },
              reasoning: 'Direct technical analysis from target website with high accuracy and completeness',
            },
            createdAt: new Date(),
          };
          allEvidence.push(techEvidence);
          console.log('✅ Technology stack detected');
        }
      } catch (error) {
        console.error('❌ Technology detection failed:', error);
      }
    }

    // 1.2 Technical Infrastructure Collection
    if (isToolAvailable('technicalCollector')) {
      try {
        console.log('🏗️ Collecting technical infrastructure data...');
        const technicalProfile = await runWithTimeout(
          technicalCollector.collectTechnicalProfile(targetUrl),
          getToolTimeout('technicalCollector'),
          'TechnicalCollector'
        );
        
        if (technicalProfile) {
          const infraEvidence: Evidence = {
            id: uuidv4(),
            researchQuestionId: 'infrastructure',
            pillarId: 'technical',
            source: {
              type: 'web' as const,
              name: 'Technical Infrastructure Analysis',
              url: targetUrl,
              publishDate: new Date(),
              author: 'TechnicalCollector',
              credibilityScore: 1.0,
            },
            content: JSON.stringify(technicalProfile, null, 2),
            metadata: {
              extractedAt: new Date(),
              extractionMethod: 'TechnicalCollector',
              wordCount: JSON.stringify(technicalProfile).length,
              language: 'en',
              keywords: ['infrastructure', 'security', 'performance'],
              confidence: 0.9,
            },
            qualityScore: {
              overall: 0.94,
              components: {
                relevance: 0.9,
                credibility: 1.0,
                recency: 1.0,
                specificity: 0.85,
                bias: 0.1,
                depth: 0.8,
              },
              reasoning: 'Comprehensive infrastructure analysis with detailed security and performance metrics',
            },
            createdAt: new Date(),
          };
          allEvidence.push(infraEvidence);
          console.log('✅ Technical infrastructure analyzed');
        }
      } catch (error) {
        console.error('❌ Technical collection failed:', error);
      }
    }

    // 1.3 API Discovery
    if (isToolAvailable('apiDiscovery')) {
      try {
        console.log('🔌 Discovering APIs and integrations...');
        const apis = await runWithTimeout(
          apiDiscovery.discoverAPIs(targetUrl),
          getToolTimeout('apiDiscovery'),
          'APIDiscovery'
        );
        
        if (apis && apis.endpoints && apis.endpoints.length > 0) {
          const apiEvidence: Evidence = {
            id: uuidv4(),
            researchQuestionId: 'apis',
            pillarId: 'technical',
            source: {
              type: 'api' as const,
              name: 'API Discovery',
              url: targetUrl,
              publishDate: new Date(),
              author: 'APIDiscovery',
              credibilityScore: 1.0,
            },
            content: JSON.stringify(apis, null, 2),
            metadata: {
              extractedAt: new Date(),
              extractionMethod: 'APIDiscovery',
              wordCount: JSON.stringify(apis).length,
              language: 'en',
              keywords: ['api', 'integration', 'endpoints'],
              confidence: 0.85,
            },
            qualityScore: {
              overall: 0.91,
              components: {
                relevance: 0.85,
                credibility: 1.0,
                recency: 1.0,
                specificity: 0.8,
                bias: 0.1,
                depth: 0.75,
              },
              reasoning: 'API endpoints discovered through automated analysis providing integration insights',
            },
            createdAt: new Date(),
          };
          allEvidence.push(apiEvidence);
          console.log(`✅ Found ${apis.endpoints.length} API endpoints`);
        }
      } catch (error) {
        console.error('❌ API discovery failed:', error);
      }
    }

    // 1.4 Deep Content Crawling with Crawl4AI
    if (isToolAvailable('crawl4ai')) {
      try {
        console.log('🕷️ Deep crawling website content with Crawl4AI...');
        const crawlEvidence = await runWithTimeout(
          evidenceCollector.collectWithCrawl4AI(
            targetUrl,
            (thesis as any).customThesis || (thesis as any).statement || '',
            50 // Max pages
          ),
          getToolTimeout('crawl4ai'),
          'Crawl4AI'
        );
        
        if (crawlEvidence && crawlEvidence.length > 0) {
          allEvidence.push(...crawlEvidence);
          console.log(`✅ Crawl4AI collected ${crawlEvidence.length} pieces of evidence`);
        }
      } catch (error) {
        console.error('❌ Crawl4AI failed:', error);
      }
    }

    // 1.5 Interactive Discovery with Operator Analyzer - REMOVED
    // Operator tool removed as it wasn't effective - Crawl4AI handles deep website crawling

    // Phase 2: Web Search Evidence (existing functionality)
    console.log('\n🔍 Phase 2: Web Search Evidence');
    
    if (Object.keys(queries).length > 0) {
      // Process queries in parallel batches
      for (const [pillarId, pillarQueries] of Object.entries(queries)) {
        console.log(`Processing ${pillarQueries.length} queries for pillar: ${pillarId}`);
        
        const batchSize = config.MAX_CONCURRENT_SEARCHES;
        
        for (let i = 0; i < pillarQueries.length; i += batchSize) {
          const batch = pillarQueries.slice(i, i + batchSize);
          
          const batchResults = await Promise.allSettled(
            batch.map(async (queryObj: any) => {
              try {
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
                  default:
                    searchResults = await searchTool.search(queryObj.query, {
                      maxResults: 10,
                    });
                }
                
                // Process each search result
                for (const result of searchResults) {
                  try {
                    // For documents/PDFs, use document analyzer
                    let content: string;
                    if (result.url.toLowerCase().endsWith('.pdf')) {
                      const extracted = await docAnalyzer.extractWebContent(result.url);
                      content = extracted?.text || result.snippet;
                    } else {
                      content = result.snippet || `Content from ${result.title}`;
                    }
                    
                    if (content && content.length > 50) {
                      const evidence: Evidence = {
                        id: uuidv4(),
                        researchQuestionId: '',
                        pillarId: pillarId,
                        source: {
                          type: 'web',
                          name: result.title,
                          url: result.url,
                          publishDate: result.publishedDate || new Date(),
                          author: 'Unknown',
                          credibilityScore: 0.7,
                        },
                        content: content,
                        metadata: {
                          extractedAt: new Date(),
                          extractionMethod: 'WebSearch',
                          wordCount: content.length,
                          language: 'en',
                          keywords: queryObj.tags || [],
                          confidence: result.relevanceScore || 0.5,
                          llmAnalysis: { searchQuery: queryObj.query },
                        },
                        qualityScore: {
                          overall: 0,
                          components: {
                            relevance: 0,
                            credibility: 0,
                            recency: 0,
                            specificity: 0,
                            bias: 0,
                          },
                          reasoning: 'Pending quality evaluation',
                        },
                        createdAt: new Date(),
                      };
                      
                      allEvidence.push(evidence);
                    }
                  } catch (docError) {
                    console.error(`Error processing result from ${result.url}:`, docError);
                  }
                }
                
                return { pillarId, query: queryObj.query, success: true };
              } catch (error) {
                console.error(`Search error for query "${queryObj.query}":`, error);
                return { pillarId, query: queryObj.query, success: false, error };
              }
            })
          );
          
          const successful = batchResults.filter(r => r.status === 'fulfilled').length;
          console.log(`Pillar ${pillarId}: ${successful}/${batch.length} searches successful`);
        }
      }
    }

    // Phase 3: Deduplication and Final Processing
    console.log('\n📋 Phase 3: Deduplication and Final Processing');
    
    // Deduplicate evidence by URL
    const uniqueEvidence = Array.from(
      new Map(allEvidence.map(e => [e.source.url, e])).values()
    );
    
    console.log(`✅ Gathered ${uniqueEvidence.length} unique pieces of evidence (from ${allEvidence.length} total)`);
    
    // Update state
    return {
      evidence: [...(state.evidence || []), ...uniqueEvidence],
      evidenceCount: (state.evidenceCount || 0) + uniqueEvidence.length,
      metadata: {
        ...state.metadata,
        lastEvidenceGathering: new Date(),
      },
    };

  } catch (error) {
    console.error('❌ Enhanced evidence gathering failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'gather_evidence_enhanced',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}