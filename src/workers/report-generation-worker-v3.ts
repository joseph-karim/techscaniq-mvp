import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { ComprehensiveScoringService, EvidenceItem } from '../lib/scoring/comprehensive-scoring'

// Load environment variables
config()

interface ReportGenerationJob {
  scanRequestId: string
  company: string
  domain: string
  investmentThesis: string
  evidenceJobId?: string
  investorProfile?: any
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

const scoringService = new ComprehensiveScoringService()

// Generate report with comprehensive scoring
async function generateEnhancedReport(
  company: string,
  domain: string,
  investmentThesis: string,
  evidence: any[],
  investorProfile: any
) {
  // Convert evidence to the format expected by scoring service
  const evidenceItems: EvidenceItem[] = evidence.map(item => ({
    id: item.id,
    type: item.evidence_type || item.type || 'general',
    category: item.category || 'general',
    content: item.content_data?.summary || item.content_data?.processed || item.summary || '',
    source: item.source_url || item.source || '',
    confidence: item.confidence_score || 0.7,
    timestamp: item.created_at || new Date().toISOString(),
    metadata: item.metadata || {}
  }))

  // Calculate comprehensive score
  const comprehensiveScore = scoringService.calculateComprehensiveScore(
    evidenceItems,
    investorProfile?.investmentThesisData || { type: investmentThesis }
  )

  // Use confidence-adjusted score for investment scoring
  const investmentScore = Math.round(comprehensiveScore.confidenceAdjustedScore)
  const grade = comprehensiveScore.finalGrade
  const recommendation = comprehensiveScore.investmentRecommendation

  const reportData = {
    // Company Information
    companyInfo: {
      name: company,
      website: `https://${domain}`,
      description: `${company} is a company focused on ${investmentThesis}`,
      headquarters: extractLocation(evidence) || 'Location not determined',
      founded: extractFoundedYear(evidence) || 'Year not determined',
      employeeCount: extractEmployeeCount(evidence) || 'Size not determined',
      fundingTotal: extractFundingTotal(evidence) || 'Funding not disclosed',
      lastValuation: extractValuation(evidence) || 'Valuation not disclosed',
      revenue: extractRevenue(evidence) || 'Revenue not disclosed',
      vision: extractVision(evidence) || 'Vision not stated',
      mission: extractMission(evidence) || 'Mission not stated'
    },
    
    // Executive Summary with confidence indicators
    executiveSummary: {
      title: 'Executive Summary',
      content: `${company} has been evaluated using our comprehensive scoring system analyzing ${evidence.length} pieces of evidence. The company receives a confidence-adjusted investment score of ${investmentScore}/100 (Grade: ${grade}) with an overall confidence level of ${comprehensiveScore.confidenceBreakdown.overallConfidence}%. ${getConfidenceSummary(comprehensiveScore)}`,
      highlights: generateHighlights(evidence, comprehensiveScore),
      confidenceIndicators: {
        evidenceQuality: Math.round(comprehensiveScore.confidenceBreakdown.evidenceQuality * 100),
        evidenceCoverage: Math.round(comprehensiveScore.confidenceBreakdown.evidenceCoverage * 100),
        missingCriticalData: comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.length
      }
    },
    
    // Technology Overview with confidence
    technologyOverview: {
      summary: generateTechSummary(evidence, comprehensiveScore.technicalScore, comprehensiveScore.technicalConfidence),
      score: comprehensiveScore.technicalScore,
      confidence: Math.round(comprehensiveScore.technicalConfidence * 100),
      primaryStack: extractTechStack(evidence),
      architectureHighlights: extractArchitectureHighlights(evidence),
      scalabilityFeatures: extractScalabilityFeatures(evidence),
      innovativeAspects: extractInnovativeAspects(evidence)
    },
    
    // Market Analysis with confidence
    marketAnalysis: {
      summary: generateMarketSummary(evidence, comprehensiveScore.marketScore, comprehensiveScore.marketConfidence),
      score: comprehensiveScore.marketScore,
      confidence: Math.round(comprehensiveScore.marketConfidence * 100),
      marketSize: extractMarketSize(evidence) || 'Market size not determined',
      targetMarket: extractTargetMarket(evidence) || 'Target market not specified',
      competitors: extractCompetitors(evidence),
      competitivePosition: extractCompetitivePosition(evidence) || 'Position not determined',
      growthRate: extractGrowthRate(evidence) || 'Growth rate not available',
      marketTrends: extractMarketTrends(evidence),
      opportunities: extractOpportunities(evidence),
      threats: extractThreats(evidence),
      differentiators: extractDifferentiators(evidence)
    },
    
    // Team Analysis with confidence
    teamAnalysis: {
      summary: generateTeamSummary(evidence, comprehensiveScore.teamScore, comprehensiveScore.teamConfidence),
      score: comprehensiveScore.teamScore,
      confidence: Math.round(comprehensiveScore.teamConfidence * 100),
      leadershipScore: comprehensiveScore.teamScore,
      keyMembers: extractTeamMembers(evidence),
      teamStrengths: extractTeamStrengths(evidence),
      teamGaps: extractTeamGaps(evidence),
      culture: extractCulture(evidence) || 'Culture information not available'
    },
    
    // Financial Health with confidence
    financialHealth: {
      summary: generateFinancialSummary(evidence, comprehensiveScore.financialScore, comprehensiveScore.financialConfidence),
      score: comprehensiveScore.financialScore,
      confidence: Math.round(comprehensiveScore.financialConfidence * 100),
      revenue: extractRevenue(evidence) || 'Revenue not disclosed',
      growthRate: extractFinancialGrowthRate(evidence) || 'Growth rate not available',
      burnRate: extractBurnRate(evidence) || 'Burn rate not disclosed',
      runway: extractRunway(evidence) || 'Runway not determined',
      keyMetrics: extractKeyMetrics(evidence),
      fundingHistory: extractFundingHistory(evidence),
      financialStrengths: extractFinancialStrengths(evidence),
      financialRisks: extractFinancialRisks(evidence)
    },
    
    // Security Assessment
    securityAssessment: {
      summary: generateSecuritySummary(evidence),
      overallScore: extractSecurityScore(evidence),
      compliance: extractCompliance(evidence),
      strengths: extractSecurityStrengths(evidence),
      vulnerabilities: extractVulnerabilities(evidence),
      recommendations: generateSecurityRecommendations(evidence)
    },
    
    // Investment Recommendation with comprehensive scoring
    investmentRecommendation: {
      score: investmentScore,
      grade: grade,
      recommendation: recommendation.toLowerCase().replace(' ', '-'),
      rationale: generateInvestmentRationale(company, comprehensiveScore, evidence),
      keyStrengths: generateKeyStrengths(evidence, comprehensiveScore),
      keyRisks: generateKeyRisks(evidence, comprehensiveScore),
      dueDiligenceGaps: comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.map(
        gap => gap.replace(/_/g, ' ').charAt(0).toUpperCase() + gap.slice(1)
      ),
      nextSteps: generateNextSteps(comprehensiveScore),
      confidenceAnalysis: {
        overallConfidence: comprehensiveScore.confidenceBreakdown.overallConfidence,
        confidenceLevel: getConfidenceLevel(comprehensiveScore.confidenceBreakdown.overallConfidence),
        impactOfMissingData: `Missing ${comprehensiveScore.confidenceBreakdown.missingCriticalEvidence.length} critical evidence items reduced confidence by ${Math.round(comprehensiveScore.confidenceBreakdown.penaltyApplied * 100)}%`,
        reliabilityStatement: getReliabilityStatement(comprehensiveScore)
      }
    },
    
    // Comprehensive scoring details
    comprehensiveScore: comprehensiveScore,
    
    // Legacy fields for compatibility
    sections: {
      technologyStack: { score: comprehensiveScore.technicalScore },
      marketPosition: { score: comprehensiveScore.marketScore },
      teamCulture: { score: comprehensiveScore.teamScore },
      financialHealth: { score: comprehensiveScore.financialScore },
      security: { score: extractSecurityScore(evidence) },
      businessModel: { score: comprehensiveScore.businessScore }
    },
    
    company_name: company,
    investment_score: investmentScore
  }
  
  return { reportData, investmentScore, grade }
}

// Helper functions for evidence extraction
function extractLocation(evidence: any[]): string | null {
  const locationEvidence = evidence.find(e => 
    e.type === 'headquarters' || 
    e.content_data?.processed?.toLowerCase().includes('headquartered') ||
    e.content_data?.processed?.toLowerCase().includes('based in')
  )
  return locationEvidence?.content_data?.extracted || null
}

function extractFoundedYear(evidence: any[]): string | null {
  const foundedEvidence = evidence.find(e => 
    e.type === 'founded' || 
    e.content_data?.processed?.toLowerCase().includes('founded in')
  )
  return foundedEvidence?.content_data?.extracted || null
}

function extractEmployeeCount(evidence: any[]): string | null {
  const employeeEvidence = evidence.find(e => 
    e.type === 'employee_count' || 
    e.type === 'team_size' ||
    e.content_data?.processed?.toLowerCase().includes('employees')
  )
  return employeeEvidence?.content_data?.extracted || null
}

function extractFundingTotal(evidence: any[]): string | null {
  const fundingEvidence = evidence.filter(e => 
    e.type === 'funding' || 
    e.type === 'funding_history' ||
    e.content_data?.processed?.toLowerCase().includes('raised')
  )
  // Sum up funding amounts if available
  return fundingEvidence.length > 0 ? 'Based on available data' : null
}

function extractValuation(evidence: any[]): string | null {
  const valuationEvidence = evidence.find(e => 
    e.type === 'valuation' || 
    e.content_data?.processed?.toLowerCase().includes('valued at')
  )
  return valuationEvidence?.content_data?.extracted || null
}

function extractRevenue(evidence: any[]): string | null {
  const revenueEvidence = evidence.find(e => 
    e.type === 'revenue' || 
    e.type === 'revenue_model' ||
    e.content_data?.processed?.toLowerCase().includes('revenue')
  )
  return revenueEvidence?.content_data?.extracted || null
}

function extractVision(evidence: any[]): string | null {
  const visionEvidence = evidence.find(e => 
    e.type === 'vision' || 
    e.content_data?.processed?.toLowerCase().includes('vision')
  )
  return visionEvidence?.content_data?.summary || null
}

function extractMission(evidence: any[]): string | null {
  const missionEvidence = evidence.find(e => 
    e.type === 'mission' || 
    e.content_data?.processed?.toLowerCase().includes('mission')
  )
  return missionEvidence?.content_data?.summary || null
}

function generateHighlights(_evidence: any[], score: any): string[] {
  const highlights: string[] = []
  
  if (score.technicalScore > 70 && score.technicalConfidence > 0.7) {
    highlights.push('Strong technical foundation with modern architecture')
  }
  if (score.marketScore > 70 && score.marketConfidence > 0.7) {
    highlights.push('Favorable market position with growth potential')
  }
  if (score.teamScore > 70 && score.teamConfidence > 0.7) {
    highlights.push('Experienced leadership team')
  }
  if (score.financialScore > 70 && score.financialConfidence > 0.7) {
    highlights.push('Solid financial fundamentals')
  }
  
  if (score.confidenceBreakdown.overallConfidence < 60) {
    highlights.push('⚠️ Limited evidence affects assessment reliability')
  }
  
  return highlights.length > 0 ? highlights : ['Comprehensive assessment completed']
}

function getConfidenceSummary(score: any): string {
  const confidence = score.confidenceBreakdown.overallConfidence
  if (confidence >= 80) {
    return 'Our analysis has high confidence based on abundant, high-quality evidence.'
  } else if (confidence >= 60) {
    return 'Our analysis has moderate confidence with some evidence gaps that should be addressed.'
  } else {
    return 'Our analysis has limited confidence due to significant evidence gaps - further diligence strongly recommended.'
  }
}

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 90) return 'Very High'
  if (confidence >= 75) return 'High'
  if (confidence >= 60) return 'Moderate'
  if (confidence >= 40) return 'Low'
  return 'Very Low'
}

