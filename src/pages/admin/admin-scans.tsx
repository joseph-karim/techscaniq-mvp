import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Search, 
  Plus, 
  Building2,
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface AdminScan {
  id: string
  company_name: string
  website_url?: string
  company_description?: string
  report_type: 'pe-due-diligence' | 'sales-intelligence'
  industry?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestor_email: string
  created_at: string
  updated_at: string
  metadata: {
    admin_initiated: boolean
    initiated_by: string
    initiated_at: string
    investment_thesis?: any
    sales_context?: any
    job_ids?: {
      evidence_collection?: string
      report_generation?: string
    }
  }
}

export default function AdminScans() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<AdminScan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchScans = async () => {
    try {
      const { data, error } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('metadata->>admin_initiated', 'true')
        .order('created_at', { ascending: false })

      if (error) throw error
      setScans(data || [])
    } catch (error) {
      console.error('Error fetching scans:', error)
      toast.error('Failed to fetch scan requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScans()

    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_scans')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scan_requests',
          filter: 'metadata->>admin_initiated=eq.true',
        },
        () => {
          fetchScans()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchScans()
    setRefreshing(false)
    toast.success('Scan list refreshed')
  }

  const handleRetry = async (scanId: string) => {
    try {
      const response = await fetch(`/api/scans/${scanId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to retry scan')

      toast.success('Scan retry initiated')
      fetchScans()
    } catch (error) {
      console.error('Error retrying scan:', error)
      toast.error('Failed to retry scan')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
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

  const filteredScans = scans.filter(scan =>
    scan.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.requestor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Scan Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage admin-initiated scan requests
            </p>
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
            <Button onClick={() => navigate('/admin/scans/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Scan
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, email, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredScans.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm ? 'No scans found matching your search' : 'No admin scans yet'}
                </p>
                <Button 
                  onClick={() => navigate('/admin/scans/new')}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Scan
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredScans.map((scan) => (
              <Card key={scan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {scan.company_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {scan.company_description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(scan.status)}
                      {getPriorityBadge(scan.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {scan.report_type === 'pe-due-diligence' ? 'PE Due Diligence' : 'Sales Intelligence'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Industry</p>
                      <p className="font-medium">{scan.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requested by</p>
                      <p className="font-medium">{scan.metadata.initiated_by}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {scan.website_url && (
                    <div className="mt-4">
                      <a
                        href={scan.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {scan.website_url}
                      </a>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/scans/${scan.id}`)}
                    >
                      View Details
                    </Button>
                    {scan.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/reports?company=${scan.company_name}`)}
                      >
                        View Report
                      </Button>
                    )}
                    {scan.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(scan.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
    </div>
  )
}