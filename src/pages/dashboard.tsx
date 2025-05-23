import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TechHealthScoreGauge } from '@/components/dashboard/tech-health-score-gauge'
import { RiskSummaryCards } from '@/components/dashboard/risk-summary-cards'
import { RecentScansTable } from '@/components/dashboard/recent-scans-table'
import { KeyFindings } from '@/components/dashboard/key-findings'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Mock data - in a real app, this would come from API
  const hasScans = true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to TechScan IQ - AI-powered technical due diligence for investors
          </p>
        </div>
        <Button asChild>
          <Link to="/scans/request">
            <PlusCircle className="mr-2 h-4 w-4" /> Request Scan
          </Link>
        </Button>
      </div>

      {!hasScans ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Get Started with TechScan IQ</CardTitle>
            <CardDescription>
              Request your first technical due diligence scan to see insights here
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <img 
                src="/images/dashboard-empty.svg" 
                alt="Empty dashboard" 
                className="mb-4 h-40 w-40" 
              />
              <h3 className="mb-2 text-xl font-semibold">No scans yet</h3>
              <p className="mb-4 text-muted-foreground">
                Start your first technical due diligence scan to get insights on your target company's tech stack, architecture, security, and code quality.
              </p>
              <Button asChild>
                <Link to="/scans/request">
                  <PlusCircle className="mr-2 h-4 w-4" /> Request Your First Scan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scans">Recent Scans</TabsTrigger>
            <TabsTrigger value="findings">Key Findings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tech Health Score</CardTitle>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/reports/latest">
                      View Latest <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <TechHealthScoreGauge score={7.8} grade="B" />
                </CardContent>
              </Card>
              
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Summary</CardTitle>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/reports/latest">
                      View Details <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <RiskSummaryCards />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Scans</CardTitle>
                  <CardDescription>Your last 5 technical due diligence scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentScansTable />
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                  <CardDescription>Critical insights from recent scans</CardDescription>
                </CardHeader>
                <CardContent>
                  <KeyFindings />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="scans">
            <Card>
              <CardHeader>
                <CardTitle>All Scans</CardTitle>
                <CardDescription>A complete history of your technical due diligence scans</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentScansTable showAll />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="findings">
            <Card>
              <CardHeader>
                <CardTitle>All Findings</CardTitle>
                <CardDescription>Comprehensive list of findings across all scans</CardDescription>
              </CardHeader>
              <CardContent>
                <KeyFindings showAll />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}