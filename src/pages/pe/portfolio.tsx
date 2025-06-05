import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3, FileText, Settings, Eye, PlusCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabaseClient'
import { Scan } from '@/types'
import { ScanStatusBadge } from '@/components/dashboard/recent-scans-table'

// Mock portfolio company data
const portfolioCompanies = [
  {
    id: 1,
    name: 'TechFlow Solutions',
    industry: 'SaaS',
    acquisitionDate: '2023-06-15',
    investmentThesis: 'Modernize tech stack, improve CI/CD velocity by 50%, achieve SOC2 compliance within 12 months',
    technicalHealth: 85,
    lastScanDate: '2024-01-15',
    status: 'healthy',
    keyMetrics: {
      codeQuality: 88,
      security: 82,
      scalability: 87,
      compliance: 90
    },
    alerts: 2,
    completedInitiatives: 8,
    totalInitiatives: 12
  },
  {
    id: 2,
    name: 'DataVault Inc',
    industry: 'Data Analytics',
    acquisitionDate: '2023-09-22',
    investmentThesis: 'Cloud migration to reduce infrastructure costs by 30%, implement modern data pipeline',
    technicalHealth: 72,
    lastScanDate: '2024-01-10',
    status: 'attention',
    keyMetrics: {
      codeQuality: 75,
      security: 68,
      scalability: 70,
      compliance: 75
    },
    alerts: 5,
    completedInitiatives: 4,
    totalInitiatives: 10
  },
  {
    id: 3,
    name: 'SecureNet Systems',
    industry: 'Cybersecurity',
    acquisitionDate: '2024-01-08',
    investmentThesis: 'Platform consolidation, API standardization for enterprise clients',
    technicalHealth: 91,
    lastScanDate: '2024-01-20',
    status: 'excellent',
    keyMetrics: {
      codeQuality: 92,
      security: 95,
      scalability: 89,
      compliance: 88
    },
    alerts: 1,
    completedInitiatives: 3,
    totalInitiatives: 8
  },
  {
    id: 4,
    name: 'Synergy Solutions',
    industry: 'Enterprise Software',
    acquisitionDate: '2023-12-01',
    investmentThesis: 'AI/ML integration to boost platform efficiency by 40%, expand enterprise client base through advanced analytics capabilities',
    technicalHealth: 89,
    lastScanDate: '2024-01-18',
    status: 'excellent',
    keyMetrics: {
      codeQuality: 91,
      security: 87,
      scalability: 92,
      compliance: 85
    },
    alerts: 1,
    completedInitiatives: 6,
    totalInitiatives: 9
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-brand-digital-teal text-white'
    case 'healthy': return 'bg-brand-digital-teal/80 text-white'
    case 'attention': return 'bg-caution-amber text-white'
    case 'critical': return 'bg-risk-red text-white'
    default: return 'bg-neutral-gray text-white'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="h-4 w-4 text-brand-digital-teal" />
    case 'healthy': return <CheckCircle className="h-4 w-4 text-brand-digital-teal/80" />
    case 'attention': return <AlertTriangle className="h-4 w-4 text-caution-amber" />
    case 'critical': return <AlertTriangle className="h-4 w-4 text-risk-red" />
    default: return <Clock className="h-4 w-4 text-neutral-gray" />
  }
}

