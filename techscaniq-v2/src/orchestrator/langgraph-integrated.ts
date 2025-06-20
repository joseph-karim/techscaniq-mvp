import { StateGraph, END, MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { ResearchState, Evidence } from '../types';
import { config } from '../config';
import { EvidenceExtractor } from './evidence-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import nodes
import { interpretThesisNode, generateQueriesNode, generateReportNode } from './nodes';

// Import direct tool implementations
import { WebSearchTool } from '../tools/webSearch';
import { DocumentAnalyzer } from '../tools/documentAnalyzerRefactored'; // Use refactored version without Crawlee
import { WebTechDetector } from '../tools/webTechDetectorRefactored'; // Use refactored version without Crawlee
import { TechnicalCollector } from '../tools/technicalCollectorRefactored'; // Use refactored version without Crawlee
import { APIDiscovery } from '../tools/apiDiscovery';
import { DirectCrawl4AI } from '../tools/directCrawl4AI';
import { DirectSecurityScanner } from '../tools/directSecurityScanner';

// Tool implementations as LangGraph-compatible functions
const webSearchTool = new DynamicStructuredTool({
  name: 'web_search',
  description: 'Search the web for information about a company or topic',
  schema: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().default(50).describe('Maximum number of results to return'),
  }),
  func: async ({ query, maxResults }) => {
    const searchTool = new WebSearchTool();
    const results = await searchTool.search(query, { maxResults, returnFullResponse: true });
    return JSON.stringify(results, null, 2);
  },
});

const websiteAnalyzerTool = new DynamicStructuredTool({
  name: 'website_analyzer',
  description: 'Analyze a website for technology stack, structure, and content using sitemap',
  schema: z.object({
    url: z.string().describe('The URL to analyze'),
    maxPages: z.number().optional().default(20).describe('Maximum pages to analyze from sitemap'),
  }),
  func: async ({ url, maxPages }) => {
    const crawler = new DirectCrawl4AI();
    const techDetector = new WebTechDetector();
    
    try {
      // Use Crawl4AI with sitemap to get multiple pages
      const crawledEvidence = await crawler.extract(url, {
        extractionType: 'full_content',
        useSitemap: true,
        maxPages,
      });
      
      // Also get tech stack
      const techStack = await techDetector.detectTechnologies(url);
      
      // Convert evidence to structured data
      const pages = crawledEvidence.map(ev => {
        try {
          return JSON.parse(ev.content);
        } catch {
          return { url: ev.source.url, content: ev.content };
        }
      });
      
      return JSON.stringify({
        url,
        pagesAnalyzed: pages.length,
        pages: pages,
        technologyStack: techStack,
        analyzedAt: new Date().toISOString(),
      }, null, 2);
    } catch (error) {
      return JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to analyze website',
        url,
      });
    }
  },
});

const technicalAnalysisTool = new DynamicStructuredTool({
  name: 'technical_analysis',
  description: 'Perform deep technical analysis including security, performance, and API discovery',
  schema: z.object({
    domain: z.string().describe('The domain to analyze (e.g., example.com)'),
    includeSecurityScan: z.boolean().optional().default(true),
    includeApiDiscovery: z.boolean().optional().default(true),
  }),
  func: async ({ domain, includeSecurityScan, includeApiDiscovery }) => {
    const technicalCollector = new TechnicalCollector();
    const apiDiscovery = new APIDiscovery();
    
    const results: any = {
      domain,
      timestamp: new Date().toISOString(),
    };
    
    // Technical infrastructure analysis
    try {
      results.infrastructure = await technicalCollector.collectTechnicalData(domain);
    } catch (error) {
      results.infrastructure = { error: error instanceof Error ? error.message : 'Technical collection failed' };
    }
    
    // Security scanning
    if (includeSecurityScan) {
      try {
        const securityScanner = new DirectSecurityScanner();
        results.security = await securityScanner.scanSecurity(domain);
      } catch (error) {
        results.security = { error: error instanceof Error ? error.message : 'Security scan failed' };
      }
    }
    
    // API discovery
    if (includeApiDiscovery) {
      try {
        results.apiEndpoints = await apiDiscovery.discoverAPIs(domain);
      } catch (error) {
        results.apiEndpoints = { error: error instanceof Error ? error.message : 'API discovery failed' };
      }
    }
    
    return JSON.stringify(results, null, 2);
  },
});

// Create the sales intelligence specific tool
const crawl4AITool = new DynamicStructuredTool({
  name: 'crawl4ai_extractor',
  description: 'Extract structured content from websites using intelligent crawling with sitemap support',
  schema: z.object({
    url: z.string().describe('The URL to crawl'),
    extractionType: z.enum(['full_content', 'pricing_plans', 'customer_logos', 'company_info', 'recent_posts', 'documentation'])
      .optional()
      .describe('Type of content to extract'),
    useSitemap: z.boolean().optional().default(true).describe('Use sitemap for intelligent multi-page crawling'),
    maxPages: z.number().optional().default(10).describe('Maximum number of pages to crawl from sitemap'),
  }),
  func: async ({ url, extractionType, useSitemap, maxPages }) => {
    const crawler = new DirectCrawl4AI();
    const evidence = await crawler.extract(url, {
      extractionType,
      useSitemap,
      maxPages,
    });
    
    // Combine evidence into a single result
    const results = evidence.map(e => JSON.parse(e.content));
    
    return JSON.stringify({
      url,
      extractionType: extractionType || 'full_content',
      pagesExtracted: results.length,
      sitemapUsed: useSitemap,
      data: results,
      extractedAt: new Date().toISOString(),
    }, null, 2);
  },
});

const securityScannerTool = new DynamicStructuredTool({
  name: 'security_scanner',
  description: 'Perform security analysis including SSL, headers, vulnerabilities, and DNS checks',
  schema: z.object({
    url: z.string().describe('The URL to scan for security issues'),
  }),
  func: async ({ url }) => {
    const scanner = new DirectSecurityScanner();
    const result = await scanner.scan(url);
    return JSON.stringify(result, null, 2);
  },
});

