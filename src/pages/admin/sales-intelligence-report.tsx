import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Users,
  Building,
  Target,
  TrendingUp,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { type Evidence, type Citation } from '@/components/reports/EvidenceCitation'

// Mock evidence data
const evidenceData: Evidence[] = [
  {
    id: '2.3',
    title: 'Adobe Experience Cloud Implementation',
    source: 'BMO Technology Assessment 2021',
    excerpt: 'BMO selected Adobe Experience Cloud in 2021. BMO Insurance adopted Adobe Target Standard in 2023.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      author: 'Tech Assessment Team',
      confidence: 90
    }
  },
  {
    id: '2.2',
    title: 'Analytics Infrastructure',
    source: 'Network Traffic Analysis',
    excerpt: 'First-party tracking implemented via smetrics.bmo.com subdomain. Adobe Analytics primary analytics platform.',
    type: 'web',
    url: 'https://smetrics.bmo.com',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: '3.1',
    title: 'Form Building Capabilities Gap',
    source: 'Product Comparison Analysis',
    excerpt: 'Adobe Experience Manager lacks advanced form building capabilities compared to specialized solutions.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      author: 'Product Analysis Team',
      confidence: 85
    }
  },
  {
    id: '3.2',
    title: 'Web Analytics Enhancement Opportunity',
    source: 'Analytics Platform Review',
    excerpt: 'Current Adobe Analytics implementation could benefit from enhanced user behavior tracking and predictive analytics.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 80
    }
  },
  {
    id: '3.3',
    title: 'Multi-Channel Personalization Need',
    source: 'Customer Journey Analysis',
    excerpt: 'Adobe Target provides web personalization but lacks unified cross-channel capabilities.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: '4.1',
    title: 'Digital Banking Manager Pain Points',
    source: 'Stakeholder Interviews',
    excerpt: 'Limited ability to create/modify forms without IT support. Cannot track user drop-off points effectively.',
    type: 'interview',
    metadata: {
      lastModified: new Date().toISOString(),
      author: 'User Research Team',
      confidence: 90
    }
  },
  {
    id: '4.2',
    title: 'CX Director Requirements',
    source: 'Executive Interviews',
    excerpt: 'Need unified customer journey visibility across all digital touchpoints. Require predictive analytics for proactive engagement.',
    type: 'interview',
    metadata: {
      lastModified: new Date().toISOString(),
      author: 'Executive Interview Team',
      confidence: 95
    }
  },
  {
    id: '5.1',
    title: 'Security Compliance Requirements',
    source: 'BMO Security Standards',
    excerpt: 'All solutions must meet bank-grade security standards. SOC2 Type II certification required.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 100
    }
  },
  {
    id: '6.1',
    title: 'Phase 1 Implementation Success',
    source: 'Pilot Results Analysis',
    excerpt: 'Form completion rates increased by 35% in pilot. User drop-off reduced by 40%.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: '6.2',
    title: 'Analytics ROI Projection',
    source: 'Financial Analysis',
    excerpt: 'Projected 20% reduction in campaign costs through better targeting. Expected 15% increase in conversion rates.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 80
    }
  }
]

// Create citations from evidence
const createCitation = (claim: string, evidenceIds: string[]): Citation => {
  const relevantEvidence = evidenceData.filter(e => evidenceIds.includes(e.id))
  return {
    id: `citation-${evidenceIds.join('-')}`,
    claim,
    evidence: relevantEvidence,
    reasoning: 'Based on comprehensive analysis of BMO\'s technology stack and business requirements.',
    confidence: 85,
    analyst: 'Sales Intelligence Team',
    reviewDate: new Date().toISOString(),
    methodology: 'Multi-source verification including web analysis, documentation review, and stakeholder interviews'
  }
}

// Data interfaces
interface TechStackItem {
  category: string
  technology: string
  evidence: string
  evidenceIds: string[]
  confidence: 'High' | 'Medium' | 'Low'
}

interface GapItem {
  area: string
  gap: string
  solution: string
  evidenceIds: string[]
}

interface PhaseData {
  phase: number
  title: string
  duration: string
  products: string
  pitch: string
  evidenceIds: string[]
}

interface PersonaData {
  id: string
  title: string
  pains: string
  solution: string
  talkingPoints: string
  evidenceIds: string[]
}

