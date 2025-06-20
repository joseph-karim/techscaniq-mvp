#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const urls = [
  'https://scan.techscaniq.com',
  'http://localhost:5173'
];

const apiEndpoints = [
  'https://techscaniq-mvp.onrender.com/api/health',
  'https://techscaniq-mvp.onrender.com/api/langgraph/test'
];

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function checkCSPHeaders(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`\nChecking CSP headers for ${url}...`);
    
    client.get(url, (res) => {
      const csp = res.headers['content-security-policy'];
      
      if (csp) {
        console.log(`${colors.green}✓ CSP Header found${colors.reset}`);
        
        // Parse and display CSP directives
        const directives = csp.split(';').map(d => d.trim());
        console.log('\nCSP Directives:');
        
        directives.forEach(directive => {
          if (directive.includes('connect-src')) {
            console.log(`${colors.yellow}→ ${directive}${colors.reset}`);
            
            // Check if our API domain is included
            if (directive.includes('techscaniq-mvp.onrender.com')) {
              console.log(`  ${colors.green}✓ API domain is allowed${colors.reset}`);
            } else {
              console.log(`  ${colors.red}✗ API domain is NOT allowed${colors.reset}`);
            }
          }
        });
        
        resolve({ url, status: 'success', csp });
      } else {
        console.log(`${colors.red}✗ No CSP header found${colors.reset}`);
        resolve({ url, status: 'no-csp', csp: null });
      }
    }).on('error', (err) => {
      console.log(`${colors.red}✗ Error: ${err.message}${colors.reset}`);
      resolve({ url, status: 'error', error: err.message });
    });
  });
}

function testAPIConnection(url) {
  return new Promise((resolve) => {
    console.log(`\nTesting API connection to ${url}...`);
    
    https.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log(`${colors.green}✓ API is reachable (Status: ${res.statusCode})${colors.reset}`);
        resolve({ url, status: 'success', statusCode: res.statusCode });
      } else {
        console.log(`${colors.yellow}⚠ API returned status: ${res.statusCode}${colors.reset}`);
        resolve({ url, status: 'warning', statusCode: res.statusCode });
      }
    }).on('error', (err) => {
      console.log(`${colors.red}✗ API connection failed: ${err.message}${colors.reset}`);
      resolve({ url, status: 'error', error: err.message });
    });
  });
}

async function main() {
  console.log('CSP Configuration Verification Script');
  console.log('=====================================');
  
  // Check CSP headers
  console.log('\n1. Checking CSP Headers:');
  for (const url of urls) {
    if (url.includes('localhost')) {
      console.log(`\n${colors.yellow}Skipping localhost (run locally to test)${colors.reset}`);
      continue;
    }
    await checkCSPHeaders(url);
  }
  
  // Test API connections
  console.log('\n\n2. Testing API Connections:');
  for (const endpoint of apiEndpoints) {
    await testAPIConnection(endpoint);
  }
  
  // Summary and recommendations
  console.log('\n\n3. Summary & Recommendations:');
  console.log('================================');
  console.log('If CSP is blocking API calls:');
  console.log('1. Ensure netlify.toml includes the API domain in connect-src');
  console.log('2. Clear browser cache and hard reload');
  console.log('3. Check browser console for CSP violation messages');
  console.log('4. Verify VITE_API_URL is set correctly in .env');
  console.log('\nTo test locally:');
  console.log('- Run: npm run dev');
  console.log('- Navigate to: http://localhost:5173/test/csp-test');
  console.log('- Check browser console for violations');
}

main().catch(console.error);