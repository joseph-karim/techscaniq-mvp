import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Calendar, Shield, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Mock Ring4 report data
const mockReport = {
  id: "ecff380a-67a5-40c9-acd3-88946773a6e9",
  company_name: "Ring4",
  website_url: "https://ring4.com",
  report_type: "deep-dive",
  investor_name: "Demo Capital Ventures",
  assessment_context: "Series B Investment",
  created_at: "2025-05-28T03:33:38.951151+00:00",
  scan_request_id: "f54e43c6-bcde-44e4-b40d-4d50d9d1d0df",
  report_data: {
    executiveSummary: {
      overallAssessment: "Ring4 presents a strong investment opportunity in the business communications space with proven market traction, solid technology foundation, and significant growth potential. The company has demonstrated product-market fit with over 700,000 users worldwide and shows promising indicators for scalability.",
      investmentScore: 75,
      keyFindings: [
        "700,000+ active users across 190 countries with strong organic growth",
        "Modern cloud-native architecture built on reliable infrastructure (AWS, Twilio)",
        "Competitive pricing model targeting underserved SMB and startup segments",
        "Strong security posture with SOC2 compliance and enterprise-grade features",
        "Experienced team with telecom and SaaS backgrounds"
      ],
      criticalRisks: [
        "Highly competitive market with established players (RingCentral, 8x8)",
        "Dependence on third-party infrastructure providers",
        "Customer acquisition costs may increase as market matures",
        "Limited differentiation in core feature set"
      ]
    },
    technologyAssessment: {
      architectureStrengths: [
        "Microservices architecture enabling independent scaling",
        "Multi-region deployment for low latency globally",
        "Real-time synchronization across devices",
        "API-first design supporting third-party integrations"
      ],
      stackOverview: {
        backend: ["Node.js", "Express", "PostgreSQL", "Redis"],
        frontend: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
        infrastructure: ["AWS", "CloudFront", "Docker", "Kubernetes"],
        monitoring: ["New Relic", "Sentry", "DataDog"],
        communications: ["Twilio", "WebRTC", "SIP Protocol"]
      },
      scalabilityAnalysis: {
        currentCapacity: "Supporting 700K users with 99.95% uptime",
        growthReadiness: "Architecture can handle 10x growth with minimal changes",
        recommendedImprovements: [
          "Implement read replicas",
          "Add caching layer",
          "Optimize WebSocket connections"
        ],
        bottlenecks: [
          "Database connection pooling",
          "Real-time event processing"
        ]
      },
      technicalDebt: [
        "Legacy mobile apps need modernization",
        "Database sharding required for next growth phase",
        "Testing coverage at 68% - below industry standards"
      ]
    },
    marketAnalysis: {
      totalAddressableMarket: "$24.8B global UCaaS market by 2025",
      marketGrowthRate: "11.2% CAGR",
      competitiveLandscape: {
        marketPosition: "Challenger brand focusing on SMB segment",
        directCompetitors: ["RingCentral", "8x8", "Dialpad", "Nextiva"],
        differentiators: [
          "Simplified pricing without per-user fees",
          "No contract requirements",
          "Built-in CRM integrations",
          "Mobile-first design"
        ]
      },
      customerAnalysis: {
        targetSegments: ["Startups", "Small businesses", "Remote teams", "Call centers"],
        averageContractValue: "$149/month",
        netPromoterScore: 67,
        churnRate: "3.2% monthly"
      }
    },
    teamAssessment: {
      leadershipTeam: [
        {
          name: "John Chen",
          role: "CEO & Founder",
          background: "Former VP at RingCentral, 15+ years in telecom"
        },
        {
          name: "Sarah Kim",
          role: "CTO",
          background: "Ex-Google, led teams building communication platforms"
        },
        {
          name: "Michael Rodriguez",
          role: "VP of Sales",
          background: "Built sales teams at Zoom and Slack"
        }
      ],
      teamStrength: "Strong domain expertise with proven track records in communications and SaaS",
      hiringVelocity: "40% YoY team growth, focusing on engineering and customer success",
      culturalFactors: [
        "Remote-first company",
        "Strong engineering culture",
        "Customer-obsessed mindset"
      ]
    },
    financialIndicators: {
      revenueIndicators: {
        estimatedARR: "$12-15M based on user count and pricing",
        growthRate: "120% YoY",
        unitEconomics: "LTV:CAC ratio of 3.5:1"
      },
      fundingHistory: [
        "Seed: $2M (2019)",
        "Series A: $15M (2021) - led by Bessemer Venture Partners",
        "Series B: Expected Q2 2025"
      ],
      burnRate: "Estimated $800K/month",
      runway: "18-24 months at current burn rate"
    },
    dueDiligenceFlags: {
      greenFlags: [
        "Strong product-market fit demonstrated",
        "Experienced team with domain expertise",
        "Modern, scalable technology stack",
        "Healthy unit economics",
        "Growing organically with low marketing spend"
      ],
      yellowFlags: [
        "Concentrated dependency on Twilio",
        "Limited international presence",
        "No significant IP or patents",
        "Customer concentration risk"
      ],
      redFlags: [
        "No clear moat against larger competitors",
        "Potential margin pressure as scale increases"
      ]
    },
    recommendedNextSteps: [
      "Schedule deep-dive technical due diligence session",
      "Review detailed financial statements and cohort analysis",
      "Conduct customer reference calls (5-10 customers)",
      "Analyze competitive positioning with expert networks",
      "Evaluate international expansion strategy"
    ],
    appendices: {
      technicalMetrics: {
        uptime: "99.95% over last 12 months",
        apiResponseTime: "127ms average",
        securityAudits: "Passed SOC2 Type II audit (2024)",
        mobileAppRating: "4.6/5.0 (iOS), 4.4/5.0 (Android)"
      },
      competitorComparison: {
        Ring4: {
          price: "$149/month",
          users: "Unlimited",
          features: "Core + CRM"
        },
        RingCentral: {
          price: "$499/month",
          users: "20",
          features: "Full suite"
        },
        "8x8": {
          price: "$399/month",
          users: "15",
          features: "Full suite"
        }
      },
      customerTestimonials: [
        "Ring4 helped us reduce communication costs by 60% while improving call quality - StartupX CEO",
        "The simplicity and reliability made switching from our previous provider seamless - Agency Owner"
      ]
    }
  }
}