// Sample data
const techStackData: TechStackItem[] = [
  { 
    category: 'Web Content & Forms', 
    technology: 'Adobe Experience Manager (AEM)', 
    evidence: '2021 Adobe Experience Cloud selection, aemforms.qa.bmo.com subdomain found.', 
    evidenceIds: ['2.3'],
    confidence: 'High' 
  },
  { 
    category: 'Analytics', 
    technology: 'Adobe Analytics', 
    evidence: 'First-party tracking via smetrics.bmo.com.', 
    evidenceIds: ['2.2'],
    confidence: 'High' 
  },
  { 
    category: 'Analytics', 
    technology: 'Google Analytics / GTM', 
    evidence: 'GA/GTM scripts detected, indicating dual-tracking or legacy setup.', 
    evidenceIds: ['2.2'],
    confidence: 'High' 
  },
  { 
    category: 'Personalization', 
    technology: 'Adobe Target', 
    evidence: 'BMO Insurance adopted Target Standard in 2023.', 
    evidenceIds: ['2.3'],
    confidence: 'High' 
  },
  { 
    category: 'Personalization', 
    technology: 'Movable Ink', 
    evidence: 'Email content served from movableink.bmo.com indicates use for real-time personalization.', 
    evidenceIds: ['2.2'],
    confidence: 'High' 
  },
  { 
    category: 'CX Feedback', 
    technology: 'Qualtrics', 
    evidence: 'Scripts detected, suggesting use for on-site customer surveys.', 
    evidenceIds: ['2.2'],
    confidence: 'High' 
  },
  { 
    category: 'Marketing Automation', 
    technology: 'ClickDimensions', 
    evidence: 'Listed in tech profile; suggests use in a B2B/wealth context with MS Dynamics.', 
    evidenceIds: ['2.3'],
    confidence: 'Medium' 
  },
  { 
    category: 'Security', 
    technology: 'Wiz', 
    evidence: 'Cloud security platform detected in infrastructure.', 
    evidenceIds: ['5.1'],
    confidence: 'High' 
  }
]

const gapData: GapItem[] = [
  {
    area: 'Form Building',
    gap: 'AEM lacks advanced form building capabilities',
    solution: 'Feathery Forms: Modern form builder with conditional logic, integrations',
    evidenceIds: ['3.1', '4.1']
  },
  {
    area: 'Web Analytics',
    gap: 'Adobe Analytics limited in user behavior tracking',
    solution: 'Heap or Amplitude: Auto-capture events, user journey analysis',
    evidenceIds: ['3.2', '4.2']
  },
  {
    area: 'Personalization',
    gap: 'Adobe Target limited to web, lacks unified cross-channel',
    solution: 'Optimizely or Dynamic Yield: Omnichannel testing and personalization',
    evidenceIds: ['3.3', '4.2']
  },
  {
    area: 'CRM Integration',
    gap: 'Limited real-time sync between digital and CRM',
    solution: 'Segment or mParticle: Real-time CDP for unified customer profiles',
    evidenceIds: ['3.2', '4.2']
  }
]

const phaseData: PhaseData[] = [
  {
    phase: 1,
    title: 'Quick Win - Form Optimization',
    duration: '30-45 days',
    products: 'Feathery Forms + Heap Analytics',
    pitch: 'Reduce form abandonment by 40% with smart forms and behavioral tracking.',
    evidenceIds: ['6.1', '3.1', '4.1']
  },
  {
    phase: 2,
    title: 'Analytics Enhancement',
    duration: '60-90 days',
    products: 'Heap + Segment CDP',
    pitch: 'Complete customer journey visibility with predictive insights.',
    evidenceIds: ['6.2', '3.2', '4.2']
  },
  {
    phase: 3,
    title: 'Full Personalization',
    duration: '90-120 days',
    products: 'Optimizely + AI/ML Tools',
    pitch: 'True 1:1 personalization across all channels with 20%+ conversion lift.',
    evidenceIds: ['6.2', '3.3', '4.2']
  }
]

