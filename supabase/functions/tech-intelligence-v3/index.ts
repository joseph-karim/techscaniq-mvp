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
  console.log('Environment check:', {
    hasAnthropicKey: !!apiKey,
    keyLength: apiKey?.length,
    allEnvKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('ANTHROPIC') || k.includes('API'))
  })
  
  if (!apiKey) {
    console.error('Available environment variables:', Object.keys(Deno.env.toObject()))
    throw new Error('Anthropic API key not configured')
  }

  // Group evidence by category
  const evidenceByCategory = evidenceSummary.reduce((acc, e) => {
    const cat = e.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(e)
    return acc
  }, {} as Record<string, any[]>)

  // Extract investment thesis data for analysis
  const investmentThesis = investorProfile?.investmentThesisData
  const thesisType = investmentThesis?.thesisType || 'general'
  const thesisCriteria = investmentThesis?.criteria || []
  const scoreReweighting = investmentThesis?.scoreReweighting || {}

  const prompt = `You are a senior technology due diligence analyst conducting a comprehensive investment analysis of ${company.name} (${company.website}). Your task is to create an extremely detailed, evidence-based report aligned with the specific PE investment thesis and scoring framework.

CRITICAL: This analysis must be optimized for the "${thesisType}" investment thesis.

INVESTMENT THESIS CONTEXT:
${investmentThesis ? `
Investment Strategy: ${thesisType}
Thesis Description: ${investmentThesis.customThesisDescription || 'Professional PE investment strategy'}
Investment Timeline: ${investmentThesis.timeHorizon}
Target Multiple: ${investmentThesis.targetMultiple}

WEIGHTED EVALUATION CRITERIA (CRITICAL - Use these exact weights for scoring):
${thesisCriteria.map((criteria: any, i: number) => `${i + 1}. ${criteria.name} (${criteria.weight}% weight): ${criteria.description}`).join('\n')}

FOCUS AREAS FOR THIS THESIS: ${investmentThesis.focusAreas?.join(', ')}

