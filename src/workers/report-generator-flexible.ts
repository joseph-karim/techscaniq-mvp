import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

config()

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const reportGenerator = new Worker(
  'report-generation',
  async (job: Job) => {
    const { scanRequestId, company, domain, investmentThesis, collectionId } = job.data
    
    console.log(`[Report] Generating report for ${company}`)
    
    try {
      // Get evidence from collection
      const { data: collection } = await supabase
        .from('evidence_collections')
        .select('metadata')
        .eq('id', collectionId)
        .single()
      
      const evidence = collection?.metadata?.evidence_raw || []
      const reflection = collection?.metadata?.reflection || {}
      
      console.log(`[Report] Processing ${evidence.length} evidence items`)
      
      // Generate report with Claude
      const reportResponse = await anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Generate an investment report for ${company} (${domain}).
          
          Investment thesis: ${investmentThesis}
          
          Evidence collected:
          ${JSON.stringify(evidence, null, 2)}
          
          Analysis insights:
          ${JSON.stringify(reflection, null, 2)}
          
          Create a structured report with:
          1. Executive Summary
          2. Investment Score (0-100) with reasoning
          3. Key Findings (with specific citations to evidence)
          4. Risks and Concerns
          5. Recommendation
          
          For citations, reference evidence by array index like [0], [1], etc.
          
          Return as JSON with sections and citations.`
        }]
      })
      
      let reportData
      try {
        const textContent = reportResponse.content.find(c => typeof c === 'object' && c.type === 'text')
        const content = textContent?.text || ''
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      } catch (e) {
        reportData = {
          executive_summary: "Report generation failed",
          investment_score: 0,
          sections: {
            overview: { title: "Overview", content: "Unable to generate report" }
          }
        }
      }
      
      // Extract citations
      const citations: any[] = []
      const citationPattern = /\[(\d+)\]/g
      
      Object.values(reportData.sections || {}).forEach((section: any) => {
        const matches = (section.content || '').matchAll(citationPattern)
        for (const match of matches) {
          const index = parseInt(match[1])
          if (evidence[index]) {
            citations.push({
              quote: match[0],
              evidence_index: index,
              evidence_data: evidence[index],
              location: section.title
            })
          }
        }
      })
      
      console.log(`[Report] Found ${citations.length} citations`)
      
      // Store report
      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          scan_request_id: scanRequestId,
          company_name: company,
          investment_score: typeof reportData.investment_score === 'number' ? 
            reportData.investment_score : 
            (reportData.investment_score?.score || 0),
          executive_summary: reportData.executive_summary || '',
          report_data: {
            sections: reportData.sections || {},
            metadata: {
              evidence_count: evidence.length,
              citation_count: citations.length,
              collection_id: collectionId
            }
          },
          evidence_count: evidence.length,
          citation_count: citations.length,
          report_version: 'flexible-v1',
          ai_model_used: 'claude-opus-4-20250514',
          quality_score: 0.8,
          human_reviewed: false,
          metadata: {
            citations,
            reflection,
            generated_at: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Store citations separately if needed
      if (citations.length > 0 && report) {
        const citationRecords = citations.map((c, _i) => ({
          report_id: report.id,
          evidence_id: `${collectionId}-${c.evidence_index}`,
          quote: c.quote,
          source_url: c.evidence_data.url || '',
          report_location: c.location,
          metadata: c.evidence_data
        }))
        
        await supabase
          .from('citations')
          .insert(citationRecords)
      }
      
      console.log(`[Report] Report generated: ${report.id}`)
      console.log(`[Report] View at: http://localhost:5173/reports/${report.id}`)
      
      return {
        success: true,
        reportId: report.id,
        investmentScore: reportData.investment_score,
        citationCount: citations.length
      }
      
    } catch (error) {
      console.error('[Report] Generation failed:', error)
      throw error
    }
  },
  { connection }
)

console.log('🚀 Flexible Report Generator started')
console.log('Generates reports from flexible evidence collections')