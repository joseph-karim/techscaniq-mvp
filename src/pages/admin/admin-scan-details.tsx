import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Building2, 
  Calendar, 
  Clock, 
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  User,
  Globe,
  Briefcase,
  ShoppingCart
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface ScanDetails {
  id: string
  company_name: string
  website_url?: string
  company_description?: string
  report_type: 'pe-due-diligence' | 'sales-intelligence'
  industry?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestor_id: string
  requestor_email: string
  created_at: string
  updated_at: string
  metadata: {
    admin_initiated: boolean
    initiated_by: string
    initiated_at: string
    investment_thesis?: {
      company: string
      description: string
      pePartner?: string
      investmentAmount?: number
      targetHoldPeriod?: number
    }
    sales_context?: {
      company: string
      offering: string
      idealCustomerProfile: {
        industry?: string
        companySize?: string
        geography?: string
        techStack?: string[]
        painPoints?: string[]
      }
      useCases: string[]
      budgetRange?: {
        min: number
        max: number
        currency: string
      }
      decisionCriteria?: string[]
      competitiveAlternatives?: string[]
      evaluationTimeline?: string
    }
    job_ids?: {
      evidence_collection?: string
      report_generation?: string
    }
    error?: string
  }
}

interface JobStatus {
  id: string
  name: string
  status: string
  progress: number
  completedAt?: string
  failedAt?: string
  error?: string
}

export default function AdminScanDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [scan, setScan] = useState<ScanDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobStatuses, setJobStatuses] = useState<JobStatus[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchScanDetails = async () => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setScan(data)

      // Fetch job statuses if available
      if (data?.metadata?.job_ids) {
        fetchJobStatuses(data.metadata.job_ids)
      }
    } catch (error) {
      console.error('Error fetching scan details:', error)
      toast.error('Failed to fetch scan details')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobStatuses = async (_jobIds: { evidence_collection?: string; report_generation?: string }) => {
    try {
      const response = await fetch(`/api/scans/${id}/status`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setJobStatuses(data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching job statuses:', error)
    }
  }

  useEffect(() => {
    fetchScanDetails()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`scan_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scan_requests',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchScanDetails()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [id])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchScanDetails()
    setRefreshing(false)
  }

  const handleRetry = async () => {
    if (!scan) return

    try {
      const response = await fetch(`/api/scans/${scan.id}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to retry scan')

      toast.success('Scan retry initiated')
      fetchScanDetails()
    } catch (error) {
      console.error('Error retrying scan:', error)
      toast.error('Failed to retry scan')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline',
    }
    
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    
    return (
      <Badge variant="outline" className={colors[priority] || colors.medium}>
        {priority}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Scan not found</p>
            <Button onClick={() => navigate('/admin/scans')} className="mt-4">
              Back to Scans
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/scans')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                {scan.company_name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Admin Scan Details
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {scan.status === 'failed' && (
              <Button onClick={handleRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Scan
              </Button>
            )}
            {scan.status === 'completed' && (
              <Button
                onClick={() => navigate(`/reports?company=${scan.company_name}`)}
                size="sm"
              >
                View Report
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <div className="flex gap-2 mt-2">
                {getStatusBadge(scan.status)}
                {getPriorityBadge(scan.priority)}
                <Badge variant="outline">
                  {scan.report_type === 'pe-due-diligence' ? (
                    <>
                      <Briefcase className="h-3 w-3 mr-1" />
                      PE Due Diligence
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Sales Intelligence
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Description</p>
                    <p className="mt-1">{scan.company_description || 'Not provided'}</p>
                  </div>
                  {scan.website_url && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={scan.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Globe className="h-4 w-4" />
                        {scan.website_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {scan.industry && (
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="mt-1">{scan.industry}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Requested By</p>
                    <p className="mt-1 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {scan.metadata.initiated_by}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(scan.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="mt-1 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(scan.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Context Tabs */}
          <Tabs defaultValue="context" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {scan.report_type === 'pe-due-diligence' ? 'Investment Context' : 'Sales Context'}
                  </CardTitle>
                  <CardDescription>
                    The context provided for this {scan.report_type === 'pe-due-diligence' ? 'investment' : 'sales'} analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scan.report_type === 'pe-due-diligence' && scan.metadata.investment_thesis ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Investment Thesis</p>
                        <p className="mt-1 whitespace-pre-wrap">{scan.metadata.investment_thesis.description}</p>
                      </div>
                      {scan.metadata.investment_thesis.pePartner && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">PE Partner</p>
                          <p className="mt-1">{scan.metadata.investment_thesis.pePartner}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {scan.metadata.investment_thesis.investmentAmount && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Investment Amount</p>
                            <p className="mt-1">${scan.metadata.investment_thesis.investmentAmount}M</p>
                          </div>
                        )}
                        {scan.metadata.investment_thesis.targetHoldPeriod && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Target Hold Period</p>
                            <p className="mt-1">{scan.metadata.investment_thesis.targetHoldPeriod} years</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : scan.report_type === 'sales-intelligence' && scan.metadata.sales_context ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Product/Service Offering</p>
                        <p className="mt-1">{scan.metadata.sales_context.offering}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Use Cases</p>
                        <ul className="mt-1 list-disc list-inside">
                          {scan.metadata.sales_context.useCases.map((useCase, index) => (
                            <li key={index}>{useCase}</li>
                          ))}
                        </ul>
                      </div>
                      {scan.metadata.sales_context.idealCustomerProfile && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Ideal Customer Profile</p>
                          <div className="mt-2 space-y-2">
                            {scan.metadata.sales_context.idealCustomerProfile.industry && (
                              <p><span className="font-medium">Industry:</span> {scan.metadata.sales_context.idealCustomerProfile.industry}</p>
                            )}
                            {scan.metadata.sales_context.idealCustomerProfile.companySize && (
                              <p><span className="font-medium">Company Size:</span> {scan.metadata.sales_context.idealCustomerProfile.companySize}</p>
                            )}
                            {scan.metadata.sales_context.idealCustomerProfile.geography && (
                              <p><span className="font-medium">Geography:</span> {scan.metadata.sales_context.idealCustomerProfile.geography}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {scan.metadata.sales_context.budgetRange && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Budget Range</p>
                          <p className="mt-1">
                            ${scan.metadata.sales_context.budgetRange.min}K - ${scan.metadata.sales_context.budgetRange.max}K {scan.metadata.sales_context.budgetRange.currency}
                          </p>
                        </div>
                      )}
                      {scan.metadata.sales_context.evaluationTimeline && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Evaluation Timeline</p>
                          <p className="mt-1">{scan.metadata.sales_context.evaluationTimeline}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No context information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job Status</CardTitle>
                  <CardDescription>
                    Background job processing status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {jobStatuses.length > 0 ? (
                    <div className="space-y-4">
                      {jobStatuses.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{job.name}</p>
                              <p className="text-sm text-muted-foreground">ID: {job.id}</p>
                            </div>
                            {getStatusBadge(job.status)}
                          </div>
                          {job.progress > 0 && (
                            <div className="mt-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{job.progress}% complete</p>
                            </div>
                          )}
                          {job.error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-700">{job.error}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No job information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Metadata</CardTitle>
                  <CardDescription>
                    Complete metadata for debugging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(scan.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  )
}