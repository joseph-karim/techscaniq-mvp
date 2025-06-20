/**
 * Example: Using MCP Tools in TechScanIQ
 * 
 * This example shows how to integrate MCP tools into existing analysis workflows
 */

import { MCPClient } from '../services/mcp-client'
import { createFilteredMCPTools } from '../services/langgraph-mcp-tools'

/**
 * Example 1: Enhancing evidence with repository analysis
 */
async function enhanceEvidenceWithRepoAnalysis(evidence: any[]) {
  // Initialize MCP client
  const mcpClient = await MCPClient.createDefault()
  
  // Get filesystem and git tools
  const tools = await createFilteredMCPTools(['filesystem', 'git'], mcpClient)
  
  // Extract GitHub URLs from evidence
  const githubUrls = evidence
    .map(e => {
      const match = e.content_data?.summary?.match(/github\.com\/([\w-]+\/[\w-]+)/)
      return match ? `https://github.com/${match[1]}` : null
    })
    .filter(Boolean)
  
  // Analyze each repository
  const repoAnalyses = []
  for (const repoUrl of githubUrls) {
    const repoName = repoUrl.split('/').slice(-2).join('/')
    
    // Read README
    const readFileTool = tools.find(t => t.name === 'read_file')
    if (readFileTool) {
      try {
        const readme = await readFileTool.invoke({ 
          path: `/tmp/repos/${repoName}/README.md` 
        })
        repoAnalyses.push({
          repo: repoUrl,
          readme: JSON.parse(readme)
        })
      } catch (e) {
        console.log(`Could not read README for ${repoName}`)
      }
    }
  }
  
  return repoAnalyses
}

/**
 * Example 2: Security scanning with MCP tools
 */
async function performSecurityScan(codebaseUrl: string) {
  const mcpClient = await MCPClient.createDefault()
  const tools = await createFilteredMCPTools(['filesystem'], mcpClient)
  
  const searchTool = tools.find(t => t.name === 'search_files')
  if (!searchTool) return []
  
  // Search for common security patterns
  const securityPatterns = [
    { pattern: 'password\\s*=\\s*["\']', description: 'Hardcoded passwords' },
    { pattern: 'api[_-]?key\\s*=\\s*["\']', description: 'Hardcoded API keys' },
    { pattern: 'eval\\s*\\(', description: 'Eval usage' }
  ]
  
  const findings = []
  for (const { pattern, description } of securityPatterns) {
    const result = await searchTool.invoke({
      pattern,
      path: `/tmp/repos/${codebaseUrl}`
    })
    
    const matches = JSON.parse(result)
    if (matches.matches?.length > 0) {
      findings.push({
        issue: description,
        pattern,
        occurrences: matches.matches.length,
        files: matches.matches.map((m: any) => m.file)
      })
    }
  }
  
  return findings
}

/**
 * Example 3: Fetching additional documentation
 */
async function fetchCompanyDocs(domain: string) {
  const mcpClient = await MCPClient.createDefault()
  const tools = await createFilteredMCPTools(['web'], mcpClient)
  
  const fetchTool = tools.find(t => t.name === 'fetch_url')
  if (!fetchTool) return {}
  
  const docUrls = [
    `https://${domain}/docs`,
    `https://${domain}/api`,
    `https://${domain}/developers`,
    `https://docs.${domain}`,
    `https://api.${domain}/docs`
  ]
  
  const docs: Record<string, any> = {}
  
  for (const url of docUrls) {
    try {
      const result = await fetchTool.invoke({ url })
      const response = JSON.parse(result)
      
      if (response.status === 200) {
        docs[url] = {
          content: response.content,
          headers: response.headers
        }
      }
    } catch (e) {
      // URL doesn't exist or fetch failed
    }
  }
  
  return docs
}

/**
 * Example 4: Comprehensive repository analysis workflow
 */
async function analyzeRepository(repoUrl: string) {
  const mcpClient = await MCPClient.createDefault()
  const repoName = repoUrl.split('/').slice(-2).join('/')
  
  // Get all relevant tools
  const gitStatusTool = (await createFilteredMCPTools(['git'], mcpClient))
    .find(t => t.name === 'git_status')
  const gitLogTool = (await createFilteredMCPTools(['git'], mcpClient))
    .find(t => t.name === 'git_log')
  const readFileTool = (await createFilteredMCPTools(['filesystem'], mcpClient))
    .find(t => t.name === 'read_file')
  const listDirTool = (await createFilteredMCPTools(['filesystem'], mcpClient))
    .find(t => t.name === 'list_directory')
  
  const analysis: any = {
    url: repoUrl,
    name: repoName,
    status: null,
    recentCommits: null,
    structure: null,
    readme: null,
    packageJson: null
  }
  
  // Get git status
  if (gitStatusTool) {
    try {
      const status = await gitStatusTool.invoke({ repo_path: `/tmp/repos/${repoName}` })
      analysis.status = JSON.parse(status)
    } catch (e) {}
  }
  
  // Get recent commits
  if (gitLogTool) {
    try {
      const log = await gitLogTool.invoke({ 
        repo_path: `/tmp/repos/${repoName}`,
        limit: 10 
      })
      analysis.recentCommits = JSON.parse(log)
    } catch (e) {}
  }
  
  // Get directory structure
  if (listDirTool) {
    try {
      const structure = await listDirTool.invoke({ path: `/tmp/repos/${repoName}` })
      analysis.structure = JSON.parse(structure)
    } catch (e) {}
  }
  
  // Read important files
  if (readFileTool) {
    // README
    try {
      const readme = await readFileTool.invoke({ path: `/tmp/repos/${repoName}/README.md` })
      analysis.readme = JSON.parse(readme).content
    } catch (e) {}
    
    // package.json
    try {
      const pkg = await readFileTool.invoke({ path: `/tmp/repos/${repoName}/package.json` })
      analysis.packageJson = JSON.parse(JSON.parse(pkg).content)
    } catch (e) {}
  }
  
  return analysis
}

// Export examples
export {
  enhanceEvidenceWithRepoAnalysis,
  performSecurityScan,
  fetchCompanyDocs,
  analyzeRepository
}