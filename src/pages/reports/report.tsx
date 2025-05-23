import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportPage() {
  const { id } = useParams()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Report Details</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Report #{id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Report details will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  )
}