import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  LineChart, 
  PieChart, 
  User, 
  Users, 
  Zap 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { WorkflowDiagram } from '@/components/dashboard/workflow-diagram'

export default function AdvisorDashboardPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  
  // Show welcome toast on first load
  useEffect(() => {
    toast({
      title: "Welcome to Advisor Dashboard",
      description: "You have 3 scans awaiting review",
      duration: 5000,
    })
  }, [toast])
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advisor Dashboard</h1>
          <p className="text-muted-foreground">
            Review and publish technical due diligence reports
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="bg-electric-teal hover:bg-electric-teal/90" asChild>
            <Link to="/advisor/queue">
              <Clock className="mr-2 h-4 w-4" /> Pending Reviews (3)
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-10 w-10 rounded-lg bg-electric-teal/10 p-2 text-electric-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Reviews Today</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">5</h2>
                  <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    +2
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-10 w-10 rounded-lg bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">3</h2>
                  <Badge variant="outline" className="text-muted-foreground">
                    -1
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-10 w-10 rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total Completed</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">128</h2>
                  <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    +12%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-10 w-10 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Review Time</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">32m</h2>
                  <Badge variant="outline" className="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    -5%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-electric-teal/20 bg-electric-teal/5">
            <CardHeader className="pb-3">
              <CardTitle>Process Workflow</CardTitle>
              <CardDescription>
                Current status of the technical due diligence workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowDiagram />
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <div className="flex justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  Current stage: <span className="font-medium text-electric-teal">Expert Review</span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/advisor/queue">
                    Go to Review Queue
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Pending Reviews</CardTitle>
                <CardDescription>
                  Scans awaiting your expert review and validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['DevSecOps Solutions', 'FinTech Express', 'DataViz Pro'].map((company, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/40">
                      <div>
                        <h3 className="font-medium">{company}</h3>
                        <p className="text-sm text-muted-foreground">
                          Requested {['4 hours', '2 days', '3 days'][i]} ago • AI confidence: {[87, 92, 79][i]}%
                        </p>
                      </div>
                      <Button className="bg-electric-teal hover:bg-electric-teal/90" size="sm" asChild>
                        <Link to={`/advisor/review/scan-${i+2}`}>
                          Review
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-background px-6 py-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/advisor/queue">View All Pending Reviews</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>AI Confidence Metrics</CardTitle>
                <CardDescription>
                  Trust levels in AI-generated findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-medium">Architecture Analysis</div>
                      <div className="text-sm">85%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-electric-teal" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-medium">Security Assessment</div>
                      <div className="text-sm">92%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-electric-teal" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-medium">Code Quality</div>
                      <div className="text-sm">78%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-electric-teal" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-medium">Thesis Alignment</div>
                      <div className="text-sm">83%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-electric-teal" style={{ width: '83%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="text-sm text-muted-foreground">
                    AI confidence metrics show the reliability of AI-generated findings before human review.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>
                Advisor productivity metrics over the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border rounded-md p-8 bg-muted/10">
                <div className="text-center">
                  <LineChart className="mx-auto h-12 w-12 text-muted" />
                  <h3 className="mt-4 text-lg font-medium">Performance Chart</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Performance analytics visualization would appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Review Completion Rate</CardTitle>
                <CardDescription>
                  Percentage of reviews completed within SLA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="relative flex h-40 w-40 items-center justify-center">
                    <PieChart className="absolute h-40 w-40 text-muted" />
                    <div className="z-10 text-center">
                      <div className="text-4xl font-bold">94%</div>
                      <div className="text-sm text-muted-foreground">completion rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Review Volume by Day</CardTitle>
                <CardDescription>
                  Number of scans reviewed per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-md border p-2">
                        <Calendar className="h-6 w-6 text-muted" />
                      </div>
                      <div className="mt-1 text-xs font-medium">Mon</div>
                      <div className="text-xs text-muted-foreground">4</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-md border p-2">
                        <Calendar className="h-6 w-6 text-muted" />
                      </div>
                      <div className="mt-1 text-xs font-medium">Tue</div>
                      <div className="text-xs text-muted-foreground">6</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-md border bg-electric-teal/10 p-2">
                        <Calendar className="h-6 w-6 text-electric-teal" />
                      </div>
                      <div className="mt-1 text-xs font-medium">Wed</div>
                      <div className="text-xs text-electric-teal font-medium">Today (5)</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-md border p-2">
                        <Calendar className="h-6 w-6 text-muted" />
                      </div>
                      <div className="mt-1 text-xs font-medium">Thu</div>
                      <div className="text-xs text-muted-foreground">3</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-md border p-2">
                        <Calendar className="h-6 w-6 text-muted" />
                      </div>
                      <div className="mt-1 text-xs font-medium">Fri</div>
                      <div className="text-xs text-muted-foreground">7</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Technical advisors responsible for reviewing scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Admin User', role: 'Lead Advisor', avatar: 'AU', reviews: 42, activeScans: 1 },
                  { name: 'Sarah Johnson', role: 'Security Specialist', avatar: 'SJ', reviews: 37, activeScans: 1 },
                  { name: 'Michael Chen', role: 'Architecture Advisor', avatar: 'MC', reviews: 25, activeScans: 0 },
                  { name: 'Priya Patel', role: 'DevOps Expert', avatar: 'PP', reviews: 31, activeScans: 1 }
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric-teal/10 text-electric-teal">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center">
                        <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                        <span>{member.reviews} reviews</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>{member.activeScans} active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 px-6 py-4">
              <div className="flex justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  <Users className="mr-1 inline-block h-4 w-4" />
                  4 team members active
                </div>
                <Button variant="outline" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}