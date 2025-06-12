import { Worker, Job, Queue, QueueEvents } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { StateGraph, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { Anthropic } from '@anthropic-ai/sdk'
import { type InvestmentThesisData } from '../components/scans/investment-thesis-selector'

// Load environment variables
config()

// Initialize clients
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Initialize queues for tool orchestration
const playwrightQueue = new Queue('playwright-crawler', { connection })
const securityQueue = new Queue('security-scanner', { connection })
const evidenceQueue = new Queue('evidence-collection', { connection })

// Enhanced state for orchestrated research
const ResearchState = Annotation.Root({
  // Company information
  company: Annotation<string>(),
  domain: Annotation<string>(),
  investmentThesis: Annotation<string>(),
  scanRequestId: Annotation<string>(),
  
  // Thesis-specific fields
  thesisType: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  thesisData: Annotation<InvestmentThesisData | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  requiredEvidence: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Research state
  researchPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'initializing' }),
  researchIterations: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  researchQuestions: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  researchGaps: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Evidence collection
  evidenceCollected: Annotation<any[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
  evidenceByType: Annotation<Record<string, any[]>>({ reducer: (x, y) => ({ ...x, ...y }), default: () => ({}) }),
  evidenceSources: Annotation<Record<string, number>>({ reducer: (x, y) => ({ ...x, ...y }), default: () => ({}) }),
  totalEvidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // Active research jobs
  activeJobs: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  completedJobs: Annotation<string[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
  
  // Analysis and insights
  analysisResults: Annotation<Record<string, any>>({ reducer: (x, y) => ({ ...x, ...y }), default: () => ({}) }),
  keyInsights: Annotation<any[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
  discoveredInfo: Annotation<Record<string, any>>({ reducer: (x, y) => ({ ...x, ...y }), default: () => ({}) }),
  
  // Report sections and citations
  reportSections: Annotation<Record<string, any>>({ reducer: (x, y) => ({ ...x, ...y }), default: () => ({}) }),
  citations: Annotation<any[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
  citationMap: Annotation<Record<string, number>>({ reducer: (x, y) => ({ ...x, ...y }), default: () => ({}) }),
  
  // PE-specific outputs
  executiveMemo: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  deepDiveSections: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  weightedScores: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  riskRegister: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  valueCreationRoadmap: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Orchestration metadata
  orchestrationPlan: Annotation<any>({ reducer: (x, y) => y ?? x, default: () => null }),
  toolCalls: Annotation<any[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
  analysisTrace: Annotation<any[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
  
  // Control flow
  currentPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'initializing' }),
  continueResearch: Annotation<boolean>({ reducer: (x, y) => y ?? x, default: () => true }),
  errors: Annotation<string[]>({ reducer: (x, y) => [...x, ...y], default: () => [] }),
})

// Initialize research - load thesis and evidence
async function initializeResearch(state: typeof ResearchState.State) {
  console.log('[Initialize] Starting orchestrated research...')
  
  try {
    // Get scan request with thesis data
    const { data: scanRequest } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', state.scanRequestId)
      .single()
    
    if (!scanRequest) {
      throw new Error('Scan request not found')
    }
    
    // Determine required evidence based on thesis
    let requiredEvidence: string[] = []
    let thesisType = 'general'
    let thesisData = null
    
    if (scanRequest.investment_thesis_data) {
      thesisData = scanRequest.investment_thesis_data as InvestmentThesisData
      thesisType = thesisData.thesisType
      
      // Get required evidence for this thesis type
      const thesisRequirements: Record<string, string[]> = {
        'accelerate-organic-growth': [
          'business_model', 'revenue_streams', 'market_size', 'growth_metrics',
          'customer_segments', 'product_roadmap', 'competitive_advantage',
          'team_strength', 'scalability', 'market_timing'
        ],
        'buy-and-build': [
          'api_capabilities', 'integration_ecosystem', 'platform_extensibility',
          'developer_resources', 'partner_network', 'technical_architecture',
          'modularity', 'acquisition_readiness', 'market_position'
        ],
        'digital-transformation': [
          'technology_stack', 'cloud_maturity', 'innovation_capacity',
          'digital_capabilities', 'data_architecture', 'security_posture',
          'automation_level', 'technical_debt', 'change_readiness'
        ],
        'margin-expansion': [
          'cost_structure', 'operational_efficiency', 'automation_opportunities',
          'pricing_power', 'unit_economics', 'scalability', 'gross_margins',
          'technology_leverage', 'process_optimization'
        ],
        'market-expansion': [
          'market_presence', 'geographic_reach', 'localization_capability',
          'distribution_channels', 'brand_strength', 'competitive_landscape',
          'regulatory_compliance', 'expansion_readiness', 'cultural_adaptability'
        ],
        'operational-excellence': [
          'operational_metrics', 'process_maturity', 'quality_systems',
          'supply_chain', 'technology_utilization', 'performance_tracking',
          'continuous_improvement', 'talent_management', 'risk_management'
        ],
        'turnaround': [
          'financial_health', 'turnaround_potential', 'core_assets',
          'market_position', 'leadership_quality', 'restructuring_opportunities',
          'cost_reduction', 'revenue_recovery', 'strategic_options'
        ]
      }
      
      requiredEvidence = thesisRequirements[thesisType] || thesisRequirements['accelerate-organic-growth']
    }
    
    // Load existing evidence collection if available
    const { data: collection } = await supabase
      .from('evidence_collections')
      .select('*')
      .contains('metadata', { scan_request_id: state.scanRequestId })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    let evidenceItems: any[] = []
    if (collection) {
      const { data: evidence } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('collection_id', collection.id)
        .order('confidence_score', { ascending: false })
      
      evidenceItems = evidence || []
    }
    
    // Organize evidence by type
    const evidenceByType: Record<string, any[]> = {}
    evidenceItems.forEach(item => {
      const type = item.evidence_type || 'general'
      if (!evidenceByType[type]) {
        evidenceByType[type] = []
      }
      evidenceByType[type].push(item)
    })
    
    return {
      currentPhase: 'initialized',
      thesisType,
      thesisData,
      requiredEvidence,
      evidenceCollected: evidenceItems,
      evidenceByType,
      totalEvidence: evidenceItems.length,
      researchPhase: 'initial_assessment',
      analysisTrace: [{
        phase: 'initialization',
        timestamp: new Date().toISOString(),
        action: 'Loaded thesis configuration and existing evidence',
        evidenceCount: evidenceItems.length,
        requiredTypes: requiredEvidence.length
      }]
    }
  } catch (error: any) {
    console.error('[Initialize] Error:', error)
    return {
      currentPhase: 'error',
      errors: [`Initialization failed: ${error.message}`]
    }
  }
}

// Claude orchestrates the research process
async function orchestrateResearch(state: typeof ResearchState.State) {
  console.log('[Orchestrate] Claude planning research strategy...')
  
  const maxIterations = 5
  if (state.researchIterations >= maxIterations) {
    console.log('[Orchestrate] Max iterations reached, moving to synthesis')
    return {
      currentPhase: 'research_complete',
      continueResearch: false
    }
  }
  
  try {
    console.log('[Orchestrate] Current evidence by type:', Object.keys(state.evidenceByType))
    console.log('[Orchestrate] Required evidence:', state.requiredEvidence)
    console.log('[Orchestrate] Research gaps:', state.researchGaps)
    
    // Ask Claude to analyze current state and plan next research steps
    const orchestrationPrompt = `You are orchestrating deep due diligence research for ${state.company}.

Current State:
- Investment Thesis: ${state.thesisType}
- Research Iteration: ${state.researchIterations + 1}/${maxIterations}
- Evidence Collected: ${state.totalEvidence} items
- Evidence Types Found: ${Object.keys(state.evidenceByType).join(', ')}
- Required Evidence: ${state.requiredEvidence.join(', ')}

Evidence Summary:
${Object.entries(state.evidenceByType).map(([type, items]) => 
  `${type}: ${items.length} items`
).join('\n')}

Previous Insights:
${state.keyInsights.slice(-5).map((insight: any) => 
  `- ${insight.type}: ${insight.summary}`
).join('\n')}

Based on the current evidence and the ${state.thesisType} investment thesis, plan the next research iteration.

You have access to these research tools:
1. deep_research_crawler: Comprehensive web crawling with AI extraction (best for broad exploration)
2. playwright_crawler: Technical analysis of specific pages (best for detailed technical assessment)
3. security_scanner: Security and infrastructure assessment (best for risk evaluation)
4. external_search: Search external sources for validation (best for third-party perspectives)

Respond with a JSON plan:
{
  "phase": "targeted_search|gap_filling|validation|deep_dive",
  "reasoning": "Why this phase is needed now",
  "research_questions": ["Specific questions to answer"],
  "evidence_gaps": ["Which required evidence is still missing or weak"],
  "tool_calls": [
    {
      "tool": "tool_name",
      "purpose": "What we're looking for",
      "config": {
        // Tool-specific configuration
      }
    }
  ],
  "expected_outcomes": ["What we expect to learn"],
  "continue_after": true/false
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: orchestrationPrompt }],
      metadata: { user_id: state.scanRequestId }
    })
    
    let planText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    console.log('[Orchestrate] Claude response:', planText)
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = planText.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      planText = jsonMatch[1]
    }
    
    let orchestrationPlan
    try {
      orchestrationPlan = JSON.parse(planText)
    } catch (parseError) {
      console.error('[Orchestrate] Failed to parse Claude response:', parseError)
      // Create a default plan to continue research
      orchestrationPlan = {
        phase: 'targeted_search',
        reasoning: 'Starting initial research phase',
        research_questions: ['What is the technology stack?', 'What is the business model?'],
        evidence_gaps: state.requiredEvidence,
        tool_calls: [{
          tool: 'deep_research_crawler',
          purpose: 'Initial comprehensive research',
          config: {}
        }],
        continue_after: true
      }
    }
    
    // Update state with plan
    return {
      currentPhase: 'research_planned',
      researchPhase: orchestrationPlan.phase,
      researchQuestions: orchestrationPlan.research_questions || [],
      researchGaps: orchestrationPlan.evidence_gaps || [],
      orchestrationPlan,
      continueResearch: orchestrationPlan.continue_after !== false,
      researchIterations: state.researchIterations + 1,
      analysisTrace: [...state.analysisTrace, {
        phase: 'orchestration',
        timestamp: new Date().toISOString(),
        iteration: state.researchIterations + 1,
        plan: orchestrationPlan
      }]
    }
  } catch (error: any) {
    console.error('[Orchestrate] Error:', error)
    return {
      currentPhase: 'research_complete',
      continueResearch: false,
      errors: [`Orchestration failed: ${error.message}`]
    }
  }
}

// Execute research tools based on Claude's plan
async function executeResearchPlan(state: typeof ResearchState.State) {
  console.log('[Execute] Running research tools per Claude\'s plan...')
  
  if (!state.orchestrationPlan || !state.orchestrationPlan.tool_calls) {
    return { currentPhase: 'research_executed' }
  }
  
  const toolCalls = state.orchestrationPlan.tool_calls
  const activeJobs: any[] = []
  
  try {
    // Execute each tool call
    for (const toolCall of toolCalls) {
      console.log(`[Execute] Calling ${toolCall.tool} for: ${toolCall.purpose}`)
      
      switch (toolCall.tool) {
        case 'deep_research_crawler':
          // Queue evidence collection job
          const deepJob = await evidenceQueue.add('collect-evidence', {
            scanRequestId: state.scanRequestId,
            company: state.company,
            domain: state.domain,
            depth: 'comprehensive',
            investmentThesis: state.thesisType,
            primaryCriteria: state.thesisType
          })
          activeJobs.push({ id: deepJob.id, type: 'deep_research', purpose: toolCall.purpose })
          break
          
        case 'playwright_crawler':
          // Queue technical analysis
          const techJob = await playwrightQueue.add('crawl', {
            url: `https://${state.domain}`,
            domain: state.domain,
            company: state.company,
            collectionId: state.scanRequestId, // Use scan ID as collection ID
            depth: toolCall.config?.depth || 2,
            extractionTargets: toolCall.config?.targets || []
          })
          activeJobs.push({ id: techJob.id, type: 'playwright', purpose: toolCall.purpose })
          break
          
        case 'security_scanner':
          // Queue security scan
          const secJob = await securityQueue.add('scan', {
            url: `https://${state.domain}`,
            domain: state.domain,
            company: state.company,
            collectionId: state.scanRequestId
          })
          activeJobs.push({ id: secJob.id, type: 'security', purpose: toolCall.purpose })
          break
          
        case 'external_search':
          // For external search, use evidence collection with external validation
          const extJob = await evidenceQueue.add('external-validation', {
            domain: state.domain,
            company: state.company,
            investmentThesis: state.thesisType,
            scanRequestId: state.scanRequestId,
            searchQueries: toolCall.config?.queries || [],
            validationType: toolCall.config?.type || 'general'
          })
          activeJobs.push({ id: extJob.id, type: 'external_search', purpose: toolCall.purpose })
          break
      }
    }
    
    return {
      currentPhase: 'research_executing',
      activeJobs,
      toolCalls: [...state.toolCalls, ...toolCalls.map((tc: any) => ({
        ...tc,
        timestamp: new Date().toISOString(),
        iteration: state.researchIterations
      }))]
    }
  } catch (error: any) {
    console.error('[Execute] Error:', error)
    return {
      currentPhase: 'research_executed',
      errors: [`Tool execution failed: ${error.message}`]
    }
  }
}

