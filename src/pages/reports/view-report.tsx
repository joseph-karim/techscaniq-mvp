import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ScanReportNavigation } from '@/components/reports/ScanReportNavigation'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { InlineCitation, Citation } from '@/components/reports/EvidenceCitation'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Home, FileText, Search, AlertTriangle, CheckCircle, XCircle, TrendingUp, Shield, Building2, Calendar } from 'lucide-react'

// Comprehensive citations covering all sections and facts
const mockCitations: Citation[] = [
  {
    id: 'c1',
    claim: 'Ring4 uses React-based technology stack with cloud infrastructure',
    evidence: [
      {
        id: 'e1',
        type: 'code',
        title: 'Frontend technology detection',
        source: 'ring4.com/js/bundle.js',
        url: 'https://ring4.com',
        excerpt: 'React.createElement, React.Component, ReactDOM.render detected in main bundle',
        metadata: {
          fileType: 'JavaScript',
          lastModified: '2025-01-15',
          confidence: 95
        }
      },
      {
        id: 'e2',
        type: 'document',
        title: 'Company overview',
        source: 'ring4.com/about',
        excerpt: 'Ring4 is a cloud-based phone system and communication platform that provides second phone numbers for business and personal use.',
        metadata: {
          fileType: 'HTML',
          lastModified: '2025-01-10',
          confidence: 90
        }
      }
    ],
    reasoning: 'Analysis of the Ring4 website reveals React-based frontend implementation through JavaScript bundle analysis. The company positions itself as a cloud-based VoIP platform.',
    confidence: 93,
    analyst: 'Sarah Chen, Frontend Specialist',
    reviewDate: '2025-01-15',
    methodology: 'Static code analysis of web assets and company documentation'
  },
  {
    id: 'c2',
    claim: 'The platform implements VoIP technology with global phone number provisioning',
    evidence: [
      {
        id: 'e3',
        type: 'api',
        title: 'API endpoint analysis',
        source: 'ring4.com/api/numbers',
        excerpt: 'GET /api/numbers/available?country=US&type=local returns available phone numbers',
        metadata: {
          confidence: 88
        }
      },
      {
        id: 'e4',
        type: 'document',
        title: 'Service description',
        source: 'ring4.com/features',
        excerpt: 'Get phone numbers in 100+ countries without physical offices. BYOD solution for businesses.',
        metadata: {
          fileType: 'HTML',
          lastModified: '2025-01-08',
          confidence: 85
        }
      }
    ],
    reasoning: 'API analysis shows global phone number provisioning capabilities. Marketing materials confirm VoIP technology and international number availability.',
    confidence: 88,
    analyst: 'Michael Rodriguez, Backend Specialist',
    reviewDate: '2025-01-14',
    methodology: 'API endpoint analysis and service documentation review'
  },
  {
    id: 'c3',
    claim: 'Security assessment incomplete due to limited public information',
    evidence: [
      {
        id: 'e5',
        type: 'analysis',
        title: 'Security headers analysis',
        source: 'SSL Labs scan results',
        excerpt: 'Grade B+ SSL configuration, missing some security headers',
        metadata: {
          confidence: 75
        }
      }
    ],
    reasoning: 'Limited security information available through public channels. SSL configuration shows good practices but lacks comprehensive security audit data.',
    confidence: 60,
    analyst: 'Alex Thompson, Security Analyst',
    reviewDate: '2025-01-12',
    methodology: 'Automated security scanning and header analysis'
  },
  {
    id: 'c4',
    claim: 'Team includes experienced founders with crowdfunding success',
    evidence: [
      {
        id: 'e6',
        type: 'document',
        title: 'Funding information',
        source: 'Republic.co campaign',
        excerpt: '$396K raised from 284 investors with $6M valuation cap',
        metadata: {
          fileType: 'Investment Platform',
          lastModified: '2018-12-01',
          confidence: 92
        }
      },
      {
        id: 'e7',
        type: 'web',
        title: 'Leadership team',
        source: 'LinkedIn profiles',
        excerpt: 'Alex Botteri (CEO), Ferreol de Soras (Co-Founder) with telecommunications experience',
        metadata: {
          confidence: 85
        }
      }
    ],
    reasoning: 'Successful crowdfunding campaign demonstrates market validation. Founder profiles show relevant industry experience.',
    confidence: 88,
    analyst: 'Jennifer Kim, Business Analyst',
    reviewDate: '2025-01-10',
    methodology: 'Investment platform analysis and professional profile review'
  }
]

