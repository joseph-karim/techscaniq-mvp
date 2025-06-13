import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config, models } from '../config';
import { VectorStoreService } from '../services/vectorStore';
import { WebSearchTool } from '../tools/webSearch';
import { StorageService } from '../services/storage';
import { v4 as uuidv4 } from 'uuid';

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

// Simple sequential pipeline without LangGraph complexity
export async function runStreamlinedResearch(
  company: string,
  website: string,
  thesisType: string
): Promise<string> {
  try {
    console.log(`\n🚀 Starting streamlined research for ${company}`);
    
    // Step 1: Generate search queries
    console.log('🔍 Generating search queries...');
    const queries = await generateSearchQueries(company, website, thesisType);
    
    // Step 2: Search and store evidence
    console.log('📊 Searching and storing evidence...');
    const evidenceCount = await searchAndStoreEvidence(queries, company);
    
    // Step 3: Analyze with RAG
    console.log('🧠 Analyzing evidence with RAG...');
    const analysis = await analyzeWithRAG(company, thesisType);
    
    // Step 4: Generate report
    console.log('📄 Generating investment report...');
    const report = await generateReport(company, thesisType, evidenceCount, analysis);
    
    // Save report
    const reportId = await saveReport(company, website, thesisType, report, evidenceCount);
    console.log(`✅ Report saved with ID: ${reportId}`);
    
    return report;
  } catch (error) {
    console.error('Streamlined research failed:', error);
    throw error;
  }
}

async function generateSearchQueries(company: string, website: string, thesisType: string): Promise<string[]> {
  const prompt = `Generate 5-7 highly targeted search queries for due diligence on ${company} (${website}).
Focus on: ${thesisType} investment thesis.

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
  const queries = JSON.parse(content.match(/\[[\\s\\S]*\]/)?.[0] || '[]');
  
  return queries;
}

async function searchAndStoreEvidence(queries: string[], company: string): Promise<number> {
  await vectorStore.initialize();
  
  let totalEvidence = 0;
  
  // Process queries in batches to avoid rate limits
  const batchSize = 2;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    console.log(`Processing batch of ${batch.length} queries...`);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (query) => {
        try {
          console.log(`   🔍 Searching for: "${query}"`);
          const searchResults = await webSearch.search(query, { maxResults: 5 });
          console.log(`   ✓ Found ${searchResults.length} results`);
          
          // Convert to evidence format and store in vector DB
          const evidence = searchResults.map(result => ({
            id: uuidv4(),
            researchQuestionId: company,
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
          return evidence.length;
        } catch (error) {
          console.error(`Search failed for query: ${query}`, error);
          return 0;
        }
      })
    );
    
    const batchTotal = batchResults.reduce((sum, result) => 
      sum + (result.status === 'fulfilled' ? result.value : 0), 0
    );
    totalEvidence += batchTotal;
    
    // Wait between batches
    if (i + batchSize < queries.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`✅ Stored ${totalEvidence} pieces of evidence`);
  return totalEvidence;
}

async function analyzeWithRAG(company: string, thesisType: string): Promise<Record<string, any>> {
  // Define key analysis areas
  const analysisAreas = [
    { topic: "Financial Performance", query: `${company} revenue growth profitability metrics` },
    { topic: "Market Position", query: `${company} market share competition advantages` },
    { topic: "Technology Stack", query: `${company} technology architecture scalability` },
    { topic: "Team & Leadership", query: `${company} leadership team culture talent` },
    { topic: "Growth Potential", query: `${company} expansion opportunities risks` },
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
    const prompt = `Analyze the following evidence about ${company} for ${area.topic}.
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
  
  return analysis;
}

async function generateReport(
  company: string, 
  thesisType: string,
  evidenceCount: number,
  analysis: Record<string, any>
): Promise<string> {
  const reportPrompt = `Generate a concise investment assessment for ${company}.

Investment Thesis: ${thesisType}
Evidence Collected: ${evidenceCount} pieces

Analysis Summary:
${JSON.stringify(analysis, null, 2)}

Create a professional investment memo with:
1. Executive Summary (3-4 sentences)
2. Investment Thesis Validation (does the evidence support the ${thesisType} thesis?)
3. Key Strengths (top 3)
4. Key Risks (top 3)
5. Financial Metrics (if available)
6. Recommendation (Invest/Pass/Further DD needed)

Keep it under 500 words. Be direct and actionable.`;

  const response = await analysisModel.invoke([
    new SystemMessage("You are a senior PE investment analyst. Write clear, actionable memos."),
    new HumanMessage(reportPrompt),
  ]);
  
  return response.content.toString();
}

async function saveReport(
  company: string,
  website: string,
  thesisType: string,
  report: string,
  evidenceCount: number
): Promise<string> {
  const reportId = await storage.storeReport({
    thesisId: uuidv4(),
    thesis: {
      id: uuidv4(),
      company,
      website,
      companyWebsite: website,
      statement: `${thesisType} investment opportunity`,
      type: thesisType as any,
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
        title: `Investment Assessment: ${company}`,
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
          evidenceCount,
        },
      },
    },
    citations: [],
    iterationCount: 1,
    status: 'completed',
    errors: [],
  });
  
  return reportId;
}