import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle,
  CheckCircle,
  Code,
  Cloud,
  GitBranch,
  Info,
  Shield,
  Target,
  TrendingUp,
  Zap,
  XCircle,
  Gauge
} from 'lucide-react'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { type Evidence } from '@/components/reports/EvidenceCitation'
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
  Tooltip
} from 'recharts'
import { cn } from '@/lib/utils'

// Mock evidence data for OneZero
const evidenceData: Evidence[] = [
  {
    id: 'T1',
    title: 'Hybrid Infrastructure Architecture Analysis',
    source: 'Infrastructure Deep Dive',
    excerpt: 'OneZero maintains a hybrid cloud-on-premise architecture optimized for financial workloads. 60% cloud-based with AWS primary, 40% on-premise for compliance. Multi-region deployment across NA, EU, and APAC.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: 'T3',
    title: 'Technology Stack Assessment',
    source: 'Code Repository Analysis',
    excerpt: 'Java Spring Boot microservices (70%), Python data services (20%), React/TypeScript frontend (10%). Modern but conservative tech choices appropriate for financial services.',
    type: 'code',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: 'M1',
    title: 'Real-time Transaction Processing',
    source: 'Performance Metrics',
    excerpt: 'Processing 2M+ transactions daily with 99.95% uptime. Average latency 47ms for core transactions. Kafka-based event streaming handles peak loads of 50K TPS.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 92
    }
  },
  {
    id: 'M5',
    title: 'Security & Compliance Status',
    source: 'Compliance Audit',
    excerpt: 'SOC2 Type II, PCI-DSS Level 1, ISO 27001 certified. Passed 2023 regulatory audits with zero critical findings. Advanced threat detection with 0 breaches in 3 years.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
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
  }
]

// Function to handle evidence citations
const handleEvidenceClick = (evidenceId: string, setSelectedEvidence: (evidence: Evidence | null) => void) => {
  const evidence = evidenceData.find(e => e.id === evidenceId)
  if (evidence) {
    setSelectedEvidence(evidence)
  }
}

// Radar chart data
const techStackData = [
  { area: 'Architecture', score: 75, fullMark: 100 },
  { area: 'Security', score: 85, fullMark: 100 },
  { area: 'Performance', score: 78, fullMark: 100 },
  { area: 'Scalability', score: 70, fullMark: 100 },
  { area: 'Innovation', score: 65, fullMark: 100 },
  { area: 'Maintainability', score: 72, fullMark: 100 }
]

// Risk matrix data
const riskData = [
  { name: 'Technical Debt', impact: 7, likelihood: 6, mitigation: 'Gradual microservices migration' },
  { name: 'Vendor Lock-in', impact: 5, likelihood: 7, mitigation: 'Multi-cloud strategy implementation' },
  { name: 'Talent Retention', impact: 8, likelihood: 4, mitigation: 'Competitive compensation & culture' },
  { name: 'Security Threats', impact: 9, likelihood: 3, mitigation: 'Advanced threat detection systems' },
  { name: 'Scalability', impact: 6, likelihood: 5, mitigation: 'Kubernetes adoption planned' }
]

