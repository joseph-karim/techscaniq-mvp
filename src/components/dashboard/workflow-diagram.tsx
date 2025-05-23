import { ArrowRight, Check, Clock, PenSquare, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  icon: React.ElementType
  title: string
  description: string
  status: 'completed' | 'current' | 'upcoming'
}

interface WorkflowDiagramProps {
  className?: string
  steps?: WorkflowStep[]
}

export function WorkflowDiagram({ className, steps: propSteps }: WorkflowDiagramProps) {
  // Default workflow steps for TechScan IQ process
  const defaultSteps: WorkflowStep[] = [
    {
      id: 'request',
      icon: PenSquare,
      title: 'Request Scan',
      description: 'Investor submits company details and thesis criteria',
      status: 'completed'
    },
    {
      id: 'analyze',
      icon: Zap,
      title: 'AI Analysis',
      description: 'Our AI engines analyze the tech stack and architecture',
      status: 'completed'
    },
    {
      id: 'review',
      icon: Clock,
      title: 'Expert Review',
      description: 'TechScan IQ experts validate the findings',
      status: 'current'
    },
    {
      id: 'publish',
      icon: Check,
      title: 'Publish Report',
      description: 'Final report is delivered to the investor',
      status: 'upcoming'
    }
  ]
  
  const steps = propSteps || defaultSteps
  
  return (
    <div className={cn("mx-auto w-full max-w-4xl px-4 py-4", className)}>
      <div className="grid gap-6 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex flex-col items-center">
            {/* Connect line between steps */}
            {index < steps.length - 1 && (
              <div className="absolute left-1/2 top-7 hidden w-full -translate-y-1/2 transform md:block">
                <div className={cn(
                  "h-[2px] w-full", 
                  step.status === 'completed' ? "bg-electric-teal" : "bg-slate-200 dark:bg-slate-700"
                )}></div>
                <ArrowRight 
                  className={cn(
                    "absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2",
                    step.status === 'completed' ? "text-electric-teal" : "text-slate-200 dark:text-slate-700"
                  )} 
                />
              </div>
            )}
            
            {/* Step icon */}
            <div 
              className={cn(
                "z-10 flex h-14 w-14 items-center justify-center rounded-full border-2",
                step.status === 'completed' ? "border-electric-teal bg-electric-teal text-white" :
                step.status === 'current' ? "border-electric-teal bg-white text-electric-teal dark:bg-deep-navy" :
                "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-deep-navy"
              )}
            >
              <step.icon className="h-6 w-6" />
            </div>
            
            {/* Step details */}
            <div className="mt-3 text-center">
              <h3 className={cn(
                "font-medium",
                step.status === 'completed' || step.status === 'current' ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}