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

// Frontend expected structure
interface TeamMember {
  name: string
  role: string
  background: string
  linkedIn?: string
}

interface Competitor {
  name: string
  description: string
  strengths: string[]
  weaknesses: string[]
  marketShare?: string
}

interface FundingRound {
  date: string
  amount: string
  round: string
  investors: string[]
  valuation?: string
}

interface ReportData {
  companyInfo: {
    name: string
    website: string
    founded: string
    headquarters: string
    description: string
    mission: string
    vision: string
    employeeCount: string
    revenue: string
    fundingTotal: string
    lastValuation: string
  }
  
  technologyOverview: {
    summary: string
    primaryStack: Array<{
      category: string
      technologies: string[]
      description: string
    }>
    architectureHighlights: string[]
    scalabilityFeatures: string[]
    innovativeAspects: string[]
  }
  
  securityAssessment: {
    overallScore: number
    summary: string
    strengths: string[]
    vulnerabilities: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low'
      description: string
      recommendation: string
    }>
    compliance: string[]
    recommendations: string[]
  }
  
  teamAnalysis: {
    summary: string
    leadershipScore: number
    keyMembers: TeamMember[]
    teamStrengths: string[]
    teamGaps: string[]
    culture: {
      values: string[]
      workStyle: string
      diversity: string
    }
  }
  
  marketAnalysis: {
    summary: string
    marketSize: string
    growthRate: string
    targetMarket: string
    competitivePosition: string
    differentiators: string[]
    competitors: Competitor[]
    marketTrends: string[]
    opportunities: string[]
    threats: string[]
  }
  
  financialHealth: {
    summary: string
    revenue: string
    growthRate: string
    burnRate: string
    runway: string
    fundingHistory: FundingRound[]
    keyMetrics: Array<{
      metric: string
      value: string
      trend: 'up' | 'down' | 'stable'
    }>
    financialStrengths: string[]
    financialRisks: string[]
  }
  
  investmentRecommendation: {
    score: number
    grade: string
    recommendation: 'strong-buy' | 'buy' | 'hold' | 'pass'
    rationale: string
    keyStrengths: string[]
    keyRisks: string[]
    dueDiligenceGaps: string[]
    nextSteps: string[]
  }
}

