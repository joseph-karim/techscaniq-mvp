import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { LangGraphReport } from '@/components/reports/LangGraphReport'
import { loadLangGraphReportWithFallback } from '@/services/langgraph-reports'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SalesIntelligenceCIBCReport() {
  const navigate = useNavigate()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true)
        const data = await loadLangGraphReportWithFallback('cibc-adobe-sales-2024')
        if (data) {
          setReport(data)
        } else {
          setError('Report not found')
        }
      } catch (err) {
        setError('Failed to load report')
        console.error('Error loading report:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading LangGraph report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </div>
          
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <strong>Error:</strong> {error || 'Unable to load report'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </div>

        {/* Report Content */}
        <LangGraphReport report={report} />
      </div>
    </div>
  )
}