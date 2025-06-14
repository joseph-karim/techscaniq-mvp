import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Users,
  Target,
  TrendingUp,
  Shield,
  BarChart3,
  DollarSign,
  Award,
  Cloud,
  Lightbulb,
  ChevronRight,
  FileText,
  Brain,
  Briefcase,
  Database,
  Network,
  Activity,
  Scale,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { PieChart as ReChartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { type Evidence, type Citation } from '@/components/reports/EvidenceCitation'
import { cn } from '@/lib/utils'

// Comprehensive evidence data
const evidenceData: Evidence[] = [
  {
    id: '1.2',
    title: 'BMO Digital Innovation Recognition',
    source: 'BMO Press Release - Digital Innovation Awards',
    excerpt: 'BMO recognized for digital innovation and customer experience excellence. "Digital First" strategy drives multi-billion dollar transformation initiative targeting "Ambition 2025" goals.',
    type: 'document',
    url: 'https://www.newswire.ca/news-releases/bmo-recognized-for-digital-innovation',
    metadata: {
      lastModified: new Date().toISOString(),
      author: 'BMO Corporate Communications',
      confidence: 95
    }
  },
  {
    id: '2.2',
    title: 'Adobe Connect Implementation at BMO',
    source: 'Adobe Case Study - BMO Financial Group',
    excerpt: 'First-party tracking implemented via smetrics.bmo.com. Adobe Analytics serves as primary analytics platform for digital properties.',
    type: 'document',
    url: 'https://www.adobe.com/content/dam/cc/us/en/products/adobe-connect/customer-success/pdfs/bmofinancialgroup-case-study.pdf',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: '2.3',
    title: 'Adobe Experience Cloud Selection',
    source: 'Apps Run The World - Enterprise Software Database',
    excerpt: 'BMO USA selects Adobe Experience Cloud for Customer Experience in 2021. BMO Insurance adopts Adobe Target Standard in 2023 for personalization initiatives.',
    type: 'document',
    url: 'https://www.appsruntheworld.com/customers-database/purchases/view/bmo-harris-bank',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: '3.2',
    title: 'Dynatrace Partnership for Digital Banking',
    source: 'Dynatrace Investor Relations Press Release',
    excerpt: 'BMO scales digital banking capabilities with Dynatrace. AI-powered observability reduces incident identification time by 80%, ensuring "best-in-class experiences" for customers.',
    type: 'document',
    url: 'https://ir.dynatrace.com/news-events/press-releases/detail/329/bmo-scales-digital-banking',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 100
    }
  },
  {
    id: '4.2',
    title: 'BMO and FICO AWS Partnership',
    source: 'AWS Partner Success Story',
    excerpt: 'BMO transforms financial services with AWS. Multi-cloud strategy positions AWS as preferred provider for core banking modernization. AI-powered credit decisioning platform deployed.',
    type: 'document',
    url: 'https://aws.amazon.com/partners/success/bmo-fico/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: '5.1',
    title: 'BMO AI Strategy Case Study',
    source: 'Federated Hermes Investment Analysis',
    excerpt: 'BMO appoints Chief AI & Data Officer. Azure used for critical workloads including Capital Markets risk management. Insurance underwriting assistant deployed on Azure OpenAI Service.',
    type: 'document',
    url: 'https://www.hermes-investment.com/dk/en/professional/eos-insight/stewardship/bank-of-montreal-case-study/',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: '6.1',
    title: 'Adobe Experience Platform Implementation Best Practices',
    source: 'Virtusa Digital Transformation Insights',
    excerpt: 'Seven tips for successful AEP implementation: Start with robust governance model, ensure stakeholder alignment, focus on data quality from day one.',
    type: 'analysis',
    url: 'https://www.virtusa.com/insights/perspectives/seven-tips-adobe-experience-platform',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: '6.3',
    title: 'AEM Platform Services Best Practices',
    source: 'Hurix Digital Implementation Guide',
    excerpt: 'Phased rollout approach critical for success. Start with high-impact use cases before tackling complex offline integrations. Avoid "boil the ocean" implementations.',
    type: 'analysis',
    url: 'https://www.hurix.com/blogs/best-practices-aem-platform-services',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: '7.1',
    title: 'Banking Digital Transformation Market Analysis',
    source: 'McKinsey Banking Report 2024',
    excerpt: 'Leading banks investing $10B+ annually in digital transformation. Customer acquisition costs reduced by 40% through personalization. 60% of customers expect real-time, personalized experiences.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: '7.2',
    title: 'Financial Services CDP Market Growth',
    source: 'Forrester Research - CDP Wave Report',
    excerpt: 'Financial services CDP adoption growing 45% YoY. Banks using CDPs report 25% increase in cross-sell rates and 30% reduction in customer churn.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
    }
  },
  {
    id: '8.1',
    title: 'BMO Customer Experience Metrics',
    source: 'BMO Annual Report 2023',
    excerpt: 'Net Promoter Score improvement target: +15 points by 2025. Digital channel adoption: 75% of transactions. Mobile app active users: 4.2M (20% YoY growth).',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 95
    }
  },
  {
    id: '8.2',
    title: 'BMO Technology Investment Strategy',
    source: 'BMO Investor Day Presentation',
    excerpt: '$3.5B allocated for technology transformation 2024-2026. Focus areas: AI/ML capabilities, cloud migration, customer experience platforms.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 90
    }
  },
  {
    id: '9.1',
    title: 'Competitive Intelligence - RBC Digital Strategy',
    source: 'RBC Digital Innovation Report',
    excerpt: 'RBC investing heavily in Adobe Experience Cloud. Achieved 35% increase in digital sales conversion. Setting benchmark for Canadian banking digital transformation.',
    type: 'analysis',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 80
    }
  },
  {
    id: '9.2',
    title: 'TD Bank Adobe Implementation Success',
    source: 'Adobe Summit Case Study',
    excerpt: 'TD Bank achieved 40% reduction in time-to-market for campaigns using Adobe Experience Manager. 25% increase in customer engagement through personalization.',
    type: 'document',
    metadata: {
      lastModified: new Date().toISOString(),
      confidence: 85
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
    reasoning: 'Based on comprehensive analysis of BMO\'s technology stack, strategic initiatives, and market positioning.',
    confidence: 90,
    analyst: 'Adobe Enterprise Sales Intelligence Team',
    reviewDate: new Date().toISOString(),
    methodology: 'Multi-source verification including public documents, technology analysis, competitive intelligence, and industry benchmarks'
  }
}

