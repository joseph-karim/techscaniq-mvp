import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { StateGraph, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { Anthropic } from '@anthropic-ai/sdk'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import { MODEL_BY_TASK } from '../lib/ai-models'

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

// Enhanced types for rich research
interface TechnicalProfile {
  securityGrade: string
  securityHeaders: string[]
  sslVersion: string
  performanceMetrics: {
    ttfb: number
    cdn: string
    caching: string
  }
  detectedAPIs: string[]
  technologies: string[]
  integrations: string[]
  javascriptFrameworks: string[]
  infrastructureSignals: string[]
}

interface AutomatedCheck {
  tool: 'security_scanner' | 'performance_analyzer' | 'api_detector' | 'network_analyzer' | 'tech_stack_analyzer'
  check: string
  expectedOutcome: string
  weight: number
  result?: {
    passed: boolean
    value: any
    confidence: number
  }
}

interface EvidenceNeeded {
  type: string
  specific: string[]
  priority: number
}

interface EnrichedResearchQuestion {
  id: string
  question: string
  category: 'technical' | 'market' | 'business' | 'team'
  priority: 'critical' | 'high' | 'medium' | 'low'
  weight: number
  
  // Evidence requirements
  evidenceTypes: {
    technical: EvidenceNeeded[]
    business: EvidenceNeeded[]
    external: EvidenceNeeded[]
  }
  
  // Automated validation
  automatedChecks: AutomatedCheck[]
  
  // Confidence thresholds
  confidenceRequirements: {
    minimum: number
    target: number
    excellent: number
  }
  
  // Tracking
  status: 'pending' | 'researching' | 'answered' | 'partial' | 'failed'
  findings: any[]
  confidence: number
  automatedResults: any[]
}

// Investment thesis configurations with rich criteria
const THESIS_CONFIGURATIONS = {
  'data_infrastructure': {
    name: 'Data Infrastructure',
    criticalCapabilities: [
      'scalability', 'real-time processing', 'data governance', 
      'enterprise reliability', 'integration ecosystem'
    ],
    technicalRequirements: {
      performance: {
        latency: '< 100ms p95',
        throughput: '> 100k events/sec',
        uptime: '> 99.9%'
      },
      security: {
        encryption: 'AES-256',
        compliance: ['SOC2', 'GDPR', 'HIPAA'],
        authentication: ['SSO', 'OAuth2', 'SAML']
      },
      architecture: {
        patterns: ['microservices', 'event-driven', 'cloud-native'],
        scalability: ['horizontal scaling', 'auto-scaling', 'multi-region']
      }
    },
    businessIndicators: {
      customers: ['enterprise logos', 'case studies', 'testimonials'],
      pricing: ['transparent pricing', 'enterprise tiers', 'usage-based'],
      growth: ['YoY growth', 'market expansion', 'new features']
    },
    competitiveFactors: [
      'performance benchmarks', 'feature comparison', 'pricing comparison',
      'developer experience', 'ecosystem size'
    ]
  },
  'buy-and-build': {
    name: 'Buy and Build Platform',
    criticalCapabilities: [
      'API quality', 'platform extensibility', 'integration readiness',
      'modular architecture', 'partner ecosystem'
    ],
    technicalRequirements: {
      apis: {
        coverage: '> 90% functionality exposed',
        documentation: 'comprehensive with examples',
        stability: 'versioned with deprecation policy'
      },
      extensibility: {
        plugins: 'plugin/extension framework',
        webhooks: 'event-driven integrations',
        sdks: 'multiple language SDKs'
      },
      architecture: {
        modularity: 'loosely coupled services',
        interfaces: 'well-defined contracts',
        deployment: 'containerized/cloud-ready'
      }
    },
    businessIndicators: {
      partnerships: ['integration partners', 'marketplace', 'certified partners'],
      platform: ['app store', 'revenue sharing', 'partner programs'],
      acquisition: ['past acquisitions', 'integration success', 'M&A readiness']
    },
    competitiveFactors: [
      'platform openness', 'partner count', 'integration depth',
      'API completeness', 'developer adoption'
    ]
  }
}

// Types for research state
interface ResearchState {
  company: string
  domain: string
  investmentThesis: string
  thesisConfig: any
  scanRequestId: string
  technicalProfile: TechnicalProfile | null
  competitorProfile: string[]
  researchQuestions: EnrichedResearchQuestion[]
  currentQuestions: EnrichedResearchQuestion[]
  evidenceCollected: any[]
  collectionId: string
  iterationCount: number
  maxIterations: number
  researchDecision: 'continue' | 'sufficient' | 'max_reached'
  scores: Record<string, { value: number; confidence: number; details: string }>
  overallScore: number
  overallConfidence: number
  reportSections: Record<string, any>
  citations: any[]
  executiveSummary: string
  currentPhase: string
  errors: string[]
  researchTrace: any[]
}

// Define the rich research state
const RichResearchState = Annotation.Root({
  // Company context
  company: Annotation<string>(),
  domain: Annotation<string>(),
  investmentThesis: Annotation<string>(),
  thesisConfig: Annotation<any>(),
  scanRequestId: Annotation<string>(),
  
  // Technical profiling
  technicalProfile: Annotation<TechnicalProfile | null>({ reducer: (x, y) => y ?? x, default: () => null }),
  competitorProfile: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Research questions
  researchQuestions: Annotation<EnrichedResearchQuestion[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  currentQuestions: Annotation<EnrichedResearchQuestion[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Evidence and findings
  evidenceCollected: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  collectionId: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  
  // Iteration control
  iterationCount: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  maxIterations: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 4 }),
  researchDecision: Annotation<'continue' | 'sufficient' | 'max_reached'>({ reducer: (x, y) => y ?? x, default: () => 'continue' }),
  
  // Scoring
  scores: Annotation<Record<string, { value: number; confidence: number; details: string }>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  overallScore: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  overallConfidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // Report
  reportSections: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  citations: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  executiveSummary: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  
  // Metadata
  currentPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'profiling' }),
  errors: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  researchTrace: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
})

