// Service for loading LangGraph-generated reports
import { API_BASE_URL } from '@/lib/api-client'
import { reportCache } from './report-cache'

interface LangGraphReport {
  thesis: {
    id: string
    company: string
    website: string
    statement: string
    type: string
    pillars: Array<{
      id: string
      name: string
      weight: number
      description?: string
    }>
  }
  evidence: Array<{
    id: string
    researchQuestionId: string
    pillarId: string
    source: {
      type: string
      name: string
      url?: string
      credibilityScore: number
      publishDate?: string
      author?: string
    }
    content: string
    metadata?: {
      extractedAt?: string
      extractionMethod?: string
      wordCount?: number
      language?: string
      keywords?: string[]
      confidence?: number
    }
    qualityScore: {
      overall: number
      components?: {
        relevance: number
        credibility: number
        recency: number
        specificity: number
        bias: number
        depth?: number
      }
      reasoning?: string
    }
    createdAt?: string
  }>
  report: {
    executiveSummary?: string
    techHealthScore?: number
    techHealthGrade?: string
    investmentScore?: number
    recommendation?: {
      decision: string
      confidence: number
      keyDrivers: string[]
      risks: string[]
      nextSteps: string[]
      timeline?: string
    }
    technicalAssessment?: {
      architecture: { score: number; findings: string[] }
      scalability: { score: number; findings: string[] }
      security: { score: number; findings: string[] }
      teamCapability: { score: number; findings: string[] }
      codeQuality: { score: number; findings: string[] }
      infrastructure: { score: number; findings: string[] }
    }
    sections: Array<{
      title: string
      content: string
      confidence?: number
      citations?: string[]
      riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    }>
    metadata?: {
      confidenceLevel?: string
      inferenceApproach?: string
      informationGatheringRecommendations?: string[]
    }
  }
  metadata?: {
    evidenceCount: number
    averageQualityScore: number
    reportGeneratedAt?: string
    vendorContext?: any
    thesisContext?: any
  }
}

// Enhanced API implementation with retry logic
export async function loadLangGraphReport(reportId: string, signal?: AbortSignal): Promise<LangGraphReport | null> {
  // Convert reportId to proper format if needed
  let apiReportId = reportId;
  if (reportId === 'cibc-adobe-sales-2024') {
    // For demo, we might need to check if there's an actual UUID for this report
    // For now, let the API handle it
  }

  try {
    const response = await fetch(`${API_BASE_URL}/langgraph/${apiReportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      signal,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      if (response.status === 202) {
        const data = await response.json()
        throw new Error(`Report is still being generated. Status: ${data.status}, Progress: ${data.progress}%`)
      }
      throw new Error(`Failed to load report: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading LangGraph report:', error)
    throw error
  }
}

// Generate a new LangGraph report
export async function generateLangGraphReport(params: {
  company: string
  website: string
  reportType: 'sales-intelligence' | 'pe-due-diligence'
  vendorContext?: {
    vendor: string
    products?: string[]
    useCase?: string
  }
  thesisContext?: {
    investmentThesis?: string
    keyQuestions?: string[]
    focusAreas?: string[]
  }
  metadata?: Record<string, any>
}): Promise<{ reportId: string; status: string; message: string; estimatedTime: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/langgraph/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Failed to generate report: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error generating LangGraph report:', error)
    throw error
  }
}

// Check report generation status
export async function checkReportStatus(reportId: string): Promise<{
  reportId: string
  status: string
  progress: number
  currentPhase: string
  evidenceCount: number
  lastUpdated: string
  estimatedTimeRemaining: string
  error?: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/langgraph/${reportId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to check report status: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking report status:', error)
    throw error
  }
}

