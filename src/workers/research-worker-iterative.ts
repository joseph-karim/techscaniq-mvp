import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { StateGraph, Annotation } from '@langchain/langgraph'
import { MemorySaver } from '@langchain/langgraph-checkpoint'
import { Anthropic } from '@anthropic-ai/sdk'
import fetch from 'node-fetch'

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

// Types for iterative research
interface ResearchQuestion {
  id: string
  question: string
  category: 'technical' | 'market' | 'business' | 'team'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'researching' | 'answered' | 'partial'
  findings: Finding[]
  confidence: number
}

interface Finding {
  id: string
  questionId: string
  content: string
  source: string
  confidence: number
  timestamp: string
}

interface KnowledgeGap {
  description: string
  category: string
  suggestedQueries: string[]
  importance: 'critical' | 'high' | 'medium' | 'low'
}

// Define the iterative research state
const IterativeResearchState = Annotation.Root({
  // Company info
  company: Annotation<string>(),
  domain: Annotation<string>(),
  investmentThesis: Annotation<string>(),
  scanRequestId: Annotation<string>(),
  
  // Research questions
  researchQuestions: Annotation<ResearchQuestion[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  currentQuestions: Annotation<ResearchQuestion[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Findings and evidence
  allFindings: Annotation<Finding[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  evidenceCollected: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  collectionId: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  
  // Iteration tracking
  iterationCount: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  maxIterations: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 5 }),
  knowledgeGaps: Annotation<KnowledgeGap[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  overallConfidence: Annotation<number>({ reducer: (x, y) => y ?? x, default: () => 0 }),
  
  // Decision tracking
  researchDecision: Annotation<'continue' | 'sufficient' | 'max_reached'>({ reducer: (x, y) => y ?? x, default: () => 'continue' }),
  
  // Report generation
  synthesizedFindings: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  reportSections: Annotation<Record<string, any>>({ reducer: (x, y) => y ?? x, default: () => ({}) }),
  citations: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  
  // Metadata
  currentPhase: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => 'decomposing' }),
  errors: Annotation<string[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  researchTrace: Annotation<any[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
})

// Node: Decompose initial query into research questions
async function decomposeQuery(state: typeof IterativeResearchState.State) {
  console.log('[DecomposeQuery] Breaking down research objectives...')
  
  try {
    const thesisPrompts = {
      'data_infrastructure': `For ${state.company}, decompose investment analysis into specific research questions:

Categories:
1. Technical Excellence
   - Core architecture and technology stack
   - Scalability and performance metrics
   - Innovation and technical differentiation

2. Market Position
   - Competitive landscape and positioning
   - Market size and growth potential
   - Customer segments and use cases

3. Business Health
   - Revenue indicators and business model
   - Customer acquisition and retention
   - Growth trajectory and funding

4. Team & Execution
   - Leadership and technical expertise
   - Company culture and hiring
   - Execution track record

Generate 15-20 specific, answerable research questions.
Prioritize questions as critical/high/medium based on investment importance.
Output as JSON array of ResearchQuestion objects.`,

      'accelerate-organic-growth': `For ${state.company}, decompose growth investment analysis into research questions focusing on:
1. Growth Mechanics (network effects, viral features, organic acquisition)
2. Market Dynamics (TAM, competition, expansion potential)
3. Product-Market Fit (retention, engagement, customer love)
4. Scalability (unit economics, operational leverage)

Generate specific questions that can be answered with evidence.`
    }

    const prompt = thesisPrompts[state.investmentThesis as keyof typeof thesisPrompts] || thesisPrompts['data_infrastructure']
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const questions = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '[]')
    
    // Initialize research questions
    const researchQuestions: ResearchQuestion[] = questions.map((q: any, index: number) => ({
      id: `q_${index}`,
      question: q.question,
      category: q.category,
      priority: q.priority,
      status: 'pending',
      findings: [],
      confidence: 0
    }))
    
    // Select initial critical questions for first iteration
    const criticalQuestions = researchQuestions
      .filter(q => q.priority === 'critical')
      .slice(0, 5)
    
    return {
      researchQuestions,
      currentQuestions: criticalQuestions,
      currentPhase: 'questions_decomposed',
      researchTrace: [{
        phase: 'decomposition',
        timestamp: new Date().toISOString(),
        totalQuestions: researchQuestions.length,
        criticalQuestions: criticalQuestions.length
      }]
    }
  } catch (error) {
    console.error('[DecomposeQuery] Error:', error)
    return {
      errors: [...state.errors, `Query decomposition failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      currentPhase: 'error'
    }
  }
}

// Node: Research current questions
async function researchQuestions(state: typeof IterativeResearchState.State) {
  console.log(`[ResearchQuestions] Iteration ${state.iterationCount + 1} - Researching ${state.currentQuestions.length} questions...`)
  
  try {
    const newFindings: Finding[] = []
    const evidenceItems: any[] = []
    
    // Create or get collection
    let collectionId = state.collectionId
    if (!collectionId) {
      const { data: collection } = await supabase
        .from('evidence_collections')
        .insert({
          scan_request_id: state.scanRequestId,
          evidence_type: 'iterative_research',
          source: 'chain_of_rag',
          total_items: 0,
          metadata: {
            scan_request_id: state.scanRequestId,
            company: state.company,
            iteration: state.iterationCount + 1
          }
        })
        .select()
        .single()
      
      collectionId = collection?.id || ''
    }
    
    // Research each current question
    for (const question of state.currentQuestions) {
      console.log(`  Researching: ${question.question}`)
      
      // Generate search queries for this question
      const searchQueries = await generateSearchQueries(question, state.company, state.domain)
      
      // Collect evidence for each query
      for (const query of searchQueries.slice(0, 3)) {
        try {
          const evidence = await searchForEvidence(query, state.domain)
          
          if (evidence) {
            // Extract answer for specific question
            const extraction = await extractAnswer(question.question, evidence.content)
            
            if (extraction.relevance > 0.6) {
              const finding: Finding = {
                id: crypto.randomUUID(),
                questionId: question.id,
                content: extraction.answer,
                source: evidence.url,
                confidence: extraction.confidence,
                timestamp: new Date().toISOString()
              }
              
              newFindings.push(finding)
              question.findings.push(finding)
              
              // Create evidence item for database
              evidenceItems.push({
                id: finding.id,
                collection_id: collectionId,
                source_url: evidence.url,
                type: 'research_finding',
                title: `Finding for: ${question.question.substring(0, 100)}`,
                content_data: {
                  question_id: question.id,
                  question: question.question,
                  answer: extraction.answer,
                  raw_content: evidence.content.substring(0, 2000)
                },
                confidence_score: extraction.confidence,
                metadata: {
                  iteration: state.iterationCount + 1,
                  category: question.category
                },
                created_at: new Date().toISOString()
              })
            }
          }
        } catch (error) {
          console.error(`    Search failed for: ${query}`)
        }
      }
      
      // Update question status based on findings
      if (question.findings.length > 0) {
        question.confidence = Math.max(...question.findings.map(f => f.confidence))
        question.status = question.confidence > 0.7 ? 'answered' : 'partial'
      }
    }
    
    // Save evidence to database
    if (evidenceItems.length > 0) {
      await supabase.from('evidence_items').insert(evidenceItems)
      await supabase
        .from('evidence_collections')
        .update({ total_items: state.evidenceCollected.length + evidenceItems.length })
        .eq('id', collectionId)
    }
    
    return {
      allFindings: [...state.allFindings, ...newFindings],
      evidenceCollected: [...state.evidenceCollected, ...evidenceItems],
      collectionId,
      iterationCount: state.iterationCount + 1,
      currentPhase: 'research_complete',
      researchTrace: [...state.researchTrace, {
        phase: 'research',
        iteration: state.iterationCount + 1,
        questionsResearched: state.currentQuestions.length,
        findingsAdded: newFindings.length,
        timestamp: new Date().toISOString()
      }]
    }
  } catch (error) {
    console.error('[ResearchQuestions] Error:', error)
    return {
      errors: [...state.errors, `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Node: Reflect on research and identify gaps
async function reflectOnResearch(state: typeof IterativeResearchState.State) {
  console.log('[ReflectOnResearch] Analyzing findings and identifying gaps...')
  
  try {
    // Calculate overall confidence
    const answeredQuestions = state.researchQuestions.filter(q => q.status === 'answered')
    const partialQuestions = state.researchQuestions.filter(q => q.status === 'partial')
    const unansweredQuestions = state.researchQuestions.filter(q => q.status === 'pending')
    
    // Weight by priority
    const criticalAnswered = answeredQuestions.filter(q => q.priority === 'critical').length
    const criticalTotal = state.researchQuestions.filter(q => q.priority === 'critical').length
    const criticalCoverage = criticalTotal > 0 ? criticalAnswered / criticalTotal : 0
    
    const overallConfidence = (
      criticalCoverage * 0.5 +
      (answeredQuestions.length / state.researchQuestions.length) * 0.3 +
      (partialQuestions.length / state.researchQuestions.length) * 0.2
    )
    
    // Use LLM to identify knowledge gaps
    const reflectionPrompt = `Analyze the research progress for ${state.company}:

Questions Answered (${answeredQuestions.length}):
${answeredQuestions.map(q => `- ${q.question}: ${q.findings[0]?.content || 'No findings'}`).join('\n')}

Partial Answers (${partialQuestions.length}):
${partialQuestions.map(q => `- ${q.question}: ${q.findings[0]?.content || 'Limited findings'}`).join('\n')}

Unanswered Questions (${unansweredQuestions.length}):
${unansweredQuestions.map(q => `- ${q.question}`).join('\n')}

Overall Confidence: ${(overallConfidence * 100).toFixed(0)}%

Identify:
1. Critical knowledge gaps that would impact investment decision
2. Follow-up questions that would strengthen our understanding
3. Whether we have sufficient information to make a recommendation

Output as JSON with:
- gaps: array of KnowledgeGap objects
- decision: 'continue' or 'sufficient'
- reasoning: explanation of decision`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: reflectionPrompt }]
    })
    
    const reflection = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
    
    // Determine next action
    let researchDecision: 'continue' | 'sufficient' | 'max_reached' = reflection.decision
    if (state.iterationCount >= state.maxIterations) {
      researchDecision = 'max_reached'
    }
    
    // Select next questions if continuing
    let nextQuestions: ResearchQuestion[] = []
    if (researchDecision === 'continue') {
      // Prioritize unanswered critical questions
      const criticalUnanswered = unansweredQuestions.filter(q => q.priority === 'critical')
      const highPartial = partialQuestions.filter(q => q.priority === 'high')
      
      nextQuestions = [
        ...criticalUnanswered.slice(0, 3),
        ...highPartial.slice(0, 2)
      ]
      
      // If not enough, add questions based on gaps
      if (nextQuestions.length < 3 && reflection.gaps) {
        // Create new questions from identified gaps
        const gapQuestions = reflection.gaps
          .filter((g: KnowledgeGap) => g.importance === 'critical' || g.importance === 'high')
          .slice(0, 3 - nextQuestions.length)
          .map((gap: KnowledgeGap, index: number) => ({
            id: `gap_${state.iterationCount}_${index}`,
            question: gap.suggestedQueries[0] || gap.description,
            category: gap.category as any,
            priority: gap.importance as any,
            status: 'pending' as const,
            findings: [],
            confidence: 0
          }))
        
        state.researchQuestions.push(...gapQuestions)
        nextQuestions.push(...gapQuestions)
      }
    }
    
    return {
      knowledgeGaps: reflection.gaps || [],
      overallConfidence,
      researchDecision,
      currentQuestions: nextQuestions,
      currentPhase: 'reflection_complete',
      researchTrace: [...state.researchTrace, {
        phase: 'reflection',
        iteration: state.iterationCount,
        confidence: overallConfidence,
        decision: researchDecision,
        gapsIdentified: reflection.gaps?.length || 0,
        timestamp: new Date().toISOString()
      }]
    }
  } catch (error) {
    console.error('[ReflectOnResearch] Error:', error)
    return {
      errors: [...state.errors, `Reflection failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      researchDecision: 'sufficient' as const // Fail gracefully
    }
  }
}

// Node: Synthesize findings into coherent sections
async function synthesizeFindings(state: typeof IterativeResearchState.State) {
  console.log('[SynthesizeFindings] Creating comprehensive analysis...')
  
  try {
    const categories = ['technical', 'market', 'business', 'team']
    const synthesizedFindings: Record<string, any> = {}
    
    for (const category of categories) {
      const categoryQuestions = state.researchQuestions.filter(q => q.category === category)
      const categoryFindings = categoryQuestions.flatMap(q => q.findings)
      
      if (categoryFindings.length > 0) {
        const synthesisPrompt = `Synthesize these research findings about ${state.company}'s ${category} aspects:

${categoryQuestions.map(q => `
Question: ${q.question}
Status: ${q.status} (Confidence: ${(q.confidence * 100).toFixed(0)}%)
Findings: ${q.findings.map(f => f.content).join(' | ')}
`).join('\n')}

Create a coherent narrative that:
1. Integrates all findings into a unified analysis
2. Highlights strong evidence vs. areas of uncertainty
3. Draws investment-relevant conclusions
4. Acknowledges any gaps in our knowledge`

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{ role: 'user', content: synthesisPrompt }]
        })
        
        synthesizedFindings[category] = {
          content: response.content[0].type === 'text' ? response.content[0].text : '',
          questionsCovered: categoryQuestions.length,
          answeredFully: categoryQuestions.filter(q => q.status === 'answered').length,
          confidence: categoryFindings.reduce((sum, f) => sum + f.confidence, 0) / categoryFindings.length
        }
      }
    }
    
    return {
      synthesizedFindings,
      currentPhase: 'synthesis_complete'
    }
  } catch (error) {
    console.error('[SynthesizeFindings] Error:', error)
    return {
      errors: [...state.errors, `Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Node: Generate final report with citations
async function generateFinalReport(state: typeof IterativeResearchState.State) {
  console.log('[GenerateFinalReport] Creating investment report...')
  
  try {
    const sections: Record<string, any> = {}
    const citations: any[] = []
    let citationNumber = 1
    
    // Generate sections with inline citations
    for (const [category, synthesis] of Object.entries(state.synthesizedFindings)) {
      const sectionQuestions = state.researchQuestions.filter(q => q.category === category)
      
      // Create section with citations
      const sectionPrompt = `Convert this synthesis into a report section with inline citations:

${synthesis.content}

Supporting Evidence:
${sectionQuestions.map(q => q.findings.map(f => 
  `[${q.id}] ${f.content} (Source: ${f.source}, Confidence: ${f.confidence})`
).join('\n')).join('\n')}

Requirements:
1. Use inline citations like "Snowplow processes 5 billion events daily [1]"
2. Every factual claim must have a citation
3. Note confidence levels for uncertain claims
4. Be clear about what we couldn't verify`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: sectionPrompt }]
      })
      
      let sectionContent = response.content[0].type === 'text' ? response.content[0].text : ''
      
      // Extract and create citations
      const citationMatches = [...sectionContent.matchAll(/([^.!?]+?)\s*\[(\w+)\]/g)]
      
      for (const match of citationMatches) {
        const claimText = match[1].trim()
        const tempRef = match[2]
        
        // Find the corresponding finding
        const question = sectionQuestions.find(q => q.id === tempRef)
        if (question && question.findings.length > 0) {
          const finding = question.findings[0] // Use best finding
          
          citations.push({
            claim_id: `cite_${citationNumber}`,
            claim: claimText,
            citation_text: finding.content,
            citation_number: citationNumber,
            evidence_item_id: finding.id,
            confidence: Math.round(finding.confidence * 100),
            reasoning: `Based on research for: ${question.question}`,
            analyst: 'iterative-research',
            review_date: new Date().toISOString(),
            methodology: 'Chain of RAG iterative research',
            evidence_summary: {
              source: finding.source,
              confidence: finding.confidence,
              iteration: state.researchTrace.find(t => t.phase === 'research')?.iteration || 1
            }
          })
          
          // Replace temp reference with citation number
          sectionContent = sectionContent.replace(`[${tempRef}]`, `[${citationNumber}](#cite-${citationNumber})`)
          citationNumber++
        }
      }
      
      sections[category] = {
        title: getCategoryTitle(category),
        content: sectionContent,
        confidence: synthesis.confidence,
        coverage: `${synthesis.answeredFully}/${synthesis.questionsCovered} questions fully answered`
      }
    }
    
    // Generate executive summary
    const summaryPrompt = `Create an executive summary for ${state.company} investment analysis:

Research Summary:
- Total iterations: ${state.iterationCount}
- Questions researched: ${state.researchQuestions.length}
- Questions fully answered: ${state.researchQuestions.filter(q => q.status === 'answered').length}
- Overall confidence: ${(state.overallConfidence * 100).toFixed(0)}%

Key Findings:
${Object.entries(state.synthesizedFindings).map(([cat, syn]) => 
  `${cat}: ${syn.content.substring(0, 200)}...`
).join('\n\n')}

Investment Thesis: ${state.investmentThesis}

Write a 400-word executive summary that:
1. Leads with investment recommendation and confidence level
2. Summarizes key findings from iterative research
3. Clearly states what remains uncertain
4. Provides risk-adjusted perspective`

    const summaryResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{ role: 'user', content: summaryPrompt }]
    })
    
    const executiveSummary = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : ''
    
    // Calculate investment score based on answered questions and confidence
    const criticalQuestions = state.researchQuestions.filter(q => q.priority === 'critical')
    const criticalAnswered = criticalQuestions.filter(q => q.status === 'answered').length
    const criticalConfidence = criticalQuestions.reduce((sum, q) => sum + q.confidence, 0) / criticalQuestions.length
    
    const investmentScore = Math.round(
      (criticalAnswered / criticalQuestions.length) * 0.6 * 100 +
      criticalConfidence * 0.4 * 100
    )
    
    return {
      reportSections: sections,
      citations,
      executiveSummary,
      investmentScore,
      currentPhase: 'complete'
    }
  } catch (error) {
    console.error('[GenerateFinalReport] Error:', error)
    return {
      errors: [...state.errors, `Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// Helper functions
async function generateSearchQueries(question: ResearchQuestion, company: string, domain: string): Promise<string[]> {
  // Generate targeted search queries for the question
  const baseQueries = [
    `site:${domain} ${question.question}`,
    `"${company}" ${question.question}`,
    `${company} ${question.category} ${question.question.split(' ').slice(0, 5).join(' ')}`
  ]
  
  // Add specific queries based on category
  if (question.category === 'technical') {
    baseQueries.push(`${company} architecture technology stack`)
  } else if (question.category === 'market') {
    baseQueries.push(`${company} competitors market share`)
  }
  
  return baseQueries
}

async function searchForEvidence(query: string, domain: string): Promise<{ url: string; content: string } | null> {
  try {
    // Simple implementation - in production would use proper search
    const searchUrl = query.startsWith('site:') ?
      `https://${domain}/${query.split(' ').slice(1).join('-').toLowerCase()}` :
      `https://www.google.com/search?q=${encodeURIComponent(query)}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TechScanIQ Research Bot' },
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const content = await response.text()
      return { url: searchUrl, content }
    }
  } catch (error) {
    console.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return null
}

async function extractAnswer(question: string, content: string): Promise<{ answer: string; confidence: number; relevance: number }> {
  // Use LLM to extract specific answer
  const prompt = `Extract the answer to this question from the content:
Question: ${question}

Content: ${content.substring(0, 3000)}

Return JSON with:
- answer: specific answer to the question
- confidence: 0-1 confidence in the answer
- relevance: 0-1 how relevant the content is to the question`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
    
    return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
  } catch {
    return { answer: '', confidence: 0, relevance: 0 }
  }
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

// Build the iterative research graph
function buildIterativeResearchGraph() {
  const workflow = new StateGraph(IterativeResearchState)
    .addNode('decompose_query', decomposeQuery)
    .addNode('research_questions', researchQuestions)
    .addNode('reflect_on_research', reflectOnResearch)
    .addNode('synthesize_findings', synthesizeFindings)
    .addNode('generate_final_report', generateFinalReport)
  
  // Define the flow with conditional edges
  workflow
    .addEdge('__start__', 'decompose_query')
    .addEdge('decompose_query', 'research_questions')
    .addEdge('research_questions', 'reflect_on_research')
    .addConditionalEdges(
      'reflect_on_research',
      (state) => state.researchDecision,
      {
        'continue': 'research_questions',
        'sufficient': 'synthesize_findings',
        'max_reached': 'synthesize_findings'
      }
    )
    .addEdge('synthesize_findings', 'generate_final_report')
    .addEdge('generate_final_report', '__end__')
  
  const checkpointer = new MemorySaver()
  return workflow.compile({ checkpointer })
}

// Main worker
export const iterativeResearchWorker = new Worker(
  'iterative-research',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`[IterativeResearch] Starting Chain of RAG research for ${company}`)
    
    try {
      const app = buildIterativeResearchGraph()
      
      const initialState = {
        company,
        domain,
        investmentThesis,
        scanRequestId,
        researchQuestions: [],
        currentQuestions: [],
        allFindings: [],
        evidenceCollected: [],
        collectionId: '',
        iterationCount: 0,
        maxIterations: 5,
        knowledgeGaps: [],
        overallConfidence: 0,
        researchDecision: 'continue' as const,
        synthesizedFindings: {},
        reportSections: {},
        citations: [],
        executiveSummary: '',
        investmentScore: 0,
        currentPhase: 'decomposing',
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
        
        // Calculate progress based on iterations and phase
        const iterationProgress = (state.iterationCount / state.maxIterations) * 60
        const phaseProgress = {
          'questions_decomposed': 10,
          'research_complete': iterationProgress + 20,
          'reflection_complete': iterationProgress + 25,
          'synthesis_complete': 85,
          'complete': 95
        }
        
        const progress = phaseProgress[state.currentPhase as keyof typeof phaseProgress] || iterationProgress
        await job.updateProgress(progress)
        
        console.log(`[IterativeResearch] Phase: ${state.currentPhase}, Iteration: ${state.iterationCount}, Progress: ${progress}%`)
      }
      
      // Save report to database
      const reportData = {
        company_name: company,
        sections: finalState.reportSections,
        executiveSummary: {
          title: 'Executive Summary',
          content: finalState.executiveSummary
        },
        investment_score: finalState.investmentScore,
        research_summary: {
          iterations: finalState.iterationCount,
          totalQuestions: finalState.researchQuestions.length,
          answeredFully: finalState.researchQuestions.filter((q: ResearchQuestion) => q.status === 'answered').length,
          partialAnswers: finalState.researchQuestions.filter((q: ResearchQuestion) => q.status === 'partial').length,
          overallConfidence: finalState.overallConfidence,
          researchTrace: finalState.researchTrace
        },
        metadata: {
          workflow: 'iterative-research',
          methodology: 'Chain of RAG',
          iterations: finalState.iterationCount,
          evidenceCount: finalState.evidenceCollected.length,
          citationCount: finalState.citations.length
        }
      }
      
      // Save report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: finalState.investmentScore,
          investment_rationale: `Based on ${finalState.iterationCount} research iterations with ${(finalState.overallConfidence * 100).toFixed(0)}% confidence`,
          tech_health_score: Math.round((finalState.synthesizedFindings as any).technical?.confidence * 100 || 70),
          tech_health_grade: 'B',
          report_data: reportData,
          evidence_count: finalState.evidenceCollected.length,
          citation_count: finalState.citations.length,
          executive_summary: finalState.executiveSummary,
          report_version: 'iterative-research-v1',
          ai_model_used: 'claude-3.5-sonnet + chain-of-rag',
          quality_score: finalState.overallConfidence,
          human_reviewed: false,
          metadata: reportData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      // Save citations
      if (finalState.citations.length > 0 && report) {
        const citationRecords = finalState.citations.map((c: any) => ({
          ...c,
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
          latest_report_id: report?.id
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore: finalState.investmentScore,
        confidence: finalState.overallConfidence,
        iterations: finalState.iterationCount,
        questionsAnswered: `${finalState.researchQuestions.filter((q: ResearchQuestion) => q.status === 'answered').length}/${finalState.researchQuestions.length}`,
        citationCount: finalState.citations.length,
        workflow: 'iterative-research'
      }
      
    } catch (error) {
      console.error('[IterativeResearch] Error:', error)
      throw error
    }
  },
  { connection }
)

// Start the worker
console.log('🚀 Iterative Research Worker (Chain of RAG) started')
iterativeResearchWorker.on('completed', (job) => {
  console.log(`✅ Research completed: ${job.returnvalue?.reportId} after ${job.returnvalue?.iterations} iterations`)
})

iterativeResearchWorker.on('failed', (_job, err) => {
  console.error(`❌ Research failed: ${err.message}`)
})