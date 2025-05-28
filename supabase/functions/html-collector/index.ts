// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface HtmlRequest {
  url: string
  options?: {
    timeout?: number
    userAgent?: string
    headers?: Record<string, string>
    followRedirects?: boolean
    prerender?: boolean
  }
}

interface HtmlResponse {
  success: boolean
  html?: string
  url: string
  finalUrl?: string
  status?: number
  error?: string
  metadata?: {
    title?: string
    description?: string
    image?: string
    contentType?: string
    contentLength?: number
    loadTime?: number
    headers?: Record<string, string>
  }
}

// User agent pool for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
]

// Get random user agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// Extract metadata from HTML
function extractMetadata(html: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    metadata.title = titleMatch[1].trim()
  }
  
  // Extract meta tags
  const metaRegex = /<meta\s+([^>]+)>/gi
  let match
  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1]
    
    // Get property/name and content
    const nameMatch = attrs.match(/(?:property|name)="([^"]+)"/i)
    const contentMatch = attrs.match(/content="([^"]+)"/i)
    
    if (nameMatch && contentMatch) {
      const name = nameMatch[1]
      const content = contentMatch[1]
      
      // Map common meta tags
      if (name === 'description' || name === 'og:description' || name === 'twitter:description') {
        metadata.description = content
      } else if (name === 'og:image' || name === 'twitter:image') {
        metadata.image = content
      }
    }
  }
  
  return metadata
}

// Timeout wrapper with better error handling
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout = 15000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: options.redirect || 'follow'
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

// Clean and minify HTML
function cleanHtml(html: string): string {
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove style tags and their content
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  // Remove comments
  html = html.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove excessive whitespace
  html = html.replace(/\s+/g, ' ')
  
  // Trim
  return html.trim()
}

Deno.serve(async (req) => {
  // Skip JWT verification for testing
  // In production, you'd want to verify the JWT token
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: HtmlRequest = await req.json()
    const { url, options = {} } = body
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const startTime = Date.now()
    
    // Prepare headers
    const headers: Record<string, string> = {
      'User-Agent': options.userAgent || getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...options.headers
    }

    try {
      // Fetch the URL
      const response = await fetchWithTimeout(
        url,
        { 
          method: 'GET',
          headers,
          redirect: options.followRedirects !== false ? 'follow' : 'manual'
        },
        options.timeout || 15000
      )

      const loadTime = Date.now() - startTime

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            url,
            status: response.status,
            error: `HTTP ${response.status}: ${response.statusText}`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get response text
      const html = await response.text()
      
      // Extract metadata
      const extractedMetadata = extractMetadata(html)
      
      // Build response headers metadata
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const result: HtmlResponse = {
        success: true,
        html: options.prerender === false ? html : cleanHtml(html),
        url,
        finalUrl: response.url !== url ? response.url : undefined,
        status: response.status,
        metadata: {
          ...extractedMetadata,
          contentType: response.headers.get('content-type') || undefined,
          contentLength: parseInt(response.headers.get('content-length') || '0') || html.length,
          loadTime,
          headers: responseHeaders
        }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      
      return new Response(
        JSON.stringify({
          success: false,
          url,
          error: fetchError.message || 'Failed to fetch HTML'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Request error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/html-collector' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
