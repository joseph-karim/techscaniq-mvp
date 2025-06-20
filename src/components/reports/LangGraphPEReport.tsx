import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  Download,
  Target,
  Shield,
  XCircle,
  Activity,
  Code,
  Scale,
  Users
} from 'lucide-react'
import { EvidenceModal } from './EvidenceModal'
import { type Citation } from './EvidenceCitation'
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Tooltip
} from 'recharts'

interface LangGraphPEReportProps {
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
      techHealthScore?: number
      techHealthGrade?: string
      investmentScore?: number
      recommendation?: {
        decision: string
        confidence: number
        keyDrivers: string[]
        risks: string[]
        nextSteps: string[]
        timeline?: string
      }
      technicalAssessment?: {
        architecture: { score: number; findings: string[] }
        scalability: { score: number; findings: string[] }
        security: { score: number; findings: string[] }
        teamCapability: { score: number; findings: string[] }
        codeQuality: { score: number; findings: string[] }
        infrastructure: { score: number; findings: string[] }
      }
      sections: Array<{
        title: string
        content: string
        confidence?: number
        citations?: string[]
        riskLevel?: 'low' | 'medium' | 'high' | 'critical'
      }>
      metadata?: {
        confidenceLevel?: string
        inferenceApproach?: string
        informationGatheringRecommendations?: string[]
      }
    }
    metadata?: {
      evidenceCount: number
      averageQualityScore: number
      reportGeneratedAt?: string
    }
  }
}

