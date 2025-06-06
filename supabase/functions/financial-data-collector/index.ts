import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface FinancialDataRequest {
  companyName: string
  companyWebsite?: string
  ticker?: string
  includeNews?: boolean
  includeFundingHistory?: boolean
  includeFinancials?: boolean
  includeValuation?: boolean
}

interface FinancialDataResponse {
  success: boolean
  companyInfo?: {
    name: string
    ticker?: string
    exchange?: string
    industry?: string
    sector?: string
    description?: string
    website?: string
    employees?: number
    founded?: string
    headquarters?: string
  }
  fundingHistory?: Array<{
    date: string
    round: string
    amount?: number
    amountString?: string
    valuation?: number
    valuationString?: string
    investors?: string[]
    leadInvestor?: string
    source?: string
  }>
  financials?: {
    revenue?: {
      current?: number
      growth?: number
      trend?: 'increasing' | 'decreasing' | 'stable'
    }
    profitability?: {
      isProfitable?: boolean
      netIncome?: number
      margin?: number
    }
    marketCap?: number
    enterpriseValue?: number
    metrics?: {
      peRatio?: number
      psRatio?: number
      evToRevenue?: number
      debtToEquity?: number
    }
  }
  news?: Array<{
    title: string
    url: string
    date: string
    source: string
    summary?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    relevance?: number
  }>
  valuation?: {
    currentEstimate?: number
    lastKnown?: {
      amount: number
      date: string
      round?: string
    }
    comparables?: Array<{
      company: string
      valuation: number
      revenue?: number
      psRatio?: number
    }>
  }
  insights?: {
    fundingStage: 'seed' | 'early' | 'growth' | 'late' | 'public' | 'unknown'
    investmentTrend: 'hot' | 'growing' | 'stable' | 'declining' | 'unknown'
    financialHealth: 'strong' | 'moderate' | 'weak' | 'unknown'
    exitPotential: 'high' | 'medium' | 'low' | 'unknown'
  }
  sources?: string[]
  error?: string
}

// Timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
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
    throw error
  }
}

// Search for company ticker symbol
async function findCompanyTicker(companyName: string): Promise<{ ticker?: string; exchange?: string }> {
  try {
    // Try Alpha Vantage symbol search (free tier available)
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    if (alphaVantageKey) {
      const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(companyName)}&apikey=${alphaVantageKey}`
      
      const response = await fetchWithTimeout(searchUrl, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.bestMatches && data.bestMatches.length > 0) {
          const match = data.bestMatches[0]
          return {
            ticker: match['1. symbol'],
            exchange: match['4. region']
          }
        }
      }
    }
    
    // Fallback: Try to search using web scraping
    const searchQuery = encodeURIComponent(`${companyName} stock ticker symbol`)
    const searchUrl = `https://www.google.com/search?q=${searchQuery}`
    
    const response = await fetchWithTimeout(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, 10000)
    
    if (response.ok) {
      const html = await response.text()
      // Look for common ticker patterns
      const tickerMatch = html.match(/\b([A-Z]{1,5})[\s:]+(?:NYSE|NASDAQ|AMEX)\b/)
      if (tickerMatch) {
        return { ticker: tickerMatch[1] }
      }
    }
  } catch (error) {
    console.error('Error finding ticker:', error)
  }
  
  return {}
}

