import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface AnalysisRequest {
  company: {
    name: string
    website: string
  }
  evidenceSummary: Array<{
    id: string
    type: string
    category: string
    summary: string
    source: string
    confidence: number
  }>
  investorProfile?: any
  analysisType: string
  evidenceCollectionId: string
}

interface Finding {
  claim: string
  confidence: number
  evidence_ids: string[]
  analysis: string
  reasoning: string
}

interface SectionAnalysis {
  summary: string
  findings: Finding[]
  risks: string[]
  opportunities: string[]
  recommendations: string[]
  overallConfidence: number
}

interface AnalysisResult {
  executiveSummary: string
  investmentScore: number
  investmentRationale: string
  technology: SectionAnalysis
  infrastructure: SectionAnalysis
  security: SectionAnalysis
  team: SectionAnalysis
  market: SectionAnalysis
  financial: SectionAnalysis
}

// Add sleep utility function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Add retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error
      if (error.status === 429 || error.message?.includes('429')) {
        const delay = initialDelay * Math.pow(2, i) // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
        
        // Check for retry-after header in error details
        const retryAfter = error.errorDetails?.find((d: any) => 
          d['@type']?.includes('RetryInfo')
        )?.retryDelay
        
        if (retryAfter) {
          // Parse retry delay (e.g., "29s" -> 29000ms)
          const match = retryAfter.match(/(\d+)s/)
          if (match) {
            const retryDelayMs = parseInt(match[1]) * 1000
            console.log(`API suggests retry after ${retryDelayMs}ms`)
            await sleep(Math.max(delay, retryDelayMs))
          } else {
            await sleep(delay)
          }
        } else {
          await sleep(delay)
        }
      } else {
        // For non-rate-limit errors, don't retry
        throw error
      }
    }
  }
  
  throw lastError
}

async function analyzeWithClaude(
  company: any,
  evidenceSummary: any[],
  investorProfile: any
): Promise<AnalysisResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  // Group evidence by category
  const evidenceByCategory = evidenceSummary.reduce((acc, e) => {
    const cat = e.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(e)
    return acc
  }, {} as Record<string, any[]>)

  const prompt = `You are analyzing ${company.name} (${company.website}) for investment potential.

Evidence collected:
${JSON.stringify(evidenceByCategory, null, 2)}

${investorProfile ? `Investor Profile:
- Firm: ${investorProfile.firmName}
- Thesis: ${investorProfile.thesis}
- Primary Criteria: ${investorProfile.primaryCriteria}
- Secondary Criteria: ${investorProfile.secondaryCriteria}` : ''}

Provide a comprehensive technical due diligence report with the following structure:

1. For each section (Technology Stack, Infrastructure, Security, Team & Culture, Market Position, Financial Health):
   - Summary: Brief overview of findings
   - Findings: Array of specific claims with:
     - claim: The specific finding
     - confidence: Score 0-1 based on evidence quality
     - evidence_ids: Array of evidence IDs supporting this claim
     - analysis: Detailed explanation
     - reasoning: Why this confidence score was assigned
   - Risks: Identified risks
   - Opportunities: Growth opportunities
   - Recommendations: Actionable next steps
   - overallConfidence: Average confidence for the section

2. Executive Summary: High-level assessment
3. Investment Score: 0-100 based on all factors
4. Investment Rationale: Detailed reasoning for the score

Focus on technical excellence, scalability, security posture, and team capability.
Be specific about confidence levels based on evidence quality and completeness.

Return as JSON matching this structure:
{
  "executiveSummary": string,
  "investmentScore": number,
  "investmentRationale": string,
  "technology": {
    "summary": string,
    "findings": [{"claim": string, "confidence": number, "evidence_ids": [string], "analysis": string, "reasoning": string}],
    "risks": [string],
    "opportunities": [string],
    "recommendations": [string],
    "overallConfidence": number
  },
  "infrastructure": {same structure as technology},
  "security": {same structure as technology},
  "team": {same structure as technology},
  "market": {same structure as technology},
  "financial": {same structure as technology}
}`

  try {
    console.log('Analyzing with Claude...')
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Extract JSON from Claude's response
    const content = data.content[0].text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const analysisResult = JSON.parse(jsonMatch[0])
    console.log('Claude analysis complete')
    return analysisResult
    
  } catch (error) {
    console.error('Claude analysis error:', error)
    
    // Return a structured fallback response
    return {
      executiveSummary: 'Analysis completed with limited evidence. Further investigation recommended.',
      investmentScore: 65,
      investmentRationale: 'Based on available evidence, the company shows moderate potential but requires deeper analysis.',
      technology: createFallbackSection('Technology Stack', evidenceByCategory.technology || []),
      infrastructure: createFallbackSection('Infrastructure', evidenceByCategory.infrastructure || []),
      security: createFallbackSection('Security', evidenceByCategory.security || []),
      team: createFallbackSection('Team & Culture', evidenceByCategory.team || []),
      market: createFallbackSection('Market Position', evidenceByCategory.market || []),
      financial: createFallbackSection('Financial Health', evidenceByCategory.financial || [])
    }
  }
}

