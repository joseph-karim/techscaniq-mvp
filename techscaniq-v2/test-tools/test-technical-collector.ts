import { TechnicalCollector } from '../src/tools/technicalCollector';

async function testTechnicalCollector() {
  console.log('🏗️ Testing TechnicalCollector...\n');
  
  const collector = new TechnicalCollector();
  const testUrl = 'https://www.fidelity.ca';

  console.log(`Testing ${testUrl}`);
  console.time('Technical collection');
  
  try {
    const profile = await collector.collectTechnicalProfile(testUrl);
    console.timeEnd('Technical collection');
    
    console.log('\n✅ Collection successful!');
    
    // SSL/TLS Information
    if (profile.ssl) {
      console.log('\n🔒 SSL/TLS Information:');
      console.log(`  Issuer: ${profile.ssl.issuer}`);
      console.log(`  Valid from: ${profile.ssl.validFrom}`);
      console.log(`  Valid to: ${profile.ssl.validTo}`);
      console.log(`  Protocol: ${profile.ssl.protocol}`);
    }
    
    // DNS Information
    if (profile.dns && profile.dns.records) {
      console.log('\n🌐 DNS Records:');
      console.log(`  A Records: ${profile.dns.records.A?.length || 0}`);
      console.log(`  AAAA Records: ${profile.dns.records.AAAA?.length || 0}`);
      console.log(`  MX Records: ${profile.dns.records.MX?.length || 0}`);
      console.log(`  TXT Records: ${profile.dns.records.TXT?.length || 0}`);
    }
    
    // Performance Metrics
    if (profile.performance) {
      console.log('\n⚡ Performance Metrics:');
      console.log(`  DOM Content Loaded: ${profile.performance.domContentLoaded}ms`);
      console.log(`  Page Load: ${profile.performance.loadComplete}ms`);
      console.log(`  First Paint: ${profile.performance.firstPaint}ms`);
      console.log(`  Total Resources: ${profile.performance.resourceCount}`);
      console.log(`  Total Size: ${(profile.performance.totalSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Security Assessment
    if (profile.security) {
      console.log('\n🛡️ Security Assessment:');
      console.log(`  Risk Score: ${profile.security.overallRisk}/100`);
      console.log(`  HTTPS: ${profile.security.https ? 'Yes' : 'No'}`);
      console.log(`  Security Headers: ${profile.security.headers ? Object.keys(profile.security.headers).length : 0}`);
      if (profile.security.vulnerabilities && profile.security.vulnerabilities.length > 0) {
        console.log(`  Vulnerabilities found: ${profile.security.vulnerabilities.length}`);
      }
    }
    
    // Network Requests Summary
    if (profile.network && profile.network.summary) {
      console.log('\n📡 Network Summary:');
      console.log(`  Total Requests: ${profile.network.summary.totalRequests}`);
      console.log(`  Failed Requests: ${profile.network.summary.failedRequests}`);
      console.log(`  Blocked Requests: ${profile.network.summary.blockedRequests}`);
      console.log(`  External Domains: ${profile.network.summary.externalDomains}`);
    }
    
  } catch (error) {
    console.timeEnd('Technical collection');
    console.error('❌ Error:', error);
  }
}

// Run the test
testTechnicalCollector().catch(console.error);