// Enhanced Ring4 report data with detailed structure
const mockReport = {
  id: "54d36b34-190c-4085-b3ea-84017a3538bf",
  company_name: "Ring4",
  website_url: "https://ring4.com",
  report_type: "due_diligence",
  status: "completed",
  created_at: "2025-05-28T04:25:51.056085+00:00",
  updated_at: "2025-05-28T04:25:51.056085+00:00",
  investment_score: 65,
  tech_health_score: 6.5,
  tech_health_grade: "C",
  executive_summary: "Ring4 presents a promising but incompletely defined investment opportunity. The platform demonstrates solid VoIP technology implementation with global reach, serving the growing remote communication market. However, limited visibility into infrastructure scalability, security protocols, and financial performance creates uncertainty for investment evaluation.",
  investment_rationale: "The investment score of 65 reflects cautious optimism based on proven market traction through successful crowdfunding ($396K raised) and established VoIP technology platform. The company addresses a clear market need for business communication solutions. Risk factors include limited financial transparency, unclear competitive positioning, and insufficient technical infrastructure visibility.",
  
  // Rich detailed sections for professional presentation
  sections: {
    executiveSummary: {
      title: "Executive Summary",
      summary: "Comprehensive analysis of Ring4's investment potential and technical capabilities",
      investmentScore: 65,
      techHealthScore: 6.5,
      techHealthGrade: "C",
      keyFindings: [
        "Proven VoIP technology platform with global phone number provisioning",
        "Successful crowdfunding validation with $396K raised from 284 investors",
        "Strong mobile app presence on both iOS and Android platforms",
        "Limited visibility into backend infrastructure and security practices"
      ],
      criticalIssues: [
        "Incomplete security assessment due to limited public information",
        "Unclear financial performance and growth metrics",
        "Insufficient technical team size and capabilities data"
      ],
      opportunities: [
        "Expanding remote work market driving demand for business communication",
        "Potential for international expansion in underserved markets",
        "Integration opportunities with CRM and business productivity tools"
      ]
    },
    
    companyOverview: {
      title: "Company Overview",
      summary: "Ring4 operates as a cloud-based VoIP communication platform",
      details: {
        name: "Ring4",
        website: "https://ring4.com",
        industry: "Business Communication / VoIP",
        description: "Ring4 provides cloud-based phone systems and second phone numbers for business and personal use, operating in the VoIP industry with solutions for startups, SMBs, freelancers, and enterprises.",
        location: "United States",
        foundingYear: "2017",
        businessModel: "SaaS subscription with freemium options",
        targetMarket: "SMBs, freelancers, remote teams, international businesses"
      }
    },
    
    technologyStack: {
      title: "Technology Stack",
      summary: "Modern web and mobile technology stack with cloud infrastructure",
      frontend: [
        { technology: "React", version: "18+", assessment: "Modern, well-maintained", confidence: 95 },
        { technology: "Mobile Apps", version: "iOS/Android", assessment: "Native platform support", confidence: 90 },
        { technology: "Web Platform", version: "Progressive", assessment: "Cross-platform accessibility", confidence: 85 }
      ],
      backend: [
        { technology: "VoIP Infrastructure", version: "Cloud-based", assessment: "Core competency", confidence: 88 },
        { technology: "Global Telephony", version: "Multi-carrier", assessment: "International reach", confidence: 82 },
        { technology: "API Platform", version: "RESTful", assessment: "Standard integration", confidence: 80 }
      ],
      infrastructure: [
        { technology: "Cloud Hosting", version: "Multi-region", assessment: "Scalable foundation", confidence: 75 },
        { technology: "CDN", version: "Global", assessment: "Performance optimization", confidence: 70 },
        { technology: "Database", version: "Unknown", assessment: "Limited visibility", confidence: 40 }
      ]
    },
    
    securityAssessment: {
      title: "Security Assessment",
      summary: "Limited security visibility with standard SSL implementation",
      overallScore: 60,
      grade: "C",
      findings: [
        {
          severity: "medium",
          title: "Limited Security Transparency",
          description: "Security practices not publicly documented, compliance certifications unclear",
          recommendation: "Request detailed security audit and compliance documentation",
          evidence_ids: ["c3"]
        },
        {
          severity: "low",
          title: "SSL Configuration",
          description: "Grade B+ SSL configuration with modern encryption",
          recommendation: "Implement additional security headers for enhanced protection",
          evidence_ids: ["c3"]
        }
      ],
      compliance: {
        gdpr: "Unknown - requires verification",
        hipaa: "Not applicable for current use case",
        soc2: "Unknown - recommended for enterprise clients",
        iso27001: "Unknown - would strengthen enterprise positioning"
      }
    },
    
    teamAnalysis: {
      title: "Team Analysis",
      summary: "Experienced founding team with telecommunications background",
      leadership: [
        {
          name: "Alex Botteri",
          role: "CEO & Co-Founder",
          experience: "Telecommunications industry veteran, leading Ring4's vision and strategy",
          assessment: "Strong leadership presence",
          linkedIn: "",
          evidence_ids: ["c4"]
        },
        {
          name: "Ferreol de Soras",
          role: "Co-Founder",
          experience: "Co-founded Ring4 with technical and business development focus",
          assessment: "Complementary co-founder skills",
          linkedIn: "",
          evidence_ids: ["c4"]
        },
        {
          name: "Trevor",
          role: "Managing Partner",
          experience: "Managing partner responsible for operations and partnerships",
          assessment: "Operations and business development",
          linkedIn: "",
          evidence_ids: ["c4"]
        }
      ],
      teamSize: "Unknown - requires further investigation",
      techTeamSize: "Limited visibility into technical team composition",
      openPositions: 0,
      assessment: "Solid founding team but limited visibility into broader organization"
    },
    
    marketPosition: {
      title: "Market Position",
      summary: "Positioned in competitive but growing VoIP communication market",
      marketSize: "Global VoIP market valued at $85B+ with 10%+ annual growth",
      competitivePosition: "Mid-market player focusing on ease-of-use and global accessibility",
      competitors: [
        { name: "Google Voice", position: "Consumer leader", differentiator: "Business focus" },
        { name: "Grasshopper", position: "SMB specialist", differentiator: "Global reach" },
        { name: "RingCentral", position: "Enterprise leader", differentiator: "Simplicity" }
      ],
      marketTrends: [
        "Remote work driving business communication demand",
        "International business expansion requiring global numbers",
        "Integration with business productivity tools increasing"
      ]
    },
    
    financialOverview: {
      title: "Financial Overview",
      summary: "Limited financial data with successful crowdfunding track record",
      fundingHistory: [
        {
          date: "2018",
          round: "Crowdfunding",
          amount: "$396K total raised",
          investors: ["284 investors via Republic", "Inturact Capital", "Leonis Investment"],
          valuation: "$6,000,000 (valuation cap)",
          evidence_ids: ["c4"]
        },
        {
          date: "2017",
          round: "Angel",
          amount: "$225K",
          investors: ["Angel investors and funds"],
          valuation: "Not disclosed",
          evidence_ids: ["c4"]
        }
      ],
      revenueMetrics: "Not publicly available - requires due diligence access",
      customerMetrics: "User base size and growth not disclosed",
      unitEconomics: "Pricing model visible but customer acquisition costs unknown"
    }
  }
}

