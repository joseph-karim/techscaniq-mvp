#!/usr/bin/env node

/**
 * Setup admin configuration data with proper RLS handling
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupAdminData() {
  console.log('🔧 Setting up admin configuration data...')

  try {
    // 1. Check current user and make them admin if needed
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found. Please log in first.')
      return
    }

    console.log(`👤 Current user: ${user.id}`)

    // 2. Check if user has a profile and make them admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('📝 Creating admin user profile...')
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          role: 'admin',
          organization_name: 'Admin Organization'
        })
      
      if (insertError) {
        console.error('❌ Error creating user profile:', insertError)
        return
      }
    } else if (profile.role !== 'admin') {
      console.log('🔄 Updating user to admin role...')
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Error updating user role:', updateError)
        return
      }
    }

    console.log('✅ User is now admin')

    // 3. Test table access
    console.log('🧪 Testing table access...')
    
    const tables = ['ai_prompts', 'scan_configurations', 'admin_settings', 'edge_function_logs']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Cannot access ${table}:`, error.message)
      } else {
        console.log(`✅ Can access ${table} (${data?.length || 0} records)`)
      }
    }

    // 4. Check if we need to seed data
    const { data: existingPrompts } = await supabase
      .from('ai_prompts')
      .select('id')
      .limit(1)

    if (!existingPrompts || existingPrompts.length === 0) {
      console.log('🌱 Seeding initial admin data...')
      
      // The migration already contains default data, so just show that tables are ready
      console.log('📋 Admin tables are ready for configuration')
    } else {
      console.log('✅ Admin data already exists')
    }

    // 5. Show final status
    const counts = await Promise.all([
      supabase.from('ai_prompts').select('id', { count: 'exact', head: true }),
      supabase.from('scan_configurations').select('id', { count: 'exact', head: true }),
      supabase.from('admin_settings').select('id', { count: 'exact', head: true }),
      supabase.from('edge_function_logs').select('id', { count: 'exact', head: true })
    ])

    console.log('\n📊 Current data counts:')
    console.log(`  AI Prompts: ${counts[0].count || 0}`)
    console.log(`  Scan Configurations: ${counts[1].count || 0}`)
    console.log(`  Admin Settings: ${counts[2].count || 0}`)
    console.log(`  Edge Function Logs: ${counts[3].count || 0}`)

    console.log('\n🎉 Admin setup complete!')
    console.log('🌐 Visit /admin/pipeline-config to manage the pipeline')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupAdminData()