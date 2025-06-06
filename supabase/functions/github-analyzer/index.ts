import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface GitHubRequest {
  companyName: string
  companyWebsite?: string
  searchTopics?: string[]
  includeRepos?: boolean
  includeContributors?: boolean
  includeTechStack?: boolean
  includeActivity?: boolean
  maxRepos?: number
}

interface GitHubResponse {
  success: boolean
  organization?: {
    name: string
    login: string
    description?: string
    blog?: string
    location?: string
    email?: string
    twitter?: string
    publicRepos: number
    followers: number
    following: number
    createdAt: string
    updatedAt: string
    type: string
  }
  repositories?: Array<{
    name: string
    fullName: string
    description?: string
    url: string
    homepage?: string
    private: boolean
    fork: boolean
    createdAt: string
    updatedAt: string
    pushedAt: string
    size: number
    stars: number
    watchers: number
    forks: number
    openIssues: number
    language?: string
    languages?: Record<string, number>
    topics?: string[]
    license?: string
    defaultBranch: string
    hasWiki: boolean
    hasPages: boolean
    archived: boolean
  }>
  techStack?: {
    primaryLanguages: Array<{ language: string; percentage: number; bytes: number }>
    allLanguages: Record<string, number>
    frameworks: string[]
    tools: string[]
    topics: string[]
    licenses: string[]
  }
  activity?: {
    totalCommits: number
    recentCommits: number
    totalContributors: number
    activeContributors: number
    totalPullRequests: number
    totalIssues: number
    lastActivityDate: string
    commitFrequency: Record<string, number>
  }
  contributors?: Array<{
    login: string
    contributions: number
    htmlUrl: string
    type: string
  }>
  insights?: {
    developmentVelocity: 'high' | 'medium' | 'low'
    projectHealth: 'excellent' | 'good' | 'fair' | 'poor'
    communityEngagement: 'high' | 'medium' | 'low'
    codeQualityIndicators: string[]
  }
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

// Search for GitHub organization
async function findGitHubOrganization(companyName: string, website?: string): Promise<string | null> {
  const token = Deno.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TechScanIQ-Analyzer'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  try {
    // First, try to extract from website if provided
    if (website) {
      // Check if website contains github.com link
      const websiteResponse = await fetchWithTimeout(website, { method: 'GET' }, 10000).catch(() => null)
      if (websiteResponse && websiteResponse.ok) {
        const html = await websiteResponse.text()
        const githubMatch = html.match(/github\.com\/([a-zA-Z0-9-]+)/i)
        if (githubMatch && githubMatch[1]) {
          console.log(`Found GitHub org from website: ${githubMatch[1]}`)
          return githubMatch[1]
        }
      }
    }
    
    // Search for organization by name
    const searchQuery = encodeURIComponent(`${companyName} in:name type:org`)
    const searchUrl = `https://api.github.com/search/users?q=${searchQuery}&type=org`
    
    const searchResponse = await fetchWithTimeout(searchUrl, { headers }, 10000)
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        // Return the most relevant result
        return searchData.items[0].login
      }
    }
    
    // Try searching repositories
    const repoSearchQuery = encodeURIComponent(`${companyName} in:name`)
    const repoSearchUrl = `https://api.github.com/search/repositories?q=${repoSearchQuery}&sort=stars`
    
    const repoSearchResponse = await fetchWithTimeout(repoSearchUrl, { headers }, 10000)
    
    if (repoSearchResponse.ok) {
      const repoData = await repoSearchResponse.json()
      if (repoData.items && repoData.items.length > 0) {
        // Extract org from top repository
        const topRepo = repoData.items[0]
        if (topRepo.owner.type === 'Organization') {
          return topRepo.owner.login
        }
      }
    }
    
  } catch (error) {
    console.error('Error finding GitHub organization:', error)
  }
  
  return null
}

