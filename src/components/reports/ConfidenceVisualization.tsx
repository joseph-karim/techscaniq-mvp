import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ComprehensiveScore } from '@/lib/scoring/comprehensive-scoring';

interface ConfidenceVisualizationProps {
  score: ComprehensiveScore;
}

export function ConfidenceVisualization({ score }: ConfidenceVisualizationProps) {
  const getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 60) return 'Moderate';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-emerald-600';
    if (confidence >= 60) return 'text-yellow-600';
    if (confidence >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-emerald-100 text-emerald-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const dimensions = [
    { name: 'Technical', score: score.technicalScore, confidence: score.technicalConfidence },
    { name: 'Business', score: score.businessScore, confidence: score.businessConfidence },
    { name: 'Market', score: score.marketScore, confidence: score.marketConfidence },
    { name: 'Team', score: score.teamScore, confidence: score.teamConfidence },
    { name: 'Financial', score: score.financialScore, confidence: score.financialConfidence }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Investment Assessment Score</span>
            <div className="flex items-center gap-4">
              <Badge className={getGradeColor(score.finalGrade)} variant="secondary">
                Grade: {score.finalGrade}
              </Badge>
              <Badge 
                variant={score.investmentRecommendation === 'Strong Buy' ? 'default' : 
                        score.investmentRecommendation === 'Buy' ? 'secondary' : 
                        score.investmentRecommendation === 'Hold' ? 'outline' : 'destructive'}
              >
                {score.investmentRecommendation}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Raw Score</p>
                <p className="text-4xl font-bold">{score.weightedScore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Confidence Level</p>
                <p className={`text-4xl font-bold ${getConfidenceColor(score.confidenceBreakdown.overallConfidence)}`}>
                  {score.confidenceBreakdown.overallConfidence}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {getConfidenceLevel(score.confidenceBreakdown.overallConfidence)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Adjusted Score</p>
                <p className="text-4xl font-bold">{Math.round(score.confidenceAdjustedScore)}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </div>

            {/* Confidence Factors */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                Confidence Factors
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Factors affecting the reliability of this assessment</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Evidence Quality</span>
                  <div className="flex items-center gap-2">
                    <Progress value={score.confidenceBreakdown.evidenceQuality * 100} className="w-32" />
                    <span className="text-sm font-medium">
                      {Math.round(score.confidenceBreakdown.evidenceQuality * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Evidence Coverage</span>
                  <div className="flex items-center gap-2">
                    <Progress value={score.confidenceBreakdown.evidenceCoverage * 100} className="w-32" />
                    <span className="text-sm font-medium">
                      {Math.round(score.confidenceBreakdown.evidenceCoverage * 100)}%
                    </span>
                  </div>
                </div>

                {score.confidenceBreakdown.penaltyApplied > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-sm">Missing Evidence Penalty</span>
                    <span className="text-sm font-medium">
                      -{Math.round(score.confidenceBreakdown.penaltyApplied * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Missing Critical Evidence Alert */}
            {score.confidenceBreakdown.missingCriticalEvidence.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing Critical Evidence:</strong> The following important data points could not be verified:
                  <ul className="list-disc list-inside mt-2">
                    {score.confidenceBreakdown.missingCriticalEvidence.slice(0, 5).map((item, idx) => (
                      <li key={idx} className="text-sm">{item.replace(/_/g, ' ')}</li>
                    ))}
                    {score.confidenceBreakdown.missingCriticalEvidence.length > 5 && (
                      <li className="text-sm">
                        ... and {score.confidenceBreakdown.missingCriticalEvidence.length - 5} more
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dimension Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dimensions.map((dim) => (
              <div key={dim.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dim.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Score: {dim.score}/100
                    </span>
                    <Badge 
                      variant="outline" 
                      className={dim.confidence >= 0.7 ? 'border-green-600' : 
                                dim.confidence >= 0.5 ? 'border-yellow-600' : 'border-red-600'}
                    >
                      {Math.round(dim.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Progress value={dim.score} className="flex-1" />
                  <div className="w-4">
                    {dim.confidence >= 0.7 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : dim.confidence >= 0.5 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Scoring Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              The confidence-adjusted score factors in both the quality and quantity of evidence collected:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Base score calculated from {Object.values(dimensions).reduce((sum, d) => sum + d.score, 0)} evidence points</li>
              <li>Confidence multiplier applied based on evidence quality ({Math.round(score.confidenceBreakdown.evidenceQuality * 100)}%)</li>
              <li>Coverage adjustment for completeness ({Math.round(score.confidenceBreakdown.evidenceCoverage * 100)}%)</li>
              {score.confidenceBreakdown.penaltyApplied > 0 && (
                <li>Penalty for {score.confidenceBreakdown.missingCriticalEvidence.length} missing critical evidence items</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}