export function LangGraphPEReport({ report }: LangGraphPEReportProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1]))
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'financial' | 'risks'>('overview')

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  // Create citation from evidence references
  const createCitation = (claim: string, evidenceIds: string[]): Citation => {
    const relevantEvidence = report.evidence
      .filter(e => evidenceIds.includes(e.id))
      .map(e => ({
        id: e.id,
        title: e.source.name,
        source: e.source.name,
        excerpt: e.content.substring(0, 300) + '...',
        type: 'document' as const,
        url: e.source.url,
        metadata: {
          lastModified: new Date().toISOString(),
          confidence: e.metadata?.confidence || e.qualityScore.overall * 100
        }
      }))

    return {
      id: `citation-${evidenceIds.join('-')}`,
      claim,
      evidence: relevantEvidence,
      reasoning: 'Based on comprehensive technical due diligence analysis',
      confidence: report.report.recommendation?.confidence || 0,
      analyst: 'LangGraph AI Due Diligence System',
      reviewDate: new Date().toISOString(),
      methodology: 'Multi-source technical assessment with quality-based confidence scoring'
    }
  }

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskBadge = (level?: string) => {
    const variant = level === 'low' ? 'default' : 
                   level === 'medium' ? 'secondary' : 
                   level === 'high' ? 'destructive' : 
                   level === 'critical' ? 'destructive' : 'outline'
    
    const icon = level === 'low' ? <CheckCircle className="h-3 w-3" /> :
                 level === 'medium' ? <AlertTriangle className="h-3 w-3" /> :
                 level === 'high' ? <AlertTriangle className="h-3 w-3" /> :
                 level === 'critical' ? <XCircle className="h-3 w-3" /> : null
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown'} Risk
      </Badge>
    )
  }

  // Prepare radar chart data for technical assessment
  const technicalRadarData = report.report?.technicalAssessment ? [
    { metric: 'Architecture', score: report.report.technicalAssessment.architecture?.score || 0 },
    { metric: 'Scalability', score: report.report.technicalAssessment.scalability?.score || 0 },
    { metric: 'Security', score: report.report.technicalAssessment.security?.score || 0 },
    { metric: 'Team', score: report.report.technicalAssessment.teamCapability?.score || 0 },
    { metric: 'Code Quality', score: report.report.technicalAssessment.codeQuality?.score || 0 },
    { metric: 'Infrastructure', score: report.report.technicalAssessment.infrastructure?.score || 0 }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {report.thesis.company}
                <Badge variant="outline" className="ml-2">
                  Private Equity Due Diligence
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {report.thesis.website}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Generated with LangGraph</p>
              {report.metadata?.reportGeneratedAt && (
                <p className="text-sm text-muted-foreground">
                  {new Date(report.metadata.reportGeneratedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tech Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getHealthScoreColor(report.report.techHealthScore)}`}>
                {report.report.techHealthScore || 'N/A'}
              </span>
              {report.report.techHealthGrade && (
                <Badge variant="outline" className="text-lg">
                  {report.report.techHealthGrade}
                </Badge>
              )}
            </div>
            <Progress 
              value={report.report.techHealthScore || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Investment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getHealthScoreColor(report.report.investmentScore)}`}>
                {report.report.investmentScore ? `${report.report.investmentScore}%` : 'N/A'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall investment attractiveness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {report.report.recommendation?.confidence || 0}%
              </span>
            </div>
            <Badge 
              variant={report.report.metadata?.confidenceLevel === 'high' ? 'default' : 'secondary'}
              className="mt-1"
            >
              {report.report.metadata?.confidenceLevel || 'Medium'} Confidence
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evidence Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {report.metadata?.evidenceCount || report.evidence.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg quality: {((report.metadata?.averageQualityScore || 0) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Recommendation */}
      {report.report.recommendation && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Investment Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-3xl font-bold">{report.report.recommendation.decision}</p>
                  <p className="text-sm text-muted-foreground">Recommendation</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-3xl font-bold">{report.report.recommendation.confidence}%</p>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                </div>
              </div>
              {report.report.recommendation.timeline && (
                <Badge variant="outline" className="text-sm">
                  {report.report.recommendation.timeline}
                </Badge>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Key Drivers */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Investment Positives
                </h4>
                <ul className="space-y-1">
                  {report.report.recommendation.keyDrivers.slice(0, 3).map((driver, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 mt-1">+</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Key Risks
                </h4>
                <ul className="space-y-1">
                  {report.report.recommendation.risks.slice(0, 3).map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-600 mt-1">!</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Due Diligence Actions
                </h4>
                <ul className="space-y-1">
                  {report.report.recommendation.nextSteps.slice(0, 3).map((step, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 mt-1">→</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Assessment Visualization */}
      {report.report.technicalAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Technical Assessment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={technicalRadarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Score" 
                    dataKey="score" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Analysis</CardTitle>
            <div className="flex gap-2">
              {(['overview', 'technical', 'financial', 'risks'] as const).map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Executive Summary */}
          {activeTab === 'overview' && report.report.executiveSummary && (
            <div className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {report.report.executiveSummary}
              </p>
            </div>
          )}

          {/* Technical Deep Dive */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              {Object.entries(report.report.technicalAssessment || {}).map(([key, assessment]) => (
                <div key={key}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    <Badge variant="outline">{assessment.score}/100</Badge>
                  </h4>
                  <ul className="space-y-1">
                    {assessment.findings.map((finding: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Other tabs would be implemented similarly */}
        </CardContent>
      </Card>

      {/* Report Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Findings</CardTitle>
          <CardDescription>
            Click on sections to expand/collapse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.report.sections.map((section, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${
                        expandedSections.has(index) ? 'rotate-90' : ''
                      }`}
                    />
                    {section.title}
                    {section.riskLevel && getRiskBadge(section.riskLevel)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {section.confidence && (
                      <Badge variant="outline" className="text-xs">
                        {section.confidence}% confidence
                      </Badge>
                    )}
                    {section.citations && section.citations.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {section.citations.length} sources
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedSections.has(index) && (
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>
                  {section.citations && section.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-2">
                        {section.citations.map((citationId, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10"
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
        </CardContent>
      </Card>

      {/* Information Gathering Recommendations */}
      {report.report.metadata?.informationGatheringRecommendations && 
       report.report.metadata.informationGatheringRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Additional Due Diligence Recommended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <p className="font-medium mb-2">
                  To increase confidence in this assessment, consider gathering:
                </p>
                <ul className="space-y-1">
                  {report.report.metadata.informationGatheringRecommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                LangGraph Due Diligence
              </Badge>
              <Badge variant="outline">
                Deep Technical Analysis
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Share with Team
              </Button>
            </div>
          </div>
        </CardContent>
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