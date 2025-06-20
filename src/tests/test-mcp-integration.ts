/**
 * Test script for MCP integration
 * 
 * Run with: tsx src/tests/test-mcp-integration.ts
 */

import { config } from 'dotenv'
import { MCPClient } from '../services/mcp-client'
import { createMCPTools } from '../services/langgraph-mcp-tools'

config()

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Integration...\n')
  
  try {
    // Test 1: Initialize MCP Client
    console.log('1️⃣ Initializing MCP Client...')
    const mcpClient = await MCPClient.createDefault()
    console.log('✅ MCP Client initialized\n')
    
    // Test 2: Get available tools
    console.log('2️⃣ Discovering available tools...')
    const availableTools = mcpClient.getTools()
    console.log(`✅ Found ${availableTools.length} tools:`)
    availableTools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`)
    })
    console.log()
    
    // Test 3: Create LangGraph tools
    console.log('3️⃣ Creating LangGraph tool wrappers...')
    const langGraphTools = await createMCPTools(mcpClient)
    console.log(`✅ Created ${langGraphTools.length} LangGraph tools\n`)
    
    // Test 4: Test individual tools
    console.log('4️⃣ Testing individual tools...')
    
    // Test read_file tool
    const readFileTool = langGraphTools.find(t => t.name === 'read_file')
    if (readFileTool) {
      console.log('   Testing read_file tool...')
      const result = await readFileTool.invoke({ path: 'package.json' })
      const parsed = JSON.parse(result)
      console.log(`   ✅ Read file successful: ${parsed.content ? 'Content received' : 'No content'}`)
    }
    
    // Test list_directory tool
    const listDirTool = langGraphTools.find(t => t.name === 'list_directory')
    if (listDirTool) {
      console.log('   Testing list_directory tool...')
      const result = await listDirTool.invoke({ path: '.' })
      const parsed = JSON.parse(result)
      console.log(`   ✅ List directory successful: ${parsed.files?.length || 0} files, ${parsed.directories?.length || 0} directories`)
    }
    
    // Test fetch_url tool
    const fetchTool = langGraphTools.find(t => t.name === 'fetch_url')
    if (fetchTool) {
      console.log('   Testing fetch_url tool...')
      const result = await fetchTool.invoke({ url: 'https://example.com' })
      const parsed = JSON.parse(result)
      console.log(`   ✅ Fetch URL successful: Status ${parsed.status}`)
    }
    
    console.log('\n✨ All tests passed!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
testMCPIntegration().catch(console.error)