const salesIntelligenceTool = new DynamicStructuredTool({
  name: 'sales_intelligence_analyzer',
  description: 'Analyze a company for sales intelligence opportunities, digital maturity, and technology gaps',
  schema: z.object({
    company: z.string().describe('Company name'),
    website: z.string().describe('Company website URL'),
    focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (e.g., accessibility, performance, mobile)'),
  }),
  func: async ({ company, website, focusAreas = [] }) => {
    const searchTool = new WebSearchTool();
    
    // Construct targeted searches for sales intelligence
    const searches = [
      `${company} digital transformation initiatives`,
      `${company} technology modernization`,
      `${company} accessibility compliance AODA WCAG`,
      `${company} mobile app development`,
      `${company} customer experience technology`,
      ...focusAreas.map(area => `${company} ${area}`),
    ];
    
    const searchResults = await Promise.all(
      searches.map(query => searchTool.search(query, { maxResults: 20, returnFullResponse: true }))
    );
    
    return JSON.stringify({
      company,
      website,
      focusAreas,
      searchResults: searches.map((query, idx) => ({
        query,
        results: searchResults[idx],
      })),
      analyzedAt: new Date().toISOString(),
    }, null, 2);
  },
});

// All available tools
export const tools = [
  webSearchTool,
  websiteAnalyzerTool,
  technicalAnalysisTool,
  crawl4AITool,
  securityScannerTool,
  salesIntelligenceTool,
];

// Create deep research node - uses Perplexity Sonar Deep for comprehensive initial research
export function createDeepResearchNode(model: ChatOpenAI) {
  return async (state: ResearchState): Promise<Partial<ResearchState>> => {
    console.log('🔬 Starting Deep Research Phase (Perplexity Sonar Deep)...');
    
    const { thesis, researchQuestions, metadata } = state;
    const company = thesis.company;
    const website = thesis.website || (thesis as any).companyWebsite;
    const evidence: Evidence[] = [];
    
    // Use Perplexity Sonar Deep for comprehensive research
    const searchTool = new WebSearchTool();
    
    // Get thesis statement and custom thesis for context
    const thesisStatement = thesis.statement || '';
    const customThesis = (metadata as any)?.customThesis || '';
    const reportType = thesis.type || metadata?.reportType || 'sales-intelligence';
    
    // Construct comprehensive search queries based on context
    let deepSearchQueries: string[] = [];
    
    if (reportType === 'sales-intelligence') {
      // Parse vendor context from thesis statement
      // Example: "Adobe can help CIBC accelerate their digital transformation with Adobe Experience Platform, Adobe Analytics"
      const vendorMatch = (customThesis || thesisStatement).match(/^(\w+)\s+can\s+help\s+.+\s+with\s+(.+)$/i);
      const vendor = vendorMatch?.[1] || '';
      const productsString = vendorMatch?.[2] || '';
      const products = productsString ? productsString.split(/,\s*/).map((p: any) => p.trim()) : [];
      
      if (vendor && products.length > 0) {
        // Generate vendor-specific queries
        deepSearchQueries = [
          `${company} ${products.join(' OR ')} implementation opportunities`,
          `${company} digital transformation challenges ${vendor} solutions`,
          `${company} technology stack gaps ${products.join(' ')}`,
          `${company} customer experience problems ${vendor} can solve`,
          `${company} operational inefficiencies ${vendor} addresses`,
          `${company} competitive disadvantages requiring ${products.join(' OR ')}`,
          `${company} strategic initiatives ${vendor} alignment`,
          `${company} technology modernization ${vendor} opportunities`,
        ];
        
        // Add general technology assessment queries
        deepSearchQueries.push(
          `${company} current technology infrastructure assessment`,
          `${company} digital transformation roadmap priorities`
        );
      } else {
        // Fallback to general sales intelligence queries
        deepSearchQueries = [
          `${company} digital transformation initiatives challenges`,
          `${company} technology modernization opportunities`,
          `${company} customer experience technology gaps`,
          `${company} operational efficiency improvement needs`,
          `${company} competitive technology disadvantages`,
          `${company} strategic technology priorities`,
          `${company} IT infrastructure pain points`,
          `${company} digital innovation requirements`,
        ];
      }
    } else if (reportType === 'pe-due-diligence') {
      // For PE reports, parse investment focus from thesis
      // Example: "Evaluate CIBC as a potential private equity investment opportunity focusing on technology infrastructure and digital capabilities"
      const focusMatch = (customThesis || thesisStatement).match(/focusing on\s+(.+)$/i);
      const focusAreas = focusMatch?.[1]?.split(/\s+and\s+/) || [];
      
      if (focusAreas.length > 0) {
        // Generate PE-specific queries based on focus areas
        deepSearchQueries = [
          `${company} ${focusAreas.join(' ')} current state assessment`,
          `${company} technology infrastructure investment requirements`,
          `${company} digital transformation ROI potential`,
          `${company} competitive positioning ${focusAreas.join(' ')}`,
          `${company} technology debt modernization costs`,
          `${company} scalability challenges opportunities`,
          `${company} market expansion technology enablers`,
          `${company} operational efficiency improvement potential`,
        ];
      } else {
        // Default PE due diligence queries
        deepSearchQueries = [
          `${company} technology stack infrastructure architecture`,
          `${company} digital transformation initiatives ROI`,
          `${company} competitive technology advantages disadvantages`,
          `${company} scalability infrastructure assessment`,
          `${company} technology investment requirements`,
          `${company} operational efficiency metrics`,
          `${company} market expansion capabilities`,
          `${company} technology risk assessment`,
        ];
      }
    } else {
      // Default queries for general analysis
      deepSearchQueries = [
        `${company} technology stack infrastructure architecture`,
        `${company} digital transformation initiatives challenges`,
        `${company} customer experience technology gaps`,
        `${company} cybersecurity compliance issues`,
        `${company} API integrations developer ecosystem`,
        `${company} mobile app web performance issues`,
        `${company} cloud migration modernization efforts`,
        `${company} data analytics AI ML initiatives`,
      ];
    }
    
    console.log(`🔍 Executing ${deepSearchQueries.length} deep research queries...`);
    
    for (const query of deepSearchQueries) {
      try {
        console.log(`  📊 Researching: "${query}"`);
        const results = await searchTool.search(query, { 
          maxResults: 100, 
          returnFullResponse: true
        });
        
        // Extract evidence from results
        const extractedEvidence = EvidenceExtractor.extractFromPerplexityResponse(
          results as any,
          query,
          researchQuestions?.[0]?.id || 'general'
        );
        
        console.log(`    ✅ Extracted ${extractedEvidence.length} evidence pieces`);
        evidence.push(...extractedEvidence);
      } catch (error) {
        console.error(`    ❌ Failed to research "${query}":`, error);
      }
    }
    
    console.log(`✅ Deep Research Phase complete: ${evidence.length} evidence pieces collected`);
    
    return {
      evidence: [...(state.evidence || []), ...evidence],
      metadata: {
        ...state.metadata,
        deepResearchComplete: true,
        deepResearchEvidenceCount: evidence.length,
      },
    };
  };
}

