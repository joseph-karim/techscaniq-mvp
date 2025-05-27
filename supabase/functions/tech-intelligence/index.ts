import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

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

async function analyzeWithGemini(request: IntelligenceRequest, apiKey: string): Promise<IntelligenceResponse> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro-preview-05-06",
    generationConfig: {
      temperature: 0.3,
      topK: 20,
      topP: 0.85,
      maxOutputTokens: 8000,
    }
  })

  // Build a focused prompt based on website scan data
  const scanSummary = request.websiteScanData ? `
Based on initial website scan:
- Technologies detected: ${request.websiteScanData.technologies?.map(t => t.name).join(', ') || 'None'}
- Infrastructure: ${request.websiteScanData.infrastructure?.cdn || 'Unknown CDN'}, SSL: ${request.websiteScanData.infrastructure?.ssl ? 'Yes' : 'No'}
- Performance: Load time ${request.websiteScanData.performance?.loadTime}ms, ${request.websiteScanData.performance?.resourceCount} resources
- Website title: ${request.websiteScanData.metadata?.title || 'Not found'}
` : ''

  const prompt = `You are a technology due diligence analyst. Analyze ${request.company.name} (${request.company.website}) and provide strategic technology insights.

${scanSummary}

Please search for additional information about ${request.company.name} and provide:

1. Technology Stack Analysis:
   - What technologies are they using beyond what was detected?
   - How modern and scalable is their tech stack?
   - What are the strengths and weaknesses?
   - Specific recommendations for improvement

2. Market Position:
   - Who are their main competitors?
   - What technology differentiates them?
   - How does their tech compare to competitors?

3. Investment Readiness (from a technology perspective):
   - Score from 1-10
   - Key enablers for investment
   - Potential blockers or concerns

Focus on providing actionable, specific insights based on publicly available information. Be concise but thorough.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the response and structure it
    // In a real implementation, we'd use more sophisticated parsing
    const insights: IntelligenceResponse = {
      company: request.company.name,
      analysisDate: new Date().toISOString(),
      insights: {
        technologyStack: {
          summary: extractSection(text, 'Technology Stack Analysis', 'Market Position') || 'Analysis pending',
          strengths: extractBulletPoints(text, 'strengths'),
          weaknesses: extractBulletPoints(text, 'weaknesses'),
          recommendations: extractBulletPoints(text, 'recommendations')
        },
        marketPosition: {
          assessment: extractSection(text, 'Market Position', 'Investment Readiness') || 'Assessment pending',
          competitors: extractBulletPoints(text, 'competitors'),
          differentiators: extractBulletPoints(text, 'differentiates')
        },
        investmentReadiness: {
          score: extractScore(text) || 5,
          enablers: extractBulletPoints(text, 'enablers'),
          blockers: extractBulletPoints(text, 'blockers')
        }
      },
      confidence: 0.8,
      sources: ['Website analysis', 'Public information search']
    }
    
    return insights
  } catch (error) {
    console.error('Gemini analysis error:', error)
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

function extractBulletPoints(text: string, keyword: string): string[] {
  const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\n|\\d\\.|$)`, 'i')
  const match = text.match(regex)
  if (!match) return []
  
  const bulletText = match[1]
  const bullets = bulletText.match(/[-•*]\s*([^\n]+)/g) || []
  return bullets.map(b => b.replace(/^[-•*]\s*/, '').trim())
}

function extractScore(text: string): number {
  const scoreMatch = text.match(/score[:\s]*(\d+)/i)
  return scoreMatch ? parseInt(scoreMatch[1]) : 5
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
    
    // Get API key from environment
    const apiKey = Deno.env.get('GOOGLE_API_KEY')
    if (!apiKey) {
      throw new Error('Google API key not configured')
    }
    
    console.log(`Analyzing ${request.company.name} with Gemini...`)
    
    const intelligence = await analyzeWithGemini(request, apiKey)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: intelligence
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