// Get organization details
async function getOrganizationDetails(orgLogin: string): Promise<GitHubResponse['organization'] | null> {
  const token = Deno.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TechScanIQ-Analyzer'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  try {
    const response = await fetchWithTimeout(`https://api.github.com/orgs/${orgLogin}`, { headers })
    
    if (response.ok) {
      const data = await response.json()
      return {
        name: data.name || data.login,
        login: data.login,
        description: data.description,
        blog: data.blog,
        location: data.location,
        email: data.email,
        twitter: data.twitter_username,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        type: data.type
      }
    }
  } catch (error) {
    console.error('Error getting organization details:', error)
  }
  
  return null
}

// Get repositories
async function getRepositories(orgLogin: string, maxRepos: number = 30): Promise<GitHubResponse['repositories']> {
  const token = Deno.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TechScanIQ-Analyzer'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  const repositories: GitHubResponse['repositories'] = []
  
  try {
    // Get repositories sorted by stars
    const reposUrl = `https://api.github.com/orgs/${orgLogin}/repos?sort=pushed&per_page=${Math.min(maxRepos, 100)}`
    const response = await fetchWithTimeout(reposUrl, { headers })
    
    if (response.ok) {
      const repos = await response.json()
      
      for (const repo of repos.slice(0, maxRepos)) {
        // Get languages for each repo
        let languages: Record<string, number> = {}
        try {
          const langResponse = await fetchWithTimeout(`${repo.languages_url}`, { headers })
          if (langResponse.ok) {
            languages = await langResponse.json()
          }
        } catch (e) {
          console.error(`Failed to get languages for ${repo.name}`)
        }
        
        repositories.push({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          homepage: repo.homepage,
          private: repo.private,
          fork: repo.fork,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          size: repo.size,
          stars: repo.stargazers_count,
          watchers: repo.watchers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          language: repo.language,
          languages,
          topics: repo.topics || [],
          license: repo.license?.spdx_id,
          defaultBranch: repo.default_branch,
          hasWiki: repo.has_wiki,
          hasPages: repo.has_pages,
          archived: repo.archived
        })
      }
    }
  } catch (error) {
    console.error('Error getting repositories:', error)
  }
  
  return repositories
}

// Analyze tech stack
function analyzeTechStack(repositories: GitHubResponse['repositories']): GitHubResponse['techStack'] {
  const languageBytes: Record<string, number> = {}
  const allTopics = new Set<string>()
  const allLicenses = new Set<string>()
  const frameworks = new Set<string>()
  const tools = new Set<string>()
  
  // Framework detection patterns in topics and descriptions
  const frameworkPatterns = {
    'react': ['react', 'reactjs', 'create-react-app', 'next', 'nextjs', 'gatsby'],
    'vue': ['vue', 'vuejs', 'nuxt', 'nuxtjs'],
    'angular': ['angular', 'angularjs'],
    'django': ['django', 'django-rest-framework'],
    'rails': ['rails', 'ruby-on-rails'],
    'spring': ['spring', 'spring-boot', 'spring-cloud'],
    'express': ['express', 'expressjs'],
    'fastapi': ['fastapi'],
    'flask': ['flask'],
    'laravel': ['laravel'],
    'dotnet': ['dotnet', 'aspnet', 'aspnetcore'],
    'nodejs': ['nodejs', 'node'],
    'kubernetes': ['kubernetes', 'k8s'],
    'docker': ['docker', 'dockerfile', 'containerized'],
    'terraform': ['terraform', 'infrastructure-as-code'],
    'aws': ['aws', 'amazon-web-services'],
    'azure': ['azure', 'microsoft-azure'],
    'gcp': ['gcp', 'google-cloud', 'google-cloud-platform']
  }
  
  for (const repo of repositories || []) {
    // Aggregate languages
    if (repo.languages) {
      for (const [lang, bytes] of Object.entries(repo.languages)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes
      }
    }
    
    // Collect topics
    repo.topics?.forEach(topic => allTopics.add(topic))
    
    // Collect licenses
    if (repo.license) {
      allLicenses.add(repo.license)
    }
    
    // Detect frameworks and tools from topics and descriptions
    const searchText = `${repo.topics?.join(' ') || ''} ${repo.description || ''} ${repo.name}`.toLowerCase()
    
    for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
      if (patterns.some(pattern => searchText.includes(pattern))) {
        if (['kubernetes', 'docker', 'terraform', 'aws', 'azure', 'gcp'].includes(framework)) {
          tools.add(framework)
        } else {
          frameworks.add(framework)
        }
      }
    }
  }
  
  // Calculate language percentages
  const totalBytes = Object.values(languageBytes).reduce((sum, bytes) => sum + bytes, 0)
  const primaryLanguages = Object.entries(languageBytes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0
    }))
  
  return {
    primaryLanguages,
    allLanguages: languageBytes,
    frameworks: Array.from(frameworks),
    tools: Array.from(tools),
    topics: Array.from(allTopics),
    licenses: Array.from(allLicenses)
  }
}

