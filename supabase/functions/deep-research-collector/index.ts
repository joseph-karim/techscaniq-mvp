import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigins = [
    'https://scan.techscaniq.com',
    'https://techscaniq.com', 
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ]
  
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  }
}

interface DeepResearchRequest {
  company: {
    name: string
    website: string
    description?: string
  }
  investmentThesis?: any
  researchDepth?: 'standard' | 'deep' | 'exhaustive'
  maxIterations?: number
}

interface ResearchEvidence {
  id: string
  type: string
  source: string
  content: string
  summary: string
  confidence: number
  relevance: number
  metadata: any
  timestamp: string
}

// Research agents for different aspects
const RESEARCH_AGENTS = {
  technical: {
    name: 'Technical Deep Dive Agent',
    queries: [
      '{company} technology stack site:github.com',
      '{company} engineering blog',
      '{company} API documentation',
      '{company} open source projects',
      '{company} technical architecture',
      '{company} microservices infrastructure',
      '{company} database technology',
      '{company} cloud infrastructure AWS Azure GCP',
      '{company} DevOps CI/CD pipeline',
      '{company} machine learning AI implementation'
    ]
  },
  business: {
    name: 'Business Intelligence Agent',
    queries: [
      '{company} revenue growth financial',
      '{company} market share industry analysis',
      '{company} customer case studies',
      '{company} pricing strategy model',
      '{company} competitive advantage moat',
      '{company} business model canvas',
      '{company} unit economics SaaS metrics',
      '{company} customer acquisition cost CAC LTV',
      '{company} partnerships integrations',
      '{company} international expansion'
    ]
  },
  team: {
    name: 'Team & Leadership Agent',
    queries: [
      '{company} leadership team site:linkedin.com',
      '{company} CTO CEO founder background',
      '{company} engineering team size growth',
      '{company} company culture values',
      '{company} employee reviews site:glassdoor.com',
      '{company} hiring engineering positions',
      '{company} team expertise patents',
      '{company} advisory board investors',
      '{company} technical leadership experience',
      '{company} employee retention benefits'
    ]
  },
  market: {
    name: 'Market Analysis Agent',
    queries: [
      '{company} market size TAM SAM SOM',
      '{company} industry trends forecast',
      '{company} competitors comparison',
      '{company} market position Gartner Forrester',
      '{company} customer segments ICP',
      '{company} market disruption innovation',
      '{company} regulatory compliance',
      '{company} industry challenges problems',
      '{company} market opportunity growth',
      '{company} competitive landscape analysis'
    ]
  },
  security: {
    name: 'Security & Compliance Agent',
    queries: [
      '{company} security vulnerabilities CVE',
      '{company} data breach incidents',
      '{company} SOC2 ISO27001 compliance',
      '{company} GDPR CCPA privacy',
      '{company} security architecture zero trust',
      '{company} penetration testing bug bounty',
      '{company} encryption data protection',
      '{company} security team CISO',
      '{company} compliance certifications',
      '{company} security best practices'
    ]
  },
  financial: {
    name: 'Financial Analysis Agent',
    queries: [
      '{company} funding rounds valuation',
      '{company} revenue growth rate YoY',
      '{company} burn rate runway',
      '{company} financial statements',
      '{company} investor deck pitch',
      '{company} profitability path',
      '{company} financial metrics KPIs',
      '{company} customer retention churn',
      '{company} pricing power economics',
      '{company} financial projections forecast'
    ]
  }
}

