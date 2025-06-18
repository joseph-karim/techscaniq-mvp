import { useState, useEffect } from 'react'
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
  Zap,
  Database,
  Brain,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Scan } from '@/types'
import { mockDemoScanRequests, DemoScanRequest } from '@/lib/mock-demo-data'
import { ScanStatusBadge } from '@/components/dashboard/recent-scans-table'
import { formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [allScans, setAllScans] = useState<(Scan | (DemoScanRequest & { is_demo: boolean }))[]>([])
  const [realReports, setRealReports] = useState<any[]>([])
  const [, setRealScans] = useState<any[]>([])
  const [aiWorkflows, setAiWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);

  const [scanStats, setScanStats] = useState({
    pendingRequests: 0,
    inProgress: 0,
    awaitingReview: 0,
    completedToday: 0,
    totalActive: 0,
    realReports: 0,
    aiWorkflows: 0,
  });

  useEffect(() => {
    async function loadAndProcessScans() {
      setLoading(true);
      
      // Load mock demo data and mark it as demo
      const demoScansWithFlag = mockDemoScanRequests.map(scan => ({ ...scan, is_demo: true }))
      const combinedScans = [...demoScansWithFlag];

      // Load real data from database (admin view can see all)
      try {
        const [
          { data: dbScans },
          { data: dbReports },
          { data: dbWorkflows },
          { data: failedCollections }
        ] = await Promise.all([
          supabase.from('scan_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('reports').select('*').order('created_at', { ascending: false }),
          supabase.from('ai_workflow_runs').select('*').order('created_at', { ascending: false }),
          supabase.from('evidence_collections')
            .select('*')
            .eq('status', 'failed')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        setRealScans(dbScans || []);
        setRealReports(dbReports || []);
        setAiWorkflows(dbWorkflows || []);
        setRecentErrors(failedCollections || []);

        // Add real scan requests to combined scans (marked as non-demo)
        if (dbScans && dbScans.length > 0) {
          const realScansWithFlag = dbScans.map(scan => ({ ...scan, is_demo: false }))
          combinedScans.push(...realScansWithFlag)
        }

        console.log('Loaded real data:', { 
          scans: dbScans?.length || 0, 
          reports: dbReports?.length || 0, 
          workflows: dbWorkflows?.length || 0 
        });

      } catch (error) {
        console.error('Error loading real data:', error);
        // Continue with mock data only
      }

      combinedScans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllScans(combinedScans);

      const pending = combinedScans.filter(s => s.status === 'pending').length;
      const processing = combinedScans.filter(s => s.status === 'processing').length;
      const review = combinedScans.filter(s => s.status === 'awaiting_review').length;
      const completed = combinedScans.filter(s => s.status === 'complete').length;
      
      setScanStats({
        pendingRequests: pending,
        inProgress: processing,
        awaitingReview: review,
        completedToday: completed,
        totalActive: processing + review,
        realReports: realReports.length,
        aiWorkflows: aiWorkflows.length,
      });

      setLoading(false);
    }
    loadAndProcessScans();
  }, [realReports.length, aiWorkflows.length]);
  
  const getPriorityColor = (priority?: Scan['status'] | string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-600 border-red-200'
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-200'
      case 'medium': return 'bg-blue-50 text-blue-600 border-blue-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }
  
  if (loading) return <div>Loading Admin Dashboard...</div>;

  const recentRequests = allScans.filter(s => s.status === 'pending');
  const activeProcessingScans = allScans.filter(s => s.status === 'processing');
  const reviewQueueScans = allScans.filter(s => s.status === 'awaiting_review' || (s.status === 'complete' && !(s as DemoScanRequest).mock_report_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-heading font-medium tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage scan workflow from request to publication
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="bg-brand-digital-teal hover:bg-brand-digital-teal/90 font-medium" asChild>
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
      
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-8">
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
              <Zap className="h-10 w-10 rounded-lg bg-brand-digital-teal/10 p-2 text-brand-digital-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Active Scans</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.inProgress}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-brand-digital-teal/10 text-brand-digital-teal">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-10 w-10 rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
              <div>
                <p className="text-sm text-muted-foreground">Real Reports</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.realReports}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-600">
                    Live
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-10 w-10 rounded-lg bg-pink-100 p-2 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" />
              <div>
                <p className="text-sm text-muted-foreground">AI Workflows</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold">{scanStats.aiWorkflows}</h2>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-pink-50 text-pink-600">
                    AI
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Scan Requests</TabsTrigger>
          <TabsTrigger value="active">Active Scans</TabsTrigger>
          <TabsTrigger value="review">Review Queue</TabsTrigger>
          <TabsTrigger value="reports">All Reports</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-brand-digital-teal/20 bg-brand-digital-teal/5">
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
                    {/* <span className="text-sm text-muted-foreground">{scanStats.successRate}%</span> */}
                  </div>
                  {/* <Progress value={scanStats.successRate} className="h-2" /> */}
                  <p className="text-xs text-muted-foreground">Last 30 days (Demo)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Recent Scan Requests</CardTitle>
                <CardDescription>
                  Latest requests awaiting configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-medium">{request.company_name}</h4>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor((request as DemoScanRequest).priority || 'medium')}`}>
                            {(request as DemoScanRequest).priority || 'medium'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(request as DemoScanRequest).requestor_name || 'N/A'} • {(request as DemoScanRequest).organization_name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/scan-config/${request.id}`}>
                          Configure
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {recentRequests.length === 0 && <p className="text-sm text-muted-foreground">No recent requests.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">System Health</CardTitle>
                <CardDescription>
                  AI models and infrastructure status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium font-sans">Claude 4 Opus</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium font-sans">GPT-4 Turbo</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium font-sans">Gemini-Pro</span>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-50 text-green-600">
                      Active
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium font-sans">Data Collection API</span>
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

          {/* Recent Errors Section */}
          {recentErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle>Recent Collection Failures</CardTitle>
                </div>
                <CardDescription>
                  Evidence collection errors requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentErrors.map((error) => (
                    <div key={error.id} className="rounded-lg border border-red-200 bg-white p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{error.company_name}</h4>
                            <Badge variant="destructive" className="text-xs">
                              Failed
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {error.collection_type} collection • {formatDate(error.created_at)}
                          </p>
                          {error.metadata?.error && (
                            <p className="text-xs text-red-600 font-mono mt-1">
                              {error.metadata.error}
                            </p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/scan-config/${error.scan_request_id || ''}`}>
                            Retry
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                          <h3 className="font-semibold">{request.company_name}</h3>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor((request as DemoScanRequest).priority || 'medium')}`}>
                            {(request as DemoScanRequest).priority || 'medium'} priority
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Requested by: <span className="font-medium">{(request as DemoScanRequest).requestor_name || 'N/A'}</span></p>
                          <p>Organization: <span className="font-medium">{(request as DemoScanRequest).organization_name || 'N/A'}</span></p>
                          <p>Submitted: <span className="font-medium">{formatDate(request.created_at)}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-brand-digital-teal hover:bg-brand-digital-teal/90 font-medium" asChild>
                          <Link to={`/admin/scan-config/${request.id}`}>
                            <Play className="mr-1 h-3 w-3" />
                            Configure Scan
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {recentRequests.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
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
                {activeProcessingScans.map((scan) => (
                  <div key={scan.id} className="rounded-lg border p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{scan.company_name}</h3>
                        <ScanStatusBadge status={scan.status as Scan['status']} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{ (scan as DemoScanRequest).status === 'processing' ? '50%' : 'N/A'}</span>
                        </div>
                        <Progress value={(scan as DemoScanRequest).status === 'processing' ? 50 : 0} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>AI Model: Mock Model</span>
                          <span>ETA: N/A</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/scans/${scan.id}/monitor`}>
                            <Activity className="mr-1 h-3 w-3" />
                            Monitor
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {activeProcessingScans.length === 0 && <p className="text-sm text-muted-foreground">No active scans.</p>}
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
                {reviewQueueScans.map((scan) => (
                  <div key={scan.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{scan.company_name}</h3>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor((scan as DemoScanRequest).priority || 'medium')}`}>
                            {(scan as DemoScanRequest).priority || 'medium'} priority
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Completed: <span className="font-medium">{formatDate(scan.updated_at)}</span></p>
                          <p>AI Confidence: <span className="font-medium">{ (scan as DemoScanRequest).status === 'complete' ? '90%' : 'N/A'}</span></p>
                          {(scan as DemoScanRequest).status === 'complete' && Math.random() > 0.7 && (
                            <p className="flex items-center gap-1 text-orange-600">
                              <AlertTriangle className="h-3 w-3" />
                              {Math.floor(Math.random() * 3) + 1} flagged issues
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/scans/${scan.id}`}>
                            <FileText className="mr-1 h-3 w-3" />
                            View Report
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {reviewQueueScans.length === 0 && <p className="text-sm text-muted-foreground">No scans in review queue.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Configuration</CardTitle>
              <CardDescription>
                Access the comprehensive pipeline configuration dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 border rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Evidence Collection & AI Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure evidence collection tools, AI models, prompts, and scan configurations all in one place.
                  </p>
                  <div className="grid gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Evidence Collection Pipeline - View all 9 collection tools</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>AI Analysis Configuration - Claude 4 Opus integration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Prompt Management - Edit and test AI prompts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Edge Function Monitoring - Real-time performance metrics</span>
                    </div>
                  </div>
                  <Button className="w-full" asChild>
                    <Link to="/admin/pipeline-config">
                      <Cog className="mr-2 h-4 w-4" />
                      Open Pipeline Configuration
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                All Reports ({realReports.length})
              </CardTitle>
              <CardDescription>
                View all generated reports including AI workflow results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Demo Reports */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">BMO Financial Group</h3>
                        <Badge variant="outline">Score: 95/100</Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">Demo Report</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Report Type: <span className="font-medium">Sales Intelligence</span></p>
                        <p>Industry: <span className="font-medium">Financial Services</span></p>
                        <p>Opportunity Score: <span className="font-medium">9.5/10</span></p>
                        <p>Created: <span className="font-medium">Demo Report</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/sales-intelligence/bmo">
                          <FileText className="mr-1 h-3 w-3" />
                          View Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      Comprehensive sales intelligence report for BMO Financial Group, identifying $60M+ digital transformation opportunity across retail banking, wealth management, and capital markets...
                    </p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Snowplow Analytics</h3>
                        <Badge variant="outline">Score: 92/100</Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">Demo Report</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Report Type: <span className="font-medium">PE Tech Diligence</span></p>
                        <p>Industry: <span className="font-medium">Data Analytics</span></p>
                        <p>Tech Health Score: <span className="font-medium">92%</span></p>
                        <p>Created: <span className="font-medium">Demo Report</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/pe-diligence/snowplow">
                          <FileText className="mr-1 h-3 w-3" />
                          View Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      Technical due diligence assessment of Snowplow Analytics, evaluating architecture scalability, security posture, and engineering capabilities for private equity investment...
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">OneZero Financial Systems</h3>
                        <Badge variant="outline">Score: 72/100</Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">Demo Report</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Report Type: <span className="font-medium">PE Tech Diligence</span></p>
                        <p>Industry: <span className="font-medium">Financial Services</span></p>
                        <p>Tech Health Score: <span className="font-medium">72%</span></p>
                        <p>Created: <span className="font-medium">Demo Report</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/pe-diligence/onezero">
                          <FileText className="mr-1 h-3 w-3" />
                          View Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      Mature financial services platform with solid fundamentals but technical debt. Processing $450M+ daily with 99.95% reliability. Modernization required for growth...
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Fidelity Investments Canada</h3>
                        <Badge variant="outline">Score: 88/100</Badge>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">Demo Report</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Report Type: <span className="font-medium">Sales Intelligence</span></p>
                        <p>Industry: <span className="font-medium">Financial Services</span></p>
                        <p>Opportunity Score: <span className="font-medium">8.8/10</span></p>
                        <p>Created: <span className="font-medium">Demo Report</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin/sales-intelligence/fidelity">
                          <FileText className="mr-1 h-3 w-3" />
                          View Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      Comprehensive digital ecosystem audit identifying $1.2M+ opportunity for performance optimization, AODA compliance, and personalization across Fidelity Canada's multi-property digital presence...
                    </p>
                  </div>
                </div>
                
                {/* Real Reports */}
                {realReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{report.company_name}</h3>
                          <Badge variant="outline">
                            Score: {report.investment_score || 'N/A'}/100
                          </Badge>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {report.ai_model_used || 'AI Generated'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Report ID: <span className="font-mono text-xs">{report.id}</span></p>
                          <p>Evidence Count: <span className="font-medium">{report.evidence_count || 0}</span></p>
                          <p>Citation Count: <span className="font-medium">{report.citation_count || 0}</span></p>
                          <p>Quality Score: <span className="font-medium">{((report.quality_score || 0.85) * 100).toFixed(0)}%</span></p>
                          <p>Created: <span className="font-medium">{formatDate(report.created_at)}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/reports/${report.id}`}>
                            <FileText className="mr-1 h-3 w-3" />
                            View Report
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {report.executive_summary && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {report.executive_summary.substring(0, 200)}...
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {realReports.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports found</p>
                    <p className="text-sm text-gray-400">Run the AI workflow test to generate reports</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
} 