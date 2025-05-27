import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { InlineCitation, Citation } from '@/components/reports/EvidenceCitation'
import { TemporalIntelligence } from '@/types/executive-report'
import { Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StackEvolutionSectionProps {
  data: TemporalIntelligence
  citations: Citation[]
  onCitationClick: (citation: Citation) => void
}

export function StackEvolutionSection({ 
  data, 
  citations, 
  onCitationClick 
}: StackEvolutionSectionProps) {
  const getSignalTypeIcon = (type: 'verified' | 'inferred' | 'partial') => {
    switch (type) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'inferred':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600'
    if (confidence >= 70) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Stack Evolution Timeline</h2>
        <p className="text-muted-foreground mb-6">
          Reconstruction of technology stack evolution using historical data and inference models
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temporal Intelligence Analysis</CardTitle>
          <CardDescription>
            Stack changes tracked through multiple data sources with confidence scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.stackEvolution.map((evolution, index) => (
              <div key={index} className="relative">
                {index !== data.stackEvolution.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                )}
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold">{evolution.year}</span>
                      {getSignalTypeIcon(evolution.signalType)}
                      <Badge variant="outline" className="text-xs">
                        {evolution.signalType}
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <p className="text-sm leading-relaxed">
                        {evolution.change}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Confidence:</span>
                          <span className={cn(
                            "text-sm font-medium",
                            getConfidenceColor(evolution.confidence)
                          )}>
                            {evolution.confidence}%
                          </span>
                          <Progress 
                            value={evolution.confidence} 
                            className="w-20 h-2"
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Source: {evolution.source}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supporting Evidence Section */}
      <Card>
        <CardHeader>
          <CardTitle>Supporting Evidence</CardTitle>
          <CardDescription>
            Data sources and methodologies used for temporal reconstruction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p>
                Stack evolution data was reconstructed using:
              </p>
              <ul>
                <li>
                  <InlineCitation
                    citationId="wayback"
                    citation={citations.find(c => c.id === 'wayback')!}
                    onCitationClick={onCitationClick}
                  >
                    Wayback Machine archives
                  </InlineCitation>
                  {' '}for historical website snapshots
                </li>
                <li>
                  <InlineCitation
                    citationId="builtwith"
                    citation={citations.find(c => c.id === 'builtwith')!}
                    onCitationClick={onCitationClick}
                  >
                    BuiltWith technology tracking
                  </InlineCitation>
                  {' '}for verified technology usage
                </li>
                <li>
                  <InlineCitation
                    citationId="github"
                    citation={citations.find(c => c.id === 'github')!}
                    onCitationClick={onCitationClick}
                  >
                    GitHub commit history
                  </InlineCitation>
                  {' '}for open source contributions
                </li>
                <li>
                  <InlineCitation
                    citationId="blog"
                    citation={citations.find(c => c.id === 'blog')!}
                    onCitationClick={onCitationClick}
                  >
                    Company blog archives
                  </InlineCitation>
                  {' '}for technology announcements
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 