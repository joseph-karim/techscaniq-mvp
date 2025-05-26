import { useState } from 'react'
import { DeepDiveNavigation, deepDiveSections } from '@/components/pe/deep-dive-report/DeepDiveNavigation'
import { Breadcrumbs } from '@/components/pe/deep-dive-report/Breadcrumbs'
import { Citation } from '@/components/reports/EvidenceCitation'
import { EvidenceModal } from '@/components/reports/EvidenceModal'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { StackEvolutionTimeline } from '@/components/pe/enhanced-report/sections/StackEvolutionTimeline'
import { TechnicalLeadership } from '@/components/pe/enhanced-report/sections/TechnicalLeadership'
import { CloudVendorDependencies } from '@/components/pe/enhanced-report/sections/CloudVendorDependencies'
import { InternalCodeAnalysis } from '@/components/pe/deep-dive-report/sections/InternalCodeAnalysis'
import { Home, FileText, Building } from 'lucide-react'

// Comprehensive citations for deep dive report
const deepDiveCitations: Citation[] = [
  {
    id: 'dd1',
    claim: 'Ring4 demonstrates 99.97% uptime with sophisticated microservices architecture',
    evidence: [
      {
        id: 'e1',
        type: 'analysis',
        title: 'AWS CloudWatch uptime metrics',
        source: 'CloudWatch Dashboard - Production Environment',
        excerpt: 'Service Availability: 99.97%\nMTTR: 4.2 minutes\nMTBF: 45.3 days\nIncident Count (30 days): 2',
        metadata: {
          confidence: 98
        }
      },
      {
        id: 'e2',
        type: 'document',
        title: 'Architecture documentation',
        source: 'internal/docs/architecture-overview.md',
        excerpt: '## Microservices Architecture\n\nOur system consists of 12 independent services:\n- User Service (99.98% uptime)\n- Communication Service (99.96% uptime)\n- Payment Service (99.99% uptime)',
        metadata: {
          fileType: 'Markdown',
          lastModified: '2025-01-10',
          confidence: 95
        }
      }
    ],
    reasoning: 'CloudWatch monitoring data shows consistent uptime metrics above 99.9% over the past 12 months. Architecture documentation confirms microservices design with independent service monitoring. Low MTTR indicates effective incident response.',
    confidence: 97,
    analyst: 'Sarah Chen, Senior Analyst',
    reviewDate: '2025-01-15',
    methodology: 'AWS monitoring analysis and architecture documentation review'
  },
  {
    id: 'dd2',
    claim: 'Full internal access provided including 23 repositories and team interviews',
    evidence: [
      {
        id: 'e3',
        type: 'document',
        title: 'Repository access log',
        source: 'GitHub Enterprise audit log',
        excerpt: 'Repositories accessed: 23/23\nAccess level: Admin\nTeam members interviewed: 8/12\nDocumentation reviewed: 47 documents',
        metadata: {
          confidence: 100
        }
      },
      {
        id: 'e4',
        type: 'interview',
        title: 'Team interview summary',
        source: 'Structured interviews with engineering team',
        excerpt: 'Conducted 8 interviews with:\n- 2 Senior Engineers\n- 3 Mid-level Engineers\n- 2 DevOps Engineers\n- 1 Engineering Manager',
        metadata: {
          confidence: 95
        }
      }
    ],
    reasoning: 'GitHub audit logs confirm complete repository access. Interview records show comprehensive team coverage across all engineering levels. Documentation access includes technical specs, runbooks, and process documents.',
    confidence: 98,
    analyst: 'Michael Rodriguez, Technical Lead',
    reviewDate: '2025-01-14',
    methodology: 'Access audit and structured interview process'
  },
  {
    id: 'dd3',
    claim: 'Advanced security practices including zero-trust architecture implementation',
    evidence: [
      {
        id: 'e5',
        type: 'code',
        title: 'Zero-trust authentication middleware',
        source: 'src/middleware/auth/zero-trust.ts',
        excerpt: 'export class ZeroTrustAuth {\n  async validateRequest(req: Request): Promise<AuthResult> {\n    const tokenValid = await this.validateJWT(req.headers.authorization)\n    const deviceTrusted = await this.validateDevice(req.headers[\'x-device-id\'])\n    const locationValid = await this.validateLocation(req.ip)\n    \n    return {\n      authenticated: tokenValid && deviceTrusted && locationValid,\n      riskScore: this.calculateRiskScore(req)\n    }\n  }\n}',
        metadata: {
          fileType: 'TypeScript',
          lineNumbers: '15-28',
          lastModified: '2025-01-08',
          confidence: 96
        }
      },
      {
        id: 'e6',
        type: 'analysis',
        title: 'Security audit report',
        source: 'Third-party security assessment by CyberSec Pro',
        excerpt: 'Zero-Trust Implementation Score: 94/100\n\nKey Findings:\n- Multi-factor authentication enforced\n- Device trust verification active\n- Network segmentation implemented\n- Continuous monitoring in place',
        metadata: {
          confidence: 92
        }
      }
    ],
    reasoning: 'Code review shows comprehensive zero-trust implementation with device validation, location checking, and risk scoring. Third-party security audit confirms high implementation score and validates security controls.',
    confidence: 94,
    analyst: 'Marcus Johnson, Security Analyst',
    reviewDate: '2025-01-12',
    methodology: 'Code analysis and third-party security assessment'
  },
  {
    id: 'dd4',
    claim: 'Automated testing coverage at 94% with comprehensive CI/CD pipeline',
    evidence: [
      {
        id: 'e7',
        type: 'analysis',
        title: 'Jest coverage report',
        source: 'CI/CD pipeline coverage output',
        excerpt: 'Overall Coverage: 94.2%\n\nBreakdown by service:\n- User Service: 96.1%\n- Communication Service: 93.8%\n- Payment Service: 97.2%\n- API Gateway: 91.5%',
        metadata: {
          confidence: 99
        }
      },
      {
        id: 'e8',
        type: 'code',
        title: 'CI/CD pipeline configuration',
        source: '.github/workflows/ci-cd.yml',
        excerpt: 'name: CI/CD Pipeline\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Run tests\n        run: npm test -- --coverage\n      - name: Quality gate\n        run: |\n          if [ $(cat coverage/coverage-summary.json | jq \'.total.lines.pct\') -lt 90 ]; then\n            echo "Coverage below 90%"\n            exit 1\n          fi',
        metadata: {
          fileType: 'YAML',
          confidence: 95
        }
      }
    ],
    reasoning: 'CI/CD pipeline automatically generates coverage reports showing 94%+ coverage across all services. Pipeline configuration enforces 90% minimum coverage threshold with automated quality gates.',
    confidence: 97,
    analyst: 'Alex Thompson, QA Engineer',
    reviewDate: '2025-01-13',
    methodology: 'CI/CD pipeline analysis and coverage report review'
  },
  {
    id: 'dd5',
    claim: 'Database sharding needed for 10x scale with $200k implementation cost',
    evidence: [
      {
        id: 'e9',
        type: 'analysis',
        title: 'Database performance analysis',
        source: 'PostgreSQL performance monitoring',
        excerpt: 'Current Load Analysis:\n- Peak concurrent connections: 450/500\n- Query response time (95th percentile): 245ms\n- Database size: 2.3TB\n- Growth rate: 15% monthly\n\nProjected 10x scale:\n- Estimated connections: 4,500\n- Projected response time: 2.1s (unacceptable)',
        metadata: {
          confidence: 91
        }
      },
      {
        id: 'e10',
        type: 'document',
        title: 'Sharding implementation estimate',
        source: 'Technical proposal by database team',
        excerpt: 'Database Sharding Implementation Plan\n\nCost Breakdown:\n- Senior Database Engineer (6 months): $120,000\n- Infrastructure migration: $45,000\n- Testing and validation: $25,000\n- Contingency (20%): $38,000\n\nTotal Estimated Cost: $228,000',
        metadata: {
          confidence: 88
        }
      }
    ],
    reasoning: 'Performance analysis shows database approaching capacity limits with degraded performance at projected 10x scale. Technical proposal provides detailed cost breakdown based on similar implementations and current team rates.',
    confidence: 89,
    analyst: 'Lisa Park, Performance Engineer',
    reviewDate: '2025-01-11',
    methodology: 'Database performance modeling and implementation cost analysis'
  },
  {
    id: 'dd6',
    claim: 'Legacy authentication service requires $120k modernization investment',
    evidence: [
      {
        id: 'e11',
        type: 'code',
        title: 'Legacy authentication code',
        source: 'src/legacy/auth/session-manager.js',
        excerpt: '// Legacy session management - TODO: Replace with JWT\nclass SessionManager {\n  constructor() {\n    this.sessions = new Map() // In-memory storage - not scalable\n  }\n  \n  createSession(userId) {\n    const sessionId = Math.random().toString(36) // Weak session ID generation\n    this.sessions.set(sessionId, { userId, createdAt: Date.now() })\n    return sessionId\n  }\n}',
        metadata: {
          fileType: 'JavaScript',
          lineNumbers: '1-12',
          lastModified: '2019-03-15',
          confidence: 98
        }
      },
      {
        id: 'e12',
        type: 'document',
        title: 'Modernization cost estimate',
        source: 'Engineering proposal for auth service upgrade',
        excerpt: 'Authentication Service Modernization\n\nScope:\n- Replace legacy session management with JWT\n- Implement OAuth 2.0 / OpenID Connect\n- Add multi-factor authentication\n- SOC2 compliance preparation\n\nResource Requirements:\n- Senior Engineer: 6 months @ $20k/month = $120k\n- Security consultant: 2 weeks @ $5k/week = $10k\n\nTotal: $130k',
        metadata: {
          confidence: 92
        }
      }
    ],
    reasoning: 'Code analysis reveals legacy authentication using insecure practices (in-memory sessions, weak ID generation). Engineering proposal provides detailed modernization scope and cost estimates based on current market rates.',
    confidence: 95,
    analyst: 'Marcus Johnson, Security Analyst',
    reviewDate: '2025-01-12',
    methodology: 'Legacy code audit and modernization cost estimation'
  },
  {
    id: 'dd7',
    claim: 'Strong engineering culture with detailed code review processes',
    evidence: [
      {
        id: 'e13',
        type: 'analysis',
        title: 'GitHub code review metrics',
        source: 'GitHub Enterprise analytics',
        excerpt: 'Code Review Metrics (Last 90 days):\n- Pull requests: 342\n- Review participation: 98.2%\n- Average review time: 4.2 hours\n- Required approvals: 2\n- Approval rate after first review: 23%\n- Average comments per PR: 8.5',
        metadata: {
          confidence: 97
        }
      },
      {
        id: 'e14',
        type: 'interview',
        title: 'Engineering team feedback',
        source: 'Team interviews on development practices',
        excerpt: 'Interview Summary:\n- 100% of engineers report thorough code reviews\n- "Code review is taken seriously here" - Senior Engineer\n- "We have clear coding standards and they\'re enforced" - Mid-level Engineer\n- "Reviews focus on both functionality and maintainability" - DevOps Engineer',
        metadata: {
          confidence: 90
        }
      }
    ],
    reasoning: 'GitHub metrics show high review participation and thorough review process with multiple approvals required. Team interviews consistently report positive culture around code quality and review practices.',
    confidence: 93,
    analyst: 'David Thompson, Engineering Manager',
    reviewDate: '2025-01-12',
    methodology: 'GitHub analytics analysis and structured team interviews'
  },
  {
    id: 'dd8',
    claim: 'Efficient cost management with $180k annual cloud optimization',
    evidence: [
      {
        id: 'e15',
        type: 'analysis',
        title: 'AWS cost optimization report',
        source: 'AWS Cost Explorer and Trusted Advisor',
        excerpt: 'Cost Optimization Achievements (2024):\n\nReserved Instances: $95,000 savings\nRight-sizing EC2: $42,000 savings\nS3 lifecycle policies: $28,000 savings\nUnused resources cleanup: $15,000 savings\n\nTotal Annual Savings: $180,000\nCost reduction: 32% vs. on-demand pricing',
        metadata: {
          confidence: 96
        }
      },
      {
        id: 'e16',
        type: 'document',
        title: 'Cost management process',
        source: 'internal/docs/cost-management.md',
        excerpt: '# Cloud Cost Management Process\n\n## Monthly Reviews\n- Cost analysis by service and team\n- Identification of optimization opportunities\n- Reserved instance planning\n\n## Automated Monitoring\n- Budget alerts at 80% threshold\n- Unused resource detection\n- Cost anomaly detection',
        metadata: {
          fileType: 'Markdown',
          confidence: 88
        }
      }
    ],
    reasoning: 'AWS cost reports show significant savings through systematic optimization efforts. Process documentation demonstrates proactive cost management with automated monitoring and regular reviews.',
    confidence: 92,
    analyst: 'Jennifer Kim, DevOps Specialist',
    reviewDate: '2025-01-13',
    methodology: 'AWS cost analysis and process documentation review'
  },
  {
    id: 'dd9',
    claim: 'Key person dependency on lead architect requiring succession planning',
    evidence: [
      {
        id: 'e17',
        type: 'analysis',
        title: 'Code contribution analysis',
        source: 'Git commit analysis across all repositories',
        excerpt: 'Code Contribution Analysis:\n\nLead Architect (Alex Chen):\n- 34% of total commits\n- 67% of architecture decisions\n- Only person with full system knowledge\n- Critical path for major technical decisions\n\nRisk Assessment: HIGH\nBus factor: 1 (critical dependency)',
        metadata: {
          confidence: 94
        }
      },
      {
        id: 'e18',
        type: 'interview',
        title: 'Team dependency assessment',
        source: 'Interviews with engineering team',
        excerpt: 'Team Feedback on Dependencies:\n- "Alex is involved in all major technical decisions" - Senior Engineer\n- "We rely heavily on Alex for system architecture knowledge" - DevOps Engineer\n- "Would be challenging to make major changes without Alex" - Engineering Manager',
        metadata: {
          confidence: 91
        }
      }
    ],
    reasoning: 'Git analysis shows high concentration of critical contributions from lead architect. Team interviews confirm dependency for major decisions and system knowledge. This represents a significant operational risk.',
    confidence: 92,
    analyst: 'David Thompson, Engineering Manager',
    reviewDate: '2025-01-12',
    methodology: 'Code contribution analysis and team dependency assessment'
  },
  {
    id: 'dd10',
    claim: 'Vendor concentration risk with 70% infrastructure on single provider',
    evidence: [
      {
        id: 'e19',
        type: 'analysis',
        title: 'Infrastructure dependency analysis',
        source: 'Cloud spend and service mapping',
        excerpt: 'Infrastructure Distribution:\n\nAWS Services: $12,600/month (70%)\n- EC2, RDS, S3, CloudFront, Lambda\n- Critical services: 8/12\n\nOther Providers: $5,400/month (30%)\n- Stripe (payments): $2,100\n- Twilio (communications): $1,800\n- DataDog (monitoring): $900\n- Others: $600',
        metadata: {
          confidence: 97
        }
      },
      {
        id: 'e20',
        type: 'document',
        title: 'Disaster recovery plan',
        source: 'internal/docs/disaster-recovery.md',
        excerpt: '# Disaster Recovery Plan\n\n## AWS Outage Scenario\n- RTO: 4 hours\n- RPO: 15 minutes\n- Manual failover required\n- No automated multi-cloud failover\n\n## Risk Assessment\n- Single point of failure for core infrastructure\n- Limited geographic distribution\n- Vendor lock-in concerns',
        metadata: {
          fileType: 'Markdown',
          confidence: 89
        }
      }
    ],
    reasoning: 'Infrastructure analysis shows heavy reliance on AWS for core services. Disaster recovery documentation confirms lack of multi-cloud strategy and potential for extended outages during AWS incidents.',
    confidence: 93,
    analyst: 'Jennifer Kim, DevOps Specialist',
    reviewDate: '2025-01-13',
    methodology: 'Infrastructure mapping and disaster recovery assessment'
  }
]

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
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const currentSectionData = deepDiveSections.find(section => section.id === currentSection)

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation)
    setIsModalOpen(true)
  }
  
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
          <div id="executive-summary" className="space-y-6">
            <ExecutiveSummary 
              data={deepDiveMockData.executiveSummary} 
              citations={deepDiveCitations}
              onCitationClick={handleCitationClick}
            />
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
        return (
          <div id="internal-code-analysis" className="space-y-6">
            <InternalCodeAnalysis 
              data={deepDiveMockData.internalCodeAnalysis} 
              citations={deepDiveCitations}
              onCitationClick={handleCitationClick}
            />
          </div>
        )
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
    // Main container for the deep dive report page content
    <div className="flex flex-col lg:flex-row h-full bg-white dark:bg-gray-900">
      {/* Report Section Navigation (Internal Sidebar for the deep dive page) */}
      <DeepDiveNavigation 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        // Adjusted classes: not fixed, normal flow, specific width, and scroll if needed
        className="w-full lg:w-72 lg:h-full lg:border-r border-b lg:border-b-0 dark:border-gray-700 p-4 shrink-0 overflow-y-auto"
      />
      
      {/* Main Report Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <Breadcrumbs 
          items={breadcrumbItems}
          currentSection={currentSection}
          analystReviews={analystReviews}
        />
        
        {/* Section Content rendered here */}
        <div className="mt-6">
          {renderCurrentSection()}
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedCitation && (
        <EvidenceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCitation(null)
          }}
          citation={selectedCitation}
          notes={[]}
          onAddNote={(note) => {
            console.log('New note added:', note)
          }}
          userRole="pe_user"
          userName="Demo User"
        />
      )}
    </div>
  )
} 