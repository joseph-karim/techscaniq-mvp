#!/usr/bin/env node
import { config } from 'dotenv';
import { DirectSecurityScanner } from '../src/tools/directSecurityScanner';
import { APIDiscovery } from '../src/tools/apiDiscovery';
import axios from 'axios';
import * as dns from 'dns/promises';

config();

async function testBasicHTTP(url: string) {
  console.log('\n🌐 Testing Basic HTTP Request...');
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'TechScanIQ/1.0' }
    });
    
    console.log('✅ HTTP Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Server: ${response.headers['server'] || 'Unknown'}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Headers:`, Object.keys(response.headers).join(', '));
    
    return response.headers;
  } catch (error) {
    console.error('❌ HTTP request failed:', error);
    return null;
  }
}

async function testDNS(domain: string) {
  console.log('\n📡 Testing DNS Lookup...');
  try {
    const [addresses, mx, txt] = await Promise.all([
      dns.resolve4(domain).catch(() => []),
      dns.resolveMx(domain).catch(() => []),
      dns.resolveTxt(domain).catch(() => []),
    ]);
    
    console.log('✅ DNS Results:');
    console.log(`   A Records: ${addresses.join(', ') || 'None'}`);
    console.log(`   MX Records: ${mx.length} found`);
    console.log(`   TXT Records: ${txt.length} found`);
    
    return { addresses, mx, txt };
  } catch (error) {
    console.error('❌ DNS lookup failed:', error);
    return null;
  }
}

async function testSSL(hostname: string) {
  console.log('\n🔒 Testing SSL Certificate...');
  try {
    // Use SSLLabs API
    const response = await axios.get(
      `https://api.ssllabs.com/api/v3/analyze?host=${hostname}&fromCache=on&maxAge=24`,
      { timeout: 10000 }
    );
    
    if (response.data.status === 'READY') {
      const endpoint = response.data.endpoints?.[0];
      console.log('✅ SSL Results:');
      console.log(`   Grade: ${endpoint?.grade || 'Pending'}`);
      console.log(`   Protocol: ${endpoint?.details?.protocols?.[0]?.name || 'Unknown'}`);
      console.log(`   Status: ${response.data.status}`);
    } else {
      console.log('   SSL analysis in progress, status:', response.data.status);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ SSL check failed:', error);
    return null;
  }
}

async function testSecurityHeaders(url: string) {
  console.log('\n🛡️ Testing Security Headers...');
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'TechScanIQ/1.0' }
    });
    
    const securityHeaders = {
      'strict-transport-security': response.headers['strict-transport-security'],
      'x-frame-options': response.headers['x-frame-options'],
      'x-content-type-options': response.headers['x-content-type-options'],
      'x-xss-protection': response.headers['x-xss-protection'],
      'content-security-policy': response.headers['content-security-policy'],
      'referrer-policy': response.headers['referrer-policy'],
    };
    
    console.log('✅ Security Headers:');
    Object.entries(securityHeaders).forEach(([header, value]) => {
      console.log(`   ${header}: ${value ? '✓ Present' : '✗ Missing'}`);
    });
    
    // Calculate score
    const present = Object.values(securityHeaders).filter(v => v).length;
    const score = Math.round((present / Object.keys(securityHeaders).length) * 100);
    console.log(`   Score: ${score}/100`);
    
    return { headers: securityHeaders, score };
  } catch (error) {
    console.error('❌ Security headers check failed:', error);
    return null;
  }
}

