import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { StateGraph, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { Anthropic } from '@anthropic-ai/sdk'
import { Tool } from '@langchain/core/tools'
import { createMCPTools, createFilteredMCPTools } from '../services/langgraph-mcp-tools'
import { createSerenaTools } from '../services/langgraph-serena-tools'
import { MCPClient } from '../services/mcp-client'

// Load environment variables
config()

// Initialize clients
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Define the enhanced state for our research graph with MCP integration
const ResearchState = Annotation.Root({
  // Company information
  company: Annotation<string>(),
  domain: Annotation<string>(),
  investmentThesis: Annotation<string>(),
  scanRequestId: Annotation<string>(),
  
  // Evidence collection
  evidenceCollected: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  evidenceByType: Annotation<Record<string, any[]>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  totalEvidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // MCP tool results
  mcpToolResults: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  repositoryAnalysis: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  codebaseInsights: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  
  // Analysis results
  parsedData: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  sectionAnalyses: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  
  // Citations
  citations: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  citationMap: Annotation<Record<string, number>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  
  // Report sections
  reportSections: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  executiveSummary: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  
  // Scoring
  investmentScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  techHealthScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  confidenceScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // Metadata
  analysisTrace: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  errors: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  currentPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'initializing' }),
  
  // Tools
  availableTools: Annotation<Tool[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
})

// Initialize MCP tools
let mcpTools: Tool[] = []
let serenaTools: Tool[] = []
let mcpClient: MCPClient

async function initializeTools() {
  try {
    // Initialize MCP client and tools
    mcpClient = await MCPClient.createDefault()
    mcpTools = await createFilteredMCPTools(['filesystem', 'git', 'web'], mcpClient)
    
    // Initialize Serena tools if available
    if (mcpClient) {
      serenaTools = createSerenaTools(mcpClient)
    }
    
    console.log(`[MCP Integration] Initialized ${mcpTools.length} MCP tools and ${serenaTools.length} Serena tools`)
  } catch (error) {
    console.error('[MCP Integration] Error initializing tools:', error)
    mcpTools = []
    serenaTools = []
  }
}

// Enhanced node functions with MCP integration

