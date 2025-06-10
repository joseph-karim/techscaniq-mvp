import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'

// Load environment variables
config()

interface EvidenceCollectionJob {
  scanRequestId: string
  company: string
  domain: string
  depth: 'basic' | 'comprehensive'
  investmentThesis: string
}

interface EvidenceItem {
  url: string
  title: string
  content: string
  type: string
  metadata: any
}

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// REAL data collection using actual APIs
async function collectWebContent(domain: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  
  try {
    // Use Jina AI to get clean, readable content
    console.log(`Fetching content from ${domain} using Jina...`)
    const jinaResponse = await fetch(`https://r.jina.ai/https://${domain}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'json'
      }
    })
    
    if (jinaResponse.ok) {
      const data = await jinaResponse.json()
      evidence.push({
        url: `https://${domain}`,
        title: data.title || 'Homepage',
        content: data.content || '',
        type: 'homepage',
        metadata: {
          tool: 'jina',
          description: data.description,
          siteName: data.siteName,
          publishedTime: data.publishedTime
        }
      })
    }
    
    // Try to fetch key pages
    const importantPages = ['/about', '/team', '/pricing', '/careers', '/blog']
    for (const page of importantPages) {
      try {
        const pageResponse = await fetch(`https://r.jina.ai/https://${domain}${page}`, {
          headers: {
            'Accept': 'application/json',
            'X-Return-Format': 'json'
          }
        })
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json()
          evidence.push({
            url: `https://${domain}${page}`,
            title: pageData.title || page,
            content: pageData.content || '',
            type: page.slice(1), // Remove leading slash
            metadata: {
              tool: 'jina',
              path: page
            }
          })
        }
      } catch (err) {
        // Page might not exist, continue
      }
    }
  } catch (error) {
    console.error('Error collecting web content:', error)
  }
  
  return evidence
}

async function collectTechStack(domain: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  
  try {
    // Use BuiltWith API if available
    if (process.env.BUILTWITH_API_KEY) {
      const builtWithUrl = `https://api.builtwith.com/v21/api.json?KEY=${process.env.BUILTWITH_API_KEY}&LOOKUP=${domain}`
      const response = await fetch(builtWithUrl)
      
      if (response.ok) {
        const data = await response.json()
        evidence.push({
          url: `https://${domain}`,
          title: 'Technology Stack Analysis',
          content: JSON.stringify(data.Results?.[0]?.Result?.Paths?.[0]?.Technologies || []),
          type: 'tech_stack',
          metadata: {
            tool: 'builtwith',
            technologies: data.Results?.[0]?.Result?.Paths?.[0]?.Technologies?.map((t: any) => ({
              name: t.Name,
              category: t.Categories?.[0],
              firstDetected: t.FirstDetected,
              lastDetected: t.LastDetected
            })) || []
          }
        })
      }
    }
    
    // Fallback: Check for common tech indicators
    const techChecks = [
      { path: '/robots.txt', type: 'seo_config' },
      { path: '/sitemap.xml', type: 'sitemap' },
      { path: '/.well-known/security.txt', type: 'security_config' }
    ]
    
    for (const check of techChecks) {
      try {
        const response = await fetch(`https://${domain}${check.path}`)
        if (response.ok) {
          const content = await response.text()
          evidence.push({
            url: `https://${domain}${check.path}`,
            title: check.type,
            content: content.slice(0, 5000), // Limit size
            type: check.type,
            metadata: {
              tool: 'direct_fetch',
              contentType: response.headers.get('content-type')
            }
          })
        }
      } catch (err) {
        // File might not exist
      }
    }
  } catch (error) {
    console.error('Error collecting tech stack:', error)
  }
  
  return evidence
}

