import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Play, Pause, RotateCcw, SkipForward, XCircle, 
  AlertTriangle, CheckCircle2, Clock, Activity,
  Settings, Eye, RefreshCw, Download
} from 'lucide-react'
import { format } from 'date-fns'

interface PipelineExecution {
  id: string
  scan_request_id: string
  status: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  current_stage?: string
  total_stages: number
  completed_stages: number
  failed_stages: number
  total_evidence_collected: number
  error_count: number
  scan_request?: {
    company_name: string
    company_domain: string
  }
}

interface PipelineStage {
  id: string
  stage_name: string
  status: string
  started_at?: string
  completed_at?: string
  duration_ms?: number
  evidence_collected: number
  error_message?: string
  attempt_number: number
}

interface PipelineLog {
  id: string
  timestamp: string
  level: string
  stage?: string
  message: string
  data?: any
}

interface PipelineAlert {
  id: string
  alert_type: string
  severity: string
  title: string
  message: string
  status: string
  created_at: string
}

export default function PipelineMonitor() {
  const navigate = useNavigate()
  const [activeExecutions, setActiveExecutions] = useState<PipelineExecution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<PipelineExecution | null>(null)
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [logs, setLogs] = useState<PipelineLog[]>([])
  const [alerts, setAlerts] = useState<PipelineAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Real-time subscriptions
  useEffect(() => {
    fetchActiveExecutions()
    fetchAlerts()

    // Subscribe to real-time updates
    const executionSubscription = supabase
      .channel('pipeline-executions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_executions'
      }, handleExecutionChange)
      .subscribe()

    const stageSubscription = supabase
      .channel('pipeline-stages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipeline_stages'
      }, handleStageChange)
      .subscribe()

    const alertSubscription = supabase
      .channel('pipeline-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pipeline_alerts'
      }, handleNewAlert)
      .subscribe()

    // Auto-refresh interval
    const interval = autoRefresh ? setInterval(() => {
      fetchActiveExecutions()
      if (selectedExecution) {
        fetchExecutionDetails(selectedExecution.id)
      }
    }, 5000) : null

    return () => {
      supabase.removeChannel(executionSubscription)
      supabase.removeChannel(stageSubscription)
      supabase.removeChannel(alertSubscription)
      if (interval) clearInterval(interval)
    }
  }, [selectedExecution, autoRefresh])

  const fetchActiveExecutions = async () => {
    const { data, error } = await supabase
      .from('pipeline_executions')
      .select(`
        *,
        scan_request:scan_requests(company_name, company_domain)
      `)
      .in('status', ['initializing', 'running', 'paused'])
      .order('started_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setActiveExecutions(data)
    }
    setIsLoading(false)
  }

  const fetchExecutionDetails = async (executionId: string) => {
    // Fetch stages
    const { data: stagesData } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('execution_id', executionId)
      .order('stage_order', { ascending: true })

    if (stagesData) setStages(stagesData)

    // Fetch recent logs
    const { data: logsData } = await supabase
      .from('pipeline_logs')
      .select('*')
      .eq('execution_id', executionId)
      .order('timestamp', { ascending: false })
      .limit(100)

    if (logsData) setLogs(logsData)
  }

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('pipeline_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setAlerts(data)
  }

  const handleExecutionChange = (payload: any) => {
    if (payload.new) {
      setActiveExecutions(prev => {
        const index = prev.findIndex(e => e.id === payload.new.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = { ...updated[index], ...payload.new }
          return updated
        }
        return [payload.new, ...prev]
      })
    }
  }

  const handleStageChange = (payload: any) => {
    if (payload.new && selectedExecution && payload.new.execution_id === selectedExecution.id) {
      setStages(prev => {
        const index = prev.findIndex(s => s.id === payload.new.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = payload.new
          return updated
        }
        return [...prev, payload.new]
      })
    }
  }

  const handleNewAlert = (payload: any) => {
    if (payload.new) {
      setAlerts(prev => [payload.new, ...prev])
    }
  }

  const handleIntervention = async (executionId: string, type: string, stage?: string) => {
    const reason = prompt(`Reason for ${type}:`)
    if (!reason) return

    const { error } = await supabase
      .from('pipeline_interventions')
      .insert({
        execution_id: executionId,
        intervention_type: type,
        target_stage: stage,
        reason,
        performed_by: (await supabase.auth.getUser()).data.user?.id
      })

    if (!error) {
      // Call edge function to apply intervention
      await supabase.functions.invoke('pipeline-control', {
        body: { execution_id: executionId, action: type, stage }
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500'
      case 'success': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'paused': return 'bg-yellow-500'
      case 'partial': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600'
      case 'warn': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      case 'debug': return 'text-gray-600'
      default: return 'text-gray-500'
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Monitor</h1>
          <p className="text-muted-foreground">Real-time pipeline execution monitoring and control</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/pipeline-config')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Active Alerts</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex justify-between items-center">
                  <span>{alert.title}</span>
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
              {alerts.length > 3 && (
                <Button variant="link" size="sm" className="p-0">
                  View all {alerts.length} alerts →
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Executions List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Active Pipelines</CardTitle>
            <CardDescription>{activeExecutions.length} running</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {activeExecutions.map(execution => (
                  <Card
                    key={execution.id}
                    className={`cursor-pointer transition-colors ${
                      selectedExecution?.id === execution.id ? 'border-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedExecution(execution)
                      fetchExecutionDetails(execution.id)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">
                          {execution.scan_request?.company_name}
                        </div>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{execution.scan_request?.company_domain}</div>
                        <div>Stage: {execution.current_stage || 'Initializing'}</div>
                        <Progress 
                          value={(execution.completed_stages / execution.total_stages) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs">
                          <span>{execution.completed_stages}/{execution.total_stages} stages</span>
                          <span>{execution.total_evidence_collected} evidence</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Execution Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {selectedExecution 
                  ? `${selectedExecution.scan_request?.company_name} Pipeline`
                  : 'Select a Pipeline'
                }
              </CardTitle>
              {selectedExecution && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIntervention(selectedExecution.id, 'pause')}
                    disabled={selectedExecution.status !== 'running'}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIntervention(selectedExecution.id, 'resume')}
                    disabled={selectedExecution.status !== 'paused'}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleIntervention(selectedExecution.id, 'cancel')}
                    disabled={['completed', 'failed', 'cancelled'].includes(selectedExecution.status)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedExecution ? (
              <Tabs defaultValue="stages">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="stages">Stages</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="stages" className="space-y-3">
                  {stages.map(stage => (
                    <Card key={stage.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{stage.stage_name}</div>
                            {stage.error_message && (
                              <div className="text-sm text-red-600 mt-1">
                                {stage.error_message}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(stage.status)}>
                              {stage.status}
                            </Badge>
                            {stage.attempt_number > 1 && (
                              <Badge variant="outline">
                                Attempt {stage.attempt_number}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="space-x-4">
                            <span>{stage.evidence_collected} evidence</span>
                            {stage.duration_ms && (
                              <span>{(stage.duration_ms / 1000).toFixed(1)}s</span>
                            )}
                          </div>
                          {stage.status === 'failed' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleIntervention(
                                  selectedExecution.id, 
                                  'retry_stage', 
                                  stage.stage_name
                                )}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleIntervention(
                                  selectedExecution.id, 
                                  'skip_stage', 
                                  stage.stage_name
                                )}
                              >
                                <SkipForward className="h-3 w-3 mr-1" />
                                Skip
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="logs">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1">
                      {logs.map(log => (
                        <div 
                          key={log.id} 
                          className="flex gap-2 text-sm font-mono p-1 hover:bg-muted rounded"
                        >
                          <span className="text-muted-foreground">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </span>
                          <span className={getLogLevelColor(log.level)}>
                            [{log.level.toUpperCase()}]
                          </span>
                          {log.stage && (
                            <span className="text-muted-foreground">
                              [{log.stage}]
                            </span>
                          )}
                          <span className="flex-1">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedExecution.duration_ms 
                            ? `${(selectedExecution.duration_ms / 1000).toFixed(1)}s`
                            : 'Running...'
                          }
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Evidence Collected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedExecution.total_evidence_collected}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Error Count</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                          {selectedExecution.error_count}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedExecution.total_stages > 0
                            ? `${Math.round((selectedExecution.completed_stages / selectedExecution.total_stages) * 100)}%`
                            : '0%'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Evidence by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(selectedExecution.evidence_by_type || {}).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span className="text-sm">{type}</span>
                            <span className="text-sm font-medium">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                Select a pipeline to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}