// Sleep utility for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry with exponential backoff
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
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
        const delay = initialDelay * Math.pow(2, i)
        console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
        
        // Check for retry-after header
        const retryAfter = error.errorDetails?.find((d: any) => 
          d['@type']?.includes('RetryInfo')
        )?.retryDelay
        
        if (retryAfter) {
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
): Promise<ReportData> {
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

Generate a comprehensive investment report with the EXACT structure shown below. Fill in all fields with realistic data based on the evidence. If specific data is not available, make reasonable inferences based on the company type and evidence available.

Return ONLY valid JSON matching this exact structure:

{
  "companyInfo": {
    "name": "${company.name}",
    "website": "${company.website}",
    "founded": "2015",
    "headquarters": "San Francisco, CA",
    "description": "Brief company description",
    "mission": "Company mission statement",
    "vision": "Company vision statement",
    "employeeCount": "50-100",
    "revenue": "$5M-10M ARR",
    "fundingTotal": "$15M",
    "lastValuation": "$50M"
  },
  "technologyOverview": {
    "summary": "Technical overview summary",
    "primaryStack": [
      {
        "category": "Frontend",
        "technologies": ["React", "TypeScript"],
        "description": "Modern web stack"
      }
    ],
    "architectureHighlights": ["Microservices", "Cloud-native"],
    "scalabilityFeatures": ["Auto-scaling", "Load balancing"],
    "innovativeAspects": ["AI-powered features"]
  },
  "securityAssessment": {
    "overallScore": 85,
    "summary": "Security assessment summary",
    "strengths": ["SOC2 compliant", "End-to-end encryption"],
    "vulnerabilities": [
      {
        "severity": "medium",
        "description": "Outdated dependencies",
        "recommendation": "Update all dependencies"
      }
    ],
    "compliance": ["SOC2", "GDPR"],
    "recommendations": ["Implement security scanning"]
  },
  "teamAnalysis": {
    "summary": "Team assessment summary",
    "leadershipScore": 80,
    "keyMembers": [
      {
        "name": "John Doe",
        "role": "CEO",
        "background": "Ex-Google, 10 years experience",
        "linkedIn": "https://linkedin.com/in/johndoe"
      }
    ],
    "teamStrengths": ["Strong technical background"],
    "teamGaps": ["Need VP of Sales"],
    "culture": {
      "values": ["Innovation", "Customer-first"],
      "workStyle": "Remote-first",
      "diversity": "30% women, 40% minorities"
    }
  },
  "marketAnalysis": {
    "summary": "Market analysis summary",
    "marketSize": "$10B",
    "growthRate": "25% CAGR",
    "targetMarket": "SMB SaaS",
    "competitivePosition": "Emerging player",
    "differentiators": ["AI-powered", "Better UX"],
    "competitors": [
      {
        "name": "Competitor A",
        "description": "Market leader",
        "strengths": ["Brand recognition"],
        "weaknesses": ["High price"],
        "marketShare": "30%"
      }
    ],
    "marketTrends": ["AI adoption", "Remote work"],
    "opportunities": ["International expansion"],
    "threats": ["New entrants"]
  },
  "financialHealth": {
    "summary": "Financial health summary",
    "revenue": "$5M ARR",
    "growthRate": "150% YoY",
    "burnRate": "$500K/month",
    "runway": "18 months",
    "fundingHistory": [
      {
        "date": "2023-06",
        "amount": "$10M",
        "round": "Series A",
        "investors": ["VC Firm A", "VC Firm B"],
        "valuation": "$50M"
      }
    ],
    "keyMetrics": [
      {
        "metric": "MRR",
        "value": "$400K",
        "trend": "up"
      }
    ],
    "financialStrengths": ["Strong unit economics"],
    "financialRisks": ["High burn rate"]
  },
  "investmentRecommendation": {
    "score": 75,
    "grade": "B",
    "recommendation": "buy",
    "rationale": "Strong technology and team with good market opportunity",
    "keyStrengths": ["Technical excellence", "Market timing"],
    "keyRisks": ["Competition", "Burn rate"],
    "dueDiligenceGaps": ["Customer references", "Financial audit"],
    "nextSteps": ["Schedule management presentation", "Technical deep dive"]
  }
}`

  try {
    console.log('Analyzing with Claude...')
    
    const response = await retryWithBackoff(async () => {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
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

      if (!res.ok) {
        const error = await res.text()
        throw new Error(`Claude API error: ${res.status} - ${error}`)
      }

      return res.json()
    })

    const content = response.content[0].text
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const reportData = JSON.parse(jsonMatch[0])
    console.log('Claude analysis complete')
    return reportData
    
  } catch (error) {
    console.error('Claude analysis error:', error)
    throw error // Let it fall back to Gemini
  }
}

async function analyzeWithGemini(
  company: any,
  evidenceSummary: any[],
  investorProfile: any,
  req?: Request
): Promise<ReportData> {
  // Check for API key in environment first, then in headers for local dev
  let apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey && req) {
    apiKey = req.headers.get('x-google-api-key') || ''
  }
  
  if (!apiKey) {
    throw new Error('Google API key not configured')
  }

  console.log('Analyzing with Gemini as fallback...')

  // Same prompt as Claude
  const evidenceByCategory = evidenceSummary.reduce((acc, e) => {
    const cat = e.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(e)
    return acc
  }, {} as Record<string, any[]>)

  const prompt = `You are analyzing ${company.name} (${company.website}) for investment potential.

Evidence collected:
${JSON.stringify(evidenceByCategory, null, 2)}

Generate a comprehensive investment report. Return ONLY valid JSON with this exact structure:

{
  "companyInfo": {
    "name": "${company.name}",
    "website": "${company.website}",
    "founded": "2015",
    "headquarters": "San Francisco, CA",
    "description": "Brief company description",
    "mission": "Company mission statement",
    "vision": "Company vision statement",
    "employeeCount": "50-100",
    "revenue": "$5M-10M ARR",
    "fundingTotal": "$15M",
    "lastValuation": "$50M"
  },
  "technologyOverview": {
    "summary": "Technical overview",
    "primaryStack": [{"category": "Frontend", "technologies": ["React"], "description": "Modern stack"}],
    "architectureHighlights": ["Cloud-native"],
    "scalabilityFeatures": ["Auto-scaling"],
    "innovativeAspects": ["AI-powered"]
  },
  "securityAssessment": {
    "overallScore": 85,
    "summary": "Security summary",
    "strengths": ["Encrypted"],
    "vulnerabilities": [{"severity": "medium", "description": "Issue", "recommendation": "Fix"}],
    "compliance": ["SOC2"],
    "recommendations": ["Improve security"]
  },
  "teamAnalysis": {
    "summary": "Team summary",
    "leadershipScore": 80,
    "keyMembers": [{"name": "CEO", "role": "CEO", "background": "Experienced"}],
    "teamStrengths": ["Technical"],
    "teamGaps": ["Sales"],
    "culture": {"values": ["Innovation"], "workStyle": "Remote", "diversity": "Diverse"}
  },
  "marketAnalysis": {
    "summary": "Market summary",
    "marketSize": "$10B",
    "growthRate": "25%",
    "targetMarket": "SMB",
    "competitivePosition": "Growing",
    "differentiators": ["Better UX"],
    "competitors": [{"name": "Competitor", "description": "Leader", "strengths": ["Brand"], "weaknesses": ["Price"]}],
    "marketTrends": ["AI"],
    "opportunities": ["Growth"],
    "threats": ["Competition"]
  },
  "financialHealth": {
    "summary": "Financial summary",
    "revenue": "$5M",
    "growthRate": "150%",
    "burnRate": "$500K",
    "runway": "18 months",
    "fundingHistory": [{"date": "2023", "amount": "$10M", "round": "Series A", "investors": ["VC"]}],
    "keyMetrics": [{"metric": "MRR", "value": "$400K", "trend": "up"}],
    "financialStrengths": ["Growth"],
    "financialRisks": ["Burn"]
  },
  "investmentRecommendation": {
    "score": 75,
    "grade": "B",
    "recommendation": "buy",
    "rationale": "Good opportunity",
    "keyStrengths": ["Tech"],
    "keyRisks": ["Competition"],
    "dueDiligenceGaps": ["References"],
    "nextSteps": ["Meet team"]
  }
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
      const error = new Error(`Gemini API error: ${response.status} - ${errorData}`)
      ;(error as any).status = response.status
      throw error
    }

    return response.json()
  }

  try {
    const data = await retryWithBackoff(generateContent, 3, 2000)
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const rawText = data.candidates[0].content.parts[0].text;
      console.log('Raw Gemini response text:', rawText); // Log the raw response

      // Attempt to extract JSON object using regex, similar to Claude
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('Failed to extract JSON from Gemini response text:', rawText);
        throw new Error('Failed to extract JSON from Gemini response');
      }

      const reportData = JSON.parse(jsonMatch[0]);
      console.log('Gemini analysis complete')
      return reportData
    } else {
      throw new Error('No valid response from Gemini')
    }
    
  } catch (error) {
    console.error('Gemini analysis error:', error)
    
    // Return a fallback report structure
    return createFallbackReport(company, evidenceSummary)
  }
}

