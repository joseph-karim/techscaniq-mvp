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
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-green-500'
    case 'healthy': return 'bg-blue-500'
    case 'attention': return 'bg-yellow-500'
    case 'critical': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'healthy': return <CheckCircle className="h-4 w-4 text-blue-600" />
    case 'attention': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
    default: return <Clock className="h-4 w-4 text-gray-600" />
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
        .select('*, reports(id)')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Companies</h1>
          <p className="text-muted-foreground">
            Monitor technical health and operational improvements across your portfolio
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Generate LP Report
        </Button>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioCompanies.length}</div>
            <p className="text-xs text-muted-foreground">
              +1 new acquisition this quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Technical Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(portfolioCompanies.reduce((acc, company) => acc + company.technicalHealth, 0) / portfolioCompanies.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolioCompanies.reduce((acc, company) => acc + company.alerts, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              -3 resolved this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initiatives Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((portfolioCompanies.reduce((acc, company) => acc + company.completedInitiatives, 0) / 
                portfolioCompanies.reduce((acc, company) => acc + company.totalInitiatives, 0)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              15 initiatives completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Companies List & Pending Scans */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active_scans">Active Scans ({activeScans.length})</TabsTrigger>
          <TabsTrigger value="health">Technical Health</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {portfolioCompanies.map((company) => (
              <Card key={company.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-xl">{company.name}</CardTitle>
                      <Badge variant="outline">{company.industry}</Badge>
                      {getStatusIcon(company.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(company.status)}>
                        {company.technicalHealth}% Health
                      </Badge>
                      {company.alerts > 0 && (
                        <Badge variant="destructive">
                          {company.alerts} Alert{company.alerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Acquired {new Date(company.acquisitionDate).toLocaleDateString()} • 
                    Last scan {new Date(company.lastScanDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Investment Thesis</h4>
                      <p className="text-sm text-muted-foreground">{company.investmentThesis}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Code Quality</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={company.keyMetrics.codeQuality} className="flex-1" />
                          <span className="text-xs font-medium">{company.keyMetrics.codeQuality}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Security</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={company.keyMetrics.security} className="flex-1" />
                          <span className="text-xs font-medium">{company.keyMetrics.security}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Scalability</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={company.keyMetrics.scalability} className="flex-1" />
                          <span className="text-xs font-medium">{company.keyMetrics.scalability}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Compliance</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={company.keyMetrics.compliance} className="flex-1" />
                          <span className="text-xs font-medium">{company.keyMetrics.compliance}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-muted-foreground">
                        Initiatives: {company.completedInitiatives}/{company.totalInitiatives} completed
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/portfolio/${company.id}/scan`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Scan
                          </Link>
                        </Button>
                        {company.id === 1 && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/portfolio/${company.id}/deep-dive`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Deep Dive
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active_scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Scan Requests</CardTitle>
              <CardDescription>
                Scans currently pending or in processing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActiveScans ? (
                <p>Loading active scans...</p>
              ) : activeScans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PlusCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No active scan requests at the moment.</p>
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                     <Link to="/scans/request">Request a New Scan</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <h3 className="font-medium">{scan.company_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Requested by: {scan.requestor_name || 'N/A'} for {scan.organization_name || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ScanStatusBadge status={scan.status} />
                        <Button variant="outline" size="sm" asChild>
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

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Health Trends</CardTitle>
              <CardDescription>
                Track technical health improvements across your portfolio companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                <p>Technical health analytics dashboard coming soon</p>
                <p className="text-sm">This will show detailed health trends and comparisons</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operational Initiatives</CardTitle>
              <CardDescription>
                Track progress on operational improvement initiatives across portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="mx-auto h-12 w-12 mb-4" />
                <p>Initiatives tracking dashboard coming soon</p>
                <p className="text-sm">This will show detailed initiative progress and timelines</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 