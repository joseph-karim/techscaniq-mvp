import { Gauge } from 'lucide-react'
import { useTooltip } from '@/hooks/use-tooltip'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TechHealthScoreGaugeProps {
  score: number // 1-10
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export function TechHealthScoreGauge({ score, grade }: TechHealthScoreGaugeProps) {
  const { tooltip, setTooltip } = useTooltip()
  
  // Calculate the percentage for the gauge
  const percentage = (score / 10) * 100
  
  // Map grade to color
  const gradeColors = {
    A: 'text-green-500',
    B: 'text-green-400',
    C: 'text-yellow-500',
    D: 'text-orange-500',
    F: 'text-red-500',
  }
  
  // Calculate rotation angle for the gauge needle
  const rotation = (percentage / 100) * 180 - 90

  return (
    <TooltipProvider>
      <div className="relative flex flex-col items-center p-2">
        <div className="flex items-center justify-center">
          <div className="relative h-36 w-36">
            {/* Gauge background */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />
            </div>
            
            {/* Gauge fill */}
            <div
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{ 
                clipPath: `polygon(50% 50%, 50% 0%, ${percentage > 50 ? '100% 0%' : `${50 + percentage}% 0%`}, ${percentage > 50 ? `${50 + (percentage - 50) / 2}% ${(percentage - 50) / 2}%` : '50% 50%'})` 
              }}
            >
              <div className="h-full w-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
            </div>
            
            {/* Gauge center and needle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-background text-center shadow-md">
                <span className="text-3xl font-bold">{score.toFixed(1)}</span>
                <span className={`text-xl font-semibold ${gradeColors[grade]}`}>{grade}</span>
              </div>
              <div 
                className="absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 origin-bottom bg-foreground"
                style={{ transform: `translateX(-50%) translateY(-100%) rotate(${rotation}deg)` }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex w-full justify-between text-xs text-muted-foreground">
          <div>Poor (1-4)</div>
          <div>Average (5-7)</div>
          <div>Excellent (8-10)</div>
        </div>
        
        <Tooltip open={tooltip !== null}>
          <TooltipTrigger asChild>
            <button 
              className="mt-4 flex items-center text-sm text-primary"
              onMouseEnter={() => setTooltip('methodology')}
              onMouseLeave={() => setTooltip(null)}
            >
              <Gauge className="mr-1 h-4 w-4" />
              How is this calculated?
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>The Tech Health Score is a composite rating based on:</p>
            <ul className="ml-4 mt-2 list-disc text-xs">
              <li>Architecture resilience (25%)</li>
              <li>Security posture (25%)</li>
              <li>Code quality (20%)</li>
              <li>DevOps maturity (15%)</li>
              <li>Technical debt (15%)</li>
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}