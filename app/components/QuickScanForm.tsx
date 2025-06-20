'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { UnifiedScanConfigForm, type ScanConfiguration } from '@/components/scans/UnifiedScanConfigForm'
import { useReportOrchestrator } from '../hooks/useReportOrchestrator'
import { toast } from 'sonner'

export function QuickScanForm() {
  const router = useRouter()
  const { generateReport, loading, error, progress } = useReportOrchestrator()

  const handleSubmit = async (config: ScanConfiguration) => {
    if (!config.companyName || !config.websiteUrl) {
      toast.error('Company name and website URL are required')
      return
    }

    const report = await generateReport({
      name: config.companyName,
      website: config.websiteUrl
    })

    if (report) {
      // Navigate to the report page
      router.push(`/dashboard/reports/${report.id}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-bold mb-6">Quick Company Scan</h2>
      
      <UnifiedScanConfigForm
        mode="quick-scan"
        userRole="user"
        onSubmit={handleSubmit}
        submitButtonText="Generate Report"
        layout="single-page"
        showSavedConfigurations={false}
        hideFields={['priority', 'scanDepth', 'collectionNotes']}
      />

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mt-4">
          {error}
        </div>
      )}

      {loading && progress && (
        <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm mt-4">
          {progress}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">What happens next:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Website technology scan (5-10 seconds)</li>
          <li>• AI-powered technology analysis (30-60 seconds)</li>
          <li>• Report generation and saving</li>
        </ul>
      </div>
    </div>
  )
}