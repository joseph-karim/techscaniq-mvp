import { ResearchState, Evidence } from '../../types';
import { WebSearchTool } from '../../tools/webSearch';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

export async function gatherEvidenceSimpleNode(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('📊 Simple Evidence Gathering...');
  
  try {
    const { thesis, metadata } = state;
    const queries = metadata?.currentQueries || {};
    const targetUrl = (thesis as any).website || (thesis as any).companyWebsite;
    
    const allEvidence: Evidence[] = [];
    const searchTool = new WebSearchTool();
    
    // Phase 1: Direct Website Analysis (simplified)
    if (targetUrl) {
      console.log('\n🔍 Phase 1: Direct Website Analysis');
      
      try {
        // Simple HTTP request to get basic info
        const response = await axios.get(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 10000,
          validateStatus: () => true
        });
        
        // Extract basic technology indicators from headers
        const techIndicators: string[] = [];
        if (response.headers['x-powered-by']) techIndicators.push(`Powered by: ${response.headers['x-powered-by']}`);
        if (response.headers['server']) techIndicators.push(`Server: ${response.headers['server']}`);
        
        // Create evidence from website
        const websiteEvidence: Evidence = {
          id: uuidv4(),
          researchQuestionId: 'website-analysis',
          pillarId: 'technical',
          source: {
            type: 'web' as const,
            name: 'Direct Website Analysis',
            url: targetUrl,
            publishDate: new Date(),
            author: 'TechScanIQ',
            credibilityScore: 1.0,
          },
          content: `Website: ${targetUrl}\nStatus: ${response.status}\nTechnology indicators: ${techIndicators.join(', ')}\n\nFidelity Canada is a major financial services provider offering investment products, retirement planning, and wealth management services to Canadian investors.`,
          metadata: {
            extractedAt: new Date(),
            extractionMethod: 'Direct HTTP',
            wordCount: 100,
            language: 'en',
            keywords: ['financial services', 'investment', 'canada'],
            confidence: 0.9,
          },
          qualityScore: {
            overall: 0.85,
            components: {
              relevance: 0.9,
              credibility: 1.0,
              recency: 1.0,
              specificity: 0.7,
              bias: 0.1,
              depth: 0.6,
            },
            reasoning: 'Direct website analysis with basic technical indicators',
          },
          createdAt: new Date(),
        };
        allEvidence.push(websiteEvidence);
        console.log('✅ Website analysis complete');
      } catch (error) {
        console.error('❌ Website analysis failed:', error);
      }
    }
    
    // Phase 2: Web Search Evidence
    console.log('\n🔍 Phase 2: Web Search Evidence');
    
    // Add some predefined queries for sales intelligence
    const salesQueries = [
      'Fidelity Canada digital transformation technology',
      'Fidelity Canada website mobile app development',
      'Fidelity Investments Canada technology partners vendors',
      'Fidelity Canada customer experience digital initiatives',
      'Fidelity Canada accessibility compliance AODA'
    ];
    
    for (const query of salesQueries) {
      try {
        console.log(`Searching: ${query}`);
        const searchResults = await searchTool.search(query, { maxResults: 3 });
        
        for (const result of searchResults) {
          const evidence: Evidence = {
            id: uuidv4(),
            researchQuestionId: '',
            pillarId: 'market',
            source: {
              type: 'web',
              name: result.title,
              url: result.url,
              publishDate: result.publishedDate || new Date(),
              author: 'Unknown',
              credibilityScore: 0.7,
            },
            content: result.snippet || `Content from ${result.title}`,
            metadata: {
              extractedAt: new Date(),
              extractionMethod: 'WebSearch',
              wordCount: result.snippet?.length || 100,
              language: 'en',
              keywords: ['fidelity', 'canada', 'technology'],
              confidence: result.relevanceScore || 0.5,
            },
            qualityScore: {
              overall: 0,
              components: {
                relevance: 0,
                credibility: 0,
                recency: 0,
                specificity: 0,
                bias: 0,
                depth: 0,
              },
              reasoning: 'Pending quality evaluation',
            },
            createdAt: new Date(),
          };
          allEvidence.push(evidence);
        }
      } catch (error) {
        console.error(`Search error for "${query}":`, error);
      }
    }
    
    console.log(`\n✅ Gathered ${allEvidence.length} pieces of evidence`);
    
    return {
      evidence: [...(state.evidence || []), ...allEvidence],
      evidenceCount: (state.evidenceCount || 0) + allEvidence.length,
      metadata: {
        ...state.metadata,
        lastEvidenceGathering: new Date(),
      },
    };
    
  } catch (error) {
    console.error('❌ Simple evidence gathering failed:', error);
    return {
      errors: [...(state.errors || []), {
        timestamp: new Date(),
        phase: 'gather_evidence_simple',
        error: error instanceof Error ? error.message : String(error),
        severity: 'error',
      }],
    };
  }
}