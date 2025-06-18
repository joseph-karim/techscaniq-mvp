import { WebTechDetector } from '../src/tools/webTechDetector';

async function testWebTechDetector() {
  console.log('🔧 Testing WebTechDetector...\n');
  
  const detector = new WebTechDetector();
  const testUrls = [
    'https://www.fidelity.ca',
    'https://stripe.com',
    'https://www.shopify.com'
  ];

  for (const url of testUrls) {
    console.log(`\n📊 Testing ${url}`);
    console.time(`Detection for ${url}`);
    
    try {
      const result = await detector.detectTechnologies(url);
      console.timeEnd(`Detection for ${url}`);
      
      // Summary output
      console.log('\n✅ Detection successful!');
      console.log(`Frontend: ${result.technologies.frontend.length} technologies`);
      console.log(`Backend: ${result.technologies.backend.length} technologies`);
      console.log(`Analytics: ${result.technologies.analytics.length} tools`);
      console.log(`CDN: ${result.technologies.cdn.length} providers`);
      console.log(`CMS: ${result.technologies.cms.length} systems`);
      console.log(`Security headers: ${Object.keys(result.security.securityHeaders).length}`);
      
      // Show some key findings
      if (result.technologies.frontend.length > 0) {
        console.log('\nTop frontend technologies:');
        result.technologies.frontend.slice(0, 3).forEach(tech => {
          console.log(`  - ${tech.name} (confidence: ${tech.confidence})`);
        });
      }
      
      if (result.vendors.analytics.length > 0) {
        console.log('\nAnalytics providers:');
        result.vendors.analytics.forEach(provider => {
          console.log(`  - ${provider}`);
        });
      }
      
    } catch (error) {
      console.timeEnd(`Detection for ${url}`);
      console.error(`❌ Error testing ${url}:`, error);
    }
  }
}

// Run the test
testWebTechDetector().catch(console.error);