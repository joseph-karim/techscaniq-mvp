import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../config';
import { VectorStoreService } from '../services/vectorStore';
import { WebSearchTool } from '../tools/webSearch';
import { StorageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';

// Streamlined state with focus on evidence in vector store
interface StreamlinedState {
  // Core inputs
  company: string;
  website: string;
  thesisType: string;
  
  // Research progress
  phase: 'searching' | 'analyzing' | 'reporting';
  iterationCount: number;
  
  // Evidence management
  searchQueries: string[];
  evidenceCount: number;
  
  // Output
  report?: string;
  analysis?: any;
}

// Initialize services
const vectorStore = new VectorStoreService();
const webSearch = new WebSearchTool();
const storage = new StorageService();

// Models
const searchModel = new ChatAnthropic({
  apiKey: config.ANTHROPIC_API_KEY,
  modelName: models.anthropic.claudeOpus4,
  temperature: 0.3,
  maxTokens: 1000,
});

const analysisModel = new ChatOpenAI({
  apiKey: config.OPENAI_API_KEY,
  modelName: models.openai.gpt4o,
  temperature: 0.2,
  maxTokens: 4000,
});

// Node 1: Generate intelligent search queries
async function generateSearchQueries(state: StreamlinedState) {
  console.log('🔍 Generating search queries...');
  
  const prompt = `Generate 5-7 highly targeted search queries for due diligence on ${state.company} (${state.website}).
Focus on: ${state.thesisType} investment thesis.

Create queries that will find:
- Financial performance and metrics
- Technology and architecture
- Market position and competition
- Team and leadership
- Recent news and developments

Return ONLY a JSON array of search query strings.`;

  const response = await searchModel.invoke([
    new SystemMessage("You are a search expert. Return only valid JSON."),
    new HumanMessage(prompt),
  ]);

  const content = response.content.toString();
  const queries = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || '[]');
  
  return {
    ...state,
    searchQueries: queries,
    phase: 'searching' as const,
  };
}

// Node 2: Search and store evidence in vector DB
async function searchAndStore(state: StreamlinedState) {
  console.log('📊 Searching and storing evidence...');
  
  await vectorStore.initialize();
  
  let totalEvidence = 0;
  
  // Process queries in batches to avoid rate limits
  const batchSize = 2;
  const batches = [];
  for (let i = 0; i < state.searchQueries.length; i += batchSize) {
    batches.push(state.searchQueries.slice(i, i + batchSize));
  }
  
  let allResults = [];
  for (const batch of batches) {
    console.log(`Processing batch of ${batch.length} queries...`);
    const batchResults = await Promise.allSettled(
      batch.map(async (query) => {
      try {
        const searchResults = await webSearch.search(query, { maxResults: 5 });
        
        // Convert to evidence format and store in vector DB
        const evidence = searchResults.map(result => ({
          id: uuidv4(),
          researchQuestionId: state.company,
          pillarId: 'general',
          source: {
            type: 'web' as const,
            name: result.title,
            url: result.url,
            credibilityScore: 0.7,
            publishDate: result.publishedDate,
          },
          content: result.snippet,
          metadata: {
            extractedAt: new Date(),
            extractionMethod: 'search',
            wordCount: result.snippet.split(/\s+/).length,
            language: 'en',
            keywords: [],
            confidence: result.relevanceScore || 0.7,
          },
          qualityScore: {
            overall: 0.7,
            components: {
              relevance: 0.7,
              credibility: 0.7,
              recency: 0.7,
              specificity: 0.7,
              bias: 0.7,
            },
            reasoning: 'Evidence extracted from web search results',
          },
          createdAt: new Date(),
        }));
        
        await vectorStore.storeEvidence(evidence);
        totalEvidence += evidence.length;
        
        return evidence.length;
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error);
        return 0;
      }
      })
    );
    allResults.push(...batchResults);
    // Wait between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  const results = allResults;
  
  console.log(`✅ Stored ${totalEvidence} pieces of evidence`);
  
  return {
    ...state,
    evidenceCount: totalEvidence,
    phase: 'analyzing' as const,
  };
}

