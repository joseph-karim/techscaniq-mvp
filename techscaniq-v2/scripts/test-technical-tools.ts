#!/usr/bin/env node
import { config } from 'dotenv';
import { WebTechDetector } from '../src/tools/webTechDetector';
import { DirectSecurityScanner } from '../src/tools/directSecurityScanner';
import { TechnicalCollector } from '../src/tools/technicalCollector';
import { DirectCrawl4AI } from '../src/tools/directCrawl4AI';
import { APIDiscovery } from '../src/tools/apiDiscovery';
import * as fs from 'fs/promises';
import * as path from 'path';

config();

async function testWebTechDetector(url: string) {
  console.log('\n🔧 Testing WebTechDetector...');
  console.log(`   URL: ${url}`);
  
  try {
    const detector = new WebTechDetector();
    const results = await detector.detectTechnologies(url);
    
    console.log('✅ WebTechDetector Results:');
    console.log(`   Technologies found: ${results.technologies.length}`);
    
    // Group by categories
    const byCategory = results.technologies.reduce((acc, tech) => {
      tech.categories.forEach(cat => {
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(tech.name);
      });
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(byCategory).forEach(([cat, techs]) => {
      console.log(`   ${cat}: ${techs.join(', ')}`);
    });
    
    if (results.metadata) {
      console.log('   Metadata:', JSON.stringify(results.metadata, null, 2));
    }
    
    return results;
  } catch (error) {
    console.error('❌ WebTechDetector failed:', error);
    return null;
  }
}

async function testDirectSecurityScanner(domain: string) {
  console.log('\n🔒 Testing DirectSecurityScanner...');
  console.log(`   Domain: ${domain}`);
  
  try {
    const scanner = new DirectSecurityScanner();
    const results = await scanner.scanSecurity(domain);
    
    console.log('✅ Security Scanner Results:');
    console.log(`   SSL Grade: ${results.ssl?.grade || 'N/A'}`);
    console.log(`   Headers Score: ${results.headers?.score || 0}/100`);
    console.log(`   DNS Security: ${results.dns?.dnssec ? 'Enabled' : 'Disabled'}`);
    
    // Show vulnerabilities
    if (results.vulnerabilities && results.vulnerabilities.length > 0) {
      console.log('   ⚠️ Vulnerabilities:');
      results.vulnerabilities.forEach(vuln => {
        console.log(`      - ${vuln.type}: ${vuln.description}`);
      });
    }
    
    // Show recommendations
    if (results.recommendations && results.recommendations.length > 0) {
      console.log('   💡 Recommendations:');
      results.recommendations.slice(0, 3).forEach(rec => {
        console.log(`      - ${rec}`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('❌ Security Scanner failed:', error);
    return null;
  }
}

async function testTechnicalCollector(domain: string) {
  console.log('\n🔍 Testing TechnicalCollector...');
  console.log(`   Domain: ${domain}`);
  
  try {
    const collector = new TechnicalCollector();
    // Test if method exists
    const methodName = 'collectTechnicalEvidence';
    if (!(methodName in collector)) {
      console.log(`   Method ${methodName} not found, checking available methods...`);
      console.log('   Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(collector)));
      return null;
    }
    
    const results = await (collector as any).collectTechnicalEvidence(domain);
    
    console.log('✅ Technical Collector Results:');
    console.log(`   HTTP Info: ${results.httpInfo ? 'Collected' : 'Failed'}`);
    console.log(`   DNS Records: ${results.dnsRecords ? Object.keys(results.dnsRecords).length : 0} types`);
    console.log(`   Ports Open: ${results.ports?.open?.length || 0}`);
    console.log(`   Subdomains: ${results.subdomains?.length || 0}`);
    
    return results;
  } catch (error) {
    console.error('❌ Technical Collector failed:', error);
    return null;
  }
}

async function testCrawl4AI(url: string) {
  console.log('\n🕷️ Testing Crawl4AI with Sitemap...');
  console.log(`   URL: ${url}`);
  
  try {
    const crawler = new DirectCrawl4AI();
    
    // Test sales intelligence extraction
    const results = await crawler.extract(url, {
      extractionType: 'sales_intelligence',
      useSitemap: true,
      maxPages: 3,
    });
    
    console.log('✅ Crawl4AI Results:');
    console.log(`   Pages crawled: ${results.pages?.length || 1}`);
    console.log(`   Content length: ${results.content.length} chars`);
    
    if (results.metadata) {
      console.log('   Metadata:');
      console.log(`     - Title: ${results.metadata.title}`);
      console.log(`     - Description: ${results.metadata.description}`);
      console.log(`     - Keywords: ${results.metadata.keywords?.join(', ') || 'None'}`);
    }
    
    if (results.salesIntelligence) {
      console.log('   Sales Intelligence:');
      console.log(`     - Company Info: ${results.salesIntelligence.companyInfo ? 'Found' : 'Not found'}`);
      console.log(`     - Tech Stack: ${results.salesIntelligence.techStack?.length || 0} items`);
      console.log(`     - Key Personnel: ${results.salesIntelligence.keyPersonnel?.length || 0} people`);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Crawl4AI failed:', error);
    return null;
  }
}

async function testAPIDiscovery(domain: string) {
  console.log('\n🔌 Testing API Discovery...');
  console.log(`   Domain: ${domain}`);
  
  try {
    const discovery = new APIDiscovery();
    const results = await discovery.discoverAPIs(domain);
    
    console.log('✅ API Discovery Results:');
    console.log(`   APIs found: ${results.apis.length}`);
    
    results.apis.forEach((api, idx) => {
      console.log(`   ${idx + 1}. ${api.name || 'Unknown API'}`);
      console.log(`      URL: ${api.url}`);
      console.log(`      Type: ${api.type}`);
      if (api.documentation) {
        console.log(`      Docs: ${api.documentation}`);
      }
    });
    
    return results;
  } catch (error) {
    console.error('❌ API Discovery failed:', error);
    return null;
  }
}

async function exploreAdditionalTools() {
  console.log('\n🚀 Additional Tool Ideas for Richer Technical Evidence:\n');
  
  const additionalTools = [
    {
      name: 'Performance Analyzer',
      description: 'Lighthouse-based performance metrics, Core Web Vitals, load times',
      implementation: 'Use Puppeteer with Lighthouse API',
      evidence: ['PageSpeed scores', 'Time to Interactive', 'First Contentful Paint', 'Bundle sizes'],
    },
    {
      name: 'Accessibility Scanner',
      description: 'WCAG compliance, accessibility violations, ARIA usage',
      implementation: 'Axe-core or Pa11y integration',
      evidence: ['Accessibility score', 'Violation count by severity', 'Color contrast issues'],
    },
    {
      name: 'JavaScript Framework Detector',
      description: 'Deep analysis of JS frameworks, versions, and dependencies',
      implementation: 'Analyze webpack chunks, package.json from source maps',
      evidence: ['React/Vue/Angular versions', 'State management libs', 'Build tools'],
    },
    {
      name: 'Cookie & Privacy Analyzer',
      description: 'Cookie usage, tracking pixels, GDPR compliance',
      implementation: 'Intercept network requests, analyze cookies',
      evidence: ['Third-party trackers', 'Cookie categories', 'Privacy policy links'],
    },
    {
      name: 'CDN & Infrastructure Mapper',
      description: 'Identify CDN providers, edge locations, infrastructure',
      implementation: 'Analyze response headers, DNS lookups, traceroute',
      evidence: ['CDN provider', 'Geographic distribution', 'Cache strategies'],
    },
    {
      name: 'Social Media Footprint Analyzer',
      description: 'Extract social media links, engagement metrics, sharing data',
      implementation: 'Parse meta tags, OpenGraph data, Twitter cards',
      evidence: ['Social profiles', 'Share counts', 'Engagement metrics'],
    },
    {
      name: 'Form & Interaction Analyzer',
      description: 'Identify forms, CTAs, conversion points, user flows',
      implementation: 'DOM analysis, form detection, button tracking',
      evidence: ['Form types', 'Required fields', 'Validation methods', 'CTA placement'],
    },
    {
      name: 'Mobile Experience Analyzer',
      description: 'Mobile optimization, responsive design, app deep links',
      implementation: 'Viewport testing, touch target analysis',
      evidence: ['Mobile score', 'Responsive breakpoints', 'App store links'],
    },
    {
      name: 'Content Strategy Analyzer',
      description: 'Blog frequency, content types, SEO optimization',
      implementation: 'Sitemap parsing, content analysis, keyword density',
      evidence: ['Publishing frequency', 'Content categories', 'SEO scores'],
    },
    {
      name: 'Integration Discovery Tool',
      description: 'Identify third-party integrations, APIs, webhooks',
      implementation: 'Network request analysis, script tag inspection',
      evidence: ['Payment gateways', 'Analytics tools', 'CRM integrations'],
    },
  ];
  
  additionalTools.forEach(tool => {
    console.log(`📦 ${tool.name}`);
    console.log(`   ${tool.description}`);
    console.log(`   Implementation: ${tool.implementation}`);
    console.log(`   Evidence types: ${tool.evidence.join(', ')}`);
    console.log('');
  });
  
  console.log('🤖 Operator-Driven Navigation Ideas:\n');
  
  const operatorIdeas = [
    {
      name: 'Interactive Demo Explorer',
      description: 'Navigate through product demos, record workflows',
      actions: ['Click buttons', 'Fill forms', 'Navigate menus', 'Screenshot key states'],
    },
    {
      name: 'Pricing Calculator Navigator',
      description: 'Interact with pricing pages, extract pricing models',
      actions: ['Select options', 'Calculate totals', 'Compare tiers', 'Find hidden costs'],
    },
    {
      name: 'Documentation Crawler',
      description: 'Deep dive into technical docs, API references',
      actions: ['Follow doc links', 'Extract code samples', 'Map API endpoints', 'Find integration guides'],
    },
    {
      name: 'Support Portal Analyzer',
      description: 'Analyze support resources, FAQ patterns',
      actions: ['Search common issues', 'Extract response times', 'Map support channels'],
    },
    {
      name: 'Career Page Intelligence',
      description: 'Extract hiring signals, tech stack from job posts',
      actions: ['Parse job descriptions', 'Extract required skills', 'Identify team growth'],
    },
  ];
  
  operatorIdeas.forEach(idea => {
    console.log(`🎯 ${idea.name}`);
    console.log(`   ${idea.description}`);
    console.log(`   Actions: ${idea.actions.join(', ')}`);
    console.log('');
  });
}

async function runAllTests() {
  console.log('🧪 Technical Tools Test Suite\n');
  console.log('Testing tools with CIBC website...\n');
  
  const testUrl = 'https://www.cibc.com';
  const testDomain = 'cibc.com';
  
  // Create results directory
  const resultsDir = path.join(process.cwd(), 'data', 'tool-test-results');
  await fs.mkdir(resultsDir, { recursive: true });
  
  const results: any = {
    timestamp: new Date().toISOString(),
    url: testUrl,
    domain: testDomain,
    tools: {},
  };
  
  // Test each tool
  results.tools.webTechDetector = await testWebTechDetector(testUrl);
  results.tools.securityScanner = await testDirectSecurityScanner(testDomain);
  results.tools.technicalCollector = await testTechnicalCollector(testDomain);
  results.tools.crawl4ai = await testCrawl4AI(testUrl);
  results.tools.apiDiscovery = await testAPIDiscovery(testDomain);
  
  // Save results
  const outputPath = path.join(resultsDir, `tool-test-${Date.now()}.json`);
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
  
  // Explore additional tools
  await exploreAdditionalTools();
  
  // Summary
  console.log('\n📊 Test Summary:');
  Object.entries(results.tools).forEach(([tool, result]) => {
    console.log(`   ${tool}: ${result ? '✅ Success' : '❌ Failed'}`);
  });
}

// Run tests
runAllTests().catch(console.error);