SCORE REWEIGHTING ADJUSTMENTS:
${Object.entries(scoreReweighting).map(([area, config]: [string, any]) => `- ${area}: ${config.change} ${config.weight}% (${config.change === '↑' ? 'PRIORITIZE' : config.change === '↓' ? 'DE-EMPHASIZE' : 'MAINTAIN'})`).join('\n')}` : ''}

ANALYSIS GUIDELINES:
1. WEIGHT YOUR ASSESSMENT according to the thesis criteria percentages above
2. PRIORITIZE findings that align with the specified focus areas
3. APPLY score reweighting to emphasize/de-emphasize areas per the thesis
4. Be EXTREMELY detailed and specific. Do not use placeholder text.
5. Include confidence scores (as percentages) for key findings.
6. Reference evidence with bracketed numbers like [1], [2] etc.
7. Write in a professional, analytical tone suitable for PE investment committees.
8. If data is limited, make intelligent inferences based on industry knowledge and available evidence.
9. Each section should be 3-5 paragraphs minimum with specific details.

Evidence collected:
${JSON.stringify(evidenceByCategory, null, 2)}

${investorProfile ? `Investor Profile:
- Firm: ${investorProfile.firmName}
- Primary Criteria: ${investorProfile.primaryCriteria}
- Secondary Criteria: ${investorProfile.secondaryCriteria}` : ''}

Generate a comprehensive investment report with rich detail and analysis. Remember:
- Extract specific technologies, frameworks, and tools from the evidence
- Identify key personnel by name where possible
- Provide specific metrics and numbers where available
- Include market size estimates and growth rates
- Detail security practices and compliance standards
- Analyze competitive positioning with named competitors
- Provide concrete financial estimates based on industry benchmarks

Return ONLY valid JSON matching this exact structure, but with MUCH MORE DETAIL than the examples:

{
  "companyInfo": {
    "name": "${company.name}",
    "website": "${company.website}",
    "founded": "[Extract from evidence or estimate based on domain age, technology choices, and market presence]",
    "headquarters": "[Infer from evidence - look for office locations, team locations, legal entities]",
    "description": "[Write 2-3 sentences describing what the company does, their main products/services, target customers, and unique value proposition based on website content and search results]",
    "mission": "[Extract from website or infer based on their products and messaging - should be a compelling statement]",
    "vision": "[Extract or intelligently infer their long-term vision based on their trajectory and market position]",
    "employeeCount": "[Estimate based on LinkedIn data, job postings, team page, or industry benchmarks for similar companies]",
    "revenue": "[Estimate ARR/revenue based on employee count, funding, pricing, customer base, or industry benchmarks]",
    "fundingTotal": "[Extract from evidence or estimate based on growth stage and team size]",
    "lastValuation": "[Calculate based on funding rounds or estimate using revenue multiples for the sector]"
  },
  "technologyOverview": {
    "summary": "[Write 3-4 sentences providing a comprehensive overview of their technology stack, architecture choices, and technical sophistication. Reference specific technologies found in evidence]",
    "primaryStack": [
      {
        "category": "Frontend",
        "technologies": ["[Extract specific frameworks, libraries, and tools from wappalyzer/crawler evidence]"],
        "description": "[Explain why these choices matter and what they indicate about the team's capabilities]"
      },
      {
        "category": "Backend",
        "technologies": ["[List backend technologies, databases, APIs]"],
        "description": "[Analyze the scalability and modernity of their backend choices]"
      },
      {
        "category": "Infrastructure",
        "technologies": ["[Cloud providers, CDNs, monitoring tools]"],
        "description": "[Evaluate their infrastructure maturity and scalability]"
      }
    ],
    "architectureHighlights": ["[List 4-6 specific architectural decisions or patterns that demonstrate technical sophistication]"],
    "scalabilityFeatures": ["[List 3-5 specific features that show the platform can scale - e.g., microservices, caching layers, CDN usage]"],
    "innovativeAspects": ["[List 3-4 unique or cutting-edge technical approaches they're using]"]
  },
  "securityAssessment": {
    "overallScore": [Calculate 0-100 based on evidence],
    "summary": "[Write 2-3 sentences summarizing their security posture, compliance standards, and any concerns. Be specific about what was found]",
    "strengths": ["[List 4-6 specific security strengths found - SSL config, headers, authentication methods, etc.]"],
    "vulnerabilities": [
      {
        "severity": "[critical/high/medium/low based on actual findings]",
        "description": "[Specific technical vulnerability found or inferred]",
        "recommendation": "[Specific remediation steps]"
      }
    ],
    "compliance": ["[List actual compliance standards they meet or likely meet based on their security practices]"],
    "recommendations": ["[List 3-5 specific security improvements they should make]"]
  },
  "teamAnalysis": {
    "summary": "[Write 3-4 sentences analyzing team composition, experience levels, technical depth, and cultural indicators. Reference specific findings]",
    "leadershipScore": [0-100 based on team quality],
    "keyMembers": [
      {
        "name": "[Extract actual names from team pages, LinkedIn, or news articles]",
        "role": "[Specific title]",
        "background": "[Previous companies, years of experience, notable achievements]",
        "linkedIn": "[Actual LinkedIn URL if found]"
      }
    ],
    "teamStrengths": ["[List 4-5 specific strengths - e.g., 'Deep expertise in distributed systems from ex-Google engineers']"],
    "teamGaps": ["[List 2-3 specific gaps - e.g., 'No apparent Chief Security Officer despite handling sensitive data']"],
    "culture": {
      "values": ["[Extract from about pages, job postings, or infer from content tone]"],
      "workStyle": "[Remote/hybrid/office - infer from job postings, team locations]",
      "diversity": "[Estimate based on team composition, stated values, and hiring practices]"
    }
  },
  "marketAnalysis": {
    "summary": "[Write 3-4 sentences analyzing their market position, TAM, competitive landscape, and growth potential. Include specific market data]",
    "marketSize": "[Provide specific TAM estimate with reasoning - e.g., '$45B global market for X (Gartner 2023)']",
    "growthRate": "[Specific CAGR with source or reasoning]",
    "targetMarket": "[Define their ICP - company size, industry, geography, use cases]",
    "competitivePosition": "[Analyze where they stand - leader, challenger, niche player, new entrant]",
    "differentiators": ["[List 4-5 specific competitive advantages they have]"],
    "competitors": [
      {
        "name": "[Actual competitor name]",
        "description": "[What they do and market position]",
        "strengths": ["[2-3 competitor strengths]"],
        "weaknesses": ["[2-3 competitor weaknesses]"],
        "marketShare": "[Estimate if possible]"
      }
    ],
    "marketTrends": ["[List 4-5 relevant market trends affecting their business]"],
    "opportunities": ["[List 3-4 specific growth opportunities]"],
    "threats": ["[List 3-4 specific market threats or risks]"]
  },
  "financialHealth": {
    "summary": "[Write 2-3 sentences analyzing their financial position, burn rate, and path to profitability based on available evidence and benchmarks]",
    "revenue": "[Estimate with reasoning - e.g., '$3-5M ARR based on 50 employees and B2B SaaS benchmarks']",
    "growthRate": "[Estimate YoY growth based on hiring velocity, customer wins, or market expansion]",
    "burnRate": "[Estimate monthly burn based on team size and industry standards]",
    "runway": "[Calculate based on last funding and burn rate]",
    "fundingHistory": [
      {
        "date": "[Extract or estimate - e.g., '2022-Q3']",
        "amount": "[Specific amount or range]",
        "round": "[Seed/Series A/etc]",
        "investors": ["[List actual investors if known, or types of investors likely attracted]"],
        "valuation": "[Post-money valuation if known or estimate based on round size]"
      }
    ],
    "keyMetrics": [
      {
        "metric": "[Relevant SaaS metric - MRR, ARR, CAC, LTV, etc.]",
        "value": "[Estimate with reasoning]",
        "trend": "up"
      }
    ],
    "financialStrengths": ["[List 3-4 financial strengths]"],
    "financialRisks": ["[List 3-4 financial risks or concerns]"]
  },
  "investmentRecommendation": {
    "score": [CRITICAL: Calculate this weighted score using the thesis criteria above. For each criterion, assign a 0-100 score and multiply by its weight percentage, then sum for final score],
    "grade": "[A/B/C/D/F based on weighted score]",
    "recommendation": "[strong-buy/buy/hold/pass aligned with thesis objectives]",
    "rationale": "[CRITICAL: Explain how this score aligns with the ${thesisType} investment thesis. Reference specific criterion scores and weights. Be explicit about thesis alignment.]",
    "keyStrengths": ["[List 5-6 specific reasons to invest that align with thesis criteria]"],
    "keyRisks": ["[List 4-5 investment risks that could impact thesis success]"],
    "dueDiligenceGaps": ["[List 3-4 areas needing investigation, prioritized by thesis importance]"],
    "nextSteps": ["[List 4-5 next steps aligned with thesis validation and risk mitigation]"],
    "thesisAlignment": {
      "criteriaScores": [${thesisCriteria.map((criteria: any) => `{"criterion": "${criteria.name}", "score": [0-100], "weight": ${criteria.weight}, "rationale": "[Explain scoring for this criterion]"}`).join(', ')}],
      "overallAlignment": "[Excellent/Good/Fair/Poor alignment with ${thesisType} thesis]",
      "keyEnabler": "[Primary technical factor that supports thesis success]",
      "primaryRisk": "[Main technical risk that could undermine thesis]"
    }
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

  const prompt = `You are a senior technology due diligence analyst conducting a comprehensive investment analysis of ${company.name} (${company.website}). Your task is to create an extremely detailed, evidence-based report similar in depth and quality to professional due diligence reports.

