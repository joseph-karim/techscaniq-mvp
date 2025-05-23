import React from 'react';
import { Gauge } from 'lucide-react'
import { useTooltip } from '@/hooks/use-tooltip'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TechHealthScoreGaugeProps {
  score: number // 1-10
  grade: 'A' | 'B' | 'C' | 'D' | 'F'  // Keeping for backward compatibility
}

export function TechHealthScoreGauge({ score }: TechHealthScoreGaugeProps) {
  const { tooltip, setTooltip } = useTooltip()
  
  // SVG dimensions and calculations
  const size = 200
  const strokeWidth = 15
  const radius = (size - strokeWidth) / 2
  const centerX = size / 2
  const centerY = size / 2
  const circumference = 2 * Math.PI * radius
  
  // We'll only use 180 degrees (half circle), so multiply by 0.5
  const maxValue = circumference * 0.5
  
  // Calculate the percentage for the gauge (0-100%)
  const percentage = Math.min(Math.max((score / 10), 0), 1)
  const arcValue = percentage * maxValue
  
  // Calculate rotation angle for the gauge needle
  const needleRotation = percentage * 180 - 90

  return (
    <TooltipProvider>
      <div className="relative flex flex-col items-center p-2">
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-[160px]">
          {/* Background track */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference / 2}
            transform={`rotate(-180 ${centerX} ${centerY})`}
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* Colored progress track - We use a gradient to show the scale */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference / 2 + (maxValue - arcValue)}
            strokeLinecap="round"
            transform={`rotate(-180 ${centerX} ${centerY})`}
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* Define gradient for the gauge */}
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" /> {/* Red */}
              <stop offset="50%" stopColor="#F59E0B" /> {/* Yellow/Amber */}
              <stop offset="100%" stopColor="#10B981" /> {/* Green */}
            </linearGradient>
          </defs>
          
          {/* Gauge needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={centerY - radius + strokeWidth / 2 + 5} // Points upwards from center before rotation
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${needleRotation} ${centerX} ${centerY})`}
            className="transition-all duration-500 ease-in-out"
          />
          
          {/* Needle center pivot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="6"
            fill="hsl(var(--background))"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
        </svg>
        
        {/* Score display below the gauge */}
        <div className="mt-4 text-center">
          <span className="text-3xl font-bold">{score.toFixed(1)}</span>
        </div>
        
        <div className="mt-4 flex w-full justify-between text-xs text-muted-foreground">
          <div>Poor (1-4)</div>
          <div>Average (5-7)</div>
          <div>Excellent (8-10)</div>
        </div>
        
        <Tooltip open={tooltip !== null}>
          <TooltipTrigger asChild>
            <button 
              className="mt-4 flex items-center text-sm text-electric-teal hover:underline"
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