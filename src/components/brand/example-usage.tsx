import {
  TechScanHeader,
  TechScanSection,
  TechScanCard,
  TechScanButton,
  MetricCard,
  FindingCard,
  TechScanAlert,
  ProgressBar,
  TechScanChart,
  ReportHeader,
  ReportSection
} from '@/components/brand';
import { Brain, Target, TrendingUp, Shield, Code, Database } from 'lucide-react';

/**
 * Example dashboard page demonstrating the TechScan IQ brand component library
 * This showcases how to build consistent, accessible, and beautiful UIs
 */
export function BrandComponentExample() {
  // Sample data for charts
  const chartData = [
    { name: 'Jan', scans: 65, success: 85 },
    { name: 'Feb', scans: 78, success: 88 },
    { name: 'Mar', scans: 92, success: 91 },
    { name: 'Apr', scans: 105, success: 94 },
    { name: 'May', scans: 118, success: 96 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <TechScanHeader />
      
      {/* Main Content */}
      <TechScanSection containerSize="xl" className="pt-24">
        {/* Page Title */}
        <div className="text-center mb-16">
          <h1 className="font-space text-4xl md:text-5xl font-medium text-brand-black mb-4">
            TechScan IQ Dashboard
          </h1>
          <p className="font-ibm text-xl text-gray-600">
            Comprehensive technical intelligence at your fingertips
          </p>
        </div>

        {/* Alert Example */}
        <TechScanAlert
          type="info"
          title="Welcome to the TechScan IQ Brand Library"
          description="This page demonstrates all our reusable components with consistent styling and animations."
          className="mb-12"
        />

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard
            label="Total Scans"
            value={1234}
            format="number"
            trend="up"
            trendValue={12}
            icon={<Brain className="h-6 w-6 text-brand-teal" />}
          />
          <MetricCard
            label="Success Rate"
            value={96}
            format="percentage"
            trend="up"
            trendValue={2}
            icon={<Target className="h-6 w-6 text-brand-teal" />}
          />
          <MetricCard
            label="Revenue Impact"
            value={2500000}
            format="currency"
            trend="up"
            trendValue={18}
            icon={<TrendingUp className="h-6 w-6 text-brand-teal" />}
          />
        </div>

        {/* Charts and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <TechScanCard>
            <h3 className="font-space text-2xl font-medium text-brand-black mb-6">
              Scan Performance
            </h3>
            <TechScanChart
              type="line"
              data={chartData}
              dataKey={['scans', 'success']}
              height={300}
            />
          </TechScanCard>

          <TechScanCard>
            <h3 className="font-space text-2xl font-medium text-brand-black mb-6">
              System Health
            </h3>
            <div className="space-y-4">
              <ProgressBar
                label="API Performance"
                value={94}
                max={100}
                color="green"
              />
              <ProgressBar
                label="Data Quality"
                value={87}
                max={100}
                color="teal"
              />
              <ProgressBar
                label="Security Score"
                value={96}
                max={100}
                color="green"
              />
            </div>
          </TechScanCard>
        </div>

        {/* Findings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <h3 className="font-space text-2xl font-medium text-brand-black">
              Recent Findings
            </h3>
            
            <FindingCard
              type="success"
              title="Strong Security Posture"
              description="The target company demonstrates excellent security practices with modern encryption and access controls."
              evidence={[
                "Multi-factor authentication implemented",
                "SOC 2 Type II compliance verified",
                "Regular security audits conducted"
              ]}
              recommendation="Consider this a low-risk investment from a security perspective."
            />

            <FindingCard
              type="warning"
              title="Legacy Technology Dependencies"
              description="Some critical systems rely on outdated technology stack components."
              evidence={[
                "jQuery 1.x still in use on main application",
                "Deprecated Node.js version in production",
                "Several unmaintained npm packages detected"
              ]}
              recommendation="Plan for technology modernization within 12-18 months post-acquisition."
            />
          </div>

          <TechScanCard variant="gradient">
            <h3 className="font-space text-2xl font-medium text-brand-black mb-6">
              Quick Actions
            </h3>
            <div className="space-y-4">
              <TechScanButton 
                className="w-full" 
                icon={<Code className="h-4 w-4" />}
              >
                Start New Technical Scan
              </TechScanButton>
              <TechScanButton 
                variant="secondary" 
                className="w-full"
                icon={<Database className="h-4 w-4" />}
              >
                View All Reports
              </TechScanButton>
              <TechScanButton 
                variant="ghost" 
                className="w-full"
                icon={<Shield className="h-4 w-4" />}
              >
                Security Assessment
              </TechScanButton>
            </div>

            <div className="mt-8 p-4 bg-white/50 rounded-lg">
              <p className="font-ibm text-sm text-gray-700">
                💡 <strong>Pro Tip:</strong> Use keyboard shortcuts Cmd+K to quickly access scan options.
              </p>
            </div>
          </TechScanCard>
        </div>
      </TechScanSection>

      {/* Report Preview Section */}
      <TechScanSection background="black" containerSize="lg">
        <ReportHeader
          company="Example Corp"
          reportType="pe-due-diligence"
          reportId="TSQ-2024-001"
          generatedAt={new Date().toISOString()}
          completionTime="2.3 minutes"
        />
        
        <div className="bg-white rounded-b-2xl p-8">
          <ReportSection
            title="Executive Summary"
            subtitle="High-level technical assessment and risk analysis"
            icon={<Target className="h-6 w-6 text-brand-teal" />}
          >
            <div className="prose max-w-none">
              <p className="font-ibm text-gray-700 leading-relaxed">
                This technical due diligence assessment reveals a company with strong foundational
                technology practices and significant growth potential. The engineering team has
                implemented modern development practices, though some areas require modernization
                to support scale.
              </p>
            </div>
          </ReportSection>
        </div>
      </TechScanSection>

      {/* Footer */}
      <TechScanSection background="gray" className="py-12">
        <div className="text-center">
          <p className="font-space text-lg text-brand-teal mb-2">
            Diligence, Decoded.
          </p>
          <p className="font-ibm text-gray-600">
            Built with the TechScan IQ Brand Component Library
          </p>
        </div>
      </TechScanSection>
    </div>
  );
}

/**
 * Usage Notes:
 * 
 * 1. Import components from '@/components/brand' for clean imports
 * 2. All components follow consistent naming: TechScan* prefix
 * 3. Use brand fonts: font-space for headings, font-ibm for body text
 * 4. Follow color hierarchy: brand-teal for primary, brand-black for emphasis
 * 5. All components include proper TypeScript types and accessibility features
 * 6. Motion and animations are built-in but can be disabled via prefers-reduced-motion
 * 7. Components are responsive by default and work across all screen sizes
 */