// Get activity metrics
async function getActivityMetrics(orgLogin: string, repositories: GitHubResponse['repositories']): Promise<GitHubResponse['activity']> {
  const token = Deno.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TechScanIQ-Analyzer'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  const activity: GitHubResponse['activity'] = {
    totalCommits: 0,
    recentCommits: 0,
    totalContributors: 0,
    activeContributors: 0,
    totalPullRequests: 0,
    totalIssues: 0,
    lastActivityDate: '',
    commitFrequency: {}
  }
  
  const contributorSet = new Set<string>()
  const recentContributorSet = new Set<string>()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  // Sample top repositories for activity
  const reposToAnalyze = repositories?.slice(0, 5) || []
  
  for (const repo of reposToAnalyze) {
    try {
      // Get recent commits
      const commitsUrl = `https://api.github.com/repos/${repo.fullName}/commits?since=${thirtyDaysAgo.toISOString()}&per_page=100`
      const commitsResponse = await fetchWithTimeout(commitsUrl, { headers })
      
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json()
        activity.recentCommits += commits.length
        
        // Track contributors
        commits.forEach((commit: any) => {
          if (commit.author?.login) {
            recentContributorSet.add(commit.author.login)
          }
        })
      }
      
      // Get contributors
      const contributorsUrl = `https://api.github.com/repos/${repo.fullName}/contributors?per_page=100`
      const contributorsResponse = await fetchWithTimeout(contributorsUrl, { headers })
      
      if (contributorsResponse.ok) {
        const contributors = await contributorsResponse.json()
        contributors.forEach((contributor: any) => {
          contributorSet.add(contributor.login)
        })
      }
      
    } catch (error) {
      console.error(`Error getting activity for ${repo.name}:`, error)
    }
    
    // Update last activity
    if (!activity.lastActivityDate || repo.pushedAt > activity.lastActivityDate) {
      activity.lastActivityDate = repo.pushedAt
    }
    
    // Aggregate issues and PRs
    activity.totalIssues += repo.openIssues
  }
  
  activity.totalContributors = contributorSet.size
  activity.activeContributors = recentContributorSet.size
  
  return activity
}

