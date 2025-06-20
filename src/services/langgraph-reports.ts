// Service for loading LangGraph-generated reports
import { API_BASE_URL } from '@/lib/api-client'

interface LangGraphReport {
  thesis: {
    id: string
    company: string
    website: string
    statement: string
    type: string
    pillars: Array<{
      id: string
      name: string
      weight: number
      description?: string
    }>
  }
  evidence: Array<{
    id: string
    researchQuestionId: string
    pillarId: string
    source: {
      type: string
      name: string
      url?: string
      credibilityScore: number
      publishDate?: string
      author?: string
    }
    content: string
    metadata?: {
      extractedAt?: string
      extractionMethod?: string
      wordCount?: number
      language?: string
      keywords?: string[]
      confidence?: number
    }
    qualityScore: {
      overall: number
      components?: {
        relevance: number
        credibility: number
        recency: number
        specificity: number
        bias: number
        depth?: number
      }
      reasoning?: string
    }
    createdAt?: string
  }>
  report: {
    executiveSummary?: string
    techHealthScore?: number
    techHealthGrade?: string
    investmentScore?: number
    recommendation?: {
      decision: string
      confidence: number
      keyDrivers: string[]
      risks: string[]
      nextSteps: string[]
      timeline?: string
    }
    technicalAssessment?: {
      architecture: { score: number; findings: string[] }
      scalability: { score: number; findings: string[] }
      security: { score: number; findings: string[] }
      teamCapability: { score: number; findings: string[] }
      codeQuality: { score: number; findings: string[] }
      infrastructure: { score: number; findings: string[] }
    }
    sections: Array<{
      title: string
      content: string
      confidence?: number
      citations?: string[]
      riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    }>
    metadata?: {
      confidenceLevel?: string
      inferenceApproach?: string
      informationGatheringRecommendations?: string[]
    }
  }
  metadata?: {
    evidenceCount: number
    averageQualityScore: number
    reportGeneratedAt?: string
    vendorContext?: any
    thesisContext?: any
  }
}

// API implementation
export async function loadLangGraphReport(reportId: string): Promise<LangGraphReport | null> {
  // Convert reportId to proper format if needed
  let apiReportId = reportId;
  if (reportId === 'cibc-adobe-sales-2024') {
    // For demo, we might need to check if there's an actual UUID for this report
    // For now, let the API handle it
  }

  try {
    const response = await fetch(`${API_BASE_URL}/langgraph/${apiReportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      if (response.status === 202) {
        const data = await response.json()
        throw new Error(`Report is still being generated. Status: ${data.status}, Progress: ${data.progress}%`)
      }
      throw new Error(`Failed to load report: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading LangGraph report:', error)
    throw error
  }
}

// Generate a new LangGraph report
export async function generateLangGraphReport(params: {
  company: string
  website: string
  reportType: 'sales-intelligence' | 'pe-due-diligence'
  vendorContext?: {
    vendor: string
    products?: string[]
    useCase?: string
  }
  thesisContext?: {
    investmentThesis?: string
    keyQuestions?: string[]
    focusAreas?: string[]
  }
  metadata?: Record<string, any>
}): Promise<{ reportId: string; status: string; message: string; estimatedTime: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/langgraph/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error generating LangGraph report:', error)
    throw error
  }
}

// Check report generation status
export async function checkReportStatus(reportId: string): Promise<{
  reportId: string
  status: string
  progress: number
  currentPhase: string
  evidenceCount: number
  lastUpdated: string
  estimatedTimeRemaining: string
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/langgraph/${reportId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to check report status: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking report status:', error)
    throw error
  }
}

// List available reports
export async function listLangGraphReports(params?: {
  reportType?: 'sales-intelligence' | 'pe-due-diligence'
  status?: 'processing' | 'completed' | 'failed'
  limit?: number
  offset?: number
}): Promise<{ reports: any[]; total: number }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.reportType) queryParams.append('reportType', params.reportType)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(`${API_BASE_URL}/langgraph/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to list reports: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error listing LangGraph reports:', error)
    throw error
  }
}

// No fallback - throw error if API fails
export async function loadLangGraphReportWithFallback(reportId: string): Promise<LangGraphReport | null> {
  // Just use the API, no fallback
  return await loadLangGraphReport(reportId)
}