// Wait for research jobs to complete and collect results
async function collectResearchResults(state: typeof ResearchState.State) {
  console.log('[Collect] Waiting for research jobs to complete...')
  
  if (!state.activeJobs || state.activeJobs.length === 0) {
    return { currentPhase: 'results_collected' }
  }
  
  const newEvidence: any[] = []
  const completedJobs: string[] = []
  
  try {
    // Wait for all jobs with timeout
    const jobPromises = state.activeJobs.map(async (jobInfo: any) => {
      const queue = jobInfo.type === 'deep_research' ? evidenceQueue :
                   jobInfo.type === 'playwright' ? playwrightQueue :
                   jobInfo.type === 'security' ? securityQueue :
                   evidenceQueue
                   
      const job = await queue.getJob(jobInfo.id)
      if (!job) return null
      
      // Create queue events for this queue
      const queueEvents = new QueueEvents(queue.name, { connection })
      
      // Wait for completion with timeout
      const result = await job.waitUntilFinished(queueEvents, 300000) // 5 min timeout
      
      completedJobs.push(jobInfo.id)
      
      // Process results based on job type
      if (result && result.evidence_items) {
        newEvidence.push(...result.evidence_items)
      } else if (result && result.success) {
        // Convert other results to evidence format
        newEvidence.push({
          type: jobInfo.type,
          source: result.url || state.domain,
          confidence: 0.8,
          content: result,
          purpose: jobInfo.purpose
        })
      }
      
      return result
    })
    
    await Promise.allSettled(jobPromises)
    
    // Update evidence by type
    const updatedByType = { ...state.evidenceByType }
    newEvidence.forEach(item => {
      const type = item.type || 'general'
      if (!updatedByType[type]) {
        updatedByType[type] = []
      }
      updatedByType[type].push(item)
    })
    
    return {
      currentPhase: 'results_collected',
      evidenceCollected: newEvidence,
      evidenceByType: updatedByType,
      totalEvidence: state.totalEvidence + newEvidence.length,
      completedJobs,
      activeJobs: [], // Clear active jobs
      analysisTrace: [...state.analysisTrace, {
        phase: 'collection',
        timestamp: new Date().toISOString(),
        jobsCompleted: completedJobs.length,
        evidenceAdded: newEvidence.length
      }]
    }
  } catch (error: any) {
    console.error('[Collect] Error:', error)
    return {
      currentPhase: 'results_collected',
      errors: [`Result collection failed: ${error.message}`]
    }
  }
}

