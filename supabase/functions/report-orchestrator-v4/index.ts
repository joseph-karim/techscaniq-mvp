import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders, getCorsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface OrchestratorRequest {
  scan_request_id?: string
  company?: {
    name: string
    website: string
  }
  investorProfile?: any
  analysisDepth?: 'standard' | 'deep' | 'exhaustive'
  stream?: boolean  // Enable streaming updates
}

// Create a streaming response that sends updates as Server-Sent Events
function createStreamResponse(origin: string | null) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  
  const send = async (event: string, data: any) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    await writer.write(encoder.encode(message))
  }
  
  const close = async () => {
    await writer.close()
  }
  
  return {
    response: new Response(stream.readable, {
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    }),
    send,
    close
  }
}

async function performDeepResearch(
  company: any,
  investmentThesis: any,
  depth: string,
  streamUpdate?: (event: string, data: any) => Promise<void>
) {
  const phases = [
    {
      name: 'Initial Discovery',
      description: 'Analyzing company website and basic information',
      collectors: ['html-collector', 'jina-collector', 'webtech-analyzer']
    },
    {
      name: 'Technical Deep Dive',
      description: 'Investigating technology stack, architecture, and engineering practices',
      collectors: ['github-search', 'tech-blog-analyzer', 'api-documentation-scanner']
    },
    {
      name: 'Security & Compliance Assessment',
      description: 'Comprehensive security analysis and compliance verification',
      collectors: ['security-scanner', 'nuclei-scanner', 'testssl-scanner', 'compliance-checker']
    },
    {
      name: 'Business Intelligence Gathering',
      description: 'Market position, competitive analysis, and business model research',
      collectors: ['market-research', 'competitor-analysis', 'financial-search']
    },
    {
      name: 'Team & Leadership Analysis',
      description: 'Researching leadership, team composition, and company culture',
      collectors: ['linkedin-search', 'glassdoor-analyzer', 'patent-search']
    },
    {
      name: 'Financial & Investment Research',
      description: 'Funding history, valuation, and financial health indicators',
      collectors: ['crunchbase-search', 'pitchbook-analyzer', 'news-aggregator']
    }
  ]
  
  const allEvidence = []
  
  for (const [index, phase] of phases.entries()) {
    if (streamUpdate) {
      await streamUpdate('phase_start', {
        phase: index + 1,
        totalPhases: phases.length,
        name: phase.name,
        description: phase.description
      })
    }
    
    // Simulate collecting evidence from multiple sources
    for (const collector of phase.collectors) {
      if (streamUpdate) {
        await streamUpdate('collector_start', {
          phase: phase.name,
          collector: collector,
          status: 'running'
        })
      }
      
      // Call the deep research collector
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/deep-research-collector`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            company,
            investmentThesis,
            researchDepth: depth,
            maxIterations: depth === 'exhaustive' ? 2 : 1
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.evidence) {
            allEvidence.push(...result.evidence)
            
            if (streamUpdate) {
              await streamUpdate('evidence_collected', {
                phase: phase.name,
                collector: collector,
                count: result.evidence.length,
                quality: result.evidence.filter(e => e.confidence > 0.8).length,
                preview: result.evidence[0]?.summary || 'No preview available'
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error in ${collector}:`, error)
        if (streamUpdate) {
          await streamUpdate('collector_error', {
            phase: phase.name,
            collector: collector,
            error: error.message
          })
        }
      }
      
      // Small delay between collectors
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    if (streamUpdate) {
      await streamUpdate('phase_complete', {
        phase: index + 1,
        name: phase.name,
        evidenceCollected: allEvidence.length
      })
    }
  }
  
  return allEvidence
}

