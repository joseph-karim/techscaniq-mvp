import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey?.substring(0, 20) + '...')

try {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Test a simple query
  // First check if we can access tables at all
  const { data: tables, error: tablesError } = await supabase
    .from('_supabase_schema')
    .select('*')
    .limit(1)
  
  if (tablesError) {
    console.log('Schema query failed, trying scan_requests directly...')
  }
  
  const { data, error, count } = await supabase
    .from('scan_requests')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('Query error:', error)
  } else {
    console.log('✅ Connection successful!')
    console.log('Total scan requests:', count)
  }
} catch (error) {
  console.error('Connection error:', error)
}