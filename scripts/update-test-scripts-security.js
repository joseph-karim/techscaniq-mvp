#!/usr/bin/env node

/**
 * Script to update all test scripts to use environment variables instead of hardcoded tokens
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Hardcoded tokens to replace
const HARDCODED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const HARDCODED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const HARDCODED_JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long'

// Test scripts directory
const testDir = path.join(__dirname, 'testing')

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8')
    let updated = false
    
    // Check if file already imports dotenv
    const hasDotenv = content.includes('dotenv/config') || content.includes('dotenv').includes('config()')
    
    // Replace hardcoded service key
    if (content.includes(HARDCODED_SERVICE_KEY)) {
      content = content.replace(
        new RegExp(`['"\`]${HARDCODED_SERVICE_KEY}['"\`]`, 'g'),
        'process.env.SUPABASE_SERVICE_ROLE_KEY'
      )
      updated = true
    }
    
    // Replace hardcoded anon key
    if (content.includes(HARDCODED_ANON_KEY)) {
      content = content.replace(
        new RegExp(`['"\`]${HARDCODED_ANON_KEY}['"\`]`, 'g'),
        'process.env.VITE_SUPABASE_ANON_KEY'
      )
      updated = true
    }
    
    // Replace hardcoded JWT secret
    if (content.includes(HARDCODED_JWT_SECRET)) {
      content = content.replace(
        new RegExp(`['"\`]${HARDCODED_JWT_SECRET}['"\`]`, 'g'),
        'process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET'
      )
      updated = true
    }
    
    // Add dotenv import if needed and file was updated
    if (updated && !hasDotenv) {
      // Add import at the beginning
      content = `import 'dotenv/config'\n${content}`
    }
    
    // Add environment variable checks after imports
    if (updated) {
      const lines = content.split('\n')
      let insertIndex = 0
      
      // Find where to insert the checks (after imports)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() && !lines[i].startsWith('import') && !lines[i].startsWith('//')) {
          insertIndex = i
          break
        }
      }
      
      // Check if checks already exist
      if (!content.includes('Missing required environment variables')) {
        const envCheck = `
// Check for required environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_URL) {
  console.error('Missing required environment variables')
  console.error('Please ensure .env or .env.test contains:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')  
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
`
        lines.splice(insertIndex, 0, envCheck)
        content = lines.join('\n')
      }
    }
    
    if (updated) {
      await fs.writeFile(filePath, content)
      console.log(`✅ Updated: ${path.basename(filePath)}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔒 Updating test scripts to use environment variables...\n')
  
  try {
    // Get all .js files in testing directory
    const files = await fs.readdir(testDir)
    const jsFiles = files.filter(f => f.endsWith('.js'))
    
    let updatedCount = 0
    
    for (const file of jsFiles) {
      const filePath = path.join(testDir, file)
      const updated = await updateFile(filePath)
      if (updated) updatedCount++
    }
    
    console.log(`\n📊 Summary: Updated ${updatedCount} out of ${jsFiles.length} files`)
    
    // Create example .env.test if it doesn't exist
    const envTestExample = path.join(__dirname, '..', '.env.test.example')
    try {
      await fs.access(envTestExample)
      console.log('\n✅ .env.test.example already exists')
    } catch {
      console.log('\n❌ .env.test.example not found, please create it manually')
    }
    
    console.log('\n🎯 Next steps:')
    console.log('1. Copy .env.test.example to .env.test')
    console.log('2. Fill in your actual API keys and tokens')
    console.log('3. Never commit .env.test to git')
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

main()