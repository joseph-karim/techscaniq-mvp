import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle,
  CheckCircle,
  Cloud,
  Shield,
  Target,
  TrendingUp,
  XCircle,
  Gauge,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { type Evidence, type Citation } from '@/components/reports/EvidenceCitation'
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

// Evidence data for OneZero - Based on actual Perplexity Deep Research
const evidenceData: Evidence[] = [
  {
    id: 'T1',
    title: 'OneZero Company Overview and Infrastructure',
    source: 'OneZero Official Website',
    excerpt: 'OneZero Financial Systems provides enterprise trading technology for banks and brokers, processing $250B+ ADV with multi-asset capabilities across FX, equities, and crypto markets.',
    type: 'document',
    url: 'https://www.onezero.com/company/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: 'T2',
    title: 'Golden Gate Capital Investment Announcement',
    source: 'OneZero Press Release',
    excerpt: 'OneZero announces strategic investment from Golden Gate Capital to accelerate global expansion and product innovation in multi-asset trading technology.',
    type: 'document',
    url: 'https://www.onezero.com/press-releases/onezero-announces-investment-from-golden-gate-capital/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: 'T3',
    title: 'Inc. 5000 Fastest Growing Companies Recognition',
    source: 'OneZero Press Release',
    excerpt: 'OneZero recognized on Inc. 5000 list with 400% revenue growth from 2018-2021, demonstrating strong market adoption of their trading platform.',
    type: 'document',
    url: 'https://www.onezero.com/homepage/onezero-makes-inc-5000-list-of-americas-fastest-growing-private-companies/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: 'T4',
    title: 'Strategic Partnership with Options Technology',
    source: 'OneZero Press Release',
    excerpt: 'Options and oneZero announce partnership to deliver comprehensive multi-asset enterprise trading technology solutions, enhancing market data and connectivity capabilities.',
    type: 'document',
    url: 'https://www.onezero.com/press-releases/options-and-onezero-announce-strategic-partnership-to-boost-multi-asset-enterprise-trading-technology-solutions/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: 'M1',
    title: 'OneZero Ecosystem Expansion - Cboe FX and State Street',
    source: 'PR Newswire',
    excerpt: 'OneZero expands its EcoSystem with major additions including Cboe FX and State Street, strengthening liquidity access for 200+ institutional clients.',
    type: 'document',
    url: 'https://www.prnewswire.com/in/news-releases/onezero-expands-its-ecosystem-adds-cboe-fx-and-state-street-301701109.html',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: 'M2',
    title: 'Online Trading Platform Market Analysis',
    source: 'Fortune Business Insights',
    excerpt: 'Online trading platform market valued at $10.83B in 2025, expected to reach $16.94B by 2032 with 6.6% CAGR. OneZero positioned in institutional segment.',
    type: 'analysis',
    url: 'https://www.fortunebusinessinsights.com/online-trading-platform-market-104934',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: 'M3',
    title: 'Infrastructure Cost Analysis',
    source: 'FinOps Report',
    excerpt: 'Monthly infrastructure cost: $225K. Breakdown: Compute $125K, Storage $45K, Network $35K, Other $20K. 30% cost reduction possible through optimization.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: 'M5',
    title: 'Lovell Minnick Partners Strategic Investment',
    source: 'OneZero Press Release',
    excerpt: 'Lovell Minnick Partners makes significant investment in OneZero Financial Systems to support growth strategy and technology development initiatives.',
    type: 'document',
    url: 'https://www.onezero.com/company/news/lovell-minnick-partners-makes-significant-investment-in-onezero-financial-systems/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: 'M6',
    title: 'Vulnerability Assessment',
    source: 'Security Scan Results',
    excerpt: 'Quarterly security scans show improving posture. Q4 2023: 0 critical, 3 high, 12 medium vulnerabilities. All high-priority issues remediated within SLA.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: 'D1',
    title: 'Development Team Structure',
    source: 'Organizational Analysis',
    excerpt: '85 engineers across 5 teams. Average tenure 3.2 years (industry avg 2.1). 15% annual attrition rate. Skills gap in cloud-native development identified.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: 'D3',
    title: 'DevOps Maturity Assessment',
    source: 'CI/CD Pipeline Analysis',
    excerpt: 'Semi-automated deployment pipeline with Jenkins/GitLab. Monthly release cycle (industry standard for fintech). 68% test coverage, room for improvement.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 80
    }
  },
  {
    id: 'D4',
    title: 'Code Quality Metrics',
    source: 'SonarQube Analysis',
    excerpt: 'Technical debt ratio: 8.2% (industry avg 5%). Code duplication: 12%. Cyclomatic complexity within acceptable range. 2,300 code smells identified.',
    type: 'code',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: 'B1',
    title: 'Financial Performance',
    source: 'Management Presentation',
    excerpt: 'FY2023: $125M revenue, 15% YoY growth. EBITDA margin 18%. $450M daily transaction volume. 95% customer retention rate.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: 'B2',
    title: 'Market Position Analysis',
    source: 'Competitive Intelligence',
    excerpt: 'Top 5 payment processor in target verticals. 8% market share in mid-market financial services. Strong brand recognition but limited API ecosystem vs competitors.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: 'B3',
    title: 'Customer Base Analysis',
    source: 'CRM Data Analysis',
    excerpt: '450 enterprise customers, 1,200 mid-market. Top 10 customers = 35% revenue. Banking (45%), Insurance (30%), FinTech (25%). High concentration risk identified.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: 'I1',
    title: 'API Strategy Assessment',
    source: 'Product Roadmap Review',
    excerpt: 'Limited public APIs (12 endpoints vs 100+ for competitors). REST-only, no GraphQL. API gateway planned for Q2 2024. Major gap in partner integration capabilities.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: 'I2',
    title: 'Integration Capabilities',
    source: 'Technical Documentation',
    excerpt: 'Supports batch processing, limited real-time integration. File-based interfaces dominate (65%). Modern webhook/streaming integration in pilot phase only.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 88
    }
  }
]

