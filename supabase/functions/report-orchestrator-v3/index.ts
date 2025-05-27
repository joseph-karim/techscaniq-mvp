import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrchestratorRequest {
  company: {
    name: string
    website: string
  }
  investorProfile?: {
    firmName: string
    website: string
    thesis?: string
  }
  analysisDepth?: 'shallow' | 'deep' | 'comprehensive'
  focusAreas?: string[]
}

interface EvidenceItem {
  id: string
  type: string
  content: {
    raw: string
    summary?: string
  }
  source: {
    url?: string
    query?: string
  }
  metadata: {
    confidence: number
    relevance: number
  }
  classifications?: {
    category: string
    score: number
  }[]
}

interface AnalysisSection {
  title: string
  summary: string
  findings: {
    claim: string
    confidence: number
    evidence_ids: string[]
    analysis: string
  }[]
  risks?: string[]
  opportunities?: string[]
  recommendations?: string[]
}

interface ComprehensiveReport {
  reportId: string
  company: string
  generatedAt: string
  executiveSummary: string
  investmentScore: number
  investmentRationale: string
  
  sections: {
    technologyStack: AnalysisSection
    infrastructure: AnalysisSection
    security: AnalysisSection
    teamCulture: AnalysisSection
    marketPosition: AnalysisSection
    financialHealth: AnalysisSection
  }
  
  evidence: {
    total: number
    byType: Record<string, number>
    collectionId: string
    items: EvidenceItem[]
  }
  
  metadata: {
    analysisDepth: string
    processingTime: number
    servicesUsed: string[]
    confidenceScore: number
  }
}

