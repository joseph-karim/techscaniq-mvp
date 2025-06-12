import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertCircle, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Download,
  DollarSign,
  Calendar,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Building,
  GitBranch,
  Brain,
  Cloud,
  Code,
  TestTube,
  Package,
  FileCode
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

interface ThesisAlignedReport {
  id: string;
  company_name: string;
  website_url: string;
  thesis_type: string;
  thesis_config: any;
  executive_memo: {
    thesisFitSummary: string;
    topUpsides: Array<{ point: string; evidenceRefs: string[] }>;
    topRisks: Array<{ point: string; evidenceRefs: string[] }>;
    decision: string;
    conditions: string[];
    nextSteps: string[];
  };
  weighted_scores: {
    totalScore: number;
    threshold: number;
    passed: boolean;
    breakdown: Array<{
      category: string;
      weight: number;
      rawScore: number;
      weightedScore: number;
      evidenceRefs: string[];
    }>;
  };
  deep_dive_sections: Array<{
    title: string;
    weight: number;
    rawScore: number;
    weightedScore: number;
    findings: Array<{
      evidence: string;
      observation: string;
      impact: 'positive' | 'negative' | 'neutral';
      score: number;
    }>;
    recommendations: any[];
    evidenceRefs: string[];
  }>;
  technical_focus_areas: Record<string, {
    maturity: number;
    evidence: string[];
    notes: string;
  }>;
  risk_register: Array<{
    code: string;
    description: string;
    likelihood: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    mitigation: string;
    owner: string;
    costEstimate?: string;
    evidenceRefs: string[];
  }>;
  value_creation_roadmap: Array<{
    name: string;
    timelineBucket: '0-6m' | '6-18m' | '18m+';
    expectedImpact: string;
    costEstimate: string;
    roiEstimate: string;
    owner: string;
    thesisAlignment: string;
    evidenceRefs: string[];
  }>;
  financial_crosschecks?: any;
  recommendation: {
    decision: string;
    conditions: string[];
    nextSteps: string[];
    overallScore: number;
    threshold: number;
  };
  metadata: any;
}

