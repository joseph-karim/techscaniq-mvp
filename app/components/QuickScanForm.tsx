'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReportOrchestrator } from '../hooks/useReportOrchestrator'

export function QuickScanForm() {
  const router = useRouter()
  const { generateReport, loading, error, progress } = useReportOrchestrator()
  
  const [companyName, setCompanyName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyName || !websiteUrl) {
      return
    }

    const report = await generateReport({
      name: companyName,
      website: websiteUrl
    })

    if (report) {
      // Navigate to the report page
      router.push(`/dashboard/reports/${report.id}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-bold mb-6">Quick Company Scan</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            id="company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Stripe"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website URL
          </label>
          <input
            id="website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="e.g., https://stripe.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading && progress && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
            {progress}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>
      </form>

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