// List available reports
export async function listLangGraphReports(params?: {
  reportType?: 'sales-intelligence' | 'pe-due-diligence'
  status?: 'processing' | 'completed' | 'failed'
  limit?: number
  offset?: number
}): Promise<{ reports: any[]; total: number }> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.reportType) queryParams.append('reportType', params.reportType)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())

    const response = await fetch(`${API_BASE_URL}/langgraph/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to list reports: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error listing LangGraph reports:', error)
    throw error
  }
}

/**
 * Enhanced report loading with comprehensive error handling, retry logic, and caching
 */
export async function loadLangGraphReportWithFallback(reportId: string): Promise<LangGraphReport | null> {
  console.log(`🔍 Loading report: ${reportId}`);
  
  // Check cache first
  const cached = reportCache.get(reportId);
  if (cached) {
    return cached;
  }

  // Define fallback sources
  const demoReports: Record<string, string> = {
    '9f8e7d6c-5b4a-3210-fedc-ba9876543210': '/data/langgraph-reports/9f8e7d6c-5b4a-3210-fedc-ba9876543210.json',
    'cibc-adobe-sales-2024': '/data/langgraph-reports/9f8e7d6c-5b4a-3210-fedc-ba9876543210.json',
    'cibc-latest-2025-06-21': '/data/langgraph-reports/cibc-latest-2025-06-21.json',
    'cibc-adobe-integrated-2025-06-21': '/data/langgraph-reports/cibc-latest-2025-06-21.json'
  };

  const localReportPaths = [
    `/data/langgraph-reports/${reportId}.json`,
    `/data/langgraph-reports/cibc-latest-${reportId}.json`,
    `/data/langgraph-reports/cibc-adobe-integrated-${reportId}.json`
  ];

  // Enhanced retry logic with exponential backoff
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 API attempt ${attempt}/${maxRetries} for report ${reportId}`);
      
      // Create abort controller with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000 + (attempt * 5000)); // Increasing timeout
      
      try {
        const report = await loadLangGraphReport(reportId, controller.signal);
        clearTimeout(timeoutId);
        
        if (report) {
          console.log(`✅ Successfully loaded report ${reportId} from API`);
          reportCache.set(reportId, report, 5 * 60 * 1000, 'api'); // Cache for 5 minutes
          return report;
        }
      } catch (apiError: any) {
        clearTimeout(timeoutId);
        
        // Handle specific error types
        if (apiError.name === 'AbortError') {
          console.warn(`⏰ API request timeout for report ${reportId} (attempt ${attempt})`);
        } else if (apiError.message?.includes('Failed to fetch')) {
          console.warn(`🚫 Network error for report ${reportId} (attempt ${attempt}):`, apiError.message);
        } else {
          console.error(`❌ API error for report ${reportId} (attempt ${attempt}):`, apiError.message);
        }
        
        // Don't retry on the last attempt, fall through to fallbacks
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw apiError;
      }
      
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error(`💥 All API attempts failed for report ${reportId}`);
        break; // Exit retry loop and try fallbacks
      }
    }
  }

  // Try predefined demo reports first
  if (demoReports[reportId]) {
    console.log(`📁 Attempting to load demo report from: ${demoReports[reportId]}`);
    try {
      const response = await fetch(demoReports[reportId]);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully loaded demo report ${reportId} from local file`);
        reportCache.set(reportId, data, 10 * 60 * 1000, 'local'); // Cache for 10 minutes
        return data;
      } else {
        console.warn(`⚠️ Demo report file not found or inaccessible: ${response.status}`);
      }
    } catch (localError) {
      console.error(`❌ Failed to load demo report:`, localError);
    }
  }

  // Try various local file paths as fallback
  for (const path of localReportPaths) {
    console.log(`📁 Attempting fallback path: ${path}`);
    try {
      const response = await fetch(path);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully loaded report ${reportId} from fallback path: ${path}`);
        reportCache.set(reportId, data, 10 * 60 * 1000, 'fallback');
        return data;
      }
    } catch (fallbackError) {
      console.debug(`Fallback path ${path} failed:`, fallbackError.message);
    }
  }

  // Final error with detailed diagnostics
  console.error(`💥 Complete failure to load report ${reportId}`);
  console.error('Diagnostics:');
  console.error('- API_BASE_URL:', API_BASE_URL);
  console.error('- Attempted paths:', localReportPaths);
  console.error('- Demo paths:', Object.values(demoReports));
  
  // Provide detailed error message for debugging
  const errorDetails = {
    reportId,
    apiUrl: `${API_BASE_URL}/langgraph/${reportId}`,
    attemptedPaths: localReportPaths,
    demoPath: demoReports[reportId],
    timestamp: new Date().toISOString(),
    cacheStats: reportCache.getStats()
  };
  
  console.error('Error details:', errorDetails);
  
  throw new Error(`Failed to load report ${reportId} from all sources. Check console for detailed diagnostics.`);
}

/**
 * Preload commonly accessed reports
 */
export async function preloadCommonReports(): Promise<void> {
  const commonReports = [
    'cibc-latest-2025-06-21',
    '9f8e7d6c-5b4a-3210-fedc-ba9876543210'
  ];
  
  console.log('🔄 Preloading common reports...');
  
  await Promise.allSettled(
    commonReports.map(async (reportId) => {
      try {
        await loadLangGraphReportWithFallback(reportId);
      } catch (error) {
        console.warn(`Failed to preload report ${reportId}:`, error);
      }
    })
  );
}

/**
 * Health check for report loading system
 */
export async function checkReportSystemHealth(): Promise<{
  apiHealthy: boolean;
  localFilesAccessible: boolean;
  cacheStats: any;
  issues: string[];
}> {
  const issues: string[] = [];
  let apiHealthy = false;
  let localFilesAccessible = false;

  // Test API health
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_BASE_URL}/langgraph/health`, {
      signal: controller.signal
    });
    apiHealthy = response.ok;
    if (!apiHealthy) {
      issues.push(`API health check failed: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    issues.push(`API health check error: ${error.message}`);
  }

  // Test local file access
  try {
    const response = await fetch('/data/langgraph-reports/cibc-latest-2025-06-21.json');
    localFilesAccessible = response.ok;
    if (!localFilesAccessible) {
      issues.push(`Local files not accessible: ${response.status}`);
    }
  } catch (error: any) {
    issues.push(`Local file access error: ${error.message}`);
  }

  return {
    apiHealthy,
    localFilesAccessible,
    cacheStats: reportCache.getStats(),
    issues
  };
}