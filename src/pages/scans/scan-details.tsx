import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Building2, Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { InlineCitation, Citation } from '@/components/reports/EvidenceCitation'
import { Evidence } from '@/components/reports/EvidenceCitation'
import { formatDate } from '@/lib/utils'
import { mockDemoScanRequests, mockDemoReports, mockEvidenceItems } from '@/lib/mock-demo-data'

interface ScanReport {
  id: string
  company_name: string
  website_url: string
  report_type: string
  report_data: {
    executiveSummary: {
      investmentScore: number
      overallAssessment: string
      keyFindings: string[]
      criticalIssues: string[]
    }
    companyOverview: {
      description: string
      teamSize: string
      foundingYear: string
      keyProducts: string[]
      businessModel: string
    }
    technologyStack: {
      frontend: string[]
      backend: string[]
      infrastructure: string[]
      databases: string[]
      aiTools: string[]
    }
    architectureAnalysis: {
      systemDesign: string
      scalability: string
      security: string
      codeQuality: string
    }
    securityAssessment: {
      overallScore: number
      vulnerabilities: any[]
      compliance: string[]
      recommendations: string[]
    }
    performanceMetrics: {
      loadTime: string
      uptime: string
      scalability: string
      optimization: string
    }
    teamCapabilities: {
      teamSize: string
      expertise: string[]
      gaps: string[]
      culture: string
    }
    marketPosition: {
      competitors: string[]
      differentiation: string
      marketSize: string
      growthPotential: string
    }
    financialIndicators: {
      revenueModel: string
      fundingHistory: string
      burnRate: string
      profitability: string
    }
    recommendations: {
      investmentDecision: string
      keyStrengths: string[]
      concerns: string[]
      nextSteps: string[]
    }
  }
  created_at: string
  scan_request_id?: string
}

