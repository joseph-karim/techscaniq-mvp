import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TechHealthScoreGauge } from '@/components/dashboard/tech-health-score-gauge'
import { RiskSummaryCards } from '@/components/dashboard/risk-summary-cards'
import { RecentScansTable } from '@/components/dashboard/recent-scans-table'
import { KeyFindings } from '@/components/dashboard/key-findings'
import { useAuth } from '@/lib/auth/mock-auth-provider'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { user } = useAuth()
  const isAdmin = user?.user_metadata?.role === 'admin'
  
  // Mock data - in a real app, this would come from API
  const hasScans = true

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Welcome to the admin dashboard - review and manage technical due diligence scans' 
              : 'Welcome to TechScan IQ - AI-powered technical due diligence for investors'
            }
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin ? (
            <Button className="bg-electric-teal hover:bg-electric-teal/90" asChild>
              <Link to="/advisor/queue">
                Review Pending Scans
              </Link>
            </Button>
          ) : (
            <Button className="bg-electric-teal hover:bg-electric-teal/90" asChild>
              <Link to="/scans/request">
                <PlusCircle className="mr-2 h-4 w-4" /> Request Scan
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!hasScans ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Get Started with TechScan IQ</CardTitle>
            <CardDescription>
              Request your first technical due diligence scan to see insights here
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <img 
                src="https://cdn-icons-png.flaticon.com/512/1055/1055645.png" 
                alt="Empty dashboard" 
                className="mb-4 h-40 w-40 opacity-20" 
              />
              <h3 className="mb-2 text-xl font-semibold">No scans yet</h3>
              <p className="mb-4 text-muted-foreground">
                Start your first technical due diligence scan to get insights on your target company's tech stack, architecture, security, and code quality.
              </p>
              <Button className="bg-electric-teal hover:bg-electric-teal/90" asChild>
                <Link to="/scans/request">
                  <PlusCircle className="mr-2 h-4 w-4" /> Request Your First Scan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-4"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scans">Recent Scans</TabsTrigger>
            <TabsTrigger value="findings">Key Findings</TabsTrigger>
            {isAdmin && <TabsTrigger value="queue">Review Queue</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {isAdmin ? (
              <Card className="bg-electric-teal/5 border-electric-teal">
                <CardHeader className="pb-2">
                  <CardTitle>Admin Dashboard Overview</CardTitle>
                  <CardDescription>
                    Monitor the status of all technical due diligence scans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1 rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Scans Awaiting Review</div>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold">3</div>
                        <Badge className="bg-caution-amber">Action Needed</Badge>
                      </div>
                      <Button size="sm" variant="link" className="mt-1 justify-start p-0" asChild>
                        <Link to="/advisor/queue">
                          View Queue <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-1 rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Scans Completed Today</div>
                      <div className="text-3xl font-bold">5</div>
                      <Button size="sm" variant="link" className="mt-1 justify-start p-0" asChild>
                        <Link to="/advisor/queue?status=complete">
                          View Completed <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex flex-col gap-1 rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Average Review Time</div>
                      <div className="text-3xl font-bold">32m</div>
                      <Button size="sm" variant="link" className="mt-1 justify-start p-0" asChild>
                        <Link to="/analytics">
                          View Analytics <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tech Health Score</CardTitle>
                    <Button variant="link" size="sm" className="text-electric-teal" asChild>
                      <Link to="/reports/scan-1">
                        View Latest <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <TechHealthScoreGauge score={7.8} grade="B" />
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800 md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risk Summary</CardTitle>
                    <Button variant="link" size="sm" className="text-electric-teal" asChild>
                      <Link to="/reports/scan-1">
                        View Details <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <RiskSummaryCards />
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800 md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Scans</CardTitle>
                  <CardDescription>Your last 5 technical due diligence scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentScansTable />
                </CardContent>
              </Card>
              
              <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                  <CardDescription>Critical insights from recent scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <KeyFindings />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="scans">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle>All Scans</CardTitle>
                <CardDescription>A complete history of your technical due diligence scans</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentScansTable showAll />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="findings">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle>All Findings</CardTitle>
                <CardDescription>Comprehensive list of findings across all scans</CardDescription>
              </CardHeader>
              <CardContent>
                <KeyFindings showAll />
              </CardContent>
            </Card>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="queue">
              <Card className="border-slate-200 shadow-sm dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Pending Reviews</CardTitle>
                  <CardDescription>Scans awaiting your review and approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/40">
                        <div>
                          <h3 className="font-medium">{['DevSecOps Solutions', 'FinTech Express', 'DataViz Pro'][i-1]}</h3>
                          <p className="text-sm text-muted-foreground">
                            Requested {['4 hours', '2 days', '3 days'][i-1]} ago by {['John Investor', 'Sarah Wilson', 'Michael Chen'][i-1]}
                          </p>
                        </div>
                        <Button className="bg-electric-teal hover:bg-electric-teal/90" size="sm" asChild>
                          <Link to={`/advisor/review/scan-${i+1}`}>
                            Review Now
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="outline" asChild>
                      <Link to="/advisor/queue">
                        View All Pending Reviews
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}