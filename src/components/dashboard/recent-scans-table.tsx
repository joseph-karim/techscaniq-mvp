import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, FileText, Hourglass, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Scan } from '@/types'
import { mockDemoScanRequests, DemoScanRequest } from '@/lib/mock-demo-data'

interface RecentScansTableProps {
  showAll?: boolean
  // persona?: 'investor' | 'pe' | 'admin'; // Optional: to filter mock data by persona if needed later
}

export function RecentScansTable({ showAll = false }: RecentScansTableProps) {
  const [scans, setScans] = useState<(Scan | DemoScanRequest)[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScans() {
      setLoading(true)
      let fetchedScans: Scan[] = []
      const { data, error } = await supabase
        .from('scan_requests')
        .select('*, reports!scan_requests_report_id_fkey(id)')
        .order('created_at', { ascending: false })
        .limit(showAll ? 100 : 10)

      if (error) {
        console.error("Error fetching scans:", error)
        // Continue with mock data even if real fetch fails for demo purposes
      } else {
        fetchedScans = data || []
      }

      // For demo: combine mock scans with fetched scans
      // Simple merge: add mock scans that are not already present by ID from fetchedScans
      const combinedScans = [...fetchedScans]
      const fetchedScanIds = new Set(fetchedScans.map(s => s.id))
      
      mockDemoScanRequests.forEach(mockScan => {
        // Potentially filter mockScans by persona if a persona prop is added
        if (!fetchedScanIds.has(mockScan.id)) {
          combinedScans.push(mockScan)
        }
      })

      // Sort combined results again by date, ensuring proper type handling for created_at
      combinedScans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setScans(combinedScans.slice(0, showAll ? 100 : 5))
      setLoading(false)
    }
    fetchScans()
  }, [showAll])

  if (loading) return <div>Loading...</div>
  if (scans.length === 0) return <p className="text-muted-foreground p-4 text-center">No recent scans found.</p>

  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Company
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Date
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.id} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{scan.company_name}</div>
              </td>
              <td className="px-4 py-3">
                <ScanStatusBadge status={scan.status as Scan['status']} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(scan.created_at)}
              </td>
              <td className="px-4 py-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                >
                  {(scan.status === 'complete' && (scan as DemoScanRequest).mock_report_id) || 
                   (scan.status === 'complete' && scan.reports && scan.reports.length > 0) ? (
                    <Link to={`/scans/${scan.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Report
                    </Link>
                  ) : scan.status === 'pending' || scan.status === 'processing' ? (
                    <Link to={`/scans/${scan.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Status
                    </Link>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">
                      {scan.status === 'error' ? 'Scan Error' : 'Report Not Ready'}
                    </span>
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ScanStatusBadgeProps {
  status: string
}

export function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      )
    case 'processing':
      return (
        <Badge variant="outline" className="gap-1 text-blue-500">
          <Hourglass className="h-3 w-3" />
          Processing
        </Badge>
      )
    case 'awaiting_review':
      return (
        <Badge variant="outline" className="gap-1 text-yellow-500">
          <AlertCircle className="h-3 w-3" />
          Awaiting Review
        </Badge>
      )
    case 'complete':
      return (
        <Badge variant="outline" className="gap-1 text-green-500">
          <CheckCircle2 className="h-3 w-3" />
          Complete
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="outline" className="gap-1 text-red-500">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}