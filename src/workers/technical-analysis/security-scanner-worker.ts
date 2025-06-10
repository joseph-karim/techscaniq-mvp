import { Worker, Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'
import axios from 'axios'
import * as tls from 'tls'
import { URL } from 'url'

config()

interface SecurityJob {
  url: string
  domain: string
  company: string
  collectionId: string
}

interface SecurityFinding {
  type: 'vulnerability' | 'misconfiguration' | 'information_disclosure' | 'security_header'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  evidence: string
  recommendation: string
  cve?: string
}

interface SecurityResult {
  url: string
  findings: SecurityFinding[]
  headers: Record<string, string>
  ssl: any
  ports: any[]
  overallScore: number
}

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

class SecurityScanner {
  
  async scanSite(url: string): Promise<SecurityResult> {
    console.log(`🔒 Security scanning: ${url}`)
    
    const findings: SecurityFinding[] = []
    const parsedUrl = new URL(url)
    
    try {
      // HTTP Headers Analysis
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'SecurityScanner/1.0'
        },
        maxRedirects: 5,
        validateStatus: () => true // Accept all status codes
      })
      
      const headers = response.headers
      
      // Security headers check
      findings.push(...this.checkSecurityHeaders(headers))
      
      // Information disclosure check
      findings.push(...this.checkInformationDisclosure(headers, response.data))
      
      // Common vulnerabilities check
      findings.push(...this.checkCommonVulnerabilities(url, response.data))
      
      // SSL/TLS Analysis
      const ssl = await this.analyzeSsl(parsedUrl.hostname, parseInt(parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80')))
      findings.push(...this.checkSslSecurity(ssl))
      
      // Calculate overall security score
      const overallScore = this.calculateSecurityScore(findings)
      
      console.log(`✅ Security scan complete for ${url}: ${findings.length} findings, score: ${overallScore}`)
      
      return {
        url,
        findings,
        headers: this.getImportantHeaders(headers),
        ssl,
        ports: [], // Would need port scanning for full analysis
        overallScore
      }
      
    } catch (error) {
      console.error(`Security scan failed for ${url}:`, error)
      throw error
    }
  }
  
  private checkSecurityHeaders(headers: any): SecurityFinding[] {
    const findings: SecurityFinding[] = []
    
    // Check for missing security headers
    const securityHeaders = {
      'strict-transport-security': {
        title: 'Missing HSTS Header',
        description: 'HTTP Strict Transport Security (HSTS) header is not set',
        recommendation: 'Add Strict-Transport-Security header to enforce HTTPS',
        severity: 'medium' as const
      },
      'x-frame-options': {
        title: 'Missing X-Frame-Options Header',
        description: 'X-Frame-Options header is not set, may be vulnerable to clickjacking',
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN header',
        severity: 'medium' as const
      },
      'x-content-type-options': {
        title: 'Missing X-Content-Type-Options Header',
        description: 'X-Content-Type-Options header is not set',
        recommendation: 'Add X-Content-Type-Options: nosniff header',
        severity: 'low' as const
      },
      'content-security-policy': {
        title: 'Missing Content Security Policy',
        description: 'Content Security Policy (CSP) header is not set',
        recommendation: 'Implement Content-Security-Policy header to prevent XSS attacks',
        severity: 'high' as const
      },
      'x-xss-protection': {
        title: 'Missing X-XSS-Protection Header',
        description: 'X-XSS-Protection header is not set',
        recommendation: 'Add X-XSS-Protection: 1; mode=block header',
        severity: 'low' as const
      }
    }
    
    for (const [headerName, config] of Object.entries(securityHeaders)) {
      if (!headers[headerName] && !headers[headerName.toLowerCase()]) {
        findings.push({
          type: 'security_header',
          severity: config.severity,
          title: config.title,
          description: config.description,
          evidence: `Header "${headerName}" not found in response`,
          recommendation: config.recommendation
        })
      }
    }
    
    // Check for weak security header values
    const csp = headers['content-security-policy']
    if (csp && csp.includes("'unsafe-inline'")) {
      findings.push({
        type: 'misconfiguration',
        severity: 'medium',
        title: 'Weak Content Security Policy',
        description: 'CSP allows unsafe-inline which reduces protection against XSS',
        evidence: `CSP header: ${csp}`,
        recommendation: 'Remove unsafe-inline from CSP directives where possible'
      })
    }
    
    return findings
  }
  
  private checkInformationDisclosure(headers: any, body: string): SecurityFinding[] {
    const findings: SecurityFinding[] = []
    
    // Check for information disclosure in headers
    const disclosureHeaders = ['server', 'x-powered-by', 'x-aspnet-version', 'x-generator']
    
    for (const header of disclosureHeaders) {
      if (headers[header]) {
        findings.push({
          type: 'information_disclosure',
          severity: 'info',
          title: 'Server Information Disclosure',
          description: `Server header reveals technology information: ${headers[header]}`,
          evidence: `${header}: ${headers[header]}`,
          recommendation: 'Remove or obfuscate server technology headers'
        })
      }
    }
    
    // Check for common sensitive data patterns in response
    const sensitivePatterns = [
      { pattern: /password/i, name: 'Password references' },
      { pattern: /api[_-]?key/i, name: 'API key references' },
      { pattern: /secret/i, name: 'Secret references' },
      { pattern: /token/i, name: 'Token references' },
      { pattern: /admin/i, name: 'Admin references' },
      { pattern: /debug/i, name: 'Debug information' },
      { pattern: /error/i, name: 'Error information' },
      { pattern: /exception/i, name: 'Exception information' }
    ]
    
    for (const { pattern, name } of sensitivePatterns) {
      const matches = body.match(pattern)
      if (matches && matches.length > 5) { // Only flag if many occurrences
        findings.push({
          type: 'information_disclosure',
          severity: 'low',
          title: `Potential ${name} in Response`,
          description: `Multiple references to "${name}" found in page content`,
          evidence: `Found ${matches.length} occurrences`,
          recommendation: 'Review and minimize sensitive information exposure'
        })
      }
    }
    
    return findings
  }
  
  private checkCommonVulnerabilities(_url: string, body: string): SecurityFinding[] {
    const findings: SecurityFinding[] = []
    
    // Check for common vulnerable patterns
    
    // Directory listing
    if (body.includes('Index of /') || body.includes('<title>Directory listing for')) {
      findings.push({
        type: 'vulnerability',
        severity: 'medium',
        title: 'Directory Listing Enabled',
        description: 'Web server allows directory browsing',
        evidence: 'Directory listing detected in response',
        recommendation: 'Disable directory browsing on web server'
      })
    }
    
    // Default pages
    const defaultPages = [
      { pattern: /Apache2 Ubuntu Default Page/i, name: 'Apache default page' },
      { pattern: /IIS Windows Server/i, name: 'IIS default page' },
      { pattern: /Welcome to nginx/i, name: 'Nginx default page' },
      { pattern: /Congratulations! You have successfully installed/i, name: 'Default installation page' }
    ]
    
    for (const { pattern, name } of defaultPages) {
      if (pattern.test(body)) {
        findings.push({
          type: 'misconfiguration',
          severity: 'low',
          title: 'Default Server Page Exposed',
          description: `Default server page detected: ${name}`,
          evidence: 'Default page content found',
          recommendation: 'Replace default page with custom content or disable'
        })
      }
    }
    
    // Check for common admin/test paths
    // const _testPaths = ['/admin', '/test', '/debug', '/api/docs', '/swagger', '/.env', '/config']
    // Note: In a real implementation, you'd test these paths separately
    
    return findings
  }
  
  private async analyzeSsl(hostname: string, port: number): Promise<any> {
    return new Promise((resolve) => {
      if (port !== 443) {
        resolve({ supported: false, reason: 'Not HTTPS' })
        return
      }
      
      const socket = tls.connect(port, hostname, {
        timeout: 10000,
        servername: hostname
      })
      
      socket.on('secureConnect', () => {
        const cert = socket.getPeerCertificate(true)
        const cipher = socket.getCipher()
        const protocol = socket.getProtocol()
        
        resolve({
          supported: true,
          certificate: {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber
          },
          cipher: cipher,
          protocol: protocol,
          authorized: socket.authorized
        })
        
        socket.end()
      })
      
      socket.on('error', (error) => {
        resolve({
          supported: false,
          error: error.message
        })
      })
      
      socket.on('timeout', () => {
        resolve({
          supported: false,
          error: 'Connection timeout'
        })
        socket.destroy()
      })
    })
  }
  
  private checkSslSecurity(ssl: any): SecurityFinding[] {
    const findings: SecurityFinding[] = []
    
    if (!ssl.supported) {
      findings.push({
        type: 'vulnerability',
        severity: 'high',
        title: 'HTTPS Not Properly Configured',
        description: 'SSL/TLS connection could not be established',
        evidence: ssl.error || 'SSL connection failed',
        recommendation: 'Configure proper SSL/TLS certificate and settings'
      })
      return findings
    }
    
    // Check certificate validity
    const now = new Date()
    const validTo = new Date(ssl.certificate?.validTo)
    const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 30) {
      findings.push({
        type: 'vulnerability',
        severity: daysUntilExpiry < 7 ? 'high' : 'medium',
        title: 'SSL Certificate Expiring Soon',
        description: `SSL certificate expires in ${daysUntilExpiry} days`,
        evidence: `Certificate valid until: ${ssl.certificate?.validTo}`,
        recommendation: 'Renew SSL certificate before expiration'
      })
    }
    
    // Check for weak cipher suites
    if (ssl.cipher?.name && (ssl.cipher.name.includes('RC4') || ssl.cipher.name.includes('DES'))) {
      findings.push({
        type: 'vulnerability',
        severity: 'medium',
        title: 'Weak Cipher Suite',
        description: `Weak cipher suite in use: ${ssl.cipher.name}`,
        evidence: `Cipher: ${ssl.cipher.name}`,
        recommendation: 'Disable weak cipher suites and use modern, secure ciphers'
      })
    }
    
    // Check SSL/TLS protocol version
    if (ssl.protocol && (ssl.protocol.includes('SSLv') || ssl.protocol === 'TLSv1' || ssl.protocol === 'TLSv1.1')) {
      findings.push({
        type: 'vulnerability',
        severity: 'high',
        title: 'Outdated SSL/TLS Protocol',
        description: `Outdated protocol version: ${ssl.protocol}`,
        evidence: `Protocol: ${ssl.protocol}`,
        recommendation: 'Use TLS 1.2 or higher, disable older protocols'
      })
    }
    
    return findings
  }
  
  private calculateSecurityScore(findings: SecurityFinding[]): number {
    let score = 100
    
    for (const finding of findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 8
          break
        case 'low':
          score -= 3
          break
        case 'info':
          score -= 1
          break
      }
    }
    
    return Math.max(0, score)
  }
  
  private getImportantHeaders(headers: any): Record<string, string> {
    const important = [
      'server',
      'x-powered-by',
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'set-cookie'
    ]
    
    const result: Record<string, string> = {}
    for (const header of important) {
      if (headers[header]) {
        result[header] = headers[header]
      }
    }
    
    return result
  }
}

