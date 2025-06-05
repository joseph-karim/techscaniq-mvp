#!/usr/bin/env node

/**
 * Fix Snowplow scan status to make it accessible for testing
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSnowplowStatus() {
  console.log('🔧 Fixing Snowplow scan status...')

  try {
    const { data: scan, error } = await supabase
      .from('scan_requests')
      .select('*')
      .eq('id', '2436895f-727d-4a17-acc6-ef09a1de628a')
      .single()

    if (error || !scan) {
      console.error('❌ Could not find scan:', error)
      return
    }

    console.log('✅ Current scan status:', scan.status)
    console.log('   Has sections:', scan.sections ? 'Yes' : 'No')
    console.log('   Has risks:', scan.risks ? 'Yes' : 'No')

    // Set the scan to awaiting_review status so it can be accessed
    const { error: updateError } = await supabase
      .from('scan_requests')
      .update({ 
        status: 'awaiting_review',
        tech_health_score: 8.2,
        tech_health_grade: 'B',
        ai_confidence: 87
      })
      .eq('id', '2436895f-727d-4a17-acc6-ef09a1de628a')

    if (updateError) {
      console.error('❌ Error updating scan:', updateError)
    } else {
      console.log('✅ Successfully updated scan to awaiting_review')
      console.log('   Added tech health score: 8.2 (B)')
      console.log('   AI confidence: 87%')
    }

    // Also check what sections data looks like
    if (scan.sections) {
      console.log('\n📋 Sections data structure:')
      console.log(`   Number of sections: ${scan.sections.length}`)
      scan.sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section.title || section.id}`)
        console.log(`      Status: ${section.status || 'pending'}`)
        console.log(`      Has AI Content: ${section.aiContent ? 'Yes' : 'No'}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixSnowplowStatus()