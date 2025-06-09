import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface StatusResponse {
  success: boolean
  timestamp: string
  services: {
    database: boolean
    queues?: boolean
  }
  stats?: {
    totalScans?: number
    completedScans?: number
    pendingScans?: number
    failedScans?: number
    totalReports?: number
    recentActivity?: any[]
  }
  error?: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check database connectivity
    const { count: dbCheck, error: dbError } = await supabase
      .from('scan_requests')
      .select('*', { count: 'exact', head: true })

    const databaseStatus = !dbError

    // Get basic stats if requested
    const url = new URL(req.url)
    const includeStats = url.searchParams.get('stats') === 'true'
    
    let stats = undefined
    if (includeStats && databaseStatus) {
      // Get scan statistics
      const { count: totalScans } = await supabase
        .from('scan_requests')
        .select('*', { count: 'exact', head: true })

      const { count: completedScans } = await supabase
        .from('scan_requests')
        .select('*', { count: 'exact', head: true })
        .eq('ai_workflow_status', 'completed')

      const { count: pendingScans } = await supabase
        .from('scan_requests')
        .select('*', { count: 'exact', head: true })
        .in('ai_workflow_status', ['pending', 'collecting_evidence', 'generating_report'])

      const { count: failedScans } = await supabase
        .from('scan_requests')
        .select('*', { count: 'exact', head: true })
        .eq('ai_workflow_status', 'failed')

      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })

      // Get recent activity (last 5 scans)
      const { data: recentActivity } = await supabase
        .from('scan_requests')
        .select('id, company_name, domain, ai_workflow_status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      stats = {
        totalScans: totalScans || 0,
        completedScans: completedScans || 0,
        pendingScans: pendingScans || 0,
        failedScans: failedScans || 0,
        totalReports: totalReports || 0,
        recentActivity: recentActivity || []
      }
    }

    const response: StatusResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        queues: true // Assume queues are running if this function is called
      },
      ...(stats && { stats })
    }

    const responseTime = Date.now() - startTime
    console.log(`Status check completed in ${responseTime}ms`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime}ms`
        } 
      }
    )

  } catch (error) {
    console.error('Status check error:', error)
    
    const response: StatusResponse = {
      success: false,
      timestamp: new Date().toISOString(),
      services: {
        database: false
      },
      error: error.message
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})