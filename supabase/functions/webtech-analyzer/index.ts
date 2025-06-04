import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface WebTechRequest {
  html: string
  url: string
  headers?: Record<string, string>
}

interface Technology {
  name: string
  categories: string[]
  version?: string
  confidence: number
  vulnerabilities?: Array<{
    severity: string
    description: string
    cve?: string
    advisory?: string
  }>
}

// Comprehensive technology detection patterns inspired by WebTech
const TECHNOLOGY_PATTERNS = {
  // JavaScript Frameworks & Libraries
  'React': {
    patterns: [
      /_react.*\.js/i,
      /react\.production\.min\.js/i,
      /data-reactroot/i,
      /__REACT_DEVTOOLS_GLOBAL_HOOK__/,
      /React\.createElement/,
      /ReactDOM\.render/
    ],
    headers: ['x-powered-by'],
    headerPatterns: [/react/i],
    categories: ['JavaScript Framework']
  },
  'Vue.js': {
    patterns: [
      /vue\.js/i,
      /vue\.min\.js/i,
      /\{\{[^}]+\}\}/,
      /v-[a-z]+=/i,
      /Vue\.component/,
      /@vue\//
    ],
    categories: ['JavaScript Framework']
  },
  'Angular': {
    patterns: [
      /angular\.js/i,
      /angular\.min\.js/i,
      /ng-[a-z]+=/i,
      /\[\(ngModel\)\]/,
      /@angular\//,
      /ng-version/i
    ],
    categories: ['JavaScript Framework']
  },
  'Next.js': {
    patterns: [
      /_next\//i,
      /__NEXT_DATA__/,
      /next\.config\.js/i,
      /next\/dynamic/,
      /next\/router/
    ],
    categories: ['JavaScript Framework', 'SSR']
  },
  'Svelte': {
    patterns: [
      /svelte/i,
      /_svelte-[0-9]+/,
      /\.svelte/
    ],
    categories: ['JavaScript Framework']
  },
  'jQuery': {
    patterns: [
      /jquery.*\.js/i,
      /\$\(document\)\.ready/,
      /jQuery/,
      /\$\./
    ],
    categories: ['JavaScript Library'],
    vulnerableVersions: {
      '<3.5.0': 'XSS vulnerability in jQuery.htmlPrefilter'
    }
  },
  'Bootstrap': {
    patterns: [
      /bootstrap.*\.css/i,
      /bootstrap.*\.js/i,
      /class=["'].*bootstrap/i,
      /data-bs-/
    ],
    categories: ['UI Framework']
  },
  'Lodash': {
    patterns: [
      /lodash.*\.js/i,
      /_\.map/,
      /_\.filter/
    ],
    categories: ['JavaScript Library'],
    vulnerableVersions: {
      '<4.17.19': 'Prototype pollution vulnerability'
    }
  },
  // Backend Frameworks
  'Express.js': {
    patterns: [
      /express/i,
      /app\.get\(/,
      /app\.post\(/
    ],
    headers: ['x-powered-by'],
    headerPatterns: [/express/i],
    categories: ['Web Framework']
  },
  'Django': {
    patterns: [
      /django/i,
      /csrfmiddlewaretoken/i
    ],
    headers: ['server', 'x-frame-options'],
    headerPatterns: [/django/i],
    categories: ['Web Framework']
  },
  'Rails': {
    patterns: [
      /ruby on rails/i,
      /rails/i,
      /authenticity_token/
    ],
    headers: ['x-powered-by', 'server'],
    headerPatterns: [/rails/i, /ruby/i],
    categories: ['Web Framework']
  },
  'Laravel': {
    patterns: [
      /laravel/i,
      /laravel_session/,
      /XSRF-TOKEN/
    ],
    headers: ['x-powered-by'],
    headerPatterns: [/laravel/i],
    categories: ['Web Framework']
  },
  'Spring Boot': {
    patterns: [
      /spring.*boot/i,
      /springframework/i
    ],
    headers: ['server'],
    headerPatterns: [/spring/i],
    categories: ['Web Framework']
  },
  // Analytics & Tracking
  'Google Analytics': {
    patterns: [
      /google-analytics\.com\/analytics\.js/i,
      /googletagmanager\.com/i,
      /gtag\(/i,
      /_gaq\.push/i,
      /ga\(['"]/,
      /gtm\.start/
    ],
    categories: ['Analytics']
  },
  'Google Tag Manager': {
    patterns: [
      /googletagmanager\.com\/gtm\.js/i,
      /GTM-[A-Z0-9]+/,
      /dataLayer/
    ],
    categories: ['Tag Manager']
  },
  'Facebook Pixel': {
    patterns: [
      /connect\.facebook\.net/i,
      /fbq\(/,
      /facebook\.com\/tr/
    ],
    categories: ['Analytics']
  },
  'Hotjar': {
    patterns: [
      /hotjar/i,
      /hj\(/,
      /static\.hotjar\.com/
    ],
    categories: ['Analytics']
  },
  // Content Management Systems
  'WordPress': {
    patterns: [
      /wp-content/i,
      /wp-includes/i,
      /wordpress/i,
      /wp-admin/i,
      /wp-json/i
    ],
    headers: ['x-powered-by'],
    headerPatterns: [/wordpress/i],
    categories: ['CMS']
  },
  'Drupal': {
    patterns: [
      /drupal/i,
      /sites\/default\/files/i,
      /misc\/drupal/i
    ],
    headers: ['x-drupal-cache', 'x-generator'],
    headerPatterns: [/drupal/i],
    categories: ['CMS']
  },
  'Joomla': {
    patterns: [
      /joomla/i,
      /\/media\/system\/js/i,
      /option=com_/
    ],
    headers: ['x-content-encoded-by'],
    headerPatterns: [/joomla/i],
    categories: ['CMS']
  },
  'Ghost': {
    patterns: [
      /ghost/i,
      /ghost\.org/i,
      /assets\/ghost/
    ],
    headers: ['x-powered-by'],
    headerPatterns: [/ghost/i],
    categories: ['CMS']
  },
  // CDN & Infrastructure
  'Cloudflare': {
    patterns: [
      /cloudflare\.com/i,
      /cf-ray/i,
      /cdn\.cloudflare\.com/i
    ],
    headers: ['cf-ray', 'server'],
    headerPatterns: [/cloudflare/i],
    categories: ['CDN', 'Security']
  },
  'Fastly': {
    patterns: [
      /fastly\.net/i,
      /x-served-by.*cache/i
    ],
    headers: ['x-served-by', 'x-cache'],
    headerPatterns: [/fastly/i],
    categories: ['CDN']
  },
  'Amazon CloudFront': {
    patterns: [
      /cloudfront\.net/i
    ],
    headers: ['x-amz-cf-id', 'x-cache'],
    headerPatterns: [/cloudfront/i],
    categories: ['CDN']
  },
  'MaxCDN': {
    patterns: [
      /maxcdn\.com/i,
      /netdna-cdn\.com/i
    ],
    headers: ['server'],
    headerPatterns: [/maxcdn/i],
    categories: ['CDN']
  },
  // E-commerce Platforms
  'Shopify': {
    patterns: [
      /cdn\.shopify\.com/i,
      /myshopify\.com/i,
      /shopify-cdn/i,
      /Shopify\.theme/,
      /checkout\.shopify\.com/
    ],
    headers: ['x-shopid'],
    categories: ['E-commerce']
  },
  'WooCommerce': {
    patterns: [
      /woocommerce/i,
      /wc-ajax/,
      /wp-content\/plugins\/woocommerce/
    ],
    categories: ['E-commerce', 'WordPress Plugin']
  },
  'Magento': {
    patterns: [
      /magento/i,
      /mage\/cookies/,
      /skin\/frontend/,
      /var\/connect/
    ],
    categories: ['E-commerce']
  },
  'BigCommerce': {
    patterns: [
      /bigcommerce/i,
      /mybigcommerce\.com/,
      /bigcommerce-stencil/
    ],
    categories: ['E-commerce']
  },
  // Security & Authentication
  'reCAPTCHA': {
    patterns: [
      /google\.com\/recaptcha/i,
      /g-recaptcha/i,
      /grecaptcha/i,
      /recaptcha\/api/
    ],
    categories: ['Security']
  },
  'Auth0': {
    patterns: [
      /auth0/i,
      /auth0\.com/,
      /auth0-js/
    ],
    categories: ['Authentication']
  },
  'Okta': {
    patterns: [
      /okta/i,
      /oktacdn\.com/,
      /okta-signin-widget/
    ],
    categories: ['Authentication']
  },
  // Payment Processing
  'Stripe': {
    patterns: [
      /stripe\.com/i,
      /js\.stripe\.com/i,
      /stripe\.js/i,
      /Stripe\(/,
      /stripe-js/
    ],
    categories: ['Payment']
  },
  'PayPal': {
    patterns: [
      /paypal/i,
      /paypalobjects\.com/,
      /pp_live/,
      /paypal\.com\/sdk/
    ],
    categories: ['Payment']
  },
  'Square': {
    patterns: [
      /squareup\.com/i,
      /square\.js/,
      /sq-payment/
    ],
    categories: ['Payment']
  },
  // Cloud Providers & Services
  'AWS': {
    patterns: [
      /amazonaws\.com/i,
      /aws-sdk/i,
      /\.s3\.amazonaws/i,
      /cloudfront\.net/i,
      /elasticbeanstalk/i
    ],
    headers: ['x-amz-'],
    categories: ['Cloud', 'IaaS']
  },
  'Google Cloud': {
    patterns: [
      /googleapis\.com/i,
      /gstatic\.com/i,
      /google-cloud/i,
      /appspot\.com/i
    ],
    categories: ['Cloud', 'IaaS']
  },
  'Microsoft Azure': {
    patterns: [
      /\.azure/i,
      /azurewebsites\.net/i,
      /windows\.net/i,
      /microsoftonline\.com/i
    ],
    categories: ['Cloud', 'IaaS']
  },
  'Vercel': {
    patterns: [
      /vercel/i,
      /\.vercel\.app/i,
      /_vercel/
    ],
    headers: ['x-vercel-cache'],
    categories: ['Hosting', 'JAMstack']
  },
  'Netlify': {
    patterns: [
      /netlify/i,
      /\.netlify\.app/i,
      /netlify\.com/
    ],
    headers: ['server'],
    headerPatterns: [/netlify/i],
    categories: ['Hosting', 'JAMstack']
  },
  // Database & Backend Services
  'Firebase': {
    patterns: [
      /firebase/i,
      /firebaseapp\.com/i,
      /firebase-js-sdk/
    ],
    categories: ['Backend-as-a-Service']
  },
  'Supabase': {
    patterns: [
      /supabase/i,
      /\.supabase\.co/i,
      /supabase-js/
    ],
    categories: ['Backend-as-a-Service']
  }
}

// Retire.js inspired vulnerability patterns
const JS_VULNERABILITY_PATTERNS = {
  'jQuery': {
    patterns: [
      /jquery[.-]([0-9.]+)(.min)?\.js/i,
      /jQuery v([0-9.]+)/,
      /jQuery JavaScript Library v([0-9.]+)/
    ],
    vulnerabilities: {
      '<1.9.0': { severity: 'high', description: 'XSS vulnerability in jQuery.clean()' },
      '<3.5.0': { severity: 'medium', description: 'XSS vulnerability in jQuery.htmlPrefilter' },
      '<3.4.0': { severity: 'medium', description: 'Prototype pollution in jQuery.extend' }
    }
  },
  'AngularJS': {
    patterns: [
      /angular[.-]([0-9.]+)(.min)?\.js/i,
      /AngularJS v([0-9.]+)/
    ],
    vulnerabilities: {
      '<1.8.0': { severity: 'high', description: 'XSS vulnerability in angular expressions' },
      '<1.6.0': { severity: 'critical', description: 'Sandbox bypass vulnerability' }
    }
  },
  'Lodash': {
    patterns: [
      /lodash[.-]([0-9.]+)(.min)?\.js/i,
      /Lodash ([0-9.]+)/
    ],
    vulnerabilities: {
      '<4.17.19': { severity: 'high', description: 'Prototype pollution vulnerability' },
      '<4.17.5': { severity: 'medium', description: 'Regular expression denial of service' }
    }
  },
  'Bootstrap': {
    patterns: [
      /bootstrap[.-]([0-9.]+)(.min)?\.js/i,
      /Bootstrap v([0-9.]+)/
    ],
    vulnerabilities: {
      '<3.4.0': { severity: 'medium', description: 'XSS vulnerability in data-target attribute' },
      '<4.1.2': { severity: 'medium', description: 'XSS vulnerability in tooltip/popover' }
    }
  }
}

function extractVersion(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return undefined
}

function checkVulnerabilities(name: string, version?: string): Array<{severity: string, description: string, cve?: string, advisory?: string}> {
  if (!version || !JS_VULNERABILITY_PATTERNS[name as keyof typeof JS_VULNERABILITY_PATTERNS]) {
    return []
  }
  
  const vulnData = JS_VULNERABILITY_PATTERNS[name as keyof typeof JS_VULNERABILITY_PATTERNS]
  const vulnerabilities = []
  
  for (const [versionRange, vuln] of Object.entries(vulnData.vulnerabilities)) {
    if (versionRange.startsWith('<')) {
      const targetVersion = versionRange.substring(1)
      if (compareVersions(version, targetVersion) < 0) {
        vulnerabilities.push(vuln)
      }
    }
  }
  
  return vulnerabilities
}

function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(n => parseInt(n, 10))
  const v2parts = version2.split('.').map(n => parseInt(n, 10))
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0
    const v2part = v2parts[i] || 0
    
    if (v1part < v2part) return -1
    if (v1part > v2part) return 1
  }
  
  return 0
}

function detectTechnologies(html: string, url: string, headers?: Record<string, string>): Technology[] {
  const detectedTechs: Technology[] = []
  const htmlLower = html.toLowerCase()
  const normalizedHeaders: Record<string, string> = {}
  
  // Normalize headers to lowercase
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      normalizedHeaders[key.toLowerCase()] = value.toLowerCase()
    }
  }
  
  // Check each technology pattern
  for (const [techName, techData] of Object.entries(TECHNOLOGY_PATTERNS)) {
    let confidence = 0
    let matchCount = 0
    let detectedVersion: string | undefined
    
    // Check HTML patterns
    for (const pattern of techData.patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(html)) {
          matchCount++
          // Try to extract version if this is a versioned library
          if (JS_VULNERABILITY_PATTERNS[techName as keyof typeof JS_VULNERABILITY_PATTERNS]) {
            const version = extractVersion(html, JS_VULNERABILITY_PATTERNS[techName as keyof typeof JS_VULNERABILITY_PATTERNS].patterns)
            if (version) detectedVersion = version
          }
        }
      } else if (typeof pattern === 'string' && htmlLower.includes(pattern.toLowerCase())) {
        matchCount++
      }
    }
    
    // Check header patterns
    if (techData.headers && techData.headerPatterns) {
      for (const headerName of techData.headers) {
        const headerValue = normalizedHeaders[headerName]
        if (headerValue) {
          for (const headerPattern of techData.headerPatterns) {
            if (headerPattern.test(headerValue)) {
              matchCount++
              confidence += 20 // Headers are more reliable
            }
          }
        }
      }
    }
    
    if (matchCount > 0) {
      const baseConfidence = Math.min(100, (matchCount / techData.patterns.length) * 100)
      confidence = Math.max(confidence, baseConfidence)
      
      const tech: Technology = {
        name: techName,
        categories: techData.categories,
        confidence: Math.round(confidence),
        version: detectedVersion
      }
      
      // Check for vulnerabilities
      const vulnerabilities = checkVulnerabilities(techName, detectedVersion)
      if (vulnerabilities.length > 0) {
        tech.vulnerabilities = vulnerabilities
      }
      
      detectedTechs.push(tech)
    }
  }
  
  // Additional server and language detection from headers
  if (headers) {
    // Server detection
    const server = normalizedHeaders['server']
    if (server) {
      if (server.includes('nginx')) {
        detectedTechs.push({
          name: 'Nginx',
          categories: ['Web Server'],
          confidence: 100
        })
      } else if (server.includes('apache')) {
        detectedTechs.push({
          name: 'Apache',
          categories: ['Web Server'],
          confidence: 100
        })
      } else if (server.includes('microsoft-iis')) {
        detectedTechs.push({
          name: 'IIS',
          categories: ['Web Server'],
          confidence: 100
        })
      }
    }
    
    // Programming language detection
    const poweredBy = normalizedHeaders['x-powered-by']
    if (poweredBy) {
      if (poweredBy.includes('php')) {
        const phpVersion = poweredBy.match(/php\/([0-9.]+)/)
        detectedTechs.push({
          name: 'PHP',
          categories: ['Programming Language'],
          confidence: 100,
          version: phpVersion ? phpVersion[1] : undefined
        })
      } else if (poweredBy.includes('asp.net')) {
        detectedTechs.push({
          name: 'ASP.NET',
          categories: ['Programming Language', 'Framework'],
          confidence: 100
        })
      }
    }
  }
  
  // Sort by confidence, then by name
  detectedTechs.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence
    }
    return a.name.localeCompare(b.name)
  })
  
  return detectedTechs
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: WebTechRequest = await req.json()
    
    if (!request.html || !request.url) {
      throw new Error('HTML content and URL are required')
    }
    
    console.log(`WebTech + retire.js analysis for: ${request.url}`)
    
    // Detect technologies
    const technologies = detectTechnologies(
      request.html,
      request.url,
      request.headers
    )
    
    // Group by category
    const byCategory: Record<string, Technology[]> = {}
    for (const tech of technologies) {
      for (const category of tech.categories) {
        if (!byCategory[category]) {
          byCategory[category] = []
        }
        byCategory[category].push(tech)
      }
    }
    
    // Count vulnerabilities
    const vulnerabilityCount = technologies.reduce((acc, tech) => {
      if (tech.vulnerabilities) {
        acc.total += tech.vulnerabilities.length
        tech.vulnerabilities.forEach(vuln => {
          acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
        })
      }
      return acc
    }, { total: 0, critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>)
    
    const result = {
      url: request.url,
      technologies,
      byCategory,
      vulnerabilities: {
        total: vulnerabilityCount.total,
        breakdown: {
          critical: vulnerabilityCount.critical || 0,
          high: vulnerabilityCount.high || 0,
          medium: vulnerabilityCount.medium || 0,
          low: vulnerabilityCount.low || 0
        },
        libraries: technologies.filter(t => t.vulnerabilities && t.vulnerabilities.length > 0)
      },
      summary: {
        total: technologies.length,
        categories: Object.keys(byCategory),
        topTechnologies: technologies.slice(0, 10).map(t => t.name),
        hasVulnerabilities: vulnerabilityCount.total > 0
      },
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: result
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