function getReliabilityStatement(score: any): string {
  const confidence = score.confidenceBreakdown.overallConfidence
  const missing = score.confidenceBreakdown.missingCriticalEvidence.length
  
  if (confidence >= 80 && missing === 0) {
    return 'This assessment is highly reliable with comprehensive evidence coverage.'
  } else if (confidence >= 60 && missing <= 3) {
    return 'This assessment is reasonably reliable but would benefit from additional evidence in key areas.'
  } else {
    return `This assessment has limited reliability due to ${missing} missing critical evidence items. Additional diligence is essential.`
  }
}

function generateTechSummary(evidence: any[], score: number, confidence: number): string {
  const confPercent = Math.round(confidence * 100)
  return `Technical assessment score: ${score}/100 (${confPercent}% confidence). ${
    score > 70 ? 'Strong technical foundation identified' : 
    score > 50 ? 'Adequate technical capabilities' : 
    'Technical concerns identified'
  }. Analysis based on ${evidence.filter(e => e.category === 'technical').length} technical evidence items.`
}

function generateMarketSummary(evidence: any[], score: number, confidence: number): string {
  const confPercent = Math.round(confidence * 100)
  return `Market position score: ${score}/100 (${confPercent}% confidence). ${
    score > 70 ? 'Strong market opportunity identified' : 
    score > 50 ? 'Reasonable market position' : 
    'Market challenges identified'
  }. Analysis based on ${evidence.filter(e => e.category === 'market').length} market evidence items.`
}

