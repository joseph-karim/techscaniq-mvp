import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface TechStackRequest {
  url: string
  html?: string
  deepScan?: boolean
  includeVersions?: boolean
  includeSecurity?: boolean
}

interface Technology {
  name: string
  category: string
  version?: string
  confidence: number
  evidence: string[]
  vulnerabilities?: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low'
    cve?: string
    description: string
  }>
}

interface TechStackResponse {
  success: boolean
  url: string
  technologies: Technology[]
  summary: {
    totalTechnologies: number
    byCategory: Record<string, number>
    securityScore?: number
    modernityScore?: number
    complexityScore?: number
  }
  insights?: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    techDebt: Array<{
      technology: string
      issue: string
      severity: 'high' | 'medium' | 'low'
    }>
  }
  metadata?: {
    scanTime: number
    htmlSize?: number
    jsFiles?: number
    cssFiles?: number
  }
  error?: string
}

// Technology patterns database
const TECHNOLOGY_PATTERNS = {
  // Frontend Frameworks
  'React': {
    category: 'Frontend Framework',
    patterns: [
      { type: 'js', pattern: /__REACT|_react|React\.version|react\.production\.min\.js/ },
      { type: 'dom', pattern: /data-reactroot|data-react-|_reactRootContainer/ },
      { type: 'global', pattern: /window\.React|ReactDOM/ }
    ],
    versionPatterns: [
      /React\.version\s*=\s*["']([^"']+)/,
      /react@([0-9.]+)/,
      /react\/([0-9.]+)/
    ]
  },
  'Vue.js': {
    category: 'Frontend Framework',
    patterns: [
      { type: 'js', pattern: /Vue\.version|vue\.runtime|vue\.js|vue\.min\.js/ },
      { type: 'dom', pattern: /v-cloak|v-for|v-if|v-model|id="app"/ },
      { type: 'global', pattern: /window\.Vue/ }
    ],
    versionPatterns: [
      /Vue\.version\s*=\s*["']([^"']+)/,
      /vue@([0-9.]+)/
    ]
  },
  'Angular': {
    category: 'Frontend Framework',
    patterns: [
      { type: 'js', pattern: /angular\.version|ng-version|angular\.min\.js/ },
      { type: 'dom', pattern: /ng-app|ng-controller|ng-repeat|\[_nghost/ },
      { type: 'global', pattern: /window\.angular|window\.ng/ }
    ],
    versionPatterns: [
      /angular\.version\.full\s*=\s*["']([^"']+)/,
      /@angular\/core@([0-9.]+)/
    ]
  },
  'Next.js': {
    category: 'Frontend Framework',
    patterns: [
      { type: 'js', pattern: /__NEXT_DATA__|_next\/static|next\.config/ },
      { type: 'dom', pattern: /id="__next"|data-nscript/ },
      { type: 'meta', pattern: /next-head-count/ }
    ],
    versionPatterns: [
      /next@([0-9.]+)/,
      /_next\/static\/chunks\/([0-9.]+)/
    ]
  },
  
  // Backend/CMS
  'WordPress': {
    category: 'CMS',
    patterns: [
      { type: 'url', pattern: /wp-content|wp-includes|wp-json/ },
      { type: 'meta', pattern: /content="WordPress|generator.*WordPress/ },
      { type: 'dom', pattern: /wp-embed-responsive|wp-custom-logo/ }
    ],
    versionPatterns: [
      /WordPress\s+([0-9.]+)/,
      /ver=([0-9.]+).*wp-includes/
    ]
  },
  'Shopify': {
    category: 'E-commerce',
    patterns: [
      { type: 'url', pattern: /cdn\.shopify|myshopify\.com/ },
      { type: 'js', pattern: /Shopify\.theme|shopify_features/ },
      { type: 'meta', pattern: /shopify-digital-wallet|shopify-checkout/ }
    ]
  },
  'Drupal': {
    category: 'CMS',
    patterns: [
      { type: 'meta', pattern: /content="Drupal|generator.*Drupal/ },
      { type: 'js', pattern: /Drupal\.settings|drupalSettings/ },
      { type: 'dom', pattern: /data-drupal-|drupal-render-placeholder/ }
    ],
    versionPatterns: [
      /Drupal\s+([0-9.]+)/
    ]
  },
  
  // JavaScript Libraries
  'jQuery': {
    category: 'JavaScript Library',
    patterns: [
      { type: 'js', pattern: /jquery[\.-].*\.js|jQuery\.fn\.jquery/ },
      { type: 'global', pattern: /window\.jQuery|window\.\$/ }
    ],
    versionPatterns: [
      /jquery[\.-]([0-9.]+)/,
      /jQuery\.fn\.jquery\s*=\s*["']([^"']+)/
    ]
  },
  'Lodash': {
    category: 'JavaScript Library',
    patterns: [
      { type: 'js', pattern: /lodash[\.-].*\.js|lodash\.VERSION/ },
      { type: 'global', pattern: /window\._|window\.lodash/ }
    ],
    versionPatterns: [
      /lodash[\.-]([0-9.]+)/,
      /lodash\.VERSION\s*=\s*["']([^"']+)/
    ]
  },
  
  // CSS Frameworks
  'Bootstrap': {
    category: 'CSS Framework',
    patterns: [
      { type: 'css', pattern: /bootstrap[\.-].*\.css|\.btn-primary|\.container-fluid/ },
      { type: 'dom', pattern: /class="[^"]*(?:btn|col-|container|navbar)/ }
    ],
    versionPatterns: [
      /bootstrap[\.-]([0-9.]+)/,
      /Bootstrap v([0-9.]+)/
    ]
  },
  'Tailwind CSS': {
    category: 'CSS Framework',
    patterns: [
      { type: 'css', pattern: /tailwind|\.tw-/ },
      { type: 'dom', pattern: /class="[^"]*(?:flex|grid|p-\d|m-\d|text-|bg-)/ }
    ]
  },
  
  // Analytics & Tracking
  'Google Analytics': {
    category: 'Analytics',
    patterns: [
      { type: 'js', pattern: /google-analytics\.com|googletagmanager\.com|gtag\(|ga\(/ },
      { type: 'global', pattern: /window\.ga|window\.gtag/ }
    ]
  },
  'Google Tag Manager': {
    category: 'Tag Manager',
    patterns: [
      { type: 'js', pattern: /googletagmanager\.com\/gtm\.js/ },
      { type: 'dom', pattern: /<!-- Google Tag Manager -->/ }
    ]
  },
  'Hotjar': {
    category: 'Analytics',
    patterns: [
      { type: 'js', pattern: /static\.hotjar\.com|hj\(/ },
      { type: 'global', pattern: /window\.hj/ }
    ]
  },
  
  // Cloud & Infrastructure
  'Cloudflare': {
    category: 'CDN',
    patterns: [
      { type: 'header', pattern: /cf-ray|cloudflare/ },
      { type: 'js', pattern: /cloudflare-static|cf\.js/ }
    ]
  },
  'AWS CloudFront': {
    category: 'CDN',
    patterns: [
      { type: 'url', pattern: /cloudfront\.net/ },
      { type: 'header', pattern: /x-amz-cf-/ }
    ]
  },
  'Vercel': {
    category: 'Hosting',
    patterns: [
      { type: 'header', pattern: /x-vercel-|server.*vercel/ },
      { type: 'dom', pattern: /<!-- Vercel -->/ }
    ]
  },
  'Netlify': {
    category: 'Hosting',
    patterns: [
      { type: 'header', pattern: /x-nf-|server.*netlify/ },
      { type: 'dom', pattern: /<!-- Netlify -->/ }
    ]
  },
  
  // Security
  'reCAPTCHA': {
    category: 'Security',
    patterns: [
      { type: 'js', pattern: /google\.com\/recaptcha|grecaptcha/ },
      { type: 'dom', pattern: /g-recaptcha|data-sitekey/ }
    ]
  },
  'Cloudflare Turnstile': {
    category: 'Security',
    patterns: [
      { type: 'js', pattern: /challenges\.cloudflare\.com|turnstile/ },
      { type: 'dom', pattern: /cf-turnstile/ }
    ]
  }
}

// Detect technologies from HTML and JavaScript
function detectTechnologies(html: string, url: string): Technology[] {
  const detectedTechs: Technology[] = []
  const processedTechs = new Set<string>()
  
  for (const [techName, techConfig] of Object.entries(TECHNOLOGY_PATTERNS)) {
    const evidence: string[] = []
    let confidence = 0
    let version: string | undefined
    
    for (const pattern of techConfig.patterns) {
      let matched = false
      
      switch (pattern.type) {
        case 'js':
        case 'dom':
        case 'meta':
          if (pattern.pattern.test(html)) {
            matched = true
            evidence.push(`Found pattern: ${pattern.pattern.source}`)
          }
          break
          
        case 'url':
          if (pattern.pattern.test(url) || pattern.pattern.test(html)) {
            matched = true
            evidence.push(`URL pattern match`)
          }
          break
          
        case 'global':
          // Check for global variables in script content
          const scriptMatch = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi)
          if (scriptMatch) {
            const scriptContent = scriptMatch.join(' ')
            if (pattern.pattern.test(scriptContent)) {
              matched = true
              evidence.push(`Global variable found`)
            }
          }
          break
      }
      
      if (matched) {
        confidence += 0.3
      }
    }
    
    // Check for version if detected
    if (confidence > 0 && techConfig.versionPatterns) {
      for (const versionPattern of techConfig.versionPatterns) {
        const versionMatch = html.match(versionPattern)
        if (versionMatch && versionMatch[1]) {
          version = versionMatch[1]
          evidence.push(`Version ${version} detected`)
          confidence += 0.2
          break
        }
      }
    }
    
    if (confidence > 0.2 && !processedTechs.has(techName)) {
      processedTechs.add(techName)
      detectedTechs.push({
        name: techName,
        category: techConfig.category,
        version,
        confidence: Math.min(confidence, 1),
        evidence
      })
    }
  }
  
  return detectedTechs
}

// Analyze HTTP headers for technologies
function analyzeHeaders(headers: Record<string, string>): Technology[] {
  const techs: Technology[] = []
  
  // Server technologies
  const server = headers['server']?.toLowerCase()
  if (server) {
    if (server.includes('nginx')) {
      techs.push({
        name: 'Nginx',
        category: 'Web Server',
        confidence: 0.9,
        evidence: [`Server header: ${headers['server']}`]
      })
    }
    if (server.includes('apache')) {
      techs.push({
        name: 'Apache',
        category: 'Web Server',
        confidence: 0.9,
        evidence: [`Server header: ${headers['server']}`]
      })
    }
    if (server.includes('cloudflare')) {
      techs.push({
        name: 'Cloudflare',
        category: 'CDN',
        confidence: 1,
        evidence: [`Server header: ${headers['server']}`]
      })
    }
  }
  
  // X-Powered-By
  const poweredBy = headers['x-powered-by']
  if (poweredBy) {
    if (poweredBy.includes('PHP')) {
      const versionMatch = poweredBy.match(/PHP\/([0-9.]+)/)
      techs.push({
        name: 'PHP',
        category: 'Programming Language',
        version: versionMatch ? versionMatch[1] : undefined,
        confidence: 1,
        evidence: [`X-Powered-By: ${poweredBy}`]
      })
    }
    if (poweredBy.includes('Express')) {
      techs.push({
        name: 'Express.js',
        category: 'Web Framework',
        confidence: 1,
        evidence: [`X-Powered-By: ${poweredBy}`]
      })
    }
    if (poweredBy.includes('ASP.NET')) {
      techs.push({
        name: 'ASP.NET',
        category: 'Web Framework',
        confidence: 1,
        evidence: [`X-Powered-By: ${poweredBy}`]
      })
    }
  }
  
  return techs
}

// Check for security vulnerabilities
function checkVulnerabilities(tech: Technology): Technology {
  // Simplified vulnerability database - in production, use CVE database
  const vulnerabilities: Record<string, Array<{ minVersion?: string; maxVersion?: string; severity: 'critical' | 'high' | 'medium' | 'low'; description: string }>> = {
    'jQuery': [
      { maxVersion: '3.0.0', severity: 'medium', description: 'XSS vulnerability in jQuery < 3.0.0' },
      { maxVersion: '1.12.0', severity: 'high', description: 'Multiple security issues in jQuery < 1.12.0' }
    ],
    'Angular': [
      { maxVersion: '1.6.0', severity: 'high', description: 'XSS vulnerability in AngularJS < 1.6.0' }
    ],
    'Bootstrap': [
      { maxVersion: '3.4.0', severity: 'medium', description: 'XSS vulnerability in Bootstrap < 3.4.0' }
    ]
  }
  
  const techVulns = vulnerabilities[tech.name]
  if (techVulns && tech.version) {
    tech.vulnerabilities = []
    
    for (const vuln of techVulns) {
      let affected = false
      
      if (vuln.maxVersion && tech.version <= vuln.maxVersion) {
        affected = true
      }
      if (vuln.minVersion && tech.version >= vuln.minVersion) {
        affected = true
      }
      
      if (affected) {
        tech.vulnerabilities.push({
          severity: vuln.severity,
          description: vuln.description
        })
      }
    }
  }
  
  return tech
}

// Generate insights based on detected technologies
function generateInsights(technologies: Technology[]): TechStackResponse['insights'] {
  const insights: TechStackResponse['insights'] = {
    strengths: [],
    weaknesses: [],
    recommendations: [],
    techDebt: []
  }
  
  // Categorize technologies
  const categories = technologies.reduce((acc, tech) => {
    acc[tech.category] = (acc[tech.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Check for modern stack
  const hasModernFramework = technologies.some(t => 
    ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js'].includes(t.name)
  )
  const hasModernCSS = technologies.some(t => 
    ['Tailwind CSS', 'CSS Modules'].includes(t.name)
  )
  const hasCloudInfra = technologies.some(t => 
    t.category === 'CDN' || t.category === 'Hosting'
  )
  
  if (hasModernFramework) {
    insights.strengths.push('Using modern frontend framework')
  }
  if (hasModernCSS) {
    insights.strengths.push('Modern CSS architecture')
  }
  if (hasCloudInfra) {
    insights.strengths.push('Cloud-based infrastructure')
  }
  
  // Check for security
  const hasSecurityTools = technologies.some(t => t.category === 'Security')
  const hasVulnerabilities = technologies.some(t => t.vulnerabilities && t.vulnerabilities.length > 0)
  
  if (hasSecurityTools) {
    insights.strengths.push('Security measures implemented')
  }
  if (hasVulnerabilities) {
    insights.weaknesses.push('Vulnerable dependencies detected')
    insights.recommendations.push('Update vulnerable dependencies to latest secure versions')
  }
  
  // Check for outdated technologies
  const jqueryTech = technologies.find(t => t.name === 'jQuery')
  if (jqueryTech) {
    insights.techDebt.push({
      technology: 'jQuery',
      issue: 'Legacy JavaScript library - consider modern alternatives',
      severity: 'medium'
    })
  }
  
  // Performance considerations
  if (categories['JavaScript Library'] > 5) {
    insights.weaknesses.push('High number of JavaScript libraries')
    insights.recommendations.push('Consider consolidating JavaScript dependencies')
  }
  
  if (!categories['CDN']) {
    insights.recommendations.push('Implement CDN for better global performance')
  }
  
  // Analytics
  if (!categories['Analytics']) {
    insights.recommendations.push('Implement analytics for user behavior tracking')
  }
  
  return insights
}

// Calculate scores
function calculateScores(technologies: Technology[]): Pick<TechStackResponse['summary'], 'securityScore' | 'modernityScore' | 'complexityScore'> {
  let securityScore = 70 // Base score
  let modernityScore = 50
  let complexityScore = 30
  
  // Security scoring
  const hasSecurityTools = technologies.some(t => t.category === 'Security')
  const vulnerableCount = technologies.filter(t => t.vulnerabilities && t.vulnerabilities.length > 0).length
  
  if (hasSecurityTools) securityScore += 20
  securityScore -= vulnerableCount * 10
  
  // Modernity scoring
  const modernTechs = ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Tailwind CSS', 'TypeScript']
  const modernCount = technologies.filter(t => modernTechs.includes(t.name)).length
  const legacyTechs = ['jQuery', 'AngularJS', 'Backbone.js']
  const legacyCount = technologies.filter(t => legacyTechs.includes(t.name)).length
  
  modernityScore += modernCount * 15
  modernityScore -= legacyCount * 10
  
  // Complexity scoring
  complexityScore = Math.min(100, technologies.length * 5)
  
  return {
    securityScore: Math.max(0, Math.min(100, securityScore)),
    modernityScore: Math.max(0, Math.min(100, modernityScore)),
    complexityScore: Math.max(0, Math.min(100, complexityScore))
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: TechStackRequest = await req.json()
    
    if (!request.url && !request.html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL or HTML content is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const startTime = Date.now()
    let html = request.html || ''
    let headers: Record<string, string> = {}
    
    // Fetch HTML if not provided
    if (!html && request.url) {
      try {
        const response = await fetch(request.url, {
          headers: {
            'User-Agent': 'TechStackAnalyzer/1.0'
          }
        })
        
        if (response.ok) {
          html = await response.text()
          
          // Collect headers
          response.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value
          })
        }
      } catch (error) {
        console.error('Failed to fetch URL:', error)
      }
    }
    
    if (!html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch or parse HTML content' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Detect technologies
    let technologies = detectTechnologies(html, request.url)
    
    // Add header-based technologies
    if (Object.keys(headers).length > 0) {
      const headerTechs = analyzeHeaders(headers)
      technologies = [...technologies, ...headerTechs]
    }
    
    // Check for vulnerabilities if requested
    if (request.includeSecurity) {
      technologies = technologies.map(tech => checkVulnerabilities(tech))
    }
    
    // Remove duplicates
    const uniqueTechs = new Map<string, Technology>()
    for (const tech of technologies) {
      const existing = uniqueTechs.get(tech.name)
      if (!existing || tech.confidence > existing.confidence) {
        uniqueTechs.set(tech.name, tech)
      }
    }
    technologies = Array.from(uniqueTechs.values())
    
    // Sort by confidence
    technologies.sort((a, b) => b.confidence - a.confidence)
    
    // Calculate summary
    const byCategory = technologies.reduce((acc, tech) => {
      acc[tech.category] = (acc[tech.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const scores = calculateScores(technologies)
    
    const response: TechStackResponse = {
      success: true,
      url: request.url,
      technologies,
      summary: {
        totalTechnologies: technologies.length,
        byCategory,
        ...scores
      },
      insights: generateInsights(technologies),
      metadata: {
        scanTime: Date.now() - startTime,
        htmlSize: new TextEncoder().encode(html).length,
        jsFiles: (html.match(/<script/g) || []).length,
        cssFiles: (html.match(/<link[^>]+stylesheet/g) || []).length
      }
    }
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Tech stack analyzer error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        url: '',
        technologies: [],
        summary: { totalTechnologies: 0, byCategory: {} },
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})