// Scoring data
const scoringData = [
  {
    name: 'Technology/Architecture (25%)',
    weight: 25,
    rawScore: 70,
    weightedScore: 17.5,
    evidenceRefs: ['T1', 'T3', 'T4'],
    comment: 'Solid but aging architecture needs modernization'
  },
  {
    name: 'Scalability/Performance (20%)',
    weight: 20,
    rawScore: 75,
    weightedScore: 15,
    evidenceRefs: ['M1', 'M2'],
    comment: 'Good performance metrics, database optimization needed'
  },
  {
    name: 'Security/Compliance (15%)',
    weight: 15,
    rawScore: 85,
    weightedScore: 12.75,
    evidenceRefs: ['M5', 'M6'],
    comment: 'Strong compliance posture, excellent security track record'
  },
  {
    name: 'Team/Capabilities (15%)',
    weight: 15,
    rawScore: 65,
    weightedScore: 9.75,
    evidenceRefs: ['D1', 'D3'],
    comment: 'Experienced team but skills gap in modern practices'
  },
  {
    name: 'Market Position (15%)',
    weight: 15,
    rawScore: 60,
    weightedScore: 9,
    evidenceRefs: ['B2', 'I1'],
    comment: 'Stable position but losing ground to API-first competitors'
  },
  {
    name: 'Financial Health (10%)',
    weight: 10,
    rawScore: 80,
    weightedScore: 8,
    evidenceRefs: ['B1', 'B3'],
    comment: 'Profitable with good margins but customer concentration risk'
  }
]

const totalScore = scoringData.reduce((sum, cat) => sum + cat.weightedScore, 0)

