import { useState, useCallback } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Info, Download, Share2, AlertTriangle } from 'lucide-react'
import { 
  LazyLangGraphReport,
  LazyLangGraphPEReport,
  LazySalesIntelligenceReport,
  LazyEnhancedEvidenceAppendix
} from './LazyReportComponents'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

interface UnifiedReportViewerProps {
  reportType: 'pe-due-diligence' | 'sales-intelligence' | 'investment-analysis'
  reportData: any
  reportId: string
  isDemo?: boolean
}

interface ReportHeaderProps {
  reportType: string
  reportId: string
  isDemo: boolean
  onDownload: () => void
  onShare: () => void
}

function ReportHeader({ reportType, reportId, isDemo, onDownload, onShare }: ReportHeaderProps) {
  const reportTypeLabels = {
    'pe-due-diligence': 'Private Equity Due Diligence',
    'sales-intelligence': 'Sales Intelligence',
    'investment-analysis': 'Investment Analysis'
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">
          {reportTypeLabels[reportType as keyof typeof reportTypeLabels] || reportType}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Report ID: {reportId}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  )
}

function LangGraphReportContent({ data }: { data: any }) {
  return <LazyLangGraphReport report={data} />
}

function LangGraphPEReportContent({ data }: { data: any }) {
  return <LazyLangGraphPEReport report={data} />
}

function SalesIntelligenceReportContent({ data }: { data: any }) {
  return <LazySalesIntelligenceReport report={data} />
}

export function UnifiedReportViewer({
  reportType,
  reportData,
  reportId,
  isDemo = false
}: UnifiedReportViewerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Common report actions
  const handleDownload = useCallback(() => {
    // Unified download logic
    // TODO: Implement actual download functionality
    setError('Download functionality not yet implemented')
  }, [reportId])

  const handleShare = useCallback(() => {
    // Unified sharing logic
    // TODO: Implement actual sharing functionality
    setError('Sharing functionality not yet implemented')
  }, [reportId])

  // Render appropriate report component based on type
  const renderReportContent = () => {
    switch (reportType) {
      case 'pe-due-diligence':
        return <LangGraphPEReportContent data={reportData} />
      case 'sales-intelligence':
        return <SalesIntelligenceReportContent data={reportData} />
      case 'investment-analysis':
        return <LangGraphReportContent data={reportData} />
      default:
        return <div>Unknown report type</div>
    }
  }

  return (
    <div className={`report-viewer ${isDemo ? 'demo-report' : ''}`}>
      {/* Demo indicator */}
      {isDemo && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <Badge variant="outline" className="mr-2 bg-orange-100 text-orange-800">Demo</Badge>
            This is a demonstration report for sales and training purposes.
          </AlertDescription>
        </Alert>
      )}

      {/* Common header */}
      <ReportHeader
        reportType={reportType}
        reportId={reportId}
        isDemo={isDemo}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {/* Report content */}
      <ErrorBoundary>
        {renderReportContent()}
      </ErrorBoundary>

      {/* Enhanced evidence appendix */}
      {reportData && (
        <LazyEnhancedEvidenceAppendix
          companyName={reportData?.company_name || reportData?.thesis?.company}
          reportId={reportId}
          comprehensiveScore={reportData?.comprehensive_score || reportData?.metadata?.averageQualityScore}
        />
      )}
    </div>
  )
}