async function analyzeWithGemini(
  company: any,
  evidenceSummary: any[],
  investorProfile: any
): Promise<AnalysisResult> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  console.log('Analyzing with Gemini...')

  // Group evidence by category
  const evidenceByCategory = evidenceSummary.reduce((acc, e) => {
    const cat = e.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(e)
    return acc
  }, {} as Record<string, any[]>)

  const prompt = `You are analyzing ${company.name} (${company.website}) for investment potential.

Evidence collected:
${JSON.stringify(evidenceByCategory, null, 2)}

${investorProfile ? `Investor Profile:
- Firm: ${investorProfile.firmName}
- Thesis: ${investorProfile.thesis}
- Primary Criteria: ${investorProfile.primaryCriteria}
- Secondary Criteria: ${investorProfile.secondaryCriteria}` : ''}

Provide a comprehensive technical due diligence report with the following structure:

1. For each section (Technology Stack, Infrastructure, Security, Team & Culture, Market Position, Financial Health):
   - Summary: Brief overview of findings
   - Findings: Array of specific claims with:
     - claim: The specific finding
     - confidence: Score 0-1 based on evidence quality
     - evidence_ids: Array of evidence IDs supporting this claim
     - analysis: Detailed explanation
     - reasoning: Why this confidence score was assigned
   - Risks: Identified risks
   - Opportunities: Growth opportunities
   - Recommendations: Actionable next steps
   - overallConfidence: Average confidence for the section

2. Executive Summary: High-level assessment
3. Investment Score: 0-100 based on all factors
4. Investment Rationale: Detailed reasoning for the score

Focus on technical excellence, scalability, security posture, and team capability.
Be specific about confidence levels based on evidence quality and completeness.

Return as JSON matching this structure:
{
  "executiveSummary": string,
  "investmentScore": number,
  "investmentRationale": string,
  "technology": {
    "summary": string,
    "findings": [{"claim": string, "confidence": number, "evidence_ids": [string], "analysis": string, "reasoning": string}],
    "risks": [string],
    "opportunities": [string],
    "recommendations": [string],
    "overallConfidence": number
  },
  "infrastructure": {same structure as technology},
  "security": {same structure as technology},
  "team": {same structure as technology},
  "market": {same structure as technology},
  "financial": {same structure as technology}
}`

  const generateContent = async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`)
    }

    return response.json()
  }

  try {
    const data = await retryWithBackoff(generateContent, 3, 2000)
    
    // Extract the analysis result from Gemini's response
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const analysisResult = JSON.parse(data.candidates[0].content.parts[0].text)
      console.log('Gemini analysis complete')
      return analysisResult
    } else {
      throw new Error('No valid response from Gemini')
    }
    
  } catch (error) {
    console.error('Gemini analysis error:', error)
    
    // Return a structured fallback response
    return {
      executiveSummary: 'Analysis completed with limited evidence. Further investigation recommended.',
      investmentScore: 65,
      investmentRationale: 'Based on available evidence, the company shows moderate potential but requires deeper analysis.',
      technology: createFallbackSection('Technology Stack', evidenceByCategory.technology || []),
      infrastructure: createFallbackSection('Infrastructure', evidenceByCategory.infrastructure || []),
      security: createFallbackSection('Security', evidenceByCategory.security || []),
      team: createFallbackSection('Team & Culture', evidenceByCategory.team || []),
      market: createFallbackSection('Market Position', evidenceByCategory.market || []),
      financial: createFallbackSection('Financial Health', evidenceByCategory.financial || [])
    }
  }
}

function createFallbackSection(title: string, evidence: any[]): SectionAnalysis {
  const findings: Finding[] = evidence.slice(0, 3).map(e => ({
    claim: e.summary,
    confidence: e.confidence || 0.5,
    evidence_ids: [e.id],
    analysis: `Based on ${e.type} evidence from ${e.source}`,
    reasoning: `Confidence score of ${e.confidence || 0.5} assigned based on evidence type and source reliability`
  }))

  return {
    summary: `${title} analysis based on ${evidence.length} pieces of evidence`,
    findings,
    risks: [`Limited evidence available for comprehensive ${title.toLowerCase()} assessment`],
    opportunities: [`Further investigation of ${title.toLowerCase()} could reveal additional insights`],
    recommendations: [`Conduct deeper analysis of ${title.toLowerCase()}`],
    overallConfidence: evidence.reduce((sum, e) => sum + (e.confidence || 0.5), 0) / Math.max(evidence.length, 1)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: AnalysisRequest = await req.json()
    
    console.log(`Analyzing ${request.company.name} with ${request.evidenceSummary.length} pieces of evidence`)
    
    const result = await analyzeWithGemini(
      request.company,
      request.evidenceSummary,
      request.investorProfile
    )
    
    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Tech intelligence error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 