async function collectGitHubData(company: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  
  try {
    // Search for company on GitHub
    const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(company)}+type:org`
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'TechScanIQ/1.0'
    }
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`
    }
    
    const searchResponse = await fetch(searchUrl, { headers })
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      const org = searchData.items?.[0]
      
      if (org) {
        // Get organization details
        const orgResponse = await fetch(org.url, { headers })
        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          evidence.push({
            url: orgData.html_url,
            title: 'GitHub Organization Profile',
            content: JSON.stringify({
              name: orgData.name,
              description: orgData.description,
              blog: orgData.blog,
              location: orgData.location,
              public_repos: orgData.public_repos,
              created_at: orgData.created_at
            }),
            type: 'github_org',
            metadata: {
              tool: 'github_api',
              login: orgData.login,
              public_repos: orgData.public_repos,
              followers: orgData.followers
            }
          })
        }
        
        // Get repositories
        const reposResponse = await fetch(`${org.url}/repos?sort=stars&per_page=10`, { headers })
        if (reposResponse.ok) {
          const repos = await reposResponse.json()
          evidence.push({
            url: `https://github.com/${org.login}`,
            title: 'GitHub Repositories',
            content: JSON.stringify(repos.map((r: any) => ({
              name: r.name,
              description: r.description,
              stars: r.stargazers_count,
              language: r.language,
              updated: r.updated_at
            }))),
            type: 'github_repos',
            metadata: {
              tool: 'github_api',
              repo_count: repos.length,
              total_stars: repos.reduce((sum: number, r: any) => sum + r.stargazers_count, 0),
              languages: [...new Set(repos.map((r: any) => r.language).filter(Boolean))]
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error collecting GitHub data:', error)
  }
  
  return evidence
}

async function collectNewsAndMedia(company: string, _domain: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  
  try {
    // Use Google Custom Search API if available
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
      const queries = [
        `"${company}" funding round investment`,
        `"${company}" revenue growth metrics`,
        `"${company}" lawsuit controversy problem`,
        `"${company}" acquisition merger`,
        `"${company}" layoff downsizing`
      ]
      
      for (const query of queries) {
        try {
          const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`
          const response = await fetch(url)
          
          if (response.ok) {
            const data = await response.json()
            for (const item of (data.items || [])) {
              evidence.push({
                url: item.link,
                title: item.title,
                content: item.snippet,
                type: 'news',
                metadata: {
                  tool: 'google_search',
                  query: query,
                  publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
                  source: new URL(item.link).hostname
                }
              })
            }
          }
        } catch (err) {
          console.error(`Search query failed: ${query}`, err)
        }
      }
    }
    
    // Try RSS feeds from major tech news sites
    // const techNewsFeeds = [
    //   `https://news.ycombinator.com/rss`, // Would need to search/filter
    //   `https://techcrunch.com/feed/`,
    //   `https://venturebeat.com/feed/`
    // ]
    
    // Note: In production, you'd parse these RSS feeds and search for company mentions
    
  } catch (error) {
    console.error('Error collecting news:', error)
  }
  
  return evidence
}

async function collectSecurityData(domain: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  
  try {
    // SSL/TLS information
    const sslResponse = await fetch(`https://api.ssllabs.com/api/v3/analyze?host=${domain}`)
    if (sslResponse.ok) {
      const sslData = await sslResponse.json()
      evidence.push({
        url: `https://${domain}`,
        title: 'SSL/TLS Security Analysis',
        content: JSON.stringify(sslData),
        type: 'security_ssl',
        metadata: {
          tool: 'ssllabs',
          grade: sslData.endpoints?.[0]?.grade,
          hasWarnings: sslData.endpoints?.[0]?.hasWarnings
        }
      })
    }
    
    // Security headers check
    const headersResponse = await fetch(`https://${domain}`, { method: 'HEAD' })
    const securityHeaders = {
      'strict-transport-security': headersResponse.headers.get('strict-transport-security'),
      'x-frame-options': headersResponse.headers.get('x-frame-options'),
      'x-content-type-options': headersResponse.headers.get('x-content-type-options'),
      'content-security-policy': headersResponse.headers.get('content-security-policy'),
      'x-xss-protection': headersResponse.headers.get('x-xss-protection')
    }
    
    evidence.push({
      url: `https://${domain}`,
      title: 'Security Headers Analysis',
      content: JSON.stringify(securityHeaders),
      type: 'security_headers',
      metadata: {
        tool: 'header_check',
        hasHSTS: !!securityHeaders['strict-transport-security'],
        hasCSP: !!securityHeaders['content-security-policy']
      }
    })
    
  } catch (error) {
    console.error('Error collecting security data:', error)
  }
  
  return evidence
}

export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis } = job.data
    
    console.log(`Starting REAL evidence collection for ${company} (${scanRequestId})`)
    
    try {
      // Update scan request status
      await supabase
        .from('scan_requests')
        .update({
          status: 'processing',
          ai_workflow_status: 'collecting_evidence'
        })
        .eq('id', scanRequestId)
      
      // Create evidence collection record
      const { data: collection, error: collectionError } = await supabase
        .from('evidence_collections')
        .insert({
          company_name: company,
          company_website: `https://${domain}`,
          collection_status: 'in_progress',
          status: 'in_progress',
          collection_type: depth,
          evidence_count: 0,
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (collectionError) throw collectionError
      
      const allEvidence: EvidenceItem[] = []
      
      // Phase 1: Web Content (Always collect)
      await job.updateProgress(10)
      console.log('Collecting web content...')
      const webEvidence = await collectWebContent(domain)
      allEvidence.push(...webEvidence)
      console.log(`Collected ${webEvidence.length} web pages`)
      
      // Phase 2: Technical Analysis
      await job.updateProgress(30)
      console.log('Analyzing technology stack...')
      const techEvidence = await collectTechStack(domain)
      allEvidence.push(...techEvidence)
      console.log(`Collected ${techEvidence.length} tech stack items`)
      
      // Phase 3: GitHub/Engineering Assessment
      await job.updateProgress(50)
      console.log('Checking GitHub presence...')
      const githubEvidence = await collectGitHubData(company)
      allEvidence.push(...githubEvidence)
      console.log(`Collected ${githubEvidence.length} GitHub items`)
      
      // Phase 4: News and Media (for comprehensive only)
      if (depth === 'comprehensive') {
        await job.updateProgress(70)
        console.log('Searching news and media...')
        const newsEvidence = await collectNewsAndMedia(company, domain)
        allEvidence.push(...newsEvidence)
        console.log(`Collected ${newsEvidence.length} news items`)
        
        // Phase 5: Security Assessment
        await job.updateProgress(85)
        console.log('Running security checks...')
        const securityEvidence = await collectSecurityData(domain)
        allEvidence.push(...securityEvidence)
        console.log(`Collected ${securityEvidence.length} security items`)
      }
      
      // Save all evidence to database
      console.log(`Saving ${allEvidence.length} evidence items to database...`)
      for (const item of allEvidence) {
        const { error } = await supabase
          .from('evidence_items')
          .insert({
            collection_id: collection.id,
            company_name: company,
            type: item.type,
            evidence_type: item.type,
            content_data: {
              raw: JSON.stringify(item),
              summary: item.title,
              processed: item.content.slice(0, 1000) // Truncate for summary
            },
            source_data: {
              url: item.url,
              tool: item.metadata.tool,
              timestamp: new Date().toISOString()
            },
            metadata: item.metadata,
            confidence_score: 0.85,
            processing_stage: 'raw',
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Failed to save evidence item:', error)
        }
      }
      
      // Update collection status
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          collection_status: 'completed',
          evidence_count: allEvidence.length,
          updated_at: new Date().toISOString(),
          metadata: {
            scan_request_id: scanRequestId,
            investment_thesis: investmentThesis,
            sources_used: [...new Set(allEvidence.map(e => e.metadata?.tool).filter(Boolean))]
          }
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected',
          evidence_count: allEvidence.length
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`REAL evidence collection complete! Total items: ${allEvidence.length}`)
      
      return {
        success: true,
        evidenceCount: allEvidence.length,
        collectionId: collection.id
      }
      
    } catch (error) {
      console.error('Evidence collection failed:', error)
      
      // Update scan request with error
      await supabase
        .from('scan_requests')
        .update({
          status: 'failed',
          ai_workflow_status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', scanRequestId)
      
      throw error
    }
  },
  {
    connection,
    concurrency: 3,
  }
)

// Error handling
evidenceCollectionWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

evidenceCollectionWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await evidenceCollectionWorker.close()
  process.exit(0)
})

console.log('REAL evidence collection worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Using actual APIs: Jina, GitHub, Google Search, SSL Labs')
console.log('Waiting for jobs...')