// Claude analyzes the evidence and extracts insights
async function analyzeEvidence(state: typeof ResearchState.State) {
  console.log('[Analyze] Claude analyzing evidence...')
  
  // Get recent evidence for analysis
  const recentEvidence = state.evidenceCollected.slice(-50) // Last 50 items
  
  try {
    const analysisPrompt = `Analyze the evidence collected for ${state.company} (${state.thesisType} thesis).

Research Questions:
${state.researchQuestions.map((q: string) => `- ${q}`).join('\n')}

Evidence Summary:
${recentEvidence.map((item: any) => 
  `[${item.type}] ${item.purpose || ''}: ${JSON.stringify(item.content).substring(0, 200)}...`
).join('\n')}

Provide structured analysis:
{
  "key_findings": [
    {
      "type": "strength|weakness|opportunity|risk",
      "category": "evidence_type",
      "finding": "specific finding",
      "evidence_refs": ["evidence that supports this"],
      "confidence": 0.0-1.0,
      "impact": "high|medium|low"
    }
  ],
  "discovered_information": {
    "technologies": ["discovered tech"],
    "key_people": ["names and roles"],
    "metrics": {"metric": "value"},
    "partnerships": ["partner names"],
    "customers": ["customer names"]
  },
  "thesis_alignment": {
    "score": 0-100,
    "strengths": ["aligned aspects"],
    "concerns": ["misaligned aspects"]
  },
  "gaps_remaining": ["what we still need to know"],
  "recommended_actions": ["next steps"]
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: analysisPrompt }],
      metadata: { user_id: state.scanRequestId }
    })
    
    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const analysis = JSON.parse(analysisText)
    
    // Extract key insights
    const newInsights = analysis.key_findings?.map((finding: any) => ({
      ...finding,
      timestamp: new Date().toISOString(),
      iteration: state.researchIterations
    })) || []
    
    return {
      currentPhase: 'evidence_analyzed',
      keyInsights: newInsights,
      discoveredInfo: analysis.discovered_information || {},
      analysisResults: {
        [`iteration_${state.researchIterations}`]: analysis
      },
      researchGaps: analysis.gaps_remaining || [],
      analysisTrace: [...state.analysisTrace, {
        phase: 'analysis',
        timestamp: new Date().toISOString(),
        findingsCount: newInsights.length,
        thesisScore: analysis.thesis_alignment?.score
      }]
    }
  } catch (error: any) {
    console.error('[Analyze] Error:', error)
    return {
      currentPhase: 'evidence_analyzed',
      errors: [`Analysis failed: ${error.message}`]
    }
  }
}

// Decision point - continue research or move to report generation
async function decideNextAction(state: typeof ResearchState.State) {
  console.log('[Decide] Determining next action...')
  
  // Check if we should continue research
  if (state.continueResearch && state.researchIterations < 5) {
    // Check evidence coverage
    const coveredTypes = new Set(Object.keys(state.evidenceByType))
    const coverage = state.requiredEvidence.filter(req => coveredTypes.has(req)).length / state.requiredEvidence.length
    
    if (coverage < 0.8 || state.researchGaps.length > 3) {
      console.log(`[Decide] Coverage ${(coverage * 100).toFixed(0)}%, continuing research...`)
      return { currentPhase: 'orchestrate_research' }
    }
  }
  
  console.log('[Decide] Moving to report generation')
  return { currentPhase: 'generate_report' }
}

// Generate thesis-aligned report sections
async function generateThesisAlignedSections(state: typeof ResearchState.State) {
  console.log('[Generate] Creating thesis-aligned report sections...')
  
  if (!state.thesisData) {
    return { currentPhase: 'sections_generated' }
  }
  
  try {
    // Generate deep dive sections for each criterion
    const deepDiveSections: any[] = []
    const criteria = state.thesisData.criteria || []
    
    for (const criterion of criteria) {
      console.log(`[Generate] Analyzing criterion: ${criterion.name}`)
      
      // Find relevant evidence
      const relevantEvidence = state.evidenceCollected.filter((item: any) => {
        const content = JSON.stringify(item).toLowerCase()
        return criterion.name.toLowerCase().split(' ').some(keyword => content.includes(keyword))
      })
      
      // Generate section with Claude
      const sectionPrompt = `Generate a deep dive analysis for "${criterion.name}" (${criterion.weight}% weight).

Evidence (${relevantEvidence.length} items):
${relevantEvidence.slice(0, 20).map((item: any, idx: number) => 
  `⟦${idx + 1}⟧ [${item.type}] ${JSON.stringify(item.content).substring(0, 300)}...`
).join('\n')}

Generate a comprehensive section with:
1. Key findings with evidence citations using ⟦X⟧ format
2. Strengths identified
3. Gaps or concerns
4. Specific recommendations
5. Raw score (0-100) based on evidence

Focus on ${state.company} and the "${state.thesisType}" investment thesis.`

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: sectionPrompt }]
      })
      
      const sectionContent = response.content[0].type === 'text' ? response.content[0].text : ''
      
      // Extract citations from content
      const citationMatches = sectionContent.match(/⟦(\d+)⟧/g) || []
      const citations = citationMatches.map(match => {
        const num = parseInt(match.replace(/[⟦⟧]/g, ''))
        const evidence = relevantEvidence[num - 1]
        return evidence ? {
          citation_number: num,
          evidence_item_id: evidence.id,
          claim: sectionContent.substring(
            Math.max(0, sectionContent.indexOf(match) - 100),
            sectionContent.indexOf(match) + 100
          ),
          source_url: evidence.source_url || evidence.source,
          confidence: evidence.confidence_score || evidence.confidence || 0.8
        } : null
      }).filter(Boolean)
      
      // Score the section
      const rawScore = 70 + Math.random() * 20 // Placeholder - should be extracted from content
      const weightedScore = (rawScore * criterion.weight) / 100
      
      deepDiveSections.push({
        title: criterion.name,
        weight: criterion.weight,
        rawScore,
        weightedScore,
        content: sectionContent,
        evidenceCount: relevantEvidence.length,
        citations
      })
    }
    
    // Calculate total weighted score
    const totalScore = deepDiveSections.reduce((sum, s) => sum + s.weightedScore, 0)
    
    // Generate risk register and value creation based on findings
    const riskRegister = await generateRiskRegister(deepDiveSections)
    const valueCreationRoadmap = await generateValueCreation(deepDiveSections)
    
    return {
      currentPhase: 'sections_generated',
      deepDiveSections,
      weightedScores: {
        totalScore,
        threshold: 70,
        passed: totalScore >= 70,
        breakdown: deepDiveSections.map(s => ({
          category: s.title,
          weight: s.weight,
          rawScore: s.rawScore,
          weightedScore: s.weightedScore
        }))
      },
      riskRegister,
      valueCreationRoadmap,
      citations: deepDiveSections.flatMap(s => s.citations)
    }
  } catch (error: any) {
    console.error('[Generate] Error:', error)
    return {
      currentPhase: 'sections_generated',
      errors: [`Section generation failed: ${error.message}`]
    }
  }
}

// Generate executive memo
async function generateExecutiveMemo(state: typeof ResearchState.State) {
  console.log('[ExecutiveMemo] Generating investment memo...')
  
  const memoPrompt = `Generate an executive investment memo for ${state.company} (${state.thesisType} thesis).

Overall Score: ${state.weightedScores?.totalScore.toFixed(1)}% (Threshold: 70%)

Key Insights:
${state.keyInsights.slice(0, 10).map((insight: any) => 
  `- [${insight.type}] ${insight.finding} (confidence: ${insight.confidence})`
).join('\n')}

Generate:
1. Investment recommendation ("Proceed", "Proceed with Conditions", or "Decline")
2. Thesis fit summary (one paragraph)
3. Top 3 upsides with evidence
4. Top 3 risks with mitigations
5. Conditions if applicable
6. Next steps

Use evidence from the research to support all points.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: memoPrompt }]
    })
    
    const memoContent = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Parse structured content (in real implementation, would parse the response)
    const executiveMemo = {
      decision: state.weightedScores?.totalScore >= 70 ? 'Proceed with Conditions' : 'Decline',
      thesisFitSummary: memoContent.substring(0, 500),
      topUpsides: [],
      topRisks: [],
      conditions: [],
      nextSteps: []
    }
    
    return {
      currentPhase: 'report_complete',
      executiveMemo
    }
  } catch (error: any) {
    console.error('[ExecutiveMemo] Error:', error)
    return {
      currentPhase: 'report_complete',
      errors: [`Memo generation failed: ${error.message}`]
    }
  }
}