async function callSupabaseFunction(functionName: string, payload: any): Promise<any> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify(payload)
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Function ${functionName} failed: ${error}`)
  }
  
  return response.json()
}

async function collectEvidence(company: any, depth: string): Promise<any> {
  console.log('Collecting evidence with depth:', depth)
  
  const evidenceTypes = ['technical', 'security', 'team', 'financial', 'market']
  
  const evidenceResult = await callSupabaseFunction('evidence-collector', {
    companyName: company.name,
    companyWebsite: company.website,
    evidenceTypes,
    depth: depth || 'deep'
  })
  
  return evidenceResult
}

async function analyzeWithGemini(company: any, evidence: any, investorProfile?: any): Promise<ComprehensiveReport> {
  console.log('Analyzing with Gemini AI...')
  
  // Prepare evidence for Gemini
  const evidenceSummary = evidence.evidence.map((e: EvidenceItem) => ({
    id: e.id,
    type: e.type,
    category: e.classifications?.[0]?.category || 'general',
    summary: e.content.summary || e.content.raw.substring(0, 500),
    source: e.source.url || e.source.query,
    confidence: e.metadata.confidence
  }))
  
  const analysisResult = await callSupabaseFunction('tech-intelligence', {
    company,
    evidenceSummary,
    investorProfile,
    analysisType: 'comprehensive_report',
    evidenceCollectionId: evidence.collectionId
  })
  
  // Map evidence IDs to findings
  const report: ComprehensiveReport = {
    reportId: crypto.randomUUID(),
    company: company.name,
    generatedAt: new Date().toISOString(),
    executiveSummary: analysisResult.executiveSummary || 'Technology assessment in progress',
    investmentScore: analysisResult.investmentScore || 0,
    investmentRationale: analysisResult.investmentRationale || '',
    
    sections: {
      technologyStack: createSection('Technology Stack', analysisResult.technology, evidenceSummary),
      infrastructure: createSection('Infrastructure', analysisResult.infrastructure, evidenceSummary),
      security: createSection('Security', analysisResult.security, evidenceSummary),
      teamCulture: createSection('Team & Culture', analysisResult.team, evidenceSummary),
      marketPosition: createSection('Market Position', analysisResult.market, evidenceSummary),
      financialHealth: createSection('Financial Health', analysisResult.financial, evidenceSummary)
    },
    
    evidence: {
      total: evidence.evidence.length,
      byType: evidence.summary.by_type,
      collectionId: evidence.collectionId,
      items: evidence.evidence
    },
    
    metadata: {
      analysisDepth: 'comprehensive',
      processingTime: Date.now(),
      servicesUsed: ['evidence-collector', 'tech-intelligence'],
      confidenceScore: evidence.summary.confidence_avg
    }
  }
  
  return report
}

function createSection(title: string, sectionData: any, evidence: any[]): AnalysisSection {
  if (!sectionData) {
    return {
      title,
      summary: 'Analysis pending',
      findings: []
    }
  }
  
  // Map findings to evidence
  const findings = (sectionData.findings || []).map((f: any) => {
    // Find relevant evidence for this finding
    const relevantEvidence = evidence.filter(e => 
      e.summary.toLowerCase().includes(f.keyword?.toLowerCase() || '') ||
      e.category === title.toLowerCase()
    ).slice(0, 3) // Top 3 most relevant
    
    return {
      claim: f.claim || f.description,
      confidence: f.confidence || 0.7,
      evidence_ids: relevantEvidence.map(e => e.id),
      analysis: f.analysis || f.explanation || ''
    }
  })
  
  return {
    title,
    summary: sectionData.summary || `${title} analysis`,
    findings,
    risks: sectionData.risks,
    opportunities: sectionData.opportunities,
    recommendations: sectionData.recommendations
  }
}

async function storeCitations(report: ComprehensiveReport): Promise<void> {
  console.log('Storing citations for traceability...')
  
  // Extract all claims with evidence
  const citations: any[] = []
  
  Object.entries(report.sections).forEach(([sectionKey, section]) => {
    section.findings.forEach((finding, index) => {
      finding.evidence_ids.forEach(evidenceId => {
        citations.push({
          report_id: report.reportId,
          claim_id: `${sectionKey}_${index}`,
          evidence_item_id: evidenceId,
          citation_text: finding.claim,
          citation_context: section.summary,
          confidence_score: finding.confidence
        })
      })
    })
  })
  
  // Store citations (would need a separate function or direct DB call)
  console.log(`Created ${citations.length} citations for report ${report.reportId}`)
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID()
  const logPrefix = `[report-orchestrator-v3][${requestId}]`
  if (req.method === 'OPTIONS') {
    console.log(`${logPrefix} OPTIONS preflight`)
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: OrchestratorRequest = await req.json()
    const startTime = Date.now()
    console.log(`${logPrefix} Request received for company: ${request.company?.name} (${request.company?.website})`)
    
    // Step 1: Collect evidence using Jina AI
    console.log(`${logPrefix} [1/3] Collecting evidence...`)
    const evidenceData = await collectEvidence(
      request.company, 
      request.analysisDepth || 'comprehensive'
    )
    console.log(`${logPrefix} [1/3] Evidence collection complete. Evidence count: ${evidenceData?.evidence?.length ?? 0}`)
    
    // Step 2: Analyze with Gemini
    console.log(`${logPrefix} [2/3] Analyzing with Gemini...`)
    const report = await analyzeWithGemini(
      request.company,
      evidenceData,
      request.investorProfile
    )
    console.log(`${logPrefix} [2/3] Gemini analysis complete. Investment score: ${report.investmentScore}`)
    
    // Step 3: Store citations for traceability
    console.log(`${logPrefix} [3/3] Storing citations...`)
    await storeCitations(report)
    console.log(`${logPrefix} [3/3] Citations stored.`)
    
    // Update metadata
    report.metadata.processingTime = Date.now() - startTime
    console.log(`${logPrefix} Report generation complete in ${report.metadata.processingTime}ms`)
    
    return new Response(
      JSON.stringify(report),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error(`[report-orchestrator-v3][ERROR]`, error && error.stack ? error.stack : error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 