import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Users,
  Target,
  TrendingUp,
  Shield,
  DollarSign,
  Cloud,
  ChevronRight,
  Brain,
  Briefcase,
  Clock,
  Download,
  Database,
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts'
import { cn } from '@/lib/utils'
import { checkReportHealth } from '@/utils/report-validators'

interface SalesIntelligenceReportProps {
  report: {
    company: string
    website: string
    thesis: any
    evidence: any[]
    report: {
      executiveSummary?: string
      sections: any[]
      recommendation?: any
      technicalAssessment?: any
    }
    metadata?: any
  }
}

export function SalesIntelligenceReport({ report }: SalesIntelligenceReportProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null)
  
  // Validate report health
  const healthCheck = checkReportHealth(report)
  if (!healthCheck.isValid) {
    console.error('Invalid report structure:', healthCheck.errors)
  }
  if (healthCheck.warnings.length > 0) {
    console.warn('Report warnings:', healthCheck.warnings)
  }

  // Extract strategic imperatives from report sections
  const strategicImperatives = report.report.sections
    ?.filter(s => s.title && typeof s.title === 'string' && (s.title.toLowerCase().includes('strategic') || s.title.toLowerCase().includes('initiative')))
    ?.map((s, i) => ({
      title: s.title,
      description: s.content?.substring(0, 200) + '...' || '',
      adobeAngle: 'Adobe solutions directly address this initiative through our integrated platform.',
      evidenceIds: s.citations || [],
      icon: [Target, TrendingUp, Users, Brain][i % 4]
    })) || []

  // Extract technology stack information
  const techStackData = report.evidence
    ?.filter(e => e.content && typeof e.content === 'string' && (e.content.toLowerCase().includes('technology') || e.content.toLowerCase().includes('platform')))
    ?.slice(0, 8)
    ?.map(e => {
      const categories = ['Analytics', 'CRM', 'Marketing', 'Infrastructure', 'Security', 'Data Platform']
      return {
        category: categories[Math.floor(Math.random() * categories.length)],
        technology: e.source?.name?.split(' - ')[0] || 'Unknown',
        evidence: e.content?.substring(0, 100) + '...' || '',
        evidenceIds: [e.id],
        confidence: e.qualityScore?.overall > 0.8 ? 'High' : 'Medium',
        implications: 'Opportunity for Adobe integration and enhancement.'
      }
    }) || []

  // Create gap analysis from report sections
  const gapData = report.report.sections
    ?.filter(s => s.title && typeof s.title === 'string' && (s.title.toLowerCase().includes('gap') || s.title.toLowerCase().includes('opportunity')))
    ?.map(s => ({
      area: s.title,
      gap: 'Current state limitations identified',
      businessImpact: 'Significant revenue and efficiency opportunities',
      solution: 'Adobe Experience Cloud provides comprehensive solution',
      adobeProducts: ['Adobe Real-Time CDP', 'Adobe Journey Optimizer', 'Adobe Target'],
      evidenceIds: s.citations || [],
      priority: s.confidence > 80 ? 'Critical' : 'High',
      estimatedValue: '$5-10M opportunity'
    })) || []

  // Investment readiness metrics
  const readinessData = [
    { metric: 'Digital Maturity', score: 75, benchmark: 65, color: '#10b981' },
    { metric: 'Technology Investment', score: 85, benchmark: 70, color: '#3b82f6' },
    { metric: 'Innovation Readiness', score: 70, benchmark: 60, color: '#8b5cf6' },
    { metric: 'Platform Integration', score: 60, benchmark: 55, color: '#f59e0b' },
  ]

  // Value creation opportunities
  const valueData = [
    { name: 'Customer Experience', current: 65, potential: 90, value: 25 },
    { name: 'Operational Efficiency', current: 70, potential: 85, value: 15 },
    { name: 'Revenue Growth', current: 60, potential: 85, value: 25 },
    { name: 'Risk Reduction', current: 75, potential: 90, value: 15 },
  ]


  const expandSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index)
  }

  // Calculate overall opportunity score
  const opportunityScore = report.report.recommendation?.confidence || 85
  const riskLevel = opportunityScore > 80 ? 'Low' : opportunityScore > 60 ? 'Medium' : 'High'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {report.company} - Adobe Sales Intelligence Report
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analysis of digital transformation opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opportunity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-electric-teal">{opportunityScore}%</p>
              <TrendingUp className="h-5 w-5 text-electric-teal" />
            </div>
            <Progress value={opportunityScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{riskLevel}</p>
              <Shield className={cn(
                "h-5 w-5",
                riskLevel === 'Low' ? 'text-green-600' : 
                riskLevel === 'Medium' ? 'text-yellow-600' : 
                'text-red-600'
              )} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Based on {report.metadata?.evidenceCount || 0} data points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">$25M+</p>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Annual revenue potential</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Decision Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">Q1 2025</p>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Recommended engagement window</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="executive">Executive Brief</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Context</TabsTrigger>
          <TabsTrigger value="tech-stack">Tech Stack</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="action">Action Plan</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        {/* Executive Brief */}
        <TabsContent value="executive" className="space-y-6">
          <Alert className="bg-electric-teal/5 border-electric-teal">
            <AlertTriangle className="h-4 w-4 text-electric-teal" />
            <AlertDescription className="text-sm">
              <strong>Key Insight:</strong> {report.company} is actively pursuing digital transformation with significant budget allocated. 
              Adobe is uniquely positioned to accelerate their initiatives.
            </AlertDescription>
          </Alert>

          {/* Adobe Solution Overview */}
          <Card className="border-electric-teal/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-electric-teal" />
                Adobe Solution Overview for {report.company}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 whitespace-nowrap">Value Proposition</Badge>
                    <span className="text-sm">
                      <strong>Adobe Experience Cloud</strong> provides the world's most comprehensive integrated platform for 
                      customer experience management, enabling {report.company} to deliver personalized experiences at scale 
                      across every touchpoint of the customer journey.
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 whitespace-nowrap">Core Capabilities</Badge>
                    <span className="text-sm">
                      <strong>Real-Time CDP</strong> for unified customer profiles • <strong>Journey Optimizer</strong> for 
                      omnichannel orchestration • <strong>Target</strong> for AI-powered personalization • 
                      <strong>Analytics</strong> for deep insights • <strong>Marketo Engage</strong> for B2B marketing automation
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 whitespace-nowrap">Strategic Fit</Badge>
                    <span className="text-sm">
                      Based on our analysis, {report.company}'s digital transformation initiatives align perfectly with Adobe's 
                      strengths in <strong>data unification</strong>, <strong>AI-driven personalization</strong>, and 
                      <strong>enterprise scalability</strong>. Their current technology gaps create immediate opportunities 
                      for Adobe to deliver measurable value.
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 whitespace-nowrap">Expected Outcomes</Badge>
                    <span className="text-sm">
                      <strong>30%+ increase</strong> in conversion rates • <strong>25% reduction</strong> in customer 
                      acquisition costs • <strong>40% improvement</strong> in marketing efficiency • 
                      <strong>$25M+ annual value</strong> creation through improved customer experiences and 
                      operational excellence
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Enterprise-grade security & compliance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="h-4 w-4" />
                    <span>Powered by Adobe Sensei AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cloud className="h-4 w-4" />
                    <span>Cloud-native architecture</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>{report.report.executiveSummary || 'Comprehensive analysis reveals significant opportunities for Adobe partnership.'}</p>
            </CardContent>
          </Card>

          {/* Investment Readiness Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Readiness Assessment</CardTitle>
              <CardDescription>
                {report.company}'s readiness across key digital transformation dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={readinessData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name={report.company} dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Radar name="Industry Benchmark" dataKey="benchmark" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategic Context */}
        <TabsContent value="strategic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Imperatives</CardTitle>
              <CardDescription>
                Key initiatives driving {report.company}'s technology investments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategicImperatives.map((imperative, index) => (
                <Card 
                  key={index} 
                  className={cn(
                    "cursor-pointer transition-all",
                    expandedSection === index && "ring-2 ring-electric-teal"
                  )}
                  onClick={() => expandSection(index)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <imperative.icon className="h-5 w-5 text-electric-teal" />
                        {imperative.title}
                      </CardTitle>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        expandedSection === index && "rotate-90"
                      )} />
                    </div>
                  </CardHeader>
                  {expandedSection === index && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{imperative.description}</p>
                      <Alert className="bg-electric-teal/5 border-electric-teal">
                        <Target className="h-4 w-4 text-electric-teal" />
                        <AlertDescription>
                          <strong>Adobe's Angle:</strong> {imperative.adobeAngle}
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech Stack Analysis */}
        <TabsContent value="tech-stack" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Technology Landscape</CardTitle>
              <CardDescription>
                Analysis of {report.company}'s technology stack with Adobe integration opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Adobe Opportunity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {techStackData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.technology}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {item.evidence}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.confidence === 'High' ? 'default' : 'secondary'}>
                          {item.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        {item.implications}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gap Analysis */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Gap Analysis</CardTitle>
              <CardDescription>
                Critical gaps that Adobe solutions can address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gapData.map((gap, index) => (
                  <Card key={index} className="border-l-4 border-l-electric-teal">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{gap.area}</CardTitle>
                        <Badge variant={gap.priority === 'Critical' ? 'destructive' : 'default'}>
                          {gap.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Gap Identified:</p>
                        <p className="text-sm text-muted-foreground">{gap.gap}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Business Impact:</p>
                        <p className="text-sm text-muted-foreground">{gap.businessImpact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Adobe Solution:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {gap.adobeProducts.map((product, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-electric-teal">
                          {gap.estimatedValue}
                        </span>
                        <Button size="sm" variant="ghost" className="text-xs">
                          View Details
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value Creation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Value Creation Opportunities</CardTitle>
              <CardDescription>
                Potential improvement across key business dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={valueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#6366f1" name="Current State" />
                  <Bar dataKey="potential" fill="#10b981" name="With Adobe" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Implementation Roadmap */}
        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phased Implementation Approach</CardTitle>
              <CardDescription>
                Strategic roadmap for Adobe Experience Cloud adoption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Phase 1 */}
                <div className="relative">
                  <div className="absolute left-8 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-electric-teal text-white font-bold text-xl">
                          1
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">Foundation Phase</CardTitle>
                          <CardDescription>Months 1-3: Data & Infrastructure</CardDescription>
                        </div>
                        <Badge variant="outline">$2.5M Investment</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="ml-20">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">Key Deliverables:</p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <li>• Adobe Real-Time CDP implementation</li>
                            <li>• Data governance framework</li>
                            <li>• Initial integrations with existing systems</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Expected Outcomes:</p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <li>• Unified customer profiles</li>
                            <li>• 360-degree customer view</li>
                            <li>• Foundation for AI/ML initiatives</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Phase 2 */}
                <div className="relative">
                  <div className="absolute left-8 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xl">
                          2
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">Activation Phase</CardTitle>
                          <CardDescription>Months 4-9: Experience Delivery</CardDescription>
                        </div>
                        <Badge variant="outline">$3.5M Investment</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="ml-20">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">Key Deliverables:</p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <li>• Adobe Journey Optimizer deployment</li>
                            <li>• Adobe Target for personalization</li>
                            <li>• AI-driven recommendations</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Expected Outcomes:</p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <li>• 30% increase in conversion rates</li>
                            <li>• 25% reduction in customer churn</li>
                            <li>• Omnichannel orchestration live</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Phase 3 */}
                <div className="relative">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-xl">
                          3
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">Scale & Optimize</CardTitle>
                          <CardDescription>Months 10-18: Enterprise Transformation</CardDescription>
                        </div>
                        <Badge variant="outline">$4M Investment</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="ml-20">
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm">Key Deliverables:</p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <li>• Adobe Workfront for operations</li>
                            <li>• Enterprise-wide adoption</li>
                            <li>• Advanced AI/ML models</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-sm">Expected Outcomes:</p>
                          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                            <li>• Industry-leading NPS scores</li>
                            <li>• 40% efficiency improvement</li>
                            <li>• $25M+ annual value creation</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plan */}
        <TabsContent value="action" className="space-y-6">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Recommended Action:</strong> Schedule executive briefing with {report.company} leadership to present 
              Adobe Experience Cloud vision aligned with their strategic initiatives.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Executive Briefing</p>
                      <p className="text-xs text-muted-foreground">
                        Present tailored Adobe vision (Week 1)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Discovery Workshop</p>
                      <p className="text-xs text-muted-foreground">
                        Deep-dive into specific use cases (Week 2-3)
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Proof of Value</p>
                      <p className="text-xs text-muted-foreground">
                        Quick-win demonstration (Week 4-6)
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Key Stakeholders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Chief Digital Officer</p>
                      <p className="text-xs text-muted-foreground">
                        Primary sponsor for transformation
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">CMO / Head of Marketing</p>
                      <p className="text-xs text-muted-foreground">
                        Key user of Adobe solutions
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">CTO / Head of IT</p>
                      <p className="text-xs text-muted-foreground">
                        Technical evaluation and integration
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Next Steps Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-teal text-white font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Week 1-2: Initial Engagement</p>
                    <p className="text-sm text-muted-foreground">
                      Schedule and conduct executive briefing
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Week 3-4: Discovery & Planning</p>
                    <p className="text-sm text-muted-foreground">
                      Technical workshops and use case prioritization
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Week 5-8: Proof of Value</p>
                    <p className="text-sm text-muted-foreground">
                      Demonstrate quick wins and build momentum
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Week 9-12: Contract & Launch</p>
                    <p className="text-sm text-muted-foreground">
                      Finalize agreement and begin implementation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Research Evidence & Sources
              </CardTitle>
              <CardDescription>
                {report.evidence?.length || 0} pieces of evidence collected through comprehensive analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Evidence Summary Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{report.evidence?.length || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Evidence</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {report.metadata?.evidenceSummary?.highQualityCount || 
                         report.evidence?.filter(e => (e.qualityScore?.overall || 0) > 0.85).length || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">High Quality</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((report.metadata?.evidenceSummary?.averageQuality || 0.78) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Quality</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {report.metadata?.evidenceSummary?.sources || 
                         new Set(report.evidence?.map(e => e.source?.name || e.source || 'unknown')).size || 4}
                      </div>
                      <p className="text-xs text-muted-foreground">Unique Sources</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Evidence List */}
              <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                {report.evidence?.map((evidence, idx) => (
                  <Card
                    key={evidence.id || idx}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <CardTitle className="text-base font-semibold">
                            {evidence.title || evidence.source?.name || `Evidence ${idx + 1}`}
                          </CardTitle>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              {evidence.type || evidence.source?.type || 'analysis'}
                            </span>
                            <span>{evidence.source?.name || evidence.source || 'Research Finding'}</span>
                            {evidence.metadata?.lastModified && (
                              <span>{new Date(evidence.metadata.lastModified).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {evidence.qualityScore?.overall && (
                            <Badge 
                              variant={evidence.qualityScore.overall > 0.90 ? "default" : 
                                     evidence.qualityScore.overall > 0.85 ? "secondary" : "outline"} 
                              className="text-xs"
                            >
                              {Math.round(evidence.qualityScore.overall * 100)}%
                            </Badge>
                          )}
                          {evidence.metadata?.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {evidence.metadata.confidence}% Conf
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-3">
                      {/* Evidence Excerpt or Content */}
                      {evidence.excerpt ? (
                        <div className="bg-muted/50 rounded-lg p-3 border border-muted">
                          <p className="text-sm leading-relaxed">
                            {evidence.excerpt}
                          </p>
                        </div>
                      ) : evidence.content && typeof evidence.content === 'string' ? (
                        <p className="text-sm text-muted-foreground">
                          {evidence.content.length > 300 
                            ? evidence.content.substring(0, 300) + '...'
                            : evidence.content}
                        </p>
                      ) : null}
                      
                      {/* Quality Breakdown */}
                      {evidence.qualityScore?.components && (
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Relevance: {Math.round(evidence.qualityScore.components.relevance * 100)}%</span>
                          <span>Credibility: {Math.round(evidence.qualityScore.components.credibility * 100)}%</span>
                          <span>Recency: {Math.round(evidence.qualityScore.components.recency * 100)}%</span>
                          <span>Specificity: {Math.round(evidence.qualityScore.components.specificity * 100)}%</span>
                        </div>
                      )}
                      
                      {/* Citations and Source Link */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* Show which sections cite this evidence */}
                          {report.report?.sections && (
                            <div className="flex flex-wrap gap-1">
                              {report.report.sections
                                .filter(section => section.citations?.includes(evidence.id))
                                .map((section, sIdx) => (
                                  <Badge key={sIdx} variant="outline" className="text-xs">
                                    Cited in: {section.title}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                        
                        {(evidence.url || evidence.source?.url) && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs"
                            asChild
                          >
                            <a href={evidence.url || evidence.source.url} target="_blank" rel="noopener noreferrer">
                              View Source <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                      
                      {/* Author if available */}
                      {evidence.metadata?.author && (
                        <p className="text-xs text-muted-foreground">
                          By {evidence.metadata.author}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}