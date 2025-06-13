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
  Users
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

// Data interfaces
interface TechStackItem {
  category: string
  technology: string
  evidence: string
  confidence: 'High' | 'Medium' | 'Low'
}

interface GapItem {
  area: string
  gap: string
  solution: string
}

interface PhaseData {
  phase: number
  title: string
  duration: string
  products: string
  pitch: string
}

interface PersonaData {
  id: string
  title: string
  pains: string
  solution: string
  talkingPoints: string
}

interface EvidenceItem {
  id: string
  text: string
  url: string
}

// Sample data - In production, this would come from API/database
const techStackData: TechStackItem[] = [
  { 
    category: 'Web Content & Forms', 
    technology: 'Adobe Experience Manager (AEM)', 
    evidence: '2021 Adobe Experience Cloud selection [2.3], `aemforms.qa.bmo.com` subdomain found.', 
    confidence: 'High' 
  },
  { 
    category: 'Analytics', 
    technology: 'Adobe Analytics', 
    evidence: 'First-party tracking via `smetrics.bmo.com` [2.2].', 
    confidence: 'High' 
  },
  { 
    category: 'Analytics', 
    technology: 'Google Analytics / GTM', 
    evidence: 'GA/GTM scripts detected, indicating dual-tracking or legacy setup.', 
    confidence: 'High' 
  },
  { 
    category: 'Personalization', 
    technology: 'Adobe Target', 
    evidence: 'BMO Insurance adopted Target Standard in 2023 [2.3].', 
    confidence: 'High' 
  },
  { 
    category: 'Personalization', 
    technology: 'Movable Ink', 
    evidence: 'Email content served from `movableink.bmo.com` indicates use for real-time personalization.', 
    confidence: 'High' 
  },
  { 
    category: 'CX Feedback', 
    technology: 'Qualtrics', 
    evidence: 'Scripts detected, suggesting use for on-site customer surveys.', 
    confidence: 'High' 
  },
  { 
    category: 'Marketing Automation', 
    technology: 'ClickDimensions', 
    evidence: 'Listed in tech profile; suggests use in a B2B/wealth context with MS Dynamics.', 
    confidence: 'Medium' 
  },
  { 
    category: 'Security', 
    technology: 'Wiz', 
    evidence: 'Listed in tech profile; confirms focus on securing multi-cloud (AWS/Azure) environments.', 
    confidence: 'High' 
  },
  { 
    category: 'Performance Monitoring', 
    technology: 'Dynatrace', 
    evidence: 'Confirmed via Feb 2024 joint press release [3.2].', 
    confidence: 'High' 
  }
]

const gapsData: GapItem[] = [
  { 
    area: 'Customer Data & Profiles', 
    gap: 'Data is siloed in AWS, Azure, and core systems. No unified real-time customer view.', 
    solution: 'Adobe Real-Time CDP: Unifies data into a single profile, enabling personalized experiences and effective cross-sell.' 
  },
  { 
    area: 'Personalization & Testing', 
    gap: 'Personalization is not happening at scale or in real-time. It is not informed by a complete customer profile.', 
    solution: 'Adobe Target Premium & Sensei AI: Scales AI-driven, 1-to-1 personalization across web/mobile, increasing conversion and engagement.' 
  },
  { 
    area: 'Cross-Channel Marketing', 
    gap: 'Disjointed communication tools result in inconsistent conversations across channels.', 
    solution: 'Adobe Journey Optimizer: Orchestrates consistent, real-time customer journeys across all touchpoints, reducing customer frustration and improving ROI.' 
  },
  { 
    area: 'Content & Campaign Workflow', 
    gap: 'Slow time-to-market and high risk of compliance errors due to manual workflows.', 
    solution: 'Adobe Workfront: Streamlines the entire marketing workflow, from creation to approval and launch, reducing errors and accelerating execution.' 
  },
  { 
    area: 'B2B / Commercial Banking', 
    gap: 'Lacks sophisticated lead nurturing and scoring for high-value business leads.', 
    solution: 'Adobe Marketo Engage: Enables true Account-Based Marketing (ABM) to nurture and convert high-value leads efficiently.' 
  }
]

