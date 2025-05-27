import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Comprehensive report type that combines standard scan with executive features
export interface ComprehensiveReport {
  id: string
  companyName: string
  websiteUrl: string
  scanDate: string
  reportType: 'standard' | 'executive' | 'deep-dive'
  
  investorProfile?: {
    firmName: string
    website: string
    overview: {
      type: string
      headquarters: string
      yearFounded?: string
      aum?: string
      fundStage?: string
    }
    investmentThesis: {
      targetCompanySize: string
      sectorFocus: string[]
      revenueProfile: string
      holdingPeriod?: string
      valueCreationStrategy: string[]
      operatingPlaybook: string[]
    }
    technologyLens: {
      digitalTransformationEmphasis: boolean
      preferences: string[]
      priorCaseStudies?: string[]
    }
  }
  
  executiveSummary: {
    overallAssessment: string
    keyFindings: string[]
    strategicRecommendations: string[]
    techHealthScore: {
      score: number
      grade: 'A' | 'B' | 'C' | 'D' | 'F'
      confidence: number
    }
    riskSummary: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }
  
  technologyOverview: {
    stackSummary: string
    primaryTechnologies: Array<{
      category: string
      technology: string
      version?: string
      purpose: string
      confidence: number
      source: string
    }>
    architecturePattern: string
    deploymentModel: string
    scalabilityAssessment: string
  }
  
  stackEvolution: Array<{
    year: string
    change: string
    signalType: 'verified' | 'inferred' | 'partial'
    confidence: number
    source: string
  }>
  
  technicalLeadership: {
    founders: Array<{
      name: string
      role: string
      background: string
      techStrength: 'high' | 'medium' | 'low'
      linkedinProfile?: string
      confidence: number
    }>
    teamSize?: number
    engineeringHeadcount?: number
    keyHires?: string[]
    teamAssessment: string
  }
  
  codeAnalysis: {
    overallQuality: number
    publicRepositories: number
    languageDistribution: Array<{
      language: string
      percentage: number
      linesOfCode?: number
    }>
    openSourceContributions: boolean
    codePatterns: string[]
    estimatedTechnicalDebt: string
  }
  
  infrastructureAnalysis: {
    hostingProvider: string
    cdnProvider?: string
    deploymentRegions: string[]
    certificatesAndCompliance: string[]
    performanceMetrics: {
      pageLoadTime?: number
      uptime?: number
      responseTime?: number
    }
    scalingCapabilities: string
  }
  
  securityAnalysis: {
    overallSecurityScore: number
    sslCertificate: boolean
    securityHeaders: string[]
    authenticationMethods: string[]
    dataProtection: string
    vulnerabilities: Array<{
      type: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      description: string
      recommendation: string
    }>
  }
  
  aiCapabilities: {
    hasAI: boolean
    aiFeatures: Array<{
      feature: string
      model?: string
      purpose: string
      maturity: 'experimental' | 'production' | 'advanced'
      confidence: number
    }>
    aiReadiness: number
    potentialAIApplications: string[]
  }
  
  integrations: {
    totalIntegrations: number
    categories: Array<{
      category: string
      services: string[]
      criticality: 'critical' | 'important' | 'optional'
    }>
    apiAvailability: boolean
    webhooksSupport: boolean
  }
  
  competitiveAnalysis: {
    marketPosition: string
    competitors: Array<{
      company: string
      techStackSimilarity: number
      strengths: string[]
      weaknesses: string[]
    }>
    differentiators: string[]
    marketTrends: string[]
  }
  
  financialIndicators?: {
    estimatedTechSpend: string
    techSpendAsPercentage: string
    costOptimizationOpportunities: string[]
    revenueEnablingTech: string[]
  }
  
  thesisAlignment?: {
    overallAlignment: number
    enablers: Array<{
      criterion: string
      explanation: string
      evidence: string[]
    }>
    blockers: Array<{
      criterion: string
      explanation: string
      evidence: string[]
    }>
  }
  
  sourceLog: Array<{
    insightArea: string
    insight: string
    source: string
    url?: string
    confidence: number
    timestamp: string
  }>
  
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    investmentDecision?: string
  }
  
  generatedAt: string
  modelUsed: string
  context: string
}

interface GenerateReportParams {
  investorProfile?: {
    firmName: string
    website: string
    supplementalLinks?: {
      crunchbase?: string
      linkedin?: string
      portfolio?: string
      blog?: string
    }
  }
  targetCompany: {
    name: string
    website: string
    assessmentContext?: 'diligence' | 'optimization' | 'exit-planning' | 'general'
  }
  contextDocs?: string
  apiKey?: string
}

interface UseExecutiveReportReturn {
  generateReport: (params: GenerateReportParams) => Promise<ComprehensiveReport | null>
  loading: boolean
  error: string | null
  progress: string | null
}

export function useExecutiveReport(): UseExecutiveReportReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  const generateReport = async (params: GenerateReportParams): Promise<ComprehensiveReport | null> => {
    setLoading(true)
    setError(null)
    setProgress('Initializing report generation...')

    try {
      // Call the Supabase Edge Function
      setProgress('Analyzing company and gathering public information...')
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-executive-report', {
        body: {
          investorProfile: params.investorProfile,
          targetCompany: params.targetCompany,
          contextDocs: params.contextDocs,
          apiKey: params.apiKey || import.meta.env.VITE_GOOGLE_API_KEY
        }
      })

      if (functionError) {
        throw new Error(functionError.message)
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate report')
      }

      setProgress('Report generated successfully! Saving to database...')
      
      // Save the report to Supabase database
      const reportToSave = {
        company_name: data.report.companyName,
        website_url: data.report.websiteUrl,
        report_type: data.report.reportType,
        investor_name: params.investorProfile?.firmName || null,
        assessment_context: params.targetCompany.assessmentContext || 'general',
        report_data: data.report,
        token_usage: data.tokenUsage,
        created_at: new Date().toISOString()
      }

      const { error: saveError } = await supabase
        .from('scan_reports')
        .insert(reportToSave)
        .select()
        .single()

      if (saveError) {
        console.error('Failed to save report to database:', saveError)
        // Continue anyway - the report was generated successfully
      }

      setProgress('Report saved successfully!')
      return data.report as ComprehensiveReport

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      console.error('Error generating report:', err)
      return null
    } finally {
      setLoading(false)
      // Clear progress after 3 seconds
      setTimeout(() => setProgress(null), 3000)
    }
  }

  return {
    generateReport,
    loading,
    error,
    progress
  }
} 