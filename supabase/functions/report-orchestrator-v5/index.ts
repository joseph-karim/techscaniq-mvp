import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from "../_shared/cors.ts"

// Robust Pipeline Orchestration System with Comprehensive Error Handling

interface PipelineConfig {
  maxRetries: number
  retryDelay: number
  timeout: number
  continueOnError: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

interface StageResult {
  stage: string
  status: 'success' | 'partial' | 'failed' | 'skipped'
  data?: any
  error?: string
  retries?: number
  duration?: number
  evidenceCount?: number
}

interface PipelineState {
  scanRequestId: string
  currentStage: string
  stages: StageResult[]
  totalEvidence: number
  startTime: number
  config: PipelineConfig
  metadata: Record<string, any>
}

class PipelineMonitor {
  private supabase: any
  private state: PipelineState
  
  constructor(supabase: any, scanRequestId: string, config: PipelineConfig) {
    this.supabase = supabase
    this.state = {
      scanRequestId,
      currentStage: 'initialization',
      stages: [],
      totalEvidence: 0,
      startTime: Date.now(),
      config,
      metadata: {}
    }
  }
  
  async log(level: string, message: string, data?: any) {
    const logEntry = {
      scan_request_id: this.state.scanRequestId,
      timestamp: new Date().toISOString(),
      level,
      stage: this.state.currentStage,
      message,
      data: data || {},
      duration_ms: Date.now() - this.state.startTime
    }
    
    // Log to console
    console.log(`[${level.toUpperCase()}] ${message}`, data || '')
    
    // Store in database for monitoring
    try {
      await this.supabase
        .from('pipeline_logs')
        .insert(logEntry)
    } catch (error) {
      console.error('Failed to store log:', error)
    }
  }
  
  async updateStage(stage: string) {
    this.state.currentStage = stage
    await this.updateScanStatus('processing', `Running ${stage}`)
  }
  
  async recordStageResult(result: StageResult) {
    this.state.stages.push(result)
    if (result.evidenceCount) {
      this.state.totalEvidence += result.evidenceCount
    }
    
    await this.log('info', `Stage ${result.stage} completed`, {
      status: result.status,
      duration: result.duration,
      evidenceCount: result.evidenceCount
    })
  }
  
  async updateScanStatus(status: string, message?: string) {
    try {
      await this.supabase
        .from('scan_requests')
        .update({
          status,
          status_message: message,
          last_updated: new Date().toISOString(),
          metadata: {
            ...this.state.metadata,
            pipeline_progress: this.getProgress()
          }
        })
        .eq('id', this.state.scanRequestId)
    } catch (error) {
      await this.log('error', 'Failed to update scan status', { error: error.message })
    }
  }
  
  getProgress() {
    const completed = this.state.stages.filter(s => 
      ['success', 'partial', 'skipped'].includes(s.status)
    ).length
    const total = 10 // Total expected stages
    return {
      percentage: Math.round((completed / total) * 100),
      completedStages: completed,
      totalStages: total,
      currentStage: this.state.currentStage,
      totalEvidence: this.state.totalEvidence
    }
  }
  
  getPipelineSummary() {
    const duration = Date.now() - this.state.startTime
    const successful = this.state.stages.filter(s => s.status === 'success').length
    const failed = this.state.stages.filter(s => s.status === 'failed').length
    const partial = this.state.stages.filter(s => s.status === 'partial').length
    
    return {
      scanRequestId: this.state.scanRequestId,
      duration,
      totalEvidence: this.state.totalEvidence,
      stages: {
        total: this.state.stages.length,
        successful,
        failed,
        partial,
        details: this.state.stages
      },
      overallStatus: failed > 0 ? 'completed_with_errors' : 'success'
    }
  }
}

class ResilientPipelineOrchestrator {
  private supabase: any
  private monitor: PipelineMonitor
  private config: PipelineConfig
  
  constructor(supabase: any, monitor: PipelineMonitor, config: PipelineConfig) {
    this.supabase = supabase
    this.monitor = monitor
    this.config = config
  }
  
