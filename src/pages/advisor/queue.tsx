import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Filter, Search, MoreHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'

interface ScanRequest {
  id: string
  company_name: string
  website_url: string
  status: string
  created_at: string
  requestor_name: string
  organization_name: string
  ai_confidence: number | null
  reviewed_by?: string
  review_completed_at?: string
}

export default function AdvisorQueuePage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [scanRequests, setScanRequests] = useState<ScanRequest[]>([])
  const [loading, setLoading] = useState(true)
  
  // Update scan status
  const updateScanStatus = async (scanId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('scan_requests')
        .update({ status: newStatus })
        .eq('id', scanId)
      
      if (error) throw error
      
      // Update local state
      setScanRequests(prev => 
        prev.map(scan => 
          scan.id === scanId ? { ...scan, status: newStatus } : scan
        )
      )
    } catch (error) {
      console.error('Error updating scan status:', error)
    }
  }
  
  // Fetch scan requests from database
  useEffect(() => {
    async function fetchScanRequests() {
      try {
        const { data, error } = await supabase
          .from('scan_requests')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setScanRequests(data || [])
      } catch (error) {
        console.error('Error fetching scan requests:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchScanRequests()
    
    // Set up realtime subscription
    const subscription = supabase
      .channel('scan_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scan_requests' }, () => {
        fetchScanRequests()
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // Filter scans based on active tab and search query
  const filteredScans = scanRequests.filter(scan => {
    const matchesTab = activeTab === 'all' || scan.status === activeTab
    const matchesSearch = searchQuery === '' || 
      scan.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.requestor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.organization_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesTab && matchesSearch
  })
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advisor Review Queue</h1>
          <p className="text-muted-foreground">
            Manage and review technical due diligence scans
          </p>
        </div>
      </div>
      
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, user, or organization..."
            className="w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Select defaultValue="date_desc">
            <SelectTrigger className="w-[180px] flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest First</SelectItem>
              <SelectItem value="date_asc">Oldest First</SelectItem>
              <SelectItem value="company_asc">Company (A-Z)</SelectItem>
              <SelectItem value="company_desc">Company (Z-A)</SelectItem>
              <SelectItem value="confidence_desc">Highest Confidence</SelectItem>
              <SelectItem value="confidence_asc">Lowest Confidence</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs 
        defaultValue="pending" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-slate-100 dark:bg-slate-800/50">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="awaiting_review">Awaiting Review</TabsTrigger>
          <TabsTrigger value="complete">Completed</TabsTrigger>
          <TabsTrigger value="all">All Scans</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
                          <CardTitle>
              {activeTab === 'pending' && 'Pending Scan Requests'}
              {activeTab === 'processing' && 'Scans In Processing'}
              {activeTab === 'awaiting_review' && 'Scans Awaiting Review'}
              {activeTab === 'complete' && 'Completed Scans'}
              {activeTab === 'all' && 'All Scans'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'pending' && 'New scan requests ready for report generation'}
              {activeTab === 'processing' && 'Reports currently being generated'}
              {activeTab === 'awaiting_review' && 'AI analysis complete - ready for advisor review'}
              {activeTab === 'complete' && 'Scans that have been reviewed and published'}
              {activeTab === 'all' && 'All scan requests across all statuses'}
            </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Company
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Requested By
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        AI Confidence
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <p className="text-muted-foreground">Loading scan requests...</p>
                        </td>
                      </tr>
                    ) : filteredScans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <p className="text-muted-foreground">No scans found matching your criteria</p>
                        </td>
                      </tr>
                    ) : (
                      filteredScans.map((scan) => (
                        <tr key={scan.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="font-medium">{scan.company_name}</div>
                            <div className="text-xs text-muted-foreground">{scan.organization_name}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{scan.requestor_name}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{formatDate(scan.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ScanStatusBadge status={scan.status} />
                          </td>
                          <td className="px-4 py-3">
                            {scan.ai_confidence !== null ? (
                              <div className="flex items-center">
                                <div className="h-2 w-full max-w-24 overflow-hidden rounded-full bg-muted">
                                  <div 
                                    className={`h-full ${
                                      scan.ai_confidence >= 90 ? 'bg-signal-green' :
                                      scan.ai_confidence >= 75 ? 'bg-electric-teal' :
                                      scan.ai_confidence >= 60 ? 'bg-caution-amber' : 'bg-risk-red'
                                    }`}
                                    style={{ width: `${scan.ai_confidence}%` }}
                                  />
                                </div>
                                <span className="ml-2 text-xs font-medium">{scan.ai_confidence}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {scan.status === 'pending' ? (
                                <Button size="sm" className="bg-electric-teal hover:bg-electric-teal/90" asChild>
                                  <Link to={`/reports/generate?scanId=${scan.id}&company=${encodeURIComponent(scan.company_name)}&website=${encodeURIComponent(scan.website_url)}&requestor=${encodeURIComponent(scan.requestor_name)}&organization=${encodeURIComponent(scan.organization_name)}`}>
                                    Generate Report
                                  </Link>
                                </Button>
                              ) : scan.status === 'awaiting_review' ? (
                                <Button size="sm" className="bg-electric-teal hover:bg-electric-teal/90" asChild>
                                  <Link to={`/advisor/review/${scan.id}`}>
                                    Review Now
                                  </Link>
                                </Button>
                              ) : scan.status === 'complete' ? (
                                <Button variant="outline" size="sm" asChild>
                                  <Link to={`/reports/${scan.id}`}>
                                    View Report
                                  </Link>
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" disabled>
                                  Processing
                                </Button>
                              )}
                              
                              {/* Status management dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => updateScanStatus(scan.id, 'pending')}>
                                    Set to Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateScanStatus(scan.id, 'processing')}>
                                    Set to Processing
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateScanStatus(scan.id, 'awaiting_review')}>
                                    Set to Awaiting Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateScanStatus(scan.id, 'complete')}>
                                    Set to Complete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ScanStatusBadgeProps {
  status: string
}

function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="outline" className="gap-1 text-blue-500">
          <Clock className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      )
    case 'awaiting_review':
      return (
        <Badge variant="outline" className="gap-1 text-electric-teal">
          <Clock className="h-3 w-3" />
          Awaiting Review
        </Badge>
      )
    case 'complete':
      return (
        <Badge variant="outline" className="gap-1 text-green-500">
          <Clock className="h-3 w-3" />
          Complete
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="outline" className="gap-1 text-red-500">
          <Clock className="h-3 w-3" />
          Error
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}