import { useState } from 'react'
import { supabase } from '../../src/lib/supabase'

interface CompanyInfo {
  name: string
  website: string
}

interface ServiceResult {
  status: 'success' | 'failed'
  data?: any
  error?: string
  duration: number
}

interface OrchestratorResponse {
  reportId: string
  company: string
  executedAt: string
  services: {
    websiteScanner?: ServiceResult
    techIntelligence?: ServiceResult
  }
  totalDuration: number
}

export function useReportOrchestrator() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')

  const generateReport = async (company: CompanyInfo) => {
    setLoading(true)
    setError(null)
    setProgress('Initializing report generation...')

    try {
      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      setProgress('Starting website analysis...')
      
      // Call the report orchestrator
      const response = await fetch('https://xngbtpbtivygkxnsexjg.supabase.co/functions/v1/report-orchestrator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ company })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Report generation failed')
      }

      const orchestratorData: OrchestratorResponse = result.data
      
      // Process the results
      setProgress('Processing analysis results...')
      
      // Combine the data from both services
      const reportData = {
        id: orchestratorData.reportId,
        company_name: orchestratorData.company,
        website_url: company.website,
        generated_at: orchestratorData.executedAt,
        status: 'completed',
        
        // Website scan data
        tech_stack: orchestratorData.services.websiteScanner?.data?.technologies || [],
        infrastructure: orchestratorData.services.websiteScanner?.data?.infrastructure || {},
        performance_metrics: orchestratorData.services.websiteScanner?.data?.performance || {},
        
        // Tech intelligence insights
        technology_summary: orchestratorData.services.techIntelligence?.data?.insights?.technologyStack?.summary || '',
        strengths: orchestratorData.services.techIntelligence?.data?.insights?.technologyStack?.strengths || [],
        weaknesses: orchestratorData.services.techIntelligence?.data?.insights?.technologyStack?.weaknesses || [],
        recommendations: orchestratorData.services.techIntelligence?.data?.insights?.technologyStack?.recommendations || [],
        competitors: orchestratorData.services.techIntelligence?.data?.insights?.marketPosition?.competitors || [],
        investment_score: orchestratorData.services.techIntelligence?.data?.insights?.investmentReadiness?.score || 0,
        
        // Metadata
        execution_time_ms: orchestratorData.totalDuration,
        services_status: {
          websiteScanner: orchestratorData.services.websiteScanner?.status || 'failed',
          techIntelligence: orchestratorData.services.techIntelligence?.status || 'failed'
        },
        
        // Store raw data for reference
        raw_data: orchestratorData
      }

      // Save to database
      setProgress('Saving report to database...')
      const { data: savedReport, error: saveError } = await supabase
        .from('scan_reports')
        .insert({
          user_id: session.user.id,
          company_name: reportData.company_name,
          website_url: reportData.website_url,
          report_data: reportData,
          status: 'completed'
        })
        .select()
        .single()

      if (saveError) {
        console.error('Error saving report:', saveError)
        throw new Error('Failed to save report')
      }

      setProgress('Report generated successfully!')
      return savedReport
      
    } catch (err) {
      console.error('Report generation error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    generateReport,
    loading,
    error,
    progress
  }
} 