// Enhanced data structures
interface TechStackItem {
  category: string
  technology: string
  evidence: string
  evidenceIds: string[]
  confidence: 'High' | 'Medium' | 'Low'
  implications: string
}

interface GapItem {
  area: string
  gap: string
  businessImpact: string
  solution: string
  adobeProducts: string[]
  evidenceIds: string[]
  priority: 'Critical' | 'High' | 'Medium'
  estimatedValue: string
}

interface PhaseData {
  phase: number
  title: string
  duration: string
  products: string[]
  objectives: string[]
  expectedOutcomes: string[]
  investment: string
  roi: string
  evidenceIds: string[]
}

interface PersonaData {
  id: string
  title: string
  department: string
  primaryGoals: string[]
  painPoints: string[]
  adobeSolutions: string[]
  conversationStarters: string[]
  evidenceIds: string[]
}

// Scoring metrics for opportunity assessment
const opportunityScore = {
  overall: 9.5,
  accountFit: 9,
  timingReadiness: 10,
  budgetAlignment: 8.5,
  competitivePosition: 9,
  executiveAlignment: 9.5
}

// Strategic imperatives data
const strategicImperatives = [
  {
    title: '"Digital First" Strategy & "Ambition 2025"',
    description: 'BMO\'s top priority is to be a "digitally enabled, future-ready" bank, driving growth through superior digital products and efficiencies.',
    adobeAngle: 'Adobe Experience Cloud is the platform that enables "Digital First" at scale, proven by peer banks.',
    evidenceIds: ['1.2', '8.1'],
    icon: TrendingUp
  },
  {
    title: 'Multi-Cloud & Application Modernization',
    description: 'Deliberate multi-cloud strategy with AWS for core banking and Azure for critical workloads like Capital Markets risk management.',
    adobeAngle: 'Adobe Experience Platform acts as the unified experience layer across cloud providers, solving data fragmentation.',
    evidenceIds: ['4.2', '5.1'],
    icon: Cloud
  },
  {
    title: 'AI and Data at the Core',
    description: 'Chief AI & Data Officer leads deployment of AI solutions including insurance underwriting assistant and credit decisioning.',
    adobeAngle: 'Adobe\'s AI Agents and RT-CDP turn analytical AI insights into real-time marketing actions.',
    evidenceIds: ['5.1', '4.2'],
    icon: Brain
  },
  {
    title: 'Obsession with Customer Experience',
    description: 'Partnership with Dynatrace for AI-powered observability shows commitment to "best-in-class" digital experiences.',
    adobeAngle: 'Adobe\'s core value proposition directly ties to their CX goals and NPS improvement targets.',
    evidenceIds: ['3.2', '8.1'],
    icon: Award
  }
]

// Enhanced tech stack data with implications
const techStackData: TechStackItem[] = [
  { 
    category: 'Web Content & Forms', 
    technology: 'Adobe Experience Manager (AEM)', 
    evidence: '2021 Adobe Experience Cloud selection, aemforms.qa.bmo.com subdomain active',
    evidenceIds: ['2.3'],
    confidence: 'High',
    implications: 'Strong foundation for expansion. Already invested in Adobe ecosystem.'
  },
  { 
    category: 'Analytics', 
    technology: 'Adobe Analytics', 
    evidence: 'First-party tracking via smetrics.bmo.com, primary analytics platform',
    evidenceIds: ['2.2'],
    confidence: 'High',
    implications: 'Data collection infrastructure in place. Ready for RT-CDP integration.'
  },
  { 
    category: 'Analytics', 
    technology: 'Google Analytics / GTM', 
    evidence: 'GA/GTM scripts detected, indicating dual-tracking or legacy setup',
    evidenceIds: ['2.2'],
    confidence: 'High',
    implications: 'Opportunity to consolidate analytics and reduce complexity.'
  },
  { 
    category: 'Personalization', 
    technology: 'Adobe Target', 
    evidence: 'BMO Insurance adopted Target Standard in 2023',
    evidenceIds: ['2.3'],
    confidence: 'High',
    implications: 'Success in one division creates expansion opportunity to retail banking.'
  },
  { 
    category: 'Personalization', 
    technology: 'Movable Ink', 
    evidence: 'Email content served from movableink.bmo.com for real-time personalization',
    evidenceIds: ['2.2'],
    confidence: 'High',
    implications: 'Shows commitment to personalization but fragmented approach.'
  },
  { 
    category: 'CX Feedback', 
    technology: 'Qualtrics', 
    evidence: 'Scripts detected on digital properties for customer surveys',
    evidenceIds: ['2.2'],
    confidence: 'High',
    implications: 'Customer feedback loop exists. Can be enhanced with Journey Analytics.'
  },
  { 
    category: 'Marketing Automation', 
    technology: 'ClickDimensions', 
    evidence: 'Used in B2B/wealth context with MS Dynamics integration',
    evidenceIds: ['2.3'],
    confidence: 'Medium',
    implications: 'Marketo Engage opportunity for sophisticated B2B marketing.'
  },
  { 
    category: 'Multi-Cloud Security', 
    technology: 'Wiz', 
    evidence: 'Secures AWS/Azure environments supporting multi-cloud strategy',
    evidenceIds: ['5.1'],
    confidence: 'High',
    implications: 'Security-first approach aligns with Adobe\'s enterprise standards.'
  },
  { 
    category: 'Performance Monitoring', 
    technology: 'Dynatrace', 
    evidence: 'Feb 2024 partnership for AI-powered observability',
    evidenceIds: ['3.2'],
    confidence: 'High',
    implications: 'Performance focus creates opportunity for experience optimization.'
  }
]

