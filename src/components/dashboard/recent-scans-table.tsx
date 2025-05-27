import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, FileText, Hourglass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Scan } from '@/types'

interface RecentScansTableProps {
  showAll?: boolean
}

export function RecentScansTable({ showAll = false }: RecentScansTableProps) {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScans() {
      setLoading(true)
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(showAll ? 100 : 5)
      if (error) {
        setScans([])
      } else {
        setScans(data || [])
      }
      setLoading(false)
    }
    fetchScans()
  }, [showAll])

  if (loading) return <div>Loading...</div>

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
                <div className="font-medium">{scan.company_id}</div>
              </td>
              <td className="px-4 py-3">
                <ScanStatusBadge status={scan.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(scan.created_at)}
              </td>
              <td className="px-4 py-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={scan.status !== 'complete'}
                  asChild
                >
                  <Link to={`/reports/${scan.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Report
                  </Link>
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

function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
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