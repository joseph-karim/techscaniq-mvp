// AI-Driven Workflow Types
// These types align with the enhanced database schema for the AI-driven due diligence system

export interface AIWorkflowRun {
  id: string
  scan_request_id: string
  workflow_type: 'full_report' | 'section_update' | 'evidence_collection'
  status: 'started' | 'planning' | 'collecting' | 'analyzing' | 'drafting' | 'refining' | 'completed' | 'failed'
  current_stage?: string
  stages_completed: string[]
  error_log: Array<{
    stage: string
    error: string
    timestamp: string
  }>
  performance_metrics: {
    total_evidence_collected?: number
    total_citations_generated?: number
    average_confidence_score?: number
    processing_time_by_stage?: Record<string, number>
  }
  started_at: string
  completed_at?: string
  total_processing_time_ms?: number
  created_at: string
}

export interface AIWorkflowStage {
  id: string
  workflow_run_id: string
  stage_name: string
  stage_type: 'planning' | 'collection' | 'analysis' | 'drafting' | 'refinement' | 'coherence'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  ai_model_used?: string
  prompt_template?: string
  input_data: Record<string, any>
  output_data: Record<string, any>
  evidence_items_used: string[]
  processing_time_ms?: number
  confidence_score?: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ToolExecution {
  id: string
  workflow_run_id?: string
  tool_name: 'playwright' | 'wappalyzer' | 'nuclei' | 'lighthouse' | 'ssl_labs' | 'builtwith'
  tool_version?: string
  execution_type: 'web_scraping' | 'tech_detection' | 'security_scan' | 'performance_audit' | 'ssl_analysis'
  target_url?: string
  input_parameters: Record<string, any>
  output_data: Record<string, any>
  success: boolean
  error_message?: string
  execution_time_ms?: number
  evidence_items_generated: string[]
  started_at: string
  completed_at?: string
  created_at: string
}

export interface PromptExecution {
  id: string
  workflow_stage_id?: string
  prompt_type: 'system' | 'planning' | 'section_specific' | 'refinement' | 'coherence'
  prompt_template_id?: string
  prompt_content: string
  ai_model: 'claude-3-sonnet' | 'claude-3-haiku' | 'gpt-4' | 'gpt-3.5-turbo'
  input_tokens?: number
  output_tokens?: number
  response_content: string
  response_quality_score?: number
  execution_time_ms?: number
  cost_usd?: number
  temperature?: number
  created_at: string
}

// Enhanced Evidence Item with RAG support
export interface EnhancedEvidenceItem {
  id: string
  evidence_collection_id: string
  type: 'webpage_content' | 'business_search' | 'technology_stack' | 'security_analysis' | 
        'performance_metrics' | 'ssl_analysis' | 'vulnerability_scan' | 'deep_crawl' | 
        'network_analysis' | 'deepsearch_finding' | 'search_result' | 'api_response' | 'document'
  content_data: {
    raw: string
    processed: string
    summary: string
    title?: string
  }
  source_data: {
    url?: string
    timestamp: string
    query?: string
    api_endpoint?: string
  }
  metadata: {
    confidence?: number
    relevance?: number
    tokens?: number
    fileType?: string
    lastModified?: string
  }
  breadcrumbs: Array<{
    search_query?: string
    extraction_method?: string
    processing_step?: string
  }>
  // Enhanced RAG fields
  vector_embedding?: number[] // Vector for semantic search
  confidence_score: number // AI confidence in evidence quality (0.0-1.0)
  analyst_notes?: string
  retrieval_rank?: number
  tool_used?: string
  processing_stage: 'raw' | 'processed' | 'verified' | 'cited'
  evidence_hash?: string
  extraction_method?: 'web_scraping' | 'api_call' | 'document_parse'
  company_name?: string
  created_at: string
  updated_at: string
}

// Enhanced Citation with full evidence support
export interface EnhancedCitation {
  id: string
  report_id: string
  citation_number: number
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
}

// Enhanced Report with AI processing metadata
export interface EnhancedReport {
  id: string
  scan_request_id: string
  company_name: string
  report_data: {
    company_name: string
    investment_score: number
    sections: {
      executiveSummary: ReportSection
      companyOverview: ReportSection  
      technologyStack: ReportSection
      securityAssessment: ReportSection
      teamAnalysis: ReportSection
      financialOverview: ReportSection
    }
    citations?: EnhancedCitation[]
  }
  executive_summary: string
  investment_score: number
  investment_rationale: string
  tech_health_score: number
  tech_health_grade: string
  evidence_collection_id: string
  metadata: Record<string, any>
  // AI processing metadata
  ai_model_used: string
  processing_time_ms?: number
  evidence_count: number
  citation_count: number
  quality_score: number // 0.0-1.0
  human_reviewed: boolean
  report_version: string
  created_at: string
  updated_at: string
}

export interface ReportSection {
  title: string
  summary: string
  findings?: Array<{
    text: string
    category?: string
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info'
    evidence_ids?: string[]
  }>
  opportunities?: Array<{
    text: string
    evidence_ids?: string[]
  }>
  recommendations?: Array<{
    text: string
    evidence_ids?: string[]
  }>
  risks?: Array<{
    text: string
    severity?: 'critical' | 'high' | 'medium' | 'low'
    evidence_ids?: string[]
  }>
  details?: Record<string, any> // Section-specific structured data
}

// Enhanced Scan Request with AI workflow tracking
export interface EnhancedScanRequest {
  id: string
  company_name: string
  website_url: string
  description?: string
  requestor_name: string
  organization_name: string
  requested_by: string
  status: 'pending' | 'processing' | 'awaiting_review' | 'complete' | 'error'
  thesis_input: {
    predefined_tags: string[]
    custom_criteria: {
      primary: string
      secondary?: string
    }
    industry_focus?: string
    tech_preferences?: string[]
  }
  // AI workflow tracking
  ai_workflow_status: 'pending' | 'processing' | 'completed' | 'failed' | 'review_required'
  ai_workflow_run_id?: string
  evidence_collection_progress: number // 0.0-1.0
  report_generation_progress: number // 0.0-1.0
  thesis_alignment_score?: number // 0.0-1.0
  risk_flags: string[]
  automated_flags: string[]
  // Existing fields
  investment_score?: number
  investment_rationale?: string
  investment_grade?: string
  tech_health_score?: number
  tech_health_grade?: string
  executive_summary?: string
  ai_confidence?: number
  sections: any[]
  risks: any[]
  executive_report_data?: any
  executive_report_generated_at?: string
  created_at: string
  updated_at: string
}

// Workflow progress tracking for frontend
export interface WorkflowProgress {
  workflow_run_id: string
  overall_progress: number // 0-100
  current_stage: string
  stages: Array<{
    name: string
    type: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress: number
    estimated_time_remaining?: number
  }>
  evidence_collected: number
  citations_generated: number
  estimated_completion?: string
  last_updated: string
}

// RAG Query interface for evidence retrieval
export interface RAGQuery {
  query: string
  section_context?: string
  evidence_types?: string[]
  min_confidence?: number
  max_results?: number
  company_name?: string
  collection_id?: string
}

export interface RAGResult {
  evidence_items: EnhancedEvidenceItem[]
  total_results: number
  query_time_ms: number
  relevance_scores: number[]
}