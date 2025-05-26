import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Activity, 
  AlertTriangle,
  CheckCircle2, 
  Clock, 
  Cog,
  Eye,
  FileText,
  Play,
  Settings,
  Zap 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Mock data for scan workflow
  const scanStats = {
    pendingRequests: 5,
    inProgress: 3,
    awaitingReview: 4,
    completedToday: 8,
    totalActive: 12,
    avgProcessingTime: '45m',
    successRate: 94.2
  }

  const recentRequests = [
    {
      id: 'req-001',
      company: 'TechFlow Solutions',
      requestedBy: 'Sarah Chen',
      organization: 'Venture Partners',
      priority: 'high',
      status: 'pending_config',
      submittedAt: '2 hours ago'
    },
    {
      id: 'req-002', 
      company: 'DataSync Pro',
      requestedBy: 'Michael Rodriguez',
      organization: 'Growth Capital',
      priority: 'medium',
      status: 'pending_config',
      submittedAt: '4 hours ago'
    },
    {
      id: 'req-003',
      company: 'CloudSecure Inc',
      requestedBy: 'Lisa Wang',
      organization: 'Tech Ventures',
      priority: 'urgent',
      status: 'pending_config',
      submittedAt: '6 hours ago'
    }
  ]

  const activeScans = [
    {
      id: 'scan-101',
      company: 'DevOps Masters',
      stage: 'data_collection',
      progress: 35,
      estimatedCompletion: '25 minutes',
      aiModel: 'Claude-3 + GPT-4'
    },
    {
      id: 'scan-102',
      company: 'API Gateway Co',
      stage: 'security_analysis',
      progress: 72,
      estimatedCompletion: '12 minutes',
      aiModel: 'Gemini-Pro'
    },
    {
      id: 'scan-103',
      company: 'MicroServices Ltd',
      stage: 'architecture_review',
      progress: 88,
      estimatedCompletion: '5 minutes',
      aiModel: 'Claude-3'
    }
  ]

  const reviewQueue = [
    {
      id: 'scan-201',
      company: 'FastDeploy Systems',
      completedAt: '1 hour ago',
      aiConfidence: 92,
      flaggedIssues: 2,
      priority: 'high'
    },
    {
      id: 'scan-202',
      company: 'SecureCloud Pro',
      completedAt: '3 hours ago',
      aiConfidence: 87,
      flaggedIssues: 0,
      priority: 'medium'
    },
    {
      id: 'scan-203',
      company: 'DataFlow Analytics',
      completedAt: '5 hours ago',
      aiConfidence: 94,
      flaggedIssues: 1,
      priority: 'low'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-600 border-red-200'
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage scan workflow from request to publication
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="bg-electric-teal hover:bg-electric-teal/90" asChild>
            <Link to="/admin/scan-config">
              <Cog className="mr-2 h-4 w-4" /> Configure New Scan
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/advisor/queue">
              <Eye className="mr-2 h-4 w-4" /> Review Queue ({scanStats.awaitingReview})
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-10 w-10 rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.pendingRequests}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-600">
                    New
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-10 w-10 rounded-lg bg-electric-teal/10 p-2 text-electric-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Active Scans</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.inProgress}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-electric-teal/10 text-electric-teal">
                    Running
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-10 w-10 rounded-lg bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.awaitingReview}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-600">
                    Ready
                  </span>
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
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.completedToday}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                    +3
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Scan Requests</TabsTrigger>
          <TabsTrigger value="active">Active Scans</TabsTrigger>
          <TabsTrigger value="review">Review Queue</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Workflow Status Overview */}
          <Card className="border-electric-teal/20 bg-electric-teal/5">
            <CardHeader className="pb-3">
              <CardTitle>Scan Workflow Status</CardTitle>
              <CardDescription>
                Current state of the technical due diligence pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Capacity</span>
                    <span className="text-sm text-muted-foreground">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground">3 of 4 AI models active</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Queue Health</span>
                    <span className="text-sm text-muted-foreground">Good</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">Average wait time: 12 minutes</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="text-sm text-muted-foreground">{scanStats.successRate}%</span>
                  </div>
                  <Progress value={scanStats.successRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Scan Requests</CardTitle>
                <CardDescription>
                  Latest requests awaiting configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{request.company}</h4>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.requestedBy} • {request.organization}
                        </p>
                        <p className="text-xs text-muted-foreground">{request.submittedAt}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/scan-config/${request.id}`}>
                          Configure
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  AI models and infrastructure status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Claude-3 Sonnet</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">GPT-4 Turbo</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Gemini-Pro</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium">Data Collection API</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-600">
                      Degraded
                    </span>
                  </div>
                  
                  <div className="mt-4 rounded-md border bg-muted/20 p-3">
                    <p className="text-sm text-muted-foreground">
                      All critical systems operational. Data collection experiencing minor delays.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Scan Requests</CardTitle>
              <CardDescription>
                Configure and initiate scans for incoming requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{request.company}</h3>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                            {request.priority} priority
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Requested by: <span className="font-medium">{request.requestedBy}</span></p>
                          <p>Organization: <span className="font-medium">{request.organization}</span></p>
                          <p>Submitted: <span className="font-medium">{request.submittedAt}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/requests/${request.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button size="sm" className="bg-electric-teal hover:bg-electric-teal/90" asChild>
                          <Link to={`/admin/scan-config/${request.id}`}>
                            <Play className="mr-1 h-3 w-3" />
                            Configure Scan
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Scans</CardTitle>
              <CardDescription>
                Monitor ongoing AI analysis and data collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeScans.map((scan) => (
                  <div key={scan.id} className="rounded-lg border p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{scan.company}</h3>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-electric-teal/10 text-electric-teal">
                          {scan.stage.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{scan.progress}%</span>
                        </div>
                        <Progress value={scan.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>AI Model: {scan.aiModel}</span>
                          <span>ETA: {scan.estimatedCompletion}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/scans/${scan.id}/monitor`}>
                            <Activity className="mr-1 h-3 w-3" />
                            Monitor
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-1 h-3 w-3" />
                          Adjust
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>
                Scans completed and ready for advisor review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviewQueue.map((scan) => (
                  <div key={scan.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{scan.company}</h3>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(scan.priority)}`}>
                            {scan.priority} priority
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Completed: <span className="font-medium">{scan.completedAt}</span></p>
                          <p>AI Confidence: <span className="font-medium">{scan.aiConfidence}%</span></p>
                          {scan.flaggedIssues > 0 && (
                            <p className="flex items-center gap-1 text-orange-600">
                              <AlertTriangle className="h-3 w-3" />
                              {scan.flaggedIssues} flagged issue{scan.flaggedIssues > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/scans/${scan.id}/preview`}>
                            <Eye className="mr-1 h-3 w-3" />
                            Preview
                          </Link>
                        </Button>
                        <Button size="sm" className="bg-electric-teal hover:bg-electric-teal/90" asChild>
                          <Link to={`/advisor/review/${scan.id}`}>
                            <FileText className="mr-1 h-3 w-3" />
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Configuration</CardTitle>
                <CardDescription>
                  Configure AI models for different analysis types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Architecture Analysis</p>
                      <p className="text-sm text-muted-foreground">Claude-3 Sonnet</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Security Assessment</p>
                      <p className="text-sm text-muted-foreground">GPT-4 Turbo</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Code Quality</p>
                      <p className="text-sm text-muted-foreground">Gemini-Pro</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scan Templates</CardTitle>
                <CardDescription>
                  Pre-configured scan templates for different use cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Standard Due Diligence</p>
                      <p className="text-sm text-muted-foreground">Full technical assessment</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Security Focus</p>
                      <p className="text-sm text-muted-foreground">Enhanced security analysis</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Quick Assessment</p>
                      <p className="text-sm text-muted-foreground">Rapid overview scan</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    Create New Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 