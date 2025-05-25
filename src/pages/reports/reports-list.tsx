import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, Calendar, Building2, BarChart3, Eye, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth/mock-auth-provider'

// Mock reports data
const mockReports = [
  {
    id: 'scan-1',
    title: 'TechFlow Solutions - Technical Due Diligence',
    company: 'TechFlow Solutions',
    type: 'Technical Scan',
    status: 'completed',
    date: '2024-01-15',
    healthScore: 85,
    findings: 12,
    criticalIssues: 2,
    description: 'Comprehensive technical assessment covering architecture, security, and scalability'
  },
  {
    id: 'scan-2',
    title: 'DataVault Inc - Security Assessment',
    company: 'DataVault Inc',
    type: 'Security Scan',
    status: 'completed',
    date: '2024-01-10',
    healthScore: 72,
    findings: 18,
    criticalIssues: 5,
    description: 'Focused security evaluation with emphasis on data protection and compliance'
  },
  {
    id: 'scan-3',
    title: 'SecureNet Systems - Architecture Review',
    company: 'SecureNet Systems',
    type: 'Architecture Scan',
    status: 'completed',
    date: '2024-01-08',
    healthScore: 91,
    findings: 8,
    criticalIssues: 1,
    description: 'Deep dive into system architecture and scalability patterns'
  },
  {
    id: 'scan-4',
    title: 'CloudFirst Analytics - Infrastructure Audit',
    company: 'CloudFirst Analytics',
    type: 'Infrastructure Scan',
    status: 'in-progress',
    date: '2024-01-20',
    healthScore: null,
    findings: null,
    criticalIssues: null,
    description: 'Cloud infrastructure assessment and optimization recommendations'
  },
  {
    id: 'scan-5',
    title: 'DevOps Pro - CI/CD Pipeline Review',
    company: 'DevOps Pro',
    type: 'DevOps Scan',
    status: 'pending',
    date: '2024-01-22',
    healthScore: null,
    findings: null,
    criticalIssues: null,
    description: 'Evaluation of development operations and deployment processes'
  }
]

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
  const [typeFilter, setTypeFilter] = useState('all')
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role
  const isPE = userRole === 'pe'

  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
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
          <CardTitle className="text-lg">Filter Reports</CardTitle>
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Technical Scan">Technical</SelectItem>
                  <SelectItem value="Security Scan">Security</SelectItem>
                  <SelectItem value="Architecture Scan">Architecture</SelectItem>
                  <SelectItem value="Infrastructure Scan">Infrastructure</SelectItem>
                  <SelectItem value="DevOps Scan">DevOps</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {filteredReports.length === 0 ? (
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
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {report.company}
                      <span className="text-muted-foreground">•</span>
                      <Calendar className="h-4 w-4" />
                      {new Date(report.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(report.status)}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Badge>
                    <Badge variant="outline">{report.type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  
                  {report.status === 'completed' && (
                    <div className="grid grid-cols-3 gap-4 rounded-lg border p-3">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getHealthScoreColor(report.healthScore)}`}>
                          {report.healthScore}%
                        </div>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{report.findings}</div>
                        <p className="text-xs text-muted-foreground">Total Findings</p>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${report.criticalIssues && report.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {report.criticalIssues}
                        </div>
                        <p className="text-xs text-muted-foreground">Critical Issues</p>
                      </div>
                    </div>
                  )}

                  {report.status === 'in-progress' && (
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-sm text-muted-foreground">
                        Scan in progress... Results will be available soon.
                      </div>
                    </div>
                  )}

                  {report.status === 'pending' && (
                    <div className="rounded-lg border p-3 text-center">
                      <div className="text-sm text-muted-foreground">
                        Scan request submitted. Processing will begin shortly.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Report ID: {report.id}
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'completed' && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/reports/${report.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Report
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </>
                      )}
                      {report.status === 'in-progress' && (
                        <Button variant="outline" size="sm" disabled>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Processing...
                        </Button>
                      )}
                      {report.status === 'pending' && (
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