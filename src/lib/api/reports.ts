import { supabase } from '@/lib/supabase'

export interface ReportWithEvidence {
  id: string
  scan_request_id?: string
  company_name?: string
  report_data: any
  report_type?: string
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

// Inject citations into report content
export function injectCitationsIntoContent(content: string, citations: ReportCitation[]): string {
  if (!content || !citations || citations.length === 0) {
    console.log('No content or citations to inject')
    return content
  }

  console.log(`Starting citation injection: ${citations.length} citations into ${content.length} chars of content`)

  let modifiedContent = content
  let citationNumber = 1
  const usedCitations = new Set<string>()

  // Sort citations by relevance or confidence
  const sortedCitations = [...citations].sort((a, b) => 
    (b.confidence_score || 0) - (a.confidence_score || 0)
  )

  // For each citation, find relevant text in the content and add citation markers
  sortedCitations.forEach((citation) => {
    const claimText = citation.claim || citation.citation_text
    if (!claimText || usedCitations.has(citation.id)) return

    // Extract key terms from the claim for more flexible matching
    const keyTerms = extractKeyTerms(claimText)
    if (keyTerms.length < 2) return

    // Try different matching strategies
    const matchStrategies = [
      // Strategy 1: Look for sentences containing most key terms
      () => findSentenceWithKeyTerms(modifiedContent, keyTerms, 0.7),
      // Strategy 2: Look for paragraphs with key terms
      () => findParagraphWithKeyTerms(modifiedContent, keyTerms, 0.5),
      // Strategy 3: Fuzzy match with original claim
      () => findFuzzyMatch(modifiedContent, claimText)
    ]

    for (const strategy of matchStrategies) {
      const match = strategy()
      if (match) {
        const citationId = `cite-${citationNumber}`
        const citationMarker = ` [${citationNumber}](#${citationId})`
        
        // Check if citation already exists in the vicinity
        const contextStart = Math.max(0, match.index - 50)
        const contextEnd = Math.min(modifiedContent.length, match.index + match.length + 50)
        const context = modifiedContent.substring(contextStart, contextEnd)
        
        if (!context.match(/\[\d+\]/)) {
          console.log(`Injecting citation ${citationNumber} at position ${match.index}`)
          // Insert citation at the end of the matched text
          modifiedContent = modifiedContent.substring(0, match.index + match.length) +
            citationMarker +
            modifiedContent.substring(match.index + match.length)
          
          // Store the citation number for later reference
          ;(citation as any)._citationNumber = citationNumber
          usedCitations.add(citation.id)
          
          citationNumber++
          break
        } else {
          console.log(`Citation already exists near position ${match.index}`)
        }
      }
    }
  })

  console.log(`Citation injection complete: ${citationNumber - 1} citations added`)
  return modifiedContent
}

// Helper function to extract key terms from text
function extractKeyTerms(text: string): string[] {
  // Remove common words and extract significant terms
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'ought', 'may', 'might', 'must', 'can', 'cannot'])
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 10) // Take up to 10 key terms
}

// Find sentence containing percentage of key terms
function findSentenceWithKeyTerms(content: string, keyTerms: string[], threshold: number): { index: number; length: number } | null {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || []
  let currentIndex = 0
  
  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase()
    const matchedTerms = keyTerms.filter(term => sentenceLower.includes(term))
    
    if (matchedTerms.length >= keyTerms.length * threshold) {
      return { index: currentIndex, length: sentence.length }
    }
    currentIndex += sentence.length
  }
  
  return null
}

// Find paragraph containing percentage of key terms
function findParagraphWithKeyTerms(content: string, keyTerms: string[], threshold: number): { index: number; length: number } | null {
  const paragraphs = content.split(/\n\n+/)
  let currentIndex = 0
  
  for (const paragraph of paragraphs) {
    const paragraphLower = paragraph.toLowerCase()
    const matchedTerms = keyTerms.filter(term => paragraphLower.includes(term))
    
    if (matchedTerms.length >= keyTerms.length * threshold) {
      // Find the best sentence within the paragraph
      const sentenceMatch = findSentenceWithKeyTerms(paragraph, keyTerms, threshold)
      if (sentenceMatch) {
        return { index: currentIndex + sentenceMatch.index, length: sentenceMatch.length }
      }
      // Otherwise return the end of the first sentence
      const firstSentenceEnd = paragraph.search(/[.!?]/)
      if (firstSentenceEnd > 0) {
        return { index: currentIndex, length: firstSentenceEnd + 1 }
      }
    }
    currentIndex += paragraph.length + 2 // Account for paragraph breaks
  }
  
  return null
}

// Fuzzy match with original claim
function findFuzzyMatch(content: string, claim: string): { index: number; length: number } | null {
  const words = claim.split(/\s+/).filter(w => w.length > 3)
  if (words.length < 3) return null

  // Create a pattern that allows for some words between key terms
  const pattern = words
    .slice(0, 5) // Use first 5 significant words
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.{0,50}?') // Allow up to 50 chars between words
  
  const regex = new RegExp(`(${pattern})`, 'i')
  const match = content.match(regex)
  
  if (match && match.index !== undefined) {
    return { index: match.index, length: match[0].length }
  }
  
  return null
}

// Inject citations into report sections
export function injectCitationsIntoReport(reportData: any, citations: ReportCitation[]): any {
  if (!reportData || !citations || citations.length === 0) {
    return reportData
  }

  const modifiedReport = { ...reportData }

  // Process sections array (Ring4 format)
  if (Array.isArray(modifiedReport.sections)) {
    modifiedReport.sections = modifiedReport.sections.map((section: any) => ({
      ...section,
      content: section.content ? injectCitationsIntoContent(section.content, citations) : section.content,
      summary: section.summary ? injectCitationsIntoContent(section.summary, citations) : section.summary,
      // Process findings if they exist
      findings: section.findings?.map((finding: any) => ({
        ...finding,
        text: finding.text ? injectCitationsIntoContent(finding.text, citations) : finding.text
      }))
    }))
  }
  // Process sections object (legacy format)
  else if (typeof modifiedReport.sections === 'object' && modifiedReport.sections) {
    Object.keys(modifiedReport.sections).forEach(key => {
      const section = modifiedReport.sections[key]
      if (section.content) {
        modifiedReport.sections[key] = {
          ...section,
          content: injectCitationsIntoContent(section.content, citations)
        }
      }
      // Process subsections if they exist
      if (section.subsections) {
        modifiedReport.sections[key].subsections = section.subsections.map((sub: any) => ({
          ...sub,
          content: sub.content ? injectCitationsIntoContent(sub.content, citations) : sub.content
        }))
      }
    })
  }

  // Process executive summary
  if (modifiedReport.executiveSummary?.content) {
    modifiedReport.executiveSummary.content = injectCitationsIntoContent(
      modifiedReport.executiveSummary.content, 
      citations
    )
  }

  // Process other top-level content fields
  const contentFields = ['executive_summary', 'investment_rationale', 'key_findings']
  contentFields.forEach(field => {
    if (modifiedReport[field] && typeof modifiedReport[field] === 'string') {
      modifiedReport[field] = injectCitationsIntoContent(modifiedReport[field], citations)
    }
  })

  return modifiedReport
}