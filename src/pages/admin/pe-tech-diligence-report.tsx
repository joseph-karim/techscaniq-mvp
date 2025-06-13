import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Code,
  Cloud,
  GitBranch,
  Globe,
  Info,
  Shield,
  Target,
  TrendingUp,
  Zap,
  XCircle,
  Gauge
} from 'lucide-react'
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

// Types
interface ScoringCategory {
  name: string
  weight: number
  rawScore: number
  weightedScore: number
  evidenceRefs: string[]
  comment: string
}

interface Evidence {
  id: string
  content: string
  source: string
  impact: 'positive' | 'negative' | 'neutral'
  score?: number
}

interface Risk {
  id: string
  description: string
  likelihood: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  mitigation: string
  owner: string
  cost?: string
}

interface FocusArea {
  name: string
  maturity: number
  maxMaturity: number
  evidence: string[]
  notes: string
}

interface Roadmap {
  phase: string
  timeframe: string
  initiatives: string[]
  expectedImpact: string
  investment: string
}

// Mock Data for Snowplow Analytics
const scoringData: ScoringCategory[] = [
  {
    name: 'Product / Tech Stack',
    weight: 30,
    rawScore: 85,
    weightedScore: 25.5,
    evidenceRefs: ['T4', 'T6', 'T12', 'T18'],
    comment: 'Modern event streaming architecture, cloud-native design, some legacy Scala components'
  },
  {
    name: 'Market Expansion Readiness',
    weight: 25,
    rawScore: 90,
    weightedScore: 22.5,
    evidenceRefs: ['M2', 'M8', 'M15'],
    comment: 'Strong multi-region support, GDPR/CCPA compliant, 40% YoY growth'
  },
  {
    name: 'Development Velocity',
    weight: 25,
    rawScore: 75,
    weightedScore: 18.75,
    evidenceRefs: ['D5', 'D9', 'D14'],
    comment: 'CI/CD mature, test coverage 72%, weekly releases'
  },
  {
    name: 'Code Quality / Tech Debt',
    weight: 20,
    rawScore: 70,
    weightedScore: 14,
    evidenceRefs: ['C5', 'C7', 'C11'],
    comment: 'Well-maintained core, some monolithic collectors need refactoring'
  }
]

const totalScore = scoringData.reduce((sum, cat) => sum + cat.weightedScore, 0)


// Risk data
const riskData: Risk[] = [
  {
    id: 'R-01',
    description: 'Single point of failure in event validation service',
    likelihood: 'Medium',
    impact: 'High',
    mitigation: 'Deploy redundant validators across AZs',
    owner: 'VP Engineering',
    cost: '$45k one-time + $8k/mo'
  },
  {
    id: 'R-02',
    description: 'Technical debt in legacy Scala collectors',
    likelihood: 'High',
    impact: 'Medium',
    mitigation: 'Phased migration to Go-based collectors',
    owner: 'Principal Architect',
    cost: '~400 eng hours'
  },
  {
    id: 'R-03',
    description: 'Dependency on AWS Kinesis limits multi-cloud portability',
    likelihood: 'Low',
    impact: 'Medium',
    mitigation: 'Abstract streaming layer, support Kafka/Pulsar',
    owner: 'Platform Team',
    cost: '$120k project'
  },
  {
    id: 'R-04',
    description: 'Limited automated security scanning in CI/CD',
    likelihood: 'Medium',
    impact: 'High',
    mitigation: 'Integrate SAST/DAST tools, security champions program',
    owner: 'Security Lead',
    cost: '$60k/year tools + training'
  }
]

