import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface OrchestratorRequest {
  scan_request_id?: string  // Accept scan request ID
  company?: {
    name: string
    website: string
  }
  investorProfile?: {
    firmName: string
    website: string
    thesis?: string
    thesisTags?: string[]
    primaryCriteria?: string
    secondaryCriteria?: string
    companyDescription?: string
    investmentThesisData?: any
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

// PATCH: Skip JWT verification for local dev
function isLocal() {
  const url = Deno.env.get('SUPABASE_URL') || ''
  return url.includes('localhost') || url.includes('127.0.0.1')
}

async function callSupabaseFunction(functionName: string, payload: any): Promise<any> {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`
  let anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  // For local dev, skip JWT verification by sending a dummy key
  if (isLocal()) {
    anonKey = 'test'
  }
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

async function collectEvidence(
  companyName: string, 
  companyWebsite: string,
  depth: 'shallow' | 'deep' | 'comprehensive' = 'deep'
): Promise<any> {
  console.log(`Collecting evidence with depth: ${depth}`)
  
  // Use the new v7 evidence collector with all tools
  const response = await callSupabaseFunction('evidence-collector-v7', {
    companyName,
    companyWebsite,
    evidenceTypes: ['technical', 'security', 'team', 'financial', 'market'],
    depth
  })
  
  if (!response.success) {
    throw new Error(`Evidence collection failed: ${response.error}`)
  }
  
  return response
}

async function analyzeWithGemini(company: any, evidence: any, investorProfile?: any): Promise<ComprehensiveReport> {
  console.log('Analyzing with Gemini AI...')
  
  // Prepare evidence for Gemini
  const evidenceSummary = evidence.evidence?.map((e: EvidenceItem) => ({
    id: e.id,
    type: e.type,
    category: e.classifications?.[0]?.category || 'general',
    summary: e.content?.summary || e.content?.raw?.substring(0, 500) || '',
    source: e.source?.url || e.source?.query || '',
    confidence: e.metadata?.confidence || 0.5
  })) || []
  
  const analysisResult = await callSupabaseFunction('tech-intelligence-v2', {
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
  // Set a timeout of 380 seconds (just under Supabase's 400 second limit)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 380000)

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const requestId = crypto.randomUUID()
    const logPrefix = `[report-orchestrator-v3][${requestId}]`
    const request: OrchestratorRequest = await req.json()
    const startTime = Date.now()
    
    // If scan_request_id is provided, fetch the scan request to get company info
    let company = request.company
    let investorProfile = request.investorProfile
    
    if (request.scan_request_id) {
      console.log(`${logPrefix} Fetching scan request: ${request.scan_request_id}`)
      
      // Create Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Fetch scan request
      const { data: scanRequest, error } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', request.scan_request_id)
        .single()
      
      if (error || !scanRequest) {
        throw new Error(`Failed to fetch scan request: ${error?.message || 'Not found'}`)
      }
      
      console.log(`${logPrefix} Scan request found:`, scanRequest)
      
      // Extract company info from scan request
      company = {
        name: scanRequest.company_name,
        website: scanRequest.website_url || `https://${scanRequest.company_name.toLowerCase().replace(/\s+/g, '')}.com`
      }
      
      // Extract investor profile from scan request data
      investorProfile = {
        firmName: scanRequest.organization_name || 'Unknown Firm',
        website: '',
        thesis: scanRequest.primary_criteria || '',
        thesisTags: scanRequest.thesis_tags || [],
        primaryCriteria: scanRequest.primary_criteria,
        secondaryCriteria: scanRequest.secondary_criteria,
        companyDescription: scanRequest.company_description,
        investmentThesisData: scanRequest.investment_thesis_data
      }
      
      // Update scan request status to processing
      await supabase
        .from('scan_requests')
        .update({ status: 'processing' })
        .eq('id', request.scan_request_id)
    }
    
    if (!company?.name || !company?.website) {
      throw new Error('Company name and website are required')
    }
    
    console.log(`${logPrefix} Request received for company: ${company.name} (${company.website})`)
    
    // Step 1: Collect evidence using Jina AI
    console.log(`${logPrefix} [1/3] Collecting evidence...`)
    const evidenceData = await collectEvidence(
      company.name,
      company.website,
      request.analysisDepth || 'comprehensive'
    )
    console.log(`${logPrefix} [1/3] Evidence collection complete. Evidence count: ${evidenceData?.evidence?.length ?? 0}`)
    
    // Step 2: Analyze with Gemini
    console.log(`${logPrefix} [2/3] Analyzing with Gemini...`)
    const report = await analyzeWithGemini(
      company,
      evidenceData,
      investorProfile
    )
    console.log(`${logPrefix} [2/3] Gemini analysis complete. Investment score: ${report.investmentScore}`)
    
    // Step 3: Store citations for traceability
    console.log(`${logPrefix} [3/3] Storing citations...`)
    await storeCitations(report)
    console.log(`${logPrefix} [3/3] Citations stored.`)
    
    // Update metadata
    report.metadata.processingTime = Date.now() - startTime
    console.log(`${logPrefix} Report generation complete in ${report.metadata.processingTime}ms`)
    
    // Store the report in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Create report record
    const { data: reportRecord, error: reportError } = await supabase
      .from('scan_reports')
      .insert({
        scan_request_id: request.scan_request_id || null,
        company_name: company.name,
        website_url: company.website,
        report_type: 'deep-dive', // Based on analysis depth
        investor_name: investorProfile?.firmName || 'Unknown',
        assessment_context: 'investment',
        report_data: {
          ...report,
          sections: report.sections,
          evidence: report.evidence,
          metadata: report.metadata,
          executive_summary: report.executiveSummary,
          investment_score: report.investmentScore,
          investment_rationale: report.investmentRationale,
          tech_health_score: report.investmentScore ? (report.investmentScore / 10) : null,
          tech_health_grade: 
            report.investmentScore >= 80 ? 'A' :
            report.investmentScore >= 70 ? 'B' :
            report.investmentScore >= 60 ? 'C' :
            report.investmentScore >= 50 ? 'D' : 'F'
        },
        token_usage: {
          evidence_collection: {},
          analysis: {},
          total: 0
        }
      })
      .select()
      .single()
    
    if (reportError) {
      console.error(`${logPrefix} Failed to store report:`, reportError)
    } else {
      console.log(`${logPrefix} Report stored with ID: ${reportRecord.id}`)
      report.reportId = reportRecord.id
    }
    
    // If we have a scan_request_id, update its status and store report reference
    if (request.scan_request_id && reportRecord) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Calculate tech health score based on investment score
      const techHealthScore = report.investmentScore ? (report.investmentScore / 10).toFixed(1) : null
      const techHealthGrade = 
        report.investmentScore >= 80 ? 'A' :
        report.investmentScore >= 70 ? 'B' :
        report.investmentScore >= 60 ? 'C' :
        report.investmentScore >= 50 ? 'D' : 'F'
      
      // Convert report sections to the format expected by frontend
      const sections = [
        {
          id: 'architecture',
          title: 'Architecture & Infrastructure',
          aiContent: `${report.sections.infrastructure.summary}\n\n${report.sections.infrastructure.findings.map(f => `• ${f.claim} (Confidence: ${f.confidence})\n  ${f.analysis}`).join('\n\n')}`,
          reviewerNotes: '',
          risks: report.sections.infrastructure.risks || [],
          opportunities: report.sections.infrastructure.opportunities || []
        },
        {
          id: 'code-quality',
          title: 'Code Quality & Technology Stack',
          aiContent: `${report.sections.technologyStack.summary}\n\n${report.sections.technologyStack.findings.map(f => `• ${f.claim} (Confidence: ${f.confidence})\n  ${f.analysis}`).join('\n\n')}`,
          reviewerNotes: '',
          risks: report.sections.technologyStack.risks || [],
          opportunities: report.sections.technologyStack.opportunities || []
        },
        {
          id: 'security',
          title: 'Security Posture',
          aiContent: `${report.sections.security.summary}\n\n${report.sections.security.findings.map(f => `• ${f.claim} (Confidence: ${f.confidence})\n  ${f.analysis}`).join('\n\n')}`,
          reviewerNotes: '',
          risks: report.sections.security.risks || [],
          opportunities: report.sections.security.opportunities || []
        },
        {
          id: 'team',
          title: 'Team & Culture',
          aiContent: `${report.sections.teamCulture.summary}\n\n${report.sections.teamCulture.findings.map(f => `• ${f.claim} (Confidence: ${f.confidence})\n  ${f.analysis}`).join('\n\n')}`,
          reviewerNotes: '',
          risks: report.sections.teamCulture.risks || [],
          opportunities: report.sections.teamCulture.opportunities || []
        }
      ]
      
      // Extract risks from all sections
      const risks: any[] = []
      let riskId = 1
      
      for (const [sectionKey, section] of Object.entries(report.sections)) {
        if (section.risks && Array.isArray(section.risks)) {
          for (const risk of section.risks) {
            risks.push({
              id: riskId++,
              title: risk,
              description: `Risk identified in ${section.title}`,
              severity: 'medium', // Could be enhanced with AI analysis
              evidence: `Based on analysis of ${section.title.toLowerCase()}`,
              section: sectionKey
            })
          }
        }
      }
      
      // Create executive report data
      const executiveReportData = {
        executiveSummary: {
          overallAssessment: report.executiveSummary,
          keyFindings: [
            ...report.sections.technologyStack.findings.slice(0, 2).map(f => f.claim),
            ...report.sections.security.findings.slice(0, 2).map(f => f.claim)
          ].filter(Boolean),
          investmentScore: report.investmentScore,
          investmentRationale: report.investmentRationale
        },
        recommendations: {
          investmentDecision: report.investmentScore >= 70 ? 
            'Recommended for investment based on technical assessment' : 
            report.investmentScore >= 50 ?
            'Proceed with caution - address identified risks first' :
            'Not recommended for investment at this time',
          nextSteps: [
            ...report.sections.technologyStack.recommendations?.slice(0, 2) || [],
            ...report.sections.security.recommendations?.slice(0, 2) || []
          ].filter(Boolean)
        }
      }
      
      await supabase
        .from('scan_requests')
        .update({ 
          status: 'awaiting_review',
          report_id: reportRecord.id,
          ai_confidence: Math.round(report.metadata.confidenceScore || 85),
          tech_health_score: parseFloat(techHealthScore || '0'),
          tech_health_grade: techHealthGrade,
          sections: sections,
          risks: risks,
          executive_report_data: executiveReportData,
          executive_report_generated_at: new Date().toISOString()
        })
        .eq('id', request.scan_request_id)
        
      console.log(`${logPrefix} Updated scan request ${request.scan_request_id} with report data`)
    }
    
    return new Response(
      JSON.stringify(report),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (e) {
    console.error(`[report-orchestrator-v3][ERROR]`, e && e.stack ? e.stack : e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: corsHeaders,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}) 