// Create analyze findings node - reviews deep research and plans targeted follow-up
export function createAnalyzeFindingsNode(model: ChatOpenAI) {
  return async (state: ResearchState): Promise<Partial<ResearchState>> => {
    console.log('🧠 Analyzing Deep Research Findings...');
    
    const { thesis, evidence, metadata } = state;
    const company = thesis.company;
    const thesisStatement = thesis.statement || '';
    const customThesis = (metadata as any)?.customThesis || '';
    const reportType = thesis.type || metadata?.reportType || 'sales-intelligence';
    
    // Group evidence by topic/theme for analysis
    const evidenceSummary = evidence.slice(-500).map(e => ({
      source: e.source.name,
      content: e.content.substring(0, 200),
      score: e.qualityScore.overall,
    }));
    
    // Build context-aware analysis prompt based on thesis
    let analysisContext = '';
    if (reportType === 'sales-intelligence') {
      // Parse vendor context from thesis
      const vendorMatch = (customThesis || thesisStatement).match(/^(\w+)\s+can\s+help\s+.+\s+with\s+(.+)$/i);
      const vendor = vendorMatch?.[1] || '';
      const productsString = vendorMatch?.[2] || '';
      const products = productsString ? productsString.split(/,\s*/).map((p: any) => p.trim()) : [];
      
      if (vendor && products.length > 0) {
        analysisContext = `
Vendor Context from Thesis:
- Vendor: ${vendor}
- Products/Services: ${products.join(', ')}
- Target Company: ${company}

Focus on identifying gaps and opportunities where ${vendor}'s solutions (${products.join(', ')}) could provide value to ${company}.`;
      }
    } else if (reportType === 'pe-due-diligence') {
      // Parse PE focus from thesis
      const focusMatch = (customThesis || thesisStatement).match(/focusing on\s+(.+)$/i);
      const focusAreas = focusMatch?.[1]?.split(/\s+and\s+/) || [];
      
      if (focusAreas.length > 0) {
        analysisContext = `
PE Investment Focus from Thesis:
- Target Company: ${company}
- Focus Areas: ${focusAreas.join(', ')}

Analyze findings to assess investment potential, risks, and value creation opportunities in the specified focus areas.`;
      }
    }
    
    // Analyze findings and identify areas for targeted research
    const analysisPrompt = new HumanMessage(`Based on the deep research about ${company}, analyze the findings and identify:

1. Key technology gaps discovered${analysisContext ? ' (considering the thesis context)' : ''}
2. Specific areas that need deeper investigation
3. Which tools would be most valuable for follow-up research
4. Priority areas for targeted evidence gathering
${analysisContext}

Evidence Summary:
${JSON.stringify(evidenceSummary, null, 2)}`);
    
    const analysis = await model.invoke([
      new SystemMessage('You are analyzing deep research findings to plan targeted follow-up investigations.'),
      analysisPrompt,
    ]);
    
    // Extract targeted research areas from analysis with intelligent parsing
    const targetedAreas: any = {
      techGaps: [],
      investigationAreas: [],
      recommendedTools: [],
      priorities: [],
    };
    
    try {
      // Use LLM to intelligently extract structured findings
      const content = analysis.content.toString();
      
      // Extract mentioned pain points and initiatives
      const painPointMatches = content.match(/pain points?:?\s*([^.]+)/gi) || [];
      const initiativeMatches = content.match(/initiatives?:?\s*([^.]+)/gi) || [];
      const gapMatches = content.match(/gaps?:?\s*([^.]+)/gi) || [];
      
      // Intelligently determine what tools to use based on findings
      const needsTechnicalAnalysis = content.toLowerCase().includes('performance') || 
                                    content.toLowerCase().includes('infrastructure') ||
                                    content.toLowerCase().includes('security');
      
      const needsContentExtraction = content.toLowerCase().includes('forms') ||
                                    content.toLowerCase().includes('application') ||
                                    content.toLowerCase().includes('process') ||
                                    content.toLowerCase().includes('customer journey');
      
      // Set recommended tools based on analysis
      targetedAreas.recommendedTools = [];
      if (needsTechnicalAnalysis) {
        targetedAreas.recommendedTools.push('technical_analysis');
        targetedAreas.recommendedTools.push('security_scanner');
      }
      if (needsContentExtraction) {
        targetedAreas.recommendedTools.push('crawl4ai_extractor');
      }
      if (targetedAreas.recommendedTools.length === 0) {
        // Default to comprehensive analysis
        targetedAreas.recommendedTools = ['technical_analysis', 'crawl4ai_extractor', 'website_analyzer'];
      }
      
      // Extract specific areas to investigate
      const areasToInvestigate = new Set<string>();
      
      // Look for specific business functions mentioned
      if (content.includes('payment') || content.includes('transaction')) {
        areasToInvestigate.add('payment processing systems');
      }
      if (content.includes('onboarding') || content.includes('application')) {
        areasToInvestigate.add('customer onboarding flows');
      }
      if (content.includes('analytics') || content.includes('reporting')) {
        areasToInvestigate.add('analytics and reporting capabilities');
      }
      if (content.includes('mobile') || content.includes('app')) {
        areasToInvestigate.add('mobile experience');
      }
      
      targetedAreas.investigationAreas = Array.from(areasToInvestigate);
      
      // Set intelligent priorities based on content
      const priorities = [];
      if (content.toLowerCase().includes('security') || content.toLowerCase().includes('compliance')) {
        priorities.push('security and compliance gaps');
      }
      if (content.toLowerCase().includes('performance') || content.toLowerCase().includes('slow')) {
        priorities.push('performance bottlenecks');
      }
      if (content.toLowerCase().includes('integration') || content.toLowerCase().includes('api')) {
        priorities.push('integration capabilities');
      }
      if (content.toLowerCase().includes('user experience') || content.toLowerCase().includes('ux')) {
        priorities.push('user experience limitations');
      }
      
      targetedAreas.priorities = priorities.length > 0 ? priorities : 
        ['technical implementation gaps', 'modernization opportunities'];
      
      // Extract specific tech gaps mentioned
      const techGaps = [];
      if (content.includes('legacy')) {
        techGaps.push('legacy system limitations');
      }
      if (content.includes('manual')) {
        techGaps.push('manual processes needing automation');
      }
      if (content.includes('siloed') || content.includes('disconnected')) {
        techGaps.push('system integration gaps');
      }
      
      targetedAreas.techGaps = techGaps;
      
    } catch (error) {
      console.error('Failed to parse analysis:', error);
      // Fallback to comprehensive technical analysis
      targetedAreas.recommendedTools = ['technical_analysis', 'crawl4ai_extractor', 'website_analyzer'];
      targetedAreas.priorities = ['technical architecture', 'implementation gaps'];
    }
    
    console.log('📋 Analysis complete. Identified areas for targeted research:', targetedAreas);
    
    return {
      metadata: {
        ...state.metadata,
        findingsAnalyzed: true,
        targetedResearchPlan: targetedAreas,
        currentIteration: 0,
      },
    };
  };
}

