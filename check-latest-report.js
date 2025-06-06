import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLatestReport() {
  console.log('🔍 Checking latest report details...\n')
  
  try {
    // Get the latest report
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('Failed to fetch report:', error)
      return
    }
    
    console.log('Report ID:', report.id)
    console.log('Company:', report.company_name)
    console.log('Created:', new Date(report.created_at).toLocaleString())
    console.log('Investment Score:', report.investment_score)
    console.log('Tech Health Grade:', report.tech_health_grade)
    console.log('Evidence Count:', report.evidence_count)
    console.log('Citation Count:', report.citation_count)
    console.log('\nExecutive Summary:')
    console.log(report.executive_summary)
    
    // Check if report has actual AI analysis
    if (report.report_data) {
      console.log('\n📊 Report Data Analysis:')
      console.log('Has Company Info:', !!report.report_data.companyInfo)
      console.log('Has Tech Overview:', !!report.report_data.technologyOverview)
      console.log('Has Security Assessment:', !!report.report_data.securityAssessment)
      console.log('Has Investment Recommendation:', !!report.report_data.investmentRecommendation)
      
      if (report.report_data.investmentRecommendation) {
        console.log('\n💼 Investment Details:')
        console.log('Score:', report.report_data.investmentRecommendation.score)
        console.log('Grade:', report.report_data.investmentRecommendation.grade)
        console.log('Recommendation:', report.report_data.investmentRecommendation.recommendation)
        console.log('Rationale:', report.report_data.investmentRecommendation.rationale)
      }
    }
    
    // Check associated scan request
    if (report.scan_request_id) {
      const { data: scan } = await supabase
        .from('scan_requests')
        .select('*')
        .eq('id', report.scan_request_id)
        .single()
      
      if (scan) {
        console.log('\n📋 Associated Scan Request:')
        console.log('Status:', scan.status)
        console.log('Website:', scan.website_url)
        console.log('Thesis Type:', scan.investment_thesis_data?.thesisType)
      }
    }
    
    // Check evidence collection
    const { data: collections } = await supabase
      .from('evidence_collections')
      .select('*')
      .eq('company_name', report.company_name)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (collections && collections.length > 0) {
      const collection = collections[0]
      console.log('\n🔍 Evidence Collection:')
      console.log('Collection ID:', collection.id)
      console.log('Status:', collection.collection_status)
      console.log('Evidence Count:', collection.evidence_count)
      console.log('Tools Used:', collection.tools_used)
      console.log('Evidence Types:', Object.entries(collection.evidence_types || {}).map(([k,v]) => `${k}: ${v}`).join(', '))
    }
    
    // Check for citations
    const { data: citations } = await supabase
      .from('report_citations')
      .select('*')
      .eq('report_id', report.id)
      .limit(5)
    
    if (citations && citations.length > 0) {
      console.log(`\n📌 Sample Citations (${citations.length} total):`)
      citations.forEach((c, i) => {
        console.log(`${i+1}. "${c.citation_text.substring(0, 60)}..." (confidence: ${c.confidence_score})`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkLatestReport()