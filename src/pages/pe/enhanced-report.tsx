import { PEReportLayout } from '@/components/pe/enhanced-report/PEReportLayout'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { StackEvolutionTimeline } from '@/components/pe/enhanced-report/sections/StackEvolutionTimeline'
import { TechnicalLeadership } from '@/components/pe/enhanced-report/sections/TechnicalLeadership'
import { StackArchitecture } from '@/components/pe/enhanced-report/sections/StackArchitecture'
import { CloudVendorDependencies } from '@/components/pe/enhanced-report/sections/CloudVendorDependencies'
import { CodeQualityDevOps } from '@/components/pe/enhanced-report/sections/CodeQualityDevOps'

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
  },
  stackArchitecture: {
    companyName: 'Ring4',
    architecturePattern: 'Microservices with API Gateway',
    overallScore: 78,
    scalabilityAssessment: 'Ring4 employs a modern microservices architecture that demonstrates good scalability patterns. The system is built on cloud-native principles with containerized services, API gateway for traffic management, and distributed data storage. While the architecture supports current scale (700k+ users), some components may require optimization for 10x growth.',
    components: [
      {
        name: 'API Gateway',
        type: 'infrastructure' as const,
        technology: 'Kong/Nginx',
        description: 'Central entry point for all client requests, handles routing, authentication, and rate limiting',
        scalabilityScore: 85,
        reliabilityScore: 90,
        securityScore: 88,
        concerns: ['Single point of failure without proper redundancy', 'Rate limiting may need tuning for peak loads'],
        strengths: ['Centralized security policies', 'Excellent monitoring and logging', 'Built-in load balancing']
      },
      {
        name: 'User Service',
        type: 'backend' as const,
        technology: 'Node.js + Express',
        description: 'Handles user authentication, profile management, and account operations',
        scalabilityScore: 75,
        reliabilityScore: 82,
        securityScore: 85,
        concerns: ['Session management could be optimized', 'Database queries need optimization'],
        strengths: ['Clean API design', 'Good error handling', 'Comprehensive logging']
      },
      {
        name: 'Communication Engine',
        type: 'backend' as const,
        technology: 'WebRTC + Node.js',
        description: 'Core service handling voice calls, SMS, and video conferencing functionality',
        scalabilityScore: 88,
        reliabilityScore: 85,
        securityScore: 90,
        concerns: ['WebRTC peer connection limits', 'Media server scaling complexity'],
        strengths: ['Low latency design', 'Built-in encryption', 'Efficient resource usage']
      },
      {
        name: 'React Frontend',
        type: 'frontend' as const,
        technology: 'React 18 + TypeScript',
        description: 'Modern web application with responsive design and real-time updates',
        scalabilityScore: 80,
        reliabilityScore: 78,
        securityScore: 75,
        concerns: ['Bundle size optimization needed', 'Some legacy components need refactoring'],
        strengths: ['Modern tech stack', 'Good component architecture', 'TypeScript adoption']
      },
      {
        name: 'PostgreSQL Cluster',
        type: 'database' as const,
        technology: 'PostgreSQL 14',
        description: 'Primary database with read replicas for user data, call logs, and configuration',
        scalabilityScore: 82,
        reliabilityScore: 88,
        securityScore: 92,
        concerns: ['Write scaling limitations', 'Complex queries need optimization'],
        strengths: ['ACID compliance', 'Excellent backup strategy', 'Strong encryption at rest']
      },
      {
        name: 'Redis Cache',
        type: 'database' as const,
        technology: 'Redis 6',
        description: 'In-memory cache for session data, rate limiting, and real-time features',
        scalabilityScore: 90,
        reliabilityScore: 85,
        securityScore: 80,
        concerns: ['Memory usage monitoring needed', 'Persistence configuration'],
        strengths: ['Excellent performance', 'Built-in clustering', 'Versatile data structures']
      }
    ],
    infrastructureMetrics: [
      {
        name: 'API Response Time',
        value: '95ms',
        score: 85,
        benchmark: '<100ms',
        status: 'good' as const,
        trend: 'stable' as const
      },
      {
        name: 'System Uptime',
        value: '99.8%',
        score: 95,
        benchmark: '99.9%',
        status: 'excellent' as const,
        trend: 'improving' as const
      },
      {
        name: 'Database Query Performance',
        value: '45ms avg',
        score: 78,
        benchmark: '<50ms',
        status: 'good' as const,
        trend: 'stable' as const
      },
      {
        name: 'Error Rate',
        value: '0.12%',
        score: 92,
        benchmark: '<0.1%',
        status: 'good' as const,
        trend: 'improving' as const
      },
      {
        name: 'Concurrent Users',
        value: '12,000',
        score: 88,
        benchmark: '15,000',
        status: 'good' as const,
        trend: 'stable' as const
      }
    ],
    cloudStrategy: {
      provider: 'AWS',
      multiCloud: false,
      hybridCloud: false,
      cloudNativeScore: 85,
      vendorLockRisk: 'medium' as const
    },
    dataFlow: {
      description: 'Ring4 follows a clean data flow pattern with API gateway routing requests to appropriate microservices. User data flows through the User Service, while communication data is processed by the Communication Engine. Real-time features utilize WebSocket connections with Redis for state management.',
      bottlenecks: [
        'Database write operations during peak hours',
        'WebRTC signaling server under high concurrent load',
        'File upload processing for voicemail attachments'
      ],
      optimizations: [
        'Implemented connection pooling for database access',
        'Added CDN for static asset delivery',
        'Optimized Redis usage for session management',
        'Introduced async processing for non-critical operations'
      ]
    },
    scalingChallenges: {
      current: [
        'Database write scaling with increasing user base',
        'WebRTC media server capacity planning',
        'Cross-region latency for international users'
      ],
      anticipated: [
        '10x user growth requiring horizontal scaling',
        'Enterprise features demanding higher SLA requirements',
        'Compliance requirements for different geographic regions'
      ],
      mitigationStrategies: [
        'Implement database sharding strategy',
        'Deploy multi-region WebRTC infrastructure',
        'Introduce event-driven architecture for better decoupling',
        'Implement comprehensive monitoring and auto-scaling'
      ]
    },
    recommendations: [
      'Implement database sharding to handle write scaling',
      'Add comprehensive monitoring and alerting across all services',
      'Introduce circuit breakers for external service dependencies',
      'Implement blue-green deployment strategy for zero-downtime updates',
      'Add automated performance testing in CI/CD pipeline'
    ],
    riskFactors: [
      'Single cloud provider dependency creates vendor lock-in risk',
      'Limited disaster recovery testing and documentation',
      'Potential WebRTC scaling bottlenecks for enterprise adoption',
      'Database performance degradation under high write loads'
    ]
  },
  cloudVendorDependencies: {
    companyName: 'Ring4',
    overallRiskScore: 72,
    totalMonthlySpend: '$18,500',
    vendorCount: 12,
    dependencies: [
      {
        name: 'Amazon Web Services (AWS)',
        category: 'infrastructure' as const,
        criticality: 'critical' as const,
        description: 'Primary cloud infrastructure provider hosting all core services, databases, and compute resources',
        monthlySpend: '$8,200',
        contractTerms: 'Pay-as-you-go, no long-term commitment',
        riskLevel: 'medium' as const,
        alternatives: ['Google Cloud Platform', 'Microsoft Azure', 'DigitalOcean'],
        migrationComplexity: 'high' as const,
        dataExposure: 'extensive' as const
      },
      {
        name: 'Twilio',
        category: 'communication' as const,
        criticality: 'critical' as const,
        description: 'Core telephony services providing voice calling, SMS, and phone number provisioning',
        monthlySpend: '$4,800',
        contractTerms: 'Monthly billing, volume discounts',
        riskLevel: 'high' as const,
        alternatives: ['Vonage', 'Plivo', 'MessageBird'],
        migrationComplexity: 'medium' as const,
        dataExposure: 'extensive' as const
      },
      {
        name: 'Stripe',
        category: 'payment' as const,
        criticality: 'high' as const,
        description: 'Payment processing for subscription billing and one-time purchases',
        monthlySpend: '$1,200',
        contractTerms: 'Transaction-based pricing, no monthly fees',
        riskLevel: 'low' as const,
        alternatives: ['PayPal', 'Square', 'Braintree'],
        migrationComplexity: 'low' as const,
        dataExposure: 'moderate' as const
      },
      {
        name: 'SendGrid',
        category: 'communication' as const,
        criticality: 'medium' as const,
        description: 'Email delivery service for transactional emails and notifications',
        monthlySpend: '$320',
        contractTerms: 'Monthly subscription with volume tiers',
        riskLevel: 'low' as const,
        alternatives: ['Mailgun', 'Amazon SES', 'Postmark'],
        migrationComplexity: 'low' as const,
        dataExposure: 'limited' as const
      },
      {
        name: 'Datadog',
        category: 'analytics' as const,
        criticality: 'medium' as const,
        description: 'Application performance monitoring and infrastructure observability',
        monthlySpend: '$890',
        contractTerms: 'Annual contract with monthly billing',
        riskLevel: 'low' as const,
        alternatives: ['New Relic', 'Grafana', 'Prometheus'],
        migrationComplexity: 'medium' as const,
        dataExposure: 'moderate' as const
      }
    ],
    riskAssessment: {
      singlePointsOfFailure: [
        'AWS outage would impact entire platform availability',
        'Twilio service disruption would disable all calling features',
        'Single region deployment creates geographic risk'
      ],
      vendorConcentrationRisk: 'Ring4 has moderate vendor concentration risk with heavy dependence on AWS and Twilio representing 70% of total vendor spend. While both are industry leaders, this concentration could impact negotiating power and create operational risk.',
      dataPrivacyRisks: [
        'Customer call data processed by Twilio in multiple jurisdictions',
        'Payment data handled by Stripe with PCI compliance requirements',
        'User analytics data shared with Datadog for monitoring'
      ],
      costOptimizationOpportunities: [
        'AWS Reserved Instances could reduce infrastructure costs by 20-30%',
        'Twilio volume discounts available at higher usage tiers',
        'Email service consolidation could reduce SendGrid costs'
      ]
    },
    recommendations: [
      'Implement multi-cloud strategy for critical workloads',
      'Negotiate enterprise contracts with key vendors for better pricing',
      'Establish vendor performance SLAs and monitoring',
      'Create detailed vendor exit strategies for critical dependencies',
      'Implement data residency controls for compliance requirements'
    ],
    contingencyPlans: {
      criticalVendorFailure: [
        'Maintain hot standby infrastructure on secondary cloud provider',
        'Pre-negotiated emergency contracts with alternative telephony providers',
        'Automated failover procedures for critical services'
      ],
      costEscalation: [
        'Usage monitoring and alerting for unexpected cost spikes',
        'Pre-approved alternative vendors for cost-sensitive services',
        'Reserved capacity planning to lock in pricing'
      ],
      dataBreachResponse: [
        'Immediate vendor notification and assessment procedures',
        'Customer communication plan for data exposure incidents',
        'Legal and compliance review process for vendor breaches'
      ]
    }
  },
  codeQualityDevOps: {
    companyName: 'Ring4',
    overallScore: 76,
    codeQualityScore: 78,
    devOpsMaturityScore: 82,
    technicalDebtScore: 68,
    codeMetrics: [
      {
        name: 'Code Coverage',
        value: '78%',
        score: 78,
        benchmark: '>80%',
        trend: 'improving' as const,
        status: 'good' as const
      },
      {
        name: 'Cyclomatic Complexity',
        value: '6.2 avg',
        score: 72,
        benchmark: '<10',
        trend: 'stable' as const,
        status: 'good' as const
      },
      {
        name: 'Technical Debt Ratio',
        value: '18%',
        score: 68,
        benchmark: '<15%',
        trend: 'declining' as const,
        status: 'fair' as const
      },
      {
        name: 'Code Duplication',
        value: '8%',
        score: 85,
        benchmark: '<10%',
        trend: 'improving' as const,
        status: 'excellent' as const
      },
      {
        name: 'Security Hotspots',
        value: '12',
        score: 75,
        benchmark: '<10',
        trend: 'stable' as const,
        status: 'good' as const
      }
    ],
    devOpsPractices: [],
    technicalDebt: [
      {
        category: 'Legacy Authentication Service',
        severity: 'high' as const,
        description: 'Legacy authentication service using outdated JWT implementation with security vulnerabilities',
        estimatedEffort: '3-4 weeks',
        businessImpact: 'Security risk and potential compliance issues'
      },
      {
        category: 'Database Query Optimization',
        severity: 'medium' as const,
        description: 'Several database queries lack proper indexing causing performance degradation under load',
        estimatedEffort: '1-2 weeks',
        businessImpact: 'Slower response times during peak usage'
      },
      {
        category: 'Frontend Bundle Size',
        severity: 'medium' as const,
        description: 'React application bundle size is larger than optimal, affecting initial load times',
        estimatedEffort: '1 week',
        businessImpact: 'Reduced user experience on slower connections'
      },
      {
        category: 'API Documentation',
        severity: 'low' as const,
        description: 'Internal API documentation is outdated and incomplete',
        estimatedEffort: '2 weeks',
        businessImpact: 'Slower developer onboarding and integration'
      }
    ],
    testingStrategy: {
      unitTestCoverage: 78,
      integrationTestCoverage: 65,
      e2eTestCoverage: 45,
      testAutomation: true,
      performanceTesting: false,
      securityTesting: true
    },
    cicdPipeline: {
      automatedBuilds: true,
      automatedTesting: true,
      automatedDeployment: true,
      rollbackCapability: true,
      environmentParity: false,
      deploymentFrequency: '2-3 times per week',
      leadTime: '2-4 hours',
      mttr: '15 minutes'
    },
    codebaseHealth: {
      languageDistribution: [
        { name: 'TypeScript', percentage: 45, quality: 'excellent' },
        { name: 'JavaScript', percentage: 30, quality: 'good' },
        { name: 'Python', percentage: 15, quality: 'good' },
        { name: 'SQL', percentage: 10, quality: 'fair' }
      ],
      dependencyManagement: 'Good dependency management with regular updates and security scanning',
      securityVulnerabilities: [
        { severity: 'critical', count: 0 },
        { severity: 'high', count: 2 },
        { severity: 'medium', count: 8 },
        { severity: 'low', count: 15 }
      ],
      performanceBottlenecks: [
        'Database connection pooling needs optimization',
        'React component re-rendering in call interface',
        'WebRTC connection establishment latency',
        'Large payload sizes in API responses'
      ]
    },
    recommendations: [
      'Implement comprehensive performance testing in CI/CD pipeline',
      'Upgrade legacy authentication service to modern standards',
      'Establish environment parity between staging and production',
      'Implement automated security scanning in development workflow',
      'Create comprehensive API documentation with examples',
      'Optimize database queries and implement proper indexing'
    ],
    riskFactors: [
      'Legacy authentication service poses security risks',
      'Limited performance testing may miss scalability issues',
      'Technical debt accumulation could slow feature development',
      'Incomplete environment parity may cause production issues'
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

        {/* Stack Architecture & Infrastructure */}
        <StackArchitecture data={mockReportData.stackArchitecture} />

        {/* Cloud & Vendor Dependencies */}
        <CloudVendorDependencies data={mockReportData.cloudVendorDependencies} />

        {/* Code Quality & DevOps Maturity */}
        <CodeQualityDevOps data={mockReportData.codeQualityDevOps} />

        {/* Additional sections would follow the same pattern */}
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg text-muted-foreground">
            Additional 8+ detailed sections would appear here,
            <br />including AI Models & Automation, Data Architecture, Revenue Attribution,
            <br />Disaster Recovery, Peer Benchmarking, and Final Narrative Summary
          </p>
        </div>

        {/* Deep Dive Report Access */}
        <div className="rounded-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-bold text-purple-900">Deep Dive Analysis Available</h3>
              </div>
              <p className="text-purple-700 mb-4">
                Access comprehensive internal analysis with repo access, infrastructure deep dive, 
                and detailed technical assessments beyond publicly available information.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Internal Code Analysis</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Infrastructure Deep Dive</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Team Process Analysis</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Financial Metrics</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Compliance Audit</span>
              </div>
            </div>
            <div className="ml-6">
              <a 
                href="/pe/deep-dive-reports/ring4-2025"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="font-semibold">Access Deep Dive Report</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <p className="text-xs text-purple-600 mt-2 text-center">PE Users Only</p>
            </div>
          </div>
        </div>
      </div>
    </PEReportLayout>
  )
} 