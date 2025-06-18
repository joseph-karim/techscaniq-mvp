import { useParams } from 'react-router-dom'
import SalesIntelligenceReportBMO from './sales-intelligence-report-bmo'
import SalesIntelligenceReportFidelity from './sales-intelligence-report-fidelity'

export default function AdminSalesIntelligenceReportPage() {
  const { accountId } = useParams<{ accountId: string }>()
  
  console.log('Sales Intelligence Router - accountId:', accountId)
  
  // Route to specific company reports based on accountId
  switch (accountId?.toLowerCase()) {
    case 'bmo':
      return <SalesIntelligenceReportBMO />
    case 'fidelity':
      return <SalesIntelligenceReportFidelity />
    default:
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Report Not Found</h2>
            <p className="text-muted-foreground">
              No Sales Intelligence report found for account: {accountId}
            </p>
          </div>
        </div>
      )
  }
}