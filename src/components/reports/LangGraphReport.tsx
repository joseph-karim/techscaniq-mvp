import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
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
  BarChart3
} from 'lucide-react'
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
    }
    metadata?: {
      evidenceCount: number
      averageQualityScore: number
      reportGeneratedAt?: string
    }
  }
}

export function LangGraphReport({ report }: LangGraphReportProps) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
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
      confidence: report.report.recommendation?.confidence || 0,
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

  const getDecisionIcon = (decision: string) => {
    if (!decision) return <Info className="h-5 w-5 text-blue-600" />
    
    switch (decision && decision.toLowerCase()) {
      case 'strong buy':
      case 'buy':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'hold':
        return <Target className="h-5 w-5 text-yellow-600" />
      case 'sell':
      case 'strong sell':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

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
                  {report.thesis.type === 'sales-intelligence' ? 'Sales Intelligence' : 'Investment Analysis'}
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

      {/* Investment Recommendation */}
      {report.report.recommendation && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getDecisionIcon(report.report.recommendation.decision)}
              Investment Recommendation
              {getConfidenceBadge(report.report.recommendation.confidence)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-3xl font-bold">{report.report.recommendation.decision}</p>
                  <p className="text-sm text-muted-foreground">Decision</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-3xl font-bold">{report.report.recommendation.confidence}%</p>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                </div>
              </div>
              {report.report.recommendation.timeline && (
                <Badge variant="outline" className="text-sm">
                  Timeline: {report.report.recommendation.timeline}
                </Badge>
              )}
            </div>

            {/* Key Drivers */}
            {report.report.recommendation.keyDrivers?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Key Drivers
                </h4>
                <ul className="space-y-1">
                  {report.report.recommendation.keyDrivers.map((driver, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {report.report.recommendation.risks?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Risks
                </h4>
                <ul className="space-y-1">
                  {report.report.recommendation.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {report.report.recommendation.nextSteps?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Next Steps
                </h4>
                <ul className="space-y-1">
                  {report.report.recommendation.nextSteps.map((step, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
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
      {report.report.executiveSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {report.report.executiveSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Evidence Quality and Information Gathering */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Evidence Quality Metrics */}
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
                <span className="text-sm">Evidence Collected</span>
                <span className="font-semibold">{report.metadata?.evidenceCount || report.evidence.length}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Average Quality Score</span>
                <span className="font-semibold">
                  {((report.metadata?.averageQualityScore || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress 
                value={(report.metadata?.averageQualityScore || 0) * 100} 
                className="h-2"
              />
            </div>
            
            {report.report.metadata?.confidenceLevel && (
              <div>
                <p className="text-sm font-medium mb-1">Confidence Level</p>
                <Badge variant={
                  report.report.metadata.confidenceLevel === 'high' ? 'default' :
                  report.report.metadata.confidenceLevel === 'medium' ? 'secondary' :
                  'destructive'
                }>
                  {report.report.metadata.confidenceLevel
                    ? report.report.metadata.confidenceLevel.charAt(0).toUpperCase() + 
                      report.report.metadata.confidenceLevel.slice(1)
                    : 'Unknown'}
                </Badge>
              </div>
            )}

            {report.report.metadata?.inferenceApproach && (
              <div>
                <p className="text-sm font-medium mb-1">Analysis Approach</p>
                <p className="text-sm text-muted-foreground">
                  {report.report.metadata.inferenceApproach}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Gathering Recommendations */}
        {report.report.metadata?.informationGatheringRecommendations && 
         report.report.metadata.informationGatheringRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recommended Information Gathering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <p className="font-medium mb-2">
                    Additional information recommended for higher confidence:
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
      </div>

      {/* Report Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
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
                    {section.confidence && getConfidenceBadge(section.confidence)}
                  </CardTitle>
                  {section.citations && section.citations.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {section.citations.length} citations
                    </Badge>
                  )}
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
                      <p className="text-sm font-medium mb-2">Citations:</p>
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

      {/* Evidence Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence Sources
          </CardTitle>
          <CardDescription>
            {report.evidence.length} pieces of evidence collected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(report.evidence || []).slice(0, 20).map((evidence) => (
              <div
                key={evidence.id}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedCitation(createCitation(
                  evidence.source?.name || 'Unknown Source',
                  [evidence.id]
                ))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    [{evidence.id}] {evidence.source?.name || 'Unknown Source'}
                    {evidence.source?.url && (
                      <ExternalLink className="h-3 w-3" />
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Quality: {((evidence.qualityScore?.overall || 0) * 100).toFixed(0)}%
                    </Badge>
                    {evidence.metadata?.confidence && (
                      <Badge variant="outline" className="text-xs">
                        Confidence: {evidence.metadata.confidence}%
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {evidence.content || 'No content available'}
                </p>
              </div>
            ))}
            {report.evidence.length > 20 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Showing 20 of {report.evidence.length} evidence sources
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Generated by LangGraph
              </Badge>
              <Badge variant="outline">
                Deep Research Mode
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
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