async function performAgenticSearch(
  company: string,
  query: string,
  agent: string
): Promise<ResearchEvidence[]> {
  const results: ResearchEvidence[] = []
  
  try {
    // Use Gemini's grounding feature for web search
    const apiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) throw new Error('Google API key not configured')
    
    const searchQuery = query.replace('{company}', company)
    console.log(`[${agent}] Searching: "${searchQuery}"`)
    
    // Call Gemini with grounding for real-time web search
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Research the following about ${company}: ${searchQuery}
              
              Provide detailed findings with:
              1. Specific facts and data points
              2. Source URLs when available
              3. Key insights and implications
              4. Confidence level in the information
              
              Focus on recent, credible information from authoritative sources.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          },
          tools: [{
            googleSearch: {}
          }]
        })
      }
    )
    
    if (!response.ok) {
      console.error(`[${agent}] Search failed:`, response.status)
      return results
    }
    
    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (content) {
      results.push({
        id: crypto.randomUUID(),
        type: `${agent}_research`,
        source: searchQuery,
        content: content,
        summary: content.substring(0, 200) + '...',
        confidence: 0.85,
        relevance: 0.9,
        metadata: {
          agent,
          query: searchQuery,
          model: 'gemini-2.0-flash-exp'
        },
        timestamp: new Date().toISOString()
      })
    }
    
    // Also try Jina for specific URL content if we have the website
    if (query.includes('site:') || agent === 'technical') {
      const jinaKey = Deno.env.get('JINA_API_KEY')
      if (jinaKey) {
        // Use Jina search for more results
        const jinaResponse = await fetch(`https://s.jina.ai/${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${jinaKey}`,
            'Accept': 'application/json'
          }
        })
        
        if (jinaResponse.ok) {
          const jinaData = await jinaResponse.json()
          if (jinaData.data) {
            results.push({
              id: crypto.randomUUID(),
              type: `${agent}_jina_search`,
              source: `Jina: ${searchQuery}`,
              content: jinaData.data,
              summary: jinaData.data.substring(0, 200) + '...',
              confidence: 0.8,
              relevance: 0.85,
              metadata: {
                agent,
                query: searchQuery,
                tool: 'jina_search'
              },
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    }
    
  } catch (error) {
    console.error(`[${agent}] Error in search:`, error)
  }
  
  return results
}

async function performIterativeResearch(
  company: DeepResearchRequest['company'],
  investmentThesis: any,
  maxIterations: number = 3
): Promise<ResearchEvidence[]> {
  const allEvidence: ResearchEvidence[] = []
  const researchTopics = new Set<string>()
  
  console.log(`Starting deep iterative research for ${company.name}`)
  console.log(`Max iterations: ${maxIterations}`)
  
  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    console.log(`\n=== Research Iteration ${iteration} ===`)
    
    // Run all agents in parallel for this iteration
    const agentPromises = Object.entries(RESEARCH_AGENTS).map(async ([agentKey, agent]) => {
      const agentResults: ResearchEvidence[] = []
      
      // Select queries based on iteration depth
      const queriesToRun = agent.queries.slice(
        (iteration - 1) * 3,
        iteration * 3
      )
      
      for (const query of queriesToRun) {
        if (!researchTopics.has(`${agentKey}:${query}`)) {
          researchTopics.add(`${agentKey}:${query}`)
          const results = await performAgenticSearch(company.name, query, agent.name)
          agentResults.push(...results)
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      return agentResults
    })
    
    const iterationResults = await Promise.all(agentPromises)
    const flatResults = iterationResults.flat()
    allEvidence.push(...flatResults)
    
    console.log(`Iteration ${iteration} collected ${flatResults.length} new evidence items`)
    
    // Analyze if we have enough high-quality evidence
    const highQualityEvidence = allEvidence.filter(e => 
      e.confidence > 0.8 && e.relevance > 0.8
    )
    
    if (highQualityEvidence.length > 50) {
      console.log('Sufficient high-quality evidence collected, ending research early')
      break
    }
  }
  
  return allEvidence
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const request: DeepResearchRequest = await req.json()
    console.log('Deep research request received:', request.company.name)
    
    const startTime = Date.now()
    const maxIterations = request.maxIterations || 
      (request.researchDepth === 'exhaustive' ? 5 : 
       request.researchDepth === 'deep' ? 3 : 2)
    
    // Perform deep iterative research
    const evidence = await performIterativeResearch(
      request.company,
      request.investmentThesis,
      maxIterations
    )
    
    // Store evidence in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Create evidence collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: request.company.name,
        collection_status: 'completed',
        evidence_count: evidence.length,
        evidence_types: evidence.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        metadata: {
          research_depth: request.researchDepth,
          iterations: maxIterations,
          duration: Date.now() - startTime,
          investment_thesis: request.investmentThesis
        }
      })
      .select()
      .single()
    
    if (collectionError) {
      console.error('Failed to create collection:', collectionError)
      throw collectionError
    }
    
    // Store evidence items
    const evidenceItems = evidence.map(e => ({
      collection_id: collection.id,
      type: e.type,
      content: e.content,
      summary: e.summary,
      source: e.source,
      confidence: e.confidence,
      relevance: e.relevance,
      metadata: e.metadata
    }))
    
    const { error: itemsError } = await supabase
      .from('evidence_items')
      .insert(evidenceItems)
    
    if (itemsError) {
      console.error('Failed to store evidence items:', itemsError)
    }
    
    const duration = Date.now() - startTime
    console.log(`Deep research completed in ${duration}ms`)
    console.log(`Total evidence collected: ${evidence.length}`)
    
    return new Response(JSON.stringify({
      success: true,
      collectionId: collection.id,
      evidence: evidence,
      summary: {
        total: evidence.length,
        by_type: evidenceItems.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        duration,
        iterations: maxIterations,
        high_quality_count: evidence.filter(e => e.confidence > 0.8).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Deep research error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})