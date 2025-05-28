import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface EvidenceRequest {
  companyName: string
  companyWebsite: string
  depth?: 'shallow' | 'deep' | 'comprehensive'
}

interface Evidence {
  id: string
  type: string
  source: {
    url?: string
    query?: string
    tool?: string
    timestamp: string
  }
  content: {
    raw: string
    processed?: string
    summary?: string
  }
  metadata?: {
    relevance?: number
    confidence?: number
    [key: string]: any
  }
}

// Call another Supabase function with timeout
async function callSupabaseFunction(functionName: string, payload: any, timeout = 30000): Promise<any> {
  const baseUrl = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`Function ${functionName} failed: ${JSON.stringify(data)}`)
    }
    
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Function ${functionName} timed out after ${timeout}ms`)
    }
    throw error
  }
}

// Generate unique ID
function generateId(): string {
  return crypto.randomUUID()
}

// Helper function to classify evidence
function getClassifications(evidence: Evidence): Array<{ category: string; score: number }> {
  const classifications: Array<{ category: string; score: number }> = []
  
  // Technology classification
  if (evidence.type === 'technology_stack' || 
      evidence.type === 'deep_crawl' ||
      evidence.metadata?.technologies || 
      evidence.content.raw?.includes('technology') ||
      evidence.content.raw?.includes('framework')) {
    classifications.push({ category: 'technology', score: 0.9 })
  }
  
  // Security classification
  if (evidence.type === 'security_analysis' || 
      evidence.type === 'ssl_analysis' ||
      evidence.type === 'vulnerability_scan' ||
      evidence.content.raw?.includes('security') ||
      evidence.content.raw?.includes('vulnerability')) {
    classifications.push({ category: 'security', score: 0.95 })
  }
  
  // Infrastructure classification
  if (evidence.type === 'performance_metrics' ||
      evidence.type === 'network_analysis' ||
      evidence.content.raw?.includes('infrastructure') ||
      evidence.content.raw?.includes('server') ||
      evidence.content.raw?.includes('hosting')) {
    classifications.push({ category: 'infrastructure', score: 0.85 })
  }
  
  // Team classification
  if (evidence.type === 'team_info' ||
      evidence.type === 'business_search' && evidence.source.query?.includes('team') ||
      evidence.content.raw?.includes('team') ||
      evidence.content.raw?.includes('employee') ||
      evidence.content.raw?.includes('founder')) {
    classifications.push({ category: 'team', score: 0.8 })
  }
  
  // Market classification
  if (evidence.type === 'market_analysis' ||
      evidence.type === 'business_search' && evidence.source.query?.includes('market') ||
      evidence.content.raw?.includes('market') ||
      evidence.content.raw?.includes('competitor') ||
      evidence.content.raw?.includes('industry')) {
    classifications.push({ category: 'market', score: 0.8 })
  }
  
  // Financial classification
  if (evidence.type === 'financial_info' ||
      evidence.type === 'business_search' && evidence.source.query?.includes('funding') ||
      evidence.content.raw?.includes('revenue') ||
      evidence.content.raw?.includes('funding') ||
      evidence.content.raw?.includes('investment')) {
    classifications.push({ category: 'financial', score: 0.85 })
  }
  
  // Default to general if no specific classification
  if (classifications.length === 0) {
    classifications.push({ category: 'general', score: 0.7 })
  }
  
  return classifications
}

// Helper function to create evidence objects
function createEvidence(type: string, category: string, data: any): Evidence {
  return {
    id: generateId(),
    type,
    source: {
      url: data.url,
      query: data.query,
      tool: data.source,
      timestamp: new Date().toISOString()
    },
    content: {
      raw: JSON.stringify(data),
      processed: data.summary || '',
      summary: data.title || `${type} evidence`
    },
    metadata: {
      relevance: 0.9,
      confidence: 0.85,
      category,
      ...data
    }
  }
}

// Main evidence collection orchestrator
async function collectAllEvidence(companyName: string, companyWebsite: string, depth: string): Promise<Evidence[]> {
  const allEvidence: Evidence[] = []
  
  console.log(`Starting comprehensive evidence collection for ${companyName}`)
  console.log(`Website: ${companyWebsite}`)
  console.log(`Depth: ${depth}`)
  
  // Phase 1: Basic content and business info (always run)
  const phase1Promises = []
  
  // Use HTML collector for main content
  phase1Promises.push(
    callSupabaseFunction('html-collector', {
      url: companyWebsite,
      options: {
        timeout: 15000,
        userAgent: 'TechScanIQ/1.0 (Investment Analysis Bot)'
      }
    }, 20000).then(result => {
      if (result?.success && result.html) {
        console.log('Got HTML from html-collector')
        return createEvidence('website_content', 'technology', {
          url: companyWebsite,
          html: result.html,
          metadata: result.metadata,
          source: 'html-collector'
        })
      }
      return null
    }).catch(err => {
      console.error('HTML collector failed:', err)
      return null
    })
  )

  // Use Google Search for business information
  phase1Promises.push(
    callSupabaseFunction('google-search-collector', {
      query: `${companyName} company information business overview`,
      companyName,
      companyWebsite,
      searchType: 'general',
      maxResults: 5
    }, 30000).then(result => {
      if (result?.success && result.results?.length > 0) {
        console.log('Got business info from Google Search')
        return createEvidence('business_overview', 'general', {
          query: result.query,
          results: result.results,
          searchMetadata: result.searchMetadata,
          source: 'google-search'
        })
      }
      return null
    }).catch(err => {
      console.error('Google Search for business info failed:', err)
      return null
    })
  )

  // Use Playwright crawler for technical analysis
  phase1Promises.push(
    callSupabaseFunction('playwright-crawler', {
      url: companyWebsite,
      depth: 1,
      options: {
        extractScripts: true,
        extractAPIs: true
      }
    }, 20000).then(result => {
      if (result?.success && result.results?.[0]) {
        console.log('Got technical data from Playwright crawler')
        return createEvidence('deep_crawl', 'technology', {
          url: companyWebsite,
          crawlData: result.results[0],
          source: 'playwright-crawler'
        })
      }
      return null
    }).catch(err => {
      console.error('Playwright crawler failed:', err)
      return null
    })
  )

  // Wait for Phase 1 to complete
  const phase1Results = await Promise.allSettled(phase1Promises)
  phase1Results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      allEvidence.push(result.value)
    }
  })

  // Phase 2: Technical analysis tools (always run)
  const phase2Promises = []
  
  // Get HTML first for tools that need it - try multiple sources
  const htmlPromise = (async (): Promise<{ html: string; source: string; metadata?: any; technologies?: any[] } | null> => {
    let htmlData: { html: string; source: string; metadata?: any; technologies?: any[] } | null = null
    
    // Try 1: HTML collector
    try {
      const htmlResult = await callSupabaseFunction('html-collector', {
        url: companyWebsite,
        options: { timeout: 15000 }
      }, 20000)
      
      if (htmlResult?.success && htmlResult.html) {
        console.log('Got HTML from html-collector for analysis')
        htmlData = { 
          html: htmlResult.html, 
          source: 'html-collector',
          metadata: htmlResult.metadata
        }
      }
    } catch (err) {
      console.error('HTML collector failed for analysis:', err)
    }
    
    // Try 2: Playwright crawler as fallback
    if (!htmlData) {
      try {
        const playwrightResult = await callSupabaseFunction('playwright-crawler', {
          url: companyWebsite,
          depth: 1,
          options: {
            extractScripts: true,
            extractAPIs: true
          }
        }, 20000)
        
        if (playwrightResult?.success && playwrightResult.results?.[0]?.html) {
          console.log('Got HTML from Playwright crawler as fallback')
          htmlData = { 
            html: playwrightResult.results[0].html, 
            source: 'playwright',
            technologies: playwrightResult.results[0].technologies || []
          }
        }
      } catch (err) {
        console.error('Playwright fallback failed:', err)
      }
    }
    
    return htmlData
  })()

  // Run Wappalyzer if we have HTML
  phase2Promises.push(
    htmlPromise.then(async (htmlData) => {
      if (htmlData?.html) {
        try {
          const wappalyzerResult = await callSupabaseFunction('wappalyzer-analyzer', {
            url: companyWebsite,
            html: htmlData.html
          }, 15000)
          
          if (wappalyzerResult?.success) {
            console.log('Wappalyzer analysis completed')
            return createEvidence('technology_stack', 'technology', {
              url: companyWebsite,
              technologies: wappalyzerResult.technologies || [],
              categories: wappalyzerResult.categories || [],
              htmlSource: htmlData.source,
              source: 'wappalyzer'
            })
          }
        } catch (err) {
          console.error('Wappalyzer failed:', err)
        }
      } else {
        console.log('No HTML available for Wappalyzer analysis')
      }
      return null
    })
  )

  // Security analysis
  phase2Promises.push(
    callSupabaseFunction('security-scanner', {
      url: companyWebsite,
      checks: ['headers', 'ssl', 'cookies']
    }, 15000).then(result => {
      if (result?.success) {
        console.log('Security analysis completed')
        return createEvidence('security_analysis', 'security', {
          url: companyWebsite,
          securityChecks: result.checks || {},
          grade: result.grade || 'Unknown',
          source: 'security-scanner'
        })
      }
      return null
    }).catch(err => {
      console.error('Security scanner failed:', err)
      return null
    })
  )

  // SSL analysis
  phase2Promises.push(
    callSupabaseFunction('ssl-analyzer', {
      hostname: new URL(companyWebsite).hostname
    }, 15000).then(result => {
      if (result?.success) {
        console.log('SSL analysis completed')
        return createEvidence('ssl_analysis', 'security', {
          hostname: new URL(companyWebsite).hostname,
          sslData: result.analysis || {},
          source: 'ssl-analyzer'
        })
      }
      return null
    }).catch(err => {
      console.error('SSL analyzer failed:', err)
      return null
    })
  )

  // Performance metrics (simulated)
  phase2Promises.push(
    callSupabaseFunction('lighthouse-simulator', {
      url: companyWebsite
    }, 15000).then(result => {
      if (result?.success) {
        console.log('Performance analysis completed')
        return createEvidence('performance_metrics', 'infrastructure', {
          url: companyWebsite,
          metrics: result.metrics || {},
          score: result.score || 0,
          source: 'lighthouse-simulator'
        })
      }
      return null
    }).catch(err => {
      console.error('Performance analyzer failed:', err)
      return null
    })
  )

  // Wait for Phase 2 to complete
  const phase2Results = await Promise.allSettled(phase2Promises)
  phase2Results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      allEvidence.push(result.value)
    }
  })

  // Phase 3: Advanced searches (based on depth)
  if (depth === 'comprehensive') {
    const phase3Promises = []

    // Team information search
    phase3Promises.push(
      callSupabaseFunction('google-search-collector', {
        query: `${companyName} founders team executives leadership`,
        companyName,
        companyWebsite,
        searchType: 'team',
        maxResults: 5
      }, 30000).then(result => {
        if (result?.success && result.results?.length > 0) {
          console.log('Got team info from Google Search')
          return createEvidence('team_info', 'team', {
            query: result.query,
            results: result.results,
            searchMetadata: result.searchMetadata,
            source: 'google-search'
          })
        }
        return null
      }).catch(err => {
        console.error('Google Search for team info failed:', err)
        return null
      })
    )

    // Market analysis search
    phase3Promises.push(
      callSupabaseFunction('google-search-collector', {
        query: `${companyName} market analysis competitors industry`,
        companyName,
        companyWebsite,
        searchType: 'market',
        maxResults: 5
      }, 30000).then(result => {
        if (result?.success && result.results?.length > 0) {
          console.log('Got market info from Google Search')
          return createEvidence('market_analysis', 'market', {
            query: result.query,
            results: result.results,
            searchMetadata: result.searchMetadata,
            source: 'google-search'
          })
        }
        return null
      }).catch(err => {
        console.error('Google Search for market info failed:', err)
        return null
      })
    )

    // Financial information search
    phase3Promises.push(
      callSupabaseFunction('google-search-collector', {
        query: `${companyName} funding revenue investment valuation`,
        companyName,
        companyWebsite,
        searchType: 'financial',
        maxResults: 5
      }, 30000).then(result => {
        if (result?.success && result.results?.length > 0) {
          console.log('Got financial info from Google Search')
          return createEvidence('financial_info', 'financial', {
            query: result.query,
            results: result.results,
            searchMetadata: result.searchMetadata,
            source: 'google-search'
          })
        }
        return null
      }).catch(err => {
        console.error('Google Search for financial info failed:', err)
        return null
      })
    )

    // Technology deep dive search
    phase3Promises.push(
      callSupabaseFunction('google-search-collector', {
        query: `${companyName} technology stack architecture engineering`,
        companyName,
        companyWebsite,
        searchType: 'technology',
        maxResults: 5
      }, 30000).then(result => {
        if (result?.success && result.results?.length > 0) {
          console.log('Got tech deep dive from Google Search')
          return createEvidence('tech_deep_dive', 'technology', {
            query: result.query,
            results: result.results,
            searchMetadata: result.searchMetadata,
            source: 'google-search'
          })
        }
        return null
      }).catch(err => {
        console.error('Google Search for tech deep dive failed:', err)
        return null
      })
    )

    // Vulnerability scanning
    phase3Promises.push(
      callSupabaseFunction('nuclei-scanner', {
        target: companyWebsite,
        templates: ['basic', 'security']
      }, 30000).then(result => {
        if (result?.success) {
          console.log('Vulnerability scan completed')
          return createEvidence('vulnerability_scan', 'security', {
            target: companyWebsite,
            findings: result.findings || [],
            summary: result.summary || {},
            source: 'nuclei-scanner'
          })
        }
        return null
      }).catch(err => {
        console.error('Nuclei scanner failed:', err)
        return null
      })
    )

    // Wait for Phase 3 to complete
    const phase3Results = await Promise.allSettled(phase3Promises)
    phase3Results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allEvidence.push(result.value)
      }
    })
  }

  console.log(`Evidence collection completed. Total pieces: ${allEvidence.length}`)
  return allEvidence
}

// Main handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const startTime = Date.now()
    const { companyName, companyWebsite, depth = 'deep' } = await req.json() as EvidenceRequest
    
    console.log(`Starting evidence collection v7 for ${companyName}`)
    
    // Collect all evidence using all available tools
    const evidence = await collectAllEvidence(companyName, companyWebsite, depth)
    
    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Create collection record
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: companyName,
        company_website: companyWebsite,
        evidence_count: evidence.length,
        status: 'completed',
        collection_type: depth,
        metadata: {
          evidenceTypes: [...new Set(evidence.map(e => e.type))],
          tools: [...new Set(evidence.map(e => e.source.tool))],
          duration: Date.now() - startTime
        }
      })
      .select()
      .single()
    
    if (collectionError) {
      console.error('Failed to store collection:', collectionError)
    } else if (collection) {
      // Store evidence items
      const evidenceItems = evidence.map(e => ({
        collection_id: collection.id,
        evidence_id: e.id,
        type: e.type,
        source_data: e.source,
        content_data: e.content,
        metadata: e.metadata || {},
        company_name: companyName,
        breadcrumbs: e.source.tool ? [{ tool: e.source.tool, timestamp: e.source.timestamp }] : [],
        classifications: getClassifications(e)
      }))
      
      const { error: itemsError } = await supabase
        .from('evidence_items')
        .insert(evidenceItems)
      
      if (itemsError) {
        console.error('Failed to store evidence items:', itemsError)
      }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Evidence collection complete. Total evidence: ${evidence.length}`)
    console.log(`Time taken: ${totalTime}ms`)
    console.log(`Tools used: ${[...new Set(evidence.map(e => e.source.tool))].join(', ')}`)
    
    // Add classifications to evidence before returning
    const evidenceWithClassifications = evidence.map(e => ({
      ...e,
      classifications: getClassifications(e)
    }))
    
    return new Response(JSON.stringify({
      success: true,
      evidence: evidenceWithClassifications,
      collectionId: collection?.id,
      summary: {
        total: evidence.length,
        byType: evidence.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        tools: [...new Set(evidence.map(e => e.source.tool))],
        duration: totalTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 