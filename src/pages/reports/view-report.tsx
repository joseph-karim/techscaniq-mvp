import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Calendar, Shield, CheckCircle, XCircle, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

// Mock Ring4 report data - using actual data from the database
const mockReport = {
  id: "54d36b34-190c-4085-b3ea-84017a3538bf",
  company_name: "Ring4",
  company_url: "https://ring4.com",
  report_type: "due_diligence",
  status: "completed",
  created_at: "2025-05-28T04:25:51.056085+00:00",
  updated_at: "2025-05-28T04:25:51.056085+00:00",
  investment_score: 65,
  tech_health_score: 6.5,
  tech_health_grade: "C",
  executive_summary: "Ring4 presents a promising but incompletely defined investment opportunity. While the available evidence suggests a solid technological foundation and a capable team, critical details regarding infrastructure, security protocols, and financial performance are lacking. A deeper dive is required to fully assess the scalability and long-term viability of the platform. The investment score reflects the potential, tempered by the need for further due diligence.",
  investment_rationale: "The investment score of 65 reflects a cautiously optimistic view. The technology appears sound, and the team seems competent. However, the lack of detailed information regarding infrastructure, security, and financials introduces significant risk. A higher score would require more concrete evidence of scalability, robust security measures, and a clear path to profitability. The market position needs further clarification to understand the competitive landscape and growth potential.",
  companyInfo: {
    name: "Ring4",
    website: "https://ring4.com",
    industry: "Business/Productivity Software",
    description: "Ring4 is a cloud-based phone system and communication platform that provides second phone numbers for business and personal use. The company operates in the VoIP industry, offering affordable and easy-to-use solutions for startups, SMBs, freelancers, and enterprises.",
    location: "United States"
  },
  technologyOverview: {
    primaryStack: [
      { category: "Platform", technologies: ["Cloud-based VoIP", "Mobile Applications"] },
      { category: "Communication", technologies: ["Voice over Internet Protocol (VoIP)", "SMS/Text Messaging"] },
      { category: "Infrastructure", technologies: ["Cloud Phone Systems", "Global Phone Number Provisioning"] }
    ],
    architectureHighlights: [
      "Provides phone numbers in multiple countries without physical offices",
      "BYOD (Bring Your Own Device) solution for businesses",
      "Integration with CRM systems and business tools",
      "Both iOS and Android mobile applications"
    ]
  },
  securityAssessment: {
    grade: "Unknown",
    score: 0,
    findings: [
      {
        severity: "medium",
        title: "Limited Security Information Available",
        description: "Security assessment could not be completed due to lack of detailed security information",
        recommendation: "Request detailed security audit and compliance certifications"
      }
    ],
    compliance: {
      gdpr: "Unknown",
      hipaa: "Unknown",
      soc2: "Unknown",
      iso27001: "Unknown"
    }
  },
  teamInformation: {
    totalSize: "Unknown",
    keyMembers: [
      {
        name: "Alex Botteri",
        role: "CEO & Co-Founder",
        experience: "Leading Ring4's vision and strategy",
        linkedIn: ""
      },
      {
        name: "Ferreol de Soras",
        role: "Co-Founder",
        experience: "Co-founded Ring4",
        linkedIn: ""
      },
      {
        name: "Trevor",
        role: "Managing Partner",
        experience: "Managing partner at Ring4",
        linkedIn: ""
      }
    ],
    openPositions: 0,
    techTeamSize: "Unknown"
  },
  fundingHistory: [
    {
      date: "2018",
      round: "Crowdfunding",
      amount: "$396K total raised",
      investors: ["284 investors via Republic", "Inturact Capital", "Leonis Investment"],
      valuation: "$6,000,000 (valuation cap)"
    },
    {
      date: "2017",
      round: "Angel",
      amount: "$225K",
      investors: ["Angel investors and funds"],
      valuation: "Not disclosed"
    }
  ],
  marketAnalysis: {
    marketSize: "VoIP market was over $30 billion in 2020",
    growthRate: "15% CAGR from 2021 to 2027",
    competitors: [
      { name: "OpenPhone", marketShare: "Unknown", strengths: ["Business phone system features"] },
      { name: "Google Voice", marketShare: "Unknown", strengths: ["Free tier", "Google integration"] },
      { name: "Dialpad", marketShare: "0.03%", strengths: ["AI features", "Enterprise focus"] },
      { name: "magicJack", marketShare: "Unknown", strengths: ["Low cost VoIP"] },
      { name: "Talk360", marketShare: "Unknown", strengths: ["International calling"] }
    ],
    targetMarket: "Startups, SMBs, freelancers, sales professionals, remote enterprises",
    differentiators: [
      "Second phone line without carrying two phones",
      "Global phone numbers in multiple countries",
      "BYOD trend solution for businesses",
      "Protection for personal phone numbers in sharing economy"
    ]
  },
  performanceMetrics: {
    revenue: {
      annual2019: "$262K",
      growth: "150% increase in 12 months after launch",
      recurring: "Unknown"
    },
    customers: {
      total: "700,000+ users worldwide (from company claims)",
      growth: "Unknown",
      churn: "Unknown"
    },
    usage: {
      activeUsers: "Unknown",
      engagement: "Sales per installation increased from $1.4 to $5.05",
      retention: "Unknown"
    }
  },
  infrastructureDetails: {
    hosting: "Cloud-based (provider unknown)",
    scalability: "Unknown",
    availability: "Unknown",
    performance: {
      averageResponseTime: "Unknown",
      uptime: "Unknown",
      errorRate: "Unknown"
    }
  },
  riskAssessment: {
    technical: [
      { risk: "Infrastructure details unknown", impact: "high", mitigation: "Request infrastructure audit" },
      { risk: "Security posture unclear", impact: "high", mitigation: "Conduct security assessment" },
      { risk: "Scalability limitations unknown", impact: "medium", mitigation: "Performance testing required" }
    ],
    business: [
      { risk: "Intense VoIP market competition", impact: "high", mitigation: "Clear differentiation strategy needed" },
      { risk: "Low market share (0.00%)", impact: "high", mitigation: "Growth strategy validation required" },
      { risk: "Limited financial transparency", impact: "medium", mitigation: "Request detailed financials" }
    ],
    compliance: [
      { risk: "Unknown compliance status", impact: "medium", mitigation: "Compliance audit required" }
    ]
  },
  recommendations: [
    {
      priority: "high",
      category: "Due Diligence",
      action: "Conduct comprehensive infrastructure and security audit",
      rationale: "Critical information gaps need to be filled before investment decision"
    },
    {
      priority: "high",
      category: "Financial",
      action: "Request detailed financial statements and unit economics",
      rationale: "Limited financial data makes valuation assessment difficult"
    },
    {
      priority: "medium",
      category: "Market",
      action: "Validate market differentiation and growth strategy",
      rationale: "Competitive market requires clear competitive advantages"
    },
    {
      priority: "medium",
      category: "Technical",
      action: "Assess platform scalability and technical debt",
      rationale: "Unknown infrastructure poses risks for growth"
    }
  ],
  appendices: {
    evidenceSummary: "8 evidence items collected including website analysis, security scan, team information, market analysis, and financial data from Google Search",
    dataQuality: "Medium - significant gaps in infrastructure, security details, and recent financial performance",
    analysisLimitations: [
      "No access to internal systems or documentation",
      "Limited public financial information",
      "Security assessment incomplete due to external scan limitations",
      "Infrastructure details completely unavailable"
    ]
  },
  scan_request_id: "fd363bb3-bafa-4bb7-86b6-b27bc7012747"
}