// Node 3: Analyze evidence using RAG
async function analyzeWithRAG(state: StreamlinedState) {
  console.log('🧠 Analyzing evidence with RAG...');
  
  // Define key analysis areas
  const analysisAreas = [
    { topic: "Financial Performance", query: `${state.company} revenue growth profitability metrics` },
    { topic: "Market Position", query: `${state.company} market share competition advantages` },
    { topic: "Technology Stack", query: `${state.company} technology architecture scalability` },
    { topic: "Team & Leadership", query: `${state.company} leadership team culture talent` },
    { topic: "Growth Potential", query: `${state.company} expansion opportunities risks` },
  ];
  
  const analysis: Record<string, any> = {};
  
  for (const area of analysisAreas) {
    // Retrieve relevant evidence from vector store
    const relevantEvidence = await vectorStore.searchEvidence(area.query, {
      minQuality: 0.6,
    }, 10);
    
    if (relevantEvidence.length === 0) {
      analysis[area.topic] = { summary: "No evidence found", confidence: 0 };
      continue;
    }
    
    // Analyze with context
    const prompt = `Analyze the following evidence about ${state.company} for ${area.topic}.
Provide a concise assessment with key findings and confidence level.

Evidence:
${relevantEvidence.map(e => `- ${e.source.name}: ${e.content}`).join('\n')}

Return a JSON object with:
{
  "summary": "2-3 sentence summary",
  "keyFindings": ["finding1", "finding2"],
  "metrics": { "metricName": "value" },
  "confidence": 0.0-1.0
}`;

    const response = await analysisModel.invoke([
      new SystemMessage("You are an investment analyst. Return only valid JSON."),
      new HumanMessage(prompt),
    ]);
    
    try {
      const content = response.content.toString();
      analysis[area.topic] = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');
    } catch (error) {
      console.error(`Failed to parse analysis for ${area.topic}:`, error);
      analysis[area.topic] = { 
        summary: relevantEvidence[0]?.content.substring(0, 200) || "Analysis failed",
        confidence: 0.5 
      };
    }
  }
  
  return {
    ...state,
    analysis,
    phase: 'reporting' as const,
  };
}

// Node 4: Generate final report
async function generateReport(state: StreamlinedState) {
  console.log('📄 Generating investment report...');
  
  const reportPrompt = `Generate a concise investment assessment for ${state.company}.

Investment Thesis: ${state.thesisType}
Evidence Collected: ${state.evidenceCount} pieces

Analysis Summary:
${JSON.stringify(state.analysis, null, 2)}

Create a professional investment memo with:
1. Executive Summary (3-4 sentences)
2. Investment Thesis Validation (does the evidence support the ${state.thesisType} thesis?)
3. Key Strengths (top 3)
4. Key Risks (top 3)
5. Financial Metrics (if available)
6. Recommendation (Invest/Pass/Further DD needed)

Keep it under 500 words. Be direct and actionable.`;

  const response = await analysisModel.invoke([
    new SystemMessage("You are a senior PE investment analyst. Write clear, actionable memos."),
    new HumanMessage(reportPrompt),
  ]);
  
  const report = response.content.toString();
  
  // Store the report
  const reportId = await storage.storeReport({
    thesisId: uuidv4(),
    thesis: {
      id: uuidv4(),
      company: state.company,
      website: state.website,
      companyWebsite: state.website,
      statement: `${state.thesisType} investment opportunity`,
      type: state.thesisType as any,
      pillars: [],
      successCriteria: [],
      riskFactors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    researchQuestions: [],
    evidence: [],
    qualityScores: {},
    reportSections: {
      final_report: {
        id: uuidv4(),
        pillarId: 'final',
        title: `Investment Assessment: ${state.company}`,
        content: report,
        score: 0.8,
        weight: 1.0,
        keyFindings: [],
        risks: [],
        opportunities: [],
        metadata: {
          wordCount: report.split(/\s+/).length,
          generatedBy: 'streamlined-rag',
          generatedAt: new Date().toISOString(),
          evidenceCount: state.evidenceCount,
        },
      },
    },
    citations: [],
    iterationCount: state.iterationCount,
    status: 'completed',
    errors: [],
  });
  
  console.log(`✅ Report saved with ID: ${reportId}`);
  
  return {
    ...state,
    report,
  };
}

// Create the streamlined graph
export function createStreamlinedGraph() {
  // TODO: Fix LangGraph type issues
  throw new Error('LangGraph implementation needs fixing - use streamlined-graph-simple.ts instead');
  
  // const workflow = new StateGraph<StreamlinedState>({} as any);
  
  // // Add nodes
  // workflow.addNode('generate_queries', generateSearchQueries);
  // workflow.addNode('search_and_store', searchAndStore);
  // workflow.addNode('analyze_rag', analyzeWithRAG);
  // workflow.addNode('generate_report', generateReport);
  
  // // Define flow
  // workflow.addEdge(START, 'generate_queries');
  // workflow.addEdge('generate_queries', 'search_and_store');
  // workflow.addEdge('search_and_store', 'analyze_rag');
  // workflow.addEdge('analyze_rag', 'generate_report');
  // workflow.addEdge('generate_report', END);
  
  // return workflow.compile();
}

// Main function to run streamlined research
export async function runStreamlinedResearch(
  company: string,
  website: string,
  thesisType: string
): Promise<string> {
  // TODO: Fix LangGraph implementation
  throw new Error('LangGraph implementation needs fixing - use runSimpleResearch from streamlined-graph-simple.ts instead');
  
  // const graph = createStreamlinedGraph();
  
  // const initialState: StreamlinedState = {
  //   company,
  //   website,
  //   thesisType,
  //   phase: 'searching',
  //   iterationCount: 1,
  //   searchQueries: [],
  //   evidenceCount: 0,
  // };
  
  // try {
  //   console.log(`\n🚀 Starting streamlined research for ${company}`);
  //   const finalState = await graph.invoke(initialState);
    
  //   return finalState.report || 'Report generation failed';
  // } catch (error) {
  //   console.error('Streamlined research failed:', error);
  //   throw error;
  // }
}