function generateTeamSummary(evidence: any[], score: number, confidence: number): string {
  const confPercent = Math.round(confidence * 100)
  return `Team assessment score: ${score}/100 (${confPercent}% confidence). ${
    score > 70 ? 'Strong leadership and team identified' : 
    score > 50 ? 'Competent team in place' : 
    'Team development needed'
  }. Analysis based on ${evidence.filter(e => e.category === 'team').length} team-related evidence items.`
}

function generateFinancialSummary(evidence: any[], score: number, confidence: number): string {
  const confPercent = Math.round(confidence * 100)
  return `Financial health score: ${score}/100 (${confPercent}% confidence). ${
    score > 70 ? 'Strong financial position' : 
    score > 50 ? 'Adequate financial health' : 
    'Financial concerns present'
  }. Analysis based on ${evidence.filter(e => e.category === 'financial').length} financial evidence items.`
}

function generateInvestmentRationale(company: string, score: any, evidence: any[]): string {
  const confidence = score.confidenceBreakdown.overallConfidence
  const adjustedScore = Math.round(score.confidenceAdjustedScore)
  
  return `${company} receives a confidence-adjusted investment score of ${adjustedScore}/100 (Grade: ${score.finalGrade}) based on analysis of ${evidence.length} evidence items. ` +
    `The raw weighted score of ${score.weightedScore}/100 was adjusted for evidence quality (${Math.round(score.confidenceBreakdown.evidenceQuality * 100)}%) and coverage (${Math.round(score.confidenceBreakdown.evidenceCoverage * 100)}%). ` +
    `With ${confidence}% overall confidence, we recommend: ${score.investmentRecommendation}. ` +
    (score.confidenceBreakdown.missingCriticalEvidence.length > 0 ? 
      `Note: ${score.confidenceBreakdown.missingCriticalEvidence.length} critical evidence gaps reduced confidence by ${Math.round(score.confidenceBreakdown.penaltyApplied * 100)}%.` : 
      'All critical evidence areas were covered.')
}