export default function ViewReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportData() {
      if (!id) {
        console.warn('No ID provided to ViewReportPage, falling back to mock data.');
        setReport(mockReport);
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMessage(null);

      try {
        // 1. Assume 'id' is a scan_request_id and try to fetch it
        const { data: scanRequestData, error: scanRequestError } = await supabase
          .from('scan_requests')
          .select('*, reports(*)') // Join with reports table
          .eq('id', id)
          .maybeSingle();

        if (scanRequestError) {
          console.error(`Error fetching scan_request ${id}:`, scanRequestError);
          // Do not fall back to mock data yet, try fetching as direct report ID
        }

        if (scanRequestData && scanRequestData.reports && scanRequestData.reports.length > 0) {
          console.log('Fetched report via scan_request for ID ', id, scanRequestData.reports[0]);
          setReport(scanRequestData.reports[0]);
        } else if (scanRequestData && (!scanRequestData.reports || scanRequestData.reports.length === 0)) {
          // Scan request found, but no linked report in the 'reports' table via join
          console.warn(`Scan request ${id} found, but no linked report. Checking report_id field: ${scanRequestData.report_id}`);
          if (scanRequestData.report_id) {
            const { data: directReport, error: directReportError } = await supabase
              .from('reports')
              .select('*')
              .eq('id', scanRequestData.report_id)
              .single();
            if (directReportError) {
              console.error(`Error fetching report by scan_request.report_id ${scanRequestData.report_id}:`, directReportError);
              setErrorMessage(`Failed to fetch report (Ref: SR-R). Scan ID: ${id}`);
            } else if (directReport) {
              console.log('Fetched report directly via scan_request.report_id for Scan ID ', id, directReport);
              setReport(directReport);
            } else {
               setErrorMessage(`Report not found for scan_request.report_id ${scanRequestData.report_id}. Scan ID: ${id}`);
            }
          } else {
            setErrorMessage(`Scan request ${id} found, but it has no associated report_id.`);
          }
        } else {
          // scanRequestData is null, meaning 'id' was not a scan_request_id. Try as direct report_id.
          console.log(`ID ${id} is not a scan_request_id. Attempting to fetch as direct report_id from 'reports' table.`);
          const { data: directReport, error: directReportError } = await supabase
            .from('reports')
            .select('*')
            .eq('id', id)
            .single();

          if (directReportError) {
            console.error(`Error fetching direct report ${id}:`, directReportError);
            setErrorMessage(`Failed to fetch report (Ref: DR). Report ID: ${id}`);
          } else if (directReport) {
            console.log('Fetched report directly for ID ', id, directReport);
            setReport(directReport);
          } else {
            setErrorMessage(`Report not found with ID ${id}.`);
          }
        }

      } catch (error) {
        console.error('Unexpected error in fetchReportData:', error);
        setErrorMessage('An unexpected error occurred while fetching the report.');
      } finally {
        setLoading(false);
        // Only use mock data as an absolute last resort if no report and no specific error message set
        if (!report && !errorMessage) { 
          console.warn('All fetch attempts failed for ID ', id, ', falling back to mock data.');
          setReport(mockReport);
        } else if (!report && errorMessage) {
           console.log('Displaying error message instead of mock report: ', errorMessage);
        }
      }
    }
    
    fetchReportData();
  }, [id]); // Simplified dependency array for now, can add back report/errorMessage if needed for specific re-fetch logic

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (errorMessage && !report) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Report Not Available</h2>
        <p className="text-muted-foreground mb-6">{errorMessage}</p>
        <Button onClick={() => navigate('/reports')}>Back to Reports List</Button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Report not found</p>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { color: 'default' as const, text: 'Strong Buy' }
    if (score >= 70) return { color: 'default' as const, text: 'Buy' }
    if (score >= 60) return { color: 'secondary' as const, text: 'Hold' }
    if (score >= 50) return { color: 'secondary' as const, text: 'Caution' }
    return { color: 'destructive' as const, text: 'Pass' }
  }

  const scoreBadge = getScoreBadge(report.investment_score)
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/reports')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{report.company_name}</h1>
              <p className="text-muted-foreground">{report.company_url}</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(report.investment_score)}`}>
                {report.investment_score}
              </div>
              <Badge variant={scoreBadge.color} className="mt-2">
                {scoreBadge.text}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{report.investor_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{report.assessment_context}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(report.created_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Executive Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{report.executive_summary}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Investment Rationale
                </h3>
                <p className="text-sm">{report.investment_rationale}</p>
      </div>
      
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Investment Score
                </h3>
                <div className={`text-5xl font-bold ${getScoreColor(report.investment_score)}`}>
                  {report.investment_score}
                </div>
                <Badge variant={scoreBadge.color} className="mt-2">
                  {scoreBadge.text}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="technology" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
            <TabsTrigger value="technology">Technology</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="diligence">Due Diligence</TabsTrigger>
          </TabsList>
          
          <TabsContent value="technology" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
                <CardDescription>Overview of the technical architecture and infrastructure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Primary Stack</h4>
                    <ul className="space-y-2">
                      {report.technologyOverview.primaryStack.map((stack: any, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>{stack.category}: {stack.technologies.join(', ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Architecture Highlights</h4>
                    <ul className="space-y-2">
                      {report.technologyOverview.architectureHighlights.map((highlight: string, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Analysis</CardTitle>
                <CardDescription>Market opportunity and competitive positioning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Market Opportunity</h4>
                    <div className="space-y-3">
                    <div>
                        <p className="text-sm text-muted-foreground">Market Size</p>
                        <p className="text-lg font-semibold">{report.marketAnalysis.marketSize}</p>
                    </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Market Growth Rate</p>
                        <p className="text-lg font-semibold">{report.marketAnalysis.growthRate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Competitive Landscape</h4>
                    <p className="text-sm text-muted-foreground mb-3">{report.marketAnalysis.competitors[0].name}</p>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Key Differentiators</h5>
                        <ul className="space-y-1">
                          {report.marketAnalysis.differentiators.map((diff: string, index: number) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                              <span>{diff}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Competitor Comparison</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Company</th>
                          <th className="text-left py-2">Market Share</th>
                          <th className="text-left py-2">Strengths</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.marketAnalysis.competitors.map((competitor: any, index: number) => (
                          <tr key={index} className={index === 0 ? 'font-semibold bg-muted/50' : ''}>
                            <td className="py-2">{competitor.name}</td>
                            <td className="py-2">{competitor.marketShare}</td>
                            <td className="py-2">{competitor.strengths.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team" className="space-y-6">
            <Card>
                  <CardHeader>
                <CardTitle>Team Assessment</CardTitle>
                <CardDescription>Leadership team and organizational strength</CardDescription>
                  </CardHeader>
                  <CardContent>
                <p className="mb-6">{report.teamInformation.teamStrength}</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Key Members</h4>
                    <div className="grid gap-4">
                      {report.teamInformation.keyMembers.map((member: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-semibold">{member.name}</h5>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{member.experience}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Growth & Culture</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Hiring Velocity</p>
                        <p className="font-semibold">{report.teamInformation.hiringVelocity || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Cultural Factors</p>
                        <div className="flex flex-wrap gap-2">
                          {(report.teamInformation.culturalFactors || []).map((factor: string, index: number) => (
                            <Badge key={index} variant="outline">{factor}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                    </div>
                  </CardContent>
                </Card>
          </TabsContent>
          
          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Indicators</CardTitle>
                <CardDescription>Revenue metrics and funding history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Revenue Indicators</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Annual Revenue 2019</span>
                        <span className="font-semibold">{report.performanceMetrics.revenue.annual2019}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Growth</span>
                        <span className="font-semibold">{report.performanceMetrics.revenue.growth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Recurring Revenue</span>
                        <span className="font-semibold">{report.performanceMetrics.revenue.recurring}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Funding History</h4>
                    <div className="space-y-2">
                      {report.fundingHistory.map((round: any, index: number) => (
                        <div key={index} className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{round.date}</Badge>
                            <Badge variant="secondary">{round.round}</Badge>
                          </div>
                          <p className="text-muted-foreground">{round.amount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="diligence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Due Diligence Flags</CardTitle>
                <CardDescription>Key considerations for investment decision</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Investment Score
                    </h4>
                    <div className={`text-5xl font-bold ${getScoreColor(report.investment_score)}`}>
                      {report.investment_score}
                    </div>
                    <Badge variant={scoreBadge.color} className="mt-2">
                      {scoreBadge.text}
                        </Badge>
                      </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Tech Health Score
                    </h4>
                    <div className={`text-5xl font-bold ${getScoreColor(report.tech_health_score * 10)}`}>
                      {report.tech_health_score}
                    </div>
                    <Badge variant={getScoreBadge(report.tech_health_score * 10).color} className="mt-2">
                      {getScoreBadge(report.tech_health_score * 10).text}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Tech Health Grade
                    </h4>
                    <Badge variant={getScoreBadge(report.tech_health_score * 10).color} className="mt-2">
                      {report.tech_health_grade}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          
              <Card>
                <CardHeader>
                <CardTitle>Recommended Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                <ul className="space-y-2">
                  {report.recommendations.map((recommendation: any, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600">→</span>
                      <span className="text-sm">{recommendation.action}</span>
                    </li>
                      ))}
                    </ul>
                </CardContent>
              </Card>
          
            <Card>
              <CardHeader>
                <CardTitle>Technical Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="font-semibold">{report.infrastructureDetails.performance.uptime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">API Response Time</p>
                    <p className="font-semibold">{report.infrastructureDetails.performance.averageResponseTime}</p>
                </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="font-semibold">{report.infrastructureDetails.performance.errorRate}</p>
                        </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <p className="font-semibold">{report.infrastructureDetails.availability}</p>
                      </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 