IMPORTANT GUIDELINES:
1. Be EXTREMELY detailed and specific. Do not use placeholder text.
2. Infer and extrapolate from the evidence to create a comprehensive narrative.
3. Include confidence scores (as percentages) for key findings.
4. Reference evidence with bracketed numbers like [1], [2] etc.
5. Write in a professional, analytical tone suitable for investment committees.
6. If data is limited, make intelligent inferences based on industry knowledge and available evidence.
7. Each section should be 3-5 paragraphs minimum with specific details.

Evidence collected:
${JSON.stringify(evidenceByCategory, null, 2)}

${investorProfile ? `Investor Profile:
- Firm: ${investorProfile.firmName}
- Thesis: ${investorProfile.thesis}
- Primary Criteria: ${investorProfile.primaryCriteria}
- Secondary Criteria: ${investorProfile.secondaryCriteria}` : ''}

Generate a comprehensive investment report with rich detail and analysis. Remember:
- Extract specific technologies, frameworks, and tools from the evidence
- Identify key personnel by name where possible
- Provide specific metrics and numbers where available
- Include market size estimates and growth rates
- Detail security practices and compliance standards
- Analyze competitive positioning with named competitors
- Provide concrete financial estimates based on industry benchmarks

Return ONLY valid JSON with this exact structure, filling in DETAILED, SPECIFIC information:

