import { PEReportLayout } from '@/components/pe/enhanced-report/PEReportLayout'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { InternalCodeAnalysis } from '@/components/pe/deep-dive-report/sections/InternalCodeAnalysis'
import { InfrastructureDeepDive } from '@/components/pe/deep-dive-report/sections/InfrastructureDeepDive'

// Enhanced mock data for deep dive analysis
const deepDiveMockData = {
  // Inherit all standard report data
  executiveSummary: {
    companyName: 'Ring4',
    evaluationDate: '2025-01-15',
    overallScore: 87, // Higher score with internal access
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
  
  // Enhanced sections with internal data
  internalCodeAnalysis: {
    companyName: 'Ring4',
    analysisDate: '2025-01-15',
    repositoriesAnalyzed: 23,
    totalLinesOfCode: 487000,
    overallCodeQuality: 87,
    securityScore: 91,
    maintainabilityScore: 84,
    
    codebaseMetrics: {
      languages: [
        { name: 'TypeScript', lines: 195000, percentage: 40, quality: 'excellent', testCoverage: 96 },
        { name: 'JavaScript', lines: 146000, percentage: 30, quality: 'good', testCoverage: 89 },
        { name: 'Python', lines: 97000, percentage: 20, quality: 'excellent', testCoverage: 94 },
        { name: 'Go', lines: 49000, percentage: 10, quality: 'good', testCoverage: 87 }
      ],
      complexity: {
        averageCyclomaticComplexity: 4.2,
        highComplexityFunctions: 23,
        technicalDebtRatio: 12.3,
        duplicatedCodePercentage: 3.1
      },
      dependencies: {
        totalPackages: 342,
        outdatedPackages: 18,
        vulnerablePackages: 3,
        licenseIssues: 0
      }
    },
    
    securityAnalysis: {
      vulnerabilities: [
        { severity: 'critical', count: 0, trend: 'stable' },
        { severity: 'high', count: 2, trend: 'decreasing' },
        { severity: 'medium', count: 12, trend: 'stable' },
        { severity: 'low', count: 28, trend: 'decreasing' }
      ],
      securityPractices: [
        { practice: 'Input Validation', implemented: true, score: 95 },
        { practice: 'Authentication & Authorization', implemented: true, score: 88 },
        { practice: 'Data Encryption', implemented: true, score: 92 },
        { practice: 'Secure Communication', implemented: true, score: 96 },
        { practice: 'Error Handling', implemented: true, score: 84 },
        { practice: 'Logging & Monitoring', implemented: true, score: 91 }
      ]
    },
    
    technicalDebt: [
      {
        category: 'Legacy Authentication Service',
        severity: 'high' as const,
        impact: 'Security risk and performance bottleneck',
        effort: '3-4 months',
        cost: '$120,000',
        priority: 1,
        affectedComponents: ['User Service', 'API Gateway', 'Mobile Apps']
      },
      {
        category: 'Database Query Optimization',
        severity: 'medium' as const,
        impact: 'Performance degradation under load',
        effort: '6-8 weeks',
        cost: '$45,000',
        priority: 2,
        affectedComponents: ['User Service', 'Analytics Service']
      },
      {
        category: 'Frontend Bundle Optimization',
        severity: 'medium' as const,
        impact: 'Slower load times on mobile',
        effort: '2-3 weeks',
        cost: '$15,000',
        priority: 3,
        affectedComponents: ['React Frontend', 'Mobile Web']
      }
    ],
    
    codeReviewProcess: {
      averageReviewTime: '4.2 hours',
      reviewParticipation: 94,
      automatedChecks: true,
      requiredApprovals: 2,
      branchProtection: true
    },
    
    recommendations: [
      'Prioritize legacy authentication service modernization',
      'Implement automated dependency updates with security scanning',
      'Establish code complexity monitoring and alerts',
      'Create technical debt tracking dashboard',
      'Implement advanced static analysis tools',
      'Establish security champion program across teams'
    ]
  },
  
  infrastructureDeepDive: {
    companyName: 'Ring4',
    environment: 'Production',
    analysisDate: '2025-01-15',
    infrastructureScore: 89,
    
    cloudInfrastructure: {
      provider: 'AWS',
      regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
      multiRegion: true,
      disasterRecovery: true,
      rto: '15 minutes',
      rpo: '5 minutes',
      
      services: [
        { name: 'EC2 Instances', count: 47, type: 'Compute', cost: '$8,200/month', utilization: 78 },
        { name: 'RDS PostgreSQL', count: 6, type: 'Database', cost: '$3,400/month', utilization: 82 },
        { name: 'ElastiCache Redis', count: 4, type: 'Cache', cost: '$1,200/month', utilization: 71 },
        { name: 'S3 Storage', count: 1, type: 'Storage', cost: '$890/month', utilization: 65 },
        { name: 'CloudFront CDN', count: 1, type: 'CDN', cost: '$450/month', utilization: 88 }
      ],
      
      costOptimization: {
        currentMonthlyCost: 18500,
        optimizedMonthlyCost: 14200,
        potentialSavings: 4300,
        savingsOpportunities: [
          'Reserved Instance conversion: $2,100/month',
          'Right-sizing underutilized instances: $1,200/month',
          'Storage class optimization: $600/month',
          'Unused resource cleanup: $400/month'
        ]
      }
    },
    
    securityConfiguration: {
      networkSecurity: {
        vpcConfiguration: 'Multi-AZ with private subnets',
        securityGroups: 23,
        nacls: 8,
        wafEnabled: true,
        ddosProtection: true
      },
      accessControl: {
        iamPolicies: 45,
        roleBasedAccess: true,
        mfaEnforced: true,
        privilegedAccessManagement: true,
        accessReviewFrequency: 'Quarterly'
      },
      dataProtection: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        keyManagement: 'AWS KMS',
        backupEncryption: true,
        dataClassification: true
      }
    },
    
    monitoring: {
      observability: {
        metricsCollection: 'CloudWatch + Datadog',
        logAggregation: 'ELK Stack',
        distributedTracing: 'Jaeger',
        alerting: 'PagerDuty',
        dashboards: 15,
        slos: 8
      },
      performance: {
        averageResponseTime: '95ms',
        p99ResponseTime: '450ms',
        errorRate: '0.12%',
        availability: '99.97%',
        throughput: '12,000 req/min'
      }
    },
    
    deploymentPipeline: {
      cicdPlatform: 'GitHub Actions + ArgoCD',
      deploymentFrequency: '3-4 times per week',
      leadTime: '2.5 hours',
      changeFailureRate: '2.1%',
      meanTimeToRecovery: '12 minutes',
      automatedTesting: true,
      canaryDeployments: true,
      rollbackCapability: true
    },
    
    recommendations: [
      'Implement reserved instance strategy for 23% cost reduction',
      'Establish infrastructure as code for all resources',
      'Implement chaos engineering practices',
      'Enhance monitoring with custom business metrics',
      'Establish multi-cloud disaster recovery strategy',
      'Implement automated security compliance scanning'
    ]
  }
  
  // Additional sections would be added here...
}