// Store evidence in database
async function storeEvidence(
  collectionId: string,
  result: SecurityResult,
  company: string
): Promise<void> {
  try {
    await supabase
      .from('evidence_items')
      .insert({
        collection_id: collectionId,
        evidence_type: 'security_assessment',
        content_data: {
          summary: `Security assessment of ${result.url}: Found ${result.findings.length} security findings, overall score: ${result.overallScore}/100`,
          processed: JSON.stringify(result.findings, null, 2),
          securityScore: result.overallScore,
          findingsByType: groupFindingsByType(result.findings),
          findingsBySeverity: groupFindingsBySeverity(result.findings),
          headers: result.headers,
          ssl: result.ssl
        },
        source_data: {
          url: result.url,
          scan_timestamp: new Date().toISOString(),
          findings_detail: result.findings
        },
        source_url: result.url,
        confidence_score: 0.9,
        metadata: {
          company,
          tool: 'security-scanner',
          findings_count: result.findings.length,
          security_score: result.overallScore,
          critical_findings: result.findings.filter(f => f.severity === 'critical').length,
          high_findings: result.findings.filter(f => f.severity === 'high').length
        }
      })
  } catch (error) {
    console.error('Failed to store security evidence:', error)
  }
}

function groupFindingsByType(findings: SecurityFinding[]): Record<string, number> {
  const groups: Record<string, number> = {}
  for (const finding of findings) {
    groups[finding.type] = (groups[finding.type] || 0) + 1
  }
  return groups
}