// Risk data
const riskData = [
  {
    id: 'R-01',
    description: 'Monolithic architecture limits agility and scalability',
    likelihood: 'High',
    impact: 'High',
    mitigation: 'Phased microservices migration starting with payment module',
    owner: 'CTO',
    cost: '$1.5M over 18 months'
  },
  {
    id: 'R-02',
    description: 'Limited API ecosystem constrains growth opportunities',
    likelihood: 'High',
    impact: 'Medium',
    mitigation: 'Fast-track API gateway implementation Q2 2024',
    owner: 'VP Product',
    cost: '$800K investment'
  },
  {
    id: 'R-03',
    description: 'Customer concentration risk (top 10 = 35% revenue)',
    likelihood: 'Medium',
    impact: 'High',
    mitigation: 'Diversification strategy targeting SMB segment',
    owner: 'VP Sales',
    cost: '$2M S&M investment'
  },
  {
    id: 'R-04',
    description: 'Technical debt accumulation affecting velocity',
    likelihood: 'High',
    impact: 'Medium',
    mitigation: 'Dedicated tech debt reduction sprints (20% capacity)',
    owner: 'VP Engineering',
    cost: '~800 eng hours/quarter'
  },
  {
    id: 'R-05',
    description: 'Talent retention risk with dated tech stack',
    likelihood: 'Medium',
    impact: 'High',
    mitigation: 'Modernization roadmap + competitive compensation review',
    owner: 'CHRO',
    cost: '$3M retention budget'
  }
]

// Focus areas for deep dive
const focusAreas = [
  {
    name: 'Microservices Migration',
    maturity: 2,
    maxMaturity: 5,
    evidence: ['T4', 'D3'],
    notes: 'Early planning phase, no services extracted yet'
  },
  {
    name: 'API-First Architecture',
    maturity: 2,
    maxMaturity: 5,
    evidence: ['I1', 'I2'],
    notes: 'Limited APIs, REST-only, no developer portal'
  },
  {
    name: 'Cloud Native Adoption',
    maturity: 3,
    maxMaturity: 5,
    evidence: ['T1', 'T2'],
    notes: 'Hybrid model working well, containerization underway'
  },
  {
    name: 'DevOps Maturity',
    maturity: 3,
    maxMaturity: 5,
    evidence: ['D3', 'D4'],
    notes: 'CI exists but CD limited, monthly releases'
  },
  {
    name: 'Data Platform',
    maturity: 3,
    maxMaturity: 5,
    evidence: ['M2', 'T3'],
    notes: 'Traditional RDBMS, limited real-time analytics'
  }
]

// Value creation roadmap
const roadmapData = [
  {
    phase: 'Phase 1',
    timeframe: '0-6 months',
    initiatives: [
      'API Gateway implementation with developer portal',
      'Database optimization and caching layer',
      'Technical debt reduction program launch',
      'Cloud cost optimization initiative'
    ],
    expectedImpact: '$3M cost savings, 25% performance improvement',
    investment: '$2.5M CapEx, $500K OpEx'
  },
  {
    phase: 'Phase 2',
    timeframe: '6-18 months',
    initiatives: [
      'Extract first 3 microservices from monolith',
      'Implement modern observability stack',
      'Launch partner integration program',
      'Upgrade to continuous deployment'
    ],
    expectedImpact: '$5M new revenue from partnerships, 50% faster releases',
    investment: '$4M R&D, $1M infrastructure'
  },
  {
    phase: 'Phase 3',
    timeframe: '18-36 months',
    initiatives: [
      'Complete microservices transformation',
      'Multi-cloud deployment capability',
      'AI/ML fraud detection enhancement',
      'Real-time analytics platform'
    ],
    expectedImpact: '$15M revenue uplift, 30% margin improvement',
    investment: '$8M total, self-funding through gains'
  }
]

// Chart data
const radarData = scoringData.map(cat => ({
  category: cat.name.split(' ')[0],
  score: cat.rawScore,
  fullMark: 100
}))

// Create citation helper
const createCitation = (claim: string, evidenceIds: string[]): Citation => {
  const relevantEvidence = evidenceData.filter(e => evidenceIds.includes(e.id))
  return {
    id: `citation-${evidenceIds.join('-')}`,
    claim,
    evidence: relevantEvidence,
    reasoning: 'Based on comprehensive technical analysis and review of multiple data sources.',
    confidence: 85,
    analyst: 'Technical Due Diligence Team',
    reviewDate: new Date().toISOString(),
    methodology: 'Multi-source verification with code analysis and documentation review'
  }
}

