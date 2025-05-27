import { useState } from 'react'
import { BarChart3, TrendingUp, Users, Clock, Target, PieChart, LineChart, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useAuth } from '@/lib/auth/auth-provider'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role
  const isAdmin = userRole === 'admin'
  const isPE = userRole === 'pe'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Platform-wide analytics and performance metrics'
              : isPE 
              ? 'Portfolio performance and technical health analytics'
              : 'Your scan history and technical insights'
            }
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total Scans' : isPE ? 'Portfolio Companies' : 'Your Scans'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? '1,247' : isPE ? '12' : '23'}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? '+12% from last month' : isPE ? '+2 this quarter' : '+3 this month'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Active Users' : 'Avg Health Score'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? '89' : '82%'}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? '+5 new this week' : '+5% improvement'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Avg Review Time' : 'Critical Issues'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? '32m' : '7'}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? '-8% faster' : '-3 resolved'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Success Rate' : isPE ? 'ROI Impact' : 'Scan Success'}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAdmin ? '94%' : isPE ? '+23%' : '100%'}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? '+2% this month' : isPE ? 'portfolio value' : 'completion rate'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          {isPE && <TabsTrigger value="portfolio">Portfolio</TabsTrigger>}
          {isAdmin && <TabsTrigger value="platform">Platform</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scan Volume Trends</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Platform-wide scan activity' : 'Your scanning activity over time'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-md border bg-muted/10">
                  <div className="text-center">
                    <LineChart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Scan Volume Chart</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Interactive chart showing scan trends would appear here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Health Distribution</CardTitle>
                <CardDescription>
                  {isPE ? 'Portfolio company health scores' : 'Health score breakdown'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-md border bg-muted/10">
                  <div className="text-center">
                    <PieChart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Health Distribution</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Pie chart showing health score distribution
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest analytics insights and notable changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: isAdmin ? 'Peak scan volume detected' : isPE ? 'Portfolio health improved' : 'New scan completed',
                    description: isAdmin 
                      ? '47 scans completed in the last 24 hours - highest daily volume this month'
                      : isPE 
                      ? 'Average portfolio technical health increased by 5% this quarter'
                      : 'Your latest scan for TechFlow Solutions shows 85% health score',
                    time: '2 hours ago',
                    type: 'positive'
                  },
                  {
                    title: isAdmin ? 'Review queue optimization' : 'Security alert resolved',
                    description: isAdmin
                      ? 'Average review time reduced to 32 minutes - 15% improvement'
                      : 'Critical security vulnerability in DataVault Inc has been addressed',
                    time: '6 hours ago',
                    type: 'info'
                  },
                  {
                    title: isAdmin ? 'New advisor onboarded' : isPE ? 'Initiative milestone reached' : 'Recommendation implemented',
                    description: isAdmin
                      ? 'Sarah Johnson joined as Security Specialist - expanding review capacity'
                      : isPE
                      ? 'SecureNet Systems completed API standardization initiative'
                      : 'Implemented CI/CD improvements based on scan recommendations',
                    time: '1 day ago',
                    type: 'neutral'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 rounded-lg border p-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      activity.type === 'positive' ? 'bg-green-500' :
                      activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Long-term trends and performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-80 items-center justify-center rounded-md border bg-muted/10">
                <div className="text-center">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Trend Analysis</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Detailed trend analysis and forecasting charts would appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isPE && (
          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Analytics</CardTitle>
                <CardDescription>
                  Comprehensive analytics across your portfolio companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-80 items-center justify-center rounded-md border bg-muted/10">
                  <div className="text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Portfolio Dashboard</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Advanced portfolio analytics and benchmarking tools
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="platform" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>
                  System-wide performance and usage analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-80 items-center justify-center rounded-md border bg-muted/10">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Platform Metrics</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Comprehensive platform analytics and operational metrics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
} 