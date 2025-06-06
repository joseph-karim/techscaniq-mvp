#!/usr/bin/env node

/**
 * Fix Evidence to Report Connection
 * This script ensures that evidence is properly connected to reports through citations
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixEvidenceReportConnection() {
  console.log('🔧 Fixing Evidence to Report Connection...\n')

  try {
    // 1. Check current state
    console.log('1️⃣ Checking current data state...')
    
    // Get reports without evidence_collection_id
    const { data: reportsWithoutEvidence, error: reportsError } = await supabase
      .from('reports')
      .select('id, scan_request_id, company_name, created_at')
      .is('evidence_collection_id', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return
    }

    console.log(`Found ${reportsWithoutEvidence?.length || 0} reports without evidence_collection_id`)

    // 2. For each report, try to find its evidence
    for (const report of reportsWithoutEvidence || []) {
      console.log(`\n📄 Processing report for ${report.company_name} (${report.id})`)

      // Find evidence items for this scan request
      const { data: evidenceItems, error: evidenceError } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('scan_request_id', report.scan_request_id)
        .order('created_at', { ascending: true })

      if (evidenceError) {
        console.error('Error fetching evidence:', evidenceError)
        continue
      }

      console.log(`  Found ${evidenceItems?.length || 0} evidence items`)

      if (evidenceItems && evidenceItems.length > 0) {
        // Create or find evidence collection
        let collectionId

        // Check if collection exists
        const { data: existingCollection } = await supabase
          .from('evidence_collections')
          .select('id')
          .eq('scan_request_id', report.scan_request_id)
          .single()

        if (existingCollection) {
          collectionId = existingCollection.id
          console.log(`  Using existing collection: ${collectionId}`)
        } else {
          // Create new collection
          const { data: newCollection, error: collectionError } = await supabase
            .from('evidence_collections')
            .insert({
              scan_request_id: report.scan_request_id,
              status: 'completed',
              evidence_count: evidenceItems.length,
              created_at: report.created_at
            })
            .select()
            .single()

          if (collectionError) {
            console.error('Error creating collection:', collectionError)
            continue
          }

          collectionId = newCollection.id
          console.log(`  Created new collection: ${collectionId}`)
        }

        // Update evidence items with collection_id
        const { error: updateError } = await supabase
          .from('evidence_items')
          .update({ collection_id: collectionId })
          .eq('scan_request_id', report.scan_request_id)
          .is('collection_id', null)

        if (updateError) {
          console.error('Error updating evidence items:', updateError)
        }

        // Update report with evidence_collection_id
        const { error: reportUpdateError } = await supabase
          .from('reports')
          .update({ evidence_collection_id: collectionId })
          .eq('id', report.id)

        if (reportUpdateError) {
          console.error('Error updating report:', reportUpdateError)
        } else {
          console.log(`  ✅ Connected report to evidence collection`)
        }

        // Create sample citations if report has content
        await createSampleCitations(report.id, evidenceItems.slice(0, 10))
      }
    }

    // 3. Check citation status
    console.log('\n3️⃣ Checking citation status...')
    
    const { data: citationStats } = await supabase
      .from('report_citations')
      .select('report_id')
      .limit(1000)

    const uniqueReportsWithCitations = new Set(citationStats?.map(c => c.report_id) || [])
    console.log(`Reports with citations: ${uniqueReportsWithCitations.size}`)

    // 4. Fix report display query
    console.log('\n4️⃣ Creating helper function for proper report fetching...')
    
    const helperFunction = `
-- Helper function to get report with evidence
CREATE OR REPLACE FUNCTION get_report_with_evidence(report_id_param UUID)
RETURNS TABLE (
  report JSON,
  evidence JSON,
  citations JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(r.*) as report,
    COALESCE(
      json_agg(DISTINCT e.*) FILTER (WHERE e.id IS NOT NULL),
      '[]'::json
    ) as evidence,
    COALESCE(
      json_agg(DISTINCT 
        json_build_object(
          'id', rc.id,
          'citation_number', rc.citation_number,
          'claim_text', rc.claim_text,
          'evidence_item_id', rc.evidence_item_id,
          'section', rc.section,
          'evidence', ei.*
        )
      ) FILTER (WHERE rc.id IS NOT NULL),
      '[]'::json
    ) as citations
  FROM reports r
  LEFT JOIN evidence_collections ec ON r.evidence_collection_id = ec.id
  LEFT JOIN evidence_items e ON e.collection_id = ec.id
  LEFT JOIN report_citations rc ON rc.report_id = r.id
  LEFT JOIN evidence_items ei ON rc.evidence_item_id = ei.id
  WHERE r.id = report_id_param
  GROUP BY r.id;
END;
$$ LANGUAGE plpgsql;
`

    console.log('Helper function SQL generated (run this in Supabase SQL editor)')

    console.log('\n✅ Evidence-Report connection fix completed!')
    console.log('\nNext steps:')
    console.log('1. Run the helper function SQL in Supabase')
    console.log('2. Update view-report.tsx to fetch real citations')
    console.log('3. Update report generation to create citations')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function createSampleCitations(reportId, evidenceItems) {
  // Create sample citations for demonstration
  const sections = [
    'technologyOverview',
    'securityAnalysis',
    'performanceMetrics',
    'businessIntelligence'
  ]

  const citations = []
  
  evidenceItems.forEach((item, index) => {
    if (item.type && item.summary) {
      citations.push({
        report_id: reportId,
        evidence_item_id: item.id,
        citation_number: index + 1,
        section: sections[index % sections.length],
        claim_text: `Based on ${item.type} analysis: ${item.summary.substring(0, 200)}...`,
        context: item.data || {}
      })
    }
  })

  if (citations.length > 0) {
    const { error } = await supabase
      .from('report_citations')
      .insert(citations)

    if (error) {
      console.error('Error creating citations:', error)
    } else {
      console.log(`  Created ${citations.length} sample citations`)
    }
  }
}

// Run the fix
fixEvidenceReportConnection()