import { useState } from 'react'
import { TrendingUp, Target, CheckCircle, Clock, AlertTriangle, BarChart3, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// Mock thesis tracking data
const thesisTracking = [
  {
    id: 1,
    companyName: 'TechFlow Solutions',
    thesisTitle: 'Tech Stack Modernization & Compliance',
    targetDate: '2024-06-15',
    progress: 75,
    status: 'on-track',
    kpis: [
      {
        name: 'CI/CD Velocity Improvement',
        target: '50% increase',
        current: '38% increase',
        progress: 76,
        status: 'on-track'
      },
      {
        name: 'SOC2 Compliance',
        target: 'Achieved',
        current: 'In Progress',
        progress: 85,
        status: 'on-track'
      },
      {
        name: 'Code Quality Score',
        target: '90+',
        current: '88',
        progress: 98,
        status: 'excellent'
      }
    ],
    milestones: [
      { name: 'Infrastructure Assessment', completed: true, date: '2023-07-01' },
      { name: 'CI/CD Pipeline Setup', completed: true, date: '2023-09-15' },
      { name: 'Security Audit', completed: true, date: '2023-11-30' },
      { name: 'SOC2 Certification', completed: false, date: '2024-04-01' },
      { name: 'Final Validation', completed: false, date: '2024-06-15' }
    ]
  },
  {
    id: 2,
    companyName: 'DataVault Inc',
    thesisTitle: 'Cloud Migration & Cost Optimization',
    targetDate: '2024-09-22',
    progress: 45,
    status: 'at-risk',
    kpis: [
      {
        name: 'Infrastructure Cost Reduction',
        target: '30% reduction',
        current: '18% reduction',
        progress: 60,
        status: 'behind'
      },
      {
        name: 'Data Pipeline Modernization',
        target: 'Complete',
        current: '60% migrated',
        progress: 60,
        status: 'on-track'
      },
      {
        name: 'System Uptime',
        target: '99.9%',
        current: '99.7%',
        progress: 97,
        status: 'on-track'
      }
    ],
    milestones: [
      { name: 'Cloud Strategy Definition', completed: true, date: '2023-10-01' },
      { name: 'Pilot Migration', completed: true, date: '2023-12-15' },
      { name: 'Core Systems Migration', completed: false, date: '2024-03-01' },
      { name: 'Data Pipeline Upgrade', completed: false, date: '2024-06-01' },
      { name: 'Full Migration Complete', completed: false, date: '2024-09-22' }
    ]
  },
  {
    id: 3,
    companyName: 'SecureNet Systems',
    thesisTitle: 'Platform Consolidation & API Standardization',
    targetDate: '2025-01-08',
    progress: 25,
    status: 'on-track',
    kpis: [
      {
        name: 'API Standardization',
        target: '100% REST APIs',
        current: '40% complete',
        progress: 40,
        status: 'on-track'
      },
      {
        name: 'Platform Consolidation',
        target: '3 platforms → 1',
        current: '2 platforms remaining',
        progress: 33,
        status: 'on-track'
      },
      {
        name: 'Enterprise Client Onboarding',
        target: '5 new clients',
        current: '2 clients',
        progress: 40,
        status: 'on-track'
      }
    ],
    milestones: [
      { name: 'Platform Assessment', completed: true, date: '2024-02-01' },
      { name: 'API Design Standards', completed: false, date: '2024-04-01' },
      { name: 'First Platform Migration', completed: false, date: '2024-07-01' },
      { name: 'Second Platform Migration', completed: false, date: '2024-10-01' },
      { name: 'Enterprise Launch', completed: false, date: '2025-01-08' }
    ]
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return 'bg-green-500'
    case 'on-track': return 'bg-blue-500'
    case 'behind': return 'bg-yellow-500'
    case 'at-risk': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'on-track': return <TrendingUp className="h-4 w-4 text-blue-600" />
    case 'behind': return <Clock className="h-4 w-4 text-yellow-600" />
    case 'at-risk': return <AlertTriangle className="h-4 w-4 text-red-600" />
    default: return <Clock className="h-4 w-4 text-gray-600" />
  }
}

export default function ThesisTrackingPage() {
  const [selectedView, setSelectedView] = useState('overview')

  const totalTheses = thesisTracking.length
  const avgProgress = Math.round(thesisTracking.reduce((acc, thesis) => acc + thesis.progress, 0) / totalTheses)
  const onTrackCount = thesisTracking.filter(t => t.status === 'on-track' || t.status === 'excellent').length
  const atRiskCount = thesisTracking.filter(t => t.status === 'at-risk' || t.status === 'behind').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thesis Tracking</h1>
          <p className="text-muted-foreground">
            Monitor progress on investment thesis and operational improvement KPIs
          </p>
        </div>
        <Button>
          <BarChart3 className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Theses</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTheses}</div>
            <p className="text-xs text-muted-foreground">
              Across {totalTheses} portfolio companies
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProgress}%</div>
            <p className="text-xs text-muted-foreground">
              +12% from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTrackCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((onTrackCount / totalTheses) * 100)}% of total theses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Thesis Tracking Details */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPI Details</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {thesisTracking.map((thesis) => (
              <Card key={thesis.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-xl">{thesis.companyName}</CardTitle>
                      {getStatusIcon(thesis.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(thesis.status)}>
                        {thesis.progress}% Complete
                      </Badge>
                      <Badge variant="outline">
                        Due {new Date(thesis.targetDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{thesis.thesisTitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">{thesis.progress}%</span>
                      </div>
                      <Progress value={thesis.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {thesis.kpis.slice(0, 3).map((kpi, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium">{kpi.name}</p>
                            {getStatusIcon(kpi.status)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Target: {kpi.target}</span>
                              <span>Current: {kpi.current}</span>
                            </div>
                            <Progress value={kpi.progress} className="h-1" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {thesis.milestones.filter(m => m.completed).length}/{thesis.milestones.length} milestones completed
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          View Timeline
                        </Button>
                        <Button variant="outline" size="sm">
                          <DollarSign className="mr-2 h-4 w-4" />
                          Value Impact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>KPI Performance Dashboard</CardTitle>
              <CardDescription>
                Detailed view of all KPIs across portfolio companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                <p>Detailed KPI analytics coming soon</p>
                <p className="text-sm">This will show comprehensive KPI trends and benchmarks</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Timeline</CardTitle>
              <CardDescription>
                Track milestone completion across all investment theses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4" />
                <p>Interactive milestone timeline coming soon</p>
                <p className="text-sm">This will show detailed milestone tracking and dependencies</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 