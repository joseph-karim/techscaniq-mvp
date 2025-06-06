import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

console.log('Environment Check:')
console.log('=================')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30) + '...')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...')

// Test with anon key first
console.log('\n\nTesting with ANON key:')
try {
  const anonClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  
  const { count, error } = await anonClient
    .from('scan_requests')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('❌ Anon key error:', error.message)
  } else {
    console.log('✅ Anon key works! Scan requests count:', count)
  }
} catch (error) {
  console.error('❌ Anon client creation error:', error)
}

// Test with service role key
console.log('\n\nTesting with SERVICE ROLE key:')
try {
  const serviceClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { count, error } = await serviceClient
    .from('scan_requests')
    .select('*', { count: 'exact', head: true })
  
  if (error) {
    console.error('❌ Service role key error:', error.message)
  } else {
    console.log('✅ Service role key works! Scan requests count:', count)
  }
} catch (error) {
  console.error('❌ Service client creation error:', error)
}

// Check if the JWT structure is correct
console.log('\n\nKey Structure Check:')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (serviceKey) {
  const parts = serviceKey.split('.')
  console.log('JWT parts:', parts.length)
  if (parts.length === 3) {
    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      console.log('Header:', header)
      console.log('Payload:', payload)
    } catch (e) {
      console.log('Failed to decode JWT')
    }
  }
}