{
  "companyInfo": {
    "name": "${company.name}",
    "website": "${company.website}",
    "founded": "[Extract from evidence or estimate based on domain age, technology choices, and market presence]",
    "headquarters": "[Infer from evidence - look for office locations, team locations, legal entities]",
    "description": "[Write 2-3 sentences describing what the company does, their main products/services, target customers, and unique value proposition based on website content and search results]",
    "mission": "[Extract from website or infer based on their products and messaging - should be a compelling statement]",
    "vision": "[Extract or intelligently infer their long-term vision based on their trajectory and market position]",
    "employeeCount": "[Estimate based on LinkedIn data, job postings, team page, or industry benchmarks for similar companies]",
    "revenue": "[Estimate ARR/revenue based on employee count, funding, pricing, customer base, or industry benchmarks]",
    "fundingTotal": "[Extract from evidence or estimate based on growth stage and team size]",
    "lastValuation": "[Calculate based on funding rounds or estimate using revenue multiples for the sector]"
  },
  "technologyOverview": {
    "summary": "[Write 3-4 sentences providing a comprehensive overview of their technology stack, architecture choices, and technical sophistication. Reference specific technologies found in evidence]",
    "primaryStack": [
      {
        "category": "Frontend",
        "technologies": ["[Extract specific frameworks, libraries, and tools from wappalyzer/crawler evidence]"],
        "description": "[Explain why these choices matter and what they indicate about the team's capabilities]"
      },
      {
        "category": "Backend",
        "technologies": ["[List backend technologies, databases, APIs]"],
        "description": "[Analyze the scalability and modernity of their backend choices]"
      },
      {
        "category": "Infrastructure",
        "technologies": ["[Cloud providers, CDNs, monitoring tools]"],
        "description": "[Evaluate their infrastructure maturity and scalability]"
      }
    ],
    "architectureHighlights": ["[List 4-6 specific architectural decisions or patterns that demonstrate technical sophistication]"],
    "scalabilityFeatures": ["[List 3-5 specific features that show the platform can scale]"],
    "innovativeAspects": ["[List 3-4 unique or cutting-edge technical approaches]"]
  },
  "securityAssessment": {
    "overallScore": 85,
    "summary": "[Write 2-3 sentences summarizing security posture with specific findings]",
    "strengths": ["[List 4-6 specific security strengths]"],
    "vulnerabilities": [{"severity": "medium", "description": "[Specific finding]", "recommendation": "[Specific fix]"}],
    "compliance": ["[List actual compliance standards]"],
    "recommendations": ["[List 3-5 specific improvements]"]
  },
  "teamAnalysis": {
    "summary": "[Write 3-4 sentences analyzing team with specific details]",
    "leadershipScore": 80,
    "keyMembers": [{"name": "[Real name]", "role": "[Title]", "background": "[Experience]", "linkedIn": "[URL if found]"}],
    "teamStrengths": ["[List 4-5 specific strengths]"],
    "teamGaps": ["[List 2-3 specific gaps]"],
    "culture": {"values": ["[Extract real values]"], "workStyle": "[Remote/hybrid/office]", "diversity": "[Estimate]"}
  },
  "marketAnalysis": {
    "summary": "[Write 3-4 sentences with market specifics]",
    "marketSize": "[Specific TAM with source]",
    "growthRate": "[Specific CAGR]",
    "targetMarket": "[Define ICP precisely]",
    "competitivePosition": "[Specific position]",
    "differentiators": ["[List 4-5 specific advantages]"],
    "competitors": [{"name": "[Real competitor]", "description": "[What they do]", "strengths": ["[2-3 items]"], "weaknesses": ["[2-3 items]"], "marketShare": "[%]"}],
    "marketTrends": ["[List 4-5 specific trends]"],
    "opportunities": ["[List 3-4 opportunities]"],
    "threats": ["[List 3-4 threats]"]
  },
  "financialHealth": {
    "summary": "[Write 2-3 sentences with financial analysis]",
    "revenue": "[Estimate with reasoning]",
    "growthRate": "[Estimate YoY]",
    "burnRate": "[Estimate monthly]",
    "runway": "[Calculate months]",
    "fundingHistory": [{"date": "[Year-Quarter]", "amount": "[Amount]", "round": "[Type]", "investors": ["[Names]"], "valuation": "[Post-money]"}],
    "keyMetrics": [{"metric": "[SaaS metric]", "value": "[Number]", "trend": "up"}],
    "financialStrengths": ["[List 3-4 strengths]"],
    "financialRisks": ["[List 3-4 risks]"]
  },
  "investmentRecommendation": {
    "score": 75,
    "grade": "B",
    "recommendation": "buy",
    "rationale": "[Write 3-4 sentences with specific investment thesis]",
    "keyStrengths": ["[List 5-6 reasons to invest]"],
    "keyRisks": ["[List 4-5 investment risks]"],
    "dueDiligenceGaps": ["[List 3-4 investigation areas]"],
    "nextSteps": ["[List 4-5 next steps]"]
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
    
    // Use Claude exclusively (as requested by user)
    result = await analyzeWithClaude(
      request.company,
      request.evidenceSummary,
      request.investorProfile
    )
    
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