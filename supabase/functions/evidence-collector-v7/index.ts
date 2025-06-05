import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// CORS headers for handling cross-origin requests
const allowedOrigins = [
  'https://scan.techscaniq.com',
  'https://techscaniq.com', 
  'http://localhost:5173',
  'http://localhost:3000'
]

const getCorsHeaders = (origin: string | null) => {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  }
}


interface EvidenceRequest {
  companyName: string
  companyWebsite: string
  depth?: 'shallow' | 'deep' | 'comprehensive'
  investmentThesis?: {
    thesisType: string
    criteria: Array<{
      name: string
      weight: number
      description: string
    }>
    focusAreas: string[]
    scoreReweighting?: Record<string, { weight: number; change: string }>
  }
  evidenceTypes?: string[]
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
  _original_crypto_id?: string;
}

// Call another Supabase function with timeout
async function callSupabaseFunction(functionName: string, payload: any, timeout: number = 30000, req?: Request): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !anonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    throw new Error('Missing required environment variables for function calls')
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`
  
  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`
  }
  
  const response = await Promise.race([
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Function ${functionName} timed out after ${timeout}ms`)), timeout)
    ),
  ])

  const text = await response.text()
  let result
  try {
    result = text ? JSON.parse(text) : {}
  } catch {
    result = { success: false, error: text }
  }
  
  if (!response.ok || !result.success) {
    throw new Error(`Function ${functionName} failed: ${JSON.stringify(result)}`)
  }
  
  return result
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

// Determine evidence collection priorities based on investment thesis
function determinePrioritizedEvidenceTypes(investmentThesis?: EvidenceRequest['investmentThesis']): string[] {
  if (!investmentThesis) {
    return ['technical', 'security', 'team', 'financial', 'market'] // Default comprehensive collection
  }

  const thesisType = investmentThesis.thesisType
  const focusAreas = investmentThesis.focusAreas || []
  
  // Base evidence types for all thesis types
  let prioritizedTypes = ['technical', 'security', 'team']
  
  // Thesis-specific evidence prioritization
  switch (thesisType) {
    case 'accelerate-organic-growth':
      // Focus on scalability, dev velocity, market expansion
      prioritizedTypes = ['technical', 'infrastructure', 'devops', 'market', 'performance']
      if (focusAreas.includes('cloud-native')) prioritizedTypes.push('cloud_infrastructure')
      if (focusAreas.includes('scalable-architecture')) prioritizedTypes.push('architecture_analysis')
      break
      
    case 'buy-and-build':
      // Focus on integration readiness, API architecture
      prioritizedTypes = ['technical', 'api_analysis', 'architecture', 'integration_capabilities', 'team']
      if (focusAreas.includes('api-driven')) prioritizedTypes.push('api_documentation')
      if (focusAreas.includes('microservices')) prioritizedTypes.push('service_architecture')
      break
      
    case 'margin-expansion':
      // Focus on cost optimization, automation potential
      prioritizedTypes = ['infrastructure', 'cost_analysis', 'automation_opportunities', 'technical', 'operational_efficiency']
      if (focusAreas.includes('cloud-native')) prioritizedTypes.push('cloud_cost_analysis')
      if (focusAreas.includes('devops-maturity')) prioritizedTypes.push('deployment_automation')
      break
      
    case 'turnaround-distressed':
      // Focus on security gaps, technical debt, framework obsolescence
      prioritizedTypes = ['security', 'technical_debt', 'compliance_gaps', 'framework_analysis', 'team_risk']
      if (focusAreas.includes('security-focus')) prioritizedTypes.push('vulnerability_assessment')
      if (focusAreas.includes('modern-tech-stack')) prioritizedTypes.push('technology_modernization')
      break
      
    case 'carve-out':
      // Focus on dependencies, IP/licensing, separation complexity
      prioritizedTypes = ['dependency_analysis', 'licensing_review', 'architecture', 'separation_complexity', 'team']
      if (focusAreas.includes('microservices')) prioritizedTypes.push('service_separation')
      if (focusAreas.includes('api-driven')) prioritizedTypes.push('api_independence')
      break
      
    case 'geographic-vertical-expansion':
      // Focus on compliance, localization, multi-region support
      prioritizedTypes = ['compliance_analysis', 'internationalization', 'security', 'scalability', 'regulatory_requirements']
      if (focusAreas.includes('security-focus')) prioritizedTypes.push('compliance_certifications')
      if (focusAreas.includes('high-availability')) prioritizedTypes.push('regional_infrastructure')
      break
      
    case 'digital-transformation':
      // Focus on platform extensibility, modernization potential
      prioritizedTypes = ['architecture', 'extensibility_analysis', 'technical', 'integration_capabilities', 'modernization_assessment']
      if (focusAreas.includes('microservices')) prioritizedTypes.push('service_oriented_architecture')
      if (focusAreas.includes('api-driven')) prioritizedTypes.push('platform_apis')
      break
      
    default:
      // Custom thesis - use comprehensive collection with focus area hints
      prioritizedTypes = ['technical', 'security', 'team', 'financial', 'market']
      if (focusAreas.includes('security-focus')) prioritizedTypes.push('security_deep_dive')
      if (focusAreas.includes('scalable-architecture')) prioritizedTypes.push('scalability_assessment')
      break
  }
  
  // Remove duplicates and return prioritized list
  return [...new Set(prioritizedTypes)]
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
async function collectAllEvidence(
  companyName: string,
  companyWebsite: string,
  evidenceTypes: string[],
  depth: 'shallow' | 'deep' | 'comprehensive',
  req?: Request
): Promise<Evidence[]> {
  const allEvidence: Evidence[] = []
  
  console.log(`Starting comprehensive evidence collection for ${companyName}`)
  console.log(`Website: ${companyWebsite}`)
  console.log(`Depth: ${depth}`)
  
  // Phase 1: Basic content and business info (always run)
  const phase1Promises: Promise<Evidence | null>[] = []
  
  // Use HTML collector for main content
  phase1Promises.push(
    callSupabaseFunction('html-collector', {
      url: companyWebsite,
      options: {
        timeout: 15000,
        userAgent: 'TechScanIQ/1.0 (Investment Analysis Bot)'
      }
    }, 20000, req).then(result => {
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
    }, 30000, req).then(result => {
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
    }, 20000, req).then(result => {
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
  const phase2Promises: Promise<Evidence | null>[] = []
  
  // Get HTML first for tools that need it - try multiple sources
  const htmlPromise = (async (): Promise<{ html: string; source: string; metadata?: any; technologies?: any[] } | null> => {
    let htmlData: { html: string; source: string; metadata?: any; technologies?: any[] } | null = null
    
    // Try 1: HTML collector
    try {
      const htmlResult = await callSupabaseFunction('html-collector', {
        url: companyWebsite,
        options: { timeout: 15000 }
      }, 20000, req)
      
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
        }, 20000, req)
        
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
          const webtechResult = await callSupabaseFunction('webtech-analyzer', {
            url: companyWebsite,
            html: htmlData.html
          }, 15000, req)
          
          if (webtechResult?.success && webtechResult?.data) {
            console.log('WebTech + retire.js analysis completed')
            return createEvidence('technology_stack', 'technology', {
              url: companyWebsite,
              technologies: webtechResult.data.technologies || [],
              byCategory: webtechResult.data.byCategory || {},
              vulnerabilities: webtechResult.data.vulnerabilities || {},
              summary: webtechResult.data.summary || {},
              htmlSource: htmlData.source,
              source: 'webtech-analyzer'
            })
          }
        } catch (err) {
          console.error('WebTech analysis failed:', err)
        }
      } else {
        console.log('No HTML available for WebTech analysis')
      }
      return null
    })
  )

  // Security analysis
  phase2Promises.push(
    callSupabaseFunction('security-scanner', {
      url: companyWebsite,
      checks: ['headers', 'ssl', 'cookies']
    }, 15000, req).then(result => {
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
    callSupabaseFunction('testssl-scanner', {
      url: companyWebsite
    }, 15000, req).then(result => {
      if (result?.success) {
        console.log('SSL analysis completed')
        return createEvidence('ssl_analysis', 'security', {
          hostname: new URL(companyWebsite).hostname,
          sslData: result.data || {},
          source: 'testssl-scanner'
        })
      }
      return null
    }).catch(err => {
      console.error('SSL analyzer failed:', err)
      return null
    })
  )

  // Performance metrics
  phase2Promises.push(
    callSupabaseFunction('performance-analyzer', {
      url: companyWebsite,
      strategy: 'mobile'
    }, 30000, req).then(result => {
      if (result?.success && result?.data) {
        console.log('Performance analysis completed')
        return createEvidence('performance_metrics', 'infrastructure', {
          url: companyWebsite,
          metrics: result.data.metrics || {},
          audits: result.data.audits || [],
          opportunities: result.data.opportunities || [],
          strategy: result.data.strategy || 'mobile',
          lighthouseVersion: result.data.lighthouseVersion,
          source: 'performance-analyzer'
        })
      }
      return null
    }).catch(err => {
      console.error('Performance analyzer failed:', err)
      return null
    })
  )

  // Wait for HTML data to be available for nuclei scanner
  const htmlDataResult = await htmlPromise
  
  // Run nuclei scanner with HTML data if available (only in deep/comprehensive mode)
  if (depth !== 'shallow' && htmlDataResult?.html) {
    phase2Promises.push(
      callSupabaseFunction('nuclei-scanner', {
        url: companyWebsite,
        html: htmlDataResult.html,
        deep: depth === 'comprehensive'
      }, 30000, req).then(result => {
        if (result?.success && result?.data) {
          console.log('Vulnerability scan completed')
          return createEvidence('vulnerability_scan', 'security', {
            url: companyWebsite,
            vulnerabilities: result.data.vulnerabilities || [],
            summary: result.data.summary || {},
            scansPerformed: result.data.scansPerformed || [],
            source: 'nuclei-scanner'
          })
        }
        return null
      }).catch(err => {
        console.error('Nuclei scanner failed:', err)
        return null
      })
    )
  }
  
  // Wait for Phase 2 to complete
  const phase2Results = await Promise.allSettled(phase2Promises)
  phase2Results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      allEvidence.push(result.value)
    }
  })

  // Phase 3: Advanced searches (based on depth)
  if (depth === 'comprehensive') {
    const phase3Promises: Promise<Evidence | null>[] = []

    // Team information search
    phase3Promises.push(
      callSupabaseFunction('google-search-collector', {
        query: `${companyName} founders team executives leadership`,
        companyName,
        companyWebsite,
        searchType: 'team',
        maxResults: 5
      }, 30000, req).then(result => {
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
      }, 30000, req).then(result => {
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
      }, 30000, req).then(result => {
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
      }, 30000, req).then(result => {
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
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  try {
    const startTime = Date.now()
    const { companyName, companyWebsite, depth = 'deep', investmentThesis, evidenceTypes } = await req.json() as EvidenceRequest
    
    console.log(`Starting evidence collection v7 for ${companyName}`)
    if (investmentThesis) {
      console.log(`Using investment thesis: ${investmentThesis.thesisType}`)
      console.log(`Focus areas: ${investmentThesis.focusAreas.join(', ')}`)
    }
    
    // Determine evidence collection priorities based on investment thesis
    const prioritizedEvidenceTypes = evidenceTypes || determinePrioritizedEvidenceTypes(investmentThesis)
    
    // Collect all evidence using all available tools
    const collectedRawEvidence = await collectAllEvidence(companyName, companyWebsite, prioritizedEvidenceTypes, depth, req)
    
    // Store in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required Supabase environment variables')
      throw new Error('Missing required Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let collectionId: string | undefined = undefined;
    const successfullyStoredEvidence: Evidence[] = [];
    let collectionUpdateError: any = null;

    // Create collection record first
    const { data: collection, error: collectionError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: companyName,
        company_website: companyWebsite,
        evidence_count: 0, // Initialize with 0, will update later
        status: 'processing', // Initial status
        collection_type: depth,
        metadata: {
          attemptedEvidenceTypes: [...new Set(collectedRawEvidence.map(e => e.type))],
          attemptedTools: [...new Set(collectedRawEvidence.map(e => e.source.tool))],
          initialAttemptCount: collectedRawEvidence.length,
          duration: 0 // Will be updated later
        }
      })
      .select()
      .single()

    if (collectionError) {
      console.error('Failed to create initial evidence_collections record:', collectionError)
      throw new Error(`Failed to create evidence collection: ${collectionError.message}`);
    }
    
    collectionId = collection.id;
    console.log(`Created evidence_collections record with ID: ${collectionId}`);

    if (collectedRawEvidence.length > 0) {
      for (const rawEvidence of collectedRawEvidence) {
        const evidenceItemToInsert = {
          collection_id: collectionId,
          evidence_id: rawEvidence.id,
          type: rawEvidence.type,
          source_data: rawEvidence.source,
          content_data: rawEvidence.content,
          metadata: rawEvidence.metadata || {},
          company_name: companyName,
          breadcrumbs: rawEvidence.source.tool ? [{ tool: rawEvidence.source.tool, timestamp: rawEvidence.source.timestamp }] : [],
          classifications: getClassifications(rawEvidence)
        };

        const { data: insertedItemDataArray, error: itemInsertError } = await supabase
          .from('evidence_items')
          .insert(evidenceItemToInsert)
          .select('id, evidence_id')

        if (itemInsertError || !insertedItemDataArray || insertedItemDataArray.length === 0) {
          console.warn(`Failed to store evidence item with original ID ${rawEvidence.id} of type ${rawEvidence.type}:`, itemInsertError?.message || 'No data returned from insert');
        } else {
          const insertedItemData = insertedItemDataArray[0];
          successfullyStoredEvidence.push({
            ...rawEvidence,
            id: insertedItemData.id,
            _original_crypto_id: insertedItemData.evidence_id || rawEvidence.id
          });
        }
      }

      // Update the collection record with the actual count and status
      const { error: collectionUpdateItemsError } = await supabase
        .from('evidence_collections')
        .update({
          evidence_count: successfullyStoredEvidence.length,
          status: successfullyStoredEvidence.length > 0 ? 'completed' : 'failed',
          metadata: {
            ...collection.metadata,
            finalStoredCount: successfullyStoredEvidence.length,
            duration: Date.now() - startTime
          }
        })
        .eq('id', collectionId);

      if (collectionUpdateItemsError) {
        console.error('Failed to update evidence_collections record with final count:', collectionUpdateItemsError);
        collectionUpdateError = collectionUpdateItemsError;
      }
      
      if (successfullyStoredEvidence.length === 0 && collectedRawEvidence.length > 0) {
        throw new Error(`Evidence collection attempted ${collectedRawEvidence.length} items, but failed to store any. Last collection update error: ${collectionUpdateError?.message}`);
      }

    } else {
      const { error: emptyCollectionUpdateError } = await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          evidence_count: 0,
          metadata: {
            ...collection.metadata,
            finalStoredCount: 0,
            duration: Date.now() - startTime
          }
        })
        .eq('id', collectionId);
        if (emptyCollectionUpdateError) {
            console.error('Failed to update empty evidence_collections record:', emptyCollectionUpdateError);
        }
    }
    
    const totalTime = Date.now() - startTime
    console.log(`Evidence collection process complete. Successfully stored evidence: ${successfullyStoredEvidence.length} out of ${collectedRawEvidence.length} attempted.`)
    console.log(`Time taken: ${totalTime}ms`)
    console.log(`Tools used for successful items: ${[...new Set(successfullyStoredEvidence.map(e => e.source.tool))].join(', ')}`)
    
    // Add classifications to successfully stored evidence before returning
    const evidenceWithClassifications = successfullyStoredEvidence.map(e => ({
      ...e,
      classifications: getClassifications(e)
    }))
    
    return new Response(JSON.stringify({
      success: true,
      evidence: evidenceWithClassifications,
      collectionId: collectionId,
      summary: {
        total: successfullyStoredEvidence.length,
        byType: successfullyStoredEvidence.reduce((acc, e) => {
          acc[e.type] = (acc[e.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        tools: [...new Set(successfullyStoredEvidence.map(e => e.source.tool))],
        duration: totalTime,
        attemptedCount: collectedRawEvidence.length,
        successCount: successfullyStoredEvidence.length
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