// Node: Technical profiling with automated tools
async function profileTechnicalLandscape(state: ResearchState) {
  console.log('[ProfileTechnical] Running automated technical analysis...')
  
  try {
    const profile: TechnicalProfile = {
      securityGrade: 'C',
      securityHeaders: [],
      sslVersion: '',
      performanceMetrics: {
        ttfb: 0,
        cdn: '',
        caching: ''
      },
      detectedAPIs: [],
      technologies: [],
      integrations: [],
      javascriptFrameworks: [],
      infrastructureSignals: []
    }
    
    // Add retry wrapper for network operations
    const withRetry = async <T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T | null> => {
      for (let i = 0; i < retries; i++) {
        try {
          return await operation()
        } catch (error) {
          console.warn(`[ProfileTechnical] Attempt ${i + 1} failed:`, error instanceof Error ? error.message : String(error))
          if (i === retries - 1) {
            return null
          }
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
        }
      }
      return null
    }
    
    // 1. Security analysis with retry
    const securityAnalysis = await withRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      try {
        const response = await fetch(`https://${state.domain}`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': 'TechScanIQ Security Scanner/1.0' }
        })
        
        const headers = response.headers
        const securityHeaders: string[] = []
        
        if (headers.get('strict-transport-security')) securityHeaders.push('HSTS')
        if (headers.get('content-security-policy')) securityHeaders.push('CSP')
        if (headers.get('x-frame-options')) securityHeaders.push('X-Frame-Options')
        if (headers.get('x-content-type-options')) securityHeaders.push('X-Content-Type-Options')
        if (headers.get('x-xss-protection')) securityHeaders.push('XSS-Protection')
        
        return {
          headers: securityHeaders,
          grade: securityHeaders.length >= 4 ? 'A' : 
                 securityHeaders.length >= 3 ? 'B' : 
                 securityHeaders.length >= 2 ? 'C' : 'D'
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }, 3, 2000)
    
    if (securityAnalysis) {
      profile.securityHeaders = securityAnalysis.headers
      profile.securityGrade = securityAnalysis.grade
      console.log(`[ProfileTechnical] Security grade: ${profile.securityGrade} (${profile.securityHeaders.length} headers)`)
    } else {
      console.warn('[ProfileTechnical] Security analysis failed - will be flagged as knowledge gap')
      // Don't set defaults - leave as is to show knowledge gap
    }
    
    // 2. Homepage analysis for tech detection
    const homepageAnalysis = await withRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        const response = await fetch(`https://${state.domain}`, {
          headers: { 'User-Agent': 'TechScanIQ/1.0' },
          signal: controller.signal
        })
        
        const html = await response.text()
        const $ = cheerio.load(html)
        
        const analysis = {
          javascriptFrameworks: [] as string[],
          technologies: [] as string[],
          integrations: [] as string[],
          detectedAPIs: [] as string[],
          cdn: ''
        }
        
        // Detect technologies from HTML
        if (html.includes('react')) analysis.javascriptFrameworks.push('React')
        if (html.includes('vue')) analysis.javascriptFrameworks.push('Vue')
        if (html.includes('angular')) analysis.javascriptFrameworks.push('Angular')
        
        // Detect infrastructure signals
        const generator = $('meta[name="generator"]').attr('content')
        if (generator) analysis.technologies.push(generator)
        
        // Check for API documentation links
        $('a[href*="api"], a[href*="docs"], a[href*="developer"]').each((_, el) => {
          const href = $(el).attr('href')
          if (href && (href.includes('/api') || href.includes('/docs'))) {
            analysis.detectedAPIs.push(href)
          }
        })
        
        // Detect third-party integrations from scripts
        $('script[src]').each((_, el) => {
          const src = $(el).attr('src') || ''
          if (src.includes('segment')) analysis.integrations.push('Segment')
          if (src.includes('google-analytics')) analysis.integrations.push('Google Analytics')
          if (src.includes('mixpanel')) analysis.integrations.push('Mixpanel')
          if (src.includes('amplitude')) analysis.integrations.push('Amplitude')
        })
        
        // Detect CDN
        const cdnHeaders = response.headers.get('x-served-by') || response.headers.get('server') || ''
        if (cdnHeaders.includes('cloudflare')) analysis.cdn = 'Cloudflare'
        else if (cdnHeaders.includes('cloudfront')) analysis.cdn = 'CloudFront'
        else if (cdnHeaders.includes('fastly')) analysis.cdn = 'Fastly'
        
        return analysis
      } finally {
        clearTimeout(timeoutId)
      }
    }, 2, 3000)
    
    if (homepageAnalysis) {
      profile.javascriptFrameworks = homepageAnalysis.javascriptFrameworks
      profile.technologies = homepageAnalysis.technologies
      profile.integrations = homepageAnalysis.integrations
      profile.detectedAPIs = homepageAnalysis.detectedAPIs
      profile.performanceMetrics.cdn = homepageAnalysis.cdn
      console.log(`[ProfileTechnical] Found ${profile.technologies.length} technologies, ${profile.detectedAPIs.length} APIs`)
    } else {
      console.warn('[ProfileTechnical] Homepage analysis failed - tech detection will be incomplete')
    }
    
    // 3. Detect competitors from integrations
    const competitorMap: Record<string, string[]> = {
      'Segment': ['data collection', 'customer data platform'],
      'Mixpanel': ['product analytics', 'event tracking'],
      'Google Analytics': ['web analytics', 'marketing analytics'],
      'Amplitude': ['product analytics', 'user behavior']
    }
    
    const competitors = profile.integrations
      .filter(integration => competitorMap[integration])
      .map(integration => integration)
    
    return {
      technicalProfile: profile,
      competitorProfile: competitors,
      currentPhase: 'profile_complete',
      researchTrace: [{
        phase: 'technical_profiling',
        timestamp: new Date().toISOString(),
        securityGrade: profile.securityGrade,
        technologiesFound: profile.technologies.length + profile.javascriptFrameworks.length,
        apisDetected: profile.detectedAPIs.length,
        competitorsIdentified: competitors.length
      }]
    }
  } catch (error) {
    console.error('[ProfileTechnical] Error:', error)
    return {
      errors: [...state.errors, `Technical profiling failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'profile_failed'
    }
  }
}

// Node: Generate rich research questions
async function generateRichQuestions(state: ResearchState) {
  console.log('[GenerateRichQuestions] Creating thesis-aligned research questions...')
  
  try {
    const thesisConfig = THESIS_CONFIGURATIONS[state.investmentThesis as keyof typeof THESIS_CONFIGURATIONS] || THESIS_CONFIGURATIONS['data_infrastructure']
    const profile = state.technicalProfile
    
    // Create context-aware prompt
    const prompt = `Generate rich research questions for ${state.company} (${state.domain}) 
Investment Thesis: ${thesisConfig.name}

Technical Profile:
- Security Grade: ${profile?.securityGrade}
- Technologies Detected: ${profile?.technologies.join(', ') || 'None'}
- APIs Found: ${profile?.detectedAPIs.length || 0}
- Integrations: ${profile?.integrations.join(', ') || 'None'}
- Competitors: ${state.competitorProfile.join(', ') || 'None'}

Critical Capabilities for ${thesisConfig.name}:
${thesisConfig.criticalCapabilities.join(', ')}

Technical Requirements:
${JSON.stringify(thesisConfig.technicalRequirements, null, 2)}

Generate 15-20 specific, measurable research questions that:
1. Leverage the technical profile findings
2. Address critical capabilities with specific metrics
3. Include automated checks we can run
4. Compare against identified competitors
5. Have clear confidence thresholds

For each question, provide:
- Specific automated checks (API tests, performance tests, etc.)
- Evidence types needed (with specific documents/metrics)
- Confidence thresholds (minimum, target, excellent)
- Weight based on thesis priorities

Output as JSON array of EnrichedResearchQuestion objects.`

    const response = await anthropic.messages.create({
      model: MODEL_BY_TASK.QUESTION_GENERATION,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
    
    let questions: EnrichedResearchQuestion[] = []
    
    try {
      questions = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '[]')
    } catch {
      // Fallback to predefined questions if parsing fails
      questions = generateFallbackQuestions(state, thesisConfig, profile)
    }
    
    // Enrich questions with profile-specific checks
    questions = questions.map(q => {
      // Add automated checks based on detected technologies
      if (q.category === 'technical' && profile) {
        if (profile.detectedAPIs.length > 0) {
          q.automatedChecks.push({
            tool: 'api_detector',
            check: 'API endpoint availability and response time',
            expectedOutcome: 'All endpoints return 200 OK with < 500ms response',
            weight: 0.3
          })
        }
        
        if (profile.performanceMetrics.cdn) {
          q.automatedChecks.push({
            tool: 'performance_analyzer',
            check: 'CDN effectiveness and cache hit rate',
            expectedOutcome: `${profile.performanceMetrics.cdn} cache hit rate > 80%`,
            weight: 0.2
          })
        }
      }
      
      return q
    })
    
    // Select initial critical questions
    const criticalQuestions = questions
      .filter(q => q.priority === 'critical')
      .slice(0, 5)
    
    return {
      thesisConfig,
      researchQuestions: questions,
      currentQuestions: criticalQuestions,
      currentPhase: 'questions_generated',
      researchTrace: [...state.researchTrace, {
        phase: 'question_generation',
        timestamp: new Date().toISOString(),
        totalQuestions: questions.length,
        criticalQuestions: criticalQuestions.length,
        enrichedWithProfile: true
      }]
    }
  } catch (error) {
    console.error('[GenerateRichQuestions] Error:', error)
    return {
      errors: [...state.errors, `Question generation failed: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

// Node: Execute automated checks
async function executeAutomatedChecks(state: ResearchState) {
  console.log('[ExecuteAutomatedChecks] Running automated validations...')
  
  try {
    for (const question of state.currentQuestions) {
      console.log(`  Checking: ${question.question}`)
      
      for (const check of question.automatedChecks) {
        try {
          let result = null
          
          switch (check.tool) {
            case 'api_detector':
              result = await checkAPIEndpoints(state.domain, state.technicalProfile?.detectedAPIs || [])
              break
              
            case 'performance_analyzer':
              result = await checkPerformance(state.domain)
              break
              
            case 'security_scanner':
              result = await checkSecurity(state.domain, state.technicalProfile)
              break
              
            default:
              console.log(`    Skipping unimplemented check: ${check.tool}`)
          }
          
          if (result) {
            check.result = result
            question.automatedResults.push(result)
            
            // Update question confidence based on automated results
            if (result.passed) {
              question.confidence = Math.max(question.confidence, result.confidence * check.weight)
            }
          }
        } catch (error) {
          console.error(`    Check failed: ${check.tool} - ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
    
    return {
      currentPhase: 'automated_checks_complete',
      researchTrace: [...state.researchTrace, {
        phase: 'automated_checks',
        timestamp: new Date().toISOString(),
        checksRun: state.currentQuestions.reduce((sum, q) => sum + q.automatedChecks.length, 0),
        checksPassed: state.currentQuestions.reduce((sum, q) => 
          sum + q.automatedChecks.filter(c => c.result?.passed).length, 0
        )
      }]
    }
  } catch (error) {
    console.error('[ExecuteAutomatedChecks] Error:', error)
    return {
      errors: [...state.errors, `Automated checks failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Node: Research with targeted evidence collection
async function researchWithEvidence(state: ResearchState) {
  console.log(`[ResearchWithEvidence] Iteration ${state.iterationCount + 1} - Collecting targeted evidence...`)
  
  try {
    // Create or get collection
    let collectionId = state.collectionId
    if (!collectionId) {
      const { data: collection } = await supabase
        .from('evidence_collections')
        .insert({
          scan_request_id: state.scanRequestId,
          evidence_type: 'rich_iterative',
          source: 'automated_and_targeted',
          total_items: 0,
          metadata: {
            scan_request_id: state.scanRequestId,
            company: state.company,
            thesis: state.investmentThesis,
            iteration: state.iterationCount + 1,
            technicalProfile: state.technicalProfile
          }
        })
        .select()
        .single()
      
      collectionId = collection?.id || ''
    }
    
    const evidenceItems: any[] = []
    
    for (const question of state.currentQuestions) {
      console.log(`  Researching: ${question.question}`)
      
      // 1. Use automated check results as evidence
      for (const check of question.automatedChecks) {
        if (check.result) {
          evidenceItems.push({
            id: crypto.randomUUID(),
            collection_id: collectionId,
            source_url: `automated://${check.tool}`,
            type: 'automated_check',
            title: check.check,
            content_data: {
              question_id: question.id,
              check: check.check,
              result: check.result,
              passed: check.result.passed,
              value: check.result.value
            },
            confidence_score: check.result.confidence,
            metadata: {
              tool: check.tool,
              weight: check.weight,
              automated: true
            },
            created_at: new Date().toISOString()
          })
        }
      }
      
      // 2. Targeted document search based on evidence types
      for (const evidenceType of question.evidenceTypes.technical) {
        for (const specific of evidenceType.specific.slice(0, 2)) {
          try {
            const searchUrl = `https://${state.domain}/${specific.toLowerCase().replace(/\s+/g, '-')}`
            const evidence = await fetchAndExtractEvidence(searchUrl, question.question, specific)
            
            if (evidence && evidence.relevance > 0.6) {
              evidenceItems.push({
                id: crypto.randomUUID(),
                collection_id: collectionId,
                source_url: searchUrl,
                type: 'technical_documentation',
                title: `${evidenceType.type}: ${specific}`,
                content_data: {
                  question_id: question.id,
                  evidence_type: evidenceType.type,
                  specific: specific,
                  extracted: evidence.content,
                  relevance: evidence.relevance
                },
                confidence_score: evidence.confidence,
                metadata: {
                  category: question.category,
                  priority: evidenceType.priority
                },
                created_at: new Date().toISOString()
              })
              
              question.findings.push({
                type: evidenceType.type,
                content: evidence.content,
                confidence: evidence.confidence,
                source: searchUrl
              })
            }
          } catch (error) {
            console.error(`    Failed to fetch ${specific}:`, error instanceof Error ? error.message : 'Unknown error')
          }
        }
      }
      
      // 3. Competitive analysis if competitors identified
      if (state.competitorProfile.length > 0 && question.category === 'market') {
        for (const competitor of state.competitorProfile.slice(0, 2)) {
          const compQuery = `${state.company} vs ${competitor} ${question.question.split(' ').slice(0, 5).join(' ')}`
          // Would search external sources here
          console.log(`    Competitive search: ${compQuery}`)
        }
      }
      
      // Update question status based on all evidence
      // const totalEvidence = question.automatedResults.length + question.findings.length // Not used
      const passedChecks = question.automatedChecks.filter(c => c.result?.passed).length
      const checkWeight = passedChecks / Math.max(1, question.automatedChecks.length)
      const findingWeight = question.findings.length > 0 ? 
        Math.max(...question.findings.map(f => f.confidence)) : 0
      
      question.confidence = checkWeight * 0.6 + findingWeight * 0.4
      
      if (question.confidence >= question.confidenceRequirements.target) {
        question.status = 'answered'
      } else if (question.confidence >= question.confidenceRequirements.minimum) {
        question.status = 'partial'
      } else {
        question.status = 'researching'
      }
    }
    
    // Save evidence
    if (evidenceItems.length > 0) {
      await supabase.from('evidence_items').insert(evidenceItems)
      await supabase
        .from('evidence_collections')
        .update({ total_items: state.evidenceCollected.length + evidenceItems.length })
        .eq('id', collectionId)
    }
    
    return {
      evidenceCollected: [...state.evidenceCollected, ...evidenceItems],
      collectionId,
      iterationCount: state.iterationCount + 1,
      currentPhase: 'research_iteration_complete',
      researchTrace: [...state.researchTrace, {
        phase: 'evidence_collection',
        iteration: state.iterationCount + 1,
        evidenceCollected: evidenceItems.length,
        questionsWithAutomatedResults: state.currentQuestions.filter(q => q.automatedResults.length > 0).length,
        questionsAnswered: state.currentQuestions.filter(q => q.status === 'answered').length
      }]
    }
  } catch (error) {
    console.error('[ResearchWithEvidence] Error:', error)
    return {
      errors: [...state.errors, `Evidence collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Node: Calculate confidence and decide next steps
async function assessProgressAndDecide(state: ResearchState) {
  console.log('[AssessProgress] Evaluating research completeness...')
  
  try {
    // Calculate weighted scores by category
    const categoryScores: Record<string, { value: number; confidence: number; details: string }> = {}
    const scores = state.scores || {}
    
    for (const category of ['technical', 'market', 'business', 'team']) {
      const categoryQuestions = state.researchQuestions.filter(q => q.category === category)
      if (categoryQuestions.length === 0) continue
      
      // Weight questions by priority
      const weightedScore = categoryQuestions.reduce((sum, q) => {
        const statusScore = q.status === 'answered' ? 1 : q.status === 'partial' ? 0.5 : 0
        return sum + (statusScore * q.weight)
      }, 0)
      
      const totalWeight = categoryQuestions.reduce((sum, q) => sum + q.weight, 0)
      const avgConfidence = categoryQuestions.reduce((sum, q) => sum + q.confidence, 0) / categoryQuestions.length
      
      categoryScores[category] = {
        value: Math.round((weightedScore / totalWeight) * 100),
        confidence: avgConfidence,
        details: `${categoryQuestions.filter(q => q.status === 'answered').length}/${categoryQuestions.length} answered`
      }
    }
    
    // Calculate overall score with thesis-specific weights
    const thesisWeights = {
      'data_infrastructure': { technical: 0.4, market: 0.2, business: 0.3, team: 0.1 },
      'buy-and-build': { technical: 0.3, market: 0.3, business: 0.3, team: 0.1 }
    }
    
    const weights = (thesisWeights as any)[state.investmentThesis] || thesisWeights['data_infrastructure']
    
    const overallScore = Object.entries(weights).reduce((sum, [cat, weight]) => {
      return sum + (categoryScores[cat]?.value || 0) * (weight as number)
    }, 0)
    
    const overallConfidence = Object.values(categoryScores).reduce((sum, s) => sum + s.confidence, 0) / 
                             Object.values(categoryScores).length
    
    // Determine if we should continue
    const criticalQuestions = state.researchQuestions.filter(q => q.priority === 'critical')
    const criticalAnswered = criticalQuestions.filter(q => q.status === 'answered').length
    const criticalCoverage = criticalAnswered / criticalQuestions.length
    
    let decision: 'continue' | 'sufficient' | 'max_reached' = 'continue'
    let nextQuestions: EnrichedResearchQuestion[] = []
    
    if (state.iterationCount >= state.maxIterations) {
      decision = 'max_reached'
    } else if (criticalCoverage >= 0.8 && overallConfidence >= 0.7) {
      decision = 'sufficient'
    } else {
      // Select next questions focusing on gaps
      const unanswered = state.researchQuestions.filter(q => 
        q.status === 'pending' || q.status === 'researching'
      )
      const partial = state.researchQuestions.filter(q => 
        q.status === 'partial' && q.confidence < q.confidenceRequirements.target
      )
      
      nextQuestions = [
        ...unanswered.filter(q => q.priority === 'critical').slice(0, 2),
        ...partial.filter(q => q.priority === 'critical').slice(0, 1),
        ...unanswered.filter(q => q.priority === 'high').slice(0, 2)
      ]
      
      if (nextQuestions.length === 0) {
        decision = 'sufficient'
      }
    }
    
    const updatedScores = { ...scores, ...categoryScores }
    
    return {
      scores: updatedScores,
      overallScore,
      overallConfidence,
      researchDecision: decision,
      currentQuestions: nextQuestions,
      currentPhase: 'assessment_complete',
      researchTrace: [...state.researchTrace, {
        phase: 'progress_assessment',
        iteration: state.iterationCount,
        overallScore,
        overallConfidence,
        criticalCoverage,
        decision,
        categoryScores
      }]
    }
  } catch (error) {
    console.error('[AssessProgress] Error:', error)
    return {
      errors: [...state.errors, `Assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      researchDecision: 'sufficient' as const
    }
  }
}

// Node: Generate comprehensive report
async function generateComprehensiveReport(state: ResearchState) {
  console.log('[GenerateReport] Creating comprehensive investment report...')
  
  try {
    const sections: Record<string, any> = {}
    const citations: any[] = []
    let citationNumber = 1
    
    // Generate sections by category
    for (const [category, score] of Object.entries(state.scores)) {
      const questions = state.researchQuestions.filter(q => q.category === category)
      
      const sectionPrompt = `Generate a ${category} analysis section for ${state.company}:

Questions Researched (${questions.length}):
${questions.map(q => `
${q.question}
- Status: ${q.status} (${(q.confidence * 100).toFixed(0)}% confidence)
- Automated Checks: ${q.automatedChecks.filter(c => c.result?.passed).length}/${q.automatedChecks.length} passed
- Findings: ${q.findings.map(f => f.content.substring(0, 100)).join(' | ')}
`).join('\n')}

Category Score: ${score.value}/100 (Confidence: ${(score.confidence * 100).toFixed(0)}%)

Requirements:
1. Lead with the overall assessment and score
2. Cite specific evidence with inline citations [1], [2], etc.
3. Highlight what automated checks revealed
4. Compare against competitors where relevant
5. Be clear about confidence levels and gaps`

      const response = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: sectionPrompt }]
      })
      
      let sectionContent = response.content[0].type === 'text' ? response.content[0].text : ''
      
      // Create citations from evidence
      for (const question of questions) {
        // Citations from automated checks
        for (const check of question.automatedChecks) {
          if (check.result?.passed) {
            citations.push({
              claim_id: `cite_${citationNumber}`,
              claim: `${check.check}: ${check.result.value}`,
              citation_text: `Automated ${check.tool} verification`,
              citation_number: citationNumber,
              evidence_item_id: crypto.randomUUID(),
              confidence: Math.round(check.result.confidence * 100),
              reasoning: `Automated check with ${check.weight} weight`,
              analyst: 'rich-research-automated',
              evidence_summary: {
                type: 'automated_check',
                tool: check.tool,
                result: check.result
              }
            })
            citationNumber++
          }
        }
        
        // Citations from findings
        for (const finding of question.findings) {
          citations.push({
            claim_id: `cite_${citationNumber}`,
            claim: finding.content.substring(0, 100),
            citation_text: finding.content,
            citation_number: citationNumber,
            evidence_item_id: crypto.randomUUID(),
            confidence: Math.round(finding.confidence * 100),
            reasoning: `Evidence for: ${question.question}`,
            analyst: 'rich-research',
            evidence_summary: {
              type: finding.type,
              source: finding.source,
              confidence: finding.confidence
            }
          })
          citationNumber++
        }
      }
      
      sections[category] = {
        title: getCategoryTitle(category),
        content: sectionContent,
        score: score.value,
        confidence: score.confidence,
        details: score.details,
        automatedChecks: questions.reduce((sum, q) => 
          sum + q.automatedChecks.filter(c => c.result?.passed).length, 0
        )
      }
    }
    
    // Executive summary with rich context
    const summaryPrompt = `Create an executive summary for ${state.company} investment analysis:

Investment Thesis: ${state.investmentThesis}
Overall Score: ${state.overallScore}/100 (Confidence: ${(state.overallConfidence * 100).toFixed(0)}%)

Technical Profile:
- Security: ${state.technicalProfile?.securityGrade}
- Technologies: ${state.technicalProfile?.technologies.join(', ')}
- Competitors: ${state.competitorProfile.join(', ')}

Research Summary:
- Iterations: ${state.iterationCount}
- Critical questions answered: ${state.researchQuestions.filter(q => q.priority === 'critical' && q.status === 'answered').length}/${state.researchQuestions.filter(q => q.priority === 'critical').length}
- Automated checks passed: ${state.researchQuestions.reduce((sum, q) => sum + q.automatedChecks.filter(c => c.result?.passed).length, 0)}

Category Scores:
${Object.entries(state.scores).map(([cat, score]) => 
  `- ${cat}: ${score.value}/100 (${score.details})`
).join('\n')}

Write a 500-word executive summary that:
1. Provides clear investment recommendation with confidence level
2. Highlights key technical validations and automated check results
3. Compares against identified competitors
4. States specific risks and gaps
5. Includes 3-5 critical data points with citations`

    const summaryResponse = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: summaryPrompt }]
    })
    
    const executiveSummary = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : ''
    
    return {
      reportSections: sections,
      citations,
      executiveSummary,
      currentPhase: 'complete'
    }
  } catch (error) {
    console.error('[GenerateReport] Error:', error)
    return {
      errors: [...state.errors, `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Helper functions
async function checkAPIEndpoints(domain: string, endpoints: string[]): Promise<any> {
  const results = []
  for (const endpoint of endpoints.slice(0, 3)) {
    try {
      const start = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(endpoint.startsWith('http') ? endpoint : `https://${domain}${endpoint}`, {
        method: 'HEAD',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const responseTime = Date.now() - start
      
      results.push({
        endpoint,
        status: response.status,
        responseTime
      })
    } catch (error) {
      results.push({
        endpoint,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  const successRate = results.filter(r => r.status === 200).length / results.length
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length
  
  return {
    passed: successRate >= 0.8 && avgResponseTime < 500,
    value: {
      successRate,
      avgResponseTime,
      results
    },
    confidence: successRate
  }
}

async function checkPerformance(domain: string): Promise<any> {
  try {
    const start = Date.now()
    const response = await fetch(`https://${domain}`, {
      headers: { 'User-Agent': 'TechScanIQ Performance Check' }
    })
    const ttfb = Date.now() - start
    
    const headers = response.headers
    const cacheControl = headers.get('cache-control') || ''
    const hasGoodCaching = cacheControl.includes('max-age') && 
                          parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '0') > 3600
    
    return {
      passed: ttfb < 1000 && hasGoodCaching,
      value: {
        ttfb,
        caching: cacheControl,
        cdn: headers.get('x-served-by') || headers.get('server') || 'Unknown'
      },
      confidence: ttfb < 500 ? 0.9 : ttfb < 1000 ? 0.7 : 0.5
    }
  } catch (error) {
    return {
      passed: false,
      value: { error: error instanceof Error ? error.message : 'Unknown error' },
      confidence: 0
    }
  }
}

async function checkSecurity(_domain: string, profile: TechnicalProfile | null): Promise<any> {
  const securityScore = profile?.securityHeaders.length || 0
  const hasHTTPS = true // Assumed since we're using https://
  const grade = profile?.securityGrade || 'Unknown'
  
  return {
    passed: securityScore >= 3,
    value: {
      grade,
      headers: profile?.securityHeaders || [],
      https: hasHTTPS
    },
    confidence: securityScore >= 4 ? 0.9 : securityScore >= 3 ? 0.8 : 0.5
  }
}

async function fetchAndExtractEvidence(url: string, _question: string, specific: string): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TechScanIQ Research Bot' }
    })
    
    if (!response.ok) return null
    
    const content = await response.text()
    
    // Simple extraction - in production would use LLM
    const relevantContent = content
      .split('\n')
      .filter(line => line.toLowerCase().includes(specific.toLowerCase()))
      .slice(0, 5)
      .join('\n')
    
    if (!relevantContent) return null
    
    return {
      content: relevantContent.substring(0, 500),
      relevance: 0.7,
      confidence: 0.7
    }
  } catch (error) {
    return null
  }
}

function generateFallbackQuestions(
  state: ResearchState, 
  _thesisConfig: any, 
  _profile: TechnicalProfile | null
): EnrichedResearchQuestion[] {
  // Generate basic questions as fallback
  const questions: EnrichedResearchQuestion[] = []
  
  // Technical questions
  questions.push({
    id: 'q_tech_1',
    question: `What is ${state.company}'s core technology architecture and how does it scale?`,
    category: 'technical',
    priority: 'critical',
    weight: 0.4,
    evidenceTypes: {
      technical: [{ type: 'architecture', specific: ['docs', 'technical', 'infrastructure'], priority: 1 }],
      business: [{ type: 'case_studies', specific: ['scale', 'performance'], priority: 2 }],
      external: [{ type: 'benchmarks', specific: ['performance', 'comparison'], priority: 3 }]
    },
    automatedChecks: [{
      tool: 'performance_analyzer',
      check: 'Homepage load time and optimization',
      expectedOutcome: 'TTFB < 500ms, optimized assets',
      weight: 0.3
    }],
    confidenceRequirements: {
      minimum: 0.5,
      target: 0.8,
      excellent: 0.9
    },
    status: 'pending',
    findings: [],
    confidence: 0,
    automatedResults: []
  })
  
  // Add more fallback questions...
  
  return questions
}

function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    technical: 'Technology & Architecture',
    market: 'Market Position & Competition',
    business: 'Business Model & Growth',
    team: 'Team & Execution'
  }
  return titles[category] || category
}

