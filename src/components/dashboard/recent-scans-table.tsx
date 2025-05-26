import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, FileText, Hourglass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

// Mock scan data
const scanData = [
  {
    id: 'scan-1',
    company: 'Acme Cloud Technologies',
    status: 'complete',
    date: '2023-04-10T14:23:53Z',
    score: 7.8,
  },
  {
    id: 'scan-2',
    company: 'DevSecOps Solutions',
    status: 'awaiting_review',
    date: '2023-04-05T09:15:22Z',
    score: null,
  },
  {
    id: 'scan-3',
    company: 'Fast Deploy Systems',
    status: 'processing',
    date: '2023-04-03T16:45:11Z',
    score: null,
  },
  {
    id: 'scan-4',
    company: 'BlockSafe Crypto',
    status: 'complete',
    date: '2023-03-28T11:32:45Z',
    score: 5.4,
  },
  {
    id: 'scan-5',
    company: 'AI Insights Ltd',
    status: 'complete',
    date: '2023-03-20T14:12:33Z',
    score: 8.2,
  },
];

interface RecentScansTableProps {
  showAll?: boolean
}

export function RecentScansTable({ showAll = false }: RecentScansTableProps) {
  // If not showing all, limit to 5 scans
  const displayedScans = showAll ? scanData : scanData.slice(0, 5)
  
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
              Score
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {displayedScans.map((scan) => (
            <tr key={scan.id} className="border-t">
              <td className="px-4 py-3">
                <div className="font-medium">{scan.company}</div>
              </td>
              <td className="px-4 py-3">
                <ScanStatusBadge status={scan.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(scan.date)}
              </td>
              <td className="px-4 py-3">
                {scan.score !== null ? (
                  <div className="font-medium">{scan.score.toFixed(1)}</div>
                ) : (
                  <div className="text-muted-foreground">—</div>
                )}
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