export default function ViewReport() {
  const { } = useParams()
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [activeSection, setActiveSection] = useState('executive-summary')
  
  // For now, always show Ring4 report - later we can add logic to load different reports by ID
  // const reportId = id || 'report-ring4-comprehensive'

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation)
  }

  const handleCloseModal = () => {
    setSelectedCitation(null)
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-4 w-4" /> },
    { label: 'Reports', href: '/reports', icon: <FileText className="h-4 w-4" /> },
    { label: mockReport.company_name, icon: <Search className="h-4 w-4" /> }
  ]

  const renderSection = () => {
    switch (activeSection) {
      case 'executive-summary':
        return (
          <div id="executive-summary" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive investment analysis and technical due diligence overview.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Investment Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{mockReport.investment_score}/100</div>
                  <Progress value={mockReport.investment_score} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    Cautiously optimistic based on market traction
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tech Health Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{mockReport.tech_health_score}/10</div>
                  <Badge variant="outline" className="mt-2">{mockReport.tech_health_grade}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Moderate technical foundation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Report Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Complete</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    Generated on {new Date(mockReport.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Investment Rationale</CardTitle>
                <CardDescription>Key factors driving the investment assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {mockReport.investment_rationale}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Key Findings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockReport.sections.executiveSummary.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-900">{finding}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Critical Issues
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockReport.sections.executiveSummary.criticalIssues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-900">{issue}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockReport.sections.executiveSummary.opportunities.map((opportunity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-900">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'company-overview':
        return (
          <div id="company-overview" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Company Overview</h2>
              <p className="text-muted-foreground mb-6">
                Detailed analysis of Ring4's business model and market position.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Basic Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{mockReport.sections.companyOverview.details.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry:</span>
                      <span>{mockReport.sections.companyOverview.details.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Founded:</span>
                      <span>{mockReport.sections.companyOverview.details.foundingYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{mockReport.sections.companyOverview.details.location}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business Model</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span>{mockReport.sections.companyOverview.details.businessModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span>{mockReport.sections.companyOverview.details.targetMarket}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  <InlineCitation 
                    citationId="1" 
                    citation={mockCitations[0]}
                    onCitationClick={handleCitationClick}
                  >
                    {mockReport.sections.companyOverview.details.description}
                  </InlineCitation>
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'technology-overview':
        return (
          <div id="technology-overview" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Technology Overview</h2>
              <p className="text-muted-foreground mb-6">
                Detailed analysis of the technology stack and architectural patterns.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Frontend Technologies</CardTitle>
                  <CardDescription>Client-side technology stack analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockReport.sections.technologyStack.frontend.map((tech, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          <InlineCitation 
                            citationId="1" 
                            citation={mockCitations[0]}
                            onCitationClick={handleCitationClick}
                          >
                            {tech.technology}
                          </InlineCitation>
                        </span>
                        <span className="font-medium">{tech.version}</span>
                      </div>
                      <Progress value={tech.confidence} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{tech.assessment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backend Technologies</CardTitle>
                  <CardDescription>Server-side technology stack analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockReport.sections.technologyStack.backend.map((tech, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>
                          <InlineCitation 
                            citationId="2" 
                            citation={mockCitations[1]}
                            onCitationClick={handleCitationClick}
                          >
                            {tech.technology}
                          </InlineCitation>
                        </span>
                        <span className="font-medium">{tech.version}</span>
                      </div>
                      <Progress value={tech.confidence} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{tech.assessment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Technologies</CardTitle>
                <CardDescription>Infrastructure and deployment analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {mockReport.sections.technologyStack.infrastructure.map((tech, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{tech.technology}</span>
                        <Badge variant="outline">{tech.version}</Badge>
                      </div>
                      <Progress value={tech.confidence} className="h-2 mb-2" />
                      <p className="text-xs text-muted-foreground">{tech.assessment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security-assessment':
        return (
          <div id="security-assessment" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Security Assessment</h2>
              <p className="text-muted-foreground mb-6">
                Comprehensive security analysis and vulnerability assessment.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{mockReport.sections.securityAssessment.overallScore}/100</div>
                  <Badge variant="outline" className="mt-2">{mockReport.sections.securityAssessment.grade}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Limited security visibility
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Findings</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockReport.sections.securityAssessment.findings.length}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Security issues identified
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">Unknown</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Compliance status unclear
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Security Findings</CardTitle>
                <CardDescription>Identified security issues and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockReport.sections.securityAssessment.findings.map((finding, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{finding.title}</h4>
                      <Badge variant={finding.severity === 'medium' ? 'default' : finding.severity === 'low' ? 'secondary' : 'destructive'}>
                        {finding.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <InlineCitation 
                        citationId="3" 
                        citation={mockCitations[2]}
                        onCitationClick={handleCitationClick}
                      >
                        {finding.description}
                      </InlineCitation>
                    </p>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm font-medium text-blue-900 mb-1">Recommendation:</p>
                      <p className="text-sm text-blue-800">{finding.recommendation}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current compliance with industry standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(mockReport.sections.securityAssessment.compliance).map(([standard, status]) => (
                    <div key={standard} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium uppercase">{standard}</span>
                      <Badge variant="outline" className="text-orange-600">
                        {status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'team-analysis':
        return (
          <div id="team-analysis" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Team Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Leadership team assessment and organizational structure analysis.
              </p>
            </div>

            <div className="grid gap-6">
              {mockReport.sections.teamAnalysis.leadership.map((member, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          <InlineCitation 
                            citationId="4" 
                            citation={mockCitations[3]}
                            onCitationClick={handleCitationClick}
                          >
                            {member.name}
                          </InlineCitation>
                        </CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                      </div>
                      <Badge variant="outline">{member.assessment}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{member.experience}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Assessment</CardTitle>
                <CardDescription>Overall team composition and capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Team Size</h4>
                    <p className="text-sm text-muted-foreground">{mockReport.sections.teamAnalysis.teamSize}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Technical Team</h4>
                    <p className="text-sm text-muted-foreground">{mockReport.sections.teamAnalysis.techTeamSize}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Assessment Summary</h4>
                  <p className="text-sm text-muted-foreground">{mockReport.sections.teamAnalysis.assessment}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'financial-overview':
        return (
          <div id="financial-overview" className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Financial Overview</h2>
              <p className="text-muted-foreground mb-6">
                Financial performance analysis and funding history.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Funding History</CardTitle>
                <CardDescription>Investment rounds and capital raised</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockReport.sections.financialOverview.fundingHistory.map((round, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{round.round}</Badge>
                        <span className="text-sm text-muted-foreground">{round.date}</span>
                      </div>
                      <span className="font-bold text-green-600">
                        <InlineCitation 
                          citationId="4" 
                          citation={mockCitations[3]}
                          onCitationClick={handleCitationClick}
                        >
                          {round.amount}
                        </InlineCitation>
                      </span>
                    </div>
                    {round.valuation && (
                      <p className="text-sm text-muted-foreground mb-2">Valuation: {round.valuation}</p>
                    )}
                    <div>
                      <p className="text-sm font-medium mb-1">Investors:</p>
                      <div className="flex flex-wrap gap-1">
                        {round.investors.map((investor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {investor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{mockReport.sections.financialOverview.revenueMetrics}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{mockReport.sections.financialOverview.customerMetrics}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return <div>Section not found</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <ScanReportNavigation 
              currentSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>
          
          <div className="flex-1 bg-white rounded-lg shadow-sm border">
            {renderSection()}
          </div>
        </div>
      </div>

      {selectedCitation && (
        <EvidenceModal 
          citation={selectedCitation}
          isOpen={!!selectedCitation}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}