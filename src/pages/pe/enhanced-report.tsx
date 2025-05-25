import { PEReportLayout } from '@/components/pe/enhanced-report/PEReportLayout'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { StackEvolutionTimeline } from '@/components/pe/enhanced-report/sections/StackEvolutionTimeline'

// Mock data for demonstration
const mockReportData = {
  executiveSummary: {
    companyName: 'Ring4',
    evaluationDate: '2025-01-15',
    overallScore: 82,
    investmentThesis: 'Ring4 emerges as a technically robust and forward-looking B2B SaaS platform that aligns well with Inturact Capital\'s investment focus on scalable, under-optimized SaaS assets. The lean engineering team has built a modern cloud communications stack with features that rival and exceed larger competitors.',
    keyFindings: {
      enablers: [
        'Cloud-native architecture with proven scalability to 700k+ users',
        'Built-in video conferencing differentiator vs competitors',
        'Automated spam protection and number reputation management',
        'Efficient unit economics with $9.99/line pricing',
        'Modern tech stack (React, Node.js, WebRTC) enabling rapid development'
      ],
      blockers: [
        'No number port-out capability limiting customer mobility',
        'Lack of enterprise features (SSO, formal security audits)',
        'Limited third-party integrations vs competitors',
        'Small team size may constrain growth velocity'
      ],
      risks: [
        'Heavy dependence on third-party telecom providers affecting margins',
        'No documented disaster recovery plan for multi-region failover',
        'Missing E911 support could limit enterprise adoption',
        'Technical debt in legacy authentication service'
      ]
    },
    recommendations: [
      'Implement number port-out to remove sales friction',
      'Add Zapier/CRM integrations to match competitor offerings',
      'Pursue SOC2 certification for enterprise credibility',
      'Layer AI features (call summaries, sentiment analysis) for differentiation',
      'Establish multi-region infrastructure for reliability'
    ],
    dealBreakers: []
  },
  stackEvolution: {
    companyName: 'Ring4',
    foundingYear: '2012',
    currentYear: '2024',
    overallEvolution: 'Ring4\'s technology stack has evolved from a simple cloud telephony concept to a comprehensive business communications platform. The company has consistently modernized its architecture, transitioning from early VoIP implementations to a cloud-native, microservices-based platform that leverages modern web technologies and third-party integrations.',
    timeline: [
      {
        year: '2012',
        title: 'Company Founding',
        description: 'Ring4 (originally YourVirtualSIM, Inc.) founded by Alex Botteri and Ferreol de Soras with focus on cloud telephony APIs.',
                 category: 'team' as const,
        confidence: 90,
        keyDevelopments: [
          'Initial cloud telephony API research and development',
          'Core founding team establishment',
          'Early technology stack decisions'
        ],
        impact: 'high' as const
      },
      {
        year: '2017',
        quarter: '1',
        title: 'Product Launch & Mobile App',
        description: 'Ring4 mobile app launches on iOS (later Android), offering virtual numbers. Featured as Product Hunt\'s Best Product in March 2017.',
        category: 'product' as const,
        confidence: 100,
        keyDevelopments: [
          'iOS app launch with virtual number functionality',
          'Product Hunt recognition and early user traction',
          '250,000+ registered users by mid-2018',
          'Top-100 grossing iOS utility app achievement'
        ],
        impact: 'high' as const
      },
      {
        year: '2018',
        title: 'Rapid Growth & Funding',
        description: 'Significant user and revenue growth (150% increase in 12 months). Seed funding of $225k via Republic. Key engineering hires for iOS and WebRTC.',
        category: 'funding' as const,
        confidence: 90,
        keyDevelopments: [
          '150% revenue increase in 12 months post-launch',
          '$225k seed funding via Republic',
          'Key engineering hires (iOS, WebRTC specialists)',
          'Mobile-first VoIP platform with numbers in 7 countries'
        ],
        impact: 'high' as const
      },
      {
        year: '2019',
        title: 'Platform Refinement',
        description: 'Shift towards small-business features with emphasis on scaling backend infrastructure. Focus on creating a "sleek product that scales".',
        category: 'infrastructure' as const,
        confidence: 80,
        keyDevelopments: [
          'Backend infrastructure scaling improvements',
          'Small business feature development',
          'Platform architecture optimization',
          'Scalability-focused engineering practices'
        ],
        impact: 'medium' as const
      },
      {
        year: '2020',
        title: 'Cloud Infrastructure Investment',
        description: 'Major investment in cloud infrastructure and modern development practices. Enhanced focus on reliability and performance.',
        category: 'infrastructure' as const,
        confidence: 85,
        keyDevelopments: [
          'Cloud infrastructure modernization',
          'DevOps and CI/CD pipeline implementation',
          'Performance monitoring and optimization',
          'Reliability engineering practices'
        ],
        impact: 'medium' as const
      },
      {
        year: '2021',
        title: 'Feature Expansion',
        description: 'Addition of video conferencing capabilities and advanced business features. Integration of modern web technologies.',
        category: 'product' as const,
        confidence: 85,
        keyDevelopments: [
          'Built-in video conferencing implementation',
          'Advanced business communication features',
          'Modern web technology stack adoption',
          'Enhanced user interface and experience'
        ],
        impact: 'high' as const
      },
      {
        year: '2022',
        title: 'Technology Stack Modernization',
        description: 'Adoption of React, Node.js, and WebRTC for improved development velocity and user experience.',
        category: 'technology' as const,
        confidence: 90,
        keyDevelopments: [
          'React frontend framework adoption',
          'Node.js backend implementation',
          'WebRTC integration for real-time communication',
          'Modern JavaScript ecosystem adoption'
        ],
        impact: 'high' as const
      },
      {
        year: '2023',
        title: 'AI and Automation Integration',
        description: 'Implementation of automated spam protection and number reputation management systems.',
        category: 'technology' as const,
        confidence: 85,
        keyDevelopments: [
          'Automated spam call protection',
          'Number reputation monitoring system',
          'AI-driven call filtering algorithms',
          'Machine learning integration for user experience'
        ],
        impact: 'medium' as const
      },
      {
        year: '2024',
        title: 'Current State - Scalable Platform',
        description: 'Mature cloud-native platform serving 700k+ users with modern architecture and competitive feature set.',
        category: 'product' as const,
        confidence: 95,
        keyDevelopments: [
          'Proven scalability to 700k+ users',
          'Competitive feature parity with larger players',
          'Efficient unit economics at $9.99/line pricing',
          'Modern, maintainable codebase'
        ],
        impact: 'high' as const
      }
    ],
    keyMilestones: {
      founding: '2012 - Cloud telephony vision',
      firstProduct: '2017 Q1 - iOS app launch',
      majorPivot: '2019 - SMB focus shift',
      currentState: '2024 - Mature SaaS platform'
    }
  }
}

