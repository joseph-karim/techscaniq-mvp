import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { createScanJob, getJobStatus, getQueueMetrics } from '../../lib/queues/scan-queue.js'

const router = Router()

// Initialize Supabase with lazy loading
let supabase: ReturnType<typeof createClient>

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    }
    
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

// Create a new scan with background processing
router.post('/api/scans', async (req: any, res: any) => {
  try {
    const {
      company_name,
      website_url,
      primary_criteria,
      thesis_tags,
      requestor_name,
      organization_name,
      company_description,
      investment_thesis_data,
    } = req.body
    
    // Validate required fields
    if (!company_name || !website_url) {
      return res.status(400).json({
        error: 'Company name and website URL are required',
      })
    }
    
    // Create scan request in database
    const { data: scanRequest, error: dbError } = await getSupabase()
      .from('scan_requests')
      .insert({
        company_name,
        website_url,
        primary_criteria,
        thesis_tags,
        requestor_name,
        organization_name,
        company_description,
        investment_thesis_data,
        status: 'pending',
        ai_workflow_status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({
        error: 'Failed to create scan request',
        details: dbError.message,
      })
    }
    
    // Create background jobs
    const { evidenceJobId, reportJobId } = await createScanJob(scanRequest)
    
    // Update scan request with job IDs
    await getSupabase()
      .from('scan_requests')
      .update({
        metadata: {
          evidenceJobId,
          reportJobId,
        } as any,
      })
      .eq('id', scanRequest.id as string)
    
    res.status(201).json({
      success: true,
      scanRequestId: scanRequest.id,
      jobs: {
        evidenceJobId,
        reportJobId,
      },
      message: 'Scan request created and processing started',
    })
    
  } catch (error) {
    console.error('Error creating scan:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Get scan status with job progress
router.get('/api/scans/:id/status', async (req: any, res: any) => {
  try {
    const { id } = req.params
    
    // Get scan request
    const { data: scanRequest, error: dbError } = await getSupabase()
      .from('scan_requests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (dbError || !scanRequest) {
      return res.status(404).json({
        error: 'Scan request not found',
      })
    }
    
    // Get job statuses if available
    let evidenceJobStatus = null
    let reportJobStatus = null
    
    const metadata = scanRequest.metadata as any
    if (metadata?.evidenceJobId) {
      evidenceJobStatus = await getJobStatus(
        metadata.evidenceJobId,
        'evidence-collection'
      )
    }
    
    if (metadata?.reportJobId) {
      reportJobStatus = await getJobStatus(
        metadata.reportJobId,
        'report-generation'
      )
    }
    
    // Get evidence count
    const { count: evidenceCount } = await getSupabase()
      .from('evidence_items')
      .select('*', { count: 'exact', head: true })
      .eq('scan_request_id', id)
    
    // Get report if exists
    const { data: report } = await getSupabase()
      .from('reports')
      .select('id, investment_score, status')
      .eq('scan_request_id', id)
      .single()
    
    res.json({
      scanRequest: {
        id: scanRequest.id,
        company: scanRequest.company_name,
        status: scanRequest.status,
        createdAt: scanRequest.created_at,
      },
      progress: {
        evidenceCollection: {
          status: evidenceJobStatus?.state || 'pending',
          progress: evidenceJobStatus?.progress || 0,
          itemsCollected: evidenceCount || 0,
        },
        reportGeneration: {
          status: reportJobStatus?.state || 'pending',
          progress: reportJobStatus?.progress || 0,
          reportId: report?.id,
          investmentScore: report?.investment_score,
        },
      },
      jobs: {
        evidence: evidenceJobStatus,
        report: reportJobStatus,
      },
    })
    
  } catch (error) {
    console.error('Error getting scan status:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Get queue metrics for admin dashboard
router.get('/api/admin/queue-metrics', async (_req: any, res: any) => {
  try {
    const metrics = await getQueueMetrics()
    
    res.json({
      queues: metrics,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('Error getting queue metrics:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Retry a failed job
router.post('/api/scans/:id/retry', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { jobType } = req.body // 'evidence' or 'report'
    
    // Get scan request
    const { data: scanRequest, error: dbError } = await getSupabase()
      .from('scan_requests')
      .select('*')
      .eq('id', id)
      .single()
    
    if (dbError || !scanRequest) {
      return res.status(404).json({
        error: 'Scan request not found',
      })
    }
    
    // Create new job based on type
    if (jobType === 'evidence' || jobType === 'both') {
      const { evidenceJobId, reportJobId } = await createScanJob(scanRequest)
      
      // Update scan request with new job IDs
      await getSupabase()
        .from('scan_requests')
        .update({
          status: 'processing',
          metadata: {
            ...(scanRequest.metadata || {}),
            evidenceJobId,
            reportJobId,
            retryCount: ((scanRequest.metadata as any)?.retryCount || 0) + 1,
          } as any,
        })
        .eq('id', id)
      
      res.json({
        success: true,
        message: 'Jobs restarted',
        jobs: {
          evidenceJobId,
          reportJobId,
        },
      })
    } else {
      res.status(400).json({
        error: 'Invalid job type',
        message: 'Job type must be "evidence" or "both"',
      })
    }
    
  } catch (error) {
    console.error('Error retrying scan:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router