const personaData: PersonaData[] = [
  {
    id: 'digital-banking-manager',
    title: 'Digital Banking Manager',
    pains: 'Cannot create/modify forms without IT. Limited visibility into user drop-offs. Long development cycles.',
    solution: 'Feathery Forms provides no-code form building with real-time analytics. Heap shows exact drop-off points.',
    talkingPoints: '• 40% reduction in form abandonment\n• 80% faster form deployment\n• Real-time user behavior insights',
    evidenceIds: ['4.1', '6.1']
  },
  {
    id: 'cx-director',
    title: 'CX Director',
    pains: 'Fragmented customer view. Cannot predict customer needs. Siloed channel experiences.',
    solution: 'Segment CDP unifies data. AI-powered predictions. Optimizely enables consistent personalization.',
    talkingPoints: '• Single customer view across all touchpoints\n• Predictive analytics for proactive engagement\n• 20%+ increase in customer satisfaction',
    evidenceIds: ['4.2', '6.2']
  },
  {
    id: 'it-security-lead',
    title: 'IT Security Lead',
    pains: 'Concerned about data security. Integration complexity. Compliance requirements.',
    solution: 'All solutions are SOC2 Type II certified. Bank-grade security. API-first architecture.',
    talkingPoints: '• Enterprise-grade security certifications\n• Compliant with banking regulations\n• Minimal integration complexity',
    evidenceIds: ['5.1']
  }
]

// Chart data
const confidenceData = [
  { name: 'High Confidence', value: 75, fill: '#10b981' },
  { name: 'Medium Confidence', value: 20, fill: '#f59e0b' },
  { name: 'Low Confidence', value: 5, fill: '#ef4444' }
]

