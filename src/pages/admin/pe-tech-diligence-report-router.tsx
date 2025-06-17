import { useParams } from 'react-router-dom'
import PETechDiligenceReportSnowplow from './pe-tech-diligence-report'
import PETechDiligenceReportOneZero from './pe-tech-diligence-report-onezero'

export default function AdminPETechDiligenceReportPage() {
  const { companyId } = useParams<{ companyId: string }>()
  
  // Route to specific company reports based on companyId
  switch (companyId?.toLowerCase()) {
    case 'snowplow':
      return <PETechDiligenceReportSnowplow />
    case 'onezero':
      return <PETechDiligenceReportOneZero />
    default:
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground">
              No PE Tech Diligence report found for company: {companyId}
            </p>
          </div>
        </div>
      )
  }
}