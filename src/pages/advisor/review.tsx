import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdvisorReviewPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Advisor Review</h1>
      <p className="text-muted-foreground">Review ID: {id}</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Review Details</CardTitle>
          <CardDescription>
            Review and provide feedback on this submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The advisor review functionality will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  )
}