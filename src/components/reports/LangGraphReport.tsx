import { useState } from 'react'
import { TechScanAlert, TechScanButton } from '@/components/brand'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  CheckCircle, 
  Info,
  FileText,
  ChevronRight,
  ExternalLink,
  Download,
  Brain,
  Target,
  Shield,
  BarChart3,
  Award
} from 'lucide-react'
import { PieChart as ReChartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { EvidenceModal } from './EvidenceModal'
import { type Citation } from './EvidenceCitation'

interface LangGraphReportProps {
  report: {
    thesis: {
      company: string
      website: string
      statement: string
      type: string
      pillars: Array<{
        id: string
        name: string
        weight: number
        description?: string
      }>
    }
    evidence: Array<{
      id: string
      source: {
        name: string
        url?: string
        credibilityScore: number
      }
      content: string
      qualityScore: {
        overall: number
      }
      metadata?: {
        confidence?: number
      }
    }>
    report: {
      executiveSummary?: string
      recommendation?: {
        decision: string
        confidence: number
        keyDrivers: string[]
        risks: string[]
        nextSteps: string[]
        timeline?: string
      }
      sections: Array<{
        title: string
        content: string
        confidence?: number
        citations?: string[]
      }>
      metadata?: {
        confidenceLevel?: string
        inferenceApproach?: string
        informationGatheringRecommendations?: string[]
      }
    } | null
    metadata?: {
      evidenceCount: number
      averageQualityScore: number
      reportGeneratedAt?: string
    }
  }
}

export function LangGraphReport({ report }: LangGraphReportProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1])) // Expand first two sections by default

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  // Extract report content from evidence when report field is null
  const getReportContent = () => {
    if (report.report) {
      return report.report
    }
    
    // Extract content from evidence when report is null
    const reportEvidence = report.evidence.find(e => 
      e.content.includes('Executive Summary') || 
      e.content.includes('Comprehensive Summary')
    )
    
    if (reportEvidence) {
      const content = reportEvidence.content
      const sections = content.split(/(?=\d+\.|###|\n\n[A-Z])/g).filter(s => s.trim().length > 50)
      
      return {
        executiveSummary: sections[0] || content.substring(0, 1000) + '...',
        recommendation: undefined, // No recommendation data in evidence
        sections: sections.slice(1).map((section, index) => ({
          title: section.match(/^[\d.]*\s*([^.\n]+)/)?.[1]?.trim() || `Section ${index + 1}`,
          content: section.trim(),
          confidence: 85,
          citations: undefined
        })),
        metadata: {
          confidenceLevel: 'High',
          inferenceApproach: 'Evidence-based analysis',
          informationGatheringRecommendations: undefined
        }
      }
    }
    
    return null
  }

  const reportContent = getReportContent()

  // Create citation from evidence references
  const createCitation = (claim: string, evidenceIds: string[]): Citation => {
    const relevantEvidence = report.evidence
      .filter(e => evidenceIds.includes(e.id))
      .map(e => ({
        id: e.id,
        title: e.source?.name || 'Unknown Source',
        source: e.source?.name || 'Unknown Source',
        excerpt: e.content ? e.content.substring(0, 300) + '...' : '',
        type: 'document' as const,
        url: e.source?.url,
        metadata: {
          lastModified: new Date().toISOString(),
          confidence: e.metadata?.confidence || e.qualityScore?.overall * 100 || 0
        }
      }))

    return {
      id: `citation-${evidenceIds.join('-')}`,
      claim,
      evidence: relevantEvidence,
      reasoning: 'Based on comprehensive analysis using LangGraph deep research',
      confidence: reportContent?.recommendation?.confidence || 0,
      analyst: 'LangGraph AI Research System',
      reviewDate: new Date().toISOString(),
      methodology: 'Multi-source deep research with quality-based confidence scoring'
    }
  }

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null
    
    const variant = confidence >= 80 ? 'default' : 
                   confidence >= 60 ? 'secondary' : 
                   'destructive'
    
    const label = confidence >= 80 ? 'High Confidence' :
                  confidence >= 60 ? 'Medium Confidence' :
                  'Low Confidence'
    
    return <Badge variant={variant} className="ml-2">{label} ({confidence}%)</Badge>
  }


  // Generate chart data from evidence
  const evidenceQualityData = report.evidence.slice(0, 10).map((evidence, index) => ({
    name: `Source ${index + 1}`,
    quality: (evidence.qualityScore?.overall || 0) * 100,
    confidence: evidence.metadata?.confidence || 0
  }))

  const confidenceDistribution = [
    { name: 'High (80-100%)', value: report.evidence.filter(e => (e.qualityScore?.overall || 0) * 100 >= 80).length, color: '#10b981' },
    { name: 'Medium (60-79%)', value: report.evidence.filter(e => (e.qualityScore?.overall || 0) * 100 >= 60 && (e.qualityScore?.overall || 0) * 100 < 80).length, color: '#f59e0b' },
    { name: 'Low (0-59%)', value: report.evidence.filter(e => (e.qualityScore?.overall || 0) * 100 < 60).length, color: '#ef4444' }
  ]


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.thesis.type === 'sales-intelligence' ? 'Sales Intelligence Report' : 'Due Diligence Report'}</h1>
            <p className="text-muted-foreground mt-1">
              Company: <span className="font-semibold text-electric-teal">{report.thesis.company}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Generated by: LangGraph AI</p>
            <p className="text-sm text-muted-foreground">Date: {new Date(report.metadata?.reportGeneratedAt || Date.now()).toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Evidence: {report.evidence.length} sources</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview">Executive Summary</TabsTrigger>
          <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="overview" className="space-y-6">

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-electric-teal">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-black">
                    {reportContent?.recommendation?.decision || 'Analysis Complete'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reportContent?.recommendation?.confidence || ((report.metadata?.averageQualityScore || 0) * 100).toFixed(0)}% Confidence
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Evidence Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-black">{report.evidence.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Research Sources</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-black">
                    {((report.metadata?.averageQualityScore || 0) * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Avg. Source Quality</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Analysis Depth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-black">{reportContent?.sections?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Report Sections</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Recommendation */}
          {reportContent?.recommendation && (
            <Card className="border-2 border-electric-teal">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-electric-teal" />
                  Investment Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-3xl font-bold font-space text-brand-black">{reportContent.recommendation.decision}</p>
                      <p className="text-sm text-muted-foreground font-ibm">Decision</p>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="text-center">
                      <p className="text-3xl font-bold font-space text-brand-black">{reportContent.recommendation.confidence}%</p>
                      <p className="text-sm text-muted-foreground font-ibm">Confidence</p>
                    </div>
                  </div>
                  {reportContent.recommendation.timeline && (
                    <Badge variant="outline" className="text-sm font-space">
                      Timeline: {reportContent.recommendation.timeline}
                    </Badge>
                  )}
                </div>

                {/* Key Drivers */}
                {reportContent.recommendation.keyDrivers?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 font-space">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Key Drivers
                    </h4>
                    <ul className="space-y-1">
                      {reportContent.recommendation.keyDrivers.map((driver, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 font-ibm">
                          <span className="text-success mt-1">•</span>
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {reportContent.recommendation.risks?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 font-space">
                      <AlertTriangle className="h-4 w-4 text-error" />
                      Risks
                    </h4>
                    <ul className="space-y-1">
                      {reportContent.recommendation.risks.map((risk, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 font-ibm">
                          <span className="text-error mt-1">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {reportContent.recommendation.nextSteps?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2 font-space">
                      <Target className="h-4 w-4 text-brand-teal" />
                      Next Steps
                    </h4>
                    <ul className="space-y-1">
                      {reportContent.recommendation.nextSteps.map((step, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 font-ibm">
                          <span className="text-brand-teal mt-1">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Executive Summary */}
          {reportContent?.executiveSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap font-ibm leading-relaxed">
                  {reportContent.executiveSummary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Website Link */}
          {report.thesis.website && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-brand-teal" />
                  <a 
                    href={report.thesis.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-teal hover:text-brand-teal/80 font-ibm"
                  >
                    {report.thesis.website}
                  </a>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {report.thesis.statement}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deep Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Report Sections */}
          {reportContent?.sections?.length ? (
            <div className="space-y-4">
              {reportContent.sections.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform text-brand-teal cursor-pointer ${
                            expandedSections.has(index) ? 'rotate-90' : ''
                          }`}
                          onClick={() => toggleSection(index)}
                        />
                        {section.title}
                        {section.confidence && getConfidenceBadge(section.confidence)}
                      </CardTitle>
                      {section.citations && section.citations.length > 0 && (
                        <Badge variant="outline" className="text-xs font-space">
                          {section.citations.length} citations
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {expandedSections.has(index) && (
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap font-ibm leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                      {section.citations && section.citations.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium mb-2 font-space">Citations:</p>
                          <div className="flex flex-wrap gap-2">
                            {section.citations.map((citationId, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="cursor-pointer hover:bg-brand-teal/10 font-mono"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCitation(createCitation(
                                    section.title,
                                    [citationId]
                                  ))
                                }}
                              >
                                [{citationId}]
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Report Content Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TechScanAlert
                  type="info"
                  title="Report content is being processed"
                  description="Evidence has been collected but the final report structure is still being generated. The raw content is available in the evidence sections below."
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          {/* Information Gathering Recommendations */}
          {reportContent?.metadata?.informationGatheringRecommendations && 
           reportContent.metadata.informationGatheringRecommendations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Recommended Information Gathering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TechScanAlert
                  type="warning"
                  title="Additional information recommended for higher confidence"
                  description=""
                  dismissible={false}
                >
                  <ul className="space-y-1 mt-2">
                    {reportContent.metadata.informationGatheringRecommendations.map((rec, i) => (
                      <li key={i} className="text-sm flex items-start gap-2 font-ibm">
                        <span className="text-warning mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </TechScanAlert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No specific recommendations have been generated for this analysis. The research appears comprehensive based on available evidence.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evidence Quality Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evidence Quality Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ReChartsPieChart>
                    <Pie
                      data={confidenceDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {confidenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </ReChartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Research Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Research Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-ibm">Evidence Collected</span>
                    <span className="font-semibold font-space">{report.metadata?.evidenceCount || report.evidence.length}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-ibm">Average Quality Score</span>
                    <span className="font-semibold font-space">
                      {((report.metadata?.averageQualityScore || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={(report.metadata?.averageQualityScore || 0) * 100} 
                    className="h-2"
                  />
                </div>
                
                {reportContent?.metadata?.confidenceLevel && (
                  <div>
                    <p className="text-sm font-medium mb-1 font-space">Confidence Level</p>
                    <Badge variant={
                      reportContent.metadata.confidenceLevel === 'high' ? 'default' :
                      reportContent.metadata.confidenceLevel === 'medium' ? 'secondary' :
                      'destructive'
                    } className="font-space">
                      {reportContent.metadata.confidenceLevel
                        ? reportContent.metadata.confidenceLevel.charAt(0).toUpperCase() + 
                          reportContent.metadata.confidenceLevel.slice(1)
                        : 'Unknown'}
                    </Badge>
                  </div>
                )}

                {reportContent?.metadata?.inferenceApproach && (
                  <div>
                    <p className="text-sm font-medium mb-1 font-space">Analysis Approach</p>
                    <p className="text-sm text-muted-foreground font-ibm">
                      {reportContent.metadata.inferenceApproach}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Quality Chart */}
            {evidenceQualityData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Source Quality Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={evidenceQualityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quality" fill="#0d9488" name="Quality Score" />
                      <Bar dataKey="confidence" fill="#f59e0b" name="Confidence" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidence Sources
                <Badge variant="outline">{report.evidence.length} sources</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(report.evidence || []).slice(0, 20).map((evidence) => (
                  <Card
                    key={evidence.id}
                    className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setSelectedCitation(createCitation(
                      evidence.source?.name || 'Unknown Source',
                      [evidence.id]
                    ))}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2 font-space">
                        <span className="font-mono text-brand-teal">[{evidence.id}]</span>
                        {evidence.source?.name || 'Unknown Source'}
                        {evidence.source?.url && (
                          <ExternalLink className="h-3 w-3 text-brand-teal" />
                        )}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-space">
                          Quality: {((evidence.qualityScore?.overall || 0) * 100).toFixed(0)}%
                        </Badge>
                        {evidence.metadata?.confidence && (
                          <Badge variant="outline" className="text-xs font-space">
                            Confidence: {evidence.metadata.confidence}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 font-ibm">
                      {evidence.content || 'No content available'}
                    </p>
                  </Card>
                ))}
                {report.evidence.length > 20 && (
                  <p className="text-sm text-muted-foreground text-center py-2 font-ibm">
                    Showing 20 of {report.evidence.length} evidence sources
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Methodology Tab */}
        <TabsContent value="methodology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Research Methodology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Research Approach</h4>
                <p className="text-sm text-muted-foreground">
                  This report was generated using LangGraph's AI-powered deep research system, which employs multi-source evidence collection and quality-based confidence scoring.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Evidence Collection</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Comprehensive web research across {report.evidence.length} sources</li>
                  <li>• Quality scoring and credibility assessment for each source</li>
                  <li>• Multi-dimensional content analysis and extraction</li>
                  <li>• Cross-reference validation between sources</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Analysis Framework</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Structured thesis validation approach</li>
                  <li>• Evidence-based confidence assessment</li>
                  <li>• Multi-pillar investment analysis framework</li>
                  <li>• Risk-adjusted recommendation synthesis</li>
                </ul>
              </div>

              {report.thesis.pillars && report.thesis.pillars.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Investment Thesis Pillars</h4>
                  <div className="space-y-2">
                    {report.thesis.pillars.map((pillar) => (
                      <div key={pillar.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm font-medium">{pillar.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Weight: {(pillar.weight * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-space">
              Generated by LangGraph
            </Badge>
            <Badge variant="outline" className="font-space">
              Deep Research Mode
            </Badge>
            <Badge variant="outline" className="font-space">
              {report.evidence.length} Sources Analyzed
            </Badge>
          </div>
          <div className="flex gap-2">
            <TechScanButton variant="secondary" icon={<Download className="h-4 w-4" />}>
              Export PDF
            </TechScanButton>
            <TechScanButton 
              variant="secondary" 
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => setActiveTab('analytics')}
            >
              View Analytics
            </TechScanButton>
          </div>
        </div>
      </Card>

      {/* Evidence Modal */}
      {selectedCitation && (
        <EvidenceModal
          isOpen={!!selectedCitation}
          onClose={() => setSelectedCitation(null)}
          citation={selectedCitation}
          userRole="admin"
        />
      )}
    </div>
  )
}