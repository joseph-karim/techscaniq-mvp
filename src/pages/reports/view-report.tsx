import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { ScanReportSection } from '@/components/reports/ScanReportNavigation'
import { FileText, Code, Shield, Users, Target, BarChart3, Building2, Wrench } from 'lucide-react'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { Citation } from '@/components/reports/EvidenceCitation'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Search } from 'lucide-react'
import { mockDemoReports, DemoStandardReport } from '@/lib/mock-demo-data'

// Note: Citations will be integrated in future version

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

  // Available reports for debugging: ring4, synergy, cloudnova, futuretech, inframodern

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

  const handleCloseModal = () => {
    setSelectedCitation(null)
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { label: 'Reports', href: '/reports', icon: <FileText className="h-4 w-4" /> },
    { label: currentReport?.company_name || 'Report', icon: <Search className="h-4 w-4" /> }
  ]

  if (!currentReport) {
    return <div>Report not found</div>
  }

  const renderSection = () => {
    // Check if sections is an array (new format) or object (legacy format)
    if (Array.isArray(currentReport.sections)) {
      // New format - render sections array (like Ring4)
      const currentSection = currentReport.sections.find(section => 
        section.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === activeSection
      )
      
      if (!currentSection) return <div>Section not found</div>
      
      return (
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{currentSection.title}</h2>
          </div>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
                code: ({ node, inline, ...props }: any) => 
                  inline ? (
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                  ) : (
                    <code className="block bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                  ),
                pre: ({ node, ...props }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r text-gray-700 dark:text-gray-300 mb-4" {...props} />,
                hr: ({ node, ...props }) => <hr className="border-gray-300 dark:border-gray-600 my-6" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
              }}
            >
              {currentSection.content}
            </ReactMarkdown>
          </div>
          
          {currentSection.subsections && currentSection.subsections.map((subsection, index) => (
            <Card key={index} className="mt-6">
              <CardHeader>
                <CardTitle>{subsection.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                      em: ({ node, ...props }) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
                      code: ({ node, inline, ...props }: any) => 
                        inline ? (
                          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                        ) : (
                          <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props} />
                        ),
                      pre: ({ node, ...props }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-3" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r text-gray-700 dark:text-gray-300 mb-3" {...props} />,
                      hr: ({ node, ...props }) => <hr className="border-gray-300 dark:border-gray-600 my-4" {...props} />,
                      a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
                    }}
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
      
      if (!sectionData) return <div>Section not found</div>
      
      return (
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">{sectionData.title}</h2>
            {sectionData.summary && (
              <p className="text-muted-foreground mb-6">{sectionData.summary}</p>
            )}
          </div>

          {/* Findings */}
          {sectionData.findings && sectionData.findings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Findings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sectionData.findings.map((finding: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-sm text-gray-700 dark:text-gray-300">{finding.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {sectionData.risks && sectionData.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sectionData.risks.map((risk: any, index: number) => (
                  <div key={index} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-r">
                    <div className="flex items-center gap-2 mb-1">
                      {risk.severity && (
                        <Badge 
                          variant={risk.severity === 'critical' ? 'destructive' : 'destructive'}
                          className="text-xs"
                        >
                          {risk.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{risk.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {sectionData.recommendations && sectionData.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sectionData.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-r">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{rec.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Opportunities */}
          {sectionData.opportunities && sectionData.opportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sectionData.opportunities.map((opp: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{opp.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )
    }
    
    return <div>Unsupported report format</div>
  }

  // Navigation handled by ScanReportNavigation component

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <div className="flex">
        <nav className="w-64 border-r bg-card p-4">
          <h3 className="font-semibold mb-4">Report Sections</h3>
          <div className="space-y-2">
            {dynamicSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-muted-foreground">{section.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-h-screen">
          {renderSection()}
        </main>
      </div>

      {selectedCitation && (
        <EvidenceModal
          isOpen={true}
          onClose={handleCloseModal}
          citation={selectedCitation}
        />
      )}
    </div>
  )
}