export default function PortfolioPage() {
  const [selectedView, setSelectedView] = useState('overview')
  const [activeScans, setActiveScans] = useState<Scan[]>([])
  const [loadingActiveScans, setLoadingActiveScans] = useState(true)

  useEffect(() => {
    async function fetchActiveScans() {
      setLoadingActiveScans(true);
      const { data, error } = await supabase
        .from('scan_requests')
        .select('*, reports!scan_requests_report_id_fkey(id)')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching active scans:", error);
        setActiveScans([]);
      } else {
        setActiveScans(data || []);
      }
      setLoadingActiveScans(false);
    }
    fetchActiveScans();
  }, []);

  return (
    <div className="space-y-8 container-spacing">
      {/* Header Section - Minimalist with high whitespace */}
      <div className="flex items-center justify-between pt-8">
        <div className="space-y-3">
          <h1 className="font-heading text-h1 font-medium text-brand-gunmetal-gray">
            Portfolio Companies
          </h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Decode complex technology environments to support confident capital deployment. 
            Monitor technical health and operational improvements across your portfolio.
          </p>
        </div>
        <Button className="btn-primary">
          <FileText className="mr-2 h-4 w-4" />
          Generate LP Report
        </Button>
      </div>

      {/* Portfolio Overview Cards - Modular Grid Layout */}
      <div className="grid-modular grid-modular-4">
        <Card className="brand-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-heading text-h4 font-medium">Total Companies</CardTitle>
            <Building2 className="h-5 w-5 text-brand-digital-teal" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-h1 font-medium text-brand-gunmetal-gray">
              {portfolioCompanies.length}
            </div>
            <p className="text-caption text-muted-foreground mt-2">
              +1 new acquisition this quarter
            </p>
          </CardContent>
        </Card>
        
        <Card className="brand-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-heading text-h4 font-medium">Avg Technical Health</CardTitle>
            <TrendingUp className="h-5 w-5 text-brand-digital-teal" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-h1 font-medium text-brand-gunmetal-gray">
              {Math.round(portfolioCompanies.reduce((acc, company) => acc + company.technicalHealth, 0) / portfolioCompanies.length)}%
            </div>
            <p className="text-caption text-muted-foreground mt-2">
              +5% from last quarter
            </p>
          </CardContent>
        </Card>
        
        <Card className="brand-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-heading text-h4 font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-caution-amber" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-h1 font-medium text-brand-gunmetal-gray">
              {portfolioCompanies.reduce((acc, company) => acc + company.alerts, 0)}
            </div>
            <p className="text-caption text-muted-foreground mt-2">
              -3 resolved this week
            </p>
          </CardContent>
        </Card>
        
        <Card className="brand-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="font-heading text-h4 font-medium">Initiatives Progress</CardTitle>
            <BarChart3 className="h-5 w-5 text-brand-digital-teal" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-h1 font-medium text-brand-gunmetal-gray">
              {Math.round((portfolioCompanies.reduce((acc, company) => acc + company.completedInitiatives, 0) / 
                portfolioCompanies.reduce((acc, company) => acc + company.totalInitiatives, 0)) * 100)}%
            </div>
            <p className="text-caption text-muted-foreground mt-2">
              15 initiatives completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Companies List & Pending Scans */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="font-medium">Overview</TabsTrigger>
          <TabsTrigger value="active_scans" className="font-medium">
            Active Scans ({activeScans.length})
          </TabsTrigger>
          <TabsTrigger value="health" className="font-medium">Technical Health</TabsTrigger>
          <TabsTrigger value="initiatives" className="font-medium">Initiatives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {portfolioCompanies.map((company) => (
              <Card key={company.id} className="brand-card">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <h3 className="font-heading text-h3 font-medium text-brand-gunmetal-gray">
                        {company.name}
                      </h3>
                      <Badge variant="outline" className="text-body-sm">
                        {company.industry}
                      </Badge>
                      {getStatusIcon(company.status)}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(company.status)}>
                        {company.technicalHealth}% Health
                      </Badge>
                      {company.alerts > 0 && (
                        <Badge variant="destructive" className="bg-risk-red text-white">
                          {company.alerts} Alert{company.alerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-body-sm text-muted-foreground">
                    Acquired {new Date(company.acquisitionDate).toLocaleDateString()} • 
                    Last scan {new Date(company.lastScanDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-heading text-h4 font-medium text-brand-gunmetal-gray mb-3">
                      Investment Thesis
                    </h4>
                    <p className="text-body text-muted-foreground leading-relaxed">
                      {company.investmentThesis}
                    </p>
                  </div>
                  
                  {/* Modular metrics grid */}
                  <div className="grid-modular grid-modular-4">
                    <div className="space-y-2">
                      <p className="text-caption text-muted-foreground font-medium">Code Quality</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={company.keyMetrics.codeQuality} className="flex-1 h-2" />
                        <span className="text-body-sm font-mono font-medium text-brand-gunmetal-gray">
                          {company.keyMetrics.codeQuality}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-caption text-muted-foreground font-medium">Security</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={company.keyMetrics.security} className="flex-1 h-2" />
                        <span className="text-body-sm font-mono font-medium text-brand-gunmetal-gray">
                          {company.keyMetrics.security}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-caption text-muted-foreground font-medium">Scalability</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={company.keyMetrics.scalability} className="flex-1 h-2" />
                        <span className="text-body-sm font-mono font-medium text-brand-gunmetal-gray">
                          {company.keyMetrics.scalability}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-caption text-muted-foreground font-medium">Compliance</p>
                      <div className="flex items-center space-x-3">
                        <Progress value={company.keyMetrics.compliance} className="flex-1 h-2" />
                        <span className="text-body-sm font-mono font-medium text-brand-gunmetal-gray">
                          {company.keyMetrics.compliance}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-body-sm text-muted-foreground">
                      Initiatives: <span className="font-medium text-brand-gunmetal-gray">
                        {company.completedInitiatives}/{company.totalInitiatives}
                      </span> completed
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" className="btn-secondary" asChild>
                        <Link to={`/portfolio/${company.id}/scan`}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Scan
                        </Link>
                      </Button>
                      {(company.id === 1 || company.id === 4) && (
                        <Button variant="outline" size="sm" className="btn-secondary" asChild>
                          <Link to={`/portfolio/${company.id}/deep-dive`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Deep Dive
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="btn-secondary">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active_scans" className="space-y-6">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="font-heading text-h3 font-medium">Active Scan Requests</CardTitle>
              <CardDescription className="text-body">
                Scans currently pending or in processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActiveScans ? (
                <p className="text-body text-muted-foreground">Loading active scans...</p>
              ) : activeScans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PlusCircle className="mx-auto h-16 w-16 mb-6 text-brand-digital-teal/30" />
                  <p className="text-body mb-2">No active scan requests at the moment.</p>
                  <p className="text-body-sm text-muted-foreground mb-6">
                    Ready to analyze your next portfolio company?
                  </p>
                  <Button size="sm" className="btn-primary" asChild>
                     <Link to="/scans/request">Request a New Scan</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between rounded-md border border-gray-100 p-4 transition-all hover:border-brand-digital-teal/20">
                      <div>
                        <h3 className="font-heading text-h4 font-medium text-brand-gunmetal-gray">
                          {scan.company_name}
                        </h3>
                        <p className="text-body-sm text-muted-foreground">
                          Requested by: {scan.requestor_name || 'N/A'} for {scan.organization_name || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ScanStatusBadge status={scan.status} />
                        <Button variant="outline" size="sm" className="btn-secondary" asChild>
                          <Link to={`/scans/${scan.id}`}>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="font-heading text-h3 font-medium">Technical Health Trends</CardTitle>
              <CardDescription className="text-body">
                Track technical health improvements across your portfolio companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-muted-foreground">
                <BarChart3 className="mx-auto h-16 w-16 mb-6 text-brand-digital-teal/30" />
                <p className="text-body mb-2">Technical health analytics dashboard coming soon</p>
                <p className="text-body-sm">This will show detailed health trends and comparisons</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-6">
          <Card className="brand-card">
            <CardHeader>
              <CardTitle className="font-heading text-h3 font-medium">Operational Initiatives</CardTitle>
              <CardDescription className="text-body">
                Track progress on operational improvement initiatives across portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-muted-foreground">
                <TrendingUp className="mx-auto h-16 w-16 mb-6 text-brand-digital-teal/30" />
                <p className="text-body mb-2">Initiatives tracking dashboard coming soon</p>
                <p className="text-body-sm">This will show detailed initiative progress and timelines</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 