// Focus areas
const focusAreas: FocusArea[] = [
  {
    name: 'Cloud Native Architecture',
    maturity: 4,
    maxMaturity: 5,
    evidence: ['I3', 'I9', 'I12'],
    notes: 'Kubernetes-based, auto-scaling, missing chaos engineering'
  },
  {
    name: 'API-First Design',
    maturity: 5,
    maxMaturity: 5,
    evidence: ['A1', 'A4'],
    notes: 'RESTful + GraphQL APIs, OpenAPI specs, versioning strategy'
  },
  {
    name: 'Data Privacy & Compliance',
    maturity: 4,
    maxMaturity: 5,
    evidence: ['P2', 'P5'],
    notes: 'GDPR/CCPA compliant, SOC2 Type II, pending ISO 27001'
  },
  {
    name: 'DevOps Maturity',
    maturity: 3,
    maxMaturity: 5,
    evidence: ['D5', 'D11'],
    notes: 'Good CI/CD, lacks full observability and auto-rollback'
  },
  {
    name: 'Test Coverage',
    maturity: 4,
    maxMaturity: 5,
    evidence: ['T6', 'T8'],
    notes: '72% line coverage, comprehensive integration tests'
  }
]

// Roadmap data
const roadmapData: Roadmap[] = [
  {
    phase: 'Phase 1',
    timeframe: '0-6 months',
    initiatives: [
      'Implement multi-AZ redundancy for critical services',
      'Migrate 30% of Scala collectors to Go',
      'Deploy comprehensive observability stack',
      'Achieve ISO 27001 certification'
    ],
    expectedImpact: '+15% reliability, -20% operational costs',
    investment: '$380k CapEx, $25k/mo OpEx'
  },
  {
    phase: 'Phase 2',
    timeframe: '6-18 months',
    initiatives: [
      'Complete collector migration to microservices',
      'Launch real-time ML anomaly detection',
      'Implement chaos engineering practices',
      'Expand to APAC with local data residency'
    ],
    expectedImpact: '+40% processing capacity, new enterprise tier',
    investment: '$1.2M R&D, $60k/mo infrastructure'
  },
  {
    phase: 'Phase 3',
    timeframe: '18+ months',
    initiatives: [
      'Edge computing for sub-100ms latency',
      'AI-powered data quality monitoring',
      'Blockchain-based audit trail option',
      'Quantum-resistant encryption upgrade'
    ],
    expectedImpact: 'Market leadership in real-time analytics',
    investment: '$2.5M total, self-funding via new revenue'
  }
]

// Chart data for radar
const radarData = scoringData.map(cat => ({
  category: cat.name.split('/')[0].trim(),
  score: cat.rawScore,
  fullMark: 100
}))

// Financial metrics
const financialMetrics = {
  infraCostPerUser: 0.43,
  peerMedian: 0.65,
  rdPercentOfARR: 42,
  ruleOf40Score: 67,
  cacPayback: 14,
  netRetention: 118,
  grossChurn: 8
}

