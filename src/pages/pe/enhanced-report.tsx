import { PEReportLayout } from '@/components/pe/enhanced-report/PEReportLayout'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { StackEvolutionTimeline } from '@/components/pe/enhanced-report/sections/StackEvolutionTimeline'
import { TechnicalLeadership } from '@/components/pe/enhanced-report/sections/TechnicalLeadership'

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
  },
  technicalLeadership: {
    companyName: 'Ring4',
    overallAssessment: 'Ring4\'s technical leadership demonstrates strong domain expertise in telecommunications and cloud infrastructure. The founding team brings complementary skills in software engineering and business development, though the organization would benefit from additional senior technical leadership as it scales.',
    teamSize: 12,
    leadershipScore: 78,
    founders: [
      {
        name: 'Alex Botteri',
        role: 'CEO & Co-Founder',
        tenure: '12+ years',
        background: 'Experienced telecommunications entrepreneur with deep technical background in VoIP and cloud communications. Previously founded and scaled telecom startups, bringing both technical vision and business acumen to Ring4.',
        strengths: [
          'Deep telecommunications domain expertise',
          'Product vision and strategic planning',
          'Fundraising and business development',
          'Technical architecture understanding'
        ],
        experience: {
          years: 15,
          companies: ['Ring4', 'Previous telecom startups', 'Enterprise software'],
          domains: ['VoIP', 'Cloud Communications', 'SaaS', 'Mobile Apps']
        },
        education: 'Computer Science degree, entrepreneurship background',
        confidence: 90,
        riskLevel: 'low' as const
      },
      {
        name: 'Ferreol de Soras',
        role: 'CTO & Co-Founder',
        tenure: '12+ years',
        background: 'Technical co-founder with strong engineering background in distributed systems and real-time communications. Responsible for Ring4\'s technical architecture and engineering team leadership.',
        strengths: [
          'Distributed systems architecture',
          'Real-time communications expertise',
          'Engineering team leadership',
          'Scalability and performance optimization'
        ],
        experience: {
          years: 12,
          companies: ['Ring4', 'Cloud infrastructure companies', 'Telecom vendors'],
          domains: ['WebRTC', 'Cloud Infrastructure', 'Microservices', 'Real-time Systems']
        },
        education: 'Engineering degree, specialized in telecommunications',
        confidence: 85,
        riskLevel: 'low' as const
      }
    ],
    keyTechnicalLeaders: [],
    leadershipGaps: [
      {
        area: 'Senior Engineering Leadership',
        severity: 'important' as const,
        description: 'Limited senior engineering leadership beyond founders. As the team scales, additional technical leadership will be needed to manage growing engineering complexity.',
        recommendation: 'Hire VP of Engineering or Senior Engineering Manager with experience scaling technical teams in SaaS environments.',
        timeframe: '6-12 months'
      },
      {
        area: 'Security & Compliance Expertise',
        severity: 'critical' as const,
        description: 'Lack of dedicated security leadership may limit enterprise adoption and compliance capabilities (SOC2, HIPAA, etc.).',
        recommendation: 'Bring in security-focused technical leader or consultant to establish formal security practices and compliance frameworks.',
        timeframe: '3-6 months'
      },
      {
        area: 'Data & Analytics Leadership',
        severity: 'nice-to-have' as const,
        description: 'Limited data science and analytics capabilities may constrain product intelligence and AI feature development.',
        recommendation: 'Consider hiring data engineering or analytics leader to unlock AI-driven features and business intelligence.',
        timeframe: '12-18 months'
      }
    ],
    recommendations: [
      'Establish formal technical advisory board with telecommunications and SaaS scaling expertise',
      'Implement structured engineering career progression to retain and attract senior talent',
      'Create technical mentorship programs to develop internal leadership pipeline',
      'Establish formal architecture review processes as team grows',
      'Invest in engineering management training for current technical leads'
    ],
    riskFactors: [
      'Heavy dependence on founder technical knowledge',
      'Limited bench strength in senior engineering roles',
      'Potential scaling challenges without additional technical leadership'
    ]
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

        {/* Technical Leadership Analysis */}
        <TechnicalLeadership data={mockReportData.technicalLeadership} />

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