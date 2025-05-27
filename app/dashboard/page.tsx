'use client'

import React, { useEffect, useState } from 'react'
import { QuickScanForm } from '../components/QuickScanForm'
import { supabase } from '../../src/lib/supabase'
import { useRouter } from 'next/navigation'

interface Report {
  id: string
  company_name: string
  website_url: string
  created_at: string
  status: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('scan_reports')
          .select('id, company_name, website_url, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error
        
        setReports(data || [])
      } catch (err) {
        console.error('Error fetching reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Technology Assessment Dashboard</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quick Scan Form */}
          <div>
            <QuickScanForm />
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Reports</h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{report.company_name}</h3>
                        <p className="text-sm text-gray-600">{report.website_url}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No reports yet. Generate your first report using the form.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 