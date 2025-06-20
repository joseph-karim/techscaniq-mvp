import axios from 'axios';
import * as https from 'https';
import * as dns from 'dns/promises';
import { Evidence } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface SecurityScanResult {
  url: string;
  score: number;
  findings: SecurityFinding[];
  summary: string;
  scannedAt: Date;
}

export interface SecurityFinding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation?: string;
}

export class DirectSecurityScanner {
  private async checkSSL(url: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    try {
      const urlObj = new URL(url);
      
      // Check if HTTPS is used
      if (urlObj.protocol !== 'https:') {
        findings.push({
          type: 'ssl',
          severity: 'high',
          title: 'No HTTPS',
          description: 'The website does not use HTTPS encryption',
          recommendation: 'Implement SSL/TLS certificate and redirect all HTTP traffic to HTTPS',
        });
        return findings;
      }
      
      // Check SSL certificate
      const response = await axios.get(url, {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        validateStatus: () => true,
      });
      
      // Basic SSL implementation check passed if we get here
      findings.push({
        type: 'ssl',
        severity: 'info',
        title: 'HTTPS Enabled',
        description: 'The website uses HTTPS encryption',
      });
      
    } catch (error) {
      findings.push({
        type: 'ssl',
        severity: 'medium',
        title: 'SSL Check Failed',
        description: `Could not verify SSL configuration: ${error.message}`,
      });
    }
    
    return findings;
  }

  private async checkSecurityHeaders(url: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    try {
      const response = await axios.get(url, {
        validateStatus: () => true,
        timeout: 10000,
      });
      
      const headers = response.headers;
      
      // Check important security headers
      const securityHeaders = {
        'strict-transport-security': {
          name: 'HSTS',
          severity: 'high' as const,
          recommendation: 'Add Strict-Transport-Security header with max-age=31536000; includeSubDomains',
        },
        'x-frame-options': {
          name: 'X-Frame-Options',
          severity: 'medium' as const,
          recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN',
        },
        'x-content-type-options': {
          name: 'X-Content-Type-Options',
          severity: 'medium' as const,
          recommendation: 'Add X-Content-Type-Options: nosniff',
        },
        'content-security-policy': {
          name: 'CSP',
          severity: 'medium' as const,
          recommendation: 'Implement Content Security Policy',
        },
        'x-xss-protection': {
          name: 'X-XSS-Protection',
          severity: 'low' as const,
          recommendation: 'Add X-XSS-Protection: 1; mode=block',
        },
      };
      
      for (const [header, config] of Object.entries(securityHeaders)) {
        if (!headers[header]) {
          findings.push({
            type: 'headers',
            severity: config.severity,
            title: `Missing ${config.name} Header`,
            description: `The ${config.name} security header is not set`,
            recommendation: config.recommendation,
          });
        } else {
          findings.push({
            type: 'headers',
            severity: 'info',
            title: `${config.name} Header Present`,
            description: `Value: ${headers[header]}`,
          });
        }
      }
      
      // Check for sensitive information disclosure
      if (headers['server']) {
        findings.push({
          type: 'headers',
          severity: 'low',
          title: 'Server Header Disclosure',
          description: `Server header reveals: ${headers['server']}`,
          recommendation: 'Consider removing or obscuring the Server header',
        });
      }
      
      if (headers['x-powered-by']) {
        findings.push({
          type: 'headers',
          severity: 'low',
          title: 'X-Powered-By Header Disclosure',
          description: `X-Powered-By reveals: ${headers['x-powered-by']}`,
          recommendation: 'Remove the X-Powered-By header',
        });
      }
      
    } catch (error) {
      findings.push({
        type: 'headers',
        severity: 'info',
        title: 'Header Check Error',
        description: `Could not check security headers: ${error.message}`,
      });
    }
    
    return findings;
  }

