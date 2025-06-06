import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'

// Load environment variables
config()

interface ReportGenerationJob {
  scanRequestId: string
  company: string
  domain: string
  investmentThesis: string
  evidenceJobId?: string
}

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simulated AI analysis for now
async function generateReportSection(sectionName: string, company: string, evidence: any[]): Promise<any> {
  // In production, this would call Anthropic API
  const relevantEvidence = evidence.filter(e => {
    if (sectionName === 'technology' && e.type === 'technical') return true
    if (sectionName === 'market' && e.type === 'news') return true
    if (sectionName === 'team' && e.type === 'social') return true
    return false
  })
  
  return {
    title: sectionName.charAt(0).toUpperCase() + sectionName.slice(1) + ' Analysis',
    content: `Based on ${relevantEvidence.length} pieces of evidence, ${company} shows strong indicators in ${sectionName}.`,
    score: 75 + Math.random() * 20,
    evidenceUsed: relevantEvidence.slice(0, 5).map(e => e.id)
  }
}

export const reportGenerationWorker = new Worker<ReportGenerationJob>(
  'report-generation',
  async (job: Job<ReportGenerationJob>) => {
    const { scanRequestId, company, domain, investmentThesis } = job.data
    
    console.log(`Starting report generation for ${company} (${scanRequestId})`)
    
    try {
      // Update scan request status
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'generating_report'
        })
        .eq('id', scanRequestId)
      
      // Load evidence items
      await job.updateProgress(10)
      const { data: evidence, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('company_name', company)
        .order('created_at', { ascending: false })
      
      if (evidenceError) throw evidenceError
      
      console.log(`Loaded ${evidence?.length || 0} evidence items`)
      
      // Generate report sections
      const sections = ['technology', 'market', 'team', 'financial', 'competitive']
      const reportData: any = {
        companyInfo: {
          name: company,
          domain: domain,
          category: investmentThesis,
          evidenceCount: evidence?.length || 0
        },
        executiveSummary: {
          title: 'Executive Summary',
          content: `${company} is a ${investmentThesis} company operating in the analytics space. Based on our comprehensive analysis of ${evidence?.length || 0} data points, we provide the following investment assessment.`
        }
      }
      
      let totalScore = 0
      const citations: any[] = []
      let citationNumber = 1
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        await job.updateProgress(20 + (i * 12))
        
        const sectionData = await generateReportSection(section, company, evidence || [])
        
        // Map to expected report data structure
        if (section === 'technology') {
          reportData.technologyOverview = sectionData
        } else if (section === 'market') {
          reportData.marketAnalysis = sectionData
        } else if (section === 'team') {
          reportData.teamAssessment = sectionData
        } else if (section === 'financial') {
          reportData.financialIndicators = sectionData
        } else if (section === 'competitive') {
          reportData.competitivePosition = sectionData
        }
        
        totalScore += sectionData.score
        
        // Create citations for evidence used
        sectionData.evidenceUsed?.forEach((evidenceId: string) => {
          const evidenceItem = evidence?.find(e => e.id === evidenceId)
          if (evidenceItem) {
            citations.push({
              citation_number: citationNumber++,
              evidence_item_id: evidenceId,
              section: section,
              claim_text: sectionData.content,
              confidence: 0.8
            })
          }
        })
      }
      
      // Calculate investment score
      const investmentScore = Math.round(totalScore / sections.length)
      await job.updateProgress(80)
      
      // Add security assessment (simulated)
      reportData.securityAssessment = {
        title: 'Security Assessment',
        score: 75 + Math.random() * 20,
        content: `Security analysis indicates ${company} has implemented standard security practices.`
      }
      
      reportData.investmentRecommendation = {
        title: 'Investment Recommendation',
        score: investmentScore,
        grade: investmentScore > 80 ? 'A' : investmentScore > 60 ? 'B' : 'C',
        recommendation: investmentScore > 80 ? 'Strong Buy' : investmentScore > 60 ? 'Buy' : 'Hold',
        rationale: `With an investment score of ${investmentScore}/100, ${company} presents ${investmentScore > 80 ? 'an excellent' : investmentScore > 60 ? 'a good' : 'a moderate'} investment opportunity.`
      }
      
      // Create report record
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: investmentScore,
          investment_rationale: reportData.investmentRecommendation.rationale,
          tech_health_score: investmentScore,
          tech_health_grade: investmentScore > 80 ? 'A' : investmentScore > 60 ? 'B' : 'C',
          report_data: reportData,
          evidence_count: evidence?.length || 0,
          citation_count: citations.length,
          executive_summary: reportData.executiveSummary.content,
          report_version: '1.0',
          ai_model_used: 'queue-based-system',
          quality_score: Math.min(investmentScore * 0.009, 0.99),
          human_reviewed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (reportError) throw reportError
      
      await job.updateProgress(90)
      
      // Store citations
      if (citations.length > 0 && report) {
        const citationRecords = citations.map(c => ({
          ...c,
          report_id: report.id,
          created_at: new Date().toISOString()
        }))
        
        await supabase
          .from('report_citations')
          .insert(citationRecords)
      }
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          status: 'completed',
          ai_workflow_status: 'completed',
          latest_report_id: report?.id,
          ai_confidence: investmentScore,
          tech_health_score: investmentScore
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Report generation complete! Score: ${investmentScore}`)
      
      return {
        success: true,
        reportId: report?.id,
        investmentScore,
        citationCount: citations.length
      }
      
    } catch (error) {
      console.error('Report generation failed:', error)
      
      // Update scan request with error
      await supabase
        .from('scan_requests')
        .update({
          status: 'failed',
          ai_workflow_status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  {
    connection,
    concurrency: 1, // Process 1 report at a time
  }
)

// Error handling
reportGenerationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

reportGenerationWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await reportGenerationWorker.close()
  process.exit(0)
})

console.log('Report generation worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')