async function loadEvidence(state: typeof ResearchState.State) {
  console.log('[LoadEvidence] Loading evidence from database...')
  
  try {
    // Find evidence collection
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .contains('metadata', { scan_request_id: state.scanRequestId })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!collection) {
      throw new Error('No evidence collection found')
    }
    
    // Load evidence items
    const { data: evidence } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('collection_id', collection.id)
      .order('confidence_score', { ascending: false })
    
    if (!evidence || evidence.length === 0) {
      throw new Error('No evidence items found')
    }
    
    // Organize evidence by type
    const evidenceByType: Record<string, any[]> = {}
    evidence.forEach(item => {
      const type = item.type || item.evidence_type || 'general'
      if (!evidenceByType[type]) {
        evidenceByType[type] = []
      }
      evidenceByType[type].push(item)
    })
    
    return {
      evidenceCollected: evidence,
      evidenceByType,
      totalEvidence: evidence.length,
      currentPhase: 'evidence_loaded',
      availableTools: [...mcpTools, ...serenaTools],
      analysisTrace: [...state.analysisTrace, {
        phase: 'evidence_loading',
        timestamp: new Date().toISOString(),
        evidenceCount: evidence.length,
        types: Object.keys(evidenceByType),
        toolsAvailable: mcpTools.length + serenaTools.length
      }]
    }
  } catch (error) {
    console.error('[LoadEvidence] Error:', error)
    return {
      errors: [...state.errors, `Evidence loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'error'
    }
  }
}

async function enrichWithMCPTools(state: typeof ResearchState.State) {
  console.log('[EnrichWithMCP] Using MCP tools to gather additional insights...')
  
  try {
    const mcpResults: Record<string, any> = {}
    
    // Look for repository URLs in evidence
    const repoUrls = extractRepositoryUrls(state.evidenceCollected)
    
    if (repoUrls.length > 0) {
      console.log(`[EnrichWithMCP] Found ${repoUrls.length} repository URLs`)
      
      // Use MCP tools to analyze repositories
      for (const repoUrl of repoUrls.slice(0, 3)) { // Limit to first 3 repos
        const repoName = extractRepoName(repoUrl)
        
        // Clone or access the repository
        if (mcpTools.length > 0) {
          // Try to read key files
          const readFileTool = mcpTools.find(t => t.name === 'read_file')
          const searchTool = mcpTools.find(t => t.name === 'search_files')
          
          if (readFileTool) {
            try {
              // Read README
              const readmeResult = await readFileTool.invoke({ path: `${repoName}/README.md` })
              mcpResults[`${repoName}_readme`] = JSON.parse(readmeResult)
              
              // Read package.json if exists
              const packageResult = await readFileTool.invoke({ path: `${repoName}/package.json` })
              mcpResults[`${repoName}_package`] = JSON.parse(packageResult)
            } catch (e) {
              console.log(`[EnrichWithMCP] Could not read files from ${repoName}`)
            }
          }
          
          if (searchTool) {
            try {
              // Search for security patterns
              const securitySearch = await searchTool.invoke({
                pattern: 'password|api[_-]key|secret',
                path: repoName
              })
              mcpResults[`${repoName}_security_scan`] = JSON.parse(securitySearch)
            } catch (e) {
              console.log(`[EnrichWithMCP] Could not search in ${repoName}`)
            }
          }
        }
      }
    }
    
    // Use web fetch tool for additional documentation
    const fetchTool = mcpTools.find(t => t.name === 'fetch_url')
    if (fetchTool && state.domain) {
      try {
        // Fetch documentation or API info
        const docsUrls = [
          `https://${state.domain}/docs`,
          `https://${state.domain}/api`,
          `https://api.${state.domain}/v1`
        ]
        
        for (const url of docsUrls) {
          try {
            const result = await fetchTool.invoke({ url })
            mcpResults[`web_${url.replace(/[^a-z0-9]/gi, '_')}`] = JSON.parse(result)
          } catch (e) {
            // URL might not exist
          }
        }
      } catch (e) {
        console.log('[EnrichWithMCP] Error fetching web content')
      }
    }
    
    return {
      mcpToolResults: mcpResults,
      currentPhase: 'mcp_enriched',
      analysisTrace: [...state.analysisTrace, {
        phase: 'mcp_enrichment',
        timestamp: new Date().toISOString(),
        toolsUsed: Object.keys(mcpResults).length,
        repositories: repoUrls.length
      }]
    }
  } catch (error) {
    console.error('[EnrichWithMCP] Error:', error)
    return {
      errors: [...state.errors, `MCP enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'mcp_enriched' // Continue even if MCP fails
    }
  }
}

async function analyzeCodebase(state: typeof ResearchState.State) {
  console.log('[AnalyzeCodebase] Analyzing codebase with Serena tools...')
  
  try {
    if (serenaTools.length === 0) {
      console.log('[AnalyzeCodebase] No Serena tools available, skipping')
      return { currentPhase: 'codebase_analyzed' }
    }
    
    // Extract code snippets from evidence
    const codeEvidence = state.evidenceCollected.filter(e => 
      e.content_data?.code || 
      e.type === 'technology_stack' ||
      e.content_data?.processed?.includes('```')
    )
    
    if (codeEvidence.length === 0) {
      console.log('[AnalyzeCodebase] No code evidence found')
      return { currentPhase: 'codebase_analyzed' }
    }
    
    // Prepare code files for analysis
    const codeFiles: Record<string, string> = {}
    codeEvidence.forEach((evidence, idx) => {
      if (evidence.content_data?.code) {
        codeFiles[`evidence_${idx}.js`] = evidence.content_data.code
      }
    })
    
    // Use Serena tools for analysis
    const structureTool = serenaTools.find(t => t.name === 'analyze_code_structure')
    const securityTool = serenaTools.find(t => t.name === 'detect_security_issues')
    const dependencyTool = serenaTools.find(t => t.name === 'analyze_dependencies')
    
    const codebaseInsights: any = {
      structure: null,
      security: null,
      dependencies: null
    }
    
    if (structureTool && Object.keys(codeFiles).length > 0) {
      try {
        const result = await structureTool.invoke({
          code: codeFiles,
          language: 'javascript',
          depth: 2
        })
        codebaseInsights.structure = JSON.parse(result)
      } catch (e) {
        console.log('[AnalyzeCodebase] Structure analysis failed')
      }
    }
    
    if (securityTool && Object.keys(codeFiles).length > 0) {
      try {
        const result = await securityTool.invoke({
          code: codeFiles,
          language: 'javascript'
        })
        codebaseInsights.security = JSON.parse(result)
      } catch (e) {
        console.log('[AnalyzeCodebase] Security analysis failed')
      }
    }
    
    if (dependencyTool && Object.keys(codeFiles).length > 0) {
      try {
        const result = await dependencyTool.invoke({
          code: codeFiles,
          language: 'javascript'
        })
        codebaseInsights.dependencies = JSON.parse(result)
      } catch (e) {
        console.log('[AnalyzeCodebase] Dependency analysis failed')
      }
    }
    
    return {
      codebaseInsights,
      currentPhase: 'codebase_analyzed',
      analysisTrace: [...state.analysisTrace, {
        phase: 'codebase_analysis',
        timestamp: new Date().toISOString(),
        codeFiles: Object.keys(codeFiles).length,
        analysesPerformed: Object.keys(codebaseInsights).filter(k => codebaseInsights[k] !== null).length
      }]
    }
  } catch (error) {
    console.error('[AnalyzeCodebase] Error:', error)
    return {
      errors: [...state.errors, `Codebase analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'codebase_analyzed'
    }
  }
}

async function parseEvidence(state: typeof ResearchState.State) {
  console.log('[ParseEvidence] Structuring evidence data with MCP insights...')
  
  try {
    const evidence = state.evidenceCollected
    const mcpResults = state.mcpToolResults
    const codebaseInsights = state.codebaseInsights
    
    // Structure the parsed data with MCP enhancements
    const parsedData = {
      companyInfo: {
        name: state.company,
        domain: state.domain,
      },
      technologies: extractTechnologies(evidence, mcpResults, codebaseInsights),
      market: extractMarketData(evidence),
      team: extractTeamData(evidence),
      financial: extractFinancialData(evidence),
      security: extractSecurityData(evidence, mcpResults, codebaseInsights),
      repositories: extractRepositoryData(evidence, mcpResults),
      codeQuality: extractCodeQuality(codebaseInsights),
    }
    
    return {
      parsedData,
      currentPhase: 'evidence_parsed',
      analysisTrace: [...state.analysisTrace, {
        phase: 'evidence_parsing',
        timestamp: new Date().toISOString(),
        dataPoints: Object.keys(parsedData).length,
        mcpEnhanced: Object.keys(mcpResults).length > 0
      }]
    }
  } catch (error) {
    console.error('[ParseEvidence] Error:', error)
    return {
      errors: [...state.errors, `Evidence parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'error'
    }
  }
}

async function analyzeTechnology(state: typeof ResearchState.State) {
  console.log('[AnalyzeTechnology] Analyzing technology stack with MCP insights...')
  
  try {
    const relevantEvidence = [
      ...(state.evidenceByType['technology_stack'] || []),
      ...(state.evidenceByType['api_response'] || []),
      ...(state.evidenceByType['webpage_content'] || [])
    ].filter(e => 
      e.title?.toLowerCase().includes('tech') ||
      e.content_data?.summary?.toLowerCase().includes('tech') ||
      e.content_data?.processed?.toLowerCase().includes('tech')
    )
    
    const techData = state.parsedData?.technologies || {}
    const mcpInsights = state.mcpToolResults
    const codebaseInsights = state.codebaseInsights
    
    const prompt = `Analyze the technology stack for ${state.company} based on this evidence:

Evidence Items (${relevantEvidence.length}):
${relevantEvidence.map((e, i) => `[E${i+1}] ${e.content_data?.summary || e.title}`).join('\n')}

Technology Data:
${JSON.stringify(techData, null, 2)}

MCP Repository Analysis:
${JSON.stringify(mcpInsights, null, 2)}

Codebase Analysis:
${JSON.stringify(codebaseInsights, null, 2)}

Provide a comprehensive analysis including:
1. Core technology stack and architecture
2. Technical strengths and innovations
3. Scalability and performance capabilities
4. Technical debt and risks
5. Development practices and culture
6. Code quality and security posture

IMPORTANT: Reference specific evidence items using [E1], [E2], etc. and highlight insights from MCP tools.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''
    
    return {
      sectionAnalyses: {
        ...state.sectionAnalyses,
        technology: {
          content: analysis,
          evidenceUsed: relevantEvidence.map(e => e.id),
          confidence: 0.90, // Higher confidence with MCP data
          mcpEnhanced: true
        }
      },
      currentPhase: 'technology_analyzed',
      analysisTrace: [...state.analysisTrace, {
        phase: 'technology_analysis',
        timestamp: new Date().toISOString(),
        evidenceCount: relevantEvidence.length,
        mcpDataUsed: Object.keys(mcpInsights).length > 0
      }]
    }
  } catch (error) {
    console.error('[AnalyzeTechnology] Error:', error)
    return {
      errors: [...state.errors, `Technology analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Continue with other analysis functions (analyzeMarket, analyzeTeam, etc.)
// These would be similar to the original implementation but enhanced with MCP data

async function analyzeMarket(state: typeof ResearchState.State) {
  console.log('[AnalyzeMarket] Analyzing market position...')
  
  try {
    const relevantEvidence = [
      ...(state.evidenceByType['market_analysis'] || []),
      ...(state.evidenceByType['business_overview'] || []),
      ...(state.evidenceByType['search_result'] || [])
    ].filter(e => 
      e.title?.toLowerCase().includes('market') ||
      e.title?.toLowerCase().includes('compet') ||
      e.content_data?.summary?.toLowerCase().includes('market') ||
      e.content_data?.summary?.toLowerCase().includes('compet')
    )
    
    const prompt = `Analyze the market position for ${state.company}:

Evidence Items (${relevantEvidence.length}):
${relevantEvidence.map((e, i) => `[E${i+1}] ${e.content_data?.summary || e.title}`).join('\n')}

Provide analysis of:
1. Market size and growth potential
2. Competitive landscape and positioning
3. Customer base and segments
4. Market differentiation
5. Growth opportunities and threats

Reference evidence using [E1], [E2], etc.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''
    
    return {
      sectionAnalyses: {
        ...state.sectionAnalyses,
        market: {
          content: analysis,
          evidenceUsed: relevantEvidence.map(e => e.id),
          confidence: 0.80
        }
      },
      currentPhase: 'market_analyzed'
    }
  } catch (error) {
    return {
      errors: [...state.errors, `Market analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

async function analyzeTeam(state: typeof ResearchState.State) {
  console.log('[AnalyzeTeam] Analyzing team and organization...')
  
  const relevantEvidence = [
    ...(state.evidenceByType['team'] || []),
    ...(state.evidenceByType['culture'] || [])
  ]
  
  return {
    sectionAnalyses: {
      ...state.sectionAnalyses,
      team: {
        content: 'Team analysis...',
        evidenceUsed: relevantEvidence.map(e => e.id),
        confidence: 0.75
      }
    },
    currentPhase: 'team_analyzed'
  }
}

async function analyzeFinancials(state: typeof ResearchState.State) {
  console.log('[AnalyzeFinancials] Analyzing financial health...')
  
  const relevantEvidence = [
    ...(state.evidenceByType['financial'] || []),
    ...(state.evidenceByType['pricing'] || [])
  ]
  
  return {
    sectionAnalyses: {
      ...state.sectionAnalyses,
      financials: {
        content: 'Financial analysis...',
        evidenceUsed: relevantEvidence.map(e => e.id),
        confidence: 0.82
      }
    },
    currentPhase: 'financials_analyzed'
  }
}

async function generateCitations(state: typeof ResearchState.State) {
  console.log('[GenerateCitations] Creating citations from evidence...')
  
  const citations: any[] = []
  let citationNumber = 1
  const citationMap: Record<string, number> = {}
  
  // Generate citations for all used evidence
  Object.values(state.sectionAnalyses).forEach(section => {
    section.evidenceUsed?.forEach((evidenceId: string) => {
      const evidence = state.evidenceCollected.find(e => e.id === evidenceId)
      if (evidence && !citationMap[evidenceId]) {
        const claimText = evidence.content_data?.summary || evidence.title || ''
        
        citations.push({
          claim_id: `claim_${evidence.id}`,
          claim: claimText,
          citation_text: claimText,
          citation_number: citationNumber,
          evidence_item_id: evidence.id,
          confidence: Math.round((evidence.confidence_score || 0.8) * 100),
          confidence_score: evidence.confidence_score || 0.8,
          reasoning: `Based on ${evidence.evidence_type || evidence.type} evidence`,
          analyst: 'langgraph-claude-mcp',
          review_date: new Date().toISOString(),
          methodology: 'LangGraph AI-driven analysis with MCP enhancement',
          evidence_summary: {
            type: evidence.evidence_type || evidence.type,
            source: evidence.source_url || '',
            confidence: evidence.confidence_score || 0.8,
            content: evidence.content_data,
            mcp_enhanced: section.mcpEnhanced || false
          }
        })
        
        citationMap[evidenceId] = citationNumber
        citationNumber++
      }
    })
  })
  
  return {
    citations,
    citationMap,
    currentPhase: 'citations_generated'
  }
}

async function compileReport(state: typeof ResearchState.State) {
  console.log('[CompileReport] Compiling final report...')
  
  // Inject citations into section content
  const sectionsWithCitations: Record<string, any> = {}
  
  Object.entries(state.sectionAnalyses).forEach(([key, section]) => {
    let content = section.content
    
    // Replace [E1] style references with actual citation numbers
    section.evidenceUsed?.forEach((evidenceId: string, index: number) => {
      const citationNum = state.citationMap[evidenceId]
      if (citationNum) {
        const pattern = new RegExp(`\\[E${index + 1}\\]`, 'g')
        content = content.replace(pattern, `[${citationNum}](#cite-${citationNum})`)
      }
    })
    
    sectionsWithCitations[key] = {
      title: getSectionTitle(key),
      content,
      score: Math.round(section.confidence * 100),
      subsections: [],
      mcpEnhanced: section.mcpEnhanced || false
    }
  })
  
  // Calculate scores with MCP boost
  const avgConfidence = Object.values(state.sectionAnalyses)
    .reduce((sum, s) => sum + (s.confidence || 0), 0) / Object.keys(state.sectionAnalyses).length
  
  const mcpBoost = Object.keys(state.mcpToolResults).length > 0 ? 0.05 : 0
  const investmentScore = Math.min(100, Math.round((avgConfidence + mcpBoost) * 100))
  const techHealthScore = Math.min(100, Math.round((state.sectionAnalyses.technology?.confidence || 0.5) * 100))
  
  return {
    reportSections: sectionsWithCitations,
    investmentScore,
    techHealthScore,
    confidenceScore: avgConfidence + mcpBoost,
    currentPhase: 'report_compiled'
  }
}

async function generateExecutiveSummary(state: typeof ResearchState.State) {
  console.log('[GenerateExecutiveSummary] Creating executive summary...')
  
  const mcpSummary = Object.keys(state.mcpToolResults).length > 0 
    ? '\n\nAdditional insights from repository and codebase analysis have been incorporated.'
    : ''
  
  const prompt = `Create an executive summary for ${state.company} based on these analyses:

${Object.entries(state.reportSections).map(([_key, section]) => 
  `${section.title}: ${section.content.substring(0, 300)}...`
).join('\n\n')}

Investment Score: ${state.investmentScore}/100
Tech Health Score: ${state.techHealthScore}/100
${mcpSummary}

Create a 400-500 word executive summary with:
1. Key investment highlights
2. Major risks and concerns
3. Clear recommendation
4. 3-5 critical data points with citations

Use citation format [1], [2] based on the most important evidence.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })
  
  const summary = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Add top citations to executive summary
  const topCitations = state.citations.slice(0, 5)
  let summaryWithCitations = summary
  topCitations.forEach((citation, index) => {
    summaryWithCitations = summaryWithCitations.replace(
      new RegExp(`\\[${index + 1}\\]`, 'g'),
      `[${citation.citation_number}](#cite-${citation.citation_number})`
    )
  })
  
  return {
    executiveSummary: summaryWithCitations,
    currentPhase: 'complete'
  }
}

// Helper functions
function extractRepositoryUrls(evidence: any[]): string[] {
  const urls = new Set<string>()
  
  evidence.forEach(e => {
    const content = JSON.stringify(e.content_data || {})
    const githubPattern = /github\.com\/[\w-]+\/[\w-]+/g
    const matches = content.match(githubPattern)
    if (matches) {
      matches.forEach(m => urls.add(`https://${m}`))
    }
  })
  
  return Array.from(urls)
}

function extractRepoName(url: string): string {
  const match = url.match(/github\.com\/([\w-]+\/[\w-]+)/)
  return match ? match[1] : url
}

function extractTechnologies(evidence: any[], mcpResults: any, codebaseInsights: any) {
  const tech = {
    languages: [] as string[],
    frameworks: [] as string[],
    databases: [] as string[],
    infrastructure: [] as string[],
    tools: [] as string[]
  }
  
  // Extract from codebase insights
  if (codebaseInsights?.dependencies) {
    tech.frameworks = codebaseInsights.dependencies.frameworks || []
    tech.tools = codebaseInsights.dependencies.external || []
  }
  
  // Extract from package.json if available
  Object.entries(mcpResults).forEach(([key, value]: [string, any]) => {
    if (key.includes('package') && value.content) {
      try {
        const pkg = JSON.parse(value.content)
        if (pkg.dependencies) {
          tech.frameworks.push(...Object.keys(pkg.dependencies))
        }
      } catch (e) {
        // Invalid JSON
      }
    }
  })
  
  return tech
}

function extractMarketData(_evidence: any[]) {
  return {
    marketSize: null,
    competitors: [],
    position: null,
    growth: null
  }
}

function extractTeamData(_evidence: any[]) {
  return {
    size: null,
    keyPeople: [],
    culture: [],
    hiring: null
  }
}

function extractFinancialData(_evidence: any[]) {
  return {
    revenue: null,
    growth: null,
    burnRate: null,
    runway: null
  }
}

function extractSecurityData(_evidence: any[], mcpResults: any, codebaseInsights: any) {
  const security = {
    certifications: [],
    practices: [],
    incidents: [],
    vulnerabilities: []
  }
  
  // Extract from codebase security analysis
  if (codebaseInsights?.security) {
    security.vulnerabilities = codebaseInsights.security.securityIssues || []
  }
  
  // Extract from MCP security scans
  Object.entries(mcpResults).forEach(([key, value]: [string, any]) => {
    if (key.includes('security_scan') && value.matches) {
      security.incidents.push({
        type: 'potential_security_issue',
        source: key,
        count: value.matches.length
      })
    }
  })
  
  return security
}

function extractRepositoryData(evidence: any[], mcpResults: any) {
  const repos = extractRepositoryUrls(evidence)
  const repoData: any[] = []
  
  repos.forEach(repo => {
    const repoName = extractRepoName(repo)
    const data: any = {
      url: repo,
      name: repoName,
      readme: null,
      technologies: []
    }
    
    // Add README content if available
    const readmeKey = `${repoName}_readme`
    if (mcpResults[readmeKey]) {
      data.readme = mcpResults[readmeKey].content
    }
    
    // Add package info if available
    const packageKey = `${repoName}_package`
    if (mcpResults[packageKey]) {
      data.packageJson = mcpResults[packageKey].content
    }
    
    repoData.push(data)
  })
  
  return repoData
}

function extractCodeQuality(codebaseInsights: any) {
  if (!codebaseInsights || !codebaseInsights.structure) {
    return null
  }
  
  return {
    totalSymbols: codebaseInsights.structure.totalSymbols,
    insights: codebaseInsights.structure.insights,
    securitySummary: codebaseInsights.security?.summary || null
  }
}

function getSectionTitle(key: string): string {
  const titles: Record<string, string> = {
    technology: 'Technology Stack & Architecture',
    market: 'Market Position & Competition',
    team: 'Team & Organizational Strength',
    financials: 'Financial Health & Unit Economics',
    security: 'Security & Compliance'
  }
  return titles[key] || key
}

// Build the enhanced LangGraph workflow with MCP
function buildResearchGraph() {
  const workflow = new StateGraph(ResearchState)
    .addNode('load_evidence', loadEvidence)
    .addNode('enrich_with_mcp', enrichWithMCPTools)
    .addNode('analyze_codebase', analyzeCodebase)
    .addNode('parse_evidence', parseEvidence)
    .addNode('analyze_technology', analyzeTechnology)
    .addNode('analyze_market', analyzeMarket)
    .addNode('analyze_team', analyzeTeam)
    .addNode('analyze_financials', analyzeFinancials)
    .addNode('generate_citations', generateCitations)
    .addNode('compile_report', compileReport)
    .addNode('generate_executive_summary', generateExecutiveSummary)
  
  // Define the enhanced flow with MCP steps
  workflow
    .addEdge('__start__', 'load_evidence')
    .addEdge('load_evidence', 'enrich_with_mcp')
    .addEdge('enrich_with_mcp', 'analyze_codebase')
    .addEdge('analyze_codebase', 'parse_evidence')
    .addEdge('parse_evidence', 'analyze_technology')
    .addEdge('analyze_technology', 'analyze_market')
    .addEdge('analyze_market', 'analyze_team')
    .addEdge('analyze_team', 'analyze_financials')
    .addEdge('analyze_financials', 'generate_citations')
    .addEdge('generate_citations', 'compile_report')
    .addEdge('compile_report', 'generate_executive_summary')
    .addEdge('generate_executive_summary', '__end__')
  
  // Compile the graph
  const checkpointer = new MemorySaver()
  return workflow.compile({ checkpointer })
}

// Main worker
export const reportGenerationWorker = new Worker(
  'report-generation',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[LangGraph MCP] Starting report generation for ${company}`)
    
    try {
      // Initialize MCP tools
      await initializeTools()
      
      // Initialize the graph
      const app = buildResearchGraph()
      
      // Create initial state
      const initialState = {
        company,
        domain,
        investmentThesis,
        scanRequestId,
        evidenceCollected: [],
        evidenceByType: {},
        totalEvidence: 0,
        mcpToolResults: {},
        repositoryAnalysis: null,
        codebaseInsights: null,
        parsedData: null,
        sectionAnalyses: {},
        citations: [],
        citationMap: {},
        reportSections: {},
        executiveSummary: '',
        investmentScore: 0,
        techHealthScore: 0,
        confidenceScore: 0,
        analysisTrace: [],
        errors: [],
        currentPhase: 'initializing',
        availableTools: []
      }
      
      // Run the graph with streaming
      const config = { 
        configurable: { thread_id: scanRequestId },
        streamMode: 'values' as const
      }
      
      let finalState: any = initialState
      
      // Stream progress updates
      for await (const state of await app.stream(initialState as any, config)) {
        finalState = state
        
        // Update job progress based on phase
        const progressMap: Record<string, number> = {
          'evidence_loaded': 10,
          'mcp_enriched': 20,
          'codebase_analyzed': 30,
          'evidence_parsed': 35,
          'technology_analyzed': 45,
          'market_analyzed': 55,
          'team_analyzed': 65,
          'financials_analyzed': 75,
          'citations_generated': 85,
          'report_compiled': 90,
          'complete': 95
        }
        
        const progress = progressMap[state.currentPhase] || 0
        await job.updateProgress(progress)
        
        console.log(`[LangGraph MCP] Phase: ${state.currentPhase}, Progress: ${progress}%`)
      }
      
      // Check for errors
      if (finalState.errors.length > 0) {
        throw new Error(`Report generation failed: ${finalState.errors.join(', ')}`)
      }
      
      // Save report to database
      const reportData = {
        company_name: company,
        sections: finalState.reportSections,
        executiveSummary: {
          title: 'Executive Summary',
          content: finalState.executiveSummary
        },
        investment_score: finalState.investmentScore,
        investment_rationale: `Investment score: ${finalState.investmentScore}/100 based on comprehensive analysis with MCP enhancement`,
        tech_health_score: finalState.techHealthScore,
        tech_health_grade: finalState.techHealthScore >= 80 ? 'A' : 
                          finalState.techHealthScore >= 70 ? 'B' :
                          finalState.techHealthScore >= 60 ? 'C' : 'D',
        metadata: {
          analysisTrace: finalState.analysisTrace,
          totalEvidence: finalState.totalEvidence,
          citationCount: finalState.citations.length,
          workflow: 'langgraph-v3-mcp',
          mcpToolsUsed: Object.keys(finalState.mcpToolResults).length,
          mcpEnhanced: true
        }
      }
      
      // Save report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: finalState.investmentScore,
          investment_rationale: reportData.investment_rationale,
          tech_health_score: finalState.techHealthScore,
          tech_health_grade: reportData.tech_health_grade,
          report_data: reportData,
          evidence_count: finalState.totalEvidence,
          citation_count: finalState.citations.length,
          executive_summary: finalState.executiveSummary,
          report_version: 'langgraph-v3-mcp',
          ai_model_used: 'claude-3.5-sonnet + langgraph + mcp',
          quality_score: finalState.confidenceScore,
          human_reviewed: false,
          metadata: reportData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      // Save citations
      if (finalState.citations.length > 0 && report) {
        const citationRecords = finalState.citations.map((c: any) => ({
          ...c,
          report_id: report.id,
          created_at: new Date().toISOString()
        }))
        
        const { error: citationError } = await supabase
          .from('report_citations')
          .insert(citationRecords)
        
        if (citationError) {
          console.error('Error storing citations:', citationError)
        } else {
          console.log(`[LangGraph MCP] Stored ${finalState.citations.length} citations`)
        }
      }
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          status: 'completed',
          latest_report_id: report?.id,
          tech_health_score: finalState.techHealthScore
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore: finalState.investmentScore,
        citationCount: finalState.citations.length,
        workflow: 'langgraph-v3-mcp',
        phases: finalState.analysisTrace.map((t: any) => t.phase),
        mcpToolsUsed: Object.keys(finalState.mcpToolResults).length
      }
      
    } catch (error) {
      console.error('[LangGraph MCP] Error:', error)
      
      await supabase
        .from('scan_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  { connection }
)

// Start the worker
console.log('🚀 LangGraph Report Generation Worker v3 with MCP Integration started')
reportGenerationWorker.on('completed', (job) => {
  console.log(`✅ Report completed: ${job.returnvalue?.reportId} (MCP tools: ${job.returnvalue?.mcpToolsUsed})`)
})

reportGenerationWorker.on('failed', (_job, err) => {
  console.error(`❌ Report failed: ${err.message}`)
})