import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PlusCircle } from 'lucide-react'
import { TechScanButton } from '@/components/brand'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TechHealthScoreGauge } from '@/components/dashboard/tech-health-score-gauge'
import { RiskSummaryCards } from '@/components/dashboard/risk-summary-cards'
import { RecentScansTable } from '@/components/dashboard/recent-scans-table'
import { KeyFindings } from '@/components/dashboard/key-findings'
import { useAuth } from '@/lib/auth/auth-provider'
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
          <h1 className="text-3xl font-space font-medium tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground font-ibm">
            {isAdmin 
              ? 'Welcome to the admin dashboard - review and manage technical due diligence scans' 
              : 'Welcome to TechScan IQ - AI-powered technical due diligence for investors'
            }
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin ? (
            <TechScanButton variant="primary" asChild>
              <Link to="/advisor/queue">
                Review Pending Scans
              </Link>
            </TechScanButton>
          ) : (
            <TechScanButton variant="primary" icon={<PlusCircle className="h-4 w-4" />} asChild>
              <Link to="/scans/request">
                Request Scan
              </Link>
            </TechScanButton>
          )}
        </div>
      </div>

      {!hasScans ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="font-space">Get Started with TechScan IQ</CardTitle>
            <CardDescription className="font-ibm">
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
              <h3 className="mb-2 text-xl font-semibold font-space">No scans yet</h3>
              <p className="mb-4 text-muted-foreground font-ibm">
                Start your first technical due diligence scan to get insights on your target company's tech stack, architecture, security, and code quality.
              </p>
              <TechScanButton variant="primary" icon={<PlusCircle className="h-4 w-4" />} asChild>
                <Link to="/scans/request">
                  Request Your First Scan
                </Link>
              </TechScanButton>
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
            <TabsTrigger value="overview" className="font-space">Overview</TabsTrigger>
            <TabsTrigger value="scans" className="font-space">Recent Scans</TabsTrigger>
            <TabsTrigger value="findings" className="font-space">Key Findings</TabsTrigger>
            {isAdmin && <TabsTrigger value="queue" className="font-space">Review Queue</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {isAdmin ? (
              <Card className="bg-brand-teal/5 border-brand-teal">
                <CardHeader className="pb-2">
                  <CardTitle className="font-space">Admin Dashboard Overview</CardTitle>
                  <CardDescription className="font-ibm">
                    Monitor the status of all technical due diligence scans
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex flex-col gap-1 rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground font-ibm">Scans Awaiting Review</div>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold font-space">3</div>
                        <Badge className="bg-caution-amber font-space">Action Needed</Badge>
                      </div>
                      <TechScanButton size="sm" variant="ghost" className="mt-1 justify-start p-0" icon={<ArrowRight className="h-3 w-3" />} asChild>
                        <Link to="/advisor/queue">
                          View Queue
                        </Link>
                      </TechScanButton>
                    </div>
                    
                    <div className="flex flex-col gap-1 rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground font-ibm">Scans Completed Today</div>
                      <div className="text-3xl font-bold font-space">5</div>
                      <TechScanButton size="sm" variant="ghost" className="mt-1 justify-start p-0" icon={<ArrowRight className="h-3 w-3" />} asChild>
                        <Link to="/advisor/queue?status=complete">
                          View Completed
                        </Link>
                      </TechScanButton>
                    </div>
                    
                    <div className="flex flex-col gap-1 rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground font-ibm">Average Review Time</div>
                      <div className="text-3xl font-bold font-space">32m</div>
                      <TechScanButton size="sm" variant="ghost" className="mt-1 justify-start p-0" icon={<ArrowRight className="h-3 w-3" />} asChild>
                        <Link to="/analytics">
                          View Analytics
                        </Link>
                      </TechScanButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-space">Tech Health Score</CardTitle>
                      <TechScanButton variant="ghost" size="sm" className="text-brand-teal" icon={<ArrowRight className="h-4 w-4" />} asChild>
                        <Link to="/reports/scan-1">
                          View Latest
                        </Link>
                      </TechScanButton>
                  </CardHeader>
                  <CardContent>
                    <TechHealthScoreGauge score={7.8} grade="B" />
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800 md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium font-space">Risk Summary</CardTitle>
                    <TechScanButton variant="ghost" size="sm" className="text-brand-teal" icon={<ArrowRight className="h-4 w-4" />} asChild>
                      <Link to="/reports/scan-1">
                        View Details
                      </Link>
                    </TechScanButton>
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
                  <CardTitle className="font-space">Recent Scans</CardTitle>
                  <CardDescription className="font-ibm">Your last 5 technical due diligence scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentScansTable />
                </CardContent>
              </Card>
              
              <Card className="col-span-1 border-slate-200 shadow-sm dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="font-space">Key Findings</CardTitle>
                  <CardDescription className="font-ibm">Critical insights from recent scans</CardDescription>
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
                <CardTitle className="font-space">All Scans</CardTitle>
                <CardDescription className="font-ibm">A complete history of your technical due diligence scans</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentScansTable showAll />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="findings">
            <Card className="border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader>
                <CardTitle className="font-space">All Findings</CardTitle>
                <CardDescription className="font-ibm">Comprehensive list of findings across all scans</CardDescription>
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
                  <CardTitle className="font-space">Pending Reviews</CardTitle>
                  <CardDescription className="font-ibm">Scans awaiting your review and approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/40">
                        <div>
                          <h3 className="font-medium font-space">{['DevSecOps Solutions', 'FinTech Express', 'DataViz Pro'][i-1]}</h3>
                          <p className="text-sm text-muted-foreground font-ibm">
                            Requested {['4 hours', '2 days', '3 days'][i-1]} ago by {['John Investor', 'Sarah Wilson', 'Michael Chen'][i-1]}
                          </p>
                        </div>
                        <TechScanButton size="sm" variant="primary" asChild>
                          <Link to={`/advisor/review/scan-${i+1}`}>
                            Review Now
                          </Link>
                        </TechScanButton>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <TechScanButton variant="secondary" asChild>
                      <Link to="/advisor/queue">
                        View All Pending Reviews
                      </Link>
                    </TechScanButton>
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