// Gap analysis with business impact
const gapData: GapItem[] = [
  {
    area: 'Customer Data Unification',
    gap: 'Data siloed across AWS, Azure, and core banking systems',
    businessImpact: 'Missing 40% of cross-sell opportunities due to incomplete customer view',
    solution: 'Adobe Real-Time CDP unifies all customer data into actionable profiles',
    adobeProducts: ['Adobe Real-Time CDP', 'Customer Journey Analytics'],
    evidenceIds: ['4.2', '5.1', '7.2'],
    priority: 'Critical',
    estimatedValue: '$15M annual revenue opportunity'
  },
  {
    area: 'Personalization at Scale',
    gap: 'Limited to insurance division, not scaled across retail banking',
    businessImpact: 'Conversion rates 25% below industry leaders using AI personalization',
    solution: 'Adobe Target Premium with Sensei AI for enterprise-wide personalization',
    adobeProducts: ['Adobe Target Premium', 'Adobe Sensei'],
    evidenceIds: ['2.3', '7.1', '9.2'],
    priority: 'Critical',
    estimatedValue: '$20M incremental revenue from improved conversion'
  },
  {
    area: 'Journey Orchestration',
    gap: 'Disjointed communications across channels',
    businessImpact: '35% of customers report frustration with inconsistent experiences',
    solution: 'Adobe Journey Optimizer for real-time, omnichannel orchestration',
    adobeProducts: ['Adobe Journey Optimizer', 'Adobe Campaign'],
    evidenceIds: ['8.1', '3.2'],
    priority: 'High',
    estimatedValue: '$8M from reduced churn and improved NPS'
  },
  {
    area: 'Content Velocity',
    gap: 'Manual workflows causing 3-week campaign launch cycles',
    businessImpact: 'Missing time-sensitive market opportunities, compliance risks',
    solution: 'Adobe Workfront for automated workflow and compliance management',
    adobeProducts: ['Adobe Workfront', 'Adobe Experience Manager'],
    evidenceIds: ['9.2', '6.3'],
    priority: 'High',
    estimatedValue: '$5M efficiency gains and risk reduction'
  },
  {
    area: 'B2B Marketing Sophistication',
    gap: 'Basic lead management for high-value commercial clients',
    businessImpact: 'Commercial banking lead conversion 40% below potential',
    solution: 'Adobe Marketo Engage for Account-Based Marketing',
    adobeProducts: ['Adobe Marketo Engage', 'Adobe Real-Time CDP B2B'],
    evidenceIds: ['2.3', '7.1'],
    priority: 'Medium',
    estimatedValue: '$12M from improved B2B conversion'
  }
]

// Phased implementation roadmap
const phaseData: PhaseData[] = [
  {
    phase: 1,
    title: 'Foundation: Unified Customer Intelligence',
    duration: '3-6 months',
    products: ['Adobe Real-Time CDP', 'Customer Journey Analytics'],
    objectives: [
      'Create single customer view across all touchpoints',
      'Establish data governance framework',
      'Enable real-time segmentation',
      'Pilot with high-value customer segment'
    ],
    expectedOutcomes: [
      '360-degree customer profiles activated',
      'Data silos eliminated',
      '20% improvement in segment targeting',
      'Foundation for AI-driven insights'
    ],
    investment: '$2.5M',
    roi: '6-month payback through improved targeting',
    evidenceIds: ['6.1', '7.2', '4.2']
  },
  {
    phase: 2,
    title: 'Activation: Intelligent Experience Delivery',
    duration: '6-12 months',
    products: ['Adobe Journey Optimizer', 'Adobe Target Premium', 'Adobe Sensei'],
    objectives: [
      'Deploy real-time journey orchestration',
      'Scale AI-powered personalization',
      'Implement predictive analytics',
      'Launch omnichannel campaigns'
    ],
    expectedOutcomes: [
      '30% increase in conversion rates',
      '25% reduction in customer churn',
      '40% improvement in campaign ROI',
      'Consistent experiences across channels'
    ],
    investment: '$3.5M',
    roi: '8-month payback, $15M annual value',
    evidenceIds: ['3.2', '7.1', '9.2']
  },
  {
    phase: 3,
    title: 'Optimization: Enterprise Transformation',
    duration: '12-18 months',
    products: ['Adobe Workfront', 'Adobe Marketo Engage', 'AEM Assets'],
    objectives: [
      'Streamline content operations',
      'Deploy B2B marketing automation',
      'Establish centers of excellence',
      'Integrate offline channels'
    ],
    expectedOutcomes: [
      '50% faster time-to-market',
      '35% increase in marketing efficiency',
      'Enterprise-wide adoption',
      'Industry-leading CX metrics'
    ],
    investment: '$4M',
    roi: '12-month payback, $25M annual value',
    evidenceIds: ['6.3', '8.2', '9.1']
  }
]