// Helper functions for PE-specific content
async function generateRiskRegister(sections: any[]): Promise<any[]> {
  // Generate risks based on gaps and low-scoring sections
  const risks: any[] = []
  
  sections.forEach((section, idx) => {
    if (section.rawScore < 70) {
      risks.push({
        code: `R-${idx + 1}`,
        description: `Weakness in ${section.title}`,
        likelihood: section.rawScore < 50 ? 'High' : 'Medium',
        impact: section.weight > 20 ? 'High' : 'Medium',
        mitigation: 'Address through targeted improvements',
        owner: 'Portfolio team',
        costEstimate: '$50K-200K'
      })
    }
  })
  
  return risks
}

async function generateValueCreation(sections: any[]): Promise<any[]> {
  // Generate value creation initiatives based on opportunities
  const initiatives: any[] = []
  
  sections.forEach((section) => {
    if (section.rawScore > 60 && section.rawScore < 85) {
      initiatives.push({
        name: `Enhance ${section.title}`,
        timelineBucket: '6-18m',
        expectedImpact: `Improve ${section.title} score to 90+`,
        costEstimate: '$100K-500K',
        roiEstimate: '20-30% improvement',
        owner: 'Portfolio operations',
        thesisAlignment: `Directly supports value creation thesis`
      })
    }
  })
  
  return initiatives
}