// Create evaluate progress node - decides whether to continue gathering evidence
export function createEvaluateProgressNode(model: ChatOpenAI) {
  return async (state: ResearchState): Promise<Partial<ResearchState>> => {
    console.log('📊 Evaluating Evidence Gathering Progress...');
    
    const { evidence, metadata } = state;
    const currentIteration = metadata?.currentIteration || 0;
    const maxIterations = metadata?.maxTargetedIterations || 5;
    const targetPlan = metadata?.targetedResearchPlan || {};
    
    // Check if we should continue
    const shouldContinue = currentIteration < maxIterations && 
                          evidence.length < 2000 && // Max evidence cap
                          ((targetPlan as any).priorities?.length > currentIteration);
    
    console.log(`  Iteration ${currentIteration}/${maxIterations}`);
    console.log(`  Evidence collected: ${evidence.length}`);
    console.log(`  Continue gathering: ${shouldContinue}`);
    
    return {
      metadata: {
        ...metadata,
        shouldContinueGathering: shouldContinue,
        currentIteration: currentIteration + 1,
      },
    };
  };
}

// Create the main evidence gathering agent node
export function createEvidenceGatheringAgent(model: ChatOpenAI) {
  return async (state: ResearchState): Promise<Partial<ResearchState>> => {
    console.log('🤖 LangGraph Targeted Evidence Gathering Agent Started');
    
    const { thesis, researchQuestions, metadata, evidence: existingEvidence } = state;
    const company = thesis.company;
    const website = thesis.website;
    const targetPlan = metadata?.targetedResearchPlan || {};
    const currentIteration = metadata?.currentIteration || 0;
    
    // Get current priority from the targeted research plan
    const currentPriority = (targetPlan as any).priorities?.[currentIteration] || 'general investigation';
    const recommendedTools = (targetPlan as any).recommendedTools || [];
    
    console.log(`  📎 Current iteration: ${currentIteration}`);
    console.log(`  🎯 Current priority: ${currentPriority}`);
    console.log(`  🛠️ Recommended tools: ${recommendedTools.join(', ')}`);
    
    // Parse context from thesis for tool selection
    const thesisStatement = thesis.statement || '';
    const customThesis = (metadata as any)?.customThesis || '';
    const reportType = thesis.type || metadata?.reportType || 'sales-intelligence';
    
    // Build context-aware system message based on thesis
    let contextGuidance = '';
    if (reportType === 'sales-intelligence') {
      // Parse vendor context from thesis
      const vendorMatch = (customThesis || thesisStatement).match(/^(\w+)\s+can\s+help\s+.+\s+with\s+(.+)$/i);
      const vendor = vendorMatch?.[1] || '';
      const productsString = vendorMatch?.[2] || '';
      const products = productsString ? productsString.split(/,\s*/).map((p: any) => p.trim()) : [];
      
      if (vendor && products.length > 0) {
        contextGuidance = `
      
Vendor Context from Thesis:
- You are researching opportunities for ${vendor}
- Their products/services: ${products.join(', ')}
- Target company: ${company}

Prioritize finding evidence that shows:
- Pain points that ${vendor}'s solutions can address
- Technology gaps where ${products.join(' or ')} would fit
- Strategic initiatives at ${company} that align with ${vendor}'s offerings`;
      }
    } else if (reportType === 'pe-due-diligence') {
      // Parse PE focus from thesis
      const focusMatch = (customThesis || thesisStatement).match(/focusing on\s+(.+)$/i);
      const focusAreas = focusMatch?.[1]?.split(/\s+and\s+/) || [];
      
      if (focusAreas.length > 0) {
        contextGuidance = `

PE Investment Focus from Thesis:
- Evaluating ${company} for investment
- Focus areas: ${focusAreas.join(', ')}

Prioritize finding evidence about:
- Current state and potential in ${focusAreas.join(' and ')}
- Investment risks and opportunities
- Competitive positioning and market dynamics
- Scalability and growth potential`;
      }
    }
    
    // Construct the system message for targeted research with intelligent reasoning
    const systemMessage = new SystemMessage(`You are an intelligent technical research agent conducting TARGETED DEEP DIVES.
    
Company: ${company}
Website: ${website}
Current Focus: ${currentPriority}
Recommended Tools: ${recommendedTools.join(', ')}
Evidence Already Collected: ${existingEvidence.length} pieces
${contextGuidance}

CRITICAL THINKING APPROACH:

1. ANALYZE THE EVIDENCE to identify specific opportunities:
   - Review the ${existingEvidence.length} pieces of evidence we already have
   - Identify specific business initiatives, pain points, or transformation areas mentioned
   - Map these to specific website sections or functionality that would demonstrate current state

2. USE TECHNICAL TOOLS INTELLIGENTLY:
   The recommended tools (${recommendedTools.join(', ')}) are powerful - use them strategically:
   
   - crawl4ai_extractor: Target specific pages that implement key business functions
     Think: What pages would show how they currently handle the pain points we discovered?
     Extract: HTML structure, forms, JavaScript, tracking codes, technology fingerprints
   
   - technical_analysis: Perform deep infrastructure analysis on critical pages
     Think: What technical limitations might be holding back their initiatives?
     Analyze: Performance metrics, API patterns, security posture, integration points
   
   - security_scanner: Focus on pages handling sensitive operations
     Think: What security gaps might impact their transformation goals?
     Scan: Authentication flows, data handling, compliance indicators
   
   - website_analyzer: Use for comprehensive multi-page analysis
     Think: How does their tech stack vary across different business lines?
     Examine: Technology consistency, modernization gaps, integration opportunities

3. CONNECT TECHNICAL FINDINGS TO BUSINESS VALUE:
   For each technical discovery, reason about:
   - How does this current implementation limit their stated goals?
   - What specific improvements could modern solutions provide?
   - Where are the integration points for enhanced capabilities?

4. PRIORITIZE DEPTH OVER BREADTH:
   - We already have ${existingEvidence.length} pieces of broad evidence
   - Now we need SPECIFIC TECHNICAL PROOF POINTS
   - Each tool use should reveal something actionable, not just general information
   
REMEMBER: You're not just collecting data - you're building a technical case for transformation.
Use your reasoning to identify WHERE to look deeply and WHAT technical evidence would be most valuable.`);

    // Construct the user message with research questions
    const userMessage = new HumanMessage(`Please gather evidence to answer these research questions:
${researchQuestions?.map((q, i) => `${i + 1}. ${q.question}`).join('\n') || 'No specific research questions defined.'}

Start with a comprehensive website analysis, then search for specific information about their technology initiatives.`);

    // Create agent with tools
    const agentWithTools = model.bindTools(tools);
    
    // Execute the agent
    const response = await agentWithTools.invoke([systemMessage, userMessage]);
    
    // Process tool calls and gather evidence
    const evidence: Evidence[] = [];
    const toolMessages: BaseMessage[] = [];
    
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`📊 Agent executing ${response.tool_calls.length} tool calls`);
      
      for (const toolCall of response.tool_calls) {
        console.log(`  🔧 Calling tool: ${toolCall.name}`);
        
        // Find and execute the tool
        const tool = tools.find(t => t.name === toolCall.name);
        let toolResult: string;
        
        if (tool) {
          try {
            toolResult = await tool.func(toolCall.args as any);
            
            // Extract evidence based on tool type
            if (toolCall.name === 'web_search') {
              try {
                const searchResponse = JSON.parse(toolResult);
                
                // If it's a full Perplexity response, extract all evidence
                if (searchResponse.citations || searchResponse.search_results || searchResponse.choices) {
                  const extractedEvidence = EvidenceExtractor.extractFromPerplexityResponse(
                    searchResponse,
                    toolCall.args.query,
                    researchQuestions?.[0]?.id || 'general'
                  );
                  
                  console.log(`    📄 Extracted ${extractedEvidence.length} evidence pieces from Perplexity`);
                  evidence.push(...extractedEvidence);
                } else if (Array.isArray(searchResponse)) {
                  // Regular search results - create evidence for each
                  searchResponse.forEach((result, index) => {
                    evidence.push({
                      id: `${toolCall.id}_${index}`,
                      researchQuestionId: researchQuestions?.[0]?.id || 'general',
                      pillarId: 'search-result',
                      source: {
                        type: 'web' as const,
                        name: result.title || 'Search Result',
                        url: result.url,
                        publishDate: result.publishedDate ? new Date(result.publishedDate) : new Date(),
                        author: new URL(result.url).hostname,
                        credibilityScore: result.relevanceScore || 0.8,
                      },
                      content: JSON.stringify(result),
                      metadata: {
                        extractedAt: new Date(),
                        extractionMethod: 'web_search',
                        wordCount: (result.snippet || '').length,
                        language: 'en',
                        keywords: [],
                        confidence: 0.8,
                      },
                      qualityScore: {
                        overall: 0.8,
                        components: {
                          relevance: result.relevanceScore || 0.8,
                          credibility: 0.8,
                          recency: 0.9,
                          specificity: 0.75,
                          bias: 0.2,
                          depth: 0.7,
                        },
                        reasoning: `Search result rank ${index + 1}`,
                      },
                      createdAt: new Date(),
                    });
                  });
                }
              } catch (parseError) {
                console.error('Failed to parse search results:', parseError);
              }
            } else if (toolCall.name === 'website_analyzer') {
              try {
                const analyzerResult = JSON.parse(toolResult);
                
                // Extract evidence for each crawled page
                if (analyzerResult.pages && Array.isArray(analyzerResult.pages)) {
                  analyzerResult.pages.forEach((page: any, index: number) => {
                    evidence.push({
                      id: `${toolCall.id}_page_${index}`,
                      researchQuestionId: researchQuestions?.[0]?.id || 'general',
                      pillarId: 'webpage',
                      source: {
                        type: 'web' as const,
                        name: page.data?.title || `Page from ${company}`,
                        url: page.url || website,
                        publishDate: new Date(),
                        author: company,
                        credibilityScore: 0.9,
                      },
                      content: JSON.stringify(page),
                      metadata: {
                        extractedAt: new Date(),
                        extractionMethod: 'website_crawler',
                        wordCount: JSON.stringify(page).length,
                        language: 'en',
                        keywords: [],
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
                          depth: 0.85,
                        },
                        reasoning: 'Direct crawl of company website',
                      },
                      createdAt: new Date(),
                    });
                  });
                }
                
                // Also add technology stack as evidence
                if (analyzerResult.technologyStack) {
                  evidence.push({
                    id: `${toolCall.id}_tech`,
                    researchQuestionId: researchQuestions?.[0]?.id || 'general',
                    pillarId: 'technical',
                    source: {
                      type: 'web' as const,
                      name: 'Technology Stack Analysis',
                      url: website,
                      publishDate: new Date(),
                      author: 'Tech Detector',
                      credibilityScore: 0.95,
                    },
                    content: JSON.stringify(analyzerResult.technologyStack),
                    metadata: {
                      extractedAt: new Date(),
                      extractionMethod: 'tech_detection',
                      wordCount: JSON.stringify(analyzerResult.technologyStack).length,
                      language: 'en',
                      keywords: [],
                      confidence: 0.95,
                    },
                    qualityScore: {
                      overall: 0.95,
                      components: {
                        relevance: 0.95,
                        credibility: 0.95,
                        recency: 1.0,
                        specificity: 0.95,
                        bias: 0.05,
                        depth: 0.9,
                      },
                      reasoning: 'Technical analysis of website infrastructure',
                    },
                    createdAt: new Date(),
                  });
                }
              } catch (parseError) {
                console.error('Failed to parse website analysis:', parseError);
              }
            } else {
              // Default evidence for other tools
              evidence.push({
                id: `${toolCall.id}`,
                researchQuestionId: researchQuestions?.[0]?.id || 'general',
                pillarId: 'technical',
                source: {
                  type: 'web' as const,
                  name: toolCall.name,
                  url: website,
                  publishDate: new Date(),
                  author: 'LangGraph Agent',
                  credibilityScore: 0.85,
                },
                content: toolResult,
                metadata: {
                  extractedAt: new Date(),
                  extractionMethod: toolCall.name,
                  wordCount: toolResult.length,
                  language: 'en',
                  keywords: [],
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
                    depth: 0.8,
                  },
                  reasoning: 'Direct tool execution',
                },
                createdAt: new Date(),
              });
            }
          } catch (error) {
            console.error(`  ❌ Tool ${toolCall.name} failed:`, error);
            toolResult = JSON.stringify({
              error: error instanceof Error ? error.message : 'Tool execution failed',
              tool: toolCall.name,
              args: toolCall.args,
            });
          }
        } else {
          toolResult = JSON.stringify({
            error: `Tool ${toolCall.name} not found`,
            tool: toolCall.name,
          });
        }
        
        // Create tool message for LangGraph (required for all tool calls)
        // Limit content to prevent token overflow
        let toolMessageContent = toolResult;
        if (toolResult.length > 1000) {
          try {
            const parsed = JSON.parse(toolResult);
            toolMessageContent = JSON.stringify({
              summary: `Tool ${toolCall.name} completed successfully`,
              itemsProcessed: parsed.length || parsed.pagesAnalyzed || parsed.searchResults?.length || 1,
              type: toolCall.name,
            });
          } catch {
            toolMessageContent = `Tool ${toolCall.name} completed. Result truncated due to size (${toolResult.length} chars).`;
          }
        }
        
        toolMessages.push({
          role: 'tool',
          content: toolMessageContent,
          tool_call_id: toolCall.id,
          name: toolCall.name,
        } as any);
      }
    }
    
    // Process evidence in chunks to avoid token limits
    const synthesisResults: string[] = [];
    
    // Group evidence by type and priority for better organization
    const evidenceByType = evidence.reduce((acc, ev) => {
      const type = ev.pillarId || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(ev);
      return acc;
    }, {} as Record<string, Evidence[]>);
    
    console.log(`📊 Processing ${evidence.length} evidence pieces intelligently...`);
    console.log(`   Evidence by type:`, Object.entries(evidenceByType).map(([type, items]) => `${type}: ${items.length}`).join(', '));
    
    // Priority order for processing evidence types
    const priorityOrder = ['research', 'webpage', 'technical', 'citation', 'search-result', 'summary'];
    const sortedTypes = Object.keys(evidenceByType).sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
    
    // Process each evidence type with dynamic chunk sizing
    for (const evidenceType of sortedTypes) {
      const typeEvidence = evidenceByType[evidenceType];
      
      // Dynamic chunk size based on evidence type and content
      const CHUNK_SIZE = evidenceType === 'research' ? 10 : // Perplexity responses are large
                        evidenceType === 'webpage' ? 20 :   // Web pages are medium
                        evidenceType === 'citation' ? 100 :  // Citations are small
                        50; // Default
      
      // Sort evidence by quality score for each type
      typeEvidence.sort((a, b) => (b.qualityScore?.overall || 0) - (a.qualityScore?.overall || 0));
      
      for (let i = 0; i < typeEvidence.length; i += CHUNK_SIZE) {
        const chunk = typeEvidence.slice(i, i + CHUNK_SIZE);
        const chunkNum = Math.floor(i/CHUNK_SIZE) + 1;
        const totalChunks = Math.ceil(typeEvidence.length/CHUNK_SIZE);
        
        console.log(`   Processing ${evidenceType} chunk ${chunkNum}/${totalChunks} (${chunk.length} items)`);
        
        // Create a more intelligent summary of this chunk
        const chunkContent = chunk.map(ev => {
          const source = ev.source;
          let content = '';
          try {
            const parsed = JSON.parse(ev.content);
            
            // Extract the most relevant content based on type
            if (evidenceType === 'research' && parsed.choices?.[0]?.message?.content) {
              // For Perplexity responses, get key insights
              content = parsed.choices[0].message.content.substring(0, 500) + '...';
            } else if (evidenceType === 'webpage') {
              // For web pages, get title and key sections
              content = `${parsed.title || ''} - ${parsed.headings?.join(', ') || ''}`;
            } else {
              content = parsed.snippet || parsed.title || parsed.summary || ev.content.substring(0, 200);
            }
          } catch {
            content = ev.content.substring(0, 200);
          }
          
          return {
            source: source.name,
            url: source.url,
            content: content,
            score: ev.qualityScore?.overall || 0,
          };
        });
        
        // Create structured prompt for synthesis
        const chunkMessage = new HumanMessage(`Analyze these ${evidenceType} findings about ${company}:

${chunkContent.map(item => `
Source: ${item.source} (Score: ${item.score})
URL: ${item.url}
Content: ${item.content}
`).join('\n---\n')}

Focus on:
1. Technology gaps and modernization opportunities
2. Current pain points or challenges
3. Competitive positioning
4. Potential for ${metadata?.salesContext?.offering || 'digital transformation'}`);
        
        try {
          const chunkSynthesis = await model.invoke([
            new SystemMessage(`You are analyzing evidence about ${company} for a sales intelligence report. 
            This is ${evidenceType} evidence, chunk ${chunkNum} of ${totalChunks}.
            Be concise but capture all important insights, especially technology gaps and opportunities.`),
            chunkMessage,
          ]);
          
          if (chunkSynthesis.content) {
            synthesisResults.push(`${evidenceType.toUpperCase()} INSIGHTS (Part ${chunkNum}/${totalChunks}):\n${chunkSynthesis.content}`);
          }
        } catch (error) {
          console.error(`   ❌ Failed to synthesize ${evidenceType} chunk:`, error);
          
          // If chunk is still too large, split it further
          if (error instanceof Error && error.message?.includes('context length')) {
            console.log(`   🔄 Chunk too large, splitting further...`);
            const subChunkSize = Math.floor(CHUNK_SIZE / 2);
            for (let j = 0; j < chunk.length; j += subChunkSize) {
              const subChunk = chunk.slice(j, j + subChunkSize);
              // Process sub-chunk with minimal content
              const miniSummary = `${evidenceType}: ${subChunk.length} items from ${subChunk[0].source.name}`;
              synthesisResults.push(miniSummary);
            }
          }
        }
      }
    }
    
    // Final synthesis combining all chunk summaries
    console.log(`🔄 Creating final synthesis from ${synthesisResults.length} chunk summaries...`);
    const finalSynthesisMessage = new HumanMessage(`Based on these findings about ${company}, provide a comprehensive summary of their digital presence and key opportunities for improvement:\n\n${synthesisResults.join('\n\n')}`);
    
    const finalSynthesis = await model.invoke([
      new SystemMessage(`You are creating a final synthesis for a sales intelligence report about ${company}. Focus on actionable insights and opportunities.`),
      finalSynthesisMessage,
    ]);
    
    // Add synthesis as evidence
    if (finalSynthesis.content) {
      evidence.push({
        id: 'synthesis',
        researchQuestionId: 'synthesis',
        pillarId: 'summary',
        source: {
          type: 'web' as const,
          name: 'LangGraph Synthesis',
          url: website,
          publishDate: new Date(),
          author: 'AI Agent',
          credibilityScore: 0.85,
        },
        content: finalSynthesis.content.toString(),
        metadata: {
          extractedAt: new Date(),
          extractionMethod: 'AI Synthesis',
          wordCount: finalSynthesis.content.toString().length,
          language: 'en',
          keywords: [],
          confidence: 0.85,
          chunkCount: synthesisResults.length,
        } as any,
        qualityScore: {
          overall: 0.85,
          components: {
            relevance: 0.9,
            credibility: 0.8,
            recency: 1.0,
            specificity: 0.8,
            bias: 0.2,
            depth: 0.85,
          },
          reasoning: 'AI synthesis of gathered evidence',
        },
        createdAt: new Date(),
      });
    }
    
    console.log(`✅ Evidence gathering complete: ${evidence.length} pieces collected`);
    
    return {
      evidence: [...(state.evidence || []), ...evidence],
      metadata: {
        ...state.metadata,
        evidenceGatheringComplete: true,
        toolsUsed: response.tool_calls?.map(tc => tc.name) || [],
      },
    };
  };
}

