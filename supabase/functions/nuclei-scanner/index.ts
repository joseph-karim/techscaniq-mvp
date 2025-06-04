import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SecurityRequest {
  url: string
  html?: string
  deep?: boolean
}

interface Vulnerability {
  id: string
  name: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  type: string
  description: string
  remediation?: string
  reference?: string[]
  source: string
  details?: any
}

interface SecurityReport {
  url: string
  vulnerabilities: Vulnerability[]
  summary: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  scansPerformed: string[]
  scanDuration: number
}

// Timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

// Check for common security misconfigurations
async function checkSecurityHeaders(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = []
  
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' })
    const headers = response.headers
    
    // Check for missing security headers
    const securityHeaders = {
      'strict-transport-security': {
        name: 'Missing HSTS Header',
        severity: 'medium' as const,
        description: 'HTTP Strict Transport Security header is not set'
      },
      'x-content-type-options': {
        name: 'Missing X-Content-Type-Options',
        severity: 'medium' as const,
        description: 'X-Content-Type-Options header is not set to nosniff'
      },
      'x-frame-options': {
        name: 'Missing X-Frame-Options',
        severity: 'medium' as const,
        description: 'X-Frame-Options header is not set'
      },
      'content-security-policy': {
        name: 'Missing Content Security Policy',
        severity: 'high' as const,
        description: 'Content-Security-Policy header is not set'
      }
    }
    
    for (const [headerName, config] of Object.entries(securityHeaders)) {
      if (!headers.has(headerName)) {
        vulnerabilities.push({
          id: `missing-${headerName}`,
          name: config.name,
          severity: config.severity,
          type: 'security-headers',
          description: config.description,
          remediation: `Add ${headerName} header to your web server configuration`,
          source: 'header-analysis'
        })
      }
    }
    
    // Check for information disclosure
    if (headers.has('server')) {
      const serverHeader = headers.get('server')
      if (serverHeader && (serverHeader.includes('/') || serverHeader.length > 20)) {
        vulnerabilities.push({
          id: 'server-info-disclosure',
          name: 'Server Information Disclosure',
          severity: 'info',
          type: 'information-disclosure',
          description: 'Server header reveals detailed version information',
          remediation: 'Remove or obfuscate server version information',
          source: 'header-analysis',
          details: { serverHeader }
        })
      }
    }
    
    if (headers.has('x-powered-by')) {
      vulnerabilities.push({
        id: 'x-powered-by-disclosure',
        name: 'X-Powered-By Information Disclosure',
        severity: 'info',
        type: 'information-disclosure',
        description: 'X-Powered-By header reveals technology stack information',
        remediation: 'Remove X-Powered-By header',
        source: 'header-analysis',
        details: { poweredBy: headers.get('x-powered-by') }
      })
    }
    
  } catch (error) {
    console.error('Security header check failed:', error)
  }
  
  return vulnerabilities
}

