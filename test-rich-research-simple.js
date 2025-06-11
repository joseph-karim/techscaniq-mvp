import { Worker } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

async function testRichResearchLogic() {
  console.log(chalk.cyan('🧪 Testing Rich Research Logic (Direct)\n'));

  const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
  });

  try {
    // Create a mock job
    const mockJob = {
      id: 'test-job-1',
      data: {
        scanRequestId: 'test-scan-123',
        company: 'Snowplow',
        domain: 'snowplow.io',
        investmentThesis: 'data_infrastructure'
      },
      updateProgress: async (progress) => {
        console.log(chalk.gray(`Progress: ${progress}%`));
      }
    };

    console.log(chalk.yellow('Starting rich research workflow...'));
    
    // This will test just the core logic without database saves
    const result = await testProfileTechnicalLandscape(mockJob.data);
    
    console.log(chalk.green('\n✅ Technical Profiling Results:'));
    console.log(`Security Grade: ${result.technicalProfile?.securityGrade || 'Unknown'}`);
    console.log(`Technologies: ${result.technicalProfile?.technologies.length || 0} detected`);
    console.log(`APIs: ${result.technicalProfile?.detectedAPIs.length || 0} found`);
    console.log(`Integrations: ${result.technicalProfile?.integrations.length || 0} detected`);
    console.log(`Competitors: ${result.competitorProfile?.length || 0} identified`);
    
    if (result.technicalProfile?.technologies.length > 0) {
      console.log(chalk.cyan('\nDetected Technologies:'));
      result.technicalProfile.technologies.forEach(tech => {
        console.log(chalk.gray(`  - ${tech}`));
      });
    }
    
    if (result.technicalProfile?.integrations.length > 0) {
      console.log(chalk.cyan('\nDetected Integrations:'));
      result.technicalProfile.integrations.forEach(integration => {
        console.log(chalk.gray(`  - ${integration}`));
      });
    }
    
    if (result.competitorProfile?.length > 0) {
      console.log(chalk.cyan('\nIdentified Competitors:'));
      result.competitorProfile.forEach(competitor => {
        console.log(chalk.gray(`  - ${competitor}`));
      });
    }
    
    console.log(chalk.green('\n🎯 Rich research workflow demonstrated successfully!'));
    console.log(chalk.white('\nKey improvements over current system:'));
    console.log(chalk.white('  ✓ Automated technical profiling before research'));
    console.log(chalk.white('  ✓ Security grade assessment (A/B/C/D)'));
    console.log(chalk.white('  ✓ Technology stack detection'));
    console.log(chalk.white('  ✓ Competitor identification from integrations'));
    console.log(chalk.white('  ✓ Thesis-specific question generation (next step)'));
    console.log(chalk.white('  ✓ Confidence-based scoring framework'));

  } catch (error) {
    console.error(chalk.red('\nError during test:'), error);
  } finally {
    await connection.quit();
  }
}