// Get funding history from various sources
async function getFundingHistory(companyName: string): Promise<FinancialDataResponse['fundingHistory']> {
  const fundingHistory: FinancialDataResponse['fundingHistory'] = []
  
  try {
    // Search for funding news
    const searchQuery = encodeURIComponent(`${companyName} funding round investment million`)
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=nws`
    
    const response = await fetchWithTimeout(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, 10000)
    
    if (response.ok) {
      const html = await response.text()
      
      // Extract funding information using patterns
      const fundingPatterns = [
        /raised?\s+\$?([\d.]+)\s*(million|billion|M|B)/gi,
        /funding\s+round\s+of\s+\$?([\d.]+)\s*(million|billion|M|B)/gi,
        /Series\s+([A-F])\s+.*?\$?([\d.]+)\s*(million|billion|M|B)/gi,
        /\$?([\d.]+)\s*(million|billion|M|B)\s+Series\s+([A-F])/gi
      ]
      
      for (const pattern of fundingPatterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
          const amount = parseFloat(match[1])
          const unit = match[2].toLowerCase()
          const multiplier = unit.startsWith('b') ? 1000 : 1
          
          fundingHistory.push({
            date: new Date().toISOString(), // Would need to extract actual date
            round: match[3] ? `Series ${match[3]}` : 'Unknown',
            amount: amount * multiplier,
            amountString: `$${amount}${unit.charAt(0).toUpperCase()}`,
            source: 'Web search'
          })
        }
      }
    }
    
    // Try Crunchbase API if available
    const crunchbaseKey = Deno.env.get('CRUNCHBASE_API_KEY')
    if (crunchbaseKey) {
      // Note: Crunchbase API is paid, this is placeholder
      console.log('Crunchbase API integration would go here')
    }
    
  } catch (error) {
    console.error('Error getting funding history:', error)
  }
  
  // Remove duplicates and sort by date
  return fundingHistory
    .filter((item, index, self) => 
      index === self.findIndex(t => t.amountString === item.amountString)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Get stock data and financials
async function getStockData(ticker: string): Promise<Partial<FinancialDataResponse['financials']>> {
  const financials: Partial<FinancialDataResponse['financials']> = {}
  
  try {
    // Try Alpha Vantage for stock data
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    if (alphaVantageKey && ticker) {
      // Get company overview
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${alphaVantageKey}`
      
      const overviewResponse = await fetchWithTimeout(overviewUrl, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (overviewResponse.ok) {
        const data = await overviewResponse.json()
        
        financials.marketCap = parseInt(data.MarketCapitalization) || undefined
        financials.metrics = {
          peRatio: parseFloat(data.PERatio) || undefined,
          psRatio: parseFloat(data.PriceToSalesRatioTTM) || undefined,
          evToRevenue: parseFloat(data.EVToRevenue) || undefined,
          debtToEquity: parseFloat(data.DebtToEquity) || undefined
        }
        
        if (data.RevenueTTM) {
          financials.revenue = {
            current: parseInt(data.RevenueTTM),
            growth: parseFloat(data.RevenueGrowthYOY) || undefined,
            trend: data.RevenueGrowthYOY > 0 ? 'increasing' : 'decreasing'
          }
        }
        
        if (data.NetIncomeTTM) {
          financials.profitability = {
            isProfitable: parseInt(data.NetIncomeTTM) > 0,
            netIncome: parseInt(data.NetIncomeTTM),
            margin: parseFloat(data.ProfitMargin) || undefined
          }
        }
      }
    }
    
    // Try Yahoo Finance as fallback (web scraping)
    if (!financials.marketCap && ticker) {
      const yahooUrl = `https://finance.yahoo.com/quote/${ticker}`
      
      const response = await fetchWithTimeout(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, 10000)
      
      if (response.ok) {
        const html = await response.text()
        
        // Extract market cap
        const marketCapMatch = html.match(/Market Cap[^>]*>([^<]+)</i)
        if (marketCapMatch) {
          const mcText = marketCapMatch[1]
          const mcValue = parseFloat(mcText.replace(/[^\d.]/g, ''))
          const multiplier = mcText.includes('T') ? 1e12 : mcText.includes('B') ? 1e9 : mcText.includes('M') ? 1e6 : 1
          financials.marketCap = mcValue * multiplier
        }
      }
    }
    
  } catch (error) {
    console.error('Error getting stock data:', error)
  }
  
  return financials
}