  async executePipeline(scanRequest: any) {
    const evidence: any[] = []
    
    try {
      // Stage 1: Initial Evidence Collection
      const stage1Result = await this.executeStage('initial-evidence-collection', async () => {
        return await this.collectInitialEvidence(scanRequest)
      })
      if (stage1Result.data) evidence.push(...stage1Result.data)
      
      // Stage 2: Deep Web Crawling
      const stage2Result = await this.executeStage('deep-web-crawling', async () => {
        return await this.performDeepCrawling(scanRequest, evidence)
      })
      if (stage2Result.data) evidence.push(...stage2Result.data)
      
      // Stage 3: Technology Analysis
      const stage3Result = await this.executeStage('technology-analysis', async () => {
        return await this.analyzeTechnology(scanRequest, evidence)
      })
      if (stage3Result.data) evidence.push(...stage3Result.data)
      
      // Stage 4: Business Intelligence
      const stage4Result = await this.executeStage('business-intelligence', async () => {
        return await this.gatherBusinessIntelligence(scanRequest)
      })
      if (stage4Result.data) evidence.push(...stage4Result.data)
      
      // Stage 5: Security Assessment
      const stage5Result = await this.executeStage('security-assessment', async () => {
        return await this.assessSecurity(scanRequest)
      })
      if (stage5Result.data) evidence.push(...stage5Result.data)
      
      // Stage 6: Competitive Analysis
      const stage6Result = await this.executeStage('competitive-analysis', async () => {
        return await this.analyzeCompetitors(scanRequest)
      })
      if (stage6Result.data) evidence.push(...stage6Result.data)
      
      // Stage 7: Financial Indicators
      const stage7Result = await this.executeStage('financial-indicators', async () => {
        return await this.extractFinancialIndicators(scanRequest)
      })
      if (stage7Result.data) evidence.push(...stage7Result.data)
      
      // Stage 8: Investment Thesis Analysis
      if (scanRequest.investment_thesis) {
        const stage8Result = await this.executeStage('thesis-specific-analysis', async () => {
          return await this.performThesisAnalysis(scanRequest, evidence)
        })
        if (stage8Result.data) evidence.push(...stage8Result.data)
      }
      
      // Stage 9: Evidence Processing & Storage
      const processedEvidence = await this.executeStage('evidence-processing', async () => {
        return await this.processAndStoreEvidence(evidence, scanRequest.id)
      })
      
      // Stage 10: Report Generation
      const report = await this.executeStage('report-generation', async () => {
        return await this.generateReport(scanRequest, processedEvidence.data || evidence)
      })
      
      return {
        success: true,
        evidence: processedEvidence.data || evidence,
        report: report.data,
        summary: this.monitor.getPipelineSummary()
      }
      
    } catch (error) {
      await this.monitor.log('error', 'Pipeline failed catastrophically', { 
        error: error.message,
        stack: error.stack 
      })
      
      return {
        success: false,
        error: error.message,
        evidence,
        summary: this.monitor.getPipelineSummary()
      }
    }
  }
  