export default function AdminPETechDiligenceReportOneZero() {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [activeTab, setActiveTab] = useState('executive-summary')

  const getRiskColor = (impact: number, likelihood: number) => {
    const riskScore = impact * likelihood
    if (riskScore >= 40) return 'text-red-600 bg-red-50'
    if (riskScore >= 20) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OneZero Financial Systems</h1>
          <p className="text-muted-foreground">Private Equity Technical Due Diligence Report</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">PE Tech Diligence</Badge>
          <Badge className="bg-green-500">Completed</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tech Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">72</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Progress value={72} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Investment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">65</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Progress value={65} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">Medium</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">5 critical issues identified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-xl font-bold">Pass</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">With conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="executive-summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="executive-summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Recommendation: PASS with Conditions</span>
                </div>
                <p className="text-sm text-blue-800">
                  OneZero Financial Systems represents a mature, stable technology investment with solid fundamentals 
                  but limited growth potential. Recommended for value-focused or turnaround strategies.
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">Executive Summary</h3>
              <p className="text-muted-foreground mb-4">
                OneZero Financial Systems demonstrates solid technical fundamentals appropriate for a mature financial 
                services platform. The company operates critical payment infrastructure processing $450M+ daily volume 
                with{' '}
                <button
                  className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                  onClick={() => handleEvidenceClick('M1', setSelectedEvidence)}
                >
                  99.95% reliability
                  <sup className="text-xs">[1]</sup>
                </button>
                . While the technology stack is conservative and shows signs of technical debt, 
                it's well-suited to the risk-averse financial services market.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Key Strengths</h3>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Mission-critical system with proven{' '}
                    <button
                      className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                      onClick={() => handleEvidenceClick('M1', setSelectedEvidence)}
                    >
                      99.95% uptime over 3 years
                      <sup className="text-xs">[1]</sup>
                    </button>
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Strong compliance posture with{' '}
                    <button
                      className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                      onClick={() => handleEvidenceClick('M5', setSelectedEvidence)}
                    >
                      SOC2, PCI-DSS, and ISO certifications
                      <sup className="text-xs">[4]</sup>
                    </button>
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Experienced team with deep financial services domain expertise</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Stable, profitable operations with 15-20% EBITDA margins</span>
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Key Concerns</h3>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Aging monolithic architecture requires modernization investment based on{' '}
                    <button
                      className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                      onClick={() => handleEvidenceClick('T1', setSelectedEvidence)}
                    >
                      infrastructure analysis
                      <sup className="text-xs">[2]</sup>
                    </button>
                  </span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Limited API ecosystem constrains partnership opportunities</span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Below-market engineering velocity due to{' '}
                    <button
                      className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                      onClick={() => handleEvidenceClick('D3', setSelectedEvidence)}
                    >
                      legacy CI/CD constraints
                      <sup className="text-xs">[5]</sup>
                    </button>
                  </span>
                </li>
                <li className="flex gap-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>Talent retention risk with dated tech stack</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Investment Thesis */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Thesis Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Growth Potential
                    </h4>
                    <Progress value={45} />
                    <p className="text-sm text-muted-foreground">
                      Limited organic growth without significant platform modernization. 
                      API expansion could unlock partner revenue streams.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Risk Profile
                    </h4>
                    <Progress value={65} />
                    <p className="text-sm text-muted-foreground">
                      Medium risk due to technical debt and modernization requirements. 
                      Strong compliance reduces regulatory risk.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h5 className="font-medium mb-2">Value Creation Opportunity</h5>
                    <p className="text-2xl font-bold text-green-600">$12-15M</p>
                    <p className="text-sm text-muted-foreground">Through modernization & expansion</p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Investment Required</h5>
                    <p className="text-2xl font-bold text-yellow-600">$5-7M</p>
                    <p className="text-sm text-muted-foreground">Platform modernization</p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Time to Value</h5>
                    <p className="text-2xl font-bold">18-24</p>
                    <p className="text-sm text-muted-foreground">Months</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technology Assessment Tab */}
        <TabsContent value="technology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={techStackData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="area" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Core Technology Stack
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Based on{' '}
                    <button
                      className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                      onClick={() => handleEvidenceClick('T3', setSelectedEvidence)}
                    >
                      code repository analysis
                      <sup className="text-xs">[3]</sup>
                    </button>
                    :
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground">Backend</h5>
                      <ul className="mt-1 space-y-1 text-sm">
                        <li>• Java 11 with Spring Boot 2.5 (70%)</li>
                        <li>• Python 3.8 for data processing (20%)</li>
                        <li>• Legacy Java 8 services (10%)</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-muted-foreground">Frontend</h5>
                      <ul className="mt-1 space-y-1 text-sm">
                        <li>• React 17 with TypeScript</li>
                        <li>• Material-UI component library</li>
                        <li>• Redux for state management</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Development Practices
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Practice</TableHead>
                        <TableHead>Current State</TableHead>
                        <TableHead>Industry Standard</TableHead>
                        <TableHead>Gap</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Test Coverage</TableCell>
                        <TableCell>
                          <button
                            className="text-blue-600 underline hover:text-blue-800"
                            onClick={() => handleEvidenceClick('D3', setSelectedEvidence)}
                          >
                            68%
                          </button>
                        </TableCell>
                        <TableCell>80%+</TableCell>
                        <TableCell><Badge variant="outline" className="text-yellow-600">Medium</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Deployment Frequency</TableCell>
                        <TableCell>Monthly</TableCell>
                        <TableCell>Daily/Weekly</TableCell>
                        <TableCell><Badge variant="outline" className="text-red-600">High</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Code Review</TableCell>
                        <TableCell>100% PR coverage</TableCell>
                        <TableCell>100%</TableCell>
                        <TableCell><Badge variant="outline" className="text-green-600">None</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>CI/CD Automation</TableCell>
                        <TableCell>Partial (60%)</TableCell>
                        <TableCell>Full automation</TableCell>
                        <TableCell><Badge variant="outline" className="text-yellow-600">Medium</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Debt Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Debt Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    Estimated Technical Debt: $3.5M - $5M
                  </p>
                  <p className="text-sm text-yellow-800">
                    Based on code complexity, outdated dependencies, and architectural limitations
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">Monolithic Architecture</p>
                        <p className="text-sm text-muted-foreground">Core payment system tightly coupled</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Legacy Dependencies</p>
                        <p className="text-sm text-muted-foreground">30% of libraries are EOL</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">High</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Database Design</p>
                        <p className="text-sm text-muted-foreground">Needs optimization for scale</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-yellow-600">Medium</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      Cloud Architecture
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      According to{' '}
                      <button
                        className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                        onClick={() => handleEvidenceClick('T1', setSelectedEvidence)}
                      >
                        infrastructure analysis
                        <sup className="text-xs">[2]</sup>
                      </button>
                      :
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Primary Cloud</span>
                        <span className="font-medium">AWS (60%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On-Premise</span>
                        <span className="font-medium">40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Multi-Region</span>
                        <span className="font-medium">3 Regions</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DR Strategy</span>
                        <span className="font-medium">Active-Passive</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Performance Metrics
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Uptime (12mo)</span>
                        <span className="font-medium text-green-600">
                          <button
                            className="text-green-600 underline hover:text-green-800"
                            onClick={() => handleEvidenceClick('M1', setSelectedEvidence)}
                          >
                            99.95%
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Response Time</span>
                        <span className="font-medium">47ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peak TPS</span>
                        <span className="font-medium">50,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Transactions</span>
                        <span className="font-medium">2M+</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Infrastructure Costs</h4>
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
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="font-semibold mb-3">Scalability Assessment</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Horizontal Scaling</p>
                      <p className="text-sm text-muted-foreground">Application tier scales well with load balancing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">Database Scaling</p>
                      <p className="text-sm text-muted-foreground">Current architecture limits to vertical scaling only</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Info className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Caching Strategy</p>
                      <p className="text-sm text-muted-foreground">Redis implementation reduces database load by 60%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold">SOC2 Type II</p>
                  <p className="text-sm text-muted-foreground">Certified 2023</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold">PCI-DSS Level 1</p>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-semibold">ISO 27001</p>
                  <p className="text-sm text-muted-foreground">Certified 2022</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Compliance status verified through{' '}
                <button
                  className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1"
                  onClick={() => handleEvidenceClick('M5', setSelectedEvidence)}
                >
                  audit reports
                  <sup className="text-xs">[4]</sup>
                </button>
              </p>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Security Posture Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vulnerability Management</span>
                      <Progress value={85} className="w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Access Control</span>
                      <Progress value={90} className="w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Encryption</span>
                      <Progress value={95} className="w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Incident Response</span>
                      <Progress value={75} className="w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Security Training</span>
                      <Progress value={70} className="w-32" />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Recent Security Findings</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Finding</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resolution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Outdated SSL certificates on dev servers</TableCell>
                        <TableCell><Badge variant="outline" className="text-yellow-600">Medium</Badge></TableCell>
                        <TableCell>Resolved</TableCell>
                        <TableCell>Auto-renewal implemented</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Weak password policy for service accounts</TableCell>
                        <TableCell><Badge variant="outline" className="text-yellow-600">Medium</Badge></TableCell>
                        <TableCell>In Progress</TableCell>
                        <TableCell>Q1 2024</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Missing MFA for admin accounts</TableCell>
                        <TableCell><Badge variant="outline" className="text-red-600">High</Badge></TableCell>
                        <TableCell>Resolved</TableCell>
                        <TableCell>100% MFA coverage</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Investment Decision</h4>
                  <p className="text-blue-800">
                    PASS with conditions - OneZero represents a stable, profitable investment suitable for 
                    value-focused strategies. Success requires commitment to platform modernization.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Critical Actions (0-6 months)</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 border rounded-lg">
                      <div className="bg-red-100 rounded-full p-2 h-fit">
                        <Zap className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Implement Microservices Migration Plan</p>
                        <p className="text-sm text-muted-foreground">
                          Begin decomposing monolith starting with payment processing module
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Investment:</span> $1.5M | 
                          <span className="font-medium ml-2">Timeline:</span> 6 months | 
                          <span className="font-medium ml-2">Impact:</span> High
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 border rounded-lg">
                      <div className="bg-red-100 rounded-full p-2 h-fit">
                        <Shield className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Enhance API Gateway</p>
                        <p className="text-sm text-muted-foreground">
                          Build modern REST/GraphQL APIs to enable partner integrations
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Investment:</span> $800K | 
                          <span className="font-medium ml-2">Timeline:</span> 4 months | 
                          <span className="font-medium ml-2">Impact:</span> High
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Medium-term Initiatives (6-18 months)</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 p-3 border rounded-lg">
                      <div className="bg-yellow-100 rounded-full p-2 h-fit">
                        <Cloud className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Cloud-Native Transformation</p>
                        <p className="text-sm text-muted-foreground">
                          Migrate remaining on-premise workloads to AWS with Kubernetes
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 border rounded-lg">
                      <div className="bg-yellow-100 rounded-full p-2 h-fit">
                        <GitBranch className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">DevOps Maturity Enhancement</p>
                        <p className="text-sm text-muted-foreground">
                          Achieve daily deployments with full CI/CD automation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Risk Mitigation Matrix</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Risk</TableHead>
                        <TableHead>Impact</TableHead>
                        <TableHead>Likelihood</TableHead>
                        <TableHead>Mitigation Strategy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskData.map((risk) => (
                        <TableRow key={risk.name}>
                          <TableCell>{risk.name}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getRiskColor(risk.impact, risk.likelihood)
                            )}>
                              {risk.impact}/10
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getRiskColor(risk.impact, risk.likelihood)
                            )}>
                              {risk.likelihood}/10
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{risk.mitigation}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Value Creation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Value Creation Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="bg-blue-500 rounded-full p-2 z-10">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Q1-Q2 2024: Foundation</p>
                        <p className="text-sm text-muted-foreground">
                          Technical debt reduction, API development
                        </p>
                        <p className="text-sm mt-1">Expected Value: $2-3M cost savings</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-blue-500 rounded-full p-2 z-10">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">Q3-Q4 2024: Growth</p>
                        <p className="text-sm text-muted-foreground">
                          Partner integrations, new revenue streams
                        </p>
                        <p className="text-sm mt-1">Expected Value: $5M new revenue</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="bg-blue-500 rounded-full p-2 z-10">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">2025: Scale</p>
                        <p className="text-sm text-muted-foreground">
                          Full cloud migration, market expansion
                        </p>
                        <p className="text-sm mt-1">Expected Value: $8-10M incremental EBITDA</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={!!selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
        citation={selectedEvidence ? {
          id: selectedEvidence.id,
          claim: '',
          evidence: [selectedEvidence],
          reasoning: '',
          confidence: selectedEvidence.metadata?.confidence || 0,
          analyst: 'Technical Due Diligence Team',
          reviewDate: new Date().toISOString(),
          methodology: 'Direct analysis'
        } : {
          id: '',
          claim: '',
          evidence: [],
          reasoning: '',
          confidence: 0,
          analyst: '',
          reviewDate: '',
          methodology: ''
        }}
      />
    </div>
  )
}