export default function EnhancedPEReportPage() {
  return (
    <PEReportLayout>
      <div className="space-y-12">
        {/* Executive Summary - Always visible at top */}
        <ExecutiveSummary data={mockReportData.executiveSummary} />
        
        {/* Key Insights Dashboard - Summary cards that expand */}
        <section id="tech-health-overview" className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">Technical Health Overview</h2>
            <p className="text-muted-foreground">Key metrics and insights at a glance</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Placeholder cards for other sections */}
            <div className="rounded-lg border bg-muted/20 p-8 text-center">
              <p className="text-muted-foreground">Technical Health Score Component</p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-8 text-center">
              <p className="text-muted-foreground">Risk Assessment Dashboard</p>
            </div>
          </div>
        </section>

        {/* Stack Evolution Timeline */}
        <StackEvolutionTimeline data={mockReportData.stackEvolution} />

        {/* Detailed Analysis Sections */}
        <section id="technical-leadership" className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">Founding Team & Technical Leadership</h2>
            <p className="text-muted-foreground">Deep dive into team capabilities and gaps</p>
          </div>
          
          <div className="rounded-lg border bg-muted/20 p-8 text-center">
            <p className="text-muted-foreground">Team Analysis Component</p>
          </div>
        </section>

        {/* Additional sections would follow the same pattern */}
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg text-muted-foreground">
            Additional 15+ detailed sections would appear here,
            <br />each with collapsible content and progressive disclosure
          </p>
        </div>
      </div>
    </PEReportLayout>
  )
} 