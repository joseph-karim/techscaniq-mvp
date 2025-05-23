import { AlertTriangle, Bug, Info, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock risk data
const riskData = [
  { 
    id: 'critical', 
    count: 1, 
    icon: Zap, 
    label: 'Critical', 
    color: 'text-risk-red bg-red-50 dark:bg-red-950/30 dark:text-red-400',
    description: 'Key vulnerability in payment system'
  },
  { 
    id: 'high', 
    count: 3, 
    icon: AlertTriangle, 
    label: 'High', 
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400',
    description: 'Security and data concerns'
  },
  { 
    id: 'medium', 
    count: 8, 
    icon: Bug, 
    label: 'Medium', 
    color: 'text-caution-amber bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400',
    description: 'Performance and scaling issues'
  },
  { 
    id: 'low', 
    count: 15, 
    icon: Info, 
    label: 'Low', 
    color: 'text-signal-green bg-green-50 dark:bg-green-950/30 dark:text-green-400',
    description: 'Technical debt and minor bugs'
  },
]

export function RiskSummaryCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {riskData.map((risk) => (
        <RiskCard key={risk.id} risk={risk} />
      ))}
    </div>
  )
}

interface RiskCardProps {
  risk: {
    id: string
    count: number
    icon: React.ElementType
    label: string
    color: string
    description: string
  }
}

function RiskCard({ risk }: RiskCardProps) {
  const Icon = risk.icon
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-between rounded-lg border border-slate-200 p-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800',
      risk.count === 0 ? 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400' : ''
    )}>
      <div className="flex w-full items-center justify-between">
        <div className={cn(
          'rounded-full p-1.5',
          risk.color
        )}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="text-2xl font-bold">{risk.count}</div>
      </div>
      
      <div className="mt-2 w-full text-center">
        <div className="text-sm font-medium">{risk.label}</div>
        <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
          {risk.description}
        </div>
      </div>
    </div>
  )
}