function createFallbackReport(company: any, evidenceSummary: any[]): ReportData {
  return {
    companyInfo: {
      name: company.name,
      website: company.website,
      founded: "Unknown",
      headquarters: "Unknown",
      description: `${company.name} is a technology company`,
      mission: "To deliver innovative solutions",
      vision: "To be a leader in technology",
      employeeCount: "Unknown",
      revenue: "Unknown",
      fundingTotal: "Unknown",
      lastValuation: "Unknown"
    },
    technologyOverview: {
      summary: "Technology assessment based on limited evidence",
      primaryStack: [{
        category: "General",
        technologies: ["Modern web technologies"],
        description: "Standard technology stack"
      }],
      architectureHighlights: ["Cloud-based architecture"],
      scalabilityFeatures: ["Scalable infrastructure"],
      innovativeAspects: ["Modern approach"]
    },
    securityAssessment: {
      overallScore: 70,
      summary: "Security assessment pending comprehensive analysis",
      strengths: ["HTTPS enabled"],
      vulnerabilities: [],
      compliance: [],
      recommendations: ["Conduct comprehensive security audit"]
    },
    teamAnalysis: {
      summary: "Team information limited",
      leadershipScore: 70,
      keyMembers: [],
      teamStrengths: ["Dedicated team"],
      teamGaps: ["More information needed"],
      culture: {
        values: ["Innovation"],
        workStyle: "Unknown",
        diversity: "Unknown"
      }
    },
    marketAnalysis: {
      summary: "Market analysis based on available data",
      marketSize: "Unknown",
      growthRate: "Unknown",
      targetMarket: "Technology sector",
      competitivePosition: "To be determined",
      differentiators: [],
      competitors: [],
      marketTrends: ["Digital transformation"],
      opportunities: ["Market growth"],
      threats: ["Competition"]
    },
    financialHealth: {
      summary: "Financial information not available",
      revenue: "Unknown",
      growthRate: "Unknown",
      burnRate: "Unknown",
      runway: "Unknown",
      fundingHistory: [],
      keyMetrics: [],
      financialStrengths: [],
      financialRisks: ["Limited financial visibility"]
    },
    investmentRecommendation: {
      score: 65,
      grade: "C",
      recommendation: "hold",
      rationale: "Insufficient data for comprehensive assessment. Further due diligence required.",
      keyStrengths: ["Established web presence"],
      keyRisks: ["Limited information available"],
      dueDiligenceGaps: ["Financial data", "Team information", "Technical architecture"],
      nextSteps: ["Gather more comprehensive data", "Schedule management meetings"]
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: AnalysisRequest = await req.json()
    
    console.log(`Analyzing ${request.company.name} with ${request.evidenceSummary.length} pieces of evidence`)
    
    let result: ReportData
    
    // Try Claude first (better quality, less rate limiting)
    try {
      result = await analyzeWithClaude(
        request.company,
        request.evidenceSummary,
        request.investorProfile
      )
    } catch (claudeError) {
      console.error('Claude failed, falling back to Gemini:', claudeError)
      
      // Fall back to Gemini
      result = await analyzeWithGemini(
        request.company,
        request.evidenceSummary,
        request.investorProfile,
        req
      )
    }
    
    // Calculate investment score and other derived fields
    const investmentScore = result.investmentRecommendation.score
    const techHealthScore = investmentScore / 10
    const techHealthGrade = 
      investmentScore >= 80 ? 'A' :
      investmentScore >= 70 ? 'B' :
      investmentScore >= 60 ? 'C' :
      investmentScore >= 50 ? 'D' : 'F'
    
    return new Response(JSON.stringify({
      success: true,
      investment_score: investmentScore,
      tech_health_score: techHealthScore,
      tech_health_grade: techHealthGrade,
      executive_summary: result.investmentRecommendation.rationale,
      report_data: result,
      ...result // Spread all fields for backward compatibility
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