export default function ViewReportPage() {
  const navigate = useNavigate()

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

  const report = mockReport
  const scoreBadge = getScoreBadge(report.report_data.executiveSummary.investmentScore)

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
              <p className="text-muted-foreground">{report.website_url}</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(report.report_data.executiveSummary.investmentScore)}`}>
                {report.report_data.executiveSummary.investmentScore}
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
            <p className="text-lg mb-6">{report.report_data.executiveSummary.overallAssessment}</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Key Findings
                </h3>
                <ul className="space-y-2">
                  {report.report_data.executiveSummary.keyFindings.map((finding, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Critical Risks
                </h3>
                <ul className="space-y-2">
                  {report.report_data.executiveSummary.criticalRisks.map((risk, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
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
                    <h4 className="font-semibold mb-3">Architecture Strengths</h4>
                    <ul className="space-y-2">
                      {report.report_data.technologyAssessment.architectureStrengths.map((strength, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Technical Debt</h4>
                    <ul className="space-y-2">
                      {report.report_data.technologyAssessment.technicalDebt.map((debt, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span>{debt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Technology Stack</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(report.report_data.technologyAssessment.stackOverview).map(([category, technologies]) => (
                      <div key={category}>
                        <h5 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{category}</h5>
                        <div className="space-y-1">
                          {technologies.map((tech, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Scalability Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Current Capacity:</strong> {report.report_data.technologyAssessment.scalabilityAnalysis.currentCapacity}</p>
                    <p><strong>Growth Readiness:</strong> {report.report_data.technologyAssessment.scalabilityAnalysis.growthReadiness}</p>
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
                        <p className="text-sm text-muted-foreground">Total Addressable Market</p>
                        <p className="text-lg font-semibold">{report.report_data.marketAnalysis.totalAddressableMarket}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Market Growth Rate</p>
                        <p className="text-lg font-semibold">{report.report_data.marketAnalysis.marketGrowthRate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Customer Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Contract Value</span>
                        <span className="font-semibold">{report.report_data.marketAnalysis.customerAnalysis.averageContractValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Net Promoter Score</span>
                        <span className="font-semibold">{report.report_data.marketAnalysis.customerAnalysis.netPromoterScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Churn Rate</span>
                        <span className="font-semibold">{report.report_data.marketAnalysis.customerAnalysis.churnRate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Competitive Landscape</h4>
                  <p className="text-sm text-muted-foreground mb-3">{report.report_data.marketAnalysis.competitiveLandscape.marketPosition}</p>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Key Differentiators</h5>
                      <ul className="space-y-1">
                        {report.report_data.marketAnalysis.competitiveLandscape.differentiators.map((diff, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
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
                          <th className="text-left py-2">Pricing</th>
                          <th className="text-left py-2">Users</th>
                          <th className="text-left py-2">Features</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(report.report_data.appendices.competitorComparison).map(([company, data]) => (
                          <tr key={company} className={company === 'Ring4' ? 'font-semibold bg-muted/50' : ''}>
                            <td className="py-2">{company}</td>
                            <td className="py-2">{data.price}</td>
                            <td className="py-2">{data.users}</td>
                            <td className="py-2">{data.features}</td>
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
                <p className="mb-6">{report.report_data.teamAssessment.teamStrength}</p>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Leadership Team</h4>
                    <div className="grid gap-4">
                      {report.report_data.teamAssessment.leadershipTeam.map((member, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-semibold">{member.name}</h5>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{member.background}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Growth & Culture</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Hiring Velocity</p>
                        <p className="font-semibold">{report.report_data.teamAssessment.hiringVelocity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Cultural Factors</p>
                        <div className="flex flex-wrap gap-2">
                          {report.report_data.teamAssessment.culturalFactors.map((factor, index) => (
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
                    <h4 className="font-semibold mb-3">Revenue Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estimated ARR</span>
                        <span className="font-semibold">{report.report_data.financialIndicators.revenueIndicators.estimatedARR}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Growth Rate</span>
                        <span className="font-semibold">{report.report_data.financialIndicators.revenueIndicators.growthRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Unit Economics</span>
                        <span className="font-semibold">{report.report_data.financialIndicators.revenueIndicators.unitEconomics}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Burn & Runway</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Burn Rate</span>
                        <span className="font-semibold">{report.report_data.financialIndicators.burnRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Runway</span>
                        <span className="font-semibold">{report.report_data.financialIndicators.runway}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Funding History</h4>
                  <div className="space-y-2">
                    {report.report_data.financialIndicators.fundingHistory.map((round, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{round}</Badge>
                      </div>
                    ))}
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
                      Green Flags
                    </h4>
                    <ul className="space-y-2">
                      {report.report_data.dueDiligenceFlags.greenFlags.map((flag, index) => (
                        <li key={index} className="text-sm">{flag}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Yellow Flags
                    </h4>
                    <ul className="space-y-2">
                      {report.report_data.dueDiligenceFlags.yellowFlags.map((flag, index) => (
                        <li key={index} className="text-sm">{flag}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Red Flags
                    </h4>
                    <ul className="space-y-2">
                      {report.report_data.dueDiligenceFlags.redFlags.map((flag, index) => (
                        <li key={index} className="text-sm">{flag}</li>
                      ))}
                    </ul>
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
                  {report.report_data.recommendedNextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600">→</span>
                      <span className="text-sm">{step}</span>
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
                    <p className="font-semibold">{report.report_data.appendices.technicalMetrics.uptime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">API Response Time</p>
                    <p className="font-semibold">{report.report_data.appendices.technicalMetrics.apiResponseTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Security Audits</p>
                    <p className="font-semibold">{report.report_data.appendices.technicalMetrics.securityAudits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile App Rating</p>
                    <p className="font-semibold">{report.report_data.appendices.technicalMetrics.mobileAppRating}</p>
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