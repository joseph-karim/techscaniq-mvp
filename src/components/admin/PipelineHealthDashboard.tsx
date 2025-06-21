import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity, Database, Network, FileText } from 'lucide-react';
import { checkReportSystemHealth, preloadCommonReports } from '@/services/langgraph-reports';
import { reportCache } from '@/services/report-cache';

interface HealthStatus {
  apiHealthy: boolean;
  localFilesAccessible: boolean;
  reportSync: boolean;
  cacheStats: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  reportCount: number;
  lastSync: string;
  errors: string[];
  issues: string[];
}

interface HealthCheckResult {
  apiHealthy: boolean;
  localFilesAccessible: boolean;
  cacheStats: any;
  issues: string[];
}

export function PipelineHealthDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const checkHealth = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting health check...');

      // Get report system health
      const systemHealth: HealthCheckResult = await checkReportSystemHealth();
      console.log('System health:', systemHealth);

      // Check report sync status
      const reportSync = await checkReportSyncStatus();
      console.log('Report sync status:', reportSync);

      // Get report count
      const reportCount = await getReportCount();
      console.log('Report count:', reportCount);

      // Get cache stats
      const cacheStats = reportCache.getStats();
      console.log('Cache stats:', cacheStats);

      setHealth({
        apiHealthy: systemHealth.apiHealthy,
        localFilesAccessible: systemHealth.localFilesAccessible,
        reportSync: reportSync.healthy,
        cacheStats: cacheStats,
        reportCount: reportCount,
        lastSync: reportSync.lastSync,
        errors: [],
        issues: systemHealth.issues
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({
        apiHealthy: false,
        localFilesAccessible: false,
        reportSync: false,
        cacheStats: { hits: 0, misses: 0, size: 0, hitRate: 0 },
        reportCount: 0,
        lastSync: 'Unknown',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        issues: ['Health check failed completely']
      });
    } finally {
      setLoading(false);
    }
  };

  const checkReportSyncStatus = async (): Promise<{ healthy: boolean; lastSync: string }> => {
    try {
      const response = await fetch('/data/langgraph-reports/.sync-info.json');
      if (response.ok) {
        const syncInfo = await response.json();
        return {
          healthy: true,
          lastSync: syncInfo.lastSync || 'Unknown'
        };
      }
    } catch (error) {
      console.warn('Could not load sync info:', error);
    }
    
    return {
      healthy: false,
      lastSync: 'Unknown'
    };
  };

  const getReportCount = async (): Promise<number> => {
    try {
      const response = await fetch('/data/langgraph-reports/.sync-info.json');
      if (response.ok) {
        const syncInfo = await response.json();
        return syncInfo.totalReports || 0;
      }
    } catch (error) {
      console.warn('Could not get report count:', error);
    }
    
    return 0;
  };

  const handlePreloadReports = async () => {
    try {
      setLoading(true);
      await preloadCommonReports();
      await checkHealth(); // Refresh health status
    } catch (error) {
      console.error('Failed to preload reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    reportCache.clear();
    checkHealth(); // Refresh to show updated cache stats
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);


  const getStatusVariant = (healthy: boolean | undefined): "default" | "destructive" | "secondary" => {
    if (healthy === true) return 'default';
    if (healthy === false) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Health Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor the health of your report generation and delivery pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreloadReports}
            disabled={loading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Preload Reports
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            <Database className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <HealthItem
              icon={<Network className="h-5 w-5" />}
              label="Backend API"
              healthy={health?.apiHealthy}
              loading={loading}
            />
            <HealthItem
              icon={<FileText className="h-5 w-5" />}
              label="Local Files"
              healthy={health?.localFilesAccessible}
              loading={loading}
            />
            <HealthItem
              icon={<RefreshCw className="h-5 w-5" />}
              label="Report Sync"
              healthy={health?.reportSync}
              loading={loading}
            />
            <HealthItem
              icon={<Database className="h-5 w-5" />}
              label="Cache System"
              healthy={health ? health.cacheStats.size > 0 : undefined}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Report Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Reports</span>
              <span className="text-2xl font-bold">{health?.reportCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Sync</span>
              <span className="text-sm">
                {health?.lastSync ? new Date(health.lastSync).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cache Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hit Rate</span>
              <span className="text-2xl font-bold">
                {health ? (health.cacheStats.hitRate * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cached Items</span>
              <span className="text-sm">{health?.cacheStats.size || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cache Hits</span>
              <span className="text-sm text-green-600">{health?.cacheStats.hits || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cache Misses</span>
              <span className="text-sm text-red-600">{health?.cacheStats.misses || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Check</span>
              <span className="text-sm">{lastRefresh.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={getStatusVariant(health?.apiHealthy)}>
                {health ? (health.issues.length === 0 ? 'Healthy' : 'Issues Detected') : 'Checking'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues and Errors */}
      {health && (health.issues.length > 0 || health.errors.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-amber-600">Issues Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.issues.map((issue, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>{issue}</span>
                </div>
              ))}
              {health.errors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HealthItem({ 
  icon, 
  label, 
  healthy, 
  loading 
}: {
  icon: React.ReactNode;
  label: string;
  healthy?: boolean;
  loading: boolean;
}) {
  return (
    <div className="text-center space-y-2">
      <div className="flex justify-center items-center gap-2">
        {icon}
        {getStatusIcon(healthy, loading)}
      </div>
      <div className="space-y-1">
        <div className="font-medium text-sm">{label}</div>
        <Badge variant={getStatusVariant(healthy)}>
          {getStatusText(healthy, loading)}
        </Badge>
      </div>
    </div>
  );
}

function getStatusIcon(healthy: boolean | undefined, loading: boolean) {
  if (loading) return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
  if (healthy === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (healthy === false) return <XCircle className="h-4 w-4 text-red-500" />;
  return <AlertCircle className="h-4 w-4 text-yellow-500" />;
}

function getStatusText(healthy: boolean | undefined, loading: boolean) {
  if (loading) return 'Checking...';
  if (healthy === true) return 'Healthy';
  if (healthy === false) return 'Down';
  return 'Unknown';
}

function getStatusVariant(healthy: boolean | undefined): "default" | "destructive" | "secondary" {
  if (healthy === true) return 'default';
  if (healthy === false) return 'destructive';
  return 'secondary';
}