import { useState } from 'react'
import { DeepDiveNavigation, deepDiveSections } from '@/components/pe/deep-dive-report/DeepDiveNavigation'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { StackEvolutionTimeline } from '@/components/pe/enhanced-report/sections/StackEvolutionTimeline'
import { TechnicalLeadership } from '@/components/pe/enhanced-report/sections/TechnicalLeadership'
import { CloudVendorDependencies } from '@/components/pe/enhanced-report/sections/CloudVendorDependencies'
import { InternalCodeAnalysis } from '@/components/pe/deep-dive-report/sections/InternalCodeAnalysis'
import { Home, FileText, Building } from 'lucide-react'

// Mock data for analyst reviews
const analystReviews = [
  {
    section: 'executive-summary',
    reviewer: 'Sarah Chen, Senior Analyst',
    reviewDate: '2025-01-15',
    confidence: 95,
    notes: 'Comprehensive analysis completed with full access to internal systems. High confidence in findings due to direct repository access and team interviews.'
  },
  {
    section: 'internal-code-analysis',
    reviewer: 'Michael Rodriguez, Technical Lead',
    reviewDate: '2025-01-14',
    confidence: 92,
    notes: 'Deep code review conducted across 23 repositories. Security analysis validated through automated scanning and manual review. Technical debt estimates based on industry benchmarks.'
  },
  {
    section: 'infrastructure-deep-dive',
    reviewer: 'Jennifer Kim, DevOps Specialist',
    reviewDate: '2025-01-13',
    confidence: 88,
    notes: 'Infrastructure analysis based on AWS CloudTrail logs, cost reports, and architecture diagrams. Cost optimization recommendations validated with similar-scale deployments.'
  },
  {
    section: 'team-process-analysis',
    reviewer: 'David Thompson, Engineering Manager',
    reviewDate: '2025-01-12',
    confidence: 85,
    notes: 'Team assessment conducted through structured interviews with 8 team members and analysis of development workflows. Process maturity scores based on industry frameworks.'
  },
  {
    section: 'financial-metrics',
    reviewer: 'Lisa Wang, Financial Analyst',
    reviewDate: '2025-01-11',
    confidence: 93,
    notes: 'Financial analysis based on audited statements, management reports, and detailed cost breakdowns. Unit economics validated through customer cohort analysis.'
  },
  {
    section: 'compliance-audit',
    reviewer: 'Robert Johnson, Security Auditor',
    reviewDate: '2025-01-10',
    confidence: 90,
    notes: 'Compliance assessment conducted through policy review, system audits, and gap analysis. SOC2 readiness evaluated against current implementation status.'
  },
  {
    section: 'integration-analysis',
    reviewer: 'Emily Davis, Solutions Architect',
    reviewDate: '2025-01-09',
    confidence: 87,
    notes: 'API and integration analysis based on documentation review, traffic analysis, and vendor assessments. Performance metrics gathered from monitoring systems.'
  },
  {
    section: 'scalability-assessment',
    reviewer: 'Alex Kumar, Principal Engineer',
    reviewDate: '2025-01-08',
    confidence: 89,
    notes: 'Scalability analysis based on load testing results, architecture review, and growth projections. Technical roadmap validated with engineering leadership.'
  }
]