export default function DeepDivePEReportPage() {
  return (
    <PEReportLayout>
      <div className="space-y-12">
        {/* Enhanced Executive Summary with Internal Access Badge */}
        <div className="relative">
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Deep Dive Analysis</span>
              </div>
              <p className="text-xs opacity-90">Full Internal Access</p>
            </div>
          </div>
          <ExecutiveSummary data={deepDiveMockData.executiveSummary} />
        </div>
        
        {/* Internal Code Analysis - New Deep Dive Section */}
        <InternalCodeAnalysis data={deepDiveMockData.internalCodeAnalysis} />
        
        {/* Infrastructure Deep Dive - Enhanced with Internal Data */}
        <InfrastructureDeepDive data={deepDiveMockData.infrastructureDeepDive} />
        
        {/* Standard sections enhanced with internal data - Placeholder for now */}
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">Enhanced Standard Sections</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Stack Evolution Timeline • Technical Leadership • Stack Architecture
            <br />
            Cloud Vendor Dependencies • Code Quality & DevOps
          </p>
          <p className="text-sm text-gray-500">
            These sections inherit from standard reports but with enhanced internal data
          </p>
        </div>
        
        {/* Additional Deep Dive Sections */}
        <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50/50 p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-purple-800">Additional Deep Dive Sections</h3>
          </div>
          <p className="text-purple-600 mb-4">
            Team & Process Analysis • Financial & Operational Metrics • Compliance & Security Audit
            <br />
            Integration & API Analysis • Scalability & Technical Roadmap Assessment
          </p>
          <p className="text-sm text-purple-500">
            These sections provide comprehensive internal analysis beyond publicly available information
          </p>
        </div>
      </div>
    </PEReportLayout>
  )
} 