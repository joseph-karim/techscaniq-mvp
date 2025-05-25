import { useState } from 'react'
import { 
  ChevronDown, 
  User,
  Briefcase,
  GraduationCap,
  Star,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TeamMember {
  name: string
  role: string
  tenure: string
  background: string
  strengths: string[]
  experience: {
    years: number
    companies: string[]
    domains: string[]
  }
  education: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface LeadershipGap {
  area: string
  severity: 'critical' | 'important' | 'nice-to-have'
  description: string
  recommendation: string
  timeframe: string
}

interface TechnicalLeadershipProps {
  data: {
    companyName: string
    overallAssessment: string
    teamSize: number
    leadershipScore: number
    founders: TeamMember[]
    keyTechnicalLeaders: TeamMember[]
    leadershipGaps: LeadershipGap[]
    recommendations: string[]
    riskFactors: string[]
  }
}

export function TechnicalLeadership({ data }: TechnicalLeadershipProps) {
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState({
    founders: true,
    leadership: true,
    gaps: false,
    recommendations: false
  })

  const toggleMember = (memberId: string) => {
    const newExpanded = new Set(expandedMembers)
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId)
    } else {
      newExpanded.add(memberId)
    }
    setExpandedMembers(newExpanded)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'important': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'nice-to-have': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderTeamMember = (member: TeamMember, index: number, isFounder: boolean = false) => {
    const memberId = `${member.name}-${index}`
    const isExpanded = expandedMembers.has(memberId)

    return (
      <Card key={memberId} className="border-l-4 border-l-blue-500">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleMember(memberId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {member.name}
                  {isFounder && <Badge className="bg-purple-100 text-purple-800">Founder</Badge>}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {member.role} • {member.tenure}
                  {getRiskIcon(member.riskLevel)}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">
                  Confidence: {member.confidence}%
                </div>
                <div className={cn("text-sm", getRiskColor(member.riskLevel))}>
                  Risk: {member.riskLevel}
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
            <p className="text-sm leading-relaxed">{member.background}</p>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="space-y-1">
                  {member.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-600" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Experience
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Years:</span>
                    <span>{member.experience.years}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Companies:</span>
                    <span>{member.experience.companies.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Domains:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.experience.domains.map((domain, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-1 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Education
              </h4>
              <p className="text-sm text-muted-foreground">{member.education}</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div id="technical-leadership" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Founding Team & Technical Leadership</h2>
        <p className="text-muted-foreground">
          Assessment of {data.companyName}'s leadership capabilities and team composition
        </p>
      </div>

      {/* Overall Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leadership Overview
          </CardTitle>
          <CardDescription>
            High-level assessment of technical leadership strength
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="text-center">
              <div className={cn("text-3xl font-bold", getScoreColor(data.leadershipScore))}>
                {data.leadershipScore}%
              </div>
              <p className="text-sm text-muted-foreground">Leadership Score</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.teamSize}</div>
              <p className="text-sm text-muted-foreground">Team Size</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.founders.length}</div>
              <p className="text-sm text-muted-foreground">Founders</p>
            </div>
          </div>
          
          <p className="text-sm leading-relaxed">{data.overallAssessment}</p>
        </CardContent>
      </Card>

      {/* Founders Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('founders')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Founding Team</CardTitle>
              <CardDescription>
                Analysis of founder backgrounds and technical expertise
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.founders && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.founders && (
          <CardContent className="space-y-4">
            {data.founders.map((founder, index) => renderTeamMember(founder, index, true))}
          </CardContent>
        )}
      </Card>

      {/* Key Technical Leaders */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('leadership')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Key Technical Leaders</CardTitle>
              <CardDescription>
                Senior technical team members and their capabilities
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.leadership && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.leadership && (
          <CardContent className="space-y-4">
            {data.keyTechnicalLeaders.length > 0 ? (
              data.keyTechnicalLeaders.map((leader, index) => renderTeamMember(leader, index))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No additional technical leaders identified beyond founders
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Leadership Gaps */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('gaps')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Leadership Gaps & Risks
              </CardTitle>
              <CardDescription>
                Identified gaps in technical leadership and recommendations
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.gaps && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.gaps && (
          <CardContent className="space-y-4">
            {data.leadershipGaps.map((gap, index) => (
              <Card key={index} className="border-l-4 border-l-yellow-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{gap.area}</h4>
                    <Badge className={getSeverityColor(gap.severity)}>
                      {gap.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{gap.description}</p>
                  <div className="text-sm">
                    <strong>Recommendation:</strong> {gap.recommendation}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong>Timeframe:</strong> {gap.timeframe}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('recommendations')}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Strategic Recommendations
              </CardTitle>
              <CardDescription>
                Actions to strengthen technical leadership
              </CardDescription>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.recommendations && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.recommendations && (
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Badge className="mt-0.5">{index + 1}</Badge>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  )
} 