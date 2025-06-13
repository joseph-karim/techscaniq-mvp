#!/usr/bin/env tsx
import axios from 'axios';
import { config } from './src/config';

const API_BASE = `http://localhost:${config.API_PORT}/api`;
const API_KEY = process.env.API_KEY || 'demo-api-key';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail';
  response?: any;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  method: string,
  endpoint: string,
  data?: any,
  headers?: any
): Promise<void> {
  try {
    console.log(`\n🧪 Testing ${method} ${endpoint}...`);
    
    const response = await axios({
      method,
      url: `${API_BASE}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    console.log(`✅ Status: ${response.status}`);
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));
    
    results.push({
      endpoint,
      method,
      status: 'pass',
      response: response.data,
    });
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    
    results.push({
      endpoint,
      method,
      status: 'fail',
      error: error.message,
    });
  }
}

async function runTests() {
  console.log('🚀 Starting TechScanIQ API Tests...\n');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...`);

  // Test 1: Health check (no auth)
  await testEndpoint('GET', '/health');

  // Test 2: Start research without auth (should fail)
  await testEndpoint('POST', '/research/start', {
    company: 'OpenAI',
    website: 'https://openai.com',
    thesisType: 'innovation',
  });

  // Test 3: Start research with API key
  await testEndpoint(
    'POST',
    '/research/start',
    {
      company: 'OpenAI',
      website: 'https://openai.com',
      thesisType: 'innovation',
    },
    {
      'X-API-Key': API_KEY,
    }
  );

  // Test 4: Get research status (if we got an ID)
  const startResult = results.find(
    r => r.endpoint === '/research/start' && r.status === 'pass'
  );
  
  if (startResult?.response?.researchId) {
    const researchId = startResult.response.researchId;
    
    // Without auth (should fail)
    await testEndpoint('GET', `/research/${researchId}/status`);
    
    // With API key
    await testEndpoint('GET', `/research/${researchId}/status`, null, {
      'X-API-Key': API_KEY,
    });
    
    // Get report (probably not ready yet)
    await testEndpoint('GET', `/research/${researchId}/report`, null, {
      'X-API-Key': API_KEY,
    });
  }

  // Test 5: Evidence search (optional auth)
  await testEndpoint('POST', '/evidence/search', {
    query: 'OpenAI GPT-4 capabilities',
    limit: 5,
  });

  // Test 6: Invalid request (missing required fields)
  await testEndpoint(
    'POST',
    '/research/start',
    {
      company: 'Test Company',
      // Missing website and thesisType
    },
    {
      'X-API-Key': API_KEY,
    }
  );

  // Test 7: Rate limiting (make many requests quickly)
  console.log('\n🔄 Testing rate limiting...');
  const rateLimitPromises = [];
  for (let i = 0; i < 15; i++) {
    rateLimitPromises.push(
      axios.get(`${API_BASE}/health`).catch(e => e.response)
    );
  }
  
  const rateLimitResponses = await Promise.all(rateLimitPromises);
  const rateLimited = rateLimitResponses.filter(r => r?.status === 429);
  console.log(`📊 Rate limited requests: ${rateLimited.length}/15`);

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  console.table(
    results.map(r => ({
      Endpoint: r.endpoint,
      Method: r.method,
      Status: r.status,
      Error: r.error || '-',
    }))
  );

  // Check if API documentation is available
  console.log('\n📚 API Documentation:');
  console.log(`Visit http://localhost:${config.API_PORT}/documentation for interactive API docs`);
}

// Run tests
runTests().catch(console.error);