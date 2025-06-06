import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkSchema() {
  // Try to insert a test record to see what error we get
  const testData = {
    collection_id: 'test-id',
    scan_request_id: 'test-scan-id',
    company_name: 'Test Company',
    type: 'test',
    evidence_type: 'test',
    content_data: { raw: 'test', summary: 'test', processed: 'test' },
    source_data: { url: 'https://test.com', tool: 'test', timestamp: new Date().toISOString() },
    metadata: {},
    confidence_score: 0.8,
    processing_stage: 'raw',
    created_at: new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('evidence_items')
    .insert(testData)
  
  if (error) {
    console.log('Error inserting test record:')
    console.log(error)
    console.log('\nThis will show us which columns are invalid')
  }
}

checkSchema()