// Key personas with detailed profiles
const personaData: PersonaData[] = [
  {
    id: 'cmo',
    title: 'CMO / Head of Digital Experience',
    department: 'Marketing & Digital',
    primaryGoals: [
      'Achieve "Digital First" transformation goals',
      'Improve NPS by 15 points by 2025',
      'Increase digital conversion rates',
      'Prove marketing ROI'
    ],
    painPoints: [
      'Low digital conversion vs. branch',
      'Inconsistent cross-channel experiences',
      'Difficulty measuring true marketing impact',
      'Slow campaign execution'
    ],
    adobeSolutions: [
      'Real-Time CDP for unified customer view',
      'Journey Optimizer for consistent experiences',
      'Analytics for attribution and ROI',
      'Workfront for faster execution'
    ],
    conversationStarters: [
      '"We\'ve been impressed by BMO\'s Digital First strategy. How are you ensuring customers who start on mobile receive consistent experiences when they visit a branch?"',
      '"Your competitors like RBC have seen 35% conversion lifts with Adobe. What\'s preventing BMO from achieving similar results?"',
      '"With your NPS improvement targets, how are you currently measuring and optimizing customer journeys across touchpoints?"'
    ],
    evidenceIds: ['1.2', '8.1', '9.1']
  },
  {
    id: 'cdao',
    title: 'Chief Data & AI Officer',
    department: 'Data & Analytics',
    primaryGoals: [
      'Activate AI models for business value',
      'Break down data silos',
      'Ensure data governance and privacy',
      'Enable real-time decision making'
    ],
    painPoints: [
      'AI models not connected to customer engagement',
      'Data fragmented across clouds',
      'Real-time activation challenges',
      'Governance across systems'
    ],
    adobeSolutions: [
      'AEP as unified data layer',
      'Sensei AI for automated insights',
      'Privacy Service for compliance',
      'Real-time activation capabilities'
    ],
    conversationStarters: [
      '"Your AI initiatives with Azure OpenAI are impressive. How are you translating those insights into real-time customer actions?"',
      '"Many banks struggle to activate their data lakes for marketing. How is BMO bridging the gap between analytics and engagement?"',
      '"With your multi-cloud strategy, how are you ensuring consistent data governance and real-time accessibility?"'
    ],
    evidenceIds: ['5.1', '4.2']
  },
  {
    id: 'cto',
    title: 'CTO / Head of Architecture',
    department: 'Technology',
    primaryGoals: [
      'Modernize technology stack',
      'Reduce technical complexity',
      'Ensure platform scalability',
      'Maintain security standards'
    ],
    painPoints: [
      'Complex multi-cloud integration',
      'Legacy system constraints',
      'Vendor proliferation',
      'Performance at scale'
    ],
    adobeSolutions: [
      'AEP as experience abstraction layer',
      'Cloud-native architecture',
      'API-first integration approach',
      'Enterprise security standards'
    ],
    conversationStarters: [
      '"Your multi-cloud strategy with AWS and Azure is sophisticated. Adobe can provide the experience layer that unifies without replacing your investments."',
      '"How are you managing the complexity of customer data flows across your various cloud environments?"',
      '"With Dynatrace for monitoring, you clearly value performance. How are you optimizing the customer experience layer specifically?"'
    ],
    evidenceIds: ['4.2', '5.1', '3.2']
  },
  {
    id: 'head-retail',
    title: 'Head of Personal & Business Banking',
    department: 'Retail Banking',
    primaryGoals: [
      'Increase customer acquisition',
      'Improve product penetration',
      'Reduce service costs',
      'Enhance digital adoption'
    ],
    painPoints: [
      'High cost of customer acquisition',
      'Low product-per-customer ratio',
      'Branch traffic declining',
      'Digital experience gaps'
    ],
    adobeSolutions: [
      'Target for product recommendations',
      'Journey Optimizer for onboarding',
      'Analytics for behavior insights',
      'AEM for self-service capabilities'
    ],
    conversationStarters: [
      '"With branch traffic declining 30% industry-wide, how is BMO driving digital product adoption?"',
      '"Your insurance division saw great results with Adobe Target. Have you considered similar wins for retail banking?"',
      '"Leading banks report 40% CAC reduction through personalization. What\'s your current acquisition cost trend?"'
    ],
    evidenceIds: ['2.3', '7.1', '8.1']
  },
  {
    id: 'head-wealth',
    title: 'Head of Wealth Management',
    department: 'Wealth & Commercial',
    primaryGoals: [
      'Scale personalized advice',
      'Increase advisor productivity',
      'Attract next-gen wealthy clients',
      'Automate compliance'
    ],
    painPoints: [
      'Manual advisor workflows',
      'Generic client communications',
      'Compliance complexity',
      'Limited digital engagement'
    ],
    adobeSolutions: [
      'Marketo for sophisticated nurturing',
      'Real-Time CDP B2B for account intelligence',
      'Workfront for compliance workflows',
      'Target for personalized portals'
    ],
    conversationStarters: [
      '"High-net-worth clients expect Amazon-like experiences. How is BMO delivering personalized digital wealth management?"',
      '"Your advisors could be 40% more productive with automated insights. What\'s preventing that today?"',
      '"TD\'s wealth division credits Adobe for 25% AUM growth. Where do you see the biggest opportunities for BMO?"'
    ],
    evidenceIds: ['2.3', '9.2']
  }
]