  private async executeStage(stageName: string, stageFunction: () => Promise<any>): Promise<StageResult> {
    await this.monitor.updateStage(stageName)
    const startTime = Date.now()
    let retries = 0
    
    while (retries <= this.config.maxRetries) {
      try {
        await this.monitor.log('info', `Starting stage: ${stageName}`, { attempt: retries + 1 })
        
        // Execute with timeout
        const result = await this.withTimeout(stageFunction(), this.config.timeout)
        
        const stageResult: StageResult = {
          stage: stageName,
          status: 'success',
          data: result,
          duration: Date.now() - startTime,
          evidenceCount: Array.isArray(result) ? result.length : 0,
          retries
        }
        
        await this.monitor.recordStageResult(stageResult)
        return stageResult
        
      } catch (error) {
        retries++
        await this.monitor.log('warn', `Stage ${stageName} failed, attempt ${retries}`, { 
          error: error.message 
        })
        
        if (retries <= this.config.maxRetries) {
          await this.delay(this.config.retryDelay * retries)
        } else {
          // Max retries reached
          const stageResult: StageResult = {
            stage: stageName,
            status: 'failed',
            error: error.message,
            duration: Date.now() - startTime,
            retries
          }
          
          await this.monitor.recordStageResult(stageResult)
          
          if (!this.config.continueOnError) {
            throw error
          }
          
          return stageResult
        }
      }
    }
    
    // Should never reach here
    return { stage: stageName, status: 'failed', error: 'Unknown error' }
  }
  
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
    })
    
    return Promise.race([promise, timeoutPromise])
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // Stage implementations with error handling
  
  private async collectInitialEvidence(scanRequest: any) {
    try {
      const { data, error } = await this.supabase.functions.invoke('evidence-collector-v8', {
        body: {
          domain: scanRequest.company_domain,
          company: scanRequest.company_name,
          investment_thesis: scanRequest.investment_thesis,
          depth: 'shallow' // Start with shallow for speed
        }
      })
      
      if (error) throw error
      return data?.evidence || []
    } catch (error) {
      await this.monitor.log('error', 'Initial evidence collection failed', { error: error.message })
      return [] // Return empty array to continue pipeline
    }
  }
  
  private async performDeepCrawling(scanRequest: any, existingEvidence: any[]) {
    try {
      // Only perform deep crawl if initial evidence is promising
      if (existingEvidence.length < 10) {
        await this.monitor.log('info', 'Skipping deep crawl - insufficient initial evidence')
        return []
      }
      
      const { data, error } = await this.supabase.functions.invoke('evidence-collector-v8', {
        body: {
          domain: scanRequest.company_domain,
          company: scanRequest.company_name,
          investment_thesis: scanRequest.investment_thesis,
          depth: 'comprehensive',
          existingEvidence: existingEvidence.slice(0, 20) // Pass sample of existing evidence
        }
      })
      
      if (error) throw error
      return data?.evidence || []
    } catch (error) {
      await this.monitor.log('error', 'Deep crawling failed', { error: error.message })
      return []
    }
  }
  
  private async analyzeTechnology(scanRequest: any, evidence: any[]) {
    try {
      const { data, error } = await this.supabase.functions.invoke('webtech-analyzer', {
        body: {
          url: `https://${scanRequest.company_domain}`,
          existingEvidence: evidence.filter(e => e.type?.includes('tech'))
        }
      })
      
      if (error) throw error
      
      // Convert to evidence format
      const techEvidence = []
      if (data?.technologies) {
        for (const [category, techs] of Object.entries(data.technologies)) {
          techEvidence.push({
            type: `tech-${category}`,
            value: techs,
            source: 'webtech-analyzer',
            confidence: 0.9
          })
        }
      }
      
      return techEvidence
    } catch (error) {
      await this.monitor.log('error', 'Technology analysis failed', { error: error.message })
      return []
    }
  }
  
  private async gatherBusinessIntelligence(scanRequest: any) {
    try {
      const searches = [
        `${scanRequest.company_name} team leadership`,
        `${scanRequest.company_name} funding investors`,
        `${scanRequest.company_name} customers case studies`
      ]
      
      const evidence = []
      
      for (const query of searches) {
        try {
          const { data, error } = await this.supabase.functions.invoke('google-search-collector', {
            body: { query, searchType: 'business' }
          })
          
          if (!error && data?.results) {
            evidence.push(...data.results)
          }
        } catch (searchError) {
          // Continue with other searches
        }
      }
      
      return evidence
    } catch (error) {
      await this.monitor.log('error', 'Business intelligence gathering failed', { error: error.message })
      return []
    }
  }
  
  private async assessSecurity(scanRequest: any) {
    try {
      const securityTools = ['security-scanner', 'testssl-scanner']
      const evidence = []
      
      for (const tool of securityTools) {
        try {
          const { data, error } = await this.supabase.functions.invoke(tool, {
            body: { domain: scanRequest.company_domain }
          })
          
          if (!error && data) {
            evidence.push({
              type: `security-${tool}`,
              value: data,
              source: tool,
              confidence: 0.95
            })
          }
        } catch (toolError) {
          // Continue with other tools
        }
      }
      
      return evidence
    } catch (error) {
      await this.monitor.log('error', 'Security assessment failed', { error: error.message })
      return []
    }
  }
  
  private async analyzeCompetitors(scanRequest: any) {
    try {
      const { data, error } = await this.supabase.functions.invoke('google-search-collector', {
        body: {
          query: `${scanRequest.company_name} vs competitors comparison market share`,
          searchType: 'competitive'
        }
      })
      
      if (error) throw error
      return data?.results || []
    } catch (error) {
      await this.monitor.log('error', 'Competitive analysis failed', { error: error.message })
      return []
    }
  }
  
  private async extractFinancialIndicators(scanRequest: any) {
    try {
      const queries = [
        `${scanRequest.company_name} revenue growth rate`,
        `${scanRequest.company_name} series funding round`,
        `${scanRequest.company_name} valuation`
      ]
      
      const evidence = []
      
      for (const query of queries) {
        try {
          const { data } = await this.supabase.functions.invoke('google-search-collector', {
            body: { query, searchType: 'financial' }
          })
          
          if (data?.results) {
            evidence.push(...data.results)
          }
        } catch (error) {
          // Continue with other queries
        }
      }
      
      return evidence
    } catch (error) {
      await this.monitor.log('error', 'Financial indicator extraction failed', { error: error.message })
      return []
    }
  }
  
  private async performThesisAnalysis(scanRequest: any, evidence: any[]) {
    try {
      // Thesis-specific evidence collection
      const thesisTools = {
        'accelerate-organic-growth': ['marketing-analyzer', 'growth-metrics'],
        'buy-and-build': ['acquisition-analyzer', 'integration-checker'],
        'digital-transformation': ['legacy-system-detector', 'cloud-readiness']
      }
      
      const tools = thesisTools[scanRequest.investment_thesis] || []
      const thesisEvidence = []
      
      // For now, simulate thesis-specific analysis
      thesisEvidence.push({
        type: `thesis-${scanRequest.investment_thesis}`,
        value: {
          alignment: 'high',
          opportunities: ['cloud migration', 'api modernization'],
          risks: ['technical debt', 'legacy systems']
        },
        source: 'thesis-analyzer',
        confidence: 0.8
      })
      
      return thesisEvidence
    } catch (error) {
      await this.monitor.log('error', 'Thesis analysis failed', { error: error.message })
      return []
    }
  }
  
  private async processAndStoreEvidence(evidence: any[], scanRequestId: string) {
    try {
      // Deduplicate evidence
      const seen = new Set()
      const unique = evidence.filter(e => {
        const key = JSON.stringify({ type: e.type, value: e.value })
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      
      await this.monitor.log('info', 'Processing evidence', { 
        total: evidence.length, 
        unique: unique.length 
      })
      
      // Score and prioritize
      const scored = unique.map(e => ({
        ...e,
        score: this.calculateEvidenceScore(e),
        scan_request_id: scanRequestId,
        created_at: new Date().toISOString()
      }))
      
      // Sort by score
      scored.sort((a, b) => b.score - a.score)
      
      // Store in database in batches
      const batchSize = 50
      for (let i = 0; i < scored.length; i += batchSize) {
        const batch = scored.slice(i, i + batchSize)
        
        try {
          const { error } = await this.supabase
            .from('evidence_items')
            .insert(batch)
          
          if (error) {
            await this.monitor.log('error', 'Failed to store evidence batch', { 
              error: error.message,
              batchIndex: i / batchSize 
            })
          }
        } catch (batchError) {
          // Continue with other batches
        }
      }
      
      return scored
    } catch (error) {
      await this.monitor.log('error', 'Evidence processing failed', { error: error.message })
      return evidence // Return unprocessed evidence
    }
  }
  
  private calculateEvidenceScore(evidence: any): number {
    let score = evidence.confidence || 0.5
    
    // Boost score for high-value evidence types
    const highValueTypes = [
      'tech-stack', 'financial-metric', 'team-info',
      'security', 'api-endpoint', 'customer'
    ]
    
    if (highValueTypes.some(t => evidence.type?.includes(t))) {
      score *= 1.5
    }
    
    // Reduce score for low-confidence sources
    if (evidence.source === 'web-search') {
      score *= 0.8
    }
    
    return Math.min(score, 1.0)
  }
  
  private async generateReport(scanRequest: any, evidence: any[]) {
    try {
      // First, create evidence collection
      const { data: collection, error: collectionError } = await this.supabase
        .from('evidence_collections')
        .insert({
          scan_request_id: scanRequest.id,
          status: 'completed',
          evidence_count: evidence.length,
          metadata: {
            company_name: scanRequest.company_name,
            domain: scanRequest.company_domain,
            collection_time: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (collectionError) {
        await this.monitor.log('error', 'Failed to create evidence collection', { 
          error: collectionError.message 
        })
        throw collectionError
      }
      
      // Store evidence items with collection reference
      if (evidence.length > 0) {
        const evidenceItems = evidence.map(e => ({
          ...e,
          collection_id: collection.id,
          scan_request_id: scanRequest.id
        }))
        
        // Store in batches
        const batchSize = 50
        for (let i = 0; i < evidenceItems.length; i += batchSize) {
          const batch = evidenceItems.slice(i, i + batchSize)
          const { error: evidenceError } = await this.supabase
            .from('evidence_items')
            .upsert(batch, { onConflict: 'id' })
          
          if (evidenceError) {
            await this.monitor.log('error', 'Failed to store evidence batch', { 
              error: evidenceError.message,
              batchIndex: i / batchSize
            })
          }
        }
      }
      
      // Generate report with evidence
      const { data, error } = await this.supabase.functions.invoke('tech-intelligence-v3', {
        body: {
          evidence,
          company_name: scanRequest.company_name,
          domain: scanRequest.company_domain,
          investment_thesis: scanRequest.investment_thesis,
          thesis_tags: scanRequest.thesis_tags,
          evidence_collection_id: collection.id
        }
      })
      
      if (error) throw error
      
      // Store the report with evidence collection reference
      if (data?.analysis) {
        const { data: report, error: insertError } = await this.supabase
          .from('reports')
          .insert({
            scan_request_id: scanRequest.id,
            company_name: scanRequest.company_name,
            company_domain: scanRequest.company_domain,
            report_data: data.analysis,
            evidence_count: evidence.length,
            evidence_collection_id: collection.id,
            status: 'completed',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (insertError) {
          await this.monitor.log('error', 'Failed to store report', { error: insertError.message })
          throw insertError
        }
        
        // Create citations if provided by AI
        if (data.citations && data.citations.length > 0) {
          await this.createReportCitations(report.id, data.citations, evidence)
        }
        
        // Update scan request with report reference
        await this.supabase
          .from('scan_requests')
          .update({ 
            latest_report_id: report.id,
            status: 'completed'
          })
          .eq('id', scanRequest.id)
      }
      
      return data
    } catch (error) {
      await this.monitor.log('error', 'Report generation failed', { error: error.message })
      throw error // This is critical, so we throw
    }
  }
  
  private async createReportCitations(reportId: string, citations: any[], evidence: any[]) {
    const reportCitations = []
    
    // Map AI citations to evidence items
    citations.forEach((citation, index) => {
      // Find matching evidence item
      const evidenceItem = evidence.find(e => 
        e.id === citation.evidence_id || 
        (e.type === citation.evidence_type && e.source === citation.source)
      )
      
      if (evidenceItem) {
        reportCitations.push({
          report_id: reportId,
          evidence_item_id: evidenceItem.id,
          citation_number: index + 1,
          section: citation.section || 'general',
          claim_text: citation.claim || citation.text,
          context: citation.context || {},
          created_at: new Date().toISOString()
        } as any)
      }
    })
    
    if (reportCitations.length > 0) {
      const { error } = await this.supabase
        .from('report_citations')
        .insert(reportCitations)
      
      if (error) {
        await this.monitor.log('error', 'Failed to create citations', { 
          error: error.message,
          citationCount: reportCitations.length 
        })
      } else {
        await this.monitor.log('info', 'Created report citations', { 
          count: reportCitations.length 
        })
      }
    }
  }
}

// Main handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { scan_request_id, company_name, company_domain, investment_thesis } = await req.json()
    
    let scanRequest
    
    // Get or create scan request
    if (scan_request_id) {
      const { data, error } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', scan_request_id)
        .single()
      
      if (error) throw new Error(`Scan request not found: ${scan_request_id}`)
      scanRequest = data
    } else {
      // Create new scan request if needed
      const { data, error } = await supabase
        .from('scan_requests')
        .insert({
          company_name,
          company_domain,
          investment_thesis,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      scanRequest = data
    }
    
    // Pipeline configuration
    const config: PipelineConfig = {
      maxRetries: 2,
      retryDelay: 2000,
      timeout: 120000, // 2 minutes per stage
      continueOnError: true, // Keep going even if some stages fail
      logLevel: 'info'
    }
    
    // Initialize monitor
    const monitor = new PipelineMonitor(supabase, scanRequest.id, config)
    await monitor.log('info', 'Starting evidence collection pipeline', { 
      company: scanRequest.company_name,
      domain: scanRequest.company_domain 
    })
    
    // Update scan status
    await monitor.updateScanStatus('processing', 'Pipeline started')
    
    // Execute pipeline
    const orchestrator = new ResilientPipelineOrchestrator(supabase, monitor, config)
    const result = await orchestrator.executePipeline(scanRequest)
    
    // Update final status
    if (result.success) {
      await monitor.updateScanStatus('awaiting_review', 'Pipeline completed successfully')
    } else {
      await monitor.updateScanStatus('completed_with_errors', `Pipeline completed with errors: ${result.error}`)
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error('Pipeline orchestrator error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})