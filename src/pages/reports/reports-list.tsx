import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, Calendar, Building2, BarChart3, Eye, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth/auth-provider'
import { supabase } from '@/lib/supabaseClient'
import { formatDate } from '@/lib/utils'

interface ScanRequest {
  id: string
  company_name: string
  website_url: string
  status: string
  created_at: string
  requestor_name: string
  organization_name: string
  reports: {
    id: string;
    executive_summary?: string | null;
    investment_score?: number | null;
    tech_health_score: number | null
    tech_health_grade: string | null
    ai_confidence?: number | null;
  }[] | null;
  ai_confidence: number | null
  tech_health_score: number | null
  tech_health_grade: string | null
  sections: any[]
  risks: any[]
  published_at: string | null
  report_id?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500'
    case 'in-progress': return 'bg-blue-500'
    case 'pending': return 'bg-yellow-500'
    case 'failed': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getHealthScoreColor = (score: number | null) => {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export default function ReportsListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scanRequests, setScanRequests] = useState<ScanRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role
  const isPE = userRole === 'pe'
  const isAdmin = userRole === 'admin'
  
  // Fetch scan requests
  useEffect(() => {
    async function fetchScanRequests() {
      console.log('Fetching scan requests...', { user, userRole, isAdmin })
      try {
        let query = supabase
          .from('scan_requests')
          .select('*, reports!reports_scan_request_id_fkey (*)')
        
        // Filter based on user role
        if (!isAdmin) {
          // Regular users only see their own requests
          console.log('Filtering by user ID:', user?.id)
          query = query.eq('requested_by', user?.id)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false })
        
        if (error) throw error
        
        console.log('Fetched scan requests:', data)
        setScanRequests(data || [])
      } catch (error) {
        console.error('Error fetching scan requests:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchScanRequests()
  }, [user, isAdmin])

  const filteredReports = scanRequests.filter(scan => {
    const matchesSearch = scan.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || scan.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-medium tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            {isPE 
              ? 'Technical due diligence reports for your portfolio companies'
              : 'Your technical scan reports and analysis results'
            }
          </p>
        </div>
        <Button asChild>
          <Link to="/scans/request">
            <FileText className="mr-2 h-4 w-4" />
            Request New Scan
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Filter Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports by company or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="awaiting_review">Awaiting Review</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {/* Demo Reports - Always visible */}
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-heading">BMO Financial Group - Sales Intelligence Report</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  TechScanIQ Demo
                  <span className="text-muted-foreground">•</span>
                  <Calendar className="h-4 w-4" />
                  Demo Report
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500">Demo</Badge>
                <Badge className="bg-green-500">Completed</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Comprehensive sales intelligence report identifying $60M+ digital transformation opportunity
              </p>
              
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">9.5</div>
                  <p className="text-xs text-muted-foreground">Opportunity Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">A+</div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Industry: Financial Services
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/sales-intelligence/bmo">
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fidelity Sales Intelligence Report */}
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-heading">Fidelity Canada - Sales Intelligence Report</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  TechScanIQ Demo
                  <span className="text-muted-foreground">•</span>
                  <Calendar className="h-4 w-4" />
                  Demo Report
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500">Demo</Badge>
                <Badge className="bg-green-500">Completed</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Comprehensive digital ecosystem audit identifying $11.5M opportunity for performance optimization and personalization
              </p>
              
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">8.5</div>
                  <p className="text-xs text-muted-foreground">Opportunity Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">A</div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Industry: Financial Services
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/sales-intelligence/fidelity">
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-heading">Snowplow Analytics - PE Tech Diligence Report</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  TechScanIQ Demo
                  <span className="text-muted-foreground">•</span>
                  <Calendar className="h-4 w-4" />
                  Demo Report
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500">Demo</Badge>
                <Badge className="bg-green-500">Completed</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Technical due diligence assessment covering architecture, security, and scalability
              </p>
              
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">92</div>
                  <p className="text-xs text-muted-foreground">Health Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">A</div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <p className="text-xs text-muted-foreground">AI Confidence</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Industry: Data Analytics
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/pe-diligence/snowplow">
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OneZero PE Tech Diligence Report */}
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-heading">OneZero Financial Systems - PE Tech Diligence Report</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  TechScanIQ Demo
                  <span className="text-muted-foreground">•</span>
                  <Calendar className="h-4 w-4" />
                  Demo Report
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500">Demo</Badge>
                <Badge className="bg-green-500">Completed</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Private equity due diligence assessment for mature financial services platform
              </p>
              
              <div className="grid grid-cols-3 gap-4 rounded-lg border p-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">72</div>
                  <p className="text-xs text-muted-foreground">Health Score</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">B+</div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">65%</div>
                  <p className="text-xs text-muted-foreground">Investment Score</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Industry: Financial Services
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin/pe-diligence/onezero">
                      <Eye className="mr-2 h-4 w-4" />
                      View Report
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* User Reports */}
        {loading ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Loading reports...</p>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No reports found matching your criteria
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((scan) => (
            <Card key={scan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-heading">{scan.company_name} - Technical Due Diligence</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {scan.organization_name}
                      <span className="text-muted-foreground">•</span>
                      <Calendar className="h-4 w-4" />
                      {formatDate(scan.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(scan.status)}>
                      {scan.status === 'complete' ? 'Completed' : 
                       scan.status === 'in_review' ? 'In Review' :
                       scan.status === 'awaiting_review' ? 'Awaiting Review' :
                       scan.status === 'processing' ? 'Processing' :
                       scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Technical assessment covering architecture, security, and scalability
                  </p>
                  
                  {scan.status === 'completed' && scan.reports && scan.reports.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 rounded-lg border p-3">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getHealthScoreColor(scan.reports[0].tech_health_score)}`}>
                          {scan.reports[0].tech_health_score ?? 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{scan.reports[0].tech_health_grade ?? '-'}</div>
                        <p className="text-xs text-muted-foreground">Grade</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${scan.reports[0].ai_confidence && scan.reports[0].ai_confidence > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {scan.reports[0].ai_confidence ?? '-' }%
                        </div>
                        <p className="text-xs text-muted-foreground">AI Confidence</p>
                      </div>
                    </div>
                  ) : scan.status === 'completed' ? (
                     <div className="rounded-lg border p-3 text-center">
                       <div className="text-sm text-muted-foreground">
                         Report complete, but detailed scores are pending or not linked.
                       </div>
                     </div>
                  ) : null}

                  {(scan.status === 'processing' || scan.status === 'awaiting_review' || scan.status === 'in_review') && (
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-sm text-muted-foreground">
                        {scan.status === 'processing' ? 'Scan in progress... Results will be available soon.' :
                         scan.status === 'awaiting_review' ? 'Analysis complete. Waiting for advisor review.' :
                         'Currently under review by technical advisor.'}
                      </div>
                    </div>
                  )}

                  {scan.status === 'pending' && (
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-sm text-muted-foreground">
                        Scan request submitted. Processing will begin shortly.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Requested by: {scan.requestor_name}
                    </div>
                    <div className="flex gap-2">
                      {scan.status === 'completed' && scan.reports && scan.reports.length > 0 ? (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/scans/${scan.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Report
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </>
                      ) : scan.status === 'completed' ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/scans/${scan.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View (Details Pending)
                          </Link>
                        </Button>
                      ) : null}
                      {(scan.status === 'processing' || scan.status === 'awaiting_review' || scan.status === 'in_review') && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/scans/${scan.id}`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Status
                          </Link>
                        </Button>
                      )}
                      {scan.status === 'pending' && (
                        <Button variant="outline" size="sm" disabled>
                          <Calendar className="mr-2 h-4 w-4" />
                          Queued
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 