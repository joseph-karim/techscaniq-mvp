import { Link } from 'react-router-dom'
import { Bug, Database, Lock, Network, SquareCode } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock findings data
const findingsData = [
  {
    id: 'finding-1',
    title: 'Unsecured API Endpoints',
    category: 'security',
    severity: 'critical',
    scanId: 'scan-1',
    company: 'Acme Cloud Technologies',
  },
  {
    id: 'finding-2',
    title: 'Database Connection Pooling Issues',
    category: 'database',
    severity: 'high',
    scanId: 'scan-1',
    company: 'Acme Cloud Technologies',
  },
  {
    id: 'finding-3',
    title: 'Outdated Node.js Version',
    category: 'devops',
    severity: 'medium',
    scanId: 'scan-4',
    company: 'BlockSafe Crypto',
  },
  {
    id: 'finding-4',
    title: 'Microservice Communication Bottlenecks',
    category: 'architecture',
    severity: 'high',
    scanId: 'scan-4',
    company: 'BlockSafe Crypto',
  },
  {
    id: 'finding-5',
    title: 'Frontend Bundle Size Optimization',
    category: 'code',
    severity: 'low',
    scanId: 'scan-5',
    company: 'AI Insights Ltd',
  },
  {
    id: 'finding-6',
    title: 'Insufficient Test Coverage',
    category: 'code',
    severity: 'medium',
    scanId: 'scan-5',
    company: 'AI Insights Ltd',
  },
];

// Category icons mapping
const categoryIcons = {
  security: Lock,
  database: Database,
  devops: SquareCode,
  architecture: Network,
  code: Bug,
}

// Severity colors mapping
const severityColors = {
  critical: 'text-white bg-red-500',
  high: 'text-white bg-orange-500',
  medium: 'text-white bg-yellow-500',
  low: 'text-white bg-green-500',
}

interface KeyFindingsProps {
  showAll?: boolean
}

export function KeyFindings({ showAll = false }: KeyFindingsProps) {
  // If not showing all, limit to 5 findings
  const displayedFindings = showAll ? findingsData : findingsData.slice(0, 5)
  
  return (
    <div className="space-y-4">
      {displayedFindings.map((finding) => {
        const CategoryIcon = categoryIcons[finding.category as keyof typeof categoryIcons] || Bug
        
        return (
          <Link 
            key={finding.id} 
            to={`/pe/reports/${finding.scanId}?finding=${finding.id}`}
            className="block"
          >
            <div className="flex items-center rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <div className={cn(
                'mr-3 flex h-9 w-9 items-center justify-center rounded-full',
                severityColors[finding.severity as keyof typeof severityColors]
              )}>
                <CategoryIcon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="font-medium leading-none">{finding.title}</p>
                <p className="text-xs text-muted-foreground">
                  {finding.company} • {finding.category.charAt(0).toUpperCase() + finding.category.slice(1)}
                </p>
              </div>
            </div>
          </Link>
        )
      })}
      
      {!showAll && (
        <Link to="/findings" className="block text-center text-sm text-primary hover:underline">
          View all findings
        </Link>
      )}
    </div>
  )
}