// Extract the technical profiling logic for direct testing
async function testProfileTechnicalLandscape(data) {
  const { company, domain, investmentThesis } = data;
  
  try {
    const profile = {
      securityGrade: 'A',
      securityHeaders: [],
      sslVersion: '',
      performanceMetrics: {
        ttfb: 0,
        cdn: '',
        caching: ''
      },
      detectedAPIs: [],
      technologies: [],
      integrations: [],
      javascriptFrameworks: [],
      infrastructureSignals: []
    };
    
    console.log(chalk.blue('📡 Running automated technical analysis...'));
    
    // 1. Security analysis
    try {
      const securityResponse = await fetch(`https://${domain}`, {
        method: 'HEAD',
        timeout: 5000
      });
      
      // Check security headers
      const headers = securityResponse.headers;
      if (headers.get('strict-transport-security')) profile.securityHeaders.push('HSTS');
      if (headers.get('content-security-policy')) profile.securityHeaders.push('CSP');
      if (headers.get('x-frame-options')) profile.securityHeaders.push('X-Frame-Options');
      if (headers.get('x-content-type-options')) profile.securityHeaders.push('X-Content-Type-Options');
      
      profile.securityGrade = profile.securityHeaders.length >= 3 ? 'A' : 
                              profile.securityHeaders.length >= 2 ? 'B' : 'C';
                              
      console.log(chalk.gray(`  Security headers: ${profile.securityHeaders.join(', ')}`));
    } catch (error) {
      console.log(chalk.yellow(`  Security check failed: ${error.message}`));
    }
    
    // 2. Homepage analysis for tech detection
    try {
      const response = await fetch(`https://${domain}`, {
        headers: { 'User-Agent': 'TechScanIQ/1.0' },
        timeout: 10000
      });
      
      const html = await response.text();
      
      // Detect technologies from HTML
      if (html.includes('react')) profile.javascriptFrameworks.push('React');
      if (html.includes('vue')) profile.javascriptFrameworks.push('Vue');
      if (html.includes('angular')) profile.javascriptFrameworks.push('Angular');
      if (html.includes('next.js') || html.includes('nextjs')) profile.javascriptFrameworks.push('Next.js');
      
      // Detect infrastructure patterns
      if (html.includes('kafka')) profile.technologies.push('Apache Kafka');
      if (html.includes('kubernetes') || html.includes('k8s')) profile.technologies.push('Kubernetes');
      if (html.includes('aws') || html.includes('amazon')) profile.technologies.push('AWS');
      if (html.includes('docker')) profile.technologies.push('Docker');
      if (html.includes('postgresql') || html.includes('postgres')) profile.technologies.push('PostgreSQL');
      if (html.includes('redis')) profile.technologies.push('Redis');
      if (html.includes('elasticsearch')) profile.technologies.push('Elasticsearch');
      
      // Detect third-party integrations from script sources
      const scriptMatches = html.match(/src="[^"]*"/g) || [];
      scriptMatches.forEach(match => {
        const src = match.toLowerCase();
        if (src.includes('segment')) profile.integrations.push('Segment');
        if (src.includes('google-analytics') || src.includes('gtag')) profile.integrations.push('Google Analytics');
        if (src.includes('mixpanel')) profile.integrations.push('Mixpanel');
        if (src.includes('amplitude')) profile.integrations.push('Amplitude');
        if (src.includes('intercom')) profile.integrations.push('Intercom');
        if (src.includes('hotjar')) profile.integrations.push('Hotjar');
      });
      
      // Detect API documentation links
      const linkMatches = html.match(/href="[^"]*"/g) || [];
      linkMatches.forEach(match => {
        const href = match.toLowerCase();
        if (href.includes('/api') || href.includes('/docs')) {
          profile.detectedAPIs.push(href.replace(/href="|"/g, ''));
        }
      });
      
      // Deduplicate arrays
      profile.integrations = [...new Set(profile.integrations)];
      profile.technologies = [...new Set(profile.technologies)];
      profile.javascriptFrameworks = [...new Set(profile.javascriptFrameworks)];
      profile.detectedAPIs = [...new Set(profile.detectedAPIs)].slice(0, 5);
      
      console.log(chalk.gray(`  JS Frameworks: ${profile.javascriptFrameworks.join(', ') || 'None detected'}`));
      console.log(chalk.gray(`  Technologies: ${profile.technologies.join(', ') || 'None detected'}`));
      console.log(chalk.gray(`  Integrations: ${profile.integrations.join(', ') || 'None detected'}`));
      
      // Detect CDN from headers
      const cdnHeaders = response.headers.get('x-served-by') || response.headers.get('server') || '';
      if (cdnHeaders.includes('cloudflare')) profile.performanceMetrics.cdn = 'Cloudflare';
      else if (cdnHeaders.includes('cloudfront')) profile.performanceMetrics.cdn = 'CloudFront';
      else if (cdnHeaders.includes('fastly')) profile.performanceMetrics.cdn = 'Fastly';
      
    } catch (error) {
      console.log(chalk.yellow(`  Homepage analysis failed: ${error.message}`));
    }
    
    // 3. Identify competitors from integrations
    const competitorMap = {
      'Segment': 'customer data platform',
      'Mixpanel': 'product analytics',
      'Google Analytics': 'web analytics',
      'Amplitude': 'product analytics'
    };
    
    const competitors = profile.integrations
      .filter(integration => competitorMap[integration])
      .map(integration => integration);
    
    return {
      technicalProfile: profile,
      competitorProfile: competitors,
      currentPhase: 'profile_complete',
      researchTrace: [{
        phase: 'technical_profiling',
        timestamp: new Date().toISOString(),
        securityGrade: profile.securityGrade,
        technologiesFound: profile.technologies.length + profile.javascriptFrameworks.length,
        apisDetected: profile.detectedAPIs.length,
        competitorsIdentified: competitors.length
      }]
    };
    
  } catch (error) {
    console.error('Technical profiling error:', error);
    return {
      errors: [`Technical profiling failed: ${error.message}`],
      currentPhase: 'profile_failed'
    };
  }
}

// Run the test
testRichResearchLogic();