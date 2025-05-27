'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../../src/lib/supabase'

interface ReportData {
  id: string
  company_name: string
  website_url: string
  generated_at: string
  tech_stack: any[]
  infrastructure: any
  performance_metrics: any
  technology_summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  competitors: string[]
  investment_score: number
  execution_time_ms: number
  services_status: any
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReport() {
      try {
        const { data, error } = await supabase
          .from('scan_reports')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        
        setReport(data.report_data)
      } catch (err) {
        console.error('Error fetching report:', err)
        setError('Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{report.company_name}</h1>
            <p className="text-gray-600">{report.website_url}</p>
            <p className="text-sm text-gray-500 mt-2">
              Generated: {new Date(report.generated_at).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Analysis completed in {(report.execution_time_ms / 1000).toFixed(1)} seconds
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tech Stack */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Technology Stack</h2>
              <div className="space-y-2">
                {report.tech_stack.length > 0 ? (
                  report.tech_stack.map((tech, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-sm text-gray-600">{tech.category}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {(tech.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      {tech.version && (
                        <p className="text-sm text-gray-500 mt-1">Version: {tech.version}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No technologies detected</p>
                )}
              </div>
            </div>

            {/* Investment Score */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Investment Readiness</h2>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                <div className="text-center">
                  <p className="text-5xl font-bold text-blue-600">{report.investment_score}/10</p>
                  <p className="text-gray-600 mt-2">Technology Investment Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Summary */}
          {report.technology_summary && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Technology Analysis</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{report.technology_summary}</p>
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">Strengths</h3>
              <ul className="space-y-2">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">Weaknesses</h3>
              <ul className="space-y-2">
                {report.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span className="text-gray-700">{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">→</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competitors */}
          {report.competitors.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Key Competitors</h3>
              <div className="flex flex-wrap gap-2">
                {report.competitors.map((competitor, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {competitor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {report.performance_metrics && (
            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Website Performance</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {report.performance_metrics.loadTime}ms
                  </p>
                  <p className="text-sm text-gray-600">Load Time</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {report.performance_metrics.resourceCount}
                  </p>
                  <p className="text-sm text-gray-600">Resources</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">
                    {(report.performance_metrics.totalSize / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <p className="text-sm text-gray-600">Page Size</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 