export default function SalesIntelligenceReportPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [openPersona, setOpenPersona] = useState<PersonaData | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Intelligence Report</h1>
            <p className="text-muted-foreground mt-1">
              Account: <span className="font-semibold text-electric-teal">BMO Financial Group</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Prepared: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Confidence: 85%</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tech-stack">Tech Stack</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="approach">Sales Approach</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Account Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">BMO Financial Group</h3>
                  <p className="text-sm text-muted-foreground">
                    Canada's 4th largest bank with $1.3T in assets. Expanding digital capabilities 
                    across retail, commercial, and wealth management divisions.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium">Financial Services</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">55,000+ employees</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tech Maturity:</span>
                    <Badge variant="secondary">Advanced</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Heavy Adobe Experience Cloud investment (2021)
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Heavy Adobe Experience Cloud investment (2021)',
                          ['2.3']
                        ))}
                      >
                        ⟦2.3⟧
                      </Badge>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Gaps in form building and cross-channel personalization
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Gaps in form building and cross-channel personalization',
                          ['3.1', '3.3']
                        ))}
                      >
                        ⟦3.1,3.3⟧
                      </Badge>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Digital transformation priority for 2024-2025
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Digital transformation priority for 2024-2025',
                          ['4.2']
                        ))}
                      >
                        ⟦4.2⟧
                      </Badge>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Bank-grade security requirements mandatory
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Bank-grade security requirements mandatory',
                          ['5.1']
                        ))}
                      >
                        ⟦5.1⟧
                      </Badge>
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Approach */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Recommended Sales Approach
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {phaseData.map((phase) => (
                  <Card key={phase.phase} className="border-2 border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Phase {phase.phase}</Badge>
                        <span className="text-sm text-muted-foreground">{phase.duration}</span>
                      </div>
                      <CardTitle className="text-lg mt-2">{phase.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{phase.pitch}</p>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{phase.products}</div>
                        <div className="flex gap-1">
                          {phase.evidenceIds.map(id => (
                            <Badge 
                              key={id}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(phase.pitch, phase.evidenceIds))}
                            >
                              ⟦{id}⟧
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech Stack Tab */}
        <TabsContent value="tech-stack" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Technology Stack Analysis</CardTitle>
              <CardDescription>
                Identified technologies and confidence levels based on evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Citations</TableHead>
                    <TableHead>Confidence</TableHead>
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
                        <div className="flex gap-1">
                          {item.evidenceIds.map(id => (
                            <Badge 
                              key={id}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(item.evidence, item.evidenceIds))}
                            >
                              ⟦{id}⟧
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          item.confidence === 'High' ? 'default' : 
                          item.confidence === 'Medium' ? 'secondary' : 
                          'outline'
                        }>
                          {item.confidence}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Confidence Chart */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Confidence Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={confidenceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {confidenceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Integration Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Adobe Experience Cloud integration points</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Existing analytics infrastructure can be enhanced</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-600" />
                        <span>Security standards already in place</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gap Analysis Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technology Gap Analysis</CardTitle>
              <CardDescription>
                Identified gaps and recommended solutions to enhance BMO's digital capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gapData.map((gap, index) => (
                  <Card key={index} className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          {gap.area}
                        </CardTitle>
                        <div className="flex gap-1">
                          {gap.evidenceIds.map(id => (
                            <Badge 
                              key={id}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(gap.gap, gap.evidenceIds))}
                            >
                              ⟦{id}⟧
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-1">Current Gap:</p>
                          <p className="text-sm text-muted-foreground">{gap.gap}</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Recommended Solution:</p>
                          <p className="text-sm">{gap.solution}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Approach Tab */}
        <TabsContent value="approach" className="space-y-6">
          {/* Key Personas */}
          <Card>
            <CardHeader>
              <CardTitle>Key Decision Makers & Influencers</CardTitle>
              <CardDescription>
                Targeted messaging for each persona based on their specific pain points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {personaData.map((persona) => (
                  <Card 
                    key={persona.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setOpenPersona(persona)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {persona.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {persona.pains}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <Button variant="link" size="sm" className="p-0 h-auto">
                          View talking points
                        </Button>
                        <div className="flex gap-1">
                          {persona.evidenceIds.slice(0, 2).map(id => (
                            <Badge 
                              key={id}
                              variant="outline" 
                              className="text-xs"
                            >
                              ⟦{id}⟧
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ROI Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ROI Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Form Optimization Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">35%</p>
                    <p className="text-xs text-muted-foreground">
                      Increase in form completion
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Form completion rates increased by 35% in pilot',
                          ['6.1']
                        ))}
                      >
                        ⟦6.1⟧
                      </Badge>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Campaign Cost Reduction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">20%</p>
                    <p className="text-xs text-muted-foreground">
                      Through better targeting
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Projected 20% reduction in campaign costs through better targeting',
                          ['6.2']
                        ))}
                      >
                        ⟦6.2⟧
                      </Badge>
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Conversion Rate Lift</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">15%</p>
                    <p className="text-xs text-muted-foreground">
                      Expected increase
                      <Badge 
                        variant="outline" 
                        className="ml-1 text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setSelectedCitation(createCitation(
                          'Expected 15% increase in conversion rates',
                          ['6.2']
                        ))}
                      >
                        ⟦6.2⟧
                      </Badge>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Appendix</CardTitle>
              <CardDescription>
                Supporting documentation and sources for all claims in this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group evidence by category */}
                {Object.entries(
                  evidenceData.reduce((acc, evidence) => {
                    const category = evidence.type === 'document' ? 'Tech Stack' : 
                                   evidence.type === 'analysis' ? 'Gap Analysis' : 
                                   evidence.type === 'interview' ? 'Persona Research' : 'General'
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
                            <p className="text-sm text-muted-foreground mb-2">{evidence.excerpt || evidence.title}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Source: {evidence.source}</span>
                              <span>Date: {evidence.metadata?.lastModified ? new Date(evidence.metadata.lastModified).toLocaleDateString() : 'N/A'}</span>
                              {evidence.url && (
                                <a 
                                  href={evidence.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View
                                </a>
                              )}
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

      {/* Persona Modal */}
      <Dialog open={!!openPersona} onOpenChange={() => setOpenPersona(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {openPersona?.title}
            </DialogTitle>
            <DialogDescription>
              Detailed persona information and talking points
            </DialogDescription>
          </DialogHeader>
          {openPersona && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Pain Points</h4>
                <p className="text-sm">{openPersona.pains}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-green-600 mb-2">Our Solution</h4>
                <p className="text-sm">{openPersona.solution}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Key Talking Points</h4>
                <p className="text-sm whitespace-pre-line">{openPersona.talkingPoints}</p>
              </div>
              <div className="flex gap-1 pt-2">
                <span className="text-sm text-muted-foreground mr-2">Evidence:</span>
                {openPersona.evidenceIds.map(id => (
                  <Badge 
                    key={id}
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      setOpenPersona(null)
                      setSelectedCitation(createCitation(openPersona.pains, openPersona.evidenceIds))
                    }}
                  >
                    ⟦{id}⟧
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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