function generateKeyStrengths(_evidence: any[], score: any): string[] {
  const strengths: string[] = []
  
  if (score.technicalScore > 70 && score.technicalConfidence > 0.6) {
    strengths.push(`Strong technical foundation (Score: ${score.technicalScore}/100, Confidence: ${Math.round(score.technicalConfidence * 100)}%)`)
  }
  if (score.marketScore > 70 && score.marketConfidence > 0.6) {
    strengths.push(`Favorable market position (Score: ${score.marketScore}/100, Confidence: ${Math.round(score.marketConfidence * 100)}%)`)
  }
  if (score.teamScore > 70 && score.teamConfidence > 0.6) {
    strengths.push(`Strong leadership team (Score: ${score.teamScore}/100, Confidence: ${Math.round(score.teamConfidence * 100)}%)`)
  }
  if (score.businessScore > 70 && score.businessConfidence > 0.6) {
    strengths.push(`Solid business model (Score: ${score.businessScore}/100, Confidence: ${Math.round(score.businessConfidence * 100)}%)`)
  }
  if (score.financialScore > 70 && score.financialConfidence > 0.6) {
    strengths.push(`Healthy financials (Score: ${score.financialScore}/100, Confidence: ${Math.round(score.financialConfidence * 100)}%)`)
  }
  
  return strengths.length > 0 ? strengths : ['Limited high-confidence strengths identified']
}

function generateKeyRisks(_evidence: any[], score: any): string[] {
  const risks: string[] = []
  
  if (score.confidenceBreakdown.overallConfidence < 70) {
    risks.push(`Limited assessment confidence (${score.confidenceBreakdown.overallConfidence}%) affects reliability`)
  }
  
  if (score.confidenceBreakdown.missingCriticalEvidence.length > 0) {
    risks.push(`Missing ${score.confidenceBreakdown.missingCriticalEvidence.length} critical evidence items`)
  }
  
  if (score.technicalScore < 50 || score.technicalConfidence < 0.5) {
    risks.push(`Technical concerns (Score: ${score.technicalScore}/100, Confidence: ${Math.round(score.technicalConfidence * 100)}%)`)
  }
  if (score.marketScore < 50 || score.marketConfidence < 0.5) {
    risks.push(`Market challenges (Score: ${score.marketScore}/100, Confidence: ${Math.round(score.marketConfidence * 100)}%)`)
  }
  if (score.financialScore < 50 || score.financialConfidence < 0.5) {
    risks.push(`Financial risks (Score: ${score.financialScore}/100, Confidence: ${Math.round(score.financialConfidence * 100)}%)`)
  }
  
  return risks
}

