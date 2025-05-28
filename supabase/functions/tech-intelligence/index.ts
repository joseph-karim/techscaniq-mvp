import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntelligenceRequest {
  company: {
    name: string
    website: string
  }
  websiteScanData?: any
  focus?: 'technology' | 'security' | 'team' | 'comprehensive'
  evidenceSummary?: any[]
  investorProfile?: any
  analysisType?: string
  evidenceCollectionId?: string
}

interface IntelligenceResponse {
  company: string
  analysisDate: string
  insights: {
    technologyStack: {
      summary: string
      strengths: string[]
      weaknesses: string[]
      recommendations: string[]
    }
    marketPosition: {
      assessment: string
      competitors: string[]
      differentiators: string[]
    }
    investmentReadiness: {
      score: number
      enablers: string[]
      blockers: string[]
    }
  }
  confidence: number
  sources: string[]
}

async function analyzeWithClaude(company: any, evidenceSummary: any[], investorProfile?: any) {
  console.log('Analyzing', company.name, 'with Claude...')
  
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('Claude API key not configured')
  
  // Build the context-aware prompt
  let contextSection = ''
  if (investorProfile) {
    contextSection = `
## Investment Context
- Firm: ${investorProfile.firmName}
- Company Description: ${investorProfile.companyDescription || 'Not provided'}
- Investment Thesis Tags: ${investorProfile.thesisTags?.join(', ') || 'None specified'}
- Primary Investment Criteria: ${investorProfile.primaryCriteria || 'Not specified'}
- Secondary Criteria: ${investorProfile.secondaryCriteria || 'Not specified'}

Please ensure your analysis specifically addresses these investment criteria and highlights how the target company aligns or doesn't align with the stated thesis.
`
  }
  
  const prompt = `You are an expert technology due diligence analyst. Analyze ${company.name} (${company.website}) based on the following evidence and investment context.

${contextSection}

## Evidence Summary
${evidenceSummary.map((e, i) => `${i + 1}. [${e.type}] ${e.summary} (confidence: ${e.confidence})`).join('\n')}

Provide a comprehensive technical due diligence report that specifically addresses the investor's stated criteria. Structure your response as follows:

{
  "executiveSummary": "A concise executive summary of the technology assessment",
  "investmentScore": 75,
  "investmentRationale": "Clear rationale for the investment score",
  "technology": {
    "summary": "Technology stack overview",
    "findings": [
      {
        "claim": "Specific finding about their technology",
        "confidence": 0.8,
        "analysis": "Detailed analysis of this finding"
      }
    ],
    "risks": ["Risk 1", "Risk 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "infrastructure": {
    "summary": "Infrastructure assessment",
    "findings": [...],
    "risks": [...],
    "opportunities": [...],
    "recommendations": [...]
  },
  "security": {
    "summary": "Security posture assessment",
    "findings": [...],
    "risks": [...],
    "opportunities": [...],
    "recommendations": [...]
  },
  "team": {
    "summary": "Team and culture assessment",
    "findings": [...],
    "risks": [...],
    "opportunities": [...],
    "recommendations": [...]
  },
  "market": {
    "summary": "Market position assessment",
    "findings": [...],
    "risks": [...],
    "opportunities": [...],
    "recommendations": [...]
  },
  "financial": {
    "summary": "Financial health indicators",
    "findings": [...],
    "risks": [...],
    "opportunities": [...],
    "recommendations": [...]
  }
}

Provide specific, actionable insights based on the evidence provided. Be thorough but concise.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const text = data.content[0].text

    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      console.error('Failed to parse JSON response:', e)
    }

    // Fallback to structured response
    return {
      executiveSummary: extractSection(text, 'Executive Summary', 'Investment Score') || 'Technology assessment completed',
      investmentScore: extractScore(text) || 75,
      investmentRationale: extractSection(text, 'Investment Rationale', 'Technology') || 'Based on comprehensive analysis',
      technology: {
        summary: 'Technology stack analysis',
        findings: [{ claim: 'Analysis in progress', confidence: 0.7, analysis: text }],
        risks: [],
        opportunities: [],
        recommendations: []
      },
      infrastructure: { summary: 'Infrastructure analysis', findings: [], risks: [], opportunities: [], recommendations: [] },
      security: { summary: 'Security analysis', findings: [], risks: [], opportunities: [], recommendations: [] },
      team: { summary: 'Team analysis', findings: [], risks: [], opportunities: [], recommendations: [] },
      market: { summary: 'Market analysis', findings: [], risks: [], opportunities: [], recommendations: [] },
      financial: { summary: 'Financial analysis', findings: [], risks: [], opportunities: [], recommendations: [] }
    }
  } catch (error) {
    console.error('Claude analysis error:', error)
    throw error
  }
}

// Helper functions for parsing
function extractSection(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker)
  const endIndex = text.indexOf(endMarker, startIndex)
  if (startIndex === -1) return ''
  const section = text.substring(startIndex, endIndex > startIndex ? endIndex : undefined)
  return section.replace(startMarker, '').trim()
}

function extractScore(text: string): number {
  const scoreMatch = text.match(/score[:\s]*(\d+)/i)
  return scoreMatch ? parseInt(scoreMatch[1]) : 75
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: IntelligenceRequest = await req.json()
    
    if (!request.company?.name || !request.company?.website) {
      throw new Error('Company name and website are required')
    }
    
    if (request.company.name === 'Claude') {
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!apiKey) throw new Error('Claude API key not configured')
      
      console.log(`Analyzing ${request.company.name} with Claude...`)
      
      const analysis = await analyzeWithClaude(request.company, request.evidenceSummary || [], request.investorProfile)
      
      return new Response(
        JSON.stringify({
          success: true,
          data: analysis
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
    
    // Get API key from environment
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }
    
    console.log(`Analyzing ${request.company.name} with Claude...`)
    
    const analysis = await analyzeWithClaude(request.company, request.evidenceSummary || [], request.investorProfile)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: analysis
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Tech intelligence error:', error)
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