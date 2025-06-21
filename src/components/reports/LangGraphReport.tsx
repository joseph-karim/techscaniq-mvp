import { useState } from 'react'
import { TechScanCard, ReportHeader, ReportSection, TechScanAlert, TechScanButton, ProgressBar } from '@/components/brand'
import { Badge } from '@/components/ui/badge'
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

  const getDecisionIcon = (decision: string) => {
    if (!decision) return <Info className="h-5 w-5 text-brand-gunmetal" />
    
    switch (decision && typeof decision === 'string' ? decision.toLowerCase() : '') {
      case 'strong buy':
      case 'buy':
        return <TrendingUp className="h-5 w-5 text-success" />
      case 'hold':
        return <Target className="h-5 w-5 text-warning" />
      case 'sell':
      case 'strong sell':
        return <TrendingDown className="h-5 w-5 text-error" />
      default:
        return <Info className="h-5 w-5 text-brand-gunmetal" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ReportHeader
        company={report.thesis.company}
        reportType={report.thesis.type === 'sales-intelligence' ? 'sales-intelligence' : 'pe-due-diligence'}
        reportId={`langgraph-${Date.now()}`}
        generatedAt={report.metadata?.reportGeneratedAt || new Date().toISOString()}
        completionTime="Generated with LangGraph"
      />

      {/* Website Link */}
      {report.thesis.website && (
        <TechScanCard variant="default" className="p-4">
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
        </TechScanCard>
      )}

      {/* Investment Recommendation */}
      {reportContent?.recommendation && (
        <TechScanCard variant="highlighted" className="space-y-4">
          <ReportSection
            title="Investment Recommendation"
            icon={getDecisionIcon(reportContent.recommendation.decision)}
            className="pb-0"
          >
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
          </ReportSection>

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
        </TechScanCard>
      )}

      {/* Executive Summary */}
      {reportContent?.executiveSummary && (
        <ReportSection
          title="Executive Summary"
          icon={<FileText className="h-5 w-5" />}
        >
          <p className="text-muted-foreground whitespace-pre-wrap font-ibm leading-relaxed">
            {reportContent.executiveSummary}
          </p>
        </ReportSection>
      )}

      {/* Evidence Quality and Information Gathering */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Evidence Quality Metrics */}
        <ReportSection
          title="Research Quality Metrics"
          icon={<Brain className="h-5 w-5" />}
        >
          <div className="space-y-4">
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
              <ProgressBar 
                value={(report.metadata?.averageQualityScore || 0) * 100} 
                max={100}
                color="teal"
                size="md"
                label="Quality Score"
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
          </div>
        </ReportSection>

        {/* Information Gathering Recommendations */}
        {reportContent?.metadata?.informationGatheringRecommendations && 
         reportContent.metadata.informationGatheringRecommendations.length > 0 && (
          <ReportSection
            title="Recommended Information Gathering"
            icon={<Shield className="h-5 w-5" />}
          >
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
          </ReportSection>
        )}
      </div>

      {/* Report Sections */}
      {reportContent?.sections?.length ? (
        <ReportSection
          title="Detailed Analysis"
          subtitle="Click on sections to expand/collapse"
          icon={<BarChart3 className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {reportContent.sections.map((section, index) => (
            <TechScanCard key={index} variant="default" className="overflow-hidden">
              <div 
                className="cursor-pointer hover:bg-brand-teal/5 transition-colors p-6 border-b border-gray-200"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2 font-space">
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform text-brand-teal ${
                        expandedSections.has(index) ? 'rotate-90' : ''
                      }`}
                    />
                    {section.title}
                    {section.confidence && getConfidenceBadge(section.confidence)}
                  </h3>
                  {section.citations && section.citations.length > 0 && (
                    <Badge variant="outline" className="text-xs font-space">
                      {section.citations.length} citations
                    </Badge>
                  )}
                </div>
              </div>
              {expandedSections.has(index) && (
                <div className="p-6">
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
                </div>
              )}
            </TechScanCard>
          ))}
        </div>
      </ReportSection>
      ) : (
        <TechScanCard>
          <ReportSection
            title="Report Content Processing"
            icon={<Info className="h-5 w-5" />}
          >
            <TechScanAlert
              type="info"
              title="Report content is being processed"
              description="Evidence has been collected but the final report structure is still being generated. The raw content is available in the evidence sections below."
            />
          </ReportSection>
        </TechScanCard>
      )}

      {/* Evidence Summary */}
      <ReportSection
        title="Evidence Sources"
        subtitle={`${report.evidence.length} pieces of evidence collected`}
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(report.evidence || []).slice(0, 20).map((evidence) => (
            <TechScanCard
              key={evidence.id}
              variant="default"
              hoverable={true}
              className="p-3 cursor-pointer"
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
            </TechScanCard>
          ))}
          {report.evidence.length > 20 && (
            <p className="text-sm text-muted-foreground text-center py-2 font-ibm">
              Showing 20 of {report.evidence.length} evidence sources
            </p>
          )}
        </div>
      </ReportSection>

      {/* Actions */}
      <TechScanCard variant="default" className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-space">
              Generated by LangGraph
            </Badge>
            <Badge variant="outline" className="font-space">
              Deep Research Mode
            </Badge>
          </div>
          <div className="flex gap-2">
            <TechScanButton variant="secondary" icon={<Download className="h-4 w-4" />}>
              Export PDF
            </TechScanButton>
            <TechScanButton variant="secondary" icon={<BarChart3 className="h-4 w-4" />}>
              View Analytics
            </TechScanButton>
          </div>
        </div>
      </TechScanCard>

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