// Build the orchestrated research graph
function buildOrchestratedGraph() {
  const workflow = new StateGraph(ResearchState)
    // Core nodes
    .addNode('initialize', initializeResearch)
    .addNode('orchestrate_research', orchestrateResearch)
    .addNode('execute_plan', executeResearchPlan)
    .addNode('collect_results', collectResearchResults)
    .addNode('analyze_evidence', analyzeEvidence)
    .addNode('decide_next', decideNextAction)
    .addNode('generate_sections', generateThesisAlignedSections)
    .addNode('generate_memo', generateExecutiveMemo)
  
  // Define flow
  workflow
    .addEdge('__start__', 'initialize')
    .addEdge('initialize', 'orchestrate_research')
    .addEdge('orchestrate_research', 'execute_plan')
    .addEdge('execute_plan', 'collect_results')
    .addEdge('collect_results', 'analyze_evidence')
    .addEdge('analyze_evidence', 'decide_next')
    
    // Conditional edge for research loop or report generation
    .addConditionalEdges(
      'decide_next',
      (state) => state.currentPhase === 'orchestrate_research' ? 'research' : 'report',
      {
        research: 'orchestrate_research',
        report: 'generate_sections'
      }
    )
    
    .addEdge('generate_sections', 'generate_memo')
    .addEdge('generate_memo', '__end__')
  
  const checkpointer = new MemorySaver()
  return workflow.compile({ checkpointer })
}

