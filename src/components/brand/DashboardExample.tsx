import { 
  TechScanHeader,
  TechScanSection,
  TechScanCard,
  TechScanButton,
  MetricCard,
  TechScanChart,
  TechScanAlert,
  ProgressBar,
  ReportSection,
  FindingCard
} from '@/components/brand';
import { Brain, Target, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * Example dashboard page demonstrating the TechScan IQ brand component library.
 * This showcases how to compose the various components together for a cohesive UI.
 */
export function DashboardExample() {
  // Sample data for charts
  const chartData = [
    { month: 'Jan', scans: 400, revenue: 2400 },
    { month: 'Feb', scans: 300, revenue: 1398 },
    { month: 'Mar', scans: 200, revenue: 9800 },
    { month: 'Apr', scans: 278, revenue: 3908 },
    { month: 'May', scans: 189, revenue: 4800 },
    { month: 'Jun', scans: 239, revenue: 3800 },
  ];

  const pieData = [
    { name: 'Critical', value: 400 },
    { name: 'Warning', value: 300 },
    { name: 'Success', value: 300 },
    { name: 'Info', value: 200 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TechScanHeader />
      
      <TechScanSection containerSize="xl" className="pt-24">
        <h1 className="font-space text-4xl font-medium text-brand-black mb-8">
          Intelligence Dashboard
        </h1>
        
        {/* Alert Example */}
        <TechScanAlert
          type="info"
          title="New Report Available"
          description="Your latest scan for Acme Corp has completed processing."
          className="mb-8"
        />
        
        {/* Metric Cards */}
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
            value={98}
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
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <TechScanCard>
            <h3 className="font-space text-xl font-medium text-brand-black mb-4">
              Scan Activity
            </h3>
            <TechScanChart
              data={chartData}
              type="line"
              dataKey={['scans', 'revenue']}
              xAxisKey="month"
            />
          </TechScanCard>
          
          <TechScanCard>
            <h3 className="font-space text-xl font-medium text-brand-black mb-4">
              Finding Distribution
            </h3>
            <TechScanChart
              data={pieData}
              type="pie"
              dataKey="value"
            />
          </TechScanCard>
        </div>
        
        {/* Report Section Example */}
        <ReportSection
          title="Recent Findings"
          subtitle="Critical insights from your latest technical scans"
          className="mb-12"
        >
          <FindingCard
            type="critical"
            title="Security Vulnerability Detected"
            description="Outdated SSL certificate found on production server."
            evidence={[
              "Certificate expired on 2024-01-15",
              "Using deprecated TLS 1.0 protocol",
              "No automated renewal configured"
            ]}
            recommendation="Update SSL certificate immediately and configure auto-renewal."
          />
          
          <FindingCard
            type="warning"
            title="Performance Bottleneck"
            description="Database queries showing slow response times during peak hours."
            evidence={[
              "Average query time: 2.3s (threshold: 1s)",
              "Missing indexes on key tables",
              "No query caching implemented"
            ]}
            recommendation="Add database indexes and implement query caching strategy."
          />
          
          <FindingCard
            type="success"
            title="Strong API Architecture"
            description="Well-structured RESTful API with comprehensive documentation."
            evidence={[
              "100% endpoint documentation coverage",
              "Consistent naming conventions",
              "Proper error handling implemented"
            ]}
          />
        </ReportSection>
        
        {/* Progress Bars */}
        <TechScanCard variant="gradient" className="mb-12">
          <h3 className="font-space text-xl font-medium text-brand-black mb-6">
            Scan Progress
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="Code Analysis"
              value={85}
              max={100}
              color="teal"
            />
            <ProgressBar
              label="Security Scan"
              value={62}
              max={100}
              color="yellow"
            />
            <ProgressBar
              label="Performance Test"
              value={45}
              max={100}
              color="green"
            />
            <ProgressBar
              label="Dependency Check"
              value={95}
              max={100}
              color="teal"
            />
          </div>
        </TechScanCard>
        
        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TechScanCard>
            <h3 className="font-space text-2xl font-medium text-brand-black mb-4">
              Recent Scans
            </h3>
            <p className="font-ibm text-gray-600 mb-6">
              View and manage your technical intelligence scans.
            </p>
            <TechScanButton variant="secondary" className="w-full">
              View All Scans
            </TechScanButton>
          </TechScanCard>
          
          <TechScanCard variant="gradient">
            <h3 className="font-space text-2xl font-medium text-brand-black mb-4">
              Quick Actions
            </h3>
            <div className="space-y-4">
              <TechScanButton className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
                Start New Scan
              </TechScanButton>
              <TechScanButton variant="secondary" className="w-full">
                View All Reports
              </TechScanButton>
            </div>
          </TechScanCard>
        </div>
      </TechScanSection>
    </div>
  );
}