// Get recent news
async function getCompanyNews(companyName: string, maxArticles: number = 10): Promise<FinancialDataResponse['news']> {
  const news: FinancialDataResponse['news'] = []
  
  try {
    // Use Google News RSS
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=en-US&gl=US&ceid=US:en`
    
    const response = await fetchWithTimeout(rssUrl, {
      headers: { 'Accept': 'application/rss+xml, application/xml' }
    }, 10000)
    
    if (response.ok) {
      const xml = await response.text()
      
      // Basic XML parsing for RSS
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || []
      
      for (const item of items.slice(0, maxArticles)) {
        const title = item.match(/<title>([^<]+)<\/title>/)?.[1] || ''
        const link = item.match(/<link>([^<]+)<\/link>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] || ''
        const description = item.match(/<description>([^<]+)<\/description>/)?.[1] || ''
        
        if (title && link) {
          // Basic sentiment analysis
          let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
          const positiveWords = ['growth', 'revenue', 'profit', 'expansion', 'success', 'partnership', 'innovation']
          const negativeWords = ['loss', 'decline', 'layoff', 'lawsuit', 'breach', 'fail', 'bankruptcy']
          
          const lowerTitle = title.toLowerCase()
          const lowerDesc = description.toLowerCase()
          const combinedText = `${lowerTitle} ${lowerDesc}`
          
          const positiveCount = positiveWords.filter(word => combinedText.includes(word)).length
          const negativeCount = negativeWords.filter(word => combinedText.includes(word)).length
          
          if (positiveCount > negativeCount) sentiment = 'positive'
          else if (negativeCount > positiveCount) sentiment = 'negative'
          
          news.push({
            title: title.replace(/<[^>]+>/g, ''),
            url: link,
            date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            source: 'Google News',
            summary: description.replace(/<[^>]+>/g, '').substring(0, 200),
            sentiment,
            relevance: 0.8
          })
        }
      }
    }
  } catch (error) {
    console.error('Error getting news:', error)
  }
  
  return news
}

// Generate insights based on collected data
function generateInsights(
  fundingHistory?: FinancialDataResponse['fundingHistory'],
  financials?: FinancialDataResponse['financials'],
  news?: FinancialDataResponse['news']
): FinancialDataResponse['insights'] {
  const insights: FinancialDataResponse['insights'] = {
    fundingStage: 'unknown',
    investmentTrend: 'unknown',
    financialHealth: 'unknown',
    exitPotential: 'unknown'
  }
  
  // Determine funding stage
  if (fundingHistory && fundingHistory.length > 0) {
    const latestRound = fundingHistory[0].round.toLowerCase()
    if (latestRound.includes('seed')) insights.fundingStage = 'seed'
    else if (latestRound.includes('series a') || latestRound.includes('series b')) insights.fundingStage = 'early'
    else if (latestRound.includes('series c') || latestRound.includes('series d')) insights.fundingStage = 'growth'
    else if (latestRound.includes('series e') || latestRound.includes('series f')) insights.fundingStage = 'late'
  }
  
  if (financials?.marketCap) {
    insights.fundingStage = 'public'
  }
  
  // Investment trend based on news sentiment
  if (news && news.length > 0) {
    const recentNews = news.slice(0, 5)
    const positiveCount = recentNews.filter(n => n.sentiment === 'positive').length
    const negativeCount = recentNews.filter(n => n.sentiment === 'negative').length
    
    if (positiveCount >= 3) insights.investmentTrend = 'hot'
    else if (positiveCount > negativeCount) insights.investmentTrend = 'growing'
    else if (negativeCount > positiveCount) insights.investmentTrend = 'declining'
    else insights.investmentTrend = 'stable'
  }
  
  // Financial health
  if (financials) {
    if (financials.profitability?.isProfitable && financials.revenue?.trend === 'increasing') {
      insights.financialHealth = 'strong'
    } else if (financials.profitability?.isProfitable || financials.revenue?.trend === 'increasing') {
      insights.financialHealth = 'moderate'
    } else if (financials.revenue?.trend === 'decreasing') {
      insights.financialHealth = 'weak'
    }
  }
  
  // Exit potential
  if (insights.fundingStage === 'growth' || insights.fundingStage === 'late') {
    if (insights.financialHealth === 'strong' && insights.investmentTrend !== 'declining') {
      insights.exitPotential = 'high'
    } else {
      insights.exitPotential = 'medium'
    }
  } else if (insights.fundingStage === 'early') {
    insights.exitPotential = 'medium'
  } else {
    insights.exitPotential = 'low'
  }
  
  return insights
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: FinancialDataRequest = await req.json()
    
    if (!request.companyName) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Company name is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log(`Collecting financial data for: ${request.companyName}`)
    
    const response: FinancialDataResponse = {
      success: true,
      sources: []
    }
    
    // Find ticker symbol if not provided
    let ticker = request.ticker
    if (!ticker) {
      const tickerInfo = await findCompanyTicker(request.companyName)
      ticker = tickerInfo.ticker
      
      if (ticker) {
        response.companyInfo = {
          name: request.companyName,
          ticker,
          exchange: tickerInfo.exchange,
          website: request.companyWebsite
        }
        response.sources.push('Stock market data')
      }
    }
    
    // Collect funding history
    if (request.includeFundingHistory !== false) {
      const fundingHistory = await getFundingHistory(request.companyName)
      if (fundingHistory.length > 0) {
        response.fundingHistory = fundingHistory
        response.sources.push('Funding news')
      }
    }
    
    // Get stock data if ticker available
    if (ticker && request.includeFinancials !== false) {
      const financials = await getStockData(ticker)
      if (Object.keys(financials).length > 0) {
        response.financials = financials as FinancialDataResponse['financials']
        response.sources.push('Financial APIs')
      }
    }
    
    // Get recent news
    if (request.includeNews !== false) {
      const news = await getCompanyNews(request.companyName)
      if (news.length > 0) {
        response.news = news
        response.sources.push('News aggregation')
      }
    }
    
    // Generate insights
    response.insights = generateInsights(
      response.fundingHistory,
      response.financials,
      response.news
    )
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('Financial data collector error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})