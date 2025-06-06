import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkEvidenceCollections() {
  console.log('Checking evidence_collections table...')
  
  // Try to fetch a sample row
  const { data, error } = await supabase
    .from('evidence_collections')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
    
    // Try to create a test record to see what columns are expected
    console.log('\nTrying to insert test record...')
    const { data: insertData, error: insertError } = await supabase
      .from('evidence_collections')
      .insert({
        company_name: 'Test Company',
        collection_status: 'test'
      })
      .select()
    
    if (insertError) {
      console.error('Insert error:', insertError)
    } else {
      console.log('Insert successful:', insertData)
    }
  } else {
    console.log('Sample row:', data)
    
    if (data && data.length > 0) {
      console.log('\nColumns:')
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`)
      })
    }
  }
}

checkEvidenceCollections().catch(console.error)