function generateNextSteps(score: any): string[] {
  const steps: string[] = []
  
  if (score.confidenceBreakdown.missingCriticalEvidence.includes('financial_statements')) {
    steps.push('Obtain detailed financial statements')
  }
  if (score.confidenceBreakdown.missingCriticalEvidence.includes('customer_references')) {
    steps.push('Conduct customer reference calls')
  }
  if (score.confidenceBreakdown.missingCriticalEvidence.includes('technical_architecture')) {
    steps.push('Schedule technical architecture review')
  }
  
  if (score.confidenceBreakdown.overallConfidence < 70) {
    steps.push('Gather additional evidence to improve assessment confidence')
  }
  
  if (score.investmentRecommendation === 'Strong Buy' || score.investmentRecommendation === 'Buy') {
    steps.push('Schedule management presentation')
    steps.push('Begin detailed due diligence process')
  }
  
  return steps.length > 0 ? steps : ['Review assessment and determine next actions']
}

// Stub functions for evidence extraction - implement based on your evidence structure
function extractTechStack(_evidence: any[]): any[] { return [] }
function extractArchitectureHighlights(_evidence: any[]): string[] { return [] }
function extractScalabilityFeatures(_evidence: any[]): string[] { return [] }
function extractInnovativeAspects(_evidence: any[]): string[] { return [] }
function extractMarketSize(_evidence: any[]): string | null { return null }
function extractTargetMarket(_evidence: any[]): string | null { return null }
function extractCompetitors(_evidence: any[]): any[] { return [] }
function extractCompetitivePosition(_evidence: any[]): string | null { return null }
function extractGrowthRate(_evidence: any[]): string | null { return null }
function extractMarketTrends(_evidence: any[]): string[] { return [] }
function extractOpportunities(_evidence: any[]): string[] { return [] }
function extractThreats(_evidence: any[]): string[] { return [] }
function extractDifferentiators(_evidence: any[]): string[] { return [] }
function extractTeamMembers(_evidence: any[]): any[] { return [] }
function extractTeamStrengths(_evidence: any[]): string[] { return [] }
function extractTeamGaps(_evidence: any[]): string[] { return [] }
function extractCulture(_evidence: any[]): string | null { return null }
function extractFinancialGrowthRate(_evidence: any[]): string | null { return null }
function extractBurnRate(_evidence: any[]): string | null { return null }
function extractRunway(_evidence: any[]): string | null { return null }
function extractKeyMetrics(_evidence: any[]): any[] { return [] }
function extractFundingHistory(_evidence: any[]): any[] { return [] }
function extractFinancialStrengths(_evidence: any[]): string[] { return [] }
function extractFinancialRisks(_evidence: any[]): string[] { return [] }
function generateSecuritySummary(_evidence: any[]): string { return 'Security assessment based on available evidence' }
function extractSecurityScore(_evidence: any[]): number { return 70 }
function extractCompliance(_evidence: any[]): string[] { return [] }
function extractSecurityStrengths(_evidence: any[]): string[] { return [] }
function extractVulnerabilities(_evidence: any[]): any[] { return [] }
function generateSecurityRecommendations(_evidence: any[]): string[] { return [] }

