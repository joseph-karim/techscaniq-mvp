import { supabase } from '@/lib/supabase'

export interface ReportWithEvidence {
  id: string
  scan_request_id?: string
  company_name?: string
  report_data: any
  executive_summary?: string
  investment_score?: number
  investment_rationale?: string
  tech_health_score?: number
  tech_health_grade?: string
  evidence_collection_id?: string
  metadata?: any
  created_at: string
  updated_at: string
  ai_model_used?: string
  processing_time_ms?: number
  evidence_count?: number
  citation_count?: number
  quality_score?: number
  human_reviewed?: boolean
  report_version?: string
  evidence_collection?: {
    id: string
    company_name: string
    company_website: string
    evidence_count: number
    collection_status: string
    evidence_items: EvidenceItem[]
  }
  citations: ReportCitation[]
}

export interface EvidenceItem {
  id: string
  collection_id: string
  evidence_id: string
  type: string
  source_data: {
    url?: string
    query?: string
    api?: string
    timestamp?: string
  }
  content_data: {
    raw?: string
    processed?: string
    summary?: string
  }
  metadata: {
    confidence?: number
    relevance?: number
    tokens?: number
    processing_steps?: string[]
  }
  breadcrumbs: any
  created_at: string
}

export interface ReportCitation {
  id: string
  report_id: string
  claim_id: string
  evidence_item_id: string
  citation_text: string
  citation_context?: string
  confidence_score?: number
  claim?: string
  reasoning?: string
  confidence?: number
  analyst?: string
  review_date?: string
  methodology?: string
  evidence_summary?: any[]
  evidence_item?: EvidenceItem
  created_at?: string
  verified_at?: string
  verification_status?: string
  verification_notes?: string
}

export async function fetchReportWithEvidence(reportId: string): Promise<ReportWithEvidence | null> {
  try {
    // First, fetch the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        scan_requests!scan_request_id (
          company_name,
          website_url
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportError) {
      console.error('Error fetching report:', reportError)
      return null
    }

    // Get company name from report
    const companyName = report.company_name || report.report_data?.company_name || 'Unknown Company'

    // Fetch evidence collection for this company
    const { data: evidenceCollection, error: collectionError } = await supabase
      .from('evidence_collections')
      .select(`
        *,
        evidence_items (
          *
        )
      `)
      .eq('company_name', companyName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (collectionError && collectionError.code !== 'PGRST116') {
      console.error('Error fetching evidence collection:', collectionError)
    }

    // Fetch citations for this report with evidence items
    const { data: citations, error: citationsError } = await supabase
      .from('report_citations')
      .select(`
        *,
        evidence_items!evidence_item_id (
          *
        )
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: true })

    if (citationsError) {
      console.error('Error fetching citations:', citationsError)
    }

    // Transform citations to include evidence_item at the root level
    const transformedCitations = citations?.map(citation => ({
      ...citation,
      evidence_item: citation.evidence_items
    })) || []

    return {
      ...report,
      evidence_collection: evidenceCollection || undefined,
      citations: transformedCitations
    }
  } catch (error) {
    console.error('Error in fetchReportWithEvidence:', error)
    return null
  }
}

// Helper function to generate citation ID from claim text
export function generateCitationId(claimText: string): string {
  return `cite-${claimText.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}`
}

// Transform database citations to frontend Citation format
export function transformCitationForFrontend(citation: ReportCitation) {
  return {
    id: citation.claim_id || generateCitationId(citation.citation_text),
    claim: citation.claim || citation.citation_text,
    citation_text: citation.evidence_item?.content_data?.summary || citation.citation_text,
    citation_context: citation.citation_context || citation.evidence_item?.content_data?.processed,
    confidence: citation.confidence || Math.round((citation.confidence_score || 0.8) * 100),
    analyst: citation.analyst || 'AI System',
    review_date: citation.review_date || citation.created_at || new Date().toISOString(),
    reasoning: citation.reasoning || `Based on evidence from ${citation.evidence_item?.source_data?.url || 'collected data'}`,
    methodology: citation.methodology || 'AI-driven analysis with evidence verification',
    evidence_summary: citation.evidence_summary || (citation.evidence_item ? [{
      type: citation.evidence_item.type,
      title: `Evidence from ${citation.evidence_item.source_data?.url || 'collected source'}`,
      source: citation.evidence_item.source_data?.url || 'Internal analysis',
      excerpt: citation.evidence_item.content_data?.summary || citation.evidence_item.content_data?.processed
    }] : [])
  }
}