const getDecisionColor = (decision: string) => {
  switch (decision.toLowerCase()) {
    case 'proceed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'proceed with conditions':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'decline':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};


const getMaturityIcon = (maturity: number) => {
  const icons = [
    <AlertCircle className="h-4 w-4 text-red-500" />,
    <AlertTriangle className="h-4 w-4 text-orange-500" />,
    <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    <CheckCircle className="h-4 w-4 text-blue-500" />,
    <CheckCircle className="h-4 w-4 text-green-500" />
  ];
  return icons[Math.max(0, Math.min(4, maturity - 1))];
};

const getFocusAreaIcon = (area: string) => {
  const icons: Record<string, JSX.Element> = {
    'cloud-native': <Cloud className="h-4 w-4" />,
    'scalable-architecture': <Building className="h-4 w-4" />,
    'security-focus': <Shield className="h-4 w-4" />,
    'devops-maturity': <Zap className="h-4 w-4" />,
    'api-driven': <GitBranch className="h-4 w-4" />,
    'microservices': <Package className="h-4 w-4" />,
    'test-coverage': <TestTube className="h-4 w-4" />,
    'modern-tech-stack': <Code className="h-4 w-4" />,
    'documentation': <FileCode className="h-4 w-4" />
  };
  return icons[area] || <Brain className="h-4 w-4" />;
};

export default function ThesisAlignedReport() {
  const { id } = useParams();
  const [report, setReport] = useState<ThesisAlignedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('executive');

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Extract the report data
      const reportData = data.report_data;
      setReport({
        id: data.id,
        ...reportData
      });
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Progress className="w-64 mb-4" value={33} />
          <p className="text-muted-foreground">Loading thesis-aligned report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Report not found or you don't have access to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const scorePercentage = report.weighted_scores.totalScore;
  const isPassingScore = report.weighted_scores.passed;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Cover Page / Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{report.company_name}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {report.website_url}
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Badge variant="outline" className="text-sm">
                  {report.thesis_config?.thesisType || 'Custom'} Thesis
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Timeline: {report.thesis_config?.timeHorizon}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Target: {report.thesis_config?.targetMultiple}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Generated: {new Date(report.metadata?.generatedAt).toLocaleDateString()}
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="executive">Executive Memo</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Analysis</TabsTrigger>
          <TabsTrigger value="deepdive">Deep Dive</TabsTrigger>
          <TabsTrigger value="technical">Tech Focus</TabsTrigger>
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
          <TabsTrigger value="roadmap">Value Creation</TabsTrigger>
        </TabsList>

        {/* Executive Investment Memo */}
        <TabsContent value="executive">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Executive Investment Memo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Dashboard */}
              <div className="bg-muted/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Overall Assessment Score</h3>
                  <Badge 
                    variant={isPassingScore ? "default" : "destructive"}
                    className="text-lg px-4 py-1"
                  >
                    {scorePercentage.toFixed(1)}% / {report.weighted_scores.threshold}%
                  </Badge>
                </div>
                <Progress 
                  value={scorePercentage} 
                  className={cn(
                    "h-4",
                    isPassingScore ? "bg-green-100" : "bg-red-100"
                  )}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Threshold: {report.weighted_scores.threshold}% • 
                  Status: {isPassingScore ? 'PASS' : 'BELOW THRESHOLD'}
                </p>
              </div>

              {/* Thesis Fit Summary */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Thesis Fit Summary</h3>
                <p className="text-muted-foreground">
                  {report.executive_memo.thesisFitSummary}
                </p>
              </div>

              {/* Top Upsides & Risks */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-green-700 dark:text-green-400">
                    <TrendingUp className="inline h-5 w-5 mr-1" />
                    Top 3 Upsides
                  </h3>
                  <ul className="space-y-2">
                    {report.executive_memo.topUpsides.map((upside, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <div>
                          <span>{upside.point}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {upside.evidenceRefs.join(', ')}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-700 dark:text-red-400">
                    <AlertTriangle className="inline h-5 w-5 mr-1" />
                    Top 3 Risks
                  </h3>
                  <ul className="space-y-2">
                    {report.executive_memo.topRisks.map((risk, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <div>
                          <span>{risk.point}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {risk.evidenceRefs.join(', ')}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Decision Snapshot */}
              <div className={cn(
                "rounded-lg border-2 p-6",
                getDecisionColor(report.recommendation.decision)
              )}>
                <h3 className="text-xl font-semibold mb-3">
                  Decision: {report.recommendation.decision}
                </h3>
                
                {report.recommendation.conditions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Conditions Precedent:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {report.recommendation.conditions.map((condition, i) => (
                        <li key={i} className="text-sm">{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Next Steps:</h4>
                  <ul className="space-y-1">
                    {report.recommendation.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-center text-sm">
                        <ArrowRight className="h-3 w-3 mr-2" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scoring Analysis */}
        <TabsContent value="scoring">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Weighted Scoring Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of scores by evaluation criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Weight</TableHead>
                    <TableHead className="text-center">Raw Score</TableHead>
                    <TableHead className="text-center">Weighted Score</TableHead>
                    <TableHead>Evidence Refs</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.weighted_scores.breakdown.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-center">{item.weight}%</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.rawScore >= 70 ? "default" : item.rawScore >= 50 ? "secondary" : "destructive"}>
                          {item.rawScore}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.weightedScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.evidenceRefs.slice(0, 3).join(', ')}
                        {item.evidenceRefs.length > 3 && '...'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.rawScore >= 70 ? (
                          <Badge variant="outline" className="bg-green-50">Strong</Badge>
                        ) : item.rawScore >= 50 ? (
                          <Badge variant="outline" className="bg-yellow-50">Moderate</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50">Weak</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center">100%</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={isPassingScore ? "default" : "destructive"}
                        className="text-base"
                      >
                        {scorePercentage.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">
                      {isPassingScore ? 'PASS' : 'FAIL'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deep Dive Sections */}
        <TabsContent value="deepdive">
          <div className="space-y-6">
            {report.deep_dive_sections.map((section, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>
                        Weight: {section.weight}% • Score: {section.rawScore}/100
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={section.rawScore >= 70 ? "default" : section.rawScore >= 50 ? "secondary" : "destructive"}
                      className="text-lg"
                    >
                      {section.rawScore}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Findings */}
                  <div>
                    <h4 className="font-semibold mb-3">Key Findings</h4>
                    <div className="space-y-2">
                      {section.findings.map((finding, j) => (
                        <div 
                          key={j}
                          className={cn(
                            "p-3 rounded-lg border",
                            finding.impact === 'positive' ? 'bg-green-50 border-green-200' :
                            finding.impact === 'negative' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50 border-gray-200'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <span className="text-sm">
                                {finding.observation}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {finding.evidence}
                              </span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "ml-2",
                                finding.score > 0 ? 'text-green-600' : finding.score < 0 ? 'text-red-600' : ''
                              )}
                            >
                              {finding.score > 0 ? '+' : ''}{finding.score}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {section.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {section.recommendations.map((rec, j) => (
                          <li key={j} className="flex items-start">
                            <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                            <div className="text-sm">
                              {typeof rec === 'string' ? rec : (
                                <>
                                  <span className="font-medium">{rec.action}</span>
                                  {rec.cost && <span className="text-muted-foreground"> • Cost: {rec.cost}</span>}
                                  {rec.timeline && <span className="text-muted-foreground"> • Timeline: {rec.timeline}</span>}
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Technical Focus Areas */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Technical Focus Areas</CardTitle>
              <CardDescription>
                Maturity assessment of key technical capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Object.entries(report.technical_focus_areas).map(([area, data]) => (
                  <div key={area} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFocusAreaIcon(area)}
                      <div>
                        <h4 className="font-medium capitalize">
                          {area.replace(/-/g, ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {data.notes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "w-2 h-8 rounded",
                              level <= data.maturity ? "bg-primary" : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      {getMaturityIcon(data.maturity)}
                      <span className="text-sm font-medium">{data.maturity}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Register */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Risk Register</CardTitle>
              <CardDescription>
                Identified risks with mitigation strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Code</TableHead>
                    <TableHead>Risk Description</TableHead>
                    <TableHead className="text-center">Likelihood</TableHead>
                    <TableHead className="text-center">Impact</TableHead>
                    <TableHead>Mitigation</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.risk_register.map((risk, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant="outline">{risk.code}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium">{risk.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {risk.evidenceRefs.join(', ')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline"
                          className={cn(
                            risk.likelihood === 'High' ? 'bg-red-50' :
                            risk.likelihood === 'Medium' ? 'bg-yellow-50' :
                            'bg-green-50'
                          )}
                        >
                          {risk.likelihood}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline"
                          className={cn(
                            risk.impact === 'High' ? 'bg-red-50' :
                            risk.impact === 'Medium' ? 'bg-yellow-50' :
                            'bg-green-50'
                          )}
                        >
                          {risk.impact}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm">
                        {risk.mitigation}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{risk.owner}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {risk.costEstimate || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Value Creation Roadmap */}
        <TabsContent value="roadmap">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Value Creation Roadmap</CardTitle>
              <CardDescription>
                High-ROI initiatives aligned with investment thesis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {['0-6m', '6-18m', '18m+'].map((timeline) => {
                  const initiatives = report.value_creation_roadmap.filter(
                    i => i.timelineBucket === timeline
                  );
                  
                  if (initiatives.length === 0) return null;
                  
                  return (
                    <div key={timeline}>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {timeline === '0-6m' ? 'Immediate (0-6 months)' :
                         timeline === '6-18m' ? 'Near-term (6-18 months)' :
                         'Long-term (18+ months)'}
                      </h3>
                      <div className="grid gap-4">
                        {initiatives.map((initiative, i) => (
                          <div key={i} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{initiative.name}</h4>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {initiative.costEstimate}
                                </Badge>
                                <Badge variant="default" className="text-xs">
                                  ROI: {initiative.roiEstimate}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {initiative.expectedImpact}
                            </p>
                            <div className="flex justify-between items-center text-xs">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {initiative.owner}
                              </span>
                              <span className="text-muted-foreground">
                                Thesis: {initiative.thesisAlignment}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}