// Enhanced mock data with proper interfaces
const deepDiveMockData = {
  executiveSummary: {
    companyName: 'Ring4',
    evaluationDate: '2025-01-15',
    overallScore: 87,
    accessLevel: 'Full Internal Access',
    investmentThesis: 'Ring4 demonstrates exceptional technical execution with internal access revealing sophisticated engineering practices, robust security implementations, and clear scalability roadmap. The deep dive analysis confirms strong operational fundamentals and identifies specific optimization opportunities worth $2.3M in annual savings.',
    keyFindings: {
      enablers: [
        'Sophisticated microservices architecture with 99.97% uptime',
        'Advanced security practices including zero-trust architecture',
        'Automated testing coverage at 94% with comprehensive CI/CD',
        'Strong engineering culture with detailed code review processes',
        'Clear technical roadmap with quarterly OKRs and milestone tracking',
        'Efficient cost management with $180k annual cloud optimization',
        'Robust disaster recovery with 15-minute RTO/RPO targets'
      ],
      blockers: [
        'Legacy authentication service requires $120k modernization investment',
        'Database sharding needed for 10x scale ($200k implementation cost)',
        'Missing SOC2 Type II certification limiting enterprise sales',
        'Technical debt in payment processing system (6-month remediation)'
      ],
      risks: [
        'Key person dependency on lead architect (succession planning needed)',
        'Vendor concentration risk with 70% infrastructure on single provider',
        'Compliance gaps for international expansion (GDPR, SOX readiness)',
        'Performance bottlenecks identified at 50k concurrent users'
      ]
    },
    recommendations: [
      'Implement database sharding strategy (Q2 2025, $200k investment)',
      'Complete SOC2 Type II certification (Q1 2025, $80k cost)',
      'Modernize authentication service with zero-downtime migration',
      'Establish multi-cloud strategy for vendor risk mitigation',
      'Hire senior architect to reduce key person dependency',
      'Implement performance optimization for 100k+ user scale'
    ],
    dealBreakers: [],
    internalAccess: {
      repoAccess: true,
      infrastructureAccess: true,
      documentationAccess: true,
      teamInterviews: true,
      financialMetrics: true,
      securityAudit: true
    }
  },
  
  // Deep dive sections data
  internalCodeAnalysis: {
    companyName: 'Ring4',
    analysisDate: '2025-01-15',
    repositoriesAnalyzed: 23,
    totalLinesOfCode: 487000,
    overallCodeQuality: 88,
    securityScore: 85,
    maintainabilityScore: 82,
    codebaseMetrics: {
      languages: [
        {
          name: 'TypeScript',
          lines: 195000,
          percentage: 40,
          quality: 'excellent',
          testCoverage: 94
        },
        {
          name: 'JavaScript',
          lines: 146000,
          percentage: 30,
          quality: 'good',
          testCoverage: 87
        },
        {
          name: 'Python',
          lines: 97000,
          percentage: 20,
          quality: 'good',
          testCoverage: 91
        },
        {
          name: 'Go',
          lines: 49000,
          percentage: 10,
          quality: 'excellent',
          testCoverage: 96
        }
      ],
      complexity: {
        averageCyclomaticComplexity: 3.2,
        highComplexityFunctions: 12,
        technicalDebtRatio: 8.5,
        duplicatedCodePercentage: 2.1
      },
      dependencies: {
        totalPackages: 342,
        outdatedPackages: 23,
        vulnerablePackages: 4,
        licenseIssues: 1
      }
    },
    securityAnalysis: {
      vulnerabilities: [
        { severity: 'high', count: 2, trend: 'decreasing' },
        { severity: 'medium', count: 8, trend: 'stable' },
        { severity: 'low', count: 15, trend: 'decreasing' }
      ],
      securityPractices: [
        { practice: 'Dependency Scanning', implemented: true, score: 95 },
        { practice: 'Static Code Analysis', implemented: true, score: 88 },
        { practice: 'Secret Detection', implemented: true, score: 92 },
        { practice: 'Container Scanning', implemented: false, score: 0 },
        { practice: 'License Compliance', implemented: true, score: 78 }
      ]
    },
    technicalDebt: [
      {
        category: 'Legacy Authentication Service',
        severity: 'high' as const,
        impact: 'Blocking enterprise features and SOC2 compliance',
        effort: '6 months',
        cost: '$120,000',
        priority: 1,
        affectedComponents: ['User Service', 'API Gateway', 'Admin Dashboard']
      },
      {
        category: 'Database Schema Optimization',
        severity: 'medium' as const,
        impact: 'Performance degradation at scale',
        effort: '3 months',
        cost: '$60,000',
        priority: 2,
        affectedComponents: ['User Service', 'Analytics Service', 'Reporting']
      },
      {
        category: 'Frontend Code Duplication',
        severity: 'low' as const,
        impact: 'Increased maintenance overhead',
        effort: '2 months',
        cost: '$30,000',
        priority: 3,
        affectedComponents: ['Web App', 'Mobile App', 'Admin Panel']
      }
    ],
    codeReviewProcess: {
      averageReviewTime: '4.2 hours',
      reviewParticipation: 98,
      automatedChecks: true,
      requiredApprovals: 2,
      branchProtection: true
    },
    recommendations: [
      'Prioritize modernization of legacy authentication service to enable enterprise features',
      'Implement container security scanning in CI/CD pipeline',
      'Address high-severity vulnerabilities in payment processing module',
      'Establish technical debt tracking and quarterly remediation goals',
      'Implement automated dependency updates with security monitoring',
      'Create coding standards documentation and enforce through linting',
      'Set up performance monitoring for database queries and API endpoints'
    ]
  },
  
  // Standard enhanced sections with proper data structure
  stackEvolution: {
    companyName: 'Ring4',
    foundingYear: '2019',
    currentYear: '2025',
    overallEvolution: 'Ring4 has demonstrated exceptional technical evolution, transitioning from a monolithic MVP to a sophisticated microservices architecture.',
    timeline: [
      {
        year: '2019',
        quarter: '1',
        title: 'Company Founded & MVP Development',
        description: 'Initial team formation and development of core communication platform using React and Node.js monolith.',
        category: 'product' as const,
        confidence: 95,
        keyDevelopments: [
          'React frontend with basic calling functionality',
          'Node.js backend with PostgreSQL database',
          'Initial team of 3 engineers'
        ],
        impact: 'high' as const
      }
    ],
    keyMilestones: {
      founding: 'Q1 2019 - Initial MVP with 3-person team',
      firstProduct: 'Q3 2019 - Beta launch with 100 users',
      majorPivot: 'Q2 2021 - Shift to enterprise focus',
      currentState: 'Q4 2024 - 75K users, enterprise-ready platform'
    }
  },
  
  technicalLeadership: {
    companyName: 'Ring4',
    overallAssessment: 'Strong technical leadership with experienced founders and growing team',
    teamSize: 12,
    leadershipScore: 85,
    founders: [
      {
        name: 'Alex Chen',
        role: 'CEO & Co-founder',
        tenure: '6 years',
        background: 'Former Senior Engineer at Zoom, 8 years experience',
        strengths: ['Technical architecture', 'Product vision', 'Team building'],
        experience: {
          years: 8,
          companies: ['Zoom', 'Google'],
          domains: ['Communication', 'Distributed Systems']
        },
        education: 'MS Computer Science, Stanford',
        confidence: 90,
        riskLevel: 'low' as const
      }
    ],
    keyTechnicalLeaders: [],
    leadershipGaps: [
      {
        area: 'Security Leadership',
        severity: 'important' as const,
        description: 'Need dedicated security expertise for compliance',
        recommendation: 'Hire security engineer or promote internal candidate',
        timeframe: '3 months'
      }
    ],
    recommendations: [
      'Hire security engineer to address compliance requirements',
      'Establish formal mentorship program for junior developers'
    ],
    riskFactors: [
      'Key person dependency on lead architect',
      'Limited security expertise in leadership team'
    ]
  },
  
  stackArchitecture: {
    companyName: 'Ring4',
    architecturePattern: 'Microservices with Event-Driven Architecture',
    overallScore: 88,
    scalabilityAssessment: 'Well-designed for current scale with clear path to 10x growth',
    components: [
      {
        name: 'User Service',
        type: 'Core Service',
        technology: 'Node.js + PostgreSQL',
        health: 95,
        scalability: 85,
        documentation: 'excellent' as const
      }
    ],
    infrastructureMetrics: [
      {
        metric: 'Uptime',
        value: '99.97%',
        target: '99.9%',
        status: 'excellent' as const
      }
    ],
    securityAssessment: 'Strong security posture with zero-trust architecture',
    performanceMetrics: {
      responseTime: '95ms average',
      throughput: '12,000 req/min',
      errorRate: '0.12%'
    },
    recommendations: [
      'Implement database sharding for horizontal scaling',
      'Add circuit breaker patterns for service resilience'
    ],
    riskFactors: [
      'Database scaling bottlenecks at high load',
      'Service mesh complexity management'
    ]
  },
  
  cloudVendorDependencies: {
    companyName: 'Ring4',
    overallRiskScore: 72,
    totalMonthlySpend: '$18,500',
    vendorCount: 12,
    dependencies: [
      {
        name: 'Amazon Web Services',
        category: 'infrastructure' as const,
        criticality: 'critical' as const,
        description: 'Primary cloud infrastructure provider',
        monthlySpend: '$12,000',
        contractTerms: 'Pay-as-you-go',
        riskLevel: 'medium' as const,
        alternatives: ['Google Cloud', 'Microsoft Azure'],
        migrationComplexity: 'high' as const,
        dataExposure: 'extensive' as const
      }
    ],
    riskAssessment: {
      singlePointsOfFailure: ['AWS outage would impact entire platform'],
      vendorConcentrationRisk: 'High dependency on AWS ecosystem',
      dataPrivacyRisks: ['Customer payment data stored with Stripe'],
      costOptimizationOpportunities: ['Reserved instance savings: $2,100/month']
    },
    recommendations: [
      'Implement multi-cloud strategy for critical services',
      'Establish vendor SLA monitoring and alerting'
    ],
    contingencyPlans: {
      criticalVendorFailure: ['Activate backup payment processor within 2 hours'],
      costEscalation: ['Implement cost monitoring and alerts'],
      dataBreachResponse: ['Immediate vendor notification and assessment']
    }
  },
  
  codeQualityDevOps: {
    companyName: 'Ring4',
    overallScore: 86,
    codeQualityScore: 88,
    devOpsMaturityScore: 84,
    technicalDebtScore: 78,
    codeMetrics: [
      {
        metric: 'Test Coverage',
        value: 94,
        target: 90,
        trend: 'stable' as const
      }
    ],
    devOpsPractices: [
      {
        practice: 'CI/CD Pipeline',
        maturity: 'advanced' as const,
        adoption: 95,
        effectiveness: 88
      }
    ],
    securityPractices: {
      vulnerabilityScanning: true,
      dependencyChecking: true,
      secretsManagement: true
    },
    qualityGates: [
      {
        gate: 'Code Review',
        enforced: true,
        coverage: 98,
        averageTime: '4.2 hours'
      }
    ],
    recommendations: [
      'Implement chaos engineering practices',
      'Add performance testing to CI/CD pipeline'
    ],
    riskFactors: [
      'Technical debt in legacy authentication service',
      'Limited automated security testing'
    ]
  }
}