export default function ScanDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<ScanReport | null>(null)
  const [citations, setCitations] = useState<Citation[]>([])
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)

  useEffect(() => {
    async function fetchReport() {
      if (!id) return
      setLoading(true); // Ensure loading is true at the start

      // Check if this is a mock scan first
      const mockScan = mockDemoScanRequests.find(scan => scan.id === id)
      if (mockScan && mockScan.mock_report_id) {
        const mockReport = mockDemoReports[mockScan.mock_report_id]
        if (mockReport) {
          // Transform DemoStandardReport to ScanReport format
          const transformedReport: ScanReport = {
            id: mockReport.id,
            company_name: mockReport.company_name,
            website_url: mockReport.website_url,
            report_type: mockReport.report_type || 'standard',
            created_at: mockReport.created_at || new Date().toISOString(),
            scan_request_id: mockReport.scan_request_id,
            report_data: {
              executiveSummary: {
                investmentScore: mockReport.investment_score,
                overallAssessment: mockReport.executive_summary,
                keyFindings: [],
                criticalIssues: []
              },
              companyOverview: {
                description: mockReport.executive_summary,
                teamSize: 'N/A',
                foundingYear: 'N/A',
                keyProducts: [],
                businessModel: 'N/A'
              },
              technologyStack: {
                frontend: [],
                backend: [],
                infrastructure: [],
                databases: [],
                aiTools: []
              },
              architectureAnalysis: {
                systemDesign: 'N/A',
                scalability: 'N/A',
                security: 'N/A',
                codeQuality: 'N/A'
              },
              securityAssessment: {
                overallScore: mockReport.tech_health_score,
                vulnerabilities: [],
                compliance: [],
                recommendations: []
              },
              performanceMetrics: {
                loadTime: 'N/A',
                uptime: 'N/A',
                scalability: 'N/A',
                optimization: 'N/A'
              },
              teamCapabilities: {
                teamSize: 'N/A',
                expertise: [],
                gaps: [],
                culture: 'N/A'
              },
              marketPosition: {
                competitors: [],
                differentiation: 'N/A',
                marketSize: 'N/A',
                growthPotential: 'N/A'
              },
              financialIndicators: {
                revenueModel: 'N/A',
                fundingHistory: 'N/A',
                burnRate: 'N/A',
                profitability: 'N/A'
              },
              recommendations: {
                investmentDecision: mockReport.investment_rationale || 'N/A',
                keyStrengths: [],
                concerns: [],
                nextSteps: []
              }
            }
          }

          // Extract data from sections
          Object.entries(mockReport.sections).forEach(([key, section]) => {
            if (key === 'companyInfo' && section.findings) {
              section.findings.forEach(finding => {
                if (finding.text.includes('Founded:')) {
                  transformedReport.report_data.companyOverview.foundingYear = finding.text.split(': ')[1]
                } else if (finding.text.includes('Employee Count:')) {
                  transformedReport.report_data.companyOverview.teamSize = finding.text.split(': ')[1]
                } else if (finding.text.includes('Description:')) {
                  transformedReport.report_data.companyOverview.description = finding.text.split(': ')[1]
                }
              })
            } else if (key === 'technologyOverview' && section.findings) {
              section.findings.forEach(finding => {
                if (finding.text.includes('Frontend')) {
                  transformedReport.report_data.technologyStack.frontend.push(finding.text.split(': ')[1] || finding.text)
                } else if (finding.text.includes('Backend')) {
                  transformedReport.report_data.technologyStack.backend.push(finding.text.split(': ')[1] || finding.text)
                }
              })
            } else if (key === 'securityAssessment') {
              if (section.findings) {
                transformedReport.report_data.executiveSummary.keyFindings = section.findings.map(f => f.text)
              }
              if (section.risks) {
                transformedReport.report_data.securityAssessment.vulnerabilities = section.risks.map(r => r.text)
              }
              if (section.recommendations) {
                transformedReport.report_data.securityAssessment.recommendations = section.recommendations.map(r => r.text)
              }
            } else if (key === 'teamAnalysis' && section.findings) {
              section.findings.forEach(finding => {
                if (finding.text.includes('Team Size:')) {
                  transformedReport.report_data.teamCapabilities.teamSize = finding.text.split(': ')[1]
                } else if (finding.text.includes('Culture Values:')) {
                  transformedReport.report_data.teamCapabilities.culture = finding.text.split(': ')[1]
                }
              })
            } else if (key === 'marketAnalysis' && section.findings) {
              section.findings.forEach(finding => {
                if (finding.text.includes('Market Size:')) {
                  transformedReport.report_data.marketPosition.marketSize = finding.text.split(': ')[1]
                } else if (finding.text.includes('Growth Rate:')) {
                  transformedReport.report_data.marketPosition.growthPotential = finding.text.split(': ')[1]
                } else if (finding.text.includes('Differentiators:')) {
                  transformedReport.report_data.marketPosition.differentiation = finding.text.split(': ')[1]
                } else if (finding.text.includes('Competitor')) {
                  transformedReport.report_data.marketPosition.competitors.push(finding.text)
                }
              })
            } else if (key === 'financialHealth' && section.findings) {
              section.findings.forEach(finding => {
                if (finding.text.includes('Revenue:')) {
                  transformedReport.report_data.financialIndicators.revenueModel = finding.text
                } else if (finding.text.includes('Burn Rate:')) {
                  transformedReport.report_data.financialIndicators.burnRate = finding.text.split(': ')[1]
                } else if (finding.text.includes('Funding History:')) {
                  transformedReport.report_data.financialIndicators.fundingHistory = finding.text.split(': ')[1]
                }
              })
            } else if (key === 'investmentRecommendation' && section.findings) {
              section.findings.forEach(finding => {
                if (finding.text.includes('Key Strengths:')) {
                  transformedReport.report_data.recommendations.keyStrengths.push(finding.text.split(': ')[1])
                } else if (finding.text.includes('Key Risks:')) {
                  transformedReport.report_data.recommendations.concerns.push(finding.text.split(': ')[1])
                } else if (finding.text.includes('Next Steps:')) {
                  transformedReport.report_data.recommendations.nextSteps.push(finding.text.split(': ')[1])
                }
              })
            } else {
              // For other sections, try to extract key findings
              if (section.findings) {
                transformedReport.report_data.executiveSummary.keyFindings.push(
                  ...section.findings.map(f => f.text)
                )
              }
            }
          })

          setReport(transformedReport)
          
          // Transform mock citations to match Citation interface
          if (mockReport.citations && mockReport.citations.length > 0) {
            const transformedCitations: Citation[] = mockReport.citations.map(c => {
              // Find the corresponding evidence item from mockEvidenceItems
              const evidenceItem = mockEvidenceItems.find(e => e._original_crypto_id === c.evidence_item_id)
              
              let evidencePieces: Evidence[] = []
              if (evidenceItem) {
                evidencePieces = [{
                  id: evidenceItem.id,
                  type: mapEvidenceType(evidenceItem.type),
                  title: evidenceItem.content_summary.substring(0, 50) + '...',
                  source: evidenceItem.source_tool || 'Unknown Source',
                  url: evidenceItem.source_url || '',
                  excerpt: evidenceItem.content_summary,
                  metadata: {
                    confidence: 85 // Default confidence for mock data
                  }
                }]
              }
              
              return {
                id: `citation-${c.citation_number}`,
                claim_id_from_db: c.claim_id,
                claim: c.citation_text,
                evidence: evidencePieces,
                reasoning: c.citation_context || '',
                confidence: 85, // Default confidence
                analyst: 'TechScan AI',
                reviewDate: mockReport.created_at || new Date().toISOString(),
                methodology: 'AI-powered analysis with multi-source verification'
              }
            })
            setCitations(transformedCitations)
          }
          
          setLoading(false)
          return
        }
      }

      try {
        // Attempt to fetch scan_request first, as `id` is likely scan_request_id
        const { data: scanRequestData, error: scanRequestError } = await supabase
          .from('scan_requests')
          .select('*, reports(*)') // Fetch related report directly if linked
          .eq('id', id)
          .maybeSingle()

        if (scanRequestError) {
          console.error('Error fetching scan request:', scanRequestError)
          // Continue to try fetching as a direct report ID as a fallback
        }

        if (scanRequestData) {
          console.log('Fetched scan_request:', scanRequestData);
          // If scan_request has a linked report (either via join or report_id field)
          let finalReportData = null;
          if (scanRequestData.reports) { // data from join reports(*)
            finalReportData = {
              ...scanRequestData, // include scan_request fields
              ...scanRequestData.reports, // spread joined report data
              report_data: scanRequestData.reports.report_data, // ensure report_data is from the report
              id: scanRequestData.reports.id, // ensure id is the report's id
              scan_request_id: scanRequestData.id // keep scan_request_id for reference
            }
            // The scan_reports table might be deprecated, this structure assumes scan_requests
            // and reports are the source of truth.
          } else if (scanRequestData.report_id) {
             const { data: reportById, error: reportByIdError } = await supabase
              .from('reports')
              .select('*')
              .eq('id', scanRequestData.report_id)
              .single();
            
            if (reportByIdError) {
              console.error(`Error fetching report by id ${scanRequestData.report_id}:`, reportByIdError);
            } else if (reportById) {
              finalReportData = {
                ...scanRequestData, // include scan_request fields
                ...reportById, // spread fetched report data
                id: reportById.id, // ensure id is the report's id
                scan_request_id: scanRequestData.id // keep scan_request_id
              };
            }
          }

          if (finalReportData) {
            setReport(finalReportData as ScanReport); // Type assertion
            fetchCitations(finalReportData.id);
          } else {
            // No direct report found via scan_request, and scan_request itself might have been found or not.
            // If scanRequestData was found but had no report, it means linking failed or report is pending.
            // If scanRequestData was NOT found, then 'id' is not a scan_request_id.
            // In either of these cases, try treating 'id' as a direct report_id on the main 'reports' table.
            console.warn(`Scan request ${id} processed, but no final report data was constructed directly from it. Attempting to fetch report by ID ${id} from 'reports' table.`);
            const { data: directReportData, error: directReportError } = await supabase
              .from('reports') 
              .select('*')
              .eq('id', id)
              .maybeSingle();
            
            if (directReportData) {
              setReport(directReportData as ScanReport);
              fetchCitations(directReportData.id);
            } else {
              console.error('All attempts to fetch report failed for id:', id, scanRequestError, directReportError);
              toast({ title: "Error", description: "Report not found.", variant: "destructive" });
            }
          }
        } else {
          // scanRequestData is null, so `id` was not a scan_request_id. Try `id` as a direct report_id on 'reports' table.
          console.log(`No scan_request found for ID ${id}. Trying ID as direct report ID on 'reports' table.`);
          const { data: directReportData, error: directReportError } = await supabase
            .from('reports') 
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (directReportData) {
            setReport(directReportData as ScanReport);
            fetchCitations(directReportData.id);
          } else {
            console.error('All attempts to fetch report failed for id:', id, directReportError);
            toast({ title: "Error", description: "Report not found.", variant: "destructive" });
          }
        }
      } catch (error) {
        console.error('Error fetching report:', error)
        toast({
          title: "Error",
          description: "Failed to load report",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    async function fetchCitations(reportId: string) {
      try {
        const { data: citationData } = await supabase
          .from('report_citations')
          .select(`
            *,
            evidence_items (*)
          `)
          .eq('report_id', reportId)

        if (citationData) {
          // Transform citation data to match Citation interface
          const transformedCitations: Citation[] = citationData.map(c => {
            const evidenceItem = c.evidence_items; // This is the joined evidence_items record
            let evidencePieces: any[] = [];

            if (evidenceItem) {
              evidencePieces = [{
                id: evidenceItem.id, // This is the PK of the evidence_items table row
                type: evidenceItem.type || 'web',
                title: evidenceItem.content_data?.summary || 
                       (evidenceItem.content_data?.raw ? evidenceItem.content_data.raw.substring(0, 100) + '...' : 'Evidence Detail'),
                source: evidenceItem.source_data?.tool || evidenceItem.source_data?.url || 'Unknown Source',
                url: evidenceItem.source_data?.url || '',
                excerpt: evidenceItem.content_data?.summary || evidenceItem.content_data?.raw || 'No excerpt available.',
                metadata: {
                  confidence: c.confidence_score ? c.confidence_score * 100 : 0,
                  ...(evidenceItem.metadata || {})
                }
              }];
            }
            
            return {
              id: c.id, // Use the report_citations primary key as the unique ID for the citation itself
              claim_id_from_db: c.claim_id, // Keep original claim_id if needed for other logic
              claim: c.citation_text,
              evidence: evidencePieces,
              reasoning: c.citation_context || '',
              confidence: c.confidence_score ? c.confidence_score * 100 : 0,
              analyst: 'TechScan AI',
              reviewDate: c.created_at || new Date().toISOString(), // Use citation creation date if available
              methodology: 'AI-powered analysis'
            }
          })
          setCitations(transformedCitations)
        }
      } catch (error) {
        console.error('Error fetching citations:', error)
      }
    }

    fetchReport()
  }, [id, toast])

  const handleCitationClick = (citation: Citation) => {
    setActiveCitation(citation)
    setEvidenceModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  const investmentScore = report.report_data?.executiveSummary?.investmentScore || 0
  const scoreColor = investmentScore >= 70 ? 'text-green-600' : investmentScore >= 40 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mt-2">{report.company_name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {report.website_url}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(report.created_at)}
            </span>
            <Badge variant="outline">
              {report.report_type}
            </Badge>
          </div>
        </div>
        
        {/* View Full Report button for enhanced reports */}
        {report.company_name === 'Ring4' && (
          <Button 
            onClick={() => navigate('/reports/report-ring4-comprehensive')}
            className="ml-4"
            size="lg"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Full Professional Report
          </Button>
        )}
      </div>

      {/* Investment Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Score</CardTitle>
          <CardDescription>AI-powered investment assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-8 w-8 ${scoreColor}`} />
                <span className={`text-5xl font-bold ${scoreColor}`}>
                  {investmentScore}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {report.report_data?.executiveSummary?.overallAssessment || 'Overall assessment not available'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Investment Decision</p>
              <p className="text-lg font-bold">
                {report.report_data?.recommendations?.investmentDecision || 'Pending'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Findings */}
              <div>
                <h3 className="font-semibold mb-2">Key Findings</h3>
                <ul className="list-disc list-inside space-y-1">
                  {report.report_data?.executiveSummary?.keyFindings?.map((finding, i) => {
                    // Check if we have a citation for this finding
                    const citation = citations.find(c => 
                      c.claim.toLowerCase().includes(finding.toLowerCase().slice(0, 30)) ||
                      finding.toLowerCase().includes(c.claim.toLowerCase().slice(0, 30))
                    )
                    
                    return (
                      <li key={i} className="text-sm">
                        {citation ? (
                          <InlineCitation
                            citationId={citation.id}
                            citation={citation}
                            onCitationClick={handleCitationClick}
                          >
                            {finding}
                          </InlineCitation>
                        ) : (
                          finding
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Critical Issues */}
              {report.report_data?.executiveSummary?.criticalIssues?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <h4 className="font-semibold mb-1">Critical Issues</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {report.report_data.executiveSummary.criticalIssues.map((issue, i) => (
                        <li key={i} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Company Overview */}
              <div>
                <h3 className="font-semibold mb-2">Company Overview</h3>
                <p className="text-sm text-muted-foreground">
                  {report.report_data?.companyOverview?.description}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm font-medium">Founded</p>
                    <p className="text-sm text-muted-foreground">{report.report_data?.companyOverview?.foundingYear || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Team Size</p>
                    <p className="text-sm text-muted-foreground">{report.report_data?.companyOverview?.teamSize || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Frontend</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.report_data?.technologyStack?.frontend?.map((tech, i) => (
                      <Badge key={i} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Backend</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.report_data?.technologyStack?.backend?.map((tech, i) => (
                      <Badge key={i} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Infrastructure</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.report_data?.technologyStack?.infrastructure?.map((tech, i) => (
                      <Badge key={i} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Databases</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.report_data?.technologyStack?.databases?.map((tech, i) => (
                      <Badge key={i} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Architecture Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">System Design</h4>
                <p className="text-sm text-muted-foreground">{report.report_data?.architectureAnalysis?.systemDesign}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Scalability</h4>
                <p className="text-sm text-muted-foreground">{report.report_data?.architectureAnalysis?.scalability}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Code Quality</h4>
                <p className="text-sm text-muted-foreground">{report.report_data?.architectureAnalysis?.codeQuality}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Assessment
                </span>
                <Badge variant={report.report_data?.securityAssessment?.overallScore >= 70 ? "default" : "destructive"}>
                  Score: {report.report_data?.securityAssessment?.overallScore || 0}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Vulnerabilities</h4>
                {report.report_data?.securityAssessment?.vulnerabilities?.length > 0 ? (
                  <ul className="space-y-2">
                    {report.report_data.securityAssessment.vulnerabilities.map((vuln: any, i: number) => {
                      // Check if we have a citation for this vulnerability
                      const vulnText = typeof vuln === 'string' ? vuln : vuln.description || ''
                      const citation = citations.find(c => 
                        c.claim.toLowerCase().includes(vulnText.toLowerCase().slice(0, 30)) ||
                        vulnText.toLowerCase().includes(c.claim.toLowerCase().slice(0, 30))
                      )
                      
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <span className="text-sm">{vulnText}</span>
                            {citation && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="ml-2 gap-1 text-xs"
                                onClick={() => handleCitationClick(citation)}
                              >
                                <FileText className="h-3 w-3" />
                                View Evidence
                              </Button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No critical vulnerabilities detected</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Compliance</h4>
                <div className="flex flex-wrap gap-2">
                  {report.report_data?.securityAssessment?.compliance?.map((comp, i) => (
                    <Badge key={i} variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1">
                  {report.report_data?.securityAssessment?.recommendations?.map((rec, i) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Team Size</h4>
                  <p className="text-sm text-muted-foreground">{report.report_data?.teamCapabilities?.teamSize}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Culture</h4>
                  <p className="text-sm text-muted-foreground">{report.report_data?.teamCapabilities?.culture}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Expertise Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {report.report_data?.teamCapabilities?.expertise?.map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              {report.report_data?.teamCapabilities?.gaps?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Identified Gaps</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {report.report_data.teamCapabilities.gaps.map((gap, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Market Size</h4>
                <p className="text-sm text-muted-foreground">{report.report_data?.marketPosition?.marketSize}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Growth Potential</h4>
                <p className="text-sm text-muted-foreground">{report.report_data?.marketPosition?.growthPotential}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Differentiation</h4>
                <p className="text-sm text-muted-foreground">{report.report_data?.marketPosition?.differentiation}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Key Competitors</h4>
                <div className="flex flex-wrap gap-2">
                  {report.report_data?.marketPosition?.competitors?.map((comp, i) => (
                    <Badge key={i} variant="outline">{comp}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Revenue Model</h4>
                  <p className="text-sm text-muted-foreground">{report.report_data?.financialIndicators?.revenueModel || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Funding History</h4>
                  <p className="text-sm text-muted-foreground">{report.report_data?.financialIndicators?.fundingHistory || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Burn Rate</h4>
                  <p className="text-sm text-muted-foreground">{report.report_data?.financialIndicators?.burnRate || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Profitability</h4>
                  <p className="text-sm text-muted-foreground">{report.report_data?.financialIndicators?.profitability || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <h4 className="font-semibold mb-1">Investment Decision</h4>
                  <p>{report.report_data?.recommendations?.investmentDecision}</p>
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-2">Key Strengths</h4>
                <ul className="space-y-2">
                  {report.report_data?.recommendations?.keyStrengths?.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Concerns</h4>
                <ul className="space-y-2">
                  {report.report_data?.recommendations?.concerns?.map((concern, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Next Steps</h4>
                <ul className="list-disc list-inside space-y-1">
                  {report.report_data?.recommendations?.nextSteps?.map((step, i) => (
                    <li key={i} className="text-sm">{step}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evidence Modal */}
      {activeCitation && (
        <EvidenceModal
          isOpen={evidenceModalOpen}
          onClose={() => setEvidenceModalOpen(false)}
          citation={activeCitation}
        />
      )}
    </div>
  )
}

// Helper function to map evidence types
function mapEvidenceType(type: string): Evidence['type'] {
  const typeMap: Record<string, Evidence['type']> = {
    'code_analysis': 'code',
    'code_review': 'code',
    'dependency_scan': 'code',
    'vulnerability_report': 'code',
    'compliance_document': 'document',
    'security_assessment': 'document',
    'infrastructure_scan': 'database',
    'infrastructure_assessment': 'database',
    'cloud_migration_analysis': 'analysis',
    'cost_analysis': 'analysis',
    'cost_projection': 'analysis',
    'architecture_review': 'analysis',
    'architecture_diagram': 'document',
    'cicd_analysis': 'analysis',
    'deployment_metrics': 'database',
    'code_quality_report': 'code',
    'team_survey': 'interview',
    'open_source_analysis': 'web',
    'culture_assessment': 'interview',
    'market_research': 'document',
    'customer_analysis': 'database',
    'customer_satisfaction': 'interview',
    'ai_model_analysis': 'analysis',
    'customer_deployment': 'database',
    'model_performance': 'analysis',
    'infrastructure_gap': 'analysis',
    'scalability_test_result': 'analysis',
    'market_research_report': 'document'
  }
  return typeMap[type] || 'document'
}