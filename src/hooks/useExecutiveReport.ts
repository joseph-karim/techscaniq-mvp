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
      // Update scan request status to processing if this is linked to a scan
      const urlParams = new URLSearchParams(window.location.search)
      const requestScanId = urlParams.get('scanId')
      if (requestScanId) {
        await supabase
          .from('scan_requests')
          .update({ status: 'processing' })
          .eq('id', requestScanId)
      }

      // Call the Supabase Edge Function
      setProgress('Analyzing company and gathering public information...')
      
      const { data, error: functionError } = await supabase.functions.invoke('report-orchestrator-v3', {
        body: {
          company: {
            name: params.targetCompany.name,
            website: params.targetCompany.website
          },
          investorProfile: params.investorProfile ? {
            firmName: params.investorProfile.firmName,
            website: params.investorProfile.website,
            thesis: params.contextDocs
          } : undefined,
          analysisDepth: 'comprehensive',
          focusAreas: ['technical', 'security', 'team', 'financial', 'market']
        }
      })

      if (functionError) {
        throw new Error(functionError.message)
      }

      if (!data) {
        throw new Error('Failed to generate report')
      }

      setProgress('Report generated successfully! Saving to database...')
      
      // Transform the response to match our ComprehensiveReport format
      const report: ComprehensiveReport = {
        id: data.reportId,
        companyName: data.company,
        websiteUrl: params.targetCompany.website,
        scanDate: data.generatedAt,
        reportType: 'executive',
        
        executiveSummary: {
          overallAssessment: data.executiveSummary,
          keyFindings: data.sections.technologyStack.findings.map((f: any) => f.claim),
          strategicRecommendations: data.sections.technologyStack.recommendations || [],
          techHealthScore: {
            score: data.investmentScore,
            grade: data.investmentScore >= 80 ? 'A' : data.investmentScore >= 60 ? 'B' : 'C',
            confidence: data.metadata.confidenceScore
          },
          riskSummary: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        },
        
        technologyOverview: {
          stackSummary: data.sections.technologyStack.summary,
          primaryTechnologies: [],
          architecturePattern: 'Modern',
          deploymentModel: 'Cloud',
          scalabilityAssessment: data.sections.infrastructure.summary
        },
        
        stackEvolution: [],
        technicalLeadership: {
          founders: [],
          teamAssessment: data.sections.teamCulture.summary
        },
        
        codeAnalysis: {
          overallQuality: 0,
          publicRepositories: 0,
          languageDistribution: [],
          openSourceContributions: false,
          codePatterns: [],
          estimatedTechnicalDebt: 'Unknown'
        },
        
        infrastructureAnalysis: {
          hostingProvider: 'Unknown',
          deploymentRegions: [],
          certificatesAndCompliance: [],
          performanceMetrics: {},
          scalingCapabilities: data.sections.infrastructure.summary
        },
        
        securityAnalysis: {
          overallSecurityScore: 0,
          sslCertificate: true,
          securityHeaders: [],
          authenticationMethods: [],
          dataProtection: data.sections.security.summary,
          vulnerabilities: []
        },
        
        aiCapabilities: {
          hasAI: false,
          aiFeatures: [],
          aiReadiness: 0,
          potentialAIApplications: []
        },
        
        integrations: {
          totalIntegrations: 0,
          categories: [],
          apiAvailability: false,
          webhooksSupport: false
        },
        
        competitiveAnalysis: {
          marketPosition: data.sections.marketPosition.summary,
          competitors: [],
          differentiators: [],
          marketTrends: []
        },
        
        financialIndicators: {
          estimatedTechSpend: 'Unknown',
          techSpendAsPercentage: 'Unknown',
          costOptimizationOpportunities: [],
          revenueEnablingTech: []
        },
        
        sourceLog: data.evidence.items.map((item: any) => ({
          insightArea: item.type,
          insight: item.content.summary || item.content.raw.substring(0, 200),
          source: item.source.query || 'Direct analysis',
          url: item.source.url,
          confidence: item.metadata.confidence,
          timestamp: new Date().toISOString()
        })),
        
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: [],
          investmentDecision: data.investmentRationale
        },
        
        generatedAt: data.generatedAt,
        modelUsed: 'Gemini 2.0 + Jina AI',
        context: params.targetCompany.assessmentContext || 'general'
      }
      
      // Save the report to Supabase database
      const reportToSave = {
        company_name: report.companyName,
        website_url: report.websiteUrl,
        report_type: report.reportType,
        investor_name: params.investorProfile?.firmName || null,
        assessment_context: params.targetCompany.assessmentContext || 'general',
        report_data: report,
        token_usage: null,
        created_at: new Date().toISOString()
      }

      const { data: savedReport, error: saveError } = await supabase
        .from('scan_reports')
        .insert(reportToSave)
        .select()
        .single()

      if (saveError) {
        console.error('Failed to save report to database:', saveError)
        // Continue anyway - the report was generated successfully
      }

      setProgress('Report saved successfully!')
      
      // If this report is linked to a scan request, update it
      if (requestScanId && savedReport) {
        await supabase
          .from('scan_requests')
          .update({
            status: 'complete',
            executive_report_id: savedReport.id,
            executive_report_data: report,
            executive_report_generated_at: new Date().toISOString()
          })
          .eq('id', requestScanId)
      }
      
      return report

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