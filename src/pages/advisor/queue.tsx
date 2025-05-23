import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

// Mock scan queue data
const scanQueueData = [
  {
    id: 'scan-2',
    company: 'DevSecOps Solutions',
    status: 'awaiting_review',
    date: '2023-04-05T09:15:22Z',
    user: 'John Investor',
    organization: 'Acme Capital',
    aiConfidence: 87,
  },
  {
    id: 'scan-6',
    company: 'FinTech Express',
    status: 'awaiting_review',
    date: '2023-04-02T14:30:10Z',
    user: 'Sarah Wilson',
    organization: 'Wilson Ventures',
    aiConfidence: 92,
  },
  {
    id: 'scan-7',
    company: 'DataViz Pro',
    status: 'awaiting_review',
    date: '2023-04-01T10:45:33Z',
    user: 'Michael Chen',
    organization: 'East Valley Partners',
    aiConfidence: 79,
  },
  {
    id: 'scan-3',
    company: 'Fast Deploy Systems',
    status: 'processing',
    date: '2023-04-03T16:45:11Z',
    user: 'John Investor',
    organization: 'Acme Capital',
    aiConfidence: null,
  },
  {
    id: 'scan-8',
    company: 'Cloud Security Labs',
    status: 'processing',
    date: '2023-03-30T09:12:45Z',
    user: 'Lisa Johnson',
    organization: 'Johnson Family Office',
    aiConfidence: null,
  },
  {
    id: 'scan-1',
    company: 'Acme Cloud Technologies',
    status: 'complete',
    date: '2023-04-10T14:23:53Z',
    user: 'John Investor',
    organization: 'Acme Capital',
    aiConfidence: 94,
    reviewedBy: 'Admin User',
    reviewDate: '2023-04-10T16:30:00Z',
  },
]

export default function AdvisorQueuePage() {
  const [activeTab, setActiveTab] = useState('awaiting_review')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter scans based on active tab and search query
  const filteredScans = scanQueueData.filter(scan => {
    const matchesTab = activeTab === 'all' || scan.status === activeTab
    const matchesSearch = searchQuery === '' || 
      scan.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.organization.toLowerCase().includes(searchQuery.toLowerCase())
    
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
        defaultValue="awaiting_review" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-slate-100 dark:bg-slate-800/50">
          <TabsTrigger value="awaiting_review">Awaiting Review</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="complete">Completed</TabsTrigger>
          <TabsTrigger value="all">All Scans</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>
                {activeTab === 'awaiting_review' && 'Scans Awaiting Review'}
                {activeTab === 'processing' && 'Scans In Processing'}
                {activeTab === 'complete' && 'Completed Scans'}
                {activeTab === 'all' && 'All Scans'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'awaiting_review' && 'AI analysis complete - ready for advisor review'}
                {activeTab === 'processing' && 'AI analysis in progress - not yet ready for review'}
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
                    {filteredScans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center">
                          <p className="text-muted-foreground">No scans found matching your criteria</p>
                        </td>
                      </tr>
                    ) : (
                      filteredScans.map((scan) => (
                        <tr key={scan.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="font-medium">{scan.company}</div>
                            <div className="text-xs text-muted-foreground">{scan.organization}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{scan.user}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{formatDate(scan.date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <ScanStatusBadge status={scan.status} />
                          </td>
                          <td className="px-4 py-3">
                            {scan.aiConfidence !== null ? (
                              <div className="flex items-center">
                                <div className="h-2 w-full max-w-24 overflow-hidden rounded-full bg-muted">
                                  <div 
                                    className={`h-full ${
                                      scan.aiConfidence >= 90 ? 'bg-signal-green' :
                                      scan.aiConfidence >= 75 ? 'bg-electric-teal' :
                                      scan.aiConfidence >= 60 ? 'bg-caution-amber' : 'bg-risk-red'
                                    }`}
                                    style={{ width: `${scan.aiConfidence}%` }}
                                  />
                                </div>
                                <span className="ml-2 text-xs font-medium">{scan.aiConfidence}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {scan.status === 'awaiting_review' ? (
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