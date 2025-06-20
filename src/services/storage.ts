export interface LangGraphReportState {
  reportId: string
  company: string
  website: string
  reportType: 'sales-intelligence' | 'pe-due-diligence'
  status: 'processing' | 'interpreting_thesis' | 'gathering_evidence' | 'evaluating_quality' | 'generating_report' | 'completed' | 'failed'
  createdAt: Date
  updatedAt?: Date
  completedAt?: Date
  error?: string
  thesis?: any
  evidence?: any[]
  report?: any
  metadata?: any
}

export class StorageService {
  private reports: Map<string, LangGraphReportState> = new Map()

  async saveLangGraphReport(reportId: string, state: Partial<LangGraphReportState>) {
    const existingReport = this.reports.get(reportId)

    if (existingReport) {
      const updatedReport = {
        ...existingReport,
        ...state,
        updatedAt: new Date()
      }
      this.reports.set(reportId, updatedReport)
      return updatedReport
    } else {
      const newReport = {
        ...state,
        reportId,
        createdAt: new Date()
      } as LangGraphReportState
      this.reports.set(reportId, newReport)
      return newReport
    }
  }

  async loadLangGraphReport(reportId: string): Promise<LangGraphReportState | null> {
    return this.reports.get(reportId) || null
  }

  async listLangGraphReports(options: {
    reportType?: 'sales-intelligence' | 'pe-due-diligence'
    status?: string
    limit?: number
    offset?: number
  }) {
    const { reportType, status, limit = 20, offset = 0 } = options

    let filteredReports = Array.from(this.reports.values())

    if (reportType) {
      filteredReports = filteredReports.filter(r => r.reportType === reportType)
    }
    if (status) {
      filteredReports = filteredReports.filter(r => r.status === status)
    }

    filteredReports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const total = filteredReports.length
    const reports = filteredReports.slice(offset, offset + limit)

    return { reports, total }
  }
}