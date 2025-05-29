import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { ScanReportSection } from '@/components/reports/ScanReportNavigation'
import { FileText, Code, Shield, Users, Target, BarChart3, Building2, Wrench, ChevronRight, ExternalLink, Info, AlertTriangle, CheckCircle, TrendingUp, X } from 'lucide-react'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { Citation } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Home, Search } from 'lucide-react'
import { mockDemoReports, DemoStandardReport } from '@/lib/mock-demo-data'
import { ring4MockCitations } from '@/lib/ring4-mock-report-data'
import { cn } from '@/lib/utils'

export default function ViewReport() {
  const { id } = useParams<{ id: string }>()
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [activeSection, setActiveSection] = useState('executive-summary')

  // Get report based on URL parameter or default to Ring4
  const getReportFromId = (reportId: string | undefined): DemoStandardReport | null => {
    if (!reportId) return mockDemoReports['report-ring4-comprehensive']
    
    // Try exact match first
    const exactMatch = mockDemoReports[`report-${reportId}-comprehensive`]
    if (exactMatch) return exactMatch
    
    // Try finding by company name
    const reportByName = Object.values(mockDemoReports).find(report => 
      report.company_name.toLowerCase() === reportId.toLowerCase()
    )
    if (reportByName) return reportByName
    
    // Default to Ring4
    return mockDemoReports['report-ring4-comprehensive']
  }

  const currentReport = getReportFromId(id)

  // Get citations for current report
  const getCurrentCitations = () => {
    if (id === 'ring4') return ring4MockCitations
    return [] // Add other report citations as needed
  }

  const citations = getCurrentCitations()

  // Generate navigation sections from report data
  const getIconForSection = (title: string) => {
    const titleLower = title.toLowerCase()
    if (titleLower.includes('executive') || titleLower.includes('summary')) return <FileText className="h-4 w-4" />
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
      setSelectedCitation(citation)
    }
  }

  const handleCloseModal = () => {
    setSelectedCitation(null)
  }

  // Custom markdown components with citation handling
  const markdownComponents = {
    h1: ({ node, ...props }: any) => <h1 id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 scroll-mt-4" {...props} />,
    h2: ({ node, ...props }: any) => <h2 id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8 scroll-mt-4" {...props} />,
    h3: ({ node, ...props }: any) => <h3 id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6 scroll-mt-4" {...props} />,
    h4: ({ node, ...props }: any) => <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4" {...props} />,
    p: ({ node, ...props }: any) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
    ul: ({ node, ...props }: any) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
    ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
    li: ({ node, ...props }: any) => <li className="text-gray-700 dark:text-gray-300" {...props} />,
    strong: ({ node, ...props }: any) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
    em: ({ node, ...props }: any) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
    code: ({ node, inline, ...props }: any) => 
      inline ? (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
      ) : (
        <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto border" {...props} />
      ),
    pre: ({ node, ...props }: any) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-6 border" {...props} />,
    blockquote: ({ node, ...props }: any) => (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm leading-relaxed">
          <div {...props} />
        </AlertDescription>
      </Alert>
    ),
    hr: ({ node, ...props }: any) => <Separator className="my-8" {...props} />,
    a: ({ node, href, ...props }: any) => {
      // Handle citation links
      if (href?.startsWith('#cite-')) {
        const citationId = href.replace('#', '')
        return (
          <button
            onClick={() => handleCitationClick(citationId)}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 underline decoration-dotted hover:decoration-solid text-sm mx-0.5"
          >
            {props.children}
          </button>
        )
      }
      
      // Regular links
      return (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {props.children}
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    }
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { label: 'Reports', href: '/reports', icon: <FileText className="h-4 w-4" /> },
    { label: currentReport?.company_name || 'Report', icon: <Search className="h-4 w-4" /> }
  ]

  if (!currentReport) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
            <p className="text-gray-600 mb-4">The requested report could not be found.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
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
      
      if (!currentSection) return <div className="p-8 text-center text-gray-500">Section not found</div>
      
      return (
        <div className="p-8 max-w-4xl">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {getIconForSection(currentSection.title)}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {currentSection.title}
              </h1>
            </div>
            <Separator />
          </div>
          
          {/* Section Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {currentSection.content}
            </ReactMarkdown>
          </div>
          
          {/* Subsections */}
          {currentSection.subsections && currentSection.subsections.map((subsection, index) => (
            <Card key={index} className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {subsection.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {subsection.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }
    
    // Legacy object format (like Synergy)
    if (typeof currentReport.sections === 'object' && currentReport.sections) {
      const sectionData = (currentReport.sections as any)[activeSection]
      
      if (!sectionData) return <div className="p-8 text-center text-gray-500">Section not found</div>
      
      return (
        <div className="p-8 max-w-4xl">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {getIconForSection(sectionData.title)}
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {sectionData.title}
              </h1>
            </div>
            {sectionData.summary && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{sectionData.summary}</p>
            )}
            <Separator />
          </div>

          <div className="space-y-6">
            {/* Findings */}
            {sectionData.findings && sectionData.findings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Key Findings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sectionData.findings.map((finding: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-r">
                      <div className="flex items-center gap-2 mb-2">
                        {finding.category && (
                          <Badge variant="outline" className="text-xs">
                            {finding.category}
                          </Badge>
                        )}
                        {finding.severity && (
                          <Badge 
                            variant={finding.severity === 'critical' ? 'destructive' : 
                                    finding.severity === 'high' ? 'destructive' : 
                                    finding.severity === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {finding.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{finding.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Risks */}
            {sectionData.risks && sectionData.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sectionData.risks.map((risk: any, index: number) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-r">
                      <div className="flex items-center gap-2 mb-2">
                        {risk.severity && (
                          <Badge 
                            variant="destructive"
                            className="text-xs"
                          >
                            {risk.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{risk.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {sectionData.recommendations && sectionData.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sectionData.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-r">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{rec.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {sectionData.opportunities && sectionData.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Target className="h-5 w-5" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sectionData.opportunities.map((opp: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-r">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{opp.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )
    }
    
    return <div className="p-8 text-center text-gray-500">Unsupported report format</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <Breadcrumbs items={breadcrumbItems} />
          
          {/* Report Header */}
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {currentReport.company_name} Technical Assessment
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentReport.scan_type} • {new Date(currentReport.created_at || '').toLocaleDateString()}
              </p>
            </div>
            
            {/* Report Metrics */}
            <div className="flex items-center gap-4">
              {currentReport.tech_health_score && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{currentReport.tech_health_score}</div>
                  <div className="text-xs text-gray-500">Tech Score</div>
                </div>
              )}
              {currentReport.investment_score && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{currentReport.investment_score}</div>
                  <div className="text-xs text-gray-500">Investment Score</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-80 bg-white dark:bg-gray-800 border-r min-h-screen sticky top-0">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-6">Report Sections</h3>
            <div className="space-y-2">
              {dynamicSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all duration-200 group",
                    activeSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "transition-colors",
                        activeSection === section.id ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                      )}>
                        {section.icon}
                      </div>
                      <div>
                        <div className={cn(
                          "font-medium transition-colors",
                          activeSection === section.id ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"
                        )}>
                          {section.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {section.description}
                        </div>
                      </div>
                    </div>
                    {activeSection === section.id && (
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {renderSection()}
        </main>
      </div>

      {/* Citation Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Evidence Citation
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Claim</h4>
                <p className="text-gray-700 leading-relaxed">{selectedCitation.claim}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Citation Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Source:</strong> {selectedCitation.citation_text}</p>
                  {selectedCitation.citation_context && (
                    <p className="text-sm"><strong>Context:</strong> {selectedCitation.citation_context}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span><strong>Analyst:</strong> {selectedCitation.analyst}</span>
                    <span><strong>Confidence:</strong> {selectedCitation.confidence}%</span>
                    <span><strong>Date:</strong> {selectedCitation.review_date}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Analysis & Reasoning</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedCitation.reasoning}</p>
              </div>
              
              {selectedCitation.methodology && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Methodology</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedCitation.methodology}</p>
                  </div>
                </>
              )}
              
              {selectedCitation.evidence_summary && selectedCitation.evidence_summary.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Evidence Summary</h4>
                    <div className="space-y-3">
                      {selectedCitation.evidence_summary.map((evidence, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {evidence.type}
                            </Badge>
                            <h5 className="font-medium text-gray-900">{evidence.title}</h5>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{evidence.source}</p>
                          {evidence.excerpt && (
                            <p className="text-sm text-gray-700 italic">"{evidence.excerpt}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}