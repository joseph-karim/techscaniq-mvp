import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Award, FileText, TrendingUp, Building2 } from 'lucide-react'

interface DemoReportListProps {
  showDemoReports: boolean
  userRole: 'admin' | 'user' | 'advisor'
}

interface DemoReport {
  id: string
  company_name: string
  report_type: 'sales-intelligence' | 'pe-due-diligence' | 'investment-analysis'
  title: string
  created_at: string
  status: 'completed'
  isDemo: true
  description?: string
  icon?: React.ReactNode
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getReportIcon = (reportType: string): React.ReactNode => {
  switch (reportType) {
    case 'sales-intelligence':
      return <TrendingUp className="h-4 w-4" />
    case 'pe-due-diligence':
      return <Building2 className="h-4 w-4" />
    case 'investment-analysis':
      return <FileText className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function DemoReportList({ showDemoReports, userRole }: DemoReportListProps) {
  const demoReports: DemoReport[] = [
    {
      id: 'demo-cibc-adobe-2024',
      company_name: 'CIBC',
      report_type: 'sales-intelligence',
      title: 'CIBC Adobe Sales Intelligence 2024',
      description: 'Comprehensive analysis of Adobe adoption opportunities at CIBC',
      created_at: '2024-01-15T10:30:00Z',
      status: 'completed',
      isDemo: true
    },
    {
      id: 'demo-pe-due-diligence',
      company_name: 'TechCorp',
      report_type: 'pe-due-diligence',
      title: 'Private Equity Due Diligence Example',
      description: 'Complete technical and business assessment for PE investment',
      created_at: '2024-02-01T14:20:00Z',
      status: 'completed',
      isDemo: true
    },
    {
      id: 'demo-investment-analysis',
      company_name: 'FinTech Innovators',
      report_type: 'investment-analysis',
      title: 'Investment Analysis Showcase',
      description: 'AI-driven investment thesis and market opportunity assessment',
      created_at: '2024-02-15T09:15:00Z',
      status: 'completed',
      isDemo: true
    }
  ]

  // Only show demo reports to admins or when explicitly enabled
  if (!showDemoReports || userRole !== 'admin') {
    return null
  }

  const handleViewDemo = (reportId: string) => {
    // Open in new tab to preserve current state
    window.open(`/admin/reports/${reportId}`, '_blank')
  }

  return (
    <div className="space-y-3">
      {demoReports.map(report => (
        <Card key={report.id} className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-orange-50/30 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-orange-100 rounded-lg">
                  {getReportIcon(report.report_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      <Award className="h-3 w-3 mr-1" />
                      Demo
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {report.report_type.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm truncate">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.company_name} • {formatDate(report.created_at)}
                  </p>
                  {report.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDemo(report.id)}
                className="shrink-0"
              >
                View Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}