import { APIDiscovery } from '../src/tools/apiDiscovery';

async function testAPIDiscovery() {
  console.log('🔌 Testing API Discovery...\n');
  
  const discovery = new APIDiscovery();
  const testUrls = [
    'https://www.fidelity.ca',
    'https://api.stripe.com',
    'https://github.com'
  ];

  for (const url of testUrls) {
    console.log(`\n📊 Testing ${url}`);
    console.time(`API discovery for ${url}`);
    
    try {
      const apis = await discovery.discoverAPIs(url);
      console.timeEnd(`API discovery for ${url}`);
      
      console.log('\n✅ Discovery successful!');
      
      // Endpoints found
      if (apis.endpoints.length > 0) {
        console.log(`\n📍 Found ${apis.endpoints.length} API endpoints:`);
        apis.endpoints.slice(0, 5).forEach(endpoint => {
          console.log(`  ${endpoint.method} ${endpoint.path}`);
          if (endpoint.description) {
            console.log(`    Description: ${endpoint.description}`);
          }
        });
      }
      
      // Authentication methods
      if (apis.authentication.methods.length > 0) {
        console.log('\n🔑 Authentication methods:');
        apis.authentication.methods.forEach(method => {
          console.log(`  - ${method}`);
        });
        if (apis.authentication.oauth) {
          console.log(`  OAuth endpoints: ${apis.authentication.oauth.authorizationUrl}`);
        }
      }
      
      // Technologies detected
      console.log('\n🛠️ Technologies:');
      if (apis.technologies.frameworks.length > 0) {
        console.log(`  Frameworks: ${apis.technologies.frameworks.join(', ')}`);
      }
      if (apis.technologies.sdks.length > 0) {
        console.log(`  SDKs: ${apis.technologies.sdks.join(', ')}`);
      }
      if (apis.technologies.protocols.length > 0) {
        console.log(`  Protocols: ${apis.technologies.protocols.join(', ')}`);
      }
      
      // Technical details
      if (apis.technical.cors) {
        console.log('\n🌐 CORS Configuration:');
        console.log(`  Enabled: ${apis.technical.cors.enabled}`);
        if (apis.technical.cors.allowedOrigins) {
          console.log(`  Allowed Origins: ${apis.technical.cors.allowedOrigins.join(', ')}`);
        }
      }
      
      if (apis.technical.rateLimiting) {
        console.log('\n⏱️ Rate Limiting:');
        console.log(`  Detected: Yes`);
        if (apis.technical.rateLimiting.limit) {
          console.log(`  Limit: ${apis.technical.rateLimiting.limit}`);
        }
      }
      
    } catch (error) {
      console.timeEnd(`API discovery for ${url}`);
      console.error(`❌ Error testing ${url}:`, error);
    }
  }
}

// Run the test
testAPIDiscovery().catch(console.error);