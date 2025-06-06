import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkEvidenceItems() {
  console.log('Checking evidence_items table...')
  
  // Try to fetch a sample row
  const { data, error } = await supabase
    .from('evidence_items')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Sample row:', data)
    
    if (data && data.length > 0) {
      console.log('\nColumns:')
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`)
      })
    } else {
      console.log('No evidence items found')
    }
  }
}

checkEvidenceItems().catch(console.error)