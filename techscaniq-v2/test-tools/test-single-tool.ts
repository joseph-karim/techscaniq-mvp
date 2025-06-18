import { WebTechDetector } from '../src/tools/webTechDetector';
import { TechnicalCollector } from '../src/tools/technicalCollector';
import { APIDiscovery } from '../src/tools/apiDiscovery';

async function testSingleTool(toolName: string, url: string = 'https://www.fidelity.ca') {
  console.log(`\n🧪 Testing ${toolName} on ${url}\n`);
  
  const startTime = Date.now();
  
  try {
    switch (toolName.toLowerCase()) {
      case 'webtech':
      case 'webtechdetector':
        const techDetector = new WebTechDetector();
        const techResult = await techDetector.detectTechnologies(url);
        console.log('✅ WebTech Detection Success!');
        console.log(`Found ${Object.values(techResult.technologies).flat().length} technologies`);
        console.log(`Frontend: ${techResult.technologies.frontend.map(t => t.name).join(', ')}`);
        console.log(`Analytics: ${techResult.vendors.analytics.join(', ')}`);
        break;
        
      case 'technical':
      case 'technicalcollector':
        const techCollector = new TechnicalCollector();
        const techProfile = await techCollector.collectTechnicalProfile(url);
        console.log('✅ Technical Collection Success!');
        console.log(`SSL Valid: ${techProfile.ssl?.valid}`);
        console.log(`Load Time: ${techProfile.performance?.loadComplete}ms`);
        console.log(`Security Score: ${techProfile.security?.overallRisk}/100`);
        break;
        
      case 'api':
      case 'apidiscovery':
        const apiDiscovery = new APIDiscovery();
        const apis = await apiDiscovery.discoverAPIs(url);
        console.log('✅ API Discovery Success!');
        console.log(`Found ${apis.endpoints.length} endpoints`);
        console.log(`Auth methods: ${apis.authentication.methods.join(', ')}`);
        console.log(`Protocols: ${apis.technologies.protocols.join(', ')}`);
        break;
        
      default:
        console.error(`Unknown tool: ${toolName}`);
        console.log('Available tools: webtech, technical, api');
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️ Completed in ${(duration / 1000).toFixed(2)} seconds`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Failed after ${(duration / 1000).toFixed(2)} seconds`);
    console.error(error);
  }
}

// Get command line arguments
const toolName = process.argv[2] || 'webtech';
const url = process.argv[3] || 'https://www.fidelity.ca';

// Run the test
testSingleTool(toolName, url).catch(console.error);