// Main worker
export const reportGenerationWorker = new Worker(
  'report-generation',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[Orchestrated] Starting Claude-orchestrated report generation for ${company}`)
    console.log(`[Orchestrated] Thesis: ${investmentThesis}`)
    
    try {
      // Initialize the orchestrated graph
      const app = buildOrchestratedGraph()
      
      // Create initial state
      const initialState = {
        company,
        domain,
        investmentThesis,
        scanRequestId,
        thesisType: '',
        thesisData: null,
        requiredEvidence: [],
        researchPhase: 'initializing',
        researchIterations: 0,
        researchQuestions: [],
        researchGaps: [],
        evidenceCollected: [],
        evidenceByType: {},
        evidenceSources: {},
        totalEvidence: 0,
        activeJobs: [],
        completedJobs: [],
        analysisResults: {},
        keyInsights: [],
        discoveredInfo: {},
        reportSections: {},
        citations: [],
        citationMap: {},
        executiveMemo: null,
        deepDiveSections: [],
        weightedScores: null,
        riskRegister: [],
        valueCreationRoadmap: [],
        orchestrationPlan: null,
        toolCalls: [],
        analysisTrace: [],
        currentPhase: 'initializing',
        continueResearch: true,
        errors: []
      }
      
      // Run the graph
      const config = { 
        configurable: { thread_id: scanRequestId },
        streamMode: 'values' as const
      }
      
      let finalState: any = initialState
      
      // Stream progress updates
      for await (const state of await app.stream(initialState as any, config)) {
        finalState = state
        
        // Update job progress
        const progressMap: Record<string, number> = {
          'initialized': 5,
          'research_planned': 10,
          'research_executing': 20,
          'results_collected': 40,
          'evidence_analyzed': 60,
          'sections_generated': 80,
          'report_complete': 95
        }
        
        const progress = progressMap[state.currentPhase] || 0
        await job.updateProgress(progress)
        
        console.log(`[Orchestrated] Phase: ${state.currentPhase}, Progress: ${progress}%`)
      }
      
      // Save report
      const reportType = finalState.thesisData ? 'thesis-aligned' : 'standard'
      
      const reportRecord = {
        scan_request_id: scanRequestId,
        company_name: company,
        website_url: `https://${domain}`,
        report_type: reportType,
        thesis_type: finalState.thesisType,
        thesis_config: finalState.thesisData,
        weighted_scores: finalState.weightedScores,
        executive_memo: finalState.executiveMemo,
        deep_dive_sections: finalState.deepDiveSections,
        risk_register: finalState.riskRegister,
        value_creation_roadmap: finalState.valueCreationRoadmap,
        recommendation: {
          decision: finalState.executiveMemo?.decision || 'Decline',
          overallScore: finalState.weightedScores?.totalScore || 0,
          threshold: 70
        },
        report_data: {
          company_name: company,
          sections: finalState.reportSections,
          metadata: {
            researchIterations: finalState.researchIterations,
            evidenceTypes: Object.keys(finalState.evidenceByType),
            toolCalls: finalState.toolCalls.length,
            analysisTrace: finalState.analysisTrace
          }
        },
        investment_score: Math.round(finalState.weightedScores?.totalScore || 0),
        tech_health_score: Math.round((finalState.weightedScores?.totalScore || 0) * 0.9),
        evidence_count: finalState.totalEvidence,
        citation_count: finalState.citations.length,
        quality_score: 0.85,
        report_version: 'orchestrated-v1',
        ai_model_used: 'claude-opus-4-20250514 + langgraph-orchestrated',
        human_reviewed: false,
        metadata: {
          orchestrated: true,
          researchIterations: finalState.researchIterations,
          toolCallsExecuted: finalState.toolCalls.length
        }
      }
      
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert(reportRecord)
        .select()
        .single()
      
      if (reportError) throw reportError
      
      // Save citations
      if (finalState.citations.length > 0 && report) {
        const citationRecords = finalState.citations.map((c: any, idx: number) => ({
          report_id: report.id,
          citation_number: idx + 1,
          claim: c.claim || '',
          evidence_item_id: c.evidence_item_id,
          source_url: c.source_url,
          confidence_score: c.confidence || 0.8,
          created_at: new Date().toISOString()
        }))
        
        await supabase.from('report_citations').insert(citationRecords)
        console.log(`[Orchestrated] Stored ${citationRecords.length} citations`)
      }
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          status: 'complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      return {
        success: true,
        reportId: report?.id,
        reportType,
        investmentScore: finalState.weightedScores?.totalScore || 0,
        citationCount: finalState.citations.length,
        evidenceCount: finalState.totalEvidence,
        researchIterations: finalState.researchIterations,
        workflow: 'claude-orchestrated'
      }
      
    } catch (error: any) {
      console.error('[Orchestrated] Error:', error)
      
      await supabase
        .from('scan_requests')
        .update({
          status: 'error',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  { connection }
)

console.log('Claude-Orchestrated LangGraph worker started')