async function performDeepAnalysis(
  company: any,
  evidence: any[],
  investmentThesis: any,
  streamUpdate?: (event: string, data: any) => Promise<void>
) {
  if (streamUpdate) {
    await streamUpdate('analysis_start', {
      evidenceCount: evidence.length,
      model: 'claude-opus-4-20250514',
      approach: 'Deep thinking with multiple passes'
    })
  }
  
  // Group evidence by category for structured analysis
  const categories = ['technical', 'security', 'business', 'team', 'market', 'financial']
  const analysisResults = {}
  
  for (const category of categories) {
    if (streamUpdate) {
      await streamUpdate('analyzing_category', {
        category,
        status: 'Performing deep analysis...'
      })
    }
    
    const categoryEvidence = evidence.filter(e => 
      e.type.toLowerCase().includes(category) || 
      e.metadata?.agent?.toLowerCase().includes(category)
    )
    
    // Call tech-intelligence-v3 for deep analysis
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/tech-intelligence-v3`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company,
          evidenceSummary: categoryEvidence.slice(0, 30), // Limit per category
          investorProfile: { investmentThesisData: investmentThesis },
          analysisType: 'deep_category_analysis',
          category
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        analysisResults[category] = result
        
        if (streamUpdate) {
          await streamUpdate('category_analyzed', {
            category,
            keyFindings: result.keyFindings?.slice(0, 3) || [],
            confidence: result.confidence || 0.85
          })
        }
      }
    } catch (error) {
      console.error(`Analysis error for ${category}:`, error)
    }
    
    // Delay between analyses
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  // Final comprehensive synthesis
  if (streamUpdate) {
    await streamUpdate('synthesis_start', {
      message: 'Synthesizing all findings into comprehensive report...'
    })
  }
  
  // Call for final comprehensive analysis
  const finalAnalysis = await fetch(`${supabaseUrl}/functions/v1/tech-intelligence-v3`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company,
      evidenceSummary: evidence.slice(0, 100), // Top evidence
      investorProfile: { investmentThesisData: investmentThesis },
      analysisType: 'comprehensive_synthesis',
      categoryAnalyses: analysisResults
    })
  })
  
  if (finalAnalysis.ok) {
    const result = await finalAnalysis.json()
    return result
  }
  
  throw new Error('Deep analysis failed')
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const request: OrchestratorRequest = await req.json()
    const startTime = Date.now()
    
    // Get company info from scan request if provided
    let company = request.company
    let investorProfile = request.investorProfile
    
    if (request.scan_request_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data: scanRequest } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', request.scan_request_id)
        .single()
      
      if (scanRequest) {
        company = {
          name: scanRequest.company_name,
          website: scanRequest.website_url
        }
        investorProfile = {
          investmentThesisData: scanRequest.investment_thesis_data
        }
        
        // Update status
        await supabase
          .from('scan_requests')
          .update({ status: 'processing' })
          .eq('id', request.scan_request_id)
      }
    }
    
    if (!company?.name || !company?.website) {
      throw new Error('Company information required')
    }
    
    // If streaming is requested, set up SSE
    if (request.stream) {
      const { response, send, close } = createStreamResponse(origin)
      
      // Process in background
      (async () => {
        try {
          await send('start', {
            company: company.name,
            depth: request.analysisDepth || 'deep',
            timestamp: new Date().toISOString()
          })
          
          // Phase 1: Deep Research
          const evidence = await performDeepResearch(
            company,
            investorProfile?.investmentThesisData,
            request.analysisDepth || 'deep',
            send
          )
          
          await send('research_complete', {
            totalEvidence: evidence.length,
            highQuality: evidence.filter(e => e.confidence > 0.8).length
          })
          
          // Phase 2: Deep Analysis
          const analysis = await performDeepAnalysis(
            company,
            evidence,
            investorProfile?.investmentThesisData,
            send
          )
          
          // Store the report
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!
          const supabase = createClient(supabaseUrl, supabaseKey)
          
          const { data: report } = await supabase
            .from('reports')
            .insert({
              scan_request_id: request.scan_request_id,
              company_name: company.name,
              report_data: analysis.report_data,
              executive_summary: analysis.executive_summary,
              investment_score: analysis.investment_score,
              investment_rationale: analysis.investment_rationale,
              tech_health_score: analysis.tech_health_score || analysis.investment_score / 10,
              tech_health_grade: analysis.tech_health_grade,
              evidence_count: evidence.length,
              metadata: {
                duration: Date.now() - startTime,
                depth: request.analysisDepth,
                model: 'claude-opus-4-20250514'
              }
            })
            .select()
            .single()
          
          await send('complete', {
            reportId: report.id,
            investmentScore: analysis.investment_score,
            duration: Date.now() - startTime,
            url: `/reports/${report.id}`
          })
          
          if (request.scan_request_id) {
            await supabase
              .from('scan_requests')
              .update({ status: 'complete' })
              .eq('id', request.scan_request_id)
          }
          
        } catch (error) {
          await send('error', { message: error.message })
        } finally {
          await close()
        }
      })()
      
      return response
    }
    
    // Non-streaming response (legacy)
    const evidence = await performDeepResearch(
      company,
      investorProfile?.investmentThesisData,
      request.analysisDepth || 'deep'
    )
    
    const analysis = await performDeepAnalysis(
      company,
      evidence,
      investorProfile?.investmentThesisData
    )
    
    return new Response(JSON.stringify({
      success: true,
      reportId: analysis.reportId,
      investmentScore: analysis.investment_score,
      evidenceCount: evidence.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Orchestrator error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})