const phasesData: PhaseData[] = [
  { 
    phase: 1, 
    title: 'The Foundation: Unify the Data', 
    duration: 'Next 3-6 Months', 
    products: 'Adobe Real-Time CDP & Customer Journey Analytics', 
    pitch: 'Gain a single view of every customer. Understand the full customer journey by connecting your existing data. This isn\'t about replacing your data lakes; it\'s about *activating* that data for real-time engagement.' 
  },
  { 
    phase: 2, 
    title: 'The Activation: Orchestrate the Experience', 
    duration: 'Months 6-12', 
    products: 'Adobe Journey Optimizer & Adobe Target (Premium)', 
    pitch: 'Now that you have a unified profile, let\'s act on it. Automate real-time journeys for onboarding and abandonment. Scale AI-powered personalization to deliver a "segment of one" experience.' 
  },
  { 
    phase: 3, 
    title: 'The Optimization: Drive Efficiency', 
    duration: 'Year 2', 
    products: 'Adobe Workfront & Adobe Marketo Engage', 
    pitch: 'Streamline your marketing workflow to launch campaigns faster. Equip your B2B and Wealth teams with a true marketing automation platform to drive high-value leads.' 
  }
]

const personasData: PersonaData[] = [
  { 
    id: 'cmo', 
    title: 'CMO / Head of Digital Experience', 
    pains: 'Low digital conversion rates; inconsistent cross-channel CX; proving marketing ROI.', 
    solution: 'AEP, Target, and Journey Optimizer drive measurable lift in conversion and engagement, with unified analytics to prove ROI.', 
    talkingPoints: `"We've been impressed by BMO's 'Digital First' strategy. Our work with other leading banks shows that the biggest barrier to a 'best-in-class' experience is data fragmentation. How are you currently ensuring a customer who starts on mobile receives a consistent experience if they later call in?"` 
  },
  { 
    id: 'cdao', 
    title: 'Chief Data & AI Officer', 
    pains: 'Data silos; activating analytical models for real-time use; ensuring data governance.', 
    solution: 'RT-CDP unifies data while AEP Data Governance enforces compliance, turning their data lake into an actionable asset.', 
    talkingPoints: `"Your teams are doing groundbreaking work with AI. A common challenge is that these powerful models live separately from engagement channels. We can help bridge that last mile, using AEP to take your predictive insights and trigger the 'next-best-action' for a customer in milliseconds."` 
  },
  { 
    id: 'cto', 
    title: 'CTO / Head of Architecture', 
    pains: 'Integrating a complex multi-cloud environment; modernizing legacy apps; reducing technical debt.', 
    solution: 'AEP\'s composable architecture acts as an agile experience layer on top of their existing stack, connecting disparate systems.', 
    talkingPoints: `"Your multi-cloud strategy with AWS and Azure is forward-thinking. AEP can act as the connective tissue, providing a unified experience and data layer that leverages, rather than replaces, your strategic cloud investments, reducing complexity for your application teams."` 
  },
  { 
    id: 'lob-personal', 
    title: 'Head of Personal & Business Banking', 
    pains: 'Customer acquisition and retention; increasing product-per-customer ratio; cost-effective scaling.', 
    solution: 'Journey Optimizer and Target automate onboarding and cross-sell at scale, driving revenue with higher efficiency.', 
    talkingPoints: `"Your focus on reimagining banking is clear. Imagine if your systems could automatically detect a customer struggling with an online transaction and immediately offer help. Journey Optimizer orchestrates exactly these kinds of real-time service moments at scale."` 
  },
  { 
    id: 'lob-wealth', 
    title: 'Head of Wealth Management', 
    pains: 'High-touch relationship management at scale; effective B2B lead generation; providing proactive, relevant advice.', 
    solution: 'Marketo Engage drives B2B leads. AEP + CJA provide advisors with a 360-degree client view for proactive conversations.', 
    talkingPoints: `"For high-net-worth clients, proactivity is key. What if your advisors were automatically alerted when a client's portfolio data and on-site behavior indicated they were exploring a major financial decision, allowing for a perfectly timed, consultative outreach?"` 
  }
]

