import { useState } from 'react'
import { 
  ChevronDown, 
  Calendar,
  Code,
  Database,
  Cloud,
  Smartphone,
  Globe,
  Zap,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  year: string
  quarter?: string
  title: string
  description: string
  category: 'product' | 'infrastructure' | 'team' | 'funding' | 'technology'
  confidence: number
  keyDevelopments: string[]
  impact: 'high' | 'medium' | 'low'
}

interface StackEvolutionTimelineProps {
  data: {
    companyName: string
    foundingYear: string
    currentYear: string
    overallEvolution: string
    timeline: TimelineEvent[]
    keyMilestones: {
      founding: string
      firstProduct: string
      majorPivot?: string
      currentState: string
    }
  }
}

export function StackEvolutionTimeline({ data }: StackEvolutionTimelineProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'product': return <Smartphone className="h-4 w-4" />
      case 'infrastructure': return <Cloud className="h-4 w-4" />
      case 'team': return <Code className="h-4 w-4" />
      case 'funding': return <TrendingUp className="h-4 w-4" />
      case 'technology': return <Database className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'infrastructure': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'team': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'funding': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'technology': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const filteredTimeline = selectedCategory === 'all' 
    ? data.timeline 
    : data.timeline.filter(event => event.category === selectedCategory)

  const categories = ['all', 'product', 'infrastructure', 'team', 'funding', 'technology']

  return (
    <div id="stack-evolution" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stack Evolution Timeline</h2>
        <p className="text-muted-foreground">
          {data.companyName}'s technology journey from {data.foundingYear} to {data.currentYear}
        </p>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Evolution Overview
          </CardTitle>
          <CardDescription>
            High-level assessment of technology stack progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed mb-4">{data.overallEvolution}</p>
          
          {/* Key Milestones */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Key Milestones</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founded:</span>
                  <span>{data.keyMilestones.founding}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Product:</span>
                  <span>{data.keyMilestones.firstProduct}</span>
                </div>
                {data.keyMilestones.majorPivot && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Major Pivot:</span>
                    <span>{data.keyMilestones.majorPivot}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current State:</span>
                  <span>{data.keyMilestones.currentState}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Timeline Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Events:</span>
                  <span>{data.timeline.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">High Impact:</span>
                  <span>{data.timeline.filter(e => e.impact === 'high').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Confidence:</span>
                  <span>{Math.round(data.timeline.reduce((acc, e) => acc + e.confidence, 0) / data.timeline.length)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category !== 'all' && getCategoryIcon(category)}
            <span className={category !== 'all' ? 'ml-2' : ''}>{category}</span>
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredTimeline.map((event, index) => {
          const eventId = `${event.year}-${index}`
          const isExpanded = expandedEvents.has(eventId)
          
          return (
            <Card 
              key={eventId} 
              className={cn(
                "border-l-4 transition-all duration-200",
                getImpactColor(event.impact)
              )}
            >
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleEvent(eventId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(event.category)}
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {event.year}{event.quarter && ` Q${event.quarter}`}
                          <Badge className={getCategoryColor(event.category)}>
                            {event.category}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Impact: {event.impact}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Confidence: {event.confidence}%</span>
                        <Progress value={event.confidence} className="w-16 h-2" />
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{event.description}</p>
                  
                  {event.keyDevelopments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Key Developments
                      </h4>
                      <ul className="space-y-1">
                        {event.keyDevelopments.map((development, devIndex) => (
                          <li key={devIndex} className="flex items-start gap-2 text-sm">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                            <span>{development}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {filteredTimeline.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No events found for the selected category.
          </CardContent>
        </Card>
      )}
    </div>
  )
} 