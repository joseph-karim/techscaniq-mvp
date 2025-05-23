import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ScanDetailsPage() {
  const { id } = useParams()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Scan Details</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Scan #{id}</CardTitle>
          <CardDescription>Detailed information about this scan</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Scan details content will be displayed here. This is a placeholder for the scan details page.</p>
        </CardContent>
      </Card>
    </div>
  )
}