const evidenceData: EvidenceItem[] = [
  { id: '1.2', text: 'BMO Recognized for Digital Innovation and Customer Experience', url: 'https://www.newswire.ca/news-releases/bmo-recognized-for-digital-innovation-and-customer-experience-887044341.html' },
  { id: '2.2', text: 'Adobe Connect Case Study: BMO Financial Group', url: 'https://www.adobe.com/content/dam/cc/us/en/products/adobe-connect/customer-success/pdfs/bmofinancialgroup-case-study.pdf' },
  { id: '2.3', text: 'BMO USA selects Adobe Experience Cloud for Customer Experience', url: 'https://www.appsruntheworld.com/customers-database/purchases/view/bmo-harris-bank-n-a-united-states-selects-adobe-experience-cloud-for-customer-experience' },
  { id: '3.2', text: 'BMO Scales Digital Banking Capabilities with Dynatrace', url: 'https://ir.dynatrace.com/news-events/press-releases/detail/329/bmo-scales-digital-banking-capabilities-for-customers-worldwide-with-dynatrace' },
  { id: '4.2', text: 'BMO and FICO Transform Financial Services with AWS', url: 'https://aws.amazon.com/partners/success/bmo-fico/' },
  { id: '5.1', text: 'Bank of Montreal (BMO) AI Case Study - Federated Hermes', url: 'https://www.hermes-investment.com/dk/en/professional/eos-insight/stewardship/bank-of-montreal-case-study/' },
  { id: '6.1', text: 'Seven tips for ensuring a successful Adobe Experience Platform (AEP) implementation', url: 'https://www.virtusa.com/insights/perspectives/seven-tips-for-ensuring-successful-adobe-experience-platform-implementation' },
  { id: '6.3', text: 'Best Practices for Implementing AEM & Platform Services', url: 'https://www.hurix.com/blogs/best-practices-for-implementing-aem-and-platform-services-in-your-organization/' }
]

// Opportunity score data for the donut chart
const opportunityData = [
  { name: 'Scored Opportunity', value: 95, color: '#4f46e5' },
  { name: 'Remaining Potential', value: 5, color: '#e5e7eb' }
]

