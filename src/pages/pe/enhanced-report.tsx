import { PEReportLayout } from '@/components/pe/enhanced-report/PEReportLayout'
import { ExecutiveSummary } from '@/components/pe/enhanced-report/sections/ExecutiveSummary'

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
        <section id="stack-evolution" className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold">Stack Evolution Timeline</h2>
            <p className="text-muted-foreground">Technology journey from inception to present</p>
          </div>
          
          <div className="rounded-lg border bg-muted/20 p-8 text-center">
            <p className="text-muted-foreground">Interactive Timeline Component</p>
          </div>
        </section>

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