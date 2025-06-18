import { OperatorAnalyzer } from '../src/tools/operatorAnalyzer';

async function testOperatorAnalyzer() {
  console.log('🤖 Testing Operator Analyzer...\n');
  
  const analyzer = new OperatorAnalyzer();
  const testUrl = 'https://www.fidelity.ca';

  // Test 1: Basic navigation flow
  console.log('Test 1: Basic navigation flow');
  console.time('Navigation test');
  
  try {
    const result = await analyzer.analyzeUserFlow(testUrl, {
      tasks: [
        { type: 'navigate', target: '/' },
        { type: 'screenshot', description: 'homepage' },
        { type: 'look-for', target: 'contact' },
        { type: 'look-for', target: 'about' },
        { type: 'navigate', target: '/about' },
        { type: 'screenshot', description: 'about-page' }
      ],
      timeout: 30000
    });
    
    console.timeEnd('Navigation test');
    console.log('\n✅ Navigation test successful!');
    console.log(`Pages visited: ${result.pagesVisited}`);
    console.log(`Screenshots taken: ${result.screenshots.length}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.discoveredElements.length > 0) {
      console.log(`\n🔍 Discovered elements: ${result.discoveredElements.length}`);
      result.discoveredElements.slice(0, 5).forEach(element => {
        console.log(`  - ${element.text} (${element.type})`);
      });
    }
    
    if (result.authentication.detected) {
      console.log('\n🔐 Authentication detected:');
      console.log(`  Type: ${result.authentication.type}`);
      console.log(`  Login URL: ${result.authentication.loginUrl}`);
    }
    
  } catch (error) {
    console.timeEnd('Navigation test');
    console.error('❌ Navigation test failed:', error);
  }

  // Test 2: Technology detection flow
  console.log('\n\nTest 2: Technology partner discovery');
  console.time('Partner discovery');
  
  try {
    const partnerResult = await analyzer.analyzeUserFlow(testUrl, {
      tasks: [
        { type: 'look-for', target: 'technology partners' },
        { type: 'look-for', target: 'integrations' },
        { type: 'look-for', target: 'platforms' },
        { type: 'extract', target: 'partner logos' },
        { type: 'extract', target: 'technology stack' }
      ],
      timeout: 30000
    });
    
    console.timeEnd('Partner discovery');
    console.log('\n✅ Partner discovery successful!');
    
    if (partnerResult.extractedData && Object.keys(partnerResult.extractedData).length > 0) {
      console.log('\n📊 Extracted data:');
      Object.entries(partnerResult.extractedData).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value).substring(0, 100)}...`);
      });
    }
    
  } catch (error) {
    console.timeEnd('Partner discovery');
    console.error('❌ Partner discovery failed:', error);
  }
}

// Run the test
testOperatorAnalyzer().catch(console.error);