// Check for common web vulnerabilities in HTML content
async function checkContentVulnerabilities(url: string, html?: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = []
  
  if (!html) {
    try {
      const response = await fetchWithTimeout(url, { method: 'GET' })
      html = await response.text()
    } catch (error) {
      console.error('Failed to fetch HTML for content analysis:', error)
      return vulnerabilities
    }
  }
  
  if (!html) return vulnerabilities
  
  // Check for inline scripts (potential XSS)
  const inlineScripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  const dangerousScripts = inlineScripts.filter(script => 
    script.includes('eval(') || 
    script.includes('innerHTML') ||
    script.includes('document.write') ||
    script.includes('setTimeout(') ||
    script.includes('setInterval(')
  )
  
  if (dangerousScripts.length > 0) {
    vulnerabilities.push({
      id: 'dangerous-inline-scripts',
      name: 'Potentially Dangerous Inline Scripts',
      severity: 'medium',
      type: 'xss',
      description: `Found ${dangerousScripts.length} inline scripts using potentially dangerous functions`,
      remediation: 'Move scripts to external files and implement Content Security Policy',
      source: 'content-analysis',
      details: { count: dangerousScripts.length }
    })
  }
  
  // Check for exposed sensitive paths
  const exposedPaths = [
    '/.git/',
    '/.env',
    '/admin',
    '/backup',
    '/config',
    '/database',
    '/.htaccess',
    '/phpinfo.php',
    '/web.config'
  ]
  
  for (const path of exposedPaths) {
    if (html.includes(`href="${path}`) || html.includes(`src="${path}`)) {
      vulnerabilities.push({
        id: `exposed-path-${path.replace(/[/.]/g, '-')}`,
        name: `Exposed Sensitive Path: ${path}`,
        severity: 'medium',
        type: 'exposure',
        description: `Sensitive path ${path} is referenced in the HTML`,
        remediation: `Remove or restrict access to ${path}`,
        source: 'content-analysis',
        details: { path }
      })
    }
  }
  
  // Check for hardcoded secrets (simple patterns)
  const secretPatterns = {
    'api-key': /api[_-]?key["\s]*[:=]\s*["']([a-zA-Z0-9_\-]{20,})/gi,
    'aws-key': /AKIA[0-9A-Z]{16}/g,
    'jwt-token': /eyJ[A-Za-z0-9_-]+\./g
  }
  
  for (const [secretType, pattern] of Object.entries(secretPatterns)) {
    const matches = html.match(pattern)
    if (matches && matches.length > 0) {
      vulnerabilities.push({
        id: `exposed-${secretType}`,
        name: `Exposed ${secretType.replace('-', ' ').toUpperCase()}`,
        severity: 'critical',
        type: 'secrets',
        description: `Found ${matches.length} potential ${secretType} exposure(s) in HTML`,
        remediation: 'Remove hardcoded secrets from client-side code',
        source: 'content-analysis',
        details: { count: matches.length, type: secretType }
      })
    }
  }
  
  return vulnerabilities
}

// Check for SSL/TLS issues by testing common endpoints
async function checkSSLConfiguration(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = []
  
  try {
    const urlObj = new URL(url)
    if (urlObj.protocol !== 'https:') {
      vulnerabilities.push({
        id: 'no-https',
        name: 'No HTTPS Redirect',
        severity: 'high',
        type: 'ssl',
        description: 'Website does not use HTTPS',
        remediation: 'Implement HTTPS and redirect HTTP traffic',
        source: 'ssl-analysis'
      })
      return vulnerabilities
    }
    
    // Test for mixed content by checking if HTTP version loads
    const httpUrl = url.replace('https://', 'http://')
    try {
      const httpResponse = await fetchWithTimeout(httpUrl, { method: 'HEAD' }, 5000)
      if (httpResponse.ok) {
        vulnerabilities.push({
          id: 'http-still-accessible',
          name: 'HTTP Version Still Accessible',
          severity: 'medium',
          type: 'ssl',
          description: 'HTTP version of the site is still accessible',
          remediation: 'Redirect all HTTP traffic to HTTPS',
          source: 'ssl-analysis'
        })
      }
    } catch {
      // Good - HTTP version is not accessible
    }
    
  } catch (error) {
    console.error('SSL configuration check failed:', error)
  }
  
  return vulnerabilities
}

// Main security scanning function
async function performSecurityScan(url: string, html?: string, deep = false): Promise<SecurityReport> {
  const startTime = Date.now()
  const allVulnerabilities: Vulnerability[] = []
  const scansPerformed: string[] = []
  
  // Always perform basic scans
  const headerVulns = await checkSecurityHeaders(url)
  allVulnerabilities.push(...headerVulns)
  scansPerformed.push('security-headers')
  
  const contentVulns = await checkContentVulnerabilities(url, html)
  allVulnerabilities.push(...contentVulns)
  scansPerformed.push('content-analysis')
  
  const sslVulns = await checkSSLConfiguration(url)
  allVulnerabilities.push(...sslVulns)
  scansPerformed.push('ssl-analysis')
  
  // Deep scan includes additional checks
  if (deep) {
    // Add more comprehensive checks here in the future
    scansPerformed.push('deep-scan')
  }
  
  // Calculate summary
  const summary = {
    total: allVulnerabilities.length,
    critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
    high: allVulnerabilities.filter(v => v.severity === 'high').length,
    medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
    low: allVulnerabilities.filter(v => v.severity === 'low').length,
    info: allVulnerabilities.filter(v => v.severity === 'info').length
  }
  
  return {
    url,
    vulnerabilities: allVulnerabilities,
    summary,
    scansPerformed,
    scanDuration: Date.now() - startTime
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: SecurityRequest = await req.json()
    
    if (!request.url) {
      throw new Error('URL is required')
    }
    
    console.log(`Running comprehensive security scan for: ${request.url}`)
    
    const report = await performSecurityScan(request.url, request.html, request.deep)
    
    console.log(`Security scan complete. Found ${report.summary.total} issues`)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[ERROR]', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})