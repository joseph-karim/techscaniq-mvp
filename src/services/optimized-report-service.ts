interface ReportCache {
  [key: string]: {
    data: any
    timestamp: number
    expiry: number
  }
}

interface LoadReportOptions {
  useCache?: boolean
  isDemo?: boolean
}

class OptimizedReportService {
  private cache: ReportCache = {}
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private abortControllers: Map<string, AbortController> = new Map()

  async loadReport(reportId: string, options: LoadReportOptions = {}): Promise<any> {
    const { useCache = true, isDemo = false } = options

    // Check cache first
    if (useCache && this.cache[reportId]) {
      const cached = this.cache[reportId]
      if (Date.now() < cached.timestamp + cached.expiry) {
        return cached.data
      }
    }

    // Cancel any existing request for this report
    this.cancelRequest(reportId)

    // Create new abort controller for this request
    const abortController = new AbortController()
    this.abortControllers.set(reportId, abortController)

    try {
      // Try primary API
      const response = await fetch(`/api/reports/${reportId}`, {
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Cache successful response
      if (useCache) {
        this.cache[reportId] = {
          data,
          timestamp: Date.now(),
          expiry: this.CACHE_DURATION
        }
      }

      return data
    } catch (error: any) {
      // Don't handle aborted requests as errors
      if (error.name === 'AbortError') {
        throw error
      }

      // Fallback for demo reports
      if (isDemo) {
        return this.loadDemoReportFallback(reportId)
      }
      
      throw error
    } finally {
      // Clean up abort controller
      this.abortControllers.delete(reportId)
    }
  }

  private async loadDemoReportFallback(reportId: string): Promise<any> {
    // Local fallback for demo reports
    try {
      const response = await fetch(`/demo-reports/${reportId}.json`)
      if (response.ok) {
        return response.json()
      }
    } catch (error) {
      console.warn('Demo fallback failed:', error)
    }

    // Return minimal demo structure if all else fails
    return {
      id: reportId,
      company_name: 'Demo Company',
      report_type: 'demo',
      status: 'completed',
      created_at: new Date().toISOString(),
      metadata: { isDemo: true },
      thesis: {
        company: 'Demo Company',
        statement: 'This is a demonstration report',
        type: 'demo',
        pillars: []
      },
      evidence: [],
      report: {
        executiveSummary: 'This is a demonstration report for training purposes.',
        sections: []
      }
    }
  }

  cancelRequest(reportId: string) {
    const controller = this.abortControllers.get(reportId)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(reportId)
    }
  }

  clearCache() {
    this.cache = {}
  }

  invalidateReport(reportId: string) {
    delete this.cache[reportId]
  }

  getCachedReport(reportId: string): any | null {
    const cached = this.cache[reportId]
    if (cached && Date.now() < cached.timestamp + cached.expiry) {
      return cached.data
    }
    return null
  }

  preloadReports(reportIds: string[]) {
    // Preload multiple reports in parallel
    return Promise.allSettled(
      reportIds.map(id => this.loadReport(id, { useCache: true }))
    )
  }
}

export const reportService = new OptimizedReportService()