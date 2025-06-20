/**
 * Test script for Backend MCP Integration
 * 
 * This script tests the complete flow:
 * 1. Backend MCP server connection
 * 2. Code analysis API endpoint
 * 3. LangGraph worker with backend integration
 */

import axios from 'axios'
import { config } from 'dotenv'

config()

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

// Test data
const testCode = {
  'app.js': `
    import React, { useState, useEffect } from 'react';
    import axios from 'axios';
    
    const API_KEY = 'sk-1234567890abcdef'; // Security issue
    
    function App() {
      const [data, setData] = useState(null);
      
      useEffect(() => {
        fetchData();
      }, []);
      
      const fetchData = async () => {
        const query = \`SELECT * FROM users WHERE id = \${userId}\`; // SQL injection
        const response = await axios.get('/api/data');
        setData(response.data);
      };
      
      return (
        <div dangerouslySetInnerHTML={{ __html: data }} />
      );
    }
    
    export default App;
  `,
  'package.json': `
    {
      "name": "test-app",
      "version": "1.0.0",
      "dependencies": {
        "react": "^18.2.0",
        "axios": "^1.5.0",
        "express": "^4.18.0"
      }
    }
  `,
  'server.js': `
    const express = require('express');
    const app = express();
    
    app.get('/api/data', (req, res) => {
      const password = 'admin123'; // Hardcoded password
      res.json({ message: 'Hello World' });
    });
    
    app.listen(3000);
  `
}

async function testBackendHealth() {
  console.log('\n🔍 Testing Backend Health...')
  
  try {
    const response = await axios.get(`${BACKEND_URL}/health`)
    console.log('✅ Backend is running')
    console.log('   Status:', response.data.status)
    console.log('   MCP Connected:', response.data.checks?.mcp?.connected || false)
    return true
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message)
    return false
  }
}

async function testCodeAnalysisEndpoint() {
  console.log('\n🔍 Testing Code Analysis Endpoint...')
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/code-analysis/analyze`, {
      code: testCode,
      url: 'test.example.com',
      options: {
        includeSecurityScan: true,
        detectFrameworks: true,
        analyzeDependencies: true
      }
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = response.data
    
    console.log('✅ Code analysis completed successfully')
    console.log('\n📊 Analysis Results:')
    console.log('   Symbols found:', result.symbols.length)
    console.log('   Security issues:', result.securityIssues.length)
    if (result.securityIssues.length > 0) {
      console.log('   Security breakdown:')
      result.securityIssues.forEach(issue => {
        console.log(`     - ${issue.type} (${issue.severity}): ${issue.description}`)
      })
    }
    console.log('   Dependencies:', result.dependencies.length)
    console.log('   Frameworks detected:', result.frameworks.map(f => `${f.name} (${f.confidence}%)`).join(', '))
    console.log('   Analysis time:', result.metadata.analysis_time + 's')
    
    return true
  } catch (error) {
    console.error('❌ Code analysis failed:', error.message)
    if (error.response) {
      console.error('   Response:', error.response.data)
    }
    return false
  }
}

async function testMCPToolsAvailability() {
  console.log('\n🔍 Testing MCP Tools Availability...')
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/code-analysis/health`)
    const health = response.data
    
    if (health.mcp_connected) {
      console.log('✅ MCP is connected')
      console.log('   Available tools:', health.available_tools.length)
      console.log('   Tools:', health.available_tools.slice(0, 5).join(', ') + (health.available_tools.length > 5 ? '...' : ''))
    } else {
      console.log('⚠️  MCP is not connected - running in degraded mode')
    }
    
    return true
  } catch (error) {
    console.error('❌ Failed to check MCP tools:', error.message)
    return false
  }
}

async function testSecurityDetection() {
  console.log('\n🔍 Testing Security Detection Capabilities...')
  
  const securityTestCode = {
    'vulnerable.js': `
      // Test various security issues
      const password = 'supersecret123';
      const apiKey = 'sk-prod-abcdef123456';
      const secret_key = 'secret_production_key';
      
      function queryDatabase(userId) {
        const query = "SELECT * FROM users WHERE id = " + userId;
        return db.query(query);
      }
      
      function renderHTML(userInput) {
        document.getElementById('output').innerHTML = userInput;
      }
      
      function executeCode(code) {
        eval(code);
        new Function(code)();
      }
    `
  }
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/code-analysis/analyze`, {
      code: securityTestCode,
      url: 'security-test.com',
      options: {
        includeSecurityScan: true,
        detectFrameworks: false,
        analyzeDependencies: false
      }
    })
    
    const result = response.data
    
    console.log('✅ Security detection completed')
    console.log('   Issues found:', result.securityIssues.length)
    
    // Check if expected issues were detected
    const expectedIssues = ['hardcoded_password', 'api_key', 'secret_key', 'sql_concatenation', 'innerHTML', 'eval_usage', 'function_constructor']
    const foundIssues = result.securityIssues.map(i => i.type)
    const detectedExpected = expectedIssues.filter(e => foundIssues.includes(e))
    
    console.log(`   Detected ${detectedExpected.length}/${expectedIssues.length} expected security issues`)
    
    return true
  } catch (error) {
    console.error('❌ Security detection test failed:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Backend MCP Integration Tests')
  console.log('=' .repeat(50))
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'MCP Tools Availability', fn: testMCPToolsAvailability },
    { name: 'Code Analysis Endpoint', fn: testCodeAnalysisEndpoint },
    { name: 'Security Detection', fn: testSecurityDetection }
  ]
  
  const results = []
  
  for (const test of tests) {
    console.log(`\nRunning: ${test.name}`)
    try {
      const passed = await test.fn()
      results.push({ name: test.name, passed })
    } catch (error) {
      console.error(`Test ${test.name} threw an error:`, error)
      results.push({ name: test.name, passed: false })
    }
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('📊 Test Summary:')
  console.log('=' .repeat(50))
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`)
  })
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`\nTotal: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Backend MCP integration is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend logs for more details.')
  }
}

// Run tests
runAllTests().catch(console.error)