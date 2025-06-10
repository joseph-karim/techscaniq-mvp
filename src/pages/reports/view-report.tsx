import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { ScanReportSection } from '@/components/reports/ScanReportNavigation'
import { 
  FileText, Code, Shield, Users, Target, BarChart3, Building2, Wrench, 
  ChevronRight, ExternalLink, Info, AlertTriangle, CheckCircle, TrendingUp, 
  ArrowRight, Hash, Star, Award, Zap, 
  Calendar, Clock, Download, Share2, BookmarkPlus, Eye,
  Layers, Activity, AlertCircle, Loader2
} from 'lucide-react'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { Citation } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Home, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchReportWithEvidence, transformCitationForFrontend } from '@/lib/api/reports'
import type { ReportWithEvidence } from '@/lib/api/reports'
import { EnhancedEvidenceAppendix } from '@/components/reports/EnhancedEvidenceAppendix'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { ConfidenceVisualization } from '@/components/reports/ConfidenceVisualization'

// Executive-grade score visualization component following investment banking presentation standards
const ExecutiveScoreCard = ({ 
  title, 
  score, 
  maxScore = 10, 
  breakdown, 
  recommendation,
  riskLevel,
  className 
}: {
  title: string
  score: number
  maxScore?: number
  breakdown: Array<{ label: string; value: number; description: string; weight?: number }>
  recommendation?: string
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  className?: string
}) => {
  const percentage = (score / maxScore) * 100
  
  const getScoreColor = (score: number, max: number) => {
    const pct = (score / max) * 100
    if (pct >= 80) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' }
    if (pct >= 60) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
    if (pct >= 40) return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
  }

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'low': return <Badge className="bg-green-100 text-green-800 border-green-300">Low Risk</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium Risk</Badge>
      case 'high': return <Badge className="bg-orange-100 text-orange-800 border-orange-300">High Risk</Badge>
      case 'critical': return <Badge className="bg-red-100 text-red-800 border-red-300">Critical Risk</Badge>
      default: return null
    }
  }

  const colors = getScoreColor(score, maxScore)

  return (
    <Card className={cn(`${colors.bg} ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300`, className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">{title}</CardTitle>
            {riskLevel && (
              <div className="mb-2">
                {getRiskBadge(riskLevel)}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className={cn("text-4xl font-bold", colors.text)}>
                {score}
              </span>
              <span className="text-xl text-gray-500">/{maxScore}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {Math.round(percentage)}th percentile
            </div>
          </div>
        </div>
        
        {/* Visual progress indicator with gradient */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Score Distribution</span>
            <span>{percentage.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-out",
                percentage >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
                percentage >= 60 ? "bg-gradient-to-r from-amber-500 to-amber-600" :
                percentage >= 40 ? "bg-gradient-to-r from-orange-500 to-orange-600" :
                "bg-gradient-to-r from-red-500 to-red-600"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Accordion type="single" collapsible className="border-0">
          <AccordionItem value="breakdown" className="border-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                View Detailed Analysis & Calculation
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-3">
                {/* Calculation methodology */}
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Score Components
                  </h4>
                  <div className="space-y-3">
                    {breakdown.map((item, index) => {
                      const itemColors = getScoreColor(item.value, maxScore)
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">{item.label}</span>
                              {item.weight && (
                                <Badge variant="outline" className="text-xs">
                                  {item.weight}% weight
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                          <div className="text-right ml-4">
                            <span className={cn("text-lg font-bold", itemColors.text)}>
                              {item.value > 0 ? '+' : ''}{item.value}
                            </span>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  item.value >= 8 ? "bg-emerald-500" :
                                  item.value >= 6 ? "bg-amber-500" :
                                  item.value >= 4 ? "bg-orange-500" : "bg-red-500"
                                )}
                                style={{ width: `${(Math.abs(item.value) / maxScore) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Investment recommendation */}
                {recommendation && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Investment Implication
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

// Professional table of contents with investment banking hierarchy
const ProfessionalTableOfContents = ({ 
  sections, 
  activeSection, 
  onSectionChange,
  reportMetrics 
}: {
  sections: ScanReportSection[]
  activeSection: string
  onSectionChange: (sectionId: string) => void
  reportMetrics?: {
    investment_score?: number
    tech_health_score?: number
    tech_health_grade?: string
  }
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    overview: true,
    technical: true,
    security: true,
    recommendations: true
  })

  const groupedSections = sections.reduce((acc, section) => {
    if (!acc[section.category]) acc[section.category] = []
    acc[section.category].push(section)
    return acc
  }, {} as Record<string, ScanReportSection[]>)

  const categoryConfig = {
    overview: { 
      title: 'Executive Summary', 
      icon: <Award className="h-4 w-4" />, 
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    technical: { 
      title: 'Technical Analysis', 
      icon: <Code className="h-4 w-4" />, 
      color: 'text-purple-700',
      bgColor: 'bg-purple-50'
    },
    security: { 
      title: 'Risk Assessment', 
      icon: <Shield className="h-4 w-4" />, 
      color: 'text-red-700',
      bgColor: 'bg-red-50'
    },
    recommendations: { 
      title: 'Investment Decision', 
      icon: <Target className="h-4 w-4" />, 
      color: 'text-green-700',
      bgColor: 'bg-green-50'
    }
  }

  return (
    <div className="space-y-3">
      {/* Report Status Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border">
        <h3 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Report Status
        </h3>
        <div className="space-y-2">
          {reportMetrics?.investment_score && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Investment Score</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${reportMetrics.investment_score}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-blue-700">{reportMetrics.investment_score}/100</span>
              </div>
            </div>
          )}
          {reportMetrics?.tech_health_score && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Technical Health</span>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                    style={{ width: `${reportMetrics.tech_health_score}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-green-700">{reportMetrics.tech_health_score}/100</span>
              </div>
            </div>
          )}
          {reportMetrics?.tech_health_grade && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-600">Overall Grade</span>
              <Badge variant="outline" className="text-xs font-bold">
                {reportMetrics.tech_health_grade}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Navigation sections */}
      {Object.entries(groupedSections).map(([category, categorySections]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig]
        return (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left font-semibold transition-all hover:bg-gray-50",
                config?.bgColor
              )}
            >
              <div className="flex items-center gap-3">
                <span className={config?.color}>{config?.icon}</span>
                <span className={cn("text-sm", config?.color)}>{config?.title}</span>
                <Badge variant="outline" className="text-xs">
                  {categorySections.length}
                </Badge>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                expandedCategories[category] && "rotate-90",
                config?.color
              )} />
            </button>
            
            {expandedCategories[category] && (
              <div className="bg-white border-t">
                {categorySections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 text-left text-xs transition-all group border-l-2 hover:bg-gray-50",
                      activeSection === section.id
                        ? 'bg-blue-50 border-l-blue-500 text-blue-900'
                        : 'border-l-transparent text-gray-700 hover:border-l-gray-300',
                      index !== categorySections.length - 1 && "border-b border-gray-100"
                    )}
                  >
                    <Hash className="h-3 w-3 mt-0.5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{section.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5 truncate">{section.description}</div>
                    </div>
                    {activeSection === section.id && (
                      <ArrowRight className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Enhanced sidebar with professional insights
const ExecutiveInsightsSidebar = ({ 
  onNavigate 
}: {
  onNavigate: (target: string) => void
}) => {
  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            Executive Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">Key Strength</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Cloud-native architecture provides strong foundation for scalable growth
            </p>
          </div>
          
          <div className="p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-gray-900">Critical Risk</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Severe team capacity constraints threaten execution capability
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">Investment Thesis</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Conditional investment pending technical de-risking and team expansion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start hover:bg-blue-50 text-left"
              onClick={() => onNavigate('investment-thesis-framework')}
            >
              <ArrowRight className="h-3 w-3 mr-2" />
              Investment Framework
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start hover:bg-blue-50 text-left"
              onClick={() => onNavigate('technical-health-score')}
            >
              <ArrowRight className="h-3 w-3 mr-2" />
              Technical Analysis
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start hover:bg-blue-50 text-left"
              onClick={() => onNavigate('investment-recommendation')}
            >
              <ArrowRight className="h-3 w-3 mr-2" />
              Final Recommendation
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start hover:bg-blue-50 text-left"
              onClick={() => onNavigate('required-investment')}
            >
              <ArrowRight className="h-3 w-3 mr-2" />
              Investment Requirements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-600" />
            Report Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Download className="h-3 w-3 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Share2 className="h-3 w-3 mr-2" />
              Share Report
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <BookmarkPlus className="h-3 w-3 mr-2" />
              Save for Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ViewReport() {
  const { id } = useParams<{ id: string }>()
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [activeSection, setActiveSection] = useState('executive-summary')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportWithEvidence | null>(null)

  // Fetch report data with evidence and citations
  useEffect(() => {
    async function loadReport() {
      if (!id) return
      
      setLoading(true)
      try {
        const data = await fetchReportWithEvidence(id)
        if (data) {
          setReportData(data)
        }
      } catch (error) {
        console.error('Error loading report:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [id])

  // Transform report data to match expected format
  const currentReport = reportData ? {
    id: reportData.id,
    company_name: reportData.company_name || reportData.report_data?.company_name || 'Unknown Company',
    website_url: reportData.report_data?.website_url || '',
    created_at: reportData.created_at,
    report_type: 'standard',
    executive_summary: reportData.executive_summary || reportData.report_data?.executive_summary || '',
    investment_score: reportData.investment_score || reportData.report_data?.investment_score || 0,
    investment_rationale: reportData.investment_rationale || reportData.report_data?.investment_rationale || '',
    tech_health_score: reportData.tech_health_score || reportData.report_data?.tech_health_score || 0,
    tech_health_grade: reportData.tech_health_grade || reportData.report_data?.tech_health_grade || 'N/A',
    sections: reportData.report_data?.sections || [],
    scan_type: reportData.report_data?.scan_type || 'standard'
  } : null

  // Get citations from report data
  const citations = reportData?.citations?.map(transformCitationForFrontend) || []

  // Generate navigation sections from report data
  const getIconForSection = (title: string) => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('executive') || titleLower.includes('summary')) return <Award className="h-4 w-4" />
    if (titleLower.includes('technology') || titleLower.includes('stack') || titleLower.includes('architecture')) return <Code className="h-4 w-4" />
    if (titleLower.includes('security') || titleLower.includes('compliance')) return <Shield className="h-4 w-4" />
    if (titleLower.includes('team') || titleLower.includes('scalability')) return <Users className="h-4 w-4" />
    if (titleLower.includes('investment') || titleLower.includes('recommendation')) return <Target className="h-4 w-4" />
    if (titleLower.includes('company') || titleLower.includes('overview')) return <Building2 className="h-4 w-4" />
    if (titleLower.includes('transformation') || titleLower.includes('modernization')) return <Wrench className="h-4 w-4" />
    return <BarChart3 className="h-4 w-4" />
  }

  const getCategoryForSection = (title: string): 'overview' | 'technical' | 'security' | 'recommendations' => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('security') || titleLower.includes('compliance')) return 'security'
    if (titleLower.includes('investment') || titleLower.includes('recommendation')) return 'recommendations'
    if (titleLower.includes('technology') || titleLower.includes('architecture') || titleLower.includes('team')) return 'technical'
    return 'overview'
  }

  // Generate sections based on report format
  const generateSections = (): ScanReportSection[] => {
    if (!currentReport) return []
    
    // Check if it's the new array format (like Ring4)
    if (Array.isArray(currentReport.sections)) {
      return currentReport.sections.map((section) => ({
        id: section.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        title: section.title,
        icon: getIconForSection(section.title),
        description: `Analysis and insights for ${section.title.toLowerCase()}`,
        category: getCategoryForSection(section.title)
      }))
    }
    
    // Handle legacy object format (like Synergy)
    if (typeof currentReport.sections === 'object' && currentReport.sections) {
      return Object.entries(currentReport.sections).map(([key, section]: [string, any]) => ({
        id: key,
        title: section.title,
        icon: getIconForSection(section.title),
        description: section.summary || `Analysis and insights for ${section.title.toLowerCase()}`,
        category: getCategoryForSection(section.title)
      }))
    }
    
    return []
  }

  const dynamicSections = generateSections()

  // Set initial section to first available section
  useEffect(() => {
    if (dynamicSections.length > 0 && activeSection === 'executive-summary') {
      setActiveSection(dynamicSections[0].id)
    }
  }, [dynamicSections, activeSection])

  const handleCitationClick = (citationId: string) => {
    const citation = citations.find(c => c.id === citationId)
    if (citation) {
      setSelectedCitation(citation as Citation)
    }
  }

  const handleCloseModal = () => {
    setSelectedCitation(null)
  }

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    // Optionally, you can add smooth scrolling to the section
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Enhanced markdown components with professional styling and citation handling
  const markdownComponents = {
    h1: ({ node, ...props }: any) => {
      const id = props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      return (
        <h1 id={id} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 scroll-mt-4 border-b-2 border-blue-200 pb-3 bg-gradient-to-r from-blue-50 to-transparent px-4 py-3 rounded-lg" {...props} />
      )
    },
    h2: ({ node, ...props }: any) => {
      const id = props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      return (
        <h2 id={id} className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8 scroll-mt-4 border-l-4 border-blue-500 pl-4 bg-gradient-to-r from-blue-50 to-transparent py-2 rounded-r-lg" {...props} />
      )
    },
    h3: ({ node, ...props }: any) => {
      const id = props.children?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      return (
        <h3 id={id} className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6 scroll-mt-4 bg-gradient-to-r from-gray-50 to-transparent px-3 py-2 rounded-lg border-l-2 border-gray-300" {...props} />
      )
    },
    h4: ({ node, ...props }: any) => <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4 bg-gray-50 px-2 py-1 rounded" {...props} />,
    p: ({ node, ...props }: any) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-justify" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
    li: ({ node, ...props }: any) => <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-semibold text-gray-900 dark:text-gray-100 bg-yellow-100 px-1 rounded" {...props} />,
    em: ({ node, ...props }: any) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
    code: ({ node, inline, ...props }: any) => 
      inline ? (
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200 border" {...props} />
      ) : (
        <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto border shadow-inner" {...props} />
      ),
    pre: ({ node, ...props }: any) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-6 border shadow-inner" {...props} />,
    blockquote: ({ node, ...props }: any) => (
      <Alert className="mb-6 border-l-4 border-blue-500 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm leading-relaxed">
          <div {...props} />
        </AlertDescription>
      </Alert>
    ),
    hr: ({ node, ...props }: any) => <Separator className="my-8 border-gray-300" {...props} />,
    a: ({ node, href, ...props }: any) => {
      // Handle citation links with enhanced styling and tooltips
      if (href?.startsWith('#cite-')) {
        const citationId = href.replace('#', '')
        const citation = citations.find(c => c.id === citationId)
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCitationClick(citationId)}
                  className="inline-flex items-center text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-md text-sm mx-1 border border-blue-300 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {props.children}
                  <Info className="h-3 w-3 ml-1" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white p-3 rounded-lg shadow-lg">
                <div>
                  <p className="font-medium text-sm mb-1">{citation?.claim || 'Evidence-based finding'}</p>
                  <p className="text-xs text-gray-300">Confidence: {citation?.confidence || 'N/A'}% • Click for details</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
      
      // Handle internal anchor links
      if (href?.startsWith('#')) {
        const targetId = href.replace('#', '')
        return (
          <button
            onClick={() => scrollToSection(targetId)}
            className="text-blue-600 hover:text-blue-800 underline decoration-2 decoration-blue-300 hover:decoration-blue-500 inline-flex items-center gap-1 hover:bg-blue-50 px-1 rounded transition-all"
          >
            {props.children}
            <Hash className="h-3 w-3" />
          </button>
        )
      }
      
      // Regular external links
      return (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 underline decoration-2 decoration-blue-300 hover:decoration-blue-500 inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-1 py-0.5 rounded transition-all"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {props.children}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    },
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto mb-6 shadow-lg rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200" {...props} />
      </div>
    ),
    thead: ({ node, ...props }: any) => <thead className="bg-gray-50" {...props} />,
    th: ({ node, ...props }: any) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />,
    td: ({ node, ...props }: any) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" {...props} />
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { label: 'Reports', href: '/reports', icon: <FileText className="h-4 w-4" /> },
    { label: currentReport?.company_name || 'Report', icon: <Search className="h-4 w-4" /> }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Loading Report</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">Fetching report data and evidence...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Report Not Found</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">The requested technical assessment report could not be located in our system.</p>
            <Button onClick={() => window.history.back()} className="w-full">
              Return to Previous Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSection = () => {
    // Check if sections is an array (new format) or object (legacy format)
    if (Array.isArray(currentReport.sections)) {
      // New format - render sections array (like Ring4)
      const currentSection = currentReport.sections.find(section => 
        section.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === activeSection
      )
      
      if (!currentSection) return (
        <div className="p-12 text-center text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Section Not Found</h3>
          <p>The requested section could not be located.</p>
        </div>
      )
      
      return (
        <div className="max-w-none">
          {/* Enhanced Section Header */}
          <div className="mb-10 bg-gradient-to-r from-white to-gray-50 p-8 rounded-xl border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                {getIconForSection(currentSection.title)}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {currentSection.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Last Updated: {new Date().toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Investment Grade Analysis
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add comprehensive scoring visualization for Executive Summary */}
            {currentSection.title === 'Executive Summary' && currentReport && reportData?.metadata?.comprehensiveScore && (
              <div className="mb-8">
                <ConfidenceVisualization score={reportData.metadata.comprehensiveScore} />
              </div>
            )}
            
            {/* Add executive score cards for Executive Summary if no comprehensive score */}
            {currentSection.title === 'Executive Summary' && currentReport && !reportData?.metadata?.comprehensiveScore && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <ExecutiveScoreCard
                  title="Investment Thesis Score"
                  score={6}
                  maxScore={10}
                  riskLevel="medium"
                  recommendation="Conditional investment pending technical de-risking and team expansion to support growth objectives."
                  breakdown={[
                    { label: "Scalable Architecture", value: 4, description: "Cloud-native VoIP with multi-platform support", weight: 25 },
                    { label: "Market Expansion", value: 7, description: "Strong geographic reach and market growth", weight: 20 },
                    { label: "Competitive Edge", value: 5, description: "AI features but intense competition", weight: 15 },
                    { label: "Operational Efficiency", value: 6, description: "Good cost structure with some overhead", weight: 15 },
                    { label: "Execution Capacity", value: 3, description: "Critical team size limitations", weight: 25 }
                  ]}
                />
                <ExecutiveScoreCard
                  title="Technical Health Score"
                  score={65}
                  maxScore={100}
                  riskLevel="medium"
                  recommendation="Solid technical foundation with critical gaps in team capacity and security compliance requiring immediate attention."
                  breakdown={[
                    { label: "Architecture", value: 70, description: "Strong cloud-native foundation", weight: 25 },
                    { label: "Security", value: 45, description: "Major gaps in enterprise certifications", weight: 20 },
                    { label: "Scalability", value: 60, description: "Conceptually sound but execution constrained", weight: 15 },
                    { label: "Team Capability", value: 50, description: "Skilled but severely understaffed", weight: 20 },
                    { label: "Maintenance", value: 75, description: "Low operational overhead", weight: 10 },
                    { label: "Innovation", value: 70, description: "AI features and modern stack", weight: 10 }
                  ]}
                />
                <ExecutiveScoreCard
                  title="Technical Readiness"
                  score={6}
                  maxScore={10}
                  riskLevel="high"
                  recommendation="Strong technical foundation undermined by execution constraints. Immediate team scaling required for investment viability."
                  breakdown={[
                    { label: "Technology Foundation", value: 7, description: "Cloud-native VoIP platform", weight: 20 },
                    { label: "Market Position", value: 8, description: "Strong VoIP market growth", weight: 15 },
                    { label: "Execution Capability", value: 3, description: "Critical team limitations", weight: 25 },
                    { label: "Security Readiness", value: 4, description: "Lacks enterprise certifications", weight: 15 },
                    { label: "Scalability Potential", value: 6, description: "Architecture supports growth", weight: 15 },
                    { label: "Customer Experience", value: 5, description: "Pricing competitive but reliability issues", weight: 10 }
                  ]}
                />
              </div>
            )}
          </div>
          
          {/* Enhanced Content Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main content - professional formatting */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-xl border shadow-sm p-8">
                <div className="prose prose-gray dark:prose-invert max-w-none prose-lg">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {currentSection.content}
                  </ReactMarkdown>
                </div>
                
                {/* Enhanced subsections with professional accordion design */}
                {currentSection.subsections && currentSection.subsections.length > 0 && (
                  <div className="mt-12 border-t pt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Layers className="h-6 w-6 text-blue-600" />
                      Detailed Technical Analysis
                    </h3>
                    <Accordion type="single" collapsible className="space-y-4">
                      {currentSection.subsections.map((subsection: any, index: number) => (
                        <AccordionItem key={index} value={`subsection-${index}`} className="border rounded-xl bg-gradient-to-r from-gray-50 to-white shadow-sm">
                          <AccordionTrigger className="px-8 py-6 hover:no-underline text-left">
                            <div className="flex items-center gap-4 text-left">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <span className="text-lg font-semibold text-gray-900">{subsection.title}</span>
                                <p className="text-sm text-gray-600 mt-1">Comprehensive analysis and strategic insights</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-8 pb-8">
                            <div className="prose prose-gray dark:prose-invert max-w-none border-t pt-6">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={markdownComponents}
                              >
                                {subsection.content}
                              </ReactMarkdown>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <ExecutiveInsightsSidebar 
                  onNavigate={scrollToSection}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Legacy object format handling
    if (typeof currentReport.sections === 'object' && currentReport.sections) {
      const currentSection = currentReport.sections[activeSection]
      
      if (!currentSection) return (
        <div className="p-12 text-center text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Section Not Found</h3>
          <p>The requested section could not be located.</p>
        </div>
      )
      
      return (
        <div className="max-w-none">
          {/* Enhanced Section Header */}
          <div className="mb-10 bg-gradient-to-r from-white to-gray-50 p-8 rounded-xl border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                {getIconForSection(currentSection.title)}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {currentSection.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Last Updated: {new Date().toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Investment Grade Analysis
                  </span>
                  {currentSection.score && (
                    <Badge className="ml-2" variant="secondary">
                      Score: {currentSection.score}/100
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Content Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main content - professional formatting */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-xl border shadow-sm p-8">
                <div className="prose prose-gray dark:prose-invert max-w-none prose-lg">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {currentSection.content}
                  </ReactMarkdown>
                </div>
                
                {/* Enhanced subsections with professional accordion design */}
                {currentSection.subsections && currentSection.subsections.length > 0 && (
                  <div className="mt-12 border-t pt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <Layers className="h-6 w-6 text-blue-600" />
                      Detailed Technical Analysis
                    </h3>
                    <Accordion type="single" collapsible className="space-y-4">
                      {currentSection.subsections.map((subsection: any, index: number) => (
                        <AccordionItem key={index} value={`subsection-${index}`} className="border rounded-xl bg-gradient-to-r from-gray-50 to-white shadow-sm">
                          <AccordionTrigger className="px-8 py-6 hover:no-underline text-left">
                            <div className="flex items-center gap-4 text-left">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <span className="text-lg font-semibold text-gray-900">{subsection.title}</span>
                                <p className="text-sm text-gray-600 mt-1">Comprehensive analysis and strategic insights</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-8 pb-8">
                            <div className="prose prose-gray dark:prose-invert max-w-none border-t pt-6">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={markdownComponents}
                              >
                                {subsection.content}
                              </ReactMarkdown>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
            
            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <ExecutiveInsightsSidebar 
                  onNavigate={scrollToSection}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    // Fallback if sections format is not recognized
    return <div className="p-8 text-center text-gray-500">Report format not recognized</div>
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Enhanced Professional Header */}
        <div className="bg-white border-b shadow-lg">
          <div className="container mx-auto px-8 py-6">
            <Breadcrumbs items={breadcrumbItems} />
            
            {/* Executive Report Header */}
            <div className="mt-6 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {currentReport.company_name} Technical Assessment
                </h1>
                <div className="flex items-center gap-6 mt-3 text-lg text-gray-600">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {currentReport.scan_type}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(currentReport.created_at || '').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              
              {/* Executive Metrics Dashboard */}
              <div className="flex items-center gap-8">
                {currentReport.tech_health_score && (
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700">{currentReport.tech_health_score}</div>
                    <div className="text-sm text-blue-600 font-medium">Technical Health</div>
                    <Progress value={currentReport.tech_health_score} className="w-20 mt-2" />
                  </div>
                )}
                {currentReport.investment_score && (
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-700">{currentReport.investment_score}</div>
                    <div className="text-sm text-green-600 font-medium">Investment Score</div>
                    <Progress value={currentReport.investment_score} className="w-20 mt-2" />
                  </div>
                )}
                {currentReport.tech_health_grade && (
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <Badge variant="outline" className="text-2xl font-bold py-3 px-6 border-purple-300 text-purple-700">
                      {currentReport.tech_health_grade}
                    </Badge>
                    <div className="text-sm text-purple-600 font-medium mt-2">Overall Grade</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Professional Navigation Sidebar */}
          <nav className="w-96 bg-white border-r shadow-lg min-h-screen sticky top-0 overflow-y-auto">
            <div className="p-8">
              {/* Navigation Header */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Report Navigation
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Professional investment-grade technical assessment with evidence-based findings and strategic recommendations.
                </p>
              </div>

              {/* Professional Table of Contents */}
              <ProfessionalTableOfContents
                sections={dynamicSections}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                reportMetrics={{
                  investment_score: currentReport?.investment_score,
                  tech_health_score: currentReport?.tech_health_score,
                  tech_health_grade: currentReport?.tech_health_grade
                }}
              />
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 min-h-screen p-8">
            {renderSection()}
          </main>
        </div>

        {/* Evidence Appendix Section */}
        {currentReport && (
          <div className="container mx-auto px-8 py-12 bg-gray-50">
            <EnhancedEvidenceAppendix 
              companyName={currentReport.company_name}
              reportId={currentReport.id}
              comprehensiveScore={reportData?.metadata?.comprehensiveScore}
              className=""
            />
          </div>
        )}

        {/* Enhanced Citation Modal */}
        {selectedCitation && (
          <EvidenceModal
            isOpen={!!selectedCitation}
            onClose={handleCloseModal}
            citation={{
              id: selectedCitation.id,
              claim: selectedCitation.claim,
              confidence: selectedCitation.confidence,
              analyst: selectedCitation.analyst,
              reviewDate: new Date(selectedCitation.review_date).toLocaleDateString(),
              evidence: selectedCitation.evidence_summary?.map((e: any, idx: number) => ({
                id: `${selectedCitation.id}-evidence-${idx}`,
                type: e.type === 'webpage_content' ? 'web' : 
                      e.type === 'api_response' ? 'api' : 
                      e.type === 'deepsearch_finding' ? 'analysis' : 'document',
                title: e.title,
                source: e.source,
                excerpt: e.excerpt,
                url: e.url,
                metadata: {
                  confidence: selectedCitation.confidence
                }
              })) || [],
              reasoning: selectedCitation.reasoning,
              methodology: selectedCitation.methodology
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}