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

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

export const evidenceCollectionWorker = new Worker<EvidenceCollectionJob>(
  'evidence-collection',
  async (job: Job<EvidenceCollectionJob>) => {
    const { scanRequestId, company, domain, depth, investmentThesis } = job.data
    
    console.log(`Starting evidence collection for ${company} (${scanRequestId})`)
    
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
      
      const evidence = []
      
      // 1. ACTUAL WEB SCRAPING - Use Jina AI
      console.log(`Fetching homepage from ${domain}...`)
      try {
        const jinaResponse = await fetch(`https://r.jina.ai/https://${domain}`, {
          headers: {
            'Accept': 'application/json',
            'X-Return-Format': 'json'
          }
        })
        
        if (jinaResponse.ok) {
          const jinaData = await jinaResponse.json()
          console.log(`Got Jina response: ${jinaData.title}`)
          
          const homepageEvidence = {
            collection_id: collection.id,
            evidence_id: crypto.randomUUID(),
            company_name: company,
            type: 'website_content',
            evidence_type: 'website_content',
            content_data: {
              raw: JSON.stringify(jinaData),
              summary: jinaData.title || 'Homepage',
              processed: jinaData.content || jinaData.text || ''
            },
            source_data: {
              url: `https://${domain}`,
              tool: 'jina',
              timestamp: new Date().toISOString()
            },
            metadata: {
              description: jinaData.description,
              siteName: jinaData.siteName
            },
            confidence_score: 0.9,
            processing_stage: 'raw',
            created_at: new Date().toISOString()
          }
          
          const { error } = await supabase
            .from('evidence_items')
            .insert(homepageEvidence)
          
          if (error) {
            console.error('Failed to save homepage evidence:', error)
          } else {
            evidence.push(homepageEvidence)
            console.log('Saved homepage evidence')
          }
        }
      } catch (err) {
        console.error('Jina fetch failed:', err)
      }
      
      await job.updateProgress(20)
      
      // 2. Try to fetch key pages
      const importantPages = ['/about', '/pricing', '/team', '/careers']
      for (const page of importantPages) {
        try {
          console.log(`Fetching ${page}...`)
          const pageResponse = await fetch(`https://r.jina.ai/https://${domain}${page}`, {
            headers: {
              'Accept': 'application/json',
              'X-Return-Format': 'json'
            }
          })
          
          if (pageResponse.ok) {
            const pageData = await pageResponse.json()
            
            const pageEvidence = {
              collection_id: collection.id,
              evidence_id: crypto.randomUUID(),
              company_name: company,
              type: page === '/about' ? 'business_overview' : 
                    page === '/team' ? 'team_info' : 
                    page === '/pricing' ? 'financial_info' : 'website_content',
              evidence_type: page === '/about' ? 'business_overview' : 
                    page === '/team' ? 'team_info' : 
                    page === '/pricing' ? 'financial_info' : 'website_content',
              content_data: {
                raw: JSON.stringify(pageData),
                summary: pageData.title || page,
                processed: (pageData.content || pageData.text || '').slice(0, 5000)
              },
              source_data: {
                url: `https://${domain}${page}`,
                tool: 'jina',
                timestamp: new Date().toISOString()
              },
              metadata: {},
              confidence_score: 0.8,
              processing_stage: 'raw',
              created_at: new Date().toISOString()
            }
            
            const { error } = await supabase
              .from('evidence_items')
              .insert(pageEvidence)
            
            if (!error) {
              evidence.push(pageEvidence)
              console.log(`Saved ${page} evidence`)
            }
          }
        } catch (err) {
          console.log(`Page ${page} not found or error`)
        }
      }
      
      await job.updateProgress(50)
      
      // 3. GitHub search (if we have a token)
      if (process.env.GITHUB_TOKEN) {
        try {
          console.log(`Searching GitHub for ${company}...`)
          const githubSearch = await fetch(
            `https://api.github.com/search/users?q=${encodeURIComponent(company)}+type:org`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'User-Agent': 'TechScanIQ/1.0'
              }
            }
          )
          
          if (githubSearch.ok) {
            const searchData = await githubSearch.json()
            const org = searchData.items?.[0]
            
            if (org) {
              const githubEvidence = {
                collection_id: collection.id,
                evidence_id: crypto.randomUUID(),
                company_name: company,
                type: 'technology_stack',
                evidence_type: 'technology_stack',
                content_data: {
                  raw: JSON.stringify(org),
                  summary: `GitHub: ${org.login}`,
                  processed: `GitHub organization with ${org.public_repos} public repos`
                },
                source_data: {
                  url: org.html_url,
                  tool: 'github_api',
                  timestamp: new Date().toISOString()
                },
                metadata: {
                  login: org.login,
                  repos: org.public_repos
                },
                confidence_score: 0.85,
                processing_stage: 'raw',
                created_at: new Date().toISOString()
              }
              
              await supabase.from('evidence_items').insert(githubEvidence)
              evidence.push(githubEvidence)
              console.log('Saved GitHub evidence')
            }
          }
        } catch (err) {
          console.error('GitHub search failed:', err)
        }
      }
      
      await job.updateProgress(70)
      
      // 4. Direct fetch robots.txt and sitemap
      try {
        const robotsResponse = await fetch(`https://${domain}/robots.txt`)
        if (robotsResponse.ok) {
          const robotsText = await robotsResponse.text()
          
          const robotsEvidence = {
            collection_id: collection.id,
            evidence_id: crypto.randomUUID(),
            company_name: company,
            type: 'technology_stack',
            evidence_type: 'technology_stack',
            content_data: {
              raw: robotsText,
              summary: 'robots.txt configuration',
              processed: robotsText.slice(0, 1000)
            },
            source_data: {
              url: `https://${domain}/robots.txt`,
              tool: 'direct_fetch',
              timestamp: new Date().toISOString()
            },
            metadata: {
              hasDisallow: robotsText.includes('Disallow'),
              hasSitemap: robotsText.includes('Sitemap')
            },
            confidence_score: 0.95,
            processing_stage: 'raw',
            created_at: new Date().toISOString()
          }
          
          await supabase.from('evidence_items').insert(robotsEvidence)
          evidence.push(robotsEvidence)
          console.log('Saved robots.txt evidence')
        }
      } catch (err) {
        console.log('No robots.txt found')
      }
      
      // 5. Security headers check
      try {
        const headersResponse = await fetch(`https://${domain}`, { method: 'HEAD' })
        const headers = {
          'strict-transport-security': headersResponse.headers.get('strict-transport-security'),
          'x-frame-options': headersResponse.headers.get('x-frame-options'),
          'content-security-policy': headersResponse.headers.get('content-security-policy'),
          'server': headersResponse.headers.get('server'),
          'x-powered-by': headersResponse.headers.get('x-powered-by')
        }
        
        const securityEvidence = {
          collection_id: collection.id,
          evidence_id: crypto.randomUUID(),
          company_name: company,
          type: 'security_analysis',
          evidence_type: 'security_analysis',
          content_data: {
            raw: JSON.stringify(headers),
            summary: 'Security Headers Analysis',
            processed: `HSTS: ${headers['strict-transport-security'] ? 'Yes' : 'No'}, CSP: ${headers['content-security-policy'] ? 'Yes' : 'No'}`
          },
          source_data: {
            url: `https://${domain}`,
            tool: 'header_analysis',
            timestamp: new Date().toISOString()
          },
          metadata: headers,
          confidence_score: 0.95,
          processing_stage: 'raw',
          created_at: new Date().toISOString()
        }
        
        await supabase.from('evidence_items').insert(securityEvidence)
        evidence.push(securityEvidence)
        console.log('Saved security headers evidence')
      } catch (err) {
        console.error('Headers check failed:', err)
      }
      
      await job.updateProgress(90)
      
      // Update collection with final count
      await supabase
        .from('evidence_collections')
        .update({
          status: 'completed',
          collection_status: 'completed',
          evidence_count: evidence.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', collection.id)
      
      // Update scan request
      await supabase
        .from('scan_requests')
        .update({
          ai_workflow_status: 'evidence_collected',
          evidence_count: evidence.length
        })
        .eq('id', scanRequestId)
      
      await job.updateProgress(100)
      console.log(`Evidence collection complete! Collected ${evidence.length} items`)
      
      return {
        success: true,
        evidenceCount: evidence.length,
        collectionId: collection.id
      }
      
    } catch (error) {
      console.error('Evidence collection failed:', error)
      
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

console.log('Evidence collection worker (Jina) started')
console.log('Using Jina AI for web content extraction')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
console.log('Waiting for jobs...')