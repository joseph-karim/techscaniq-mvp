import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Award, FileText, Building2, TrendingUp, Calendar, ChevronRight } from 'lucide-react'
import { DemoReportList } from './DemoReportList'
import { useAuth } from '@/hooks/useAuth'
// import { reportService } from '@/services/optimized-report-service'

interface Report {
  id: string
  company_name: string
  report_type: string
  title?: string
  created_at: string
  status: string
  metadata?: any
}

interface RegularReportListProps {
  reports: Report[]
  loading?: boolean
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const getReportIcon = (reportType: string): React.ReactNode => {
  switch (reportType) {
    case 'sales-intelligence':
      return <TrendingUp className="h-4 w-4" />
    case 'pe-due-diligence':
      return <Building2 className="h-4 w-4" />
    case 'investment-analysis':
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'processing':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function RegularReportList({ reports, loading = false }: RegularReportListProps) {
  const handleViewReport = (reportId: string) => {
    window.location.href = `/reports/${reportId}`
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No reports yet</h3>
          <p className="text-muted-foreground">
            Your reports will appear here once they're generated.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map(report => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-muted rounded-lg">
                  {getReportIcon(report.report_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {report.title || `${report.company_name} ${report.report_type.replace(/-/g, ' ')}`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewReport(report.id)}
                disabled={report.status !== 'completed'}
              >
                View
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function UnifiedReportList() {
  const [reports, setReports] = useState<Report[]>([])
  const [showDemoReports, setShowDemoReports] = useState(false)
  const [loading, setLoading] = useState(true)
  const { role } = useAuth()

  const isAdmin = role === 'admin'

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with demo toggle for admins */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reports</h2>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Label htmlFor="show-demos" className="text-sm font-normal">
              Show Demo Reports
            </Label>
            <Switch
              id="show-demos"
              checked={showDemoReports}
              onCheckedChange={setShowDemoReports}
            />
          </div>
        )}
      </div>

      {/* Demo reports section */}
      {isAdmin && showDemoReports && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            Demo Reports
          </h3>
          <DemoReportList
            showDemoReports={showDemoReports}
            userRole={role as 'admin' | 'user' | 'advisor'}
          />
        </div>
      )}

      {/* Regular reports */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          {showDemoReports ? 'Production Reports' : 'All Reports'}
        </h3>
        <RegularReportList reports={reports} loading={loading} />
      </div>
    </div>
  )
}