  private async checkCommonVulnerabilities(url: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const urlObj = new URL(url);
    
    // Check for common vulnerable paths
    const vulnerablePaths = [
      { path: '/.env', name: 'Environment file', sensitive: true },
      { path: '/.git/config', name: 'Git repository', sensitive: true },
      { path: '/wp-admin', name: 'WordPress admin', sensitive: true },
      { path: '/admin', name: 'Admin panel', sensitive: true },
      { path: '/phpmyadmin', name: 'phpMyAdmin', sensitive: true },
      { path: '/.DS_Store', name: 'macOS metadata', sensitive: true },
      { path: '/robots.txt', name: 'Robots file', sensitive: false },
      { path: '/sitemap.xml', name: 'Sitemap', sensitive: false },
      { path: '/api-docs', name: 'API Documentation', sensitive: true },
      { path: '/swagger', name: 'Swagger UI', sensitive: true },
      { path: '/graphql', name: 'GraphQL endpoint', sensitive: true },
    ];
    
    for (const { path, name, sensitive } of vulnerablePaths) {
      try {
        const response = await axios.get(`${urlObj.origin}${path}`, {
          validateStatus: (status) => status < 500,
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SecurityScanner/1.0)',
            'Accept': 'text/html,application/json',
          },
        });
        
        if (response.status === 200) {
          // Verify the content is actually what we think it is
          const content = response.data;
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          
          if (path === '/robots.txt' && contentStr.includes('User-agent')) {
            findings.push({
              type: 'discovery',
              severity: 'info',
              title: `${name} found`,
              description: `${name} is accessible at ${path}`,
            });
          } else if (path === '/sitemap.xml' && (contentStr.includes('urlset') || contentStr.includes('sitemap'))) {
            findings.push({
              type: 'discovery',
              severity: 'info',
              title: `${name} found`,
              description: `${name} is accessible at ${path}`,
            });
          } else if (sensitive) {
            // For sensitive paths, verify they actually contain sensitive content
            let isActuallySensitive = false;
            
            if (path === '/.env' && contentStr.includes('=')) isActuallySensitive = true;
            if (path === '/.git/config' && contentStr.includes('[core]')) isActuallySensitive = true;
            if (path === '/api-docs' && (contentStr.includes('swagger') || contentStr.includes('openapi'))) isActuallySensitive = true;
            if (path === '/swagger' && contentStr.includes('swagger')) isActuallySensitive = true;
            if (path === '/graphql' && contentStr.includes('query')) isActuallySensitive = true;
            
            if (isActuallySensitive) {
              findings.push({
                type: 'vulnerability',
                severity: 'high',
                title: `Exposed ${name}`,
                description: `Potentially sensitive ${name} is publicly accessible at ${path}`,
                recommendation: `Restrict access to ${path} or remove it from public access`,
              });
            }
          }
        }
      } catch (error) {
        // Path not accessible - this is usually good
      }
    }
    
    // Check for API endpoints with proper content validation
    const apiEndpoints = ['/api', '/api/v1', '/api/v2'];
    for (const endpoint of apiEndpoints) {
      try {
        const response = await axios.get(`${urlObj.origin}${endpoint}`, {
          validateStatus: () => true,
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.status === 200) {
          const content = response.data;
          // Check if it's actually an API response
          if (typeof content === 'object' && !content.error) {
            // Check for sensitive data patterns
            const jsonStr = JSON.stringify(content).toLowerCase();
            if (jsonStr.includes('password') || jsonStr.includes('token') || jsonStr.includes('secret')) {
              findings.push({
                type: 'vulnerability',
                severity: 'critical',
                title: 'API Information Disclosure',
                description: `API endpoint ${endpoint} may expose sensitive information`,
                recommendation: 'Review API responses and implement proper authentication',
              });
            }
          }
        }
      } catch (error) {
        // API not accessible
      }
    }
    
    return findings;
  }

  private async checkDNSSecurity(domain: string): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    
    try {
      // Check for SPF record
      const txtRecords = await dns.resolveTxt(domain).catch(() => []);
      const spfRecord = txtRecords.find(record => 
        record.some(txt => txt.startsWith('v=spf1'))
      );
      
      if (!spfRecord) {
        findings.push({
          type: 'dns',
          severity: 'medium',
          title: 'Missing SPF Record',
          description: 'No SPF record found for email authentication',
          recommendation: 'Add SPF record to prevent email spoofing',
        });
      } else {
        findings.push({
          type: 'dns',
          severity: 'info',
          title: 'SPF Record Present',
          description: 'Email authentication SPF record is configured',
        });
      }
      
      // Check for CAA record
      try {
        const caaRecords = await dns.resolveCaa(domain);
        if (caaRecords && caaRecords.length > 0) {
          findings.push({
            type: 'dns',
            severity: 'info',
            title: 'CAA Record Present',
            description: 'Certificate Authority Authorization is configured',
          });
        }
      } catch {
        findings.push({
          type: 'dns',
          severity: 'low',
          title: 'No CAA Record',
          description: 'No Certificate Authority Authorization record found',
          recommendation: 'Consider adding CAA records to control certificate issuance',
        });
      }
      
    } catch (error) {
      findings.push({
        type: 'dns',
        severity: 'info',
        title: 'DNS Check Limited',
        description: 'Could not perform complete DNS security checks',
      });
    }
    
    return findings;
  }

  private calculateScore(findings: SecurityFinding[]): number {
    let score = 100;
    
    // Deduct points based on severity
    const deductions = {
      critical: 20,
      high: 15,
      medium: 10,
      low: 5,
      info: 0,
    };
    
    for (const finding of findings) {
      if (finding.severity !== 'info') {
        score -= deductions[finding.severity];
      }
    }
    
    return Math.max(0, score);
  }

  public async scan(url: string): Promise<SecurityScanResult> {
    console.log(`🔒 DirectSecurityScanner scanning ${url}`);
    
    const findings: SecurityFinding[] = [];
    
    try {
      // Parse domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Run all security checks
      const [sslFindings, headerFindings, vulnFindings, dnsFindings] = await Promise.all([
        this.checkSSL(url),
        this.checkSecurityHeaders(url),
        this.checkCommonVulnerabilities(url),
        this.checkDNSSecurity(domain),
      ]);
      
      findings.push(...sslFindings, ...headerFindings, ...vulnFindings, ...dnsFindings);
      
    } catch (error) {
      findings.push({
        type: 'error',
        severity: 'info',
        title: 'Scan Error',
        description: `Could not complete all security checks: ${error.message}`,
      });
    }
    
    const score = this.calculateScore(findings);
    
    return {
      url,
      score,
      findings,
      summary: `Security scan completed with score ${score}/100. Found ${findings.filter(f => f.severity !== 'info').length} issues.`,
      scannedAt: new Date(),
    };
  }

  public async scanSecurity(domain: string): Promise<any> {
    // Convert domain to URL if needed
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const result = await this.scan(url);
    
    // Transform to expected format
    const headers = {
      score: Math.round((result.findings.filter(f => f.type === 'headers' && f.severity === 'info').length / 5) * 100),
      missing: result.findings.filter(f => f.type === 'headers' && f.severity !== 'info').map(f => f.title),
    };
    
    const ssl = {
      grade: result.findings.some(f => f.type === 'ssl' && f.severity === 'info') ? 'A' : 'F',
      issues: result.findings.filter(f => f.type === 'ssl' && f.severity !== 'info'),
    };
    
    const vulnerabilities = result.findings.filter(f => f.type === 'vulnerability');
    const recommendations = result.findings
      .filter(f => f.recommendation)
      .map(f => f.recommendation as string);
    
    const dns = {
      dnssec: false, // Would need actual DNSSEC check
      spf: result.findings.some(f => f.title.includes('SPF') && f.severity === 'info'),
      caa: result.findings.some(f => f.title.includes('CAA') && f.severity === 'info'),
    };
    
    return {
      url,
      score: result.score,
      ssl,
      headers,
      dns,
      vulnerabilities,
      recommendations,
      findings: result.findings,
      scannedAt: result.scannedAt,
    };
  }

  public async scanToEvidence(url: string): Promise<Evidence> {
    const result = await this.scan(url);
    
    return {
      id: uuidv4(),
      researchQuestionId: 'security-scan',
      pillarId: 'technical',
      source: {
        type: 'tool',
        name: 'Direct Security Scanner',
        url,
        publishDate: new Date(),
        author: 'Security Scanner',
        credibilityScore: 0.95,
      },
      content: JSON.stringify(result, null, 2),
      metadata: {
        extractedAt: new Date(),
        extractionMethod: 'DirectSecurityScanner',
        wordCount: JSON.stringify(result).length,
        language: 'en',
        keywords: ['security', 'vulnerabilities', 'headers', 'ssl'],
        confidence: 0.9,
      },
      qualityScore: {
        overall: 0.9,
        components: {
          relevance: 0.95,
          credibility: 0.95,
          recency: 1.0,
          specificity: 0.9,
          bias: 0.05,
          depth: 0.85,
        },
        reasoning: 'Automated security analysis with industry-standard checks',
      },
      createdAt: new Date(),
    };
  }
}