// Investment thesis type
export interface InvestmentThesis {
  type: string
  name: string
  description?: string
  criteria?: string[]
}

// User types
export interface User {
  id: string
  email: string
  name?: string
  role: 'investor' | 'admin'
  workspace_id: string
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

// Scan types
export interface ScanRequest {
  company_name: string
  website_url: string
  description?: string
  thesis_input: ThesisInput
}

export interface ThesisInput {
  predefined_tags: string[]
  custom_criteria: {
    primary: string
    secondary?: string
  }
  industry_focus?: string
  tech_preferences?: string[]
}

export interface Scan {
  id: string
  company_id: string
  company_name: string
  user_id: string
  status: 'pending' | 'processing' | 'awaiting_review' | 'complete' | 'error'
  thesis_input: ThesisInput
  created_at: string
  updated_at: string
  reports?: { id: string }[] | null
  requestor_name?: string | null
  organization_name?: string | null
}

// Report types
export interface TechHealthScore {
  score: number // 1-10
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  confidence: number // 0-100%
  last_updated: string
}

export interface Risk {
  id: string
  scan_id: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  evidence?: Evidence[]
  ai_confidence: number
  advisor_validated: boolean
  created_at: string
}

export interface Evidence {
  source: 'diffbot' | 'crawl4ai' | 'manual' | 'api'
  url?: string
  timestamp: string
  content: string
  confidence: number
  citations: Citation[]
}

export interface Citation {
  id: string
  claim: string
  citation_text: string
  citation_context?: string
  reasoning: string
  confidence: number // 0-100 percentage
  analyst: string
  review_date: string
  methodology?: string
  evidence_item_id: string
  evidence_summary: Array<{
    id: string
    type: string
    title: string
    source: string
    excerpt: string
    metadata: Record<string, any>
  }>
  created_at: string
  updated_at: string
  // Legacy fields for backward compatibility
  text?: string
  source?: string
  relevance?: number
  verification_status?: 'ai-verified' | 'human-verified' | 'pending'
}

export interface ThesisAlignment {
  id: string
  scan_id: string
  thesis_criterion: string
  alignment_type: 'enabler' | 'blocker' | 'neutral'
  related_findings: string[]
  explanation: string
  created_at: string
}

// Advisor review types
export interface AdvisorReview {
  id: string
  scan_id: string
  reviewer_id: string
  sections: {
    [key: string]: {
      ai_generated: string
      advisor_notes?: string
      validation_status: 'approved' | 'modified' | 'flagged'
      confidence: number
    }
  }
  overall_assessment: string
  completed_at?: string
  created_at: string
}

// Export AI workflow types
export * from './ai-workflow'