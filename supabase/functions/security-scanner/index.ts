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
  headers?: Record<string, string>
}

interface SecurityFinding {
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  recommendation?: string
}

interface SecurityReport {
  url: string
  score: number
  grade: string
  findings: SecurityFinding[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  headers: {
    present: string[]
    missing: string[]
  }
}

// Security headers to check
const SECURITY_HEADERS = {
  'Strict-Transport-Security': {
    required: true,
    severity: 'high' as const,
    recommendation: 'Enable HSTS with includeSubDomains and preload'
  },
  'X-Content-Type-Options': {
    required: true,
    severity: 'medium' as const,
    recommendation: 'Set to "nosniff" to prevent MIME type sniffing'
  },
  'X-Frame-Options': {
    required: true,
    severity: 'medium' as const,
    recommendation: 'Set to "DENY" or "SAMEORIGIN" to prevent clickjacking'
  },
  'Content-Security-Policy': {
    required: true,
    severity: 'high' as const,
    recommendation: 'Implement a strict CSP to prevent XSS attacks'
  },
  'X-XSS-Protection': {
    required: false,
    severity: 'low' as const,
    recommendation: 'Modern browsers have this built-in, but set to "1; mode=block" for legacy support'
  },
  'Referrer-Policy': {
    required: false,
    severity: 'low' as const,
    recommendation: 'Set to "strict-origin-when-cross-origin" for privacy'
  },
  'Permissions-Policy': {
    required: false,
    severity: 'medium' as const,
    recommendation: 'Control browser features and APIs available to the page'
  }
}

// Common vulnerability patterns
const VULNERABILITY_PATTERNS = {
  'Exposed API Keys': {
    patterns: [
      /api[_-]?key["\s]*[:=]\s*["']([a-zA-Z0-9_\-]{20,})/gi,
      /apikey["\s]*[:=]\s*["']([a-zA-Z0-9_\-]{20,})/gi,
      /secret[_-]?key["\s]*[:=]\s*["']([a-zA-Z0-9_\-]{20,})/gi
    ],
    severity: 'critical' as const,
    category: 'Secrets'
  },
  'Exposed AWS Credentials': {
    patterns: [
      /AKIA[0-9A-Z]{16}/g,
      /aws[_-]?access[_-]?key[_-]?id["\s]*[:=]\s*["']([A-Z0-9]{20})/gi
    ],
    severity: 'critical' as const,
    category: 'Secrets'
  },
  'Exposed Private Keys': {
    patterns: [
      /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
      /-----BEGIN PGP PRIVATE KEY BLOCK-----/
    ],
    severity: 'critical' as const,
    category: 'Secrets'
  },
  'Insecure Forms': {
    patterns: [
      /<form[^>]*action\s*=\s*["']https?:\/\/[^"']*["'][^>]*>/gi,
      /<form[^>]*method\s*=\s*["']get["'][^>]*password/gi
    ],
    severity: 'high' as const,
    category: 'Forms'
  },
  'Mixed Content': {
    patterns: [
      /src\s*=\s*["']http:\/\/[^"']*/gi,
      /href\s*=\s*["']http:\/\/[^"']*/gi
    ],
    severity: 'medium' as const,
    category: 'Mixed Content'
  },
  'Outdated Libraries': {
    patterns: [
      /jquery[.-]1\.[0-9]\.js/gi,
      /angular[.-]1\.[0-2]\.js/gi,
      /bootstrap[.-][23]\./gi
    ],
    severity: 'medium' as const,
    category: 'Dependencies'
  }
}

function analyzeSecurityHeaders(headers: Record<string, string>): {
  findings: SecurityFinding[]
  present: string[]
  missing: string[]
} {
  const findings: SecurityFinding[] = []
  const present: string[] = []
  const missing: string[] = []
  
  // Normalize header keys to lowercase
  const normalizedHeaders: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers || {})) {
    normalizedHeaders[key.toLowerCase()] = value
  }
  
  // Check each security header
  for (const [header, config] of Object.entries(SECURITY_HEADERS)) {
    const headerLower = header.toLowerCase()
    
    if (normalizedHeaders[headerLower]) {
      present.push(header)
      
      // Additional validation for specific headers
      if (header === 'Strict-Transport-Security') {
        const value = normalizedHeaders[headerLower]
        if (!value.includes('includeSubDomains')) {
          findings.push({
            category: 'Headers',
            severity: 'medium',
            title: 'HSTS missing includeSubDomains',
            description: 'HSTS header should include subdomains for complete protection',
            recommendation: 'Add includeSubDomains to your HSTS header'
          })
        }
      }
    } else if (config.required) {
      missing.push(header)
      findings.push({
        category: 'Headers',
        severity: config.severity,
        title: `Missing ${header} header`,
        description: `The ${header} header is not set`,
        recommendation: config.recommendation
      })
    }
  }
  
  return { findings, present, missing }
}

function scanForVulnerabilities(html: string): SecurityFinding[] {
  const findings: SecurityFinding[] = []
  
  if (!html) return findings
  
  for (const [vulnName, config] of Object.entries(VULNERABILITY_PATTERNS)) {
    for (const pattern of config.patterns) {
      const matches = html.match(pattern)
      if (matches && matches.length > 0) {
        findings.push({
          category: config.category,
          severity: config.severity,
          title: vulnName,
          description: `Found ${matches.length} instance(s) of ${vulnName}`,
          recommendation: `Review and remove any exposed sensitive information`
        })
        break // Only report once per vulnerability type
      }
    }
  }
  
  // Check for inline scripts (potential XSS)
  const inlineScripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  const dangerousScripts = inlineScripts.filter(script => 
    script.includes('eval(') || 
    script.includes('innerHTML') ||
    script.includes('document.write')
  )
  
  if (dangerousScripts.length > 0) {
    findings.push({
      category: 'XSS',
      severity: 'high',
      title: 'Potentially dangerous inline scripts',
      description: `Found ${dangerousScripts.length} inline scripts using dangerous functions`,
      recommendation: 'Move scripts to external files and implement CSP'
    })
  }
  
  return findings
}

function calculateSecurityScore(findings: SecurityFinding[]): { score: number; grade: string } {
  let score = 100
  
  // Deduct points based on severity
  const deductions = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
    info: 0
  }
  
  for (const finding of findings) {
    score -= deductions[finding.severity]
  }
  
  score = Math.max(0, score)
  
  // Calculate grade
  let grade: string
  if (score >= 90) grade = 'A'
  else if (score >= 80) grade = 'B'
  else if (score >= 70) grade = 'C'
  else if (score >= 60) grade = 'D'
  else grade = 'F'
  
  return { score, grade }
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
    
    console.log(`Security scan for: ${request.url}`)
    
    // Analyze security headers
    const headerAnalysis = analyzeSecurityHeaders(request.headers || {})
    
    // Scan HTML for vulnerabilities
    const vulnFindings = scanForVulnerabilities(request.html || '')
    
    // Combine all findings
    const allFindings = [...headerAnalysis.findings, ...vulnFindings]
    
    // Calculate score and grade
    const { score, grade } = calculateSecurityScore(allFindings)
    
    // Count findings by severity
    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    }
    
    for (const finding of allFindings) {
      summary[finding.severity]++
    }
    
    const report: SecurityReport = {
      url: request.url,
      score,
      grade,
      findings: allFindings,
      summary,
      headers: {
        present: headerAnalysis.present,
        missing: headerAnalysis.missing
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: report
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