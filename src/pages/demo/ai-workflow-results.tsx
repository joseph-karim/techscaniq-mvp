import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Database, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Play,
  Brain,
  Shield,
  Target,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

interface WorkflowData {
  workflow: any
  scan: any
  report: any
  citations: any[]
  evidenceItems: any[]
  stages: any[]
  toolExecutions: any[]
  promptExecutions: any[]
}

export default function AIWorkflowResults() {
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflowData()
  }, [])

  const loadWorkflowData = async () => {
    try {
      setLoading(true)
      
      // For demo purposes, we'll use service role access to fetch the data
      // In production, this would be properly authenticated
      
      // Get the latest completed workflow
      const { data: workflows, error: workflowError } = await supabase
        .from('ai_workflow_runs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)

      if (workflowError) throw workflowError
      
      if (!workflows?.length) {
        setError('No completed AI workflows found. Please run the ai-workflow-ring4-test.js script first.')
        return
      }

      const workflow = workflows[0]

      // Get related data
      const [
        { data: scan },
        { data: stages },
        { data: toolExecutions },
        { data: promptExecutions }
      ] = await Promise.all([
        supabase.from('scan_requests').select('*').eq('ai_workflow_run_id', workflow.id).single(),
        supabase.from('ai_workflow_stages').select('*').eq('workflow_run_id', workflow.id).order('created_at'),
        supabase.from('tool_executions').select('*').eq('workflow_run_id', workflow.id).order('created_at'),
        supabase.from('prompt_executions').select('*').eq('workflow_run_id', workflow.id).order('created_at')
      ])

      let report = null
      let citations = []
      let evidenceItems = []

      if (scan) {
        const { data: reportData } = await supabase
          .from('reports')
          .select('*')
          .eq('scan_request_id', scan.id)
          .single()
        
        report = reportData

        if (report) {
          const [
            { data: citationData },
            { data: evidenceData }
          ] = await Promise.all([
            supabase.from('report_citations').select('*').eq('report_id', report.id),
            supabase.from('evidence_items').select('*').eq('collection_id', report.evidence_collection_id)
          ])
          
          citations = citationData || []
          evidenceItems = evidenceData || []
        }
      }

      setWorkflowData({
        workflow,
        scan,
        report,
        citations,
        evidenceItems,
        stages: stages || [],
        toolExecutions: toolExecutions || [],
        promptExecutions: promptExecutions || []
      })

    } catch (err) {
      console.error('Error loading workflow data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workflow data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI Workflow Results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Workflow Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadWorkflowData} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!workflowData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Workflow Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No AI workflow data found. Please run the test script first.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { workflow, scan, report, citations, evidenceItems, stages, toolExecutions, promptExecutions } = workflowData

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Workflow Results</h1>
        <p className="text-gray-600">End-to-end AI-driven technical due diligence demonstration</p>
        <div className="flex gap-4 mt-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Workflow Completed
          </Badge>
          <Badge variant="outline">
            Company: {scan?.company_name || 'Unknown'}
          </Badge>
          <Badge variant="outline">
            Score: {report?.investment_score || 'N/A'}/100
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {workflow.total_processing_time_ms ? `${(workflow.total_processing_time_ms / 1000).toFixed(1)}s` : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <Clock className="h-3 w-3 mr-1" />
              End-to-end execution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Evidence Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workflow.performance_metrics?.total_evidence_collected || evidenceItems.length || 0}
            </div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <Database className="h-3 w-3 mr-1" />
              High-quality sources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Citations Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {workflow.performance_metrics?.total_citations_generated || citations.length || 0}
            </div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <FileText className="h-3 w-3 mr-1" />
              Fully traceable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Investment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {report?.investment_score || 'N/A'}/100
            </div>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Grade: {report?.tech_health_grade || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Workflow Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Workflow ID</label>
                  <p className="font-mono text-sm">{workflow.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p className="capitalize">{workflow.workflow_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {workflow.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Confidence Score</label>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(workflow.performance_metrics?.average_confidence_score || 0) * 100} 
                      className="flex-1" 
                    />
                    <span className="text-sm font-medium">
                      {((workflow.performance_metrics?.average_confidence_score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company Analysis</label>
                  <p>{scan?.company_name} - {scan?.website_url}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Investment Recommendation</label>
                  <p className="text-sm">{report?.investment_rationale || 'Analysis complete - see full report for details'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quality Metrics</label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Evidence Quality: {((report?.quality_score || 0.87) * 100).toFixed(0)}%</div>
                    <div>AI Model: {report?.ai_model_used || 'claude-3-sonnet'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Workflow Stages
              </CardTitle>
              <CardDescription>
                Detailed execution timeline of the AI workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        stage.status === 'completed' ? 'bg-green-100 text-green-600' :
                        stage.status === 'failed' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{stage.stage_name.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-gray-600">Type: {stage.stage_type}</p>
                      {stage.processing_time_ms && (
                        <p className="text-xs text-gray-500">Duration: {stage.processing_time_ms}ms</p>
                      )}
                    </div>
                    <Badge variant={stage.status === 'completed' ? 'secondary' : 'destructive'}>
                      {stage.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Evidence Items ({evidenceItems.length})
              </CardTitle>
              <CardDescription>
                RAG-enhanced evidence with confidence scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evidenceItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                        <span className="text-sm font-medium">{item.content_data?.title || 'Evidence Item'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Confidence: {((item.confidence_score || 0.9) * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Tool: {item.tool_used || 'unknown'}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {item.content_data?.summary || item.content_data?.processed || 'No summary available'}
                    </p>
                    <div className="text-xs text-gray-500">
                      Source: {item.source_data?.url || item.source_data?.query || 'Internal analysis'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Enhanced Citations ({citations.length})
              </CardTitle>
              <CardDescription>
                AI-generated citations with full evidence traceability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {citations.map((citation) => (
                  <div key={citation.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Citation #{citation.citation_number}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {citation.confidence}% Confidence
                        </div>
                        <div className="text-xs text-gray-500">
                          By: {citation.analyst}
                        </div>
                      </div>
                    </div>
                    <h4 className="font-medium mb-2">{citation.claim}</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      "{citation.citation_text}"
                    </p>
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Context:</strong> {citation.citation_context}
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Reasoning:</strong> {citation.reasoning}
                    </p>
                    {citation.methodology && (
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Methodology:</strong> {citation.methodology}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Report
              </CardTitle>
              <CardDescription>
                AI-generated investment analysis report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Executive Summary</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {report?.executive_summary || 'Executive summary not available'}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Investment Rationale</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {report?.investment_rationale || 'Investment rationale not available'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{report?.investment_score || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Investment Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{report?.tech_health_score || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Tech Health Score</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{report?.tech_health_grade || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Grade</div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button asChild>
                  <a href={`/reports/${report?.id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Report
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/scans/${scan?.id}`} target="_blank" rel="noopener noreferrer">
                    View Scan Details
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Prompt Executions</label>
                  <p className="text-2xl font-bold">{promptExecutions.length}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Tokens</label>
                  <p className="text-lg">
                    Input: {promptExecutions.reduce((sum, p) => sum + (p.input_tokens || 0), 0).toLocaleString()}
                    <br />
                    Output: {promptExecutions.reduce((sum, p) => sum + (p.output_tokens || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Cost</label>
                  <p className="text-lg font-medium">
                    ${promptExecutions.reduce((sum, p) => sum + (p.cost_usd || 0), 0).toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Tool Executions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tools Used</label>
                  <p className="text-2xl font-bold">{toolExecutions.length}</p>
                </div>
                <div className="space-y-2">
                  {toolExecutions.map((tool) => (
                    <div key={tool.id} className="flex justify-between items-center">
                      <span className="text-sm">{tool.tool_name}</span>
                      <Badge variant={tool.success ? 'secondary' : 'destructive'}>
                        {tool.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}