export default function DeepDiveReportPaginated() {
  const [currentSection, setCurrentSection] = useState('executive-summary')
  
  const currentSectionData = deepDiveSections.find(section => section.id === currentSection)
  
  const breadcrumbItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />
    },
    {
      label: 'PE Reports',
      href: '/pe',
      icon: <Building className="h-4 w-4" />
    },
    {
      label: 'Ring4 Deep Dive',
      icon: <FileText className="h-4 w-4" />
    },
    {
      label: currentSectionData?.title || 'Section',
      current: true,
      icon: currentSectionData?.icon
    }
  ]

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'executive-summary':
        return (
          <div id="executive-summary">
            <ExecutiveSummary data={deepDiveMockData.executiveSummary} />
          </div>
        )
      case 'stack-evolution':
        return (
          <div id="stack-evolution">
            <StackEvolutionTimeline data={deepDiveMockData.stackEvolution} />
          </div>
        )
      case 'technical-leadership':
        return (
          <div id="technical-leadership">
            <TechnicalLeadership data={deepDiveMockData.technicalLeadership} />
          </div>
        )
      case 'stack-architecture':
        return (
          <div id="stack-architecture" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Stack Architecture</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>System architecture and component analysis</li>
              <li>Microservices and API design patterns</li>
              <li>Database architecture and data flow</li>
              <li>Performance and scalability assessment</li>
            </ul>
          </div>
        )
      case 'cloud-vendor-dependencies':
        return (
          <div id="cloud-vendor-dependencies">
            <CloudVendorDependencies data={deepDiveMockData.cloudVendorDependencies} />
          </div>
        )
      case 'code-quality-devops':
        return (
          <div id="code-quality-devops" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Code Quality & DevOps</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Development practices and operational maturity</li>
              <li>CI/CD pipeline analysis</li>
              <li>Testing strategy and coverage</li>
              <li>Code quality metrics and standards</li>
            </ul>
          </div>
        )
      case 'internal-code-analysis':
        return <InternalCodeAnalysis data={deepDiveMockData.internalCodeAnalysis} />
      case 'infrastructure-deep-dive':
        return (
          <div id="infrastructure-deep-dive" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Infrastructure Deep Dive</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Cloud infrastructure analysis and costs</li>
              <li>Performance metrics and optimization opportunities</li>
              <li>Security configuration assessment</li>
              <li>Disaster recovery and backup strategies</li>
            </ul>
          </div>
        )
      case 'team-process-analysis':
        return (
          <div id="team-process-analysis" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Team & Process Analysis</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Team structure and engineering culture assessment</li>
              <li>Development workflow analysis</li>
              <li>Documentation quality evaluation</li>
              <li>Communication patterns and collaboration effectiveness</li>
            </ul>
          </div>
        )
      case 'financial-metrics':
        return (
          <div id="financial-metrics" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Financial & Operational Metrics</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Revenue analysis and unit economics</li>
              <li>Technology cost breakdown and optimization</li>
              <li>Profitability analysis and cash flow</li>
              <li>Investment metrics and efficiency ratios</li>
            </ul>
          </div>
        )
      case 'compliance-audit':
        return (
          <div id="compliance-audit" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Compliance & Security Audit</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Security compliance framework assessment</li>
              <li>Data protection and privacy compliance</li>
              <li>Access control and audit readiness</li>
              <li>Risk assessment and remediation planning</li>
            </ul>
          </div>
        )
      case 'integration-analysis':
        return (
          <div id="integration-analysis" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Integration & API Analysis</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>API architecture and endpoint analysis</li>
              <li>Third-party integration health monitoring</li>
              <li>Data flow analysis and security assessment</li>
              <li>Performance bottleneck identification</li>
            </ul>
          </div>
        )
      case 'scalability-assessment':
        return (
          <div id="scalability-assessment" className="p-8">
            <h2 className="text-2xl font-bold mb-4">Scalability & Technical Roadmap</h2>
            <p className="text-gray-600">This section is under development. It will include:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Architectural readiness for scale</li>
              <li>Performance projections and growth planning</li>
              <li>Technical roadmap and scaling strategies</li>
              <li>Risk assessment and mitigation plans</li>
            </ul>
          </div>
        )
      default:
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Section Not Found</h2>
            <p className="text-gray-600">The requested section could not be found.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Navigation Sidebar */}
        <DeepDiveNavigation 
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          className="fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40"
        />
        
        {/* Main Content */}
        <div className="flex-1 ml-80 pt-16">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={breadcrumbItems}
            currentSection={currentSection}
            analystReviews={analystReviews}
          />
          
          {/* Section Content */}
          <div className="bg-white dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
            {renderCurrentSection()}
          </div>
        </div>
      </div>
    </div>
  )
} 