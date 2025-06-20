#!/usr/bin/env node
import { config } from 'dotenv';
import { StateGraph, END } from '@langchain/langgraph';
import { ResearchState } from '../src/types';
import { interpretThesisNode, generateQueriesNode, generateReportNode } from '../src/orchestrator/nodes';
import { WebSearchTool } from '../src/tools/webSearch';
import { DirectCrawl4AI } from '../src/tools/directCrawl4AI';
import { DirectSecurityScanner } from '../src/tools/directSecurityScanner';
import { v4 as uuidv4 } from 'uuid';

config();

// Simple evidence gathering without LangGraph agent
async function simpleGatherEvidence(state: ResearchState): Promise<Partial<ResearchState>> {
  console.log('🔍 Simple evidence gathering...');
  
  const evidence = state.evidence || [];
  const queries = state.generatedQueries || [];
  
  // Use first 3 queries only for speed
  const topQueries = queries.slice(0, 3);
  
  for (const query of topQueries) {
    console.log(`  📌 Query: ${query.query}`);
    
    try {
      // Web search
      const searchTool = new WebSearchTool();
      const results = await searchTool.search(query.query, { maxResults: 3 });
      
      results.forEach((result: any) => {
        evidence.push({
          id: uuidv4(),
          content: JSON.stringify(result),
          source: {
            name: 'Perplexity Search',
            type: 'web',
            url: result.url || '',
            credibilityScore: 0.8,
          },
          pillarId: 'general',
          timestamp: new Date(),
          qualityScore: {
            overall: 0.7,
            components: {
              relevance: 0.8,
              credibility: 0.8,
              recency: 0.7,
              specificity: 0.6,
              bias: 0.5,
              depth: 0.6,
            },
            reasoning: 'Web search result',
          },
          metadata: {
            query: query.query,
            position: results.indexOf(result),
          },
        });
      });
      
    } catch (error) {
      console.error(`  ❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log(`✅ Gathered ${evidence.length} pieces of evidence`);
  
  return {
    evidence,
    metadata: {
      ...state.metadata,
      toolsUsed: ['web_search'],
    },
  };
}

async function runSimpleTest() {
  console.log('🚀 Running Simple CIBC Test\n');
  
  const startTime = Date.now();
  
  try {
    // Define state channels
    const stateChannels = {
      thesis: {
        value: (old: any, next: any) => next ?? old,
        default: () => null,
      },
      company: {
        value: (old: string, next: string) => next ?? old,
        default: () => '',
      },
      companyWebsite: {
        value: (old: string, next: string) => next ?? old,
        default: () => '',
      },
      researchType: {
        value: (old: string, next: string) => next ?? old,
        default: () => 'sales-intelligence',
      },
      generatedQueries: {
        value: (old: any[], next: any[]) => next ?? old,
        default: () => [],
      },
      evidence: {
        value: (old: any[], next: any[]) => next ?? old,
        default: () => [],
      },
      qualityScores: {
        value: (old: Record<string, number>, next: Record<string, number>) => ({ ...old, ...next }),
        default: () => ({}),
      },
      reportSections: {
        value: (old: Record<string, any>, next: Record<string, any>) => ({ ...old, ...next }),
        default: () => ({}),
      },
      status: {
        value: (old: string, next: string) => next ?? old,
        default: () => 'initializing',
      },
      errors: {
        value: (old: any[], next: any[]) => [...old, ...next],
        default: () => [],
      },
      metadata: {
        value: (old: any, next: any) => ({ ...old, ...next }),
        default: () => ({}),
      },
      iterationCount: {
        value: (old: number, next: number) => next ?? old,
        default: () => 0,
      },
    };
    
    // Create workflow
    const workflow = new StateGraph<ResearchState>({
      channels: stateChannels as any,
    });
    
    // Add nodes
    workflow.addNode('interpret_thesis', interpretThesisNode);
    workflow.addNode('generate_queries', generateQueriesNode);
    workflow.addNode('gather_evidence', simpleGatherEvidence);
    workflow.addNode('generate_report', generateReportNode);
    
    // Set edges
    workflow.setEntryPoint('interpret_thesis');
    workflow.addEdge('interpret_thesis', 'generate_queries');
    workflow.addEdge('generate_queries', 'gather_evidence');
    workflow.addEdge('gather_evidence', 'generate_report');
    workflow.addEdge('generate_report', END);
    
    // Compile
    const app = workflow.compile();
    
    // Initial state with proper thesis object
    const initialState: ResearchState = {
      thesis: {
        id: 'test-thesis',
        company: 'CIBC',
        website: 'https://www.cibc.com',
        statement: 'Adobe Experience Cloud opportunity at CIBC',
        type: 'custom',
        customThesis: 'CIBC needs digital transformation for customer experience',
        pillars: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      company: 'CIBC',
      companyWebsite: 'https://www.cibc.com',
      researchType: 'sales-intelligence',
      iterationCount: 0,
      evidence: [],
      errors: [],
      qualityScores: {},
      reportSections: {},
      status: 'initializing',
      metadata: {
        startTime: new Date(),
        reportType: 'sales-intelligence',
        salesContext: {
          company: 'CIBC',
          sellingCompany: 'Adobe',
          offering: 'Adobe Experience Cloud',
          focusAreas: ['digital transformation', 'customer experience'],
        },
      },
    } as ResearchState;
    
    // Run
    const result = await app.invoke(initialState);
    
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n✅ Test completed!');
    console.log(`⏱️ Duration: ${duration.toFixed(1)}s`);
    console.log(`📊 Evidence: ${result.evidence?.length || 0}`);
    console.log(`📝 Status: ${result.status}`);
    
    // Show sample evidence
    if (result.evidence && result.evidence.length > 0) {
      console.log('\n📋 Sample Evidence:');
      result.evidence.slice(0, 3).forEach((ev, idx) => {
        console.log(`${idx + 1}. ${ev.source.name} - ${ev.source.url}`);
      });
    }
    
    // Show report sections
    if (result.reportSections && Object.keys(result.reportSections).length > 0) {
      console.log('\n📄 Report Sections:');
      Object.keys(result.reportSections).forEach(section => {
        console.log(`- ${section}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run test
runSimpleTest().catch(console.error);