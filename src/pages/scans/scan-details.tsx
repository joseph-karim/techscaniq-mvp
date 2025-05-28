import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Building2, Calendar, TrendingUp, Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

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

  useEffect(() => {
    async function fetchReport() {
      if (!id) return

      try {
        // First try to fetch by scan_request_id
        const { data } = await supabase
          .from('scan_reports')
          .select('*')
          .eq('scan_request_id', id)
          .maybeSingle()

        if (data) {
          setReport(data)
        } else {
          // If not found, try by report id directly
          const { data: reportData } = await supabase
            .from('scan_reports')
            .select('*')
            .eq('id', id)
            .maybeSingle()
          
          if (reportData) {
            setReport(reportData)
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

    fetchReport()
  }, [id, toast])

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
                  {report.report_data?.executiveSummary?.keyFindings?.map((finding, i) => (
                    <li key={i} className="text-sm">{finding}</li>
                  ))}
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
                    {report.report_data.securityAssessment.vulnerabilities.map((vuln: any, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <span className="text-sm">{vuln}</span>
                      </li>
                    ))}
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
    </div>
  )
}