// Get top contributors
async function getTopContributors(orgLogin: string, repositories: GitHubResponse['repositories']): Promise<GitHubResponse['contributors']> {
  const token = Deno.env.get('GITHUB_TOKEN')
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TechScanIQ-Analyzer'
  }
  
  if (token) {
    headers['Authorization'] = `token ${token}`
  }
  
  const contributorMap = new Map<string, { login: string; contributions: number; htmlUrl: string; type: string }>()
  
  // Get contributors from top repositories
  const reposToAnalyze = repositories?.slice(0, 5) || []
  
  for (const repo of reposToAnalyze) {
    try {
      const url = `https://api.github.com/repos/${repo.fullName}/contributors?per_page=30`
      const response = await fetchWithTimeout(url, { headers })
      
      if (response.ok) {
        const contributors = await response.json()
        
        for (const contributor of contributors) {
          const existing = contributorMap.get(contributor.login)
          if (existing) {
            existing.contributions += contributor.contributions
          } else {
            contributorMap.set(contributor.login, {
              login: contributor.login,
              contributions: contributor.contributions,
              htmlUrl: contributor.html_url,
              type: contributor.type
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error getting contributors for ${repo.name}:`, error)
    }
  }
  
  // Sort by contributions and return top contributors
  return Array.from(contributorMap.values())
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 20)
}

// Generate insights
function generateInsights(
  org: GitHubResponse['organization'],
  repos: GitHubResponse['repositories'],
  activity: GitHubResponse['activity'],
  techStack: GitHubResponse['techStack']
): GitHubResponse['insights'] {
  const insights: GitHubResponse['insights'] = {
    developmentVelocity: 'medium',
    projectHealth: 'good',
    communityEngagement: 'medium',
    codeQualityIndicators: []
  }
  
  // Development velocity based on recent commits and active contributors
  if (activity) {
    if (activity.recentCommits > 500 && activity.activeContributors > 10) {
      insights.developmentVelocity = 'high'
    } else if (activity.recentCommits < 50 || activity.activeContributors < 3) {
      insights.developmentVelocity = 'low'
    }
  }
  
  // Project health based on various factors
  if (repos && repos.length > 0) {
    const avgStars = repos.reduce((sum, r) => sum + r.stars, 0) / repos.length
    const hasActiveMaintenance = repos.some(r => {
      const lastPush = new Date(r.pushedAt)
      const daysSinceLastPush = (Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastPush < 30
    })
    
    if (avgStars > 100 && hasActiveMaintenance) {
      insights.projectHealth = 'excellent'
    } else if (avgStars < 10 || !hasActiveMaintenance) {
      insights.projectHealth = 'fair'
    }
  }
  
  // Community engagement based on stars, forks, and contributors
  if (repos && activity) {
    const totalStars = repos.reduce((sum, r) => sum + r.stars, 0)
    const totalForks = repos.reduce((sum, r) => sum + r.forks, 0)
    
    if (totalStars > 1000 || totalForks > 200 || activity.totalContributors > 50) {
      insights.communityEngagement = 'high'
    } else if (totalStars < 50 && totalForks < 10 && activity.totalContributors < 10) {
      insights.communityEngagement = 'low'
    }
  }
  
  // Code quality indicators
  if (repos) {
    if (repos.some(r => r.topics?.includes('testing') || r.topics?.includes('ci-cd'))) {
      insights.codeQualityIndicators.push('Has testing infrastructure')
    }
    
    if (repos.some(r => r.hasPages)) {
      insights.codeQualityIndicators.push('Has documentation')
    }
    
    if (techStack?.licenses.includes('MIT') || techStack?.licenses.includes('Apache-2.0')) {
      insights.codeQualityIndicators.push('Uses open source licenses')
    }
    
    if (techStack?.tools.includes('docker') || techStack?.tools.includes('kubernetes')) {
      insights.codeQualityIndicators.push('Uses containerization')
    }
    
    if (repos.some(r => !r.archived && r.openIssues < 50)) {
      insights.codeQualityIndicators.push('Well-maintained issue tracking')
    }
  }
  
  return insights
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: GitHubRequest = await req.json()
    
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
    
    console.log(`Analyzing GitHub presence for: ${request.companyName}`)
    
    // Find GitHub organization
    const orgLogin = await findGitHubOrganization(request.companyName, request.companyWebsite)
    
    if (!orgLogin) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Could not find GitHub organization for ${request.companyName}` 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log(`Found GitHub organization: ${orgLogin}`)
    
    const response: GitHubResponse = {
      success: true
    }
    
    // Get organization details
    const orgDetails = await getOrganizationDetails(orgLogin)
    if (orgDetails) {
      response.organization = orgDetails
    }
    
    // Get repositories
    if (request.includeRepos !== false) {
      const repos = await getRepositories(orgLogin, request.maxRepos || 30)
      response.repositories = repos
      
      // Analyze tech stack
      if (request.includeTechStack !== false && repos.length > 0) {
        response.techStack = analyzeTechStack(repos)
      }
      
      // Get activity metrics
      if (request.includeActivity !== false && repos.length > 0) {
        response.activity = await getActivityMetrics(orgLogin, repos)
      }
      
      // Get top contributors
      if (request.includeContributors && repos.length > 0) {
        response.contributors = await getTopContributors(orgLogin, repos)
      }
      
      // Generate insights
      if (orgDetails && repos.length > 0) {
        response.insights = generateInsights(
          orgDetails,
          repos,
          response.activity,
          response.techStack
        )
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
    console.error('GitHub analyzer error:', error)
    
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