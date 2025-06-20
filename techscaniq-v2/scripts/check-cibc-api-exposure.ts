#!/usr/bin/env node
import axios from 'axios';
import { config } from 'dotenv';

config();

async function checkAPIExposure() {
  console.log('🔍 Checking CIBC API Exposure (Responsible Disclosure Check)\n');
  
  const findings: any[] = [];
  
  // Check GraphQL introspection
  console.log('1. Checking GraphQL Introspection...');
  try {
    const introspectionQuery = {
      query: `
        {
          __schema {
            queryType {
              name
            }
            types {
              name
              kind
            }
          }
        }
      `,
    };
    
    const graphqlResponse = await axios.post('https://www.cibc.com/graphql', introspectionQuery, {
      timeout: 5000,
      validateStatus: () => true,
    });
    
    if (graphqlResponse.status === 200 && graphqlResponse.data.__schema) {
      findings.push({
        severity: 'HIGH',
        type: 'GraphQL Introspection Enabled',
        description: 'GraphQL endpoint allows schema introspection, exposing API structure',
        url: 'https://www.cibc.com/graphql',
        recommendation: 'Disable introspection in production',
      });
      console.log('   ⚠️ GraphQL introspection is ENABLED');
    } else {
      console.log('   ✅ GraphQL introspection appears disabled or endpoint requires auth');
    }
  } catch (error) {
    console.log('   ✅ GraphQL endpoint not accessible');
  }
  
  // Check Swagger/OpenAPI
  console.log('\n2. Checking API Documentation Exposure...');
  const docEndpoints = [
    { url: '/api-docs', name: 'API Docs' },
    { url: '/swagger', name: 'Swagger UI' },
    { url: '/swagger.json', name: 'Swagger JSON' },
    { url: '/openapi', name: 'OpenAPI' },
    { url: '/openapi.json', name: 'OpenAPI JSON' },
    { url: '/api/swagger', name: 'API Swagger' },
    { url: '/v1/api-docs', name: 'V1 API Docs' },
    { url: '/v2/api-docs', name: 'V2 API Docs' },
  ];
  
  for (const endpoint of docEndpoints) {
    try {
      const response = await axios.get(`https://www.cibc.com${endpoint.url}`, {
        timeout: 5000,
        validateStatus: () => true,
        headers: {
          'Accept': 'application/json, text/html',
        },
      });
      
      if (response.status === 200) {
        const content = response.data;
        const isSwagger = typeof content === 'object' && (content.swagger || content.openapi);
        const hasAPIInfo = typeof content === 'string' && content.includes('swagger') || content.includes('api');
        
        if (isSwagger || hasAPIInfo) {
          findings.push({
            severity: 'MEDIUM',
            type: 'API Documentation Exposed',
            description: `${endpoint.name} is publicly accessible`,
            url: `https://www.cibc.com${endpoint.url}`,
            details: isSwagger ? 'Returns API specification' : 'Returns API-related content',
            recommendation: 'Add authentication or move to internal network',
          });
          console.log(`   ⚠️ ${endpoint.name} is EXPOSED (${response.status})`);
        } else {
          console.log(`   ℹ️ ${endpoint.name} returns non-API content (${response.status})`);
        }
      } else if (response.status === 401 || response.status === 403) {
        console.log(`   ✅ ${endpoint.name} requires authentication (${response.status})`);
      } else {
        console.log(`   - ${endpoint.name} returns ${response.status}`);
      }
    } catch (error) {
      console.log(`   - ${endpoint.name} not accessible`);
    }
  }
  
  // Check for common API versioning patterns
  console.log('\n3. Checking API Version Endpoints...');
  const versionEndpoints = ['/api/v1', '/api/v2', '/api/v3'];
  
  for (const endpoint of versionEndpoints) {
    try {
      const response = await axios.get(`https://www.cibc.com${endpoint}`, {
        timeout: 5000,
        validateStatus: () => true,
      });
      
      if (response.status === 200) {
        console.log(`   ℹ️ ${endpoint} is accessible - checking for information disclosure...`);
        
        // Check response for sensitive information
        const responseText = JSON.stringify(response.data).toLowerCase();
        const sensitivePatterns = ['password', 'token', 'key', 'secret', 'internal', 'debug'];
        const foundPatterns = sensitivePatterns.filter(pattern => responseText.includes(pattern));
        
        if (foundPatterns.length > 0) {
          findings.push({
            severity: 'HIGH',
            type: 'Potential Information Disclosure',
            description: `API endpoint may expose sensitive information`,
            url: `https://www.cibc.com${endpoint}`,
            patterns: foundPatterns,
            recommendation: 'Review API responses for sensitive data',
          });
        }
      }
    } catch (error) {
      // Ignore
    }
  }
  
  // Check .well-known endpoints
  console.log('\n4. Checking .well-known endpoints...');
  try {
    const response = await axios.get('https://www.cibc.com/.well-known/', {
      timeout: 5000,
      validateStatus: () => true,
    });
    
    if (response.status === 200) {
      console.log('   ℹ️ .well-known directory is browsable');
      
      // Check for security.txt
      try {
        const securityTxt = await axios.get('https://www.cibc.com/.well-known/security.txt');
        console.log('   ✅ security.txt found - good security practice!');
      } catch {
        console.log('   ℹ️ No security.txt file found');
        findings.push({
          severity: 'LOW',
          type: 'Missing security.txt',
          description: 'No security contact information published',
          recommendation: 'Add .well-known/security.txt with security contact info',
        });
      }
    }
  } catch (error) {
    console.log('   - .well-known not accessible');
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`Found ${findings.length} potential security considerations:`);
  
  const bySeverity = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  Object.entries(bySeverity).forEach(([severity, count]) => {
    console.log(`   ${severity}: ${count}`);
  });
  
  if (findings.length > 0) {
    console.log('\n⚠️ Recommendations:');
    console.log('1. These findings should be verified by CIBC security team');
    console.log('2. Some endpoints may be intentionally public');
    console.log('3. Follow responsible disclosure if reporting');
    console.log('4. Do not attempt to exploit or access sensitive data');
    
    console.log('\n📧 To report these findings:');
    console.log('1. Check https://www.cibc.com/.well-known/security.txt for security contacts');
    console.log('2. Look for bug bounty programs on HackerOne/Bugcrowd');
    console.log('3. Use official CIBC contact channels');
  } else {
    console.log('\n✅ No significant security exposures found');
  }
  
  // Save findings
  if (findings.length > 0) {
    const report = {
      organization: 'CIBC',
      domain: 'cibc.com',
      checkDate: new Date().toISOString(),
      findings,
      disclaimer: 'This is a responsible disclosure check. No exploitation was attempted.',
    };
    
    const fs = await import('fs/promises');
    const path = await import('path');
    const outputPath = path.join(process.cwd(), 'data', 'security-checks', `cibc-api-check-${Date.now()}.json`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Findings saved to: ${outputPath}`);
  }
}

// Run check
checkAPIExposure().catch(console.error);