// Build the rich research graph
function buildRichResearchGraph() {
  const workflow = new StateGraph(RichResearchState)
    .addNode('profile_technical', profileTechnicalLandscape)
    .addNode('generate_questions', generateRichQuestions)
    .addNode('execute_automated_checks', executeAutomatedChecks)
    .addNode('research_with_evidence', researchWithEvidence)
    .addNode('assess_progress', assessProgressAndDecide)
    .addNode('generate_report', generateComprehensiveReport)
  
  // Define the flow
  workflow
    .addEdge('__start__', 'profile_technical')
    .addEdge('profile_technical', 'generate_questions')
    .addEdge('generate_questions', 'execute_automated_checks')
    .addEdge('execute_automated_checks', 'research_with_evidence')
    .addEdge('research_with_evidence', 'assess_progress')
    .addConditionalEdges(
      'assess_progress',
      (state) => state.researchDecision,
      {
        'continue': 'execute_automated_checks', // Loop back with new questions
        'sufficient': 'generate_report',
        'max_reached': 'generate_report'
      }
    )
    .addEdge('generate_report', '__end__')
  
  const checkpointer = new MemorySaver()
  return workflow.compile({ checkpointer })
}

// Main worker
export const richIterativeResearchWorker = new Worker(
  'rich-iterative-research',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[RichIterativeResearch] Starting enhanced research for ${company}`)
    
    try {
      const app = buildRichResearchGraph()
      
      const initialState = {
        company,
        domain,
        investmentThesis,
        thesisConfig: null,
        scanRequestId,
        technicalProfile: null,
        competitorProfile: [],
        researchQuestions: [],
        currentQuestions: [],
        evidenceCollected: [],
        collectionId: '',
        iterationCount: 0,
        maxIterations: 4,
        researchDecision: 'continue' as const,
        scores: {},
        overallScore: 0,
        overallConfidence: 0,
        reportSections: {},
        citations: [],
        executiveSummary: '',
        currentPhase: 'profiling',
        errors: [],
        researchTrace: []
      }
      
      const config = { 
        configurable: { thread_id: scanRequestId },
        streamMode: 'values' as const
      }
      
      let finalState: any = initialState
      
      // Stream progress updates
      for await (const state of await app.stream(initialState as any, config)) {
        finalState = state
        
        const progressMap: Record<string, number> = {
          'profile_complete': 10,
          'questions_generated': 20,
          'automated_checks_complete': 30 + (state.iterationCount * 15),
          'research_iteration_complete': 40 + (state.iterationCount * 15),
          'assessment_complete': 50 + (state.iterationCount * 15),
          'complete': 95
        }
        
        const progress = progressMap[state.currentPhase] || 0
        await job.updateProgress(progress)
        
        console.log(`[RichIterativeResearch] Phase: ${state.currentPhase}, Progress: ${progress}%`)
      }
      
      // Enhanced report structure for rich research
      const reportData = {
        company_name: company,
        investment_score: finalState.overallScore,
        
        // Rich research specific data
        scores_by_category: finalState.scores,
        research_methodology: 'rich-iterative-chain-of-rag',
        research_summary: {
          iterations: finalState.iterationCount,
          questionsTotal: finalState.researchQuestions.length,
          questionsAnswered: finalState.researchQuestions?.filter((q: EnrichedResearchQuestion) => q.status === 'answered').length || 0,
          questionsPartial: finalState.researchQuestions?.filter((q: EnrichedResearchQuestion) => q.status === 'partial').length || 0,
          automatedChecksTotal: finalState.researchQuestions?.reduce((sum: number, q: EnrichedResearchQuestion) => sum + (q.automatedChecks?.length || 0), 0) || 0,
          automatedChecksPassed: finalState.researchQuestions?.reduce((sum: number, q: EnrichedResearchQuestion) => 
            sum + (q.automatedChecks?.filter((c: AutomatedCheck) => c.result?.passed).length || 0), 0
          ) || 0,
          evidenceItemsCollected: finalState.evidenceCollected.length,
          citationsGenerated: finalState.citations.length,
          overallConfidence: finalState.overallConfidence,
          researchTrace: finalState.researchTrace
        },
        
        // Technical analysis results
        technical_analysis: {
          profile: finalState.technicalProfile,
          competitorProfile: finalState.competitorProfile,
          automatedValidations: finalState.researchQuestions?.map((q: EnrichedResearchQuestion) => ({
            question: q.question,
            category: q.category,
            priority: q.priority,
            status: q.status,
            confidence: q.confidence,
            automatedChecks: q.automatedChecks?.map((c: AutomatedCheck) => ({
              tool: c.tool,
              check: c.check,
              passed: c.result?.passed,
              result: c.result
            })) || [],
            findings: q.findings || []
          })) || []
        },
        
        // Knowledge gaps identification
        knowledge_gaps: finalState.researchQuestions
          ?.filter((q: EnrichedResearchQuestion) => q.status === 'failed' || q.confidence < q.confidenceRequirements.minimum)
          ?.map((q: EnrichedResearchQuestion) => ({
            question: q.question,
            category: q.category,
            issue: q.status === 'failed' ? 'research_failed' : 'low_confidence',
            confidence: q.confidence,
            requiredConfidence: q.confidenceRequirements.minimum
          })) || [],
        
        // Legacy compatibility sections (for UI)
        sections: {
          executiveSummary: {
            title: 'Executive Summary',
            content: finalState.executiveSummary,
            score: finalState.overallScore,
            confidence: finalState.overallConfidence
          },
          technologyStack: {
            title: 'Technology & Architecture',
            content: finalState.reportSections?.technical?.content || 'Technical analysis completed via automated profiling.',
            score: (finalState.scores as any)?.technical?.value || 0,
            confidence: (finalState.scores as any)?.technical?.confidence || 0,
            metadata: {
              automatedAnalysis: true,
              securityGrade: (finalState.technicalProfile as TechnicalProfile)?.securityGrade,
              technologiesDetected: (finalState.technicalProfile as TechnicalProfile)?.technologies || [],
              apisDetected: (finalState.technicalProfile as TechnicalProfile)?.detectedAPIs || [],
              integrationsDetected: (finalState.technicalProfile as TechnicalProfile)?.integrations || []
            }
          },
          securityAssessment: {
            title: 'Security Assessment',
            content: `Automated security analysis: Grade ${(finalState.technicalProfile as TechnicalProfile)?.securityGrade || 'Unknown'}. Security headers: ${(finalState.technicalProfile as TechnicalProfile)?.securityHeaders?.join(', ') || 'None detected'}.`,
            score: (finalState.technicalProfile as TechnicalProfile)?.securityGrade === 'A' ? 90 : 
                   (finalState.technicalProfile as TechnicalProfile)?.securityGrade === 'B' ? 75 :
                   (finalState.technicalProfile as TechnicalProfile)?.securityGrade === 'C' ? 60 : 40,
            confidence: (finalState.technicalProfile as TechnicalProfile)?.securityHeaders?.length ? 0.9 : 0.3
          },
          competitiveAnalysis: {
            title: 'Competitive Landscape',
            content: finalState.competitorProfile?.length > 0 ? 
              `Identified competitors: ${finalState.competitorProfile.join(', ')}` :
              'No direct competitors identified through integration analysis.',
            score: (finalState.scores as any)?.market?.value || 0,
            confidence: (finalState.scores as any)?.market?.confidence || 0
          }
        }
      }
      
      // Prepare knowledge gaps array
      const knowledgeGaps = reportData.knowledge_gaps.map((gap: any) => 
        `${gap.category}: ${gap.question} (${gap.issue})`
      )
      
      // Save enhanced report with new schema
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: finalState.overallScore,
          investment_rationale: `Rich iterative research with ${(finalState.overallConfidence * 100).toFixed(0)}% confidence. Completed ${finalState.iterationCount} iterations, ${reportData.research_summary.automatedChecksPassed}/${reportData.research_summary.automatedChecksTotal} automated checks passed.`,
          tech_health_score: (finalState.scores as any)?.technical?.value || 0,
          tech_health_grade: ((finalState.scores as any)?.technical?.value || 0) >= 80 ? 'A' : 
                            ((finalState.scores as any)?.technical?.value || 0) >= 70 ? 'B' :
                            ((finalState.scores as any)?.technical?.value || 0) >= 60 ? 'C' : 'D',
          
          // Enhanced schema fields
          report_version: 'rich-v1',
          research_methodology: 'rich-iterative-chain-of-rag',
          automated_checks_count: reportData.research_summary.automatedChecksTotal,
          automated_checks_passed: reportData.research_summary.automatedChecksPassed,
          iteration_count: finalState.iterationCount,
          overall_confidence: finalState.overallConfidence,
          knowledge_gaps: knowledgeGaps,
          technical_profile: finalState.technicalProfile || {},
          research_trace: finalState.researchTrace,
          
          // Standard fields
          report_data: reportData,
          evidence_count: finalState.evidenceCollected.length,
          citation_count: finalState.citations.length,
          executive_summary: finalState.executiveSummary,
          ai_model_used: 'claude-opus-4-20250514 + automated-tools + rich-research',
          quality_score: finalState.overallConfidence,
          human_reviewed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      // Save citations
      if (finalState.citations.length > 0 && report) {
        const citationRecords = finalState.citations.map((c: any) => ({
          ...(c as any),
          report_id: report.id,
          created_at: new Date().toISOString()
        }))
        
        await supabase.from('report_citations').insert(citationRecords)
      }
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          status: 'completed',
          latest_report_id: report?.id,
          tech_health_score: (finalState.scores as any)?.technical?.value || 0
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      return {
        success: true,
        reportId: report?.id,
        overallScore: finalState.overallScore,
        confidence: finalState.overallConfidence,
        scoresByCategory: finalState.scores,
        iterations: finalState.iterationCount,
        automatedChecks: `${reportData.research_summary.automatedChecksPassed}/${reportData.research_summary.automatedChecksTotal}`,
        citationCount: finalState.citations.length,
        workflow: 'rich-iterative-research'
      }
      
    } catch (error) {
      console.error('[RichIterativeResearch] Error:', error)
      throw error
    }
  },
  { connection }
)

// Start the worker
console.log('🚀 Rich Iterative Research Worker started')
richIterativeResearchWorker.on('completed', (job) => {
  console.log(`✅ Research completed: ${job.returnvalue?.reportId}`)
  console.log(`   Score: ${job.returnvalue?.overallScore}/100 (${(job.returnvalue?.confidence * 100).toFixed(0)}% confidence)`)
  console.log(`   Automated checks: ${job.returnvalue?.automatedChecks}`)
})

richIterativeResearchWorker.on('failed', (_job, err) => {
  console.error(`❌ Research failed: ${err.message}`)
})