export const reportGenerationWorker = new Worker<ReportGenerationJob>(
  'report-generation',
  async (job: Job<ReportGenerationJob>) => {
    const { scanRequestId, company, domain, investmentThesis, investorProfile } = job.data
    
    console.log(`Starting enhanced report generation for ${company} (${scanRequestId})`)
    
    try {
      // Update scan request status
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'generating_report'
        })
        .eq('id', scanRequestId)
      
      // Find the evidence collection for this scan request
      await job.updateProgress(10)
      const { data: collection } = await supabase
        .from('evidence_collections')
        .select('*')
        .contains('metadata', { scan_request_id: scanRequestId })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      // Load evidence items
      let evidence = []
      let evidenceError = null
      
      if (collection?.id) {
        const result = await supabase
          .from('evidence_items')
          .select('*')
          .eq('collection_id', collection.id)
          .order('created_at', { ascending: false })
        evidence = result.data || []
        evidenceError = result.error
      } else {
        // Fallback to company_name
        const result = await supabase
          .from('evidence_items')
          .select('*')
          .eq('company_name', company)
          .order('created_at', { ascending: false })
        evidence = result.data || []
        evidenceError = result.error
      }
      
      if (evidenceError) throw evidenceError
      
      console.log(`Loaded ${evidence?.length || 0} evidence items`)
      
      // Generate report with comprehensive scoring
      await job.updateProgress(30)
      const { reportData, investmentScore, grade } = await generateEnhancedReport(
        company,
        domain,
        investmentThesis,
        evidence || [],
        investorProfile
      )
      
      // Generate citations with confidence scores
      await job.updateProgress(60)
      const citations: any[] = []
      
      // Create citations from high-confidence evidence
      if (evidence && evidence.length > 0) {
        const highConfidenceEvidence = evidence
          .filter(e => (e.confidence_score || 0.7) >= 0.6)
          .sort((a, b) => (b.confidence_score || 0.7) - (a.confidence_score || 0.7))
          .slice(0, 30)
        
        highConfidenceEvidence.forEach((item, index) => {
          citations.push({
            citation_number: index + 1,
            evidence_item_id: item.id,
            section: determineCitationSection(item),
            claim_text: item.content_data?.summary || item.content_data?.processed || '',
            confidence: item.confidence_score || 0.7,
            evidence_type: item.evidence_type || item.type,
            source_url: item.source_url
          })
        })
      }
      
      await job.updateProgress(80)
      
      // Create report record with comprehensive scoring
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: investmentScore,
          investment_rationale: reportData.investmentRecommendation.rationale,
          tech_health_score: reportData.comprehensiveScore.technicalScore,
          tech_health_grade: grade,
          report_data: reportData,
          evidence_count: evidence?.length || 0,
          citation_count: citations.length,
          executive_summary: reportData.executiveSummary.content,
          report_version: '3.0',
          ai_model_used: 'comprehensive-scoring-v1',
          quality_score: reportData.comprehensiveScore.confidenceBreakdown.evidenceQuality,
          confidence_score: reportData.comprehensiveScore.confidenceBreakdown.overallConfidence / 100,
          human_reviewed: false,
          metadata: {
            comprehensiveScore: reportData.comprehensiveScore,
            missingEvidence: reportData.comprehensiveScore.confidenceBreakdown.missingCriticalEvidence,
            confidenceFactors: {
              evidenceQuality: reportData.comprehensiveScore.confidenceBreakdown.evidenceQuality,
              evidenceCoverage: reportData.comprehensiveScore.confidenceBreakdown.evidenceCoverage,
              penaltyApplied: reportData.comprehensiveScore.confidenceBreakdown.penaltyApplied
            }
          },
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
      
      await job.updateProgress(95)
      
      // Update scan request with completion
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'completed',
          ai_workflow_completed_at: new Date().toISOString(),
          report_id: report.id
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      
      console.log(`Report generation completed for ${company}. Score: ${investmentScore}, Grade: ${grade}, Confidence: ${reportData.comprehensiveScore.confidenceBreakdown.overallConfidence}%`)
      
      return {
        reportId: report.id,
        investmentScore,
        grade,
        confidence: reportData.comprehensiveScore.confidenceBreakdown.overallConfidence,
        missingEvidence: reportData.comprehensiveScore.confidenceBreakdown.missingCriticalEvidence
      }
      
    } catch (error) {
      console.error('Report generation error:', error)
      
      // Update scan request with error
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'failed',
          ai_workflow_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 60000, // 10 reports per minute
    },
  }
)

function determineCitationSection(item: any): string {
  const type = item.evidence_type || item.type || ''
  const category = item.category || ''
  
  if (category === 'technical' || type.includes('tech')) return 'technologyOverview'
  if (category === 'market' || type.includes('market')) return 'marketAnalysis'
  if (category === 'team' || type.includes('team')) return 'teamAnalysis'
  if (category === 'financial' || type.includes('financ')) return 'financialHealth'
  if (type.includes('security')) return 'securityAssessment'
  
  return 'executiveSummary'
}

// Start the worker if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting enhanced report generation worker v3...')
  reportGenerationWorker.on('ready', () => {
    console.log('Report generation worker v3 is ready')
  })
  
  reportGenerationWorker.on('failed', (job, error) => {
    console.error(`Job ${job?.id} failed:`, error)
  })
}