async function testAPIEndpoints(domain: string) {
  console.log('\n🔌 Testing Common API Endpoints...');
  
  const commonEndpoints = [
    '/api',
    '/api/v1',
    '/api/v2', 
    '/graphql',
    '/rest',
    '/.well-known',
    '/robots.txt',
    '/sitemap.xml',
    '/api-docs',
    '/swagger',
    '/openapi',
  ];
  
  const found: string[] = [];
  
  for (const endpoint of commonEndpoints) {
    try {
      const url = `https://${domain}${endpoint}`;
      const response = await axios.head(url, { 
        timeout: 3000,
        validateStatus: (status) => status < 500 
      });
      
      if (response.status < 400) {
        found.push(`${endpoint} (${response.status})`);
        console.log(`   ✓ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      // Silently skip
    }
  }
  
  console.log(`✅ Found ${found.length} endpoints`);
  return found;
}

async function testTechnologyStack(url: string) {
  console.log('\n⚙️ Testing Technology Detection...');
  
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'TechScanIQ/1.0' }
    });
    
    const technologies: Record<string, string[]> = {
      'Server': [],
      'Languages': [],
      'Frameworks': [],
      'Analytics': [],
      'CDN': [],
    };
    
    // Check headers
    if (response.headers['server']) {
      technologies.Server.push(response.headers['server']);
    }
    if (response.headers['x-powered-by']) {
      technologies.Languages.push(response.headers['x-powered-by']);
    }
    
    // Check for common patterns in HTML
    const html = response.data.toString();
    
    // Analytics
    if (html.includes('google-analytics.com')) technologies.Analytics.push('Google Analytics');
    if (html.includes('googletagmanager.com')) technologies.Analytics.push('Google Tag Manager');
    if (html.includes('segment.com')) technologies.Analytics.push('Segment');
    
    // Frameworks
    if (html.includes('react')) technologies.Frameworks.push('React');
    if (html.includes('angular')) technologies.Frameworks.push('Angular');
    if (html.includes('vue')) technologies.Frameworks.push('Vue.js');
    if (html.includes('jquery')) technologies.Frameworks.push('jQuery');
    
    // CDN
    if (response.headers['cf-ray']) technologies.CDN.push('Cloudflare');
    if (response.headers['x-amz-cf-id']) technologies.CDN.push('CloudFront');
    if (response.headers['x-served-by']?.includes('cache')) technologies.CDN.push('Fastly');
    
    console.log('✅ Technologies Detected:');
    Object.entries(technologies).forEach(([category, techs]) => {
      if (techs.length > 0) {
        console.log(`   ${category}: ${techs.join(', ')}`);
      }
    });
    
    return technologies;
  } catch (error) {
    console.error('❌ Technology detection failed:', error);
    return null;
  }
}

async function suggestAdvancedTools() {
  console.log('\n🚀 Advanced Technical Evidence Gathering Tools:\n');
  
  console.log('1. 🎭 Playwright-Based Tools:');
  console.log('   - Visual regression testing');
  console.log('   - Performance timeline recording');
  console.log('   - Network waterfall analysis');
  console.log('   - JavaScript coverage reports');
  console.log('   - Accessibility tree extraction\n');
  
  console.log('2. 🔍 Deep Technical Analysis:');
  console.log('   - WebAssembly detection');
  console.log('   - Service Worker analysis');
  console.log('   - WebSocket endpoint discovery');
  console.log('   - GraphQL schema introspection');
  console.log('   - Source map extraction\n');
  
  console.log('3. 🛡️ Security Intelligence:');
  console.log('   - Subdomain enumeration');
  console.log('   - Certificate transparency logs');
  console.log('   - CORS policy analysis');
  console.log('   - Authentication flow detection');
  console.log('   - Rate limiting discovery\n');
  
  console.log('4. 📊 Business Intelligence:');
  console.log('   - Pricing model extraction');
  console.log('   - Feature comparison matrices');
  console.log('   - Customer testimonial mining');
  console.log('   - Integration partner discovery');
  console.log('   - Support channel mapping\n');
  
  console.log('5. 🤖 AI-Powered Analysis:');
  console.log('   - Screenshot understanding (GPT-4V)');
  console.log('   - UX flow analysis');
  console.log('   - Content sentiment analysis');
  console.log('   - Competitive positioning');
  console.log('   - Market gap identification\n');
}

async function runSimpleTests() {
  console.log('🧪 Simple Technical Tools Test\n');
  
  const testUrl = 'https://www.cibc.com';
  const testDomain = 'cibc.com';
  
  // Run basic tests
  await testBasicHTTP(testUrl);
  await testDNS(testDomain);
  await testSSL(testDomain);
  await testSecurityHeaders(testUrl);
  await testAPIEndpoints(testDomain);
  await testTechnologyStack(testUrl);
  
  // Suggest advanced tools
  await suggestAdvancedTools();
  
  console.log('\n✅ Test suite completed!');
}

// Run tests
runSimpleTests().catch(console.error);