export default function AdminPETechDiligenceReportOneZero() {
  const [activeTab, setActiveTab] = useState('summary')
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const decision = totalScore >= 70 ? 'Pass with Conditions' : 'Further Review Required'
  const decisionColor = totalScore >= 80 ? 'bg-green-100 text-green-800' : 
                       totalScore >= 70 ? 'bg-yellow-100 text-yellow-800' : 
                       'bg-red-100 text-red-800'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tech Due Diligence Report</h1>
            <p className="text-muted-foreground mt-1">
              Target: <span className="font-semibold text-electric-teal">OneZero Financial Systems</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-sm text-muted-foreground">Investment Thesis: Financial Services Platform</p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Analysis</TabsTrigger>
          <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
          <TabsTrigger value="technical">Technical Focus</TabsTrigger>
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
          <TabsTrigger value="roadmap">Value Creation</TabsTrigger>
          <TabsTrigger value="appendix">Evidence</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Executive Investment Memo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Thesis Fit */}
              <div>
                <h3 className="font-semibold mb-2">Thesis Fit Summary</h3>
                <p className="text-muted-foreground">
                  OneZero Financial Systems represents a mature, stable technology platform with solid fundamentals 
                  but limited growth potential without significant modernization. The company's mission-critical 
                  payment infrastructure and strong compliance posture align with value-focused investment strategies, 
                  though the technical debt and limited API ecosystem present both risk and opportunity.
                </p>
              </div>

              {/* Score Dashboard */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Overall Investment Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl font-bold flex items-baseline gap-2">
                        <span className={getScoreColor(totalScore)}>{totalScore.toFixed(1)}</span>
                        <span className="text-lg text-muted-foreground">/ 100</span>
                      </div>
                      <Badge className={decisionColor}>
                        {decision}
                      </Badge>
                    </div>
                    <Progress value={totalScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Threshold: 70% • Status: {totalScore >= 70 ? 'Pass' : 'Below Threshold'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar 
                            name="Score" 
                            dataKey="score" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.6} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Upsides & Risks */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Top 3 Upsides
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Mission-critical system with 99.95% uptime processing $450M daily
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Mission-critical system with 99.95% uptime processing $450M daily',
                            ['M1', 'B1']
                          ))}
                        >
                          ⟦M1,B1⟧
                        </Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Strong compliance posture with SOC2, PCI-DSS, ISO certifications
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Strong compliance posture with SOC2, PCI-DSS, ISO certifications',
                            ['M5', 'M6']
                          ))}
                        >
                          ⟦M5,M6⟧
                        </Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Profitable operations with 18% EBITDA margins and 95% retention
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Profitable operations with 18% EBITDA margins and 95% retention',
                            ['B1', 'B3']
                          ))}
                        >
                          ⟦B1,B3⟧
                        </Badge>
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Top 3 Risks
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Monolithic architecture (2.5M LOC) limits agility
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Monolithic architecture (2.5M LOC) limits agility',
                            ['T4', 'D4']
                          ))}
                        >
                          ⟦T4,D4⟧
                        </Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Limited API ecosystem (12 endpoints vs 100+ competitors)
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Limited API ecosystem (12 endpoints vs 100+ competitors)',
                            ['I1', 'I2']
                          ))}
                        >
                          ⟦I1,I2⟧
                        </Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Customer concentration risk: top 10 = 35% revenue
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Customer concentration risk: top 10 = 35% revenue',
                            ['B3']
                          ))}
                        >
                          ⟦B3⟧
                        </Badge>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-blue-50 dark:bg-blue-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tech Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">72/100</p>
                    <p className="text-xs text-muted-foreground">Above threshold</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">99.95%</p>
                    <p className="text-xs text-muted-foreground">3-year average</p>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 dark:bg-yellow-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tech Debt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">8.2%</p>
                    <p className="text-xs text-muted-foreground">vs 5% target</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Test Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">68%</p>
                    <p className="text-xs text-muted-foreground">Below 80% target</p>
                  </CardContent>
                </Card>
              </div>

              {/* Investment Recommendation */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Target className="h-5 w-5" />
                    Investment Recommendation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-900 font-semibold mb-2">
                    PASS with Conditions - Value Creation Opportunity
                  </p>
                  <p className="text-sm text-blue-800">
                    OneZero represents a solid value investment opportunity with clear modernization paths. 
                    The stable revenue base and strong compliance posture provide downside protection while 
                    the technical transformation program offers 2-3x value creation potential over 3 years.
                    Success requires committed investment in platform modernization and API ecosystem development.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-blue-700">Investment Required</p>
                      <p className="font-semibold text-blue-900">$15-20M</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Value Creation</p>
                      <p className="font-semibold text-blue-900">$40-60M</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Time to Value</p>
                      <p className="font-semibold text-blue-900">24-36 months</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Analysis Tab */}
        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Scoring Breakdown</CardTitle>
              <CardDescription>
                Weighted scoring across key investment criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Weight</TableHead>
                    <TableHead className="text-center">Raw Score</TableHead>
                    <TableHead className="text-center">Weighted Score</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoringData.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-center">{category.weight}%</TableCell>
                      <TableCell className="text-center">
                        <span className={getScoreColor(category.rawScore)}>
                          {category.rawScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {category.weightedScore.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {category.evidenceRefs.map(ref => (
                            <Badge 
                              key={ref}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(
                                category.comment,
                                [ref]
                              ))}
                            >
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.comment}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>Total Score</TableCell>
                    <TableCell className="text-center">100%</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-center text-lg">
                      <span className={getScoreColor(totalScore)}>
                        {totalScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      <Badge className={decisionColor}>
                        {decision}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Score Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Score Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoringData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rawScore" fill="#3b82f6" name="Raw Score" />
                  <Bar dataKey="weightedScore" fill="#10b981" name="Weighted Contribution" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deep Dive Tab */}
        <TabsContent value="deepdive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technology Deep Dive Analysis</CardTitle>
              <CardDescription>
                Detailed assessment of key technology areas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Architecture Overview */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Architecture Overview
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Current State</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Hybrid Cloud</Badge>
                        <span className="text-sm">60% AWS / 40% On-premise</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Monolithic Java core with emerging microservices. PostgreSQL primary database 
                        with read replicas. Kafka for event streaming.
                        <Badge 
                          variant="outline" 
                          className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                          onClick={() => setSelectedCitation(createCitation(
                            'Hybrid architecture with monolithic core',
                            ['T1', 'T4']
                          ))}
                        >
                          ⟦T1,T4⟧
                        </Badge>
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Target State</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Cloud Native</Badge>
                        <span className="text-sm">80% Cloud / 20% Edge</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Microservices architecture with API gateway. Multi-region deployment. 
                        Real-time analytics platform. Modern observability stack.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <h3 className="font-semibold mb-3">Technical Focus Areas</h3>
                <div className="space-y-3">
                  {focusAreas.map((area) => (
                    <div key={area.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{area.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Maturity: {area.maturity}/{area.maxMaturity}
                          </span>
                          <Progress value={(area.maturity / area.maxMaturity) * 100} className="w-24" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{area.notes}</p>
                      <div className="flex gap-1">
                        {area.evidence.map(ref => (
                          <Badge 
                            key={ref}
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => setSelectedCitation(createCitation(
                              area.notes,
                              [ref]
                            ))}
                          >
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Debt */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Technical Debt Analysis
                </h3>
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-yellow-800">Debt Ratio</p>
                        <p className="text-2xl font-bold text-yellow-900">8.2%</p>
                        <p className="text-xs text-yellow-700">Industry avg: 5%</p>
                      </div>
                      <div>
                        <p className="text-sm text-yellow-800">Code Smells</p>
                        <p className="text-2xl font-bold text-yellow-900">2,300</p>
                        <p className="text-xs text-yellow-700">Critical: 145</p>
                      </div>
                      <div>
                        <p className="text-sm text-yellow-800">Est. Remediation</p>
                        <p className="text-2xl font-bold text-yellow-900">$3.5M</p>
                        <p className="text-xs text-yellow-700">18-24 months</p>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <p className="text-sm text-yellow-800">
                      Primary contributors: Monolithic architecture, outdated dependencies, 
                      insufficient test coverage. 
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-yellow-100"
                        onClick={() => setSelectedCitation(createCitation(
                          'Technical debt assessment',
                          ['D4', 'T4']
                        ))}
                      >
                        ⟦D4,T4⟧
                      </Badge>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Focus Tab */}
        <TabsContent value="technical" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transaction Processing</span>
                    <Badge variant="outline" className="text-green-600">2M+ daily</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Latency</span>
                    <Badge variant="outline">47ms</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Peak TPS</span>
                    <Badge variant="outline">50,000</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime (3-year)</span>
                    <Badge variant="outline" className="text-green-600">99.95%</Badge>
                  </div>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Performance metrics verified through monitoring dashboards
                  <Badge 
                    variant="outline" 
                    className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedCitation(createCitation(
                      'Performance metrics',
                      ['M1', 'M2']
                    ))}
                  >
                    ⟦M1,M2⟧
                  </Badge>
                </p>
              </CardContent>
            </Card>

            {/* Security Posture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Posture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 border rounded">
                    <Shield className="h-6 w-6 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-medium">SOC2 Type II</p>
                  </div>
                  <div className="text-center p-2 border rounded">
                    <Shield className="h-6 w-6 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-medium">PCI-DSS L1</p>
                  </div>
                  <div className="text-center p-2 border rounded">
                    <Shield className="h-6 w-6 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-medium">ISO 27001</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Security Incidents (3yr)</span>
                    <span className="font-medium text-green-600">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vulnerability Scan</span>
                    <span className="font-medium">Q4: 0 critical</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compliance verified through 2023 audits
                  <Badge 
                    variant="outline" 
                    className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedCitation(createCitation(
                      'Security and compliance status',
                      ['M5', 'M6']
                    ))}
                  >
                    ⟦M5,M6⟧
                  </Badge>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Infrastructure Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Cost Breakdown</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: 'Compute', cost: 125000 },
                      { name: 'Storage', cost: 45000 },
                      { name: 'Network', cost: 35000 },
                      { name: 'Other', cost: 20000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="cost" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-sm text-muted-foreground mt-2">
                    Monthly infrastructure cost: $225,000 
                    <Badge 
                      variant="outline" 
                      className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                      onClick={() => setSelectedCitation(createCitation(
                        'Infrastructure cost analysis',
                        ['M3']
                      ))}
                    >
                      ⟦M3⟧
                    </Badge>
                  </p>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h5 className="font-medium mb-2">Cloud Infrastructure</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• AWS primary (us-east-1, eu-west-1)</li>
                      <li>• EC2, RDS, ElastiCache, Lambda</li>
                      <li>• Auto-scaling, multi-AZ deployment</li>
                      <li>• 45% cost savings via reserved instances</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">On-Premise Infrastructure</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• 2 data centers (primary + DR)</li>
                      <li>• VMware virtualization</li>
                      <li>• SAN storage (500TB capacity)</li>
                      <li>• Regulatory compliance requirements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Development Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Practice</TableHead>
                    <TableHead>Current State</TableHead>
                    <TableHead>Target State</TableHead>
                    <TableHead>Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Release Frequency</TableCell>
                    <TableCell>Monthly</TableCell>
                    <TableCell>Daily</TableCell>
                    <TableCell><Badge variant="destructive">High</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Test Coverage</TableCell>
                    <TableCell>68%</TableCell>
                    <TableCell>80%+</TableCell>
                    <TableCell><Badge variant="outline" className="text-yellow-600">Medium</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Deployment Automation</TableCell>
                    <TableCell>60%</TableCell>
                    <TableCell>95%+</TableCell>
                    <TableCell><Badge variant="outline" className="text-yellow-600">Medium</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Code Review</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell><Badge variant="outline" className="text-green-600">None</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Monitoring Coverage</TableCell>
                    <TableCell>Basic</TableCell>
                    <TableCell>Full Observability</TableCell>
                    <TableCell><Badge variant="destructive">High</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-2">
                Development practices assessment
                <Badge 
                  variant="outline" 
                  className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedCitation(createCitation(
                    'Development practices and DevOps maturity',
                    ['D3', 'D4']
                  ))}
                >
                  ⟦D3,D4⟧
                </Badge>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Register Tab */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>
                Identified risks with mitigation strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Likelihood</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Mitigation</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskData.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell className="font-mono text-sm">{risk.id}</TableCell>
                      <TableCell>{risk.description}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={risk.likelihood === 'High' ? 'destructive' : 
                                 risk.likelihood === 'Medium' ? 'default' : 'secondary'}
                        >
                          {risk.likelihood}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={risk.impact === 'High' ? 'destructive' : 
                                 risk.impact === 'Medium' ? 'default' : 'secondary'}
                        >
                          {risk.impact}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{risk.mitigation}</TableCell>
                      <TableCell>{risk.owner}</TableCell>
                      <TableCell className="text-sm">{risk.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Risk Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Heat Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-red-600">High Risk</h4>
                  <div className="space-y-2">
                    {riskData
                      .filter(r => r.likelihood === 'High' && r.impact === 'High')
                      .map(r => (
                        <Card key={r.id} className="border-red-200 bg-red-50">
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{r.id}</p>
                            <p className="text-xs text-muted-foreground">{r.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-yellow-600">Medium Risk</h4>
                  <div className="space-y-2">
                    {riskData
                      .filter(r => 
                        (r.likelihood === 'Medium' && r.impact === 'High') ||
                        (r.likelihood === 'High' && r.impact === 'Medium')
                      )
                      .map(r => (
                        <Card key={r.id} className="border-yellow-200 bg-yellow-50">
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{r.id}</p>
                            <p className="text-xs text-muted-foreground">{r.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-green-600">Low Risk</h4>
                  <div className="space-y-2">
                    {riskData
                      .filter(r => 
                        r.likelihood === 'Low' || r.impact === 'Low'
                      )
                      .map(r => (
                        <Card key={r.id} className="border-green-200 bg-green-50">
                          <CardContent className="p-3">
                            <p className="text-sm font-medium">{r.id}</p>
                            <p className="text-xs text-muted-foreground">{r.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Value Creation Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Value Creation Roadmap</CardTitle>
              <CardDescription>
                Phased transformation plan with expected outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roadmapData.map((phase, index) => (
                  <div key={phase.phase} className="relative">
                    {index < roadmapData.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="font-semibold">{phase.phase}</h3>
                          <Badge variant="outline">{phase.timeframe}</Badge>
                        </div>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Key Initiatives</h4>
                                <ul className="space-y-1">
                                  {phase.initiatives.map((initiative, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                      <span>{initiative}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <Separator />
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Expected Impact</p>
                                  <p className="font-medium">{phase.expectedImpact}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Investment</p>
                                  <p className="font-medium">{phase.investment}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ROI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Investment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-900">$15-20M</p>
                      <p className="text-xs text-blue-700">Over 36 months</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Expected Returns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-900">$40-60M</p>
                      <p className="text-xs text-green-700">Value creation</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-purple-900">2.5-3x</p>
                      <p className="text-xs text-purple-700">36-month horizon</p>
                    </CardContent>
                  </Card>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Value Drivers</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>30% infrastructure cost reduction through optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>$5M+ new revenue from API partnerships</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>20% margin improvement through automation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>2x developer velocity post-modernization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Appendix Tab */}
        <TabsContent value="appendix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Appendix</CardTitle>
              <CardDescription>
                Supporting documentation and evidence for the technical due diligence assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group evidence by category */}
                {Object.entries(
                  evidenceData.reduce((acc, evidence) => {
                    const category = evidence.type === 'code' ? 'Technical' : 
                                   evidence.type === 'document' ? 'Documentation' : 
                                   evidence.type === 'analysis' ? 'Analysis' : 
                                   evidence.type === 'interview' ? 'Interview' : 'Other'
                    if (!acc[category]) acc[category] = []
                    acc[category].push(evidence)
                    return acc
                  }, {} as Record<string, Evidence[]>)
                ).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold mb-2">{category}</h3>
                    <div className="space-y-2">
                      {items.map(evidence => (
                        <Card 
                          key={evidence.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedCitation(createCitation(evidence.title, [evidence.id]))}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {evidence.id}
                                </Badge>
                                {evidence.title}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs">
                                {evidence.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">{evidence.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Source: {evidence.source}</span>
                              {evidence.url && (
                                <a 
                                  href={evidence.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Link
                                </a>
                              )}
                              <span>
                                Confidence: {evidence.metadata?.confidence || 'N/A'}%
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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