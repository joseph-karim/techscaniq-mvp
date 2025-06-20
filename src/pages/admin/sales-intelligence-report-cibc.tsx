import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SalesIntelligenceCIBCReport() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to the new LangGraph report
    navigate('/admin/langgraph-report/9f8e7d6c-5b4a-3210-fedc-ba9876543210', { replace: true })
  }, [navigate])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to report...</p>
      </div>
    </div>
  )
}