export default function SalesIntelligenceReportPage() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null)
  const [activeTab, setActiveTab] = useState('summary')

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Intelligence Report</h1>
            <p className="text-muted-foreground mt-1">
              Target Account: <span className="font-semibold text-electric-teal">Bank of Montreal (BMO)</span>
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-sm text-muted-foreground">Prepared for: Adobe Enterprise Team</p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | V2.0
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="context">Strategic Context</TabsTrigger>
          <TabsTrigger value="tech">Tech Deep Dive</TabsTrigger>
          <TabsTrigger value="gaps">Opportunity & Gaps</TabsTrigger>
          <TabsTrigger value="playbook">Sales Playbook</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Locker</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>The BMO Opportunity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  BMO is a strategic Adobe customer in the midst of a multi-billion dollar "Digital First" transformation. 
                  They have foundational investments in Adobe Experience Cloud, but are <strong>significantly underutilizing 
                  the platform's potential</strong>. This creates a massive opportunity to expand the partnership by 
                  demonstrating how a fully unified Adobe stack can solve their most pressing challenges and accelerate 
                  their "Ambition 2025" goals.
                </p>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Top 3 Strategic Opportunities for Adobe</h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: 'Unify Siloed Data',
                        description: 'BMO\'s multi-cloud strategy (AWS + Azure) has created data silos. They lack a single, real-time view of the customer. This is a prime opportunity for Adobe Real-Time CDP.',
                        confidence: 'High'
                      },
                      {
                        title: 'Scale Personalization',
                        description: 'BMO uses Adobe Target in its insurance division but has not scaled personalization across core banking. There is a clear need to move from basic segmentation to AI-driven, one-to-one experiences with Adobe Target Premium & Sensei AI.',
                        confidence: 'High'
                      },
                      {
                        title: 'Orchestrate Cross-Channel Journeys',
                        description: 'Customer communications are disjointed. BMO cannot manage a coherent customer journey across touchpoints. This is a greenfield opportunity for Adobe Journey Optimizer.',
                        confidence: 'Medium'
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 bg-electric-teal text-white rounded-full h-8 w-8 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge variant="outline" className={getConfidenceColor(item.confidence)}>
                              {item.confidence} Confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Opportunity Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={opportunityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {opportunityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold">
                        9.5/10
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center mt-4 text-muted-foreground">
                  High-potential "Expand" account with strong signals for platform consolidation and growth.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategic Context Tab */}
        <TabsContent value="context" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>BMO's Strategic Imperatives (2024-2025)</CardTitle>
              <CardDescription>
                All conversations with BMO must be framed in the context of their publicly stated corporate goals. 
                Understanding their strategy is key to aligning our solutions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  title: '"Digital First" Strategy & "Ambition 2025"',
                  description: 'BMO\'s top priority is to be a "digitally enabled, future-ready" bank, driving growth through superior digital products and efficiencies. They are actively investing to elevate their everyday banking experiences.',
                  angle: 'This is Adobe\'s core value proposition. We can directly tie our solutions to their goal of achieving "best-in-class" digital services.',
                  evidence: '[1.2]'
                },
                {
                  title: 'Multi-Cloud & Application Modernization',
                  description: 'BMO has a deliberate multi-cloud strategy with AWS as its preferred provider for core banking modernization and Azure for critical workloads like the Capital Markets risk management platform.',
                  angle: 'This multi-cloud approach creates data fragmentation that Adobe Experience Platform is perfectly positioned to solve, acting as the unified experience layer across their cloud providers.',
                  evidence: '[4.2] [5.1]'
                },
                {
                  title: 'AI and Data at the Core',
                  description: 'BMO has a Chief AI & Data Officer and is actively deploying AI solutions, such as an insurance underwriting assistant on Azure OpenAI Service and a modernized credit decisioning platform with FICO on AWS.',
                  angle: 'BMO creates vast amounts of data but struggles to activate it for customer experience. Adobe\'s AI Agents and RT-CDP can turn their analytical AI insights into real-time marketing actions.',
                  evidence: '[4.2]'
                },
                {
                  title: 'Obsession with Customer Experience (CX)',
                  description: 'BMO\'s 2024 partnership with Dynatrace aims to ensure "best-in-class experiences" by using AI-powered observability to reduce incident identification time by 80%. This shows that seamless, reliable, and personalized CX is a top priority.',
                  angle: 'This is Adobe\'s core value proposition. We can directly tie our solutions to their goal of achieving "best-in-class" digital services and improving their Net Promoter Score (NPS).',
                  evidence: '[3.2]'
                }
              ].map((item, index) => (
                <div key={index} className="border rounded-lg p-6 space-y-3">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                  <div className="bg-electric-teal/10 border-l-4 border-electric-teal p-4 rounded">
                    <p className="font-semibold text-electric-teal mb-1">Adobe's Angle:</p>
                    <p className="text-sm">{item.angle}</p>
                  </div>
                  {item.evidence && (
                    <p className="text-xs text-muted-foreground">Evidence: {item.evidence}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech Deep Dive Tab */}
        <TabsContent value="tech" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current State Technology Audit</CardTitle>
              <CardDescription>
                Our analysis reveals a sophisticated but fragmented technology stack. 
                The following have been identified through public records and technical fingerprinting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Technology</TableHead>
                    <TableHead>Evidence / Technical Fingerprint</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {techStackData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{item.technology}</TableCell>
                      <TableCell className="text-sm">{item.evidence}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getConfidenceColor(item.confidence)}>
                          {item.confidence}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inferred Architecture & Data Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Current State: Fragmented & Siloed</h3>
                  <div className="border-2 border-dashed border-red-300 rounded-lg p-6 bg-red-50 space-y-4">
                    <p className="text-sm text-red-700">
                      Data flows are channel-specific, creating inconsistent experiences and missed opportunities. 
                      Each channel has a partial view of the customer.
                    </p>
                    <div className="aspect-video bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-red-400" />
                      <span className="ml-2 text-red-600 font-medium">Current Architecture Diagram</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Proposed Future State: Unified & Intelligent</h3>
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50 space-y-4">
                    <p className="text-sm text-green-700">
                      AEP becomes the central "System of Engagement," unifying data and activating consistent, 
                      personalized experiences across all channels.
                    </p>
                    <div className="aspect-video bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-400" />
                      <span className="ml-2 text-green-600 font-medium">Proposed Adobe Architecture</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-4">Implementation Hurdles & Mitigation</h3>
                <ul className="space-y-3">
                  {[
                    {
                      title: 'Data Integration & Governance',
                      description: 'Requires deep collaboration with BMO\'s IT and security.',
                      mitigation: 'Start with a robust governance model in AEP from day one.',
                      evidence: '[6.1]'
                    },
                    {
                      title: 'Stakeholder Alignment',
                      description: 'Needs buy-in from teams using competing tools.',
                      mitigation: 'A clear migration plan, training, and demonstrating early wins are essential.'
                    },
                    {
                      title: 'Phased Rollout',
                      description: 'A "boil the ocean" approach will fail.',
                      mitigation: 'Start with high-impact use cases (e.g., web personalization) before tackling complex offline integrations.',
                      evidence: '[6.3]'
                    }
                  ].map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{item.title}:</span> {item.description}
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Mitigation:</span> {item.mitigation} {item.evidence}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunity & Gaps Tab */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Opportunity & Gap Analysis</CardTitle>
              <CardDescription>
                The following table details BMO's current state, the resulting business pain points, 
                and how Adobe Experience Cloud directly provides the solution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capability Area</TableHead>
                    <TableHead>Identified Gap / Pain Point</TableHead>
                    <TableHead>Adobe Solution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gapsData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.area}</TableCell>
                      <TableCell className="text-sm">{item.gap}</TableCell>
                      <TableCell className="text-sm">
                        <div dangerouslySetInnerHTML={{ __html: item.solution.replace(/^(.*?):/, '<strong>$1:</strong>') }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Playbook Tab */}
        <TabsContent value="playbook" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>The BMO Sales Playbook</CardTitle>
              <CardDescription>
                This is the actionable plan for the Adobe account team, designed to create a consultative, 
                problem-solving engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Phased Rollout */}
              <div>
                <h3 className="text-lg font-semibold mb-4">A. Recommended Phased Rollout</h3>
                <div className="space-y-4">
                  {phasesData.map((phase) => (
                    <div key={phase.phase} className="border rounded-lg p-6 flex gap-4">
                      <div className="flex-shrink-0 bg-slate-700 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg">
                        {phase.phase}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{phase.title}</h4>
                          <span className="text-sm text-muted-foreground">({phase.duration})</span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">Lead Products:</span> {phase.products}
                        </p>
                        <p className="text-sm text-muted-foreground italic">{phase.pitch}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Target Personas */}
              <div>
                <h3 className="text-lg font-semibold mb-4">B. Target Departments & Key Personas</h3>
                <p className="text-muted-foreground mb-4">
                  Focus engagement on leaders whose goals align directly with our solutions. 
                  Click on a persona for detailed talking points.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {personasData.map((persona) => (
                    <Card 
                      key={persona.id} 
                      className="cursor-pointer hover:border-electric-teal transition-colors"
                      onClick={() => setSelectedPersona(persona)}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{persona.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{persona.pains}</p>
                        <Button variant="link" className="p-0 h-auto mt-2">
                          View Details <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Locker Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Locker</CardTitle>
              <CardDescription>
                This section contains direct links to all public sources used in this report for verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evidenceData.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">
                        [{item.id}]
                      </Badge>
                      <span className="text-sm">{item.text}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        View Source <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Persona Modal */}
      <Dialog open={!!selectedPersona} onOpenChange={() => setSelectedPersona(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPersona?.title}</DialogTitle>
            <DialogDescription>Target Persona Profile & Talking Points</DialogDescription>
          </DialogHeader>
          {selectedPersona && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Primary Pains & Goals
                </h4>
                <p className="text-sm text-muted-foreground">{selectedPersona.pains}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  How Adobe Helps
                </h4>
                <p className="text-sm text-muted-foreground">{selectedPersona.solution}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Conversation Starter / Talking Points
                </h4>
                <div className="bg-electric-teal/10 border-l-4 border-electric-teal p-4 rounded">
                  <p className="text-sm italic">{selectedPersona.talkingPoints}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}