export default function PETechDiligenceReportPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }


  const decision = totalScore >= 70 ? 'Proceed with Conditions' : 'Further Analysis Required'
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
              Target: <span className="font-semibold text-electric-teal">Snowplow Analytics</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-sm text-muted-foreground">Investment Thesis: SaaS Growth Platform</p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Analysis</TabsTrigger>
          <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
          <TabsTrigger value="technical">Technical Focus</TabsTrigger>
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
          <TabsTrigger value="roadmap">Value Creation</TabsTrigger>
        </TabsList>

        {/* Executive Summary */}
        <TabsContent value="summary" className="space-y-6">
          {/* Investment Memo */}
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
                  Snowplow Analytics exemplifies our SaaS Growth Platform thesis with its modern event streaming 
                  architecture, proven scalability (processing 5B+ events/day for enterprise clients), and strong 
                  product-market fit in the $8.2B behavioral analytics TAM. The company's cloud-native design and 
                  40% YoY growth align perfectly with our focus on technically differentiated, high-growth B2B SaaS 
                  platforms ready for international expansion.
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
                            stroke="#10b981" 
                            fill="#10b981" 
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
                        Best-in-class event streaming architecture with 99.95% uptime 
                        <Badge variant="outline" className="ml-1 text-xs">⟦T4,T6⟧</Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Multi-region ready with GDPR/CCPA compliance built-in 
                        <Badge variant="outline" className="ml-1 text-xs">⟦M2,M8⟧</Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Strong engineering culture: 72% test coverage, 3.2 deploys/day 
                        <Badge variant="outline" className="ml-1 text-xs">⟦D5,T8⟧</Badge>
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
                        Single-AZ dependencies create potential downtime risk 
                        <Badge variant="outline" className="ml-1 text-xs">⟦R-01⟧</Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Legacy Scala collectors need refactoring (23% high complexity) 
                        <Badge variant="outline" className="ml-1 text-xs">⟦C5,R-02⟧</Badge>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">
                        Limited security automation in deployment pipeline 
                        <Badge variant="outline" className="ml-1 text-xs">⟦R-04⟧</Badge>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Decision Snapshot */}
              <Card className={`border-2 ${totalScore >= 70 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Investment Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`${decisionColor} text-sm px-3 py-1`}>
                      {decision}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Score: {totalScore.toFixed(1)}% (Threshold: 70%)
                    </span>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-sm mb-2">Key Conditions Precedent:</p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        Deploy multi-AZ redundancy for critical services (Q1 2024)
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        Complete SOC2 Type II certification (within 6 months)
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        Hire VP of Security and implement SAST/DAST pipeline
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-sm mb-2">Next Steps:</p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Management presentation on technical roadmap
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Customer reference calls (3 enterprise clients)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Technical deep-dive with engineering leadership
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Analysis */}
        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weighted Scoring Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of scoring across key investment criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Raw Score</TableHead>
                    <TableHead>Weighted Score</TableHead>
                    <TableHead>Evidence Refs</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoringData.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.weight}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getScoreColor(category.rawScore)}>
                            {category.rawScore}
                          </span>
                          <Progress value={category.rawScore} className="w-16 h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {category.weightedScore.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {category.evidenceRefs.map(ref => (
                            <Badge key={ref} variant="outline" className="text-xs">
                              ⟦{ref}⟧
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {category.comment}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className={getScoreColor(totalScore)}>
                      {totalScore.toFixed(1)} / 100
                    </TableCell>
                    <TableCell colSpan={2}>
                      <Badge className={totalScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {totalScore >= 70 ? 'Pass' : 'Below'} Threshold (70%)
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Visual Score Breakdown */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Score Contribution by Category</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoringData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rawScore" fill="#10b981" name="Raw Score" />
                      <Bar dataKey="weightedScore" fill="#06b6d4" name="Weighted Contribution" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deep Dive Sections */}
        <TabsContent value="deepdive" className="space-y-6">
          {/* Cloud Architecture Deep Dive */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Cloud Architecture Scalability (Weight: 30%)
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('cloud-arch')}
                >
                  {expandedSections.includes('cloud-arch') ? 'Collapse' : 'Expand'}
                </Button>
              </CardTitle>
              <CardDescription>
                Infrastructure must elastically support 10× user load without margin compression
              </CardDescription>
            </CardHeader>
            {expandedSections.includes('cloud-arch') && (
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Findings</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evidence</TableHead>
                        <TableHead>Observation</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline">⟦I3⟧</Badge>
                        </TableCell>
                        <TableCell>Kubernetes cluster with HPA; 50% CPU headroom</TableCell>
                        <TableCell>
                          <span className="text-green-600">↑ Positive</span>
                        </TableCell>
                        <TableCell className="font-semibold">+80</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline">⟦I7⟧</Badge>
                        </TableCell>
                        <TableCell>Single-AZ Redis cache for session data</TableCell>
                        <TableCell>
                          <span className="text-red-600">↓ Risk - SPOF</span>
                        </TableCell>
                        <TableCell className="font-semibold">-10</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline">⟦I9⟧</Badge>
                        </TableCell>
                        <TableCell>Multi-region deployment with &lt;100ms latency</TableCell>
                        <TableCell>
                          <span className="text-green-600">↑ Positive</span>
                        </TableCell>
                        <TableCell className="font-semibold">+15</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Net Sub-Score</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-green-600">85</span>
                      <span className="text-muted-foreground">/ 100</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contributes 25.5 points to overall score
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Recommendations & Cost</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Multi-AZ Redis: $3k/mo OpEx</li>
                      <li>• Chaos engineering: $45k one-time</li>
                      <li>• CDN optimization: $8k/mo savings</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Roadmap Alignment</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitBranch className="h-4 w-4" />
                    Links to backlog items: INFRA-234, INFRA-245, INFRA-267
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Development Velocity Deep Dive */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Development Velocity & Pipeline (Weight: 25%)
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('dev-velocity')}
                >
                  {expandedSections.includes('dev-velocity') ? 'Collapse' : 'Expand'}
                </Button>
              </CardTitle>
              <CardDescription>
                Engineering productivity and deployment capabilities assessment
              </CardDescription>
            </CardHeader>
            {expandedSections.includes('dev-velocity') && (
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">DORA Metrics & CI/CD Analysis</h4>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Deploy Frequency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">3.2/day</p>
                        <p className="text-xs text-muted-foreground">Elite performer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Lead Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-yellow-600">2.3 days</p>
                        <p className="text-xs text-muted-foreground">High performer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">MTTR</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-600">42 min</p>
                        <p className="text-xs text-muted-foreground">Elite performer</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Change Failure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-yellow-600">8%</p>
                        <p className="text-xs text-muted-foreground">High performer</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Test Coverage Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Unit Tests</span>
                      <span className="font-medium">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span>Integration Tests</span>
                      <span className="font-medium">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span>E2E Tests</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Bottlenecks & Quick Wins</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <span>E2E test suite takes 45min - parallelize for 15min target</span>
                    </li>
                    <li className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <span>No automated rollback strategy - implement feature flags</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>Strong PR review culture - avg 2.1 reviewers per PR</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Market Expansion Readiness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Market Expansion Readiness (Weight: 25%)
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('market-expansion')}
                >
                  {expandedSections.includes('market-expansion') ? 'Collapse' : 'Expand'}
                </Button>
              </CardTitle>
              <CardDescription>
                Internationalization, compliance, and partner ecosystem assessment
              </CardDescription>
            </CardHeader>
            {expandedSections.includes('market-expansion') && (
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3">Internationalization Status</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Multi-language support (12 languages)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Multi-currency billing (USD, EUR, GBP, JPY)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Regional data residency (US, EU, APAC)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span>Limited APAC presence (opportunity)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Compliance & Certifications</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>GDPR & CCPA compliant</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>SOC2 Type I (Type II in progress)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-600" />
                        <span>ISO 27001 planned Q2 2024</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span>HIPAA not required (non-healthcare)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Partner Ecosystem</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Technology Partners</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">23</p>
                        <p className="text-xs text-muted-foreground">AWS, GCP, Azure, Databricks</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Channel Partners</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">8</p>
                        <p className="text-xs text-muted-foreground">15% of revenue</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">ISV Integrations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">45+</p>
                        <p className="text-xs text-muted-foreground">Salesforce, HubSpot, Segment</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Code Quality Deep Dive */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Quality & Technical Debt (Weight: 20%)
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('code-quality')}
                >
                  {expandedSections.includes('code-quality') ? 'Collapse' : 'Expand'}
                </Button>
              </CardTitle>
              <CardDescription>
                Static analysis, complexity metrics, and refactoring priorities
              </CardDescription>
            </CardHeader>
            {expandedSections.includes('code-quality') && (
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Static Analysis Results</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Cyclomatic Complexity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">23% of methods &gt;15</p>
                        <p className="text-xs text-muted-foreground">Target: &lt;20%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Code Duplication</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">4.2% duplicated</p>
                        <p className="text-xs text-muted-foreground">Industry avg: 5-8%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Security Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">3 high, 12 medium</p>
                        <p className="text-xs text-muted-foreground">No critical issues</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Technical Debt Hotspots</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Debt Score</TableHead>
                        <TableHead>Refactor Effort</TableHead>
                        <TableHead>Business Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Legacy Scala Collectors</TableCell>
                        <TableCell>
                          <Badge variant="destructive">High</Badge>
                        </TableCell>
                        <TableCell>~400 hours</TableCell>
                        <TableCell>Performance +30%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Event Validation Service</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Medium</Badge>
                        </TableCell>
                        <TableCell>~200 hours</TableCell>
                        <TableCell>Reliability +15%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>API Gateway</TableCell>
                        <TableCell>
                          <Badge variant="outline">Low</Badge>
                        </TableCell>
                        <TableCell>~80 hours</TableCell>
                        <TableCell>Latency -20ms</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Refactor ROI Model</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Estimated payback period: 14 months based on reduced incidents and improved velocity
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total refactoring investment:</span>
                        <span className="font-medium">$180k (680 eng hours)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual savings (reduced incidents):</span>
                        <span className="font-medium">$95k</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Velocity improvement value:</span>
                        <span className="font-medium">$60k/year</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Technical Focus Areas */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Focus Area Assessment</CardTitle>
              <CardDescription>
                Maturity evaluation of key technical capabilities aligned with investment thesis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Maturity Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Focus Area</TableHead>
                      <TableHead>Maturity</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {focusAreas.map((area) => (
                      <TableRow key={area.name}>
                        <TableCell className="font-medium">{area.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-2 h-8 rounded-sm ${
                                    i < area.maturity 
                                      ? 'bg-green-500' 
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">
                              {area.maturity} / {area.maxMaturity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {area.evidence.map(ref => (
                              <Badge key={ref} variant="outline" className="text-xs">
                                ⟦{ref}⟧
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          {area.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Visual Summary */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Overall Technical Maturity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <div className="text-4xl font-bold">
                            {((focusAreas.reduce((sum, area) => sum + area.maturity, 0) / 
                              focusAreas.reduce((sum, area) => sum + area.maxMaturity, 0)) * 100).toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground text-center mt-1">
                            Technical Maturity Score
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Key Strengths & Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Strengths:</p>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              API-First Design (5/5)
                            </li>
                            <li className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Cloud Native Architecture (4/5)
                            </li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-600 mb-1">Improvement Areas:</p>
                          <ul className="text-sm space-y-1">
                            <li className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              DevOps Maturity (3/5)
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Financial & KPI Cross-Checks</CardTitle>
              <CardDescription>
                Key SaaS metrics compared to industry benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Infra $ per User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      ${financialMetrics.infraCostPerUser}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      vs peer median ${financialMetrics.peerMedian}
                    </p>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      34% below median
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">R&D % of ARR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{financialMetrics.rdPercentOfARR}%</p>
                    <p className="text-xs text-muted-foreground">
                      Healthy for growth stage
                    </p>
                    <Progress value={42} className="mt-2 h-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Rule of 40</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {financialMetrics.ruleOf40Score}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Growth: 40% + FCF: 27%
                    </p>
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      Excellent
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">CAC Payback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{financialMetrics.cacPayback} mo</p>
                    <p className="text-xs text-muted-foreground">
                      NRR: {financialMetrics.netRetention}%
                    </p>
                    <div className="text-xs mt-1">
                      Churn: {financialMetrics.grossChurn}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Data Room Required:</span>
                  <span className="text-muted-foreground">
                    Detailed cohort analysis, customer concentration, and expansion revenue metrics
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Register */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register & Mitigations</CardTitle>
              <CardDescription>
                Identified technical and operational risks with mitigation strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead>Risk Description</TableHead>
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
                      <TableCell className="max-w-xs">
                        <p className="text-sm font-medium">{risk.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            risk.likelihood === 'High' ? 'border-red-200 text-red-700' :
                            risk.likelihood === 'Medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }
                        >
                          {risk.likelihood}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            risk.impact === 'High' ? 'border-red-200 text-red-700' :
                            risk.impact === 'Medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }
                        >
                          {risk.impact}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">{risk.mitigation}</TableCell>
                      <TableCell className="text-sm">{risk.owner}</TableCell>
                      <TableCell className="text-sm font-mono">{risk.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Risk Matrix */}
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Risk Heat Map</h3>
                <div className="grid grid-cols-4 gap-2">
                  <div></div>
                  <div className="text-center text-sm font-medium">Low Impact</div>
                  <div className="text-center text-sm font-medium">Medium Impact</div>
                  <div className="text-center text-sm font-medium">High Impact</div>
                  
                  <div className="text-sm font-medium">High Likelihood</div>
                  <div className="bg-yellow-100 h-20 rounded flex items-center justify-center"></div>
                  <div className="bg-orange-100 h-20 rounded flex items-center justify-center">
                    <Badge>R-02</Badge>
                  </div>
                  <div className="bg-red-100 h-20 rounded flex items-center justify-center"></div>
                  
                  <div className="text-sm font-medium">Med Likelihood</div>
                  <div className="bg-green-100 h-20 rounded flex items-center justify-center"></div>
                  <div className="bg-yellow-100 h-20 rounded flex items-center justify-center"></div>
                  <div className="bg-orange-100 h-20 rounded flex items-center justify-center">
                    <div className="flex flex-col gap-1">
                      <Badge>R-01</Badge>
                      <Badge>R-04</Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium">Low Likelihood</div>
                  <div className="bg-green-50 h-20 rounded flex items-center justify-center"></div>
                  <div className="bg-green-100 h-20 rounded flex items-center justify-center">
                    <Badge>R-03</Badge>
                  </div>
                  <div className="bg-yellow-100 h-20 rounded flex items-center justify-center"></div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Mitigation Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">$225k</p>
                    <p className="text-xs text-muted-foreground">One-time: $165k, Recurring: $60k/yr</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">High Priority Risks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">2</p>
                    <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">Medium</p>
                    <p className="text-xs text-muted-foreground">Manageable with proper mitigation</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Value Creation Roadmap */}
        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Value Creation Roadmap</CardTitle>
              <CardDescription>
                Thesis-aligned technical initiatives with expected ROI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {roadmapData.map((phase, index) => (
                <div key={phase.phase} className="relative">
                  {index < roadmapData.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-electric-teal text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{phase.phase}</h3>
                        <Badge variant="outline">{phase.timeframe}</Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Key Initiatives</h4>
                          <ul className="space-y-1">
                            {phase.initiatives.map((initiative, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{initiative}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-1">Expected Impact</h4>
                            <p className="text-sm text-green-600">{phase.expectedImpact}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">Investment Required</h4>
                            <p className="text-sm text-muted-foreground">{phase.investment}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ROI Summary */}
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardHeader>
                  <CardTitle className="text-base">Value Creation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Investment</p>
                      <p className="text-2xl font-bold">$4.1M</p>
                      <p className="text-xs text-muted-foreground">Over 24 months</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected ARR Uplift</p>
                      <p className="text-2xl font-bold text-green-600">+$12M</p>
                      <p className="text-xs text-muted-foreground">By year 3</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">EBITDA Impact</p>
                      <p className="text-2xl font-bold text-green-600">+8%</p>
                      <p className="text-xs text-muted-foreground">Margin expansion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Conclusion */}
          <Card>
            <CardHeader>
              <CardTitle>Conclusion & Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{totalScore.toFixed(1)}%</div>
                <div>
                  <p className="text-sm text-muted-foreground">Weighted Score vs 70% Threshold</p>
                  <Badge className={decisionColor}>
                    {decision}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Investment Committee Recommendation</h4>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Proceed with Investment - Subject to Conditions
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Conditions Precedent</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Badge className="mt-0.5">1</Badge>
                    <span>Deploy multi-AZ redundancy for critical services within 90 days post-close</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-0.5">2</Badge>
                    <span>Complete SOC2 Type II certification within 6 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-0.5">3</Badge>
                    <span>Hire VP of Security and implement comprehensive SAST/DAST pipeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-0.5">4</Badge>
                    <span>Begin phased migration of legacy Scala collectors (30% in first 6 months)</span>
                  </li>
                </ul>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Post-Investment Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      <li>• Technical advisor from portfolio</li>
                      <li>• Quarterly architecture reviews</li>
                      <li>• Access to PE tech talent network</li>
                      <li>• Shared security/compliance resources</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Value Creation Priorities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      <li>• APAC expansion (Q2-Q3)</li>
                      <li>• Enterprise tier features</li>
                      <li>• AI/ML capabilities</li>
                      <li>• Strategic acquisitions</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}