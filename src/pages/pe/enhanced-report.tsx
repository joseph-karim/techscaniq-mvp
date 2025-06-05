import { useParams } from 'react-router-dom'
import { PEReportLayout } from '@/components/pe/enhanced-report/PEReportLayout'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'
import { StackEvolutionTimeline } from '@/components/pe/enhanced-report/sections/StackEvolutionTimeline'
import { TechnicalLeadership } from '@/components/pe/enhanced-report/sections/TechnicalLeadership'
import { CloudVendorDependencies } from '@/components/pe/enhanced-report/sections/CloudVendorDependencies'
import { EvidenceAppendix } from '@/components/reports/EvidenceAppendix'

// Mock data for the enhanced report
const enhancedReportData = {
  executiveSummary: {
    companyName: 'Ring4',
    evaluationDate: '2025-01-15',
    overallScore: 87,
    accessLevel: 'Standard External Assessment',
    investmentThesis: 'Ring4 demonstrates strong technical execution with modern architecture, robust security practices, and clear scalability roadmap. The assessment reveals solid operational fundamentals and identifies key optimization opportunities.',
    keyFindings: {
      enablers: [
        'Modern microservices architecture with 99.9% uptime',
        'Strong security practices and compliance readiness',
        'Automated testing coverage at 90% with CI/CD pipeline',
        'Experienced engineering team with clear processes',
        'Well-documented technical roadmap and milestones',
        'Efficient cloud infrastructure management'
      ],
      blockers: [
        'Legacy authentication service needs modernization',
        'Database optimization required for scale',
        'SOC2 certification in progress',
        'Some technical debt in payment processing'
      ],
      risks: [
        'Key person dependency on lead architect',
        'Vendor concentration with primary cloud provider',
        'Performance bottlenecks at high concurrent load'
      ]
    },
    recommendations: [
      'Complete SOC2 Type II certification (Q1 2025)',
      'Implement database optimization strategy',
      'Modernize authentication service',
      'Establish multi-cloud contingency plan',
      'Hire additional senior engineers'
    ],
    dealBreakers: [],
    internalAccess: {
      repoAccess: false,
      infrastructureAccess: false,
      documentationAccess: true,
      teamInterviews: true,
      financialMetrics: true,
      securityAudit: false
    }
  },
  
  stackEvolution: {
    companyName: 'Ring4',
    foundingYear: '2019',
    currentYear: '2025',
    overallEvolution: 'Ring4 has shown strong technical evolution, transitioning from a simple MVP to a robust, scalable platform.',
    timeline: [
      {
        year: '2019',
        quarter: '1',
        title: 'Company Founded & MVP Development',
        description: 'Initial team formation and development of core communication platform.',
        category: 'product' as const,
        confidence: 95,
        keyDevelopments: [
          'React frontend with basic calling functionality',
          'Node.js backend with PostgreSQL database',
          'Initial team of 3 engineers'
        ],
        impact: 'high' as const
      },
             {
         year: '2020',
         quarter: '2',
         title: 'Platform Scaling & Team Growth',
         description: 'Expanded platform capabilities and grew engineering team.',
         category: 'infrastructure' as const,
         confidence: 90,
         keyDevelopments: [
           'Microservices architecture implementation',
           'Team grew to 8 engineers',
           'Added enterprise features'
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
  }
}

export default function PEEnhancedReportPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Report Not Found</h1>
          <p className="text-muted-foreground">The requested report could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <PEReportLayout>
      <div className="space-y-12">
        {/* Executive Summary */}
        <section id="executive-summary">
          <ExecutiveSummary data={enhancedReportData.executiveSummary} />
        </section>

        {/* Key Findings & Recommendations */}
        <section id="key-findings" className="p-8">
          <h2 className="text-2xl font-bold mb-4">Key Findings & Recommendations</h2>
          <p className="text-gray-600">This section provides a summary of the most critical findings and actionable recommendations.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">Key Enablers</h3>
              <ul className="space-y-1 text-sm">
                {enhancedReportData.executiveSummary.keyFindings.enablers.slice(0, 3).map((enabler, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {enabler}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-yellow-600 mb-2">Key Blockers</h3>
              <ul className="space-y-1 text-sm">
                {enhancedReportData.executiveSummary.keyFindings.blockers.slice(0, 3).map((blocker, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    {blocker}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Health Overview */}
        <section id="tech-health-overview" className="p-8">
          <h2 className="text-2xl font-bold mb-4">Technical Health Overview</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">{enhancedReportData.executiveSummary.overallScore}%</div>
              <div className="text-sm text-gray-600">Overall Health Score</div>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">{enhancedReportData.technicalLeadership.teamSize}</div>
              <div className="text-sm text-gray-600">Team Size</div>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">{enhancedReportData.cloudVendorDependencies.vendorCount}</div>
              <div className="text-sm text-gray-600">Vendor Dependencies</div>
            </div>
          </div>
        </section>

        {/* Stack Evolution Timeline */}
        <section id="stack-evolution">
          <StackEvolutionTimeline data={enhancedReportData.stackEvolution} />
        </section>

        {/* Technical Leadership */}
        <section id="technical-leadership">
          <TechnicalLeadership data={enhancedReportData.technicalLeadership} />
        </section>

        {/* Cloud & Vendor Dependencies */}
        <section id="cloud-dependencies">
          <CloudVendorDependencies data={enhancedReportData.cloudVendorDependencies} />
        </section>

        {/* Placeholder sections for other parts of the report */}
        <section id="architecture-infrastructure" className="p-8">
          <h2 className="text-2xl font-bold mb-4">Stack Architecture & Infrastructure</h2>
          <p className="text-gray-600">Detailed analysis of system architecture, infrastructure patterns, and scalability assessment.</p>
        </section>

        <section id="ai-automation" className="p-8">
          <h2 className="text-2xl font-bold mb-4">AI Models & Automation Stack</h2>
          <p className="text-gray-600">Analysis of AI/ML implementations and automation capabilities.</p>
        </section>

        <section id="code-quality" className="p-8">
          <h2 className="text-2xl font-bold mb-4">Codebase Quality Signals</h2>
          <p className="text-gray-600">Code quality metrics, testing coverage, and development practices assessment.</p>
        </section>

        {/* Evidence Appendix */}
        <section id="evidence-appendix" className="p-8">
          <EvidenceAppendix 
            companyName={enhancedReportData.executiveSummary.companyName}
            reportId={id}
          />
        </section>
      </div>
    </PEReportLayout>
  )
} 