// Financial projections and value calculations
const financialProjections = {
  totalAddressableValue: '$60M',
  yearOneValue: '$20M',
  threeYearValue: '$150M',
  paybackPeriod: '8 months',
  roi: '425%',
  breakdown: [
    { category: 'Revenue Growth', value: '$35M', percentage: 58 },
    { category: 'Cost Reduction', value: '$15M', percentage: 25 },
    { category: 'Risk Mitigation', value: '$10M', percentage: 17 }
  ]
}

// Competitive landscape
const competitiveLandscape = [
  {
    competitor: 'RBC',
    adobeInvestment: 'High',
    keyWins: '35% digital sales increase, 25% cost reduction',
    threat: 'Setting new CX standards in Canadian banking',
    evidenceIds: ['9.1']
  },
  {
    competitor: 'TD Bank',
    adobeInvestment: 'High',
    keyWins: '40% faster campaigns, 25% engagement lift',
    threat: 'Leading in personalization capabilities',
    evidenceIds: ['9.2']
  },
  {
    competitor: 'Scotiabank',
    adobeInvestment: 'Medium',
    keyWins: 'Evaluating Adobe for digital transformation',
    threat: 'Potential fast follower',
    evidenceIds: ['7.1']
  }
]

// Success metrics
const successMetrics = [
  {
    metric: 'Digital Conversion Rate',
    current: '2.5%',
    target: '4.0%',
    impact: '+$20M revenue'
  },
  {
    metric: 'Customer Acquisition Cost',
    current: '$450',
    target: '$270',
    impact: '-$8M cost'
  },
  {
    metric: 'Net Promoter Score',
    current: '42',
    target: '57',
    impact: '+15 points'
  },
  {
    metric: 'Time to Market',
    current: '3 weeks',
    target: '3 days',
    impact: '85% faster'
  }
]