function groupFindingsBySeverity(findings: SecurityFinding[]): Record<string, number> {
  const groups: Record<string, number> = {}
  for (const finding of findings) {
    groups[finding.severity] = (groups[finding.severity] || 0) + 1
  }
  return groups
}

// Main worker
export const securityScannerWorker = new Worker<SecurityJob>(
  'security-scanner',
  async (job: Job<SecurityJob>) => {
    const { url, domain, company, collectionId } = job.data
    
    console.log(`🔒 Starting security scan for ${company} (${domain})`)
    
    const scanner = new SecurityScanner()
    
    try {
      await job.updateProgress(20)
      
      const result = await scanner.scanSite(url)
      await storeEvidence(collectionId, result, company)
      
      await job.updateProgress(100)
      
      console.log(`✅ Security scan complete for ${company}: ${result.findings.length} findings, score: ${result.overallScore}`)
      
      return {
        success: true,
        findingsCount: result.findings.length,
        securityScore: result.overallScore,
        criticalFindings: result.findings.filter(f => f.severity === 'critical').length,
        highFindings: result.findings.filter(f => f.severity === 'high').length,
        findings: result.findings.map(f => ({ type: f.type, severity: f.severity, title: f.title }))
      }
      
    } catch (error) {
      console.error('Security scan failed:', error)
      throw error
    }
  },
  {
    connection,
    concurrency: 3,
  }
)

// Error handling
securityScannerWorker.on('failed', (job, err) => {
  console.error(`Security scan job ${job?.id} failed:`, err)
})

securityScannerWorker.on('completed', (job) => {
  console.log(`Security scan job ${job.id} completed successfully`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing security scanner worker...')
  await securityScannerWorker.close()
  process.exit(0)
})

console.log('Security scanner worker started')
console.log(`Connected to Redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)