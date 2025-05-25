import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  GitBranch, 
  FileText, 
  MessageSquare, 
  Clock, 
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface TeamProcessAnalysisProps {
  data: {
    companyName: string
    analysisDate: string
    teamSize: number
    engineeringCultureScore: number
    processMaturityScore: number
    collaborationScore: number
    
    teamStructure: {
      totalEngineers: number
      seniorEngineers: number
      midLevelEngineers: number
      juniorEngineers: number
      contractors: number
      departments: Array<{
        name: string
        headCount: number
        avgExperience: number
        keyRoles: string[]
      }>
    }
    
    developmentWorkflows: {
      methodology: string
      sprintLength: string
      planningEfficiency: number
      velocityConsistency: number
      burndownAccuracy: number
      retrospectiveQuality: number
      workflows: Array<{
        process: string
        maturityLevel: 'basic' | 'intermediate' | 'advanced' | 'optimized'
        adoption: number
        effectiveness: number
      }>
    }
    
    communicationPatterns: {
      meetingEfficiency: number
      documentationQuality: number
      knowledgeSharing: number
      crossTeamCollaboration: number
      decisionMakingSpeed: number
      channels: Array<{
        type: string
        usage: number
        effectiveness: number
        tools: string[]
      }>
    }
    
    documentationAssessment: {
      overallQuality: number
      coverage: number
      maintenance: number
      accessibility: number
      categories: Array<{
        category: string
        quality: number
        coverage: number
        lastUpdated: string
        criticalGaps: string[]
      }>
    }
    
    engineeringCulture: {
      learningAndDevelopment: number
      innovationEncouragement: number
      workLifeBalance: number
      technicalExcellence: number
      psychologicalSafety: number
      practices: Array<{
        practice: string
        implemented: boolean
        effectiveness: number
        description: string
      }>
    }
    
    performanceMetrics: {
      developerProductivity: number
      codeReviewTurnaround: string
      bugFixTime: string
      featureDeliveryTime: string
      onboardingTime: string
      retentionRate: number
      satisfactionScore: number
    }
    
    processGaps: Array<{
      area: string
      severity: 'high' | 'medium' | 'low'
      impact: string
      recommendation: string
      effort: string
      priority: number
    }>
    
    recommendations: string[]
  }
}