// Create the integrated LangGraph workflow with optional checkpointing
export function createIntegratedResearchGraph(enableCheckpointing: boolean = false) {
  const model = new ChatOpenAI({
    modelName: 'o4-mini-2025-04-16',
    temperature: 0.2,
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Create checkpointer if enabled
  const checkpointer = enableCheckpointing ? new MemorySaver() : undefined;
  
  // Define state channels
  const stateChannels = {
    thesis: {
      value: (old: any, next: any) => next ?? old,
      default: () => null,
    },
    researchQuestions: {
      value: (old: any[], next: any[]) => next ?? old,
      default: () => [],
    },
    evidence: {
      value: (old: any[], next: any[]) => next ?? old,
      default: () => [],
    },
    report: {
      value: (old: any, next: any) => next ?? old,
      default: () => null,
    },
    status: {
      value: (old: string, next: string) => next ?? old,
      default: () => 'initializing',
    },
    metadata: {
      value: (old: any, next: any) => ({ ...old, ...next }),
      default: () => ({}),
    },
  };
  
  const workflow = new StateGraph<ResearchState>({
    channels: stateChannels,
  } as any);
  
  // Import existing nodes (imported at top of file)
  // Using the imports already defined at the top
  
  // Add nodes
  workflow.addNode('interpret_thesis', interpretThesisNode);
  workflow.addNode('generate_queries', generateQueriesNode);
  workflow.addNode('deep_research', createDeepResearchNode(model));
  workflow.addNode('analyze_findings', createAnalyzeFindingsNode(model));
  workflow.addNode('gather_evidence', createEvidenceGatheringAgent(model));
  workflow.addNode('evaluate_progress', createEvaluateProgressNode(model));
  workflow.addNode('generate_report', generateReportNode);
  
  // Define edges
  (workflow as any).addEdge('__start__', 'interpret_thesis');
  (workflow as any).addEdge('interpret_thesis', 'generate_queries');
  (workflow as any).addEdge('generate_queries', 'deep_research');
  (workflow as any).addEdge('deep_research', 'analyze_findings');
  (workflow as any).addEdge('analyze_findings', 'gather_evidence');
  (workflow as any).addEdge('gather_evidence', 'evaluate_progress');
  
  // Conditional edge for the iterative loop
  (workflow as any).addConditionalEdges(
    'evaluate_progress',
    (state: ResearchState) => {
      return state.metadata?.shouldContinueGathering ? 'gather_evidence' : 'generate_report';
    },
    {
      'gather_evidence': 'gather_evidence',
      'generate_report': 'generate_report',
    }
  );
  
  (workflow as any).addEdge('generate_report', END);
  
  // Compile with checkpointer if provided
  return workflow.compile(checkpointer ? { checkpointer } : undefined);
}

// Configuration for checkpointing
export interface CheckpointConfig {
  enabled: boolean;
  threadId?: string; // Thread ID for resuming
  checkpointId?: string; // Specific checkpoint to resume from
}

// Main function to run integrated research with checkpoint support
export async function runIntegratedResearch(
  company: string,
  website: string,
  reportType: string = 'sales-intelligence',
  metadata?: any,
  checkpointConfig?: CheckpointConfig
) {
  const graph = createIntegratedResearchGraph(checkpointConfig?.enabled || false);
  
  // Create thread ID for checkpointing
  const threadId = checkpointConfig?.threadId || `research-${company}-${Date.now()}`;
  
  // Use custom thesis if provided, otherwise generate a default
  const thesisStatement = metadata?.customThesis || 
    (reportType === 'sales-intelligence' 
      ? `Analyze ${company} for digital transformation opportunities and technology modernization needs.`
      : `Evaluate ${company} as a potential private equity investment opportunity.`);
  
  const initialState: ResearchState = {
    thesis: {
      id: Date.now().toString(),
      company,
      website,
      type: reportType as any,
      statement: thesisStatement,
      pillars: [],
      successCriteria: [],
      riskFactors: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    researchQuestions: [],
    evidence: [],
    qualityScores: {},
    reportSections: {},
    citations: [],
    iterationCount: 0,
    maxIterations: 1, // Single pass for now
    status: 'initializing',
    errors: [],
    metadata: {
      ...metadata,
      reportType,
      integrated: true,
      maxTargetedIterations: 5, // Maximum iterations for targeted evidence gathering
      currentIteration: 0,
      customThesis: metadata?.customThesis, // Ensure customThesis is preserved
    },
  };
  
  try {
    // Configure for checkpointing if enabled
    const runConfig = checkpointConfig?.enabled ? {
      configurable: {
        thread_id: threadId,
        checkpoint_id: checkpointConfig.checkpointId // Resume from specific checkpoint if provided
      }
    } : undefined;
    
    // Run the graph with checkpoint support
    const result = await graph.invoke(initialState, runConfig);
    
    // If checkpointing is enabled, save the thread ID for future reference
    if (checkpointConfig?.enabled) {
      console.log(`🔖 Checkpoint enabled. Thread ID: ${threadId}`);
      console.log(`   Resume with: --thread-id="${threadId}"`);
    }
    
    return result;
  } catch (error) {
    console.error('Integrated research failed:', error);
    throw error;
  }
}

// Helper function to get checkpoint state
export async function getCheckpointState(
  threadId: string,
  checkpointId?: string
) {
  const graph = createIntegratedResearchGraph(true);
  
  try {
    const config = {
      configurable: {
        thread_id: threadId,
        checkpoint_id: checkpointId
      }
    };
    
    // Get the current state from checkpoint
    const state = await graph.getState(config);
    return state;
  } catch (error) {
    console.error('Failed to get checkpoint state:', error);
    throw error;
  }
}

// Helper function to list available checkpoints
export async function listCheckpoints(threadId: string) {
  const graph = createIntegratedResearchGraph(true);
  
  try {
    const config = {
      configurable: {
        thread_id: threadId
      }
    };
    
    // List all checkpoints for this thread
    const checkpoints = [];
    const checkpointIterator = graph.getStateHistory(config);
    
    for await (const checkpoint of checkpointIterator) {
      checkpoints.push({
        checkpoint_id: checkpoint.config?.configurable?.checkpoint_id,
        created_at: (checkpoint as any).created_at || checkpoint.createdAt,
        metadata: checkpoint.metadata
      });
    }
    
    return checkpoints;
  } catch (error) {
    console.error('Failed to list checkpoints:', error);
    throw error;
  }
}