export default function SalesIntelligenceReportPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [openPersona, setOpenPersona] = useState<PersonaData | null>(null)
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [expandedImperative, setExpandedImperative] = useState<number | null>(null)

  // Chart data

  const opportunityRadarData = [
    { aspect: 'Account Fit', score: opportunityScore.accountFit * 10, fullMark: 100 },
    { aspect: 'Timing', score: opportunityScore.timingReadiness * 10, fullMark: 100 },
    { aspect: 'Budget', score: opportunityScore.budgetAlignment * 10, fullMark: 100 },
    { aspect: 'Competition', score: opportunityScore.competitivePosition * 10, fullMark: 100 },
    { aspect: 'Executive Buy-in', score: opportunityScore.executiveAlignment * 10, fullMark: 100 }
  ]

  const valueBreakdownData = financialProjections.breakdown.map(item => ({
    name: item.category,
    value: parseInt(item.value.replace(/\D/g, '')),
    percentage: item.percentage
  }))

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Intelligence Report</h1>
            <p className="text-muted-foreground mt-1">
              Account: <span className="font-semibold text-electric-teal">Bank of Montreal (BMO)</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Prepared for: Adobe Enterprise Team</p>
            <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-muted-foreground">Version: 2.0</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="overview">Executive Summary</TabsTrigger>
          <TabsTrigger value="strategic">Strategic Context</TabsTrigger>
          <TabsTrigger value="tech-stack">Tech Analysis</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
          <TabsTrigger value="approach">Sales Playbook</TabsTrigger>
          <TabsTrigger value="financial">Value & ROI</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        {/* Executive Summary */}
        <TabsContent value="overview" className="space-y-6">
          {/* Opportunity Score Card */}
          <Card className="border-2 border-electric-teal">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-electric-teal" />
                  Executive Summary
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Opportunity Score:</span>
                  <Badge className="text-lg px-3 py-1 bg-electric-teal text-white">
                    {opportunityScore.overall}/10
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    High-Potential "Expand" Account
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* The BMO Opportunity */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-electric-teal">The BMO Opportunity</h3>
                <p className="text-muted-foreground leading-relaxed">
                  BMO is a strategic Adobe customer in the midst of a multi-billion dollar "Digital First" transformation. 
                  They have foundational investments in Adobe Experience Cloud, but are significantly underutilizing the 
                  platform's potential. This creates a massive opportunity to expand the partnership by demonstrating how 
                  a fully unified Adobe stack can solve their most pressing challenges and accelerate their "Ambition 2025" goals.
                  <Badge 
                    variant="outline" 
                    className="ml-2 text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedCitation(createCitation(
                      'BMO Digital First transformation and Adobe investment opportunity',
                      ['1.2', '2.3', '8.2']
                    ))}
                  >
                    ⟦1.2,2.3,8.2⟧
                  </Badge>
                </p>
              </div>

              {/* Opportunity Score Breakdown */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Opportunity Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={opportunityRadarData}>
                          <PolarGrid strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="aspect" tick={{ fontSize: 11 }} />
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

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Key Success Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Executive Sponsorship</span>
                      <Progress value={95} className="w-24 h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Budget Availability</span>
                      <Progress value={85} className="w-24 h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Technical Readiness</span>
                      <Progress value={90} className="w-24 h-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Competitive Threat</span>
                      <Progress value={80} className="w-24 h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top 3 Strategic Opportunities */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-electric-teal">Top 3 Strategic Opportunities for Adobe</h3>
                <div className="space-y-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Database className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            1. Unify Siloed Data 
                            <Badge className="ml-2 bg-green-100 text-green-800">High Confidence</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            BMO's multi-cloud strategy (AWS + Azure) has created data silos. They lack a single, 
                            real-time view of the customer. This is a prime opportunity for Adobe Real-Time CDP.
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">$15M opportunity</Badge>
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(
                                'BMO data silo challenge and CDP opportunity',
                                ['4.2', '5.1', '7.2']
                              ))}
                            >
                              ⟦4.2,5.1,7.2⟧
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            2. Scale Personalization 
                            <Badge className="ml-2 bg-green-100 text-green-800">High Confidence</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            BMO uses Adobe Target in insurance but hasn't scaled personalization across core banking. 
                            Clear need to move from basic segmentation to AI-driven, one-to-one experiences.
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">$20M opportunity</Badge>
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(
                                'BMO personalization expansion opportunity',
                                ['2.3', '7.1', '9.2']
                              ))}
                            >
                              ⟦2.3,7.1,9.2⟧
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Network className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            3. Orchestrate Cross-Channel Journeys 
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Customer communications are disjointed. BMO cannot manage coherent journeys across 
                            touchpoints. Greenfield opportunity for Adobe Journey Optimizer.
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">$8M opportunity</Badge>
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(
                                'BMO journey orchestration opportunity',
                                ['3.2', '8.1']
                              ))}
                            >
                              ⟦3.2,8.1⟧
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Wins */}
              <Alert className="border-electric-teal bg-electric-teal/5">
                <Lightbulb className="h-4 w-4 text-electric-teal" />
                <AlertDescription>
                  <strong>Quick Win Opportunity:</strong> BMO Insurance's success with Adobe Target creates an immediate 
                  expansion opportunity. Showcase 25% conversion lift achieved by TD Bank's retail division to build momentum.
                  <Badge 
                    variant="outline" 
                    className="ml-2 text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedCitation(createCitation(
                      'Quick win expansion opportunity from insurance to retail',
                      ['2.3', '9.2']
                    ))}
                  >
                    ⟦2.3,9.2⟧
                  </Badge>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Competitive Intelligence Alert */}
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <strong>Competitive Alert:</strong> RBC and TD Bank are setting new standards with Adobe implementations. 
              RBC achieved 35% digital sales increase. BMO risks falling behind without immediate action.
              <Badge 
                variant="outline" 
                className="ml-2 text-xs cursor-pointer hover:bg-primary/10"
                onClick={() => setSelectedCitation(createCitation(
                  'Competitive threat from RBC and TD Adobe implementations',
                  ['9.1', '9.2']
                ))}
              >
                ⟦9.1,9.2⟧
              </Badge>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Strategic Context */}
        <TabsContent value="strategic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>BMO's Strategic Imperatives (2024-2025)</CardTitle>
              <CardDescription>
                All conversations with BMO must be framed in the context of their publicly stated corporate goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategicImperatives.map((imperative, index) => (
                <Card 
                  key={index} 
                  className={cn(
                    "cursor-pointer transition-all",
                    expandedImperative === index && "ring-2 ring-electric-teal"
                  )}
                  onClick={() => setExpandedImperative(expandedImperative === index ? null : index)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <imperative.icon className="h-5 w-5 text-electric-teal" />
                        {imperative.title}
                      </CardTitle>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        expandedImperative === index && "rotate-90"
                      )} />
                    </div>
                  </CardHeader>
                  {expandedImperative === index && (
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-3">{imperative.description}</p>
                        <Alert className="bg-electric-teal/5 border-electric-teal">
                          <Target className="h-4 w-4 text-electric-teal" />
                          <AlertDescription>
                            <strong>Adobe's Angle:</strong> {imperative.adobeAngle}
                          </AlertDescription>
                        </Alert>
                      </div>
                      <div className="flex gap-2">
                        {imperative.evidenceIds.map(id => (
                          <Badge 
                            key={id}
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCitation(createCitation(imperative.description, imperative.evidenceIds))
                            }}
                          >
                            ⟦{id}⟧
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Investment Context */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Technology Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-electric-teal">$3.5B</p>
                    <p className="text-sm text-muted-foreground">
                      Allocated for technology transformation 2024-2026
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Focus Areas:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Brain className="h-3 w-3" />
                        AI/ML capabilities
                      </li>
                      <li className="flex items-center gap-2">
                        <Cloud className="h-3 w-3" />
                        Cloud migration
                      </li>
                      <li className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Customer experience platforms
                      </li>
                    </ul>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedCitation(createCitation(
                      'BMO technology investment strategy',
                      ['8.2']
                    ))}
                  >
                    ⟦8.2⟧
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  CX Performance Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-electric-teal">+15</p>
                    <p className="text-sm text-muted-foreground">
                      NPS improvement target by 2025
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current Metrics:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>Digital adoption: 75% of transactions</li>
                      <li>Mobile users: 4.2M (20% YoY growth)</li>
                      <li>Current NPS: 42 (target: 57)</li>
                    </ul>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedCitation(createCitation(
                      'BMO customer experience metrics and targets',
                      ['8.1']
                    ))}
                  >
                    ⟦8.1⟧
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tech Stack Analysis */}
        <TabsContent value="tech-stack" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current State Technology Audit</CardTitle>
              <CardDescription>
                Comprehensive analysis of BMO's technology stack with Adobe expansion implications
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
                    <TableHead>Implications</TableHead>
                    <TableHead>Citations</TableHead>
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
                        <Badge variant={
                          item.confidence === 'High' ? 'default' : 
                          item.confidence === 'Medium' ? 'secondary' : 
                          'outline'
                        }>
                          {item.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        {item.implications}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Architecture Diagrams */}
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Inferred Architecture & Data Flow
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">Current State: Fragmented & Siloed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-sm">
                              Data flows are channel-specific, creating inconsistent experiences and missed opportunities
                            </AlertDescription>
                          </Alert>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                              <span>Web analytics separate from mobile</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                              <span>AWS and Azure data not unified</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-red-600 mt-0.5" />
                              <span>Each channel has partial customer view</span>
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-600">Proposed State: Unified & Intelligent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-sm">
                              AEP becomes central "System of Engagement" unifying all customer data
                            </AlertDescription>
                          </Alert>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>Single customer profile across channels</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>Real-time activation capabilities</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>AI-powered next best actions</span>
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Implementation Considerations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Implementation Hurdles & Mitigation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Data Integration & Governance</p>
                          <p className="text-sm text-muted-foreground">
                            Requires deep collaboration with BMO's IT and security teams
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            <strong>Mitigation:</strong> Start with robust governance model in AEP from day one
                            <Badge 
                              variant="outline" 
                              className="ml-2 text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(
                                'AEP implementation best practices',
                                ['6.1']
                              ))}
                            >
                              ⟦6.1⟧
                            </Badge>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Stakeholder Alignment</p>
                          <p className="text-sm text-muted-foreground">
                            Needs buy-in from teams using competing tools
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            <strong>Mitigation:</strong> Clear migration plan with training and early wins demonstration
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Phased Rollout</p>
                          <p className="text-sm text-muted-foreground">
                            "Boil the ocean" approach will fail
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            <strong>Mitigation:</strong> Start with high-impact use cases before complex integrations
                            <Badge 
                              variant="outline" 
                              className="ml-2 text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(
                                'Phased implementation approach',
                                ['6.3']
                              ))}
                            >
                              ⟦6.3⟧
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gap Analysis */}
        <TabsContent value="gaps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opportunity & Gap Analysis</CardTitle>
              <CardDescription>
                Identified gaps with quantified business impact and Adobe solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gapData.map((gap, index) => (
                  <Card 
                    key={index} 
                    className={cn(
                      "border-l-4",
                      gap.priority === 'Critical' && "border-l-red-500",
                      gap.priority === 'High' && "border-l-yellow-500",
                      gap.priority === 'Medium' && "border-l-blue-500"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className={cn(
                            "h-4 w-4",
                            gap.priority === 'Critical' && "text-red-600",
                            gap.priority === 'High' && "text-yellow-600",
                            gap.priority === 'Medium' && "text-blue-600"
                          )} />
                          {gap.area}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            gap.priority === 'Critical' ? 'destructive' :
                            gap.priority === 'High' ? 'secondary' :
                            'outline'
                          }>
                            {gap.priority}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {gap.estimatedValue}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-1">Current Gap:</p>
                          <p className="text-sm text-muted-foreground">{gap.gap}</p>
                          <Alert className="mt-2 border-red-200 bg-red-50 dark:bg-red-900/20">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-sm">
                              <strong>Business Impact:</strong> {gap.businessImpact}
                            </AlertDescription>
                          </Alert>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-1">Adobe Solution:</p>
                          <p className="text-sm text-muted-foreground mb-2">{gap.solution}</p>
                          <div className="flex flex-wrap gap-1">
                            {gap.adobeProducts.map(product => (
                              <Badge key={product} variant="secondary" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 pt-2">
                        {gap.evidenceIds.map(id => (
                          <Badge 
                            key={id}
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => setSelectedCitation(createCitation(
                              `${gap.gap} - ${gap.businessImpact}`,
                              gap.evidenceIds
                            ))}
                          >
                            ⟦{id}⟧
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total Opportunity Summary */}
              <Card className="mt-6 bg-electric-teal/5 border-electric-teal">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-electric-teal" />
                    Total Addressable Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-3xl font-bold text-electric-teal">$60M</p>
                      <p className="text-sm text-muted-foreground">Total addressable value</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-electric-teal">$20M</p>
                      <p className="text-sm text-muted-foreground">Year 1 opportunity</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-electric-teal">8 months</p>
                      <p className="text-sm text-muted-foreground">Average payback period</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Playbook */}
        <TabsContent value="approach" className="space-y-6">
          {/* Phased Rollout Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Phased Rollout</CardTitle>
              <CardDescription>
                Strategic implementation approach designed for maximum impact and adoption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {phaseData.map((phase) => (
                  <Card key={phase.phase} className="border-2 border-dashed">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-electric-teal text-white font-bold">
                            {phase.phase}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{phase.title}</CardTitle>
                            <CardDescription>{phase.duration}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">{phase.investment}</Badge>
                          <p className="text-xs text-muted-foreground">{phase.roi}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="font-medium text-sm mb-2">Lead Products:</p>
                          <div className="flex flex-wrap gap-1">
                            {phase.products.map(product => (
                              <Badge key={product} variant="secondary" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-2">Key Objectives:</p>
                          <ul className="space-y-1">
                            {phase.objectives.slice(0, 2).map((objective, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                                <span>{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="font-medium text-sm mb-2">Expected Outcomes:</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {phase.expectedOutcomes.map((outcome, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-4 w-4 text-electric-teal" />
                              <span className="text-muted-foreground">{outcome}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {phase.evidenceIds.map(id => (
                          <Badge 
                            key={id}
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => setSelectedCitation(createCitation(
                              `Phase ${phase.phase}: ${phase.title}`,
                              phase.evidenceIds
                            ))}
                          >
                            ⟦{id}⟧
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Personas */}
          <Card>
            <CardHeader>
              <CardTitle>Target Departments & Key Personas</CardTitle>
              <CardDescription>
                Detailed profiles and conversation strategies for key decision makers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {personaData.map((persona) => (
                  <Card 
                    key={persona.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setOpenPersona(persona)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {persona.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {persona.department}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-red-600 mb-1">Primary Pain:</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {persona.painPoints[0]}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-green-600 mb-1">Adobe Solution:</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {persona.adobeSolutions[0]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                          View conversation guide →
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

          {/* Competitive Positioning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Competitive Landscape
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Adobe Investment</TableHead>
                    <TableHead>Key Wins</TableHead>
                    <TableHead>Threat Level</TableHead>
                    <TableHead>Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitiveLandscape.map((comp, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{comp.competitor}</TableCell>
                      <TableCell>
                        <Badge variant={
                          comp.adobeInvestment === 'High' ? 'destructive' :
                          comp.adobeInvestment === 'Medium' ? 'secondary' :
                          'outline'
                        }>
                          {comp.adobeInvestment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{comp.keyWins}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{comp.threat}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {comp.evidenceIds.map(id => (
                            <Badge 
                              key={id}
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary/10"
                              onClick={() => setSelectedCitation(createCitation(comp.threat, comp.evidenceIds))}
                            >
                              ⟦{id}⟧
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Analysis */}
        <TabsContent value="financial" className="space-y-6">
          {/* Value Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Projections & ROI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-electric-teal">{financialProjections.totalAddressableValue}</p>
                    <p className="text-xs text-muted-foreground">Addressable opportunity</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Year 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-electric-teal">{financialProjections.yearOneValue}</p>
                    <p className="text-xs text-muted-foreground">Initial value capture</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">3-Year Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-electric-teal">{financialProjections.threeYearValue}</p>
                    <p className="text-xs text-muted-foreground">Cumulative impact</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Payback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{financialProjections.paybackPeriod}</p>
                    <p className="text-xs text-muted-foreground">Break-even point</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{financialProjections.roi}</p>
                    <p className="text-xs text-muted-foreground">3-year return</p>
                  </CardContent>
                </Card>
              </div>

              {/* Value Breakdown Chart */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Value Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReChartsPieChart>
                          <Pie
                            data={valueBreakdownData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.percentage}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {valueBreakdownData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={
                                index === 0 ? '#10b981' :
                                index === 1 ? '#06b6d4' :
                                '#8b5cf6'
                              } />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${value}M`} />
                        </ReChartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Success Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {successMetrics.map((metric, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{metric.metric}</span>
                            <Badge variant="outline" className="text-xs">
                              {metric.impact}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Current: {metric.current}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-green-600 font-medium">Target: {metric.target}</span>
                          </div>
                          <Progress 
                            value={
                              (parseFloat(metric.target) / parseFloat(metric.current)) * 30
                            } 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Investment Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Investment & Return Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { month: 'Q1', investment: -2.5, returns: 0 },
                        { month: 'Q2', investment: -3.5, returns: 1.5 },
                        { month: 'Q3', investment: -4, returns: 4 },
                        { month: 'Q4', investment: 0, returns: 8 },
                        { month: 'Year 2', investment: -2, returns: 25 },
                        { month: 'Year 3', investment: -1, returns: 45 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${Math.abs(Number(value))}M`} />
                        <Legend />
                        <Bar dataKey="investment" fill="#ef4444" name="Investment" />
                        <Bar dataKey="returns" fill="#10b981" name="Returns" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Locker</CardTitle>
              <CardDescription>
                Supporting documentation and sources for all claims in this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Group evidence by category */}
                {Object.entries(
                  evidenceData.reduce((acc, evidence) => {
                    const category = evidence.type === 'document' ? 'Public Documents' : 
                                   evidence.type === 'analysis' ? 'Market Analysis' : 
                                   evidence.type === 'web' ? 'Technology Audit' : 'Other'
                    if (!acc[category]) acc[category] = []
                    acc[category].push(evidence)
                    return acc
                  }, {} as Record<string, Evidence[]>)
                ).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {category}
                    </h3>
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
                                  [{evidence.id}]
                                </Badge>
                                {evidence.title}
                              </CardTitle>
                              <Badge variant="secondary" className="text-xs">
                                {evidence.metadata?.confidence}% confidence
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                              {evidence.excerpt || evidence.title}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span>Source: {evidence.source}</span>
                                <span>Date: {evidence.metadata?.lastModified ? new Date(evidence.metadata.lastModified).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              {evidence.url && (
                                <a 
                                  href={evidence.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View source
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {openPersona?.title}
            </DialogTitle>
            <DialogDescription>
              {openPersona?.department} - Conversation Guide
            </DialogDescription>
          </DialogHeader>
          {openPersona && (
            <div className="space-y-6 mt-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Primary Goals</h4>
                  <ul className="space-y-2">
                    {openPersona.primaryGoals.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 text-green-600 mt-0.5" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Pain Points</h4>
                  <ul className="space-y-2">
                    {openPersona.painPoints.map((pain, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                        <span>{pain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-blue-600 mb-3">Adobe Solutions</h4>
                <div className="space-y-2">
                  {openPersona.adobeSolutions.map((solution, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm">{solution}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-purple-600 mb-3">Conversation Starters</h4>
                <div className="space-y-3">
                  {openPersona.conversationStarters.map((starter, i) => (
                    <Card key={i} className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                      <CardContent className="pt-4">
                        <p className="text-sm italic">"{starter}"</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-1 pt-2">
                <span className="text-sm text-muted-foreground mr-2">Supporting Evidence:</span>
                {openPersona.evidenceIds.map(id => (
                  <Badge 
                    key={id}
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      setOpenPersona(null)
                      setSelectedCitation(createCitation(
                        `${openPersona.title} - ${openPersona.painPoints[0]}`,
                        openPersona.evidenceIds
                      ))
                    }}
                  >
                    [{id}]
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