import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface SSLRequest {
  url: string
}

interface SSLReport {
  url: string
  grade: string
  score: number
  protocol: {
    tls13: boolean
    tls12: boolean
    tls11: boolean
    tls10: boolean
    ssl3: boolean
    ssl2: boolean
  }
  cipher: {
    strong: string[]
    weak: string[]
  }
  certificate: {
    valid: boolean
    issuer: string
    subject: string
    notBefore: string
    notAfter: string
    daysUntilExpiry: number
    san: string[]
  }
  vulnerabilities: {
    heartbleed: boolean
    ccs_injection: boolean
    ticketbleed: boolean
    robot: boolean
    secure_renegotiation: boolean
    crime: boolean
    breach: boolean
    poodle: boolean
    tls_fallback_scsv: boolean
    sweet32: boolean
    freak: boolean
    drown: boolean
    logjam: boolean
    beast: boolean
    lucky13: boolean
    rc4: boolean
  }
  recommendations: string[]
}

// Simulate testssl.sh functionality
async function analyzeTLS(url: string): Promise<SSLReport> {
  const hostname = new URL(url).hostname
  
  // Simulate TLS analysis
  const now = new Date()
  const notBefore = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // 180 days ago
  const notAfter = new Date(now.getTime() + 185 * 24 * 60 * 60 * 1000) // 185 days from now
  const daysUntilExpiry = Math.floor((notAfter.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  
  // Calculate score based on various factors
  let score = 100
  const recommendations: string[] = []
  
  // Protocol support scoring
  const protocols = {
    tls13: Math.random() > 0.3, // 70% chance of TLS 1.3
    tls12: true,
    tls11: Math.random() > 0.7, // 30% chance of TLS 1.1
    tls10: Math.random() > 0.8, // 20% chance of TLS 1.0
    ssl3: false,
    ssl2: false
  }
  
  if (!protocols.tls13) {
    score -= 10
    recommendations.push("Enable TLS 1.3 for improved performance and security")
  }
  if (protocols.tls11) {
    score -= 15
    recommendations.push("Disable TLS 1.1 - deprecated protocol")
  }
  if (protocols.tls10) {
    score -= 20
    recommendations.push("Disable TLS 1.0 - vulnerable to attacks")
  }
  
  // Cipher analysis
  const ciphers = {
    strong: [
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256",
      "TLS_AES_128_GCM_SHA256",
      "ECDHE-RSA-AES256-GCM-SHA384",
      "ECDHE-RSA-AES128-GCM-SHA256"
    ],
    weak: protocols.tls11 || protocols.tls10 ? [
      "TLS_RSA_WITH_AES_128_CBC_SHA",
      "TLS_RSA_WITH_AES_256_CBC_SHA"
    ] : []
  }
  
  if (ciphers.weak.length > 0) {
    score -= 10
    recommendations.push("Remove weak cipher suites using CBC mode")
  }
  
  // Vulnerability analysis
  const vulns = {
    heartbleed: false,
    ccs_injection: false,
    ticketbleed: false,
    robot: Math.random() > 0.9, // 10% chance
    secure_renegotiation: true,
    crime: false,
    breach: Math.random() > 0.8, // 20% chance
    poodle: protocols.ssl3,
    tls_fallback_scsv: !protocols.tls10 && !protocols.tls11,
    sweet32: Math.random() > 0.95, // 5% chance
    freak: false,
    drown: false,
    logjam: Math.random() > 0.95, // 5% chance
    beast: protocols.tls10,
    lucky13: protocols.tls11 || protocols.tls10,
    rc4: false
  }
  
  // Score vulnerabilities
  if (vulns.robot) {
    score -= 15
    recommendations.push("Vulnerable to ROBOT attack - update server configuration")
  }
  if (vulns.breach) {
    score -= 10
    recommendations.push("Vulnerable to BREACH attack - disable HTTP compression")
  }
  if (vulns.sweet32) {
    score -= 5
    recommendations.push("Vulnerable to Sweet32 - disable 64-bit block ciphers")
  }
  if (vulns.logjam) {
    score -= 10
    recommendations.push("Vulnerable to Logjam - use 2048-bit or larger DH parameters")
  }
  
  // Certificate validation
  const certValid = Math.random() > 0.05 // 95% valid
  if (!certValid) {
    score -= 30
    recommendations.push("Certificate validation failed - check certificate chain")
  }
  
  // Determine grade
  let grade: string
  if (score >= 90) grade = 'A+'
  else if (score >= 80) grade = 'A'
  else if (score >= 70) grade = 'B'
  else if (score >= 60) grade = 'C'
  else if (score >= 50) grade = 'D'
  else grade = 'F'
  
  return {
    url,
    grade,
    score,
    protocol: protocols,
    cipher: ciphers,
    certificate: {
      valid: certValid,
      issuer: "Let's Encrypt Authority X3",
      subject: `CN=${hostname}`,
      notBefore: notBefore.toISOString(),
      notAfter: notAfter.toISOString(),
      daysUntilExpiry,
      san: [hostname, `www.${hostname}`]
    },
    vulnerabilities: vulns,
    recommendations
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url }: SSLRequest = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }
    
    console.log(`Running TLS/SSL analysis for: ${url}`)
    
    const report = await analyzeTLS(url)
    
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