export function TeamProcessAnalysis({ data }: TeamProcessAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMaturityColor = (level: string) => {
    switch (level) {
      case 'optimized': return 'bg-green-100 text-green-800 border-green-200'
      case 'advanced': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'basic': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <section id="team-process-analysis" className="space-y-8">
      <div className="border-l-4 border-green-500 pl-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Team & Process Analysis</h2>
        <p className="text-gray-600">
          Internal assessment of development workflows, team dynamics, and engineering culture
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Size</p>
                <p className="text-2xl font-bold text-gray-900">{data.teamSize}</p>
                <p className="text-xs text-gray-500">{data.teamStructure.totalEngineers} engineers</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Culture Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.engineeringCultureScore)}`}>
                  {data.engineeringCultureScore}/100
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Process Maturity</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.processMaturityScore)}`}>
                  {data.processMaturityScore}/100
                </p>
              </div>
              <GitBranch className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collaboration</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.collaborationScore)}`}>
                  {data.collaborationScore}/100
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Structure & Composition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Engineering Levels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Senior Engineers</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.teamStructure.seniorEngineers}</span>
                    <span className="text-sm text-gray-600">
                      ({Math.round((data.teamStructure.seniorEngineers / data.teamStructure.totalEngineers) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Mid-Level Engineers</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.teamStructure.midLevelEngineers}</span>
                    <span className="text-sm text-gray-600">
                      ({Math.round((data.teamStructure.midLevelEngineers / data.teamStructure.totalEngineers) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Junior Engineers</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.teamStructure.juniorEngineers}</span>
                    <span className="text-sm text-gray-600">
                      ({Math.round((data.teamStructure.juniorEngineers / data.teamStructure.totalEngineers) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Contractors</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{data.teamStructure.contractors}</span>
                    <span className="text-sm text-gray-600">
                      ({Math.round((data.teamStructure.contractors / data.teamSize) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Department Breakdown</h4>
              <div className="space-y-3">
                {data.teamStructure.departments.map((dept, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{dept.name}</h5>
                      <div className="text-sm text-gray-600">
                        {dept.headCount} people • {dept.avgExperience}y avg exp
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dept.keyRoles.map((role, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Development Workflows & Methodology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Agile Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Methodology</span>
                    <Badge variant="outline">{data.developmentWorkflows.methodology}</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sprint Length</span>
                    <span className="text-sm">{data.developmentWorkflows.sprintLength}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Planning Efficiency</span>
                      <span className="text-sm font-medium">{data.developmentWorkflows.planningEfficiency}%</span>
                    </div>
                    <Progress value={data.developmentWorkflows.planningEfficiency} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Velocity Consistency</span>
                      <span className="text-sm font-medium">{data.developmentWorkflows.velocityConsistency}%</span>
                    </div>
                    <Progress value={data.developmentWorkflows.velocityConsistency} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Burndown Accuracy</span>
                      <span className="text-sm font-medium">{data.developmentWorkflows.burndownAccuracy}%</span>
                    </div>
                    <Progress value={data.developmentWorkflows.burndownAccuracy} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Process Maturity</h4>
              <div className="space-y-3">
                {data.developmentWorkflows.workflows.map((workflow, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{workflow.process}</span>
                      <Badge variant="outline" className={getMaturityColor(workflow.maturityLevel)}>
                        {workflow.maturityLevel}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Adoption: </span>
                        <span className="font-medium">{workflow.adoption}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Effectiveness: </span>
                        <span className="font-medium">{workflow.effectiveness}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication & Collaboration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication & Collaboration Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Communication Effectiveness</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Meeting Efficiency</span>
                    <span className="text-sm font-medium">{data.communicationPatterns.meetingEfficiency}%</span>
                  </div>
                  <Progress value={data.communicationPatterns.meetingEfficiency} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Knowledge Sharing</span>
                    <span className="text-sm font-medium">{data.communicationPatterns.knowledgeSharing}%</span>
                  </div>
                  <Progress value={data.communicationPatterns.knowledgeSharing} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Cross-Team Collaboration</span>
                    <span className="text-sm font-medium">{data.communicationPatterns.crossTeamCollaboration}%</span>
                  </div>
                  <Progress value={data.communicationPatterns.crossTeamCollaboration} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Decision Making Speed</span>
                    <span className="text-sm font-medium">{data.communicationPatterns.decisionMakingSpeed}%</span>
                  </div>
                  <Progress value={data.communicationPatterns.decisionMakingSpeed} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Communication Channels</h4>
              <div className="space-y-3">
                {data.communicationPatterns.channels.map((channel, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{channel.type}</span>
                      <span className="text-sm text-gray-600">{channel.usage}% usage</span>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Effectiveness</span>
                        <span className="text-xs">{channel.effectiveness}%</span>
                      </div>
                      <Progress value={channel.effectiveness} className="h-1" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {channel.tools.map((tool, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation Quality Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Overall Metrics</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{data.documentationAssessment.overallQuality}%</p>
                    <p className="text-sm text-blue-800">Quality</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{data.documentationAssessment.coverage}%</p>
                    <p className="text-sm text-green-800">Coverage</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{data.documentationAssessment.maintenance}%</p>
                    <p className="text-sm text-yellow-800">Maintenance</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{data.documentationAssessment.accessibility}%</p>
                    <p className="text-sm text-purple-800">Accessibility</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Documentation Categories</h4>
              <div className="space-y-3">
                {data.documentationAssessment.categories.map((category, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category.category}</span>
                      <span className="text-xs text-gray-600">Updated: {category.lastUpdated}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="text-xs text-gray-600">Quality: </span>
                        <span className="text-xs font-medium">{category.quality}%</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Coverage: </span>
                        <span className="text-xs font-medium">{category.coverage}%</span>
                      </div>
                    </div>
                    {category.criticalGaps.length > 0 && (
                      <div>
                        <p className="text-xs text-red-600 font-medium mb-1">Critical Gaps:</p>
                        <div className="flex flex-wrap gap-1">
                          {category.criticalGaps.map((gap, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700">
                              {gap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engineering Culture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Engineering Culture & Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Culture Dimensions</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Learning & Development</span>
                    <span className="text-sm font-medium">{data.engineeringCulture.learningAndDevelopment}%</span>
                  </div>
                  <Progress value={data.engineeringCulture.learningAndDevelopment} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Innovation Encouragement</span>
                    <span className="text-sm font-medium">{data.engineeringCulture.innovationEncouragement}%</span>
                  </div>
                  <Progress value={data.engineeringCulture.innovationEncouragement} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Work-Life Balance</span>
                    <span className="text-sm font-medium">{data.engineeringCulture.workLifeBalance}%</span>
                  </div>
                  <Progress value={data.engineeringCulture.workLifeBalance} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Technical Excellence</span>
                    <span className="text-sm font-medium">{data.engineeringCulture.technicalExcellence}%</span>
                  </div>
                  <Progress value={data.engineeringCulture.technicalExcellence} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Psychological Safety</span>
                    <span className="text-sm font-medium">{data.engineeringCulture.psychologicalSafety}%</span>
                  </div>
                  <Progress value={data.engineeringCulture.psychologicalSafety} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Cultural Practices</h4>
              <div className="space-y-3">
                {data.engineeringCulture.practices.map((practice, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{practice.practice}</span>
                      <div className="flex items-center gap-2">
                        {practice.implemented ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm">{practice.effectiveness}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{practice.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Team Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{data.performanceMetrics.developerProductivity}%</p>
                <p className="text-sm text-blue-800">Developer Productivity</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{data.performanceMetrics.retentionRate}%</p>
                <p className="text-sm text-green-800">Retention Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{data.performanceMetrics.satisfactionScore}%</p>
                <p className="text-sm text-purple-800">Satisfaction Score</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Code Review Turnaround</span>
                <span className="font-bold">{data.performanceMetrics.codeReviewTurnaround}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Bug Fix Time</span>
                <span className="font-bold">{data.performanceMetrics.bugFixTime}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Feature Delivery Time</span>
                <span className="font-bold">{data.performanceMetrics.featureDeliveryTime}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Onboarding Time</span>
                <span className="font-bold">{data.performanceMetrics.onboardingTime}</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Key Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Strong retention indicates good culture fit</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Fast code review cycle supports velocity</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <span>Onboarding time could be optimized</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Process Gaps & Improvement Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.processGaps.map((gap, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{gap.area}</h4>
                      <Badge variant="outline" className={getSeverityColor(gap.severity)}>
                        {gap.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">Priority {gap.priority}</Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{gap.impact}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {gap.effort}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">Recommendation:</p>
                  <p className="text-sm text-blue-700">{gap.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Team & Process Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
} 