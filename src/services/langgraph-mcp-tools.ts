/**
 * LangGraph MCP Tools
 * 
 * Provides MCP tool integrations for the LangGraph agent to enhance
 * evidence collection and analysis capabilities.
 */

import { Tool } from '@langchain/core/tools'
import { z } from 'zod'
import { MCPClient, MCPTool } from './mcp-client'

/**
 * Base class for MCP-backed LangGraph tools
 */
abstract class MCPBaseTool extends Tool {
  protected mcpClient: MCPClient
  protected mcpToolName: string

  constructor(mcpClient: MCPClient, mcpToolName: string) {
    super()
    this.mcpClient = mcpClient
    this.mcpToolName = mcpToolName
  }

  async _call(input: any): Promise<string> {
    try {
      const result = await this.mcpClient.callTool(this.mcpToolName, input)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        tool: this.mcpToolName
      })
    }
  }
}

/**
 * Tool for reading files from repositories or local filesystem
 */
export class ReadFileTool extends MCPBaseTool {
  name = 'read_file'
  description = `Read the contents of a file from a repository or filesystem.
    Useful for examining source code, configuration files, documentation, etc.
    Returns the full content of the file.`

  schema = z.object({
    path: z.string().describe('Path to the file to read')
  })

  constructor(mcpClient: MCPClient) {
    super(mcpClient, 'read_file')
  }
}

/**
 * Tool for searching files in repositories
 */
export class SearchFilesTool extends MCPBaseTool {
  name = 'search_files'
  description = `Search for files matching a pattern in a repository or directory.
    Useful for finding specific code patterns, configuration, or documentation.
    Supports regex patterns and returns matching lines with context.`

  schema = z.object({
    pattern: z.string().describe('Search pattern (regex supported)'),
    path: z.string().optional().describe('Starting directory path')
  })

  constructor(mcpClient: MCPClient) {
    super(mcpClient, 'search_files')
  }
}

/**
 * Tool for listing directory contents
 */
export class ListDirectoryTool extends MCPBaseTool {
  name = 'list_directory'
  description = `List the contents of a directory, including files and subdirectories.
    Useful for understanding project structure and finding relevant files.`

  schema = z.object({
    path: z.string().describe('Directory path to list')
  })

  constructor(mcpClient: MCPClient) {
    super(mcpClient, 'list_directory')
  }
}

/**
 * Tool for fetching web content
 */
export class FetchURLTool extends MCPBaseTool {
  name = 'fetch_url'
  description = `Fetch content from a URL, including HTML, API responses, etc.
    Useful for gathering information from websites, documentation, or APIs.
    Returns the content and headers.`

  schema = z.object({
    url: z.string().describe('URL to fetch'),
    method: z.enum(['GET', 'POST']).optional().default('GET').describe('HTTP method')
  })

  constructor(mcpClient: MCPClient) {
    super(mcpClient, 'fetch_url')
  }
}

/**
 * Tool for checking git repository status
 */
export class GitStatusTool extends MCPBaseTool {
  name = 'git_status'
  description = `Get the current status of a git repository.
    Shows branch information, modified files, and untracked files.
    Useful for understanding the state of a codebase.`

  schema = z.object({
    repo_path: z.string().optional().describe('Repository path (defaults to current directory)')
  })

  constructor(mcpClient: MCPClient) {
    super(mcpClient, 'git_status')
  }
}

/**
 * Tool for viewing git commit history
 */
export class GitLogTool extends MCPBaseTool {
  name = 'git_log'
  description = `View git commit history for a repository.
    Shows recent commits with messages, authors, and timestamps.
    Useful for understanding development activity and changes.`

  schema = z.object({
    repo_path: z.string().optional().describe('Repository path'),
    limit: z.number().optional().default(10).describe('Number of commits to show')
  })

  constructor(mcpClient: MCPClient) {
    super(mcpClient, 'git_log')
  }
}

/**
 * Dynamic tool wrapper for any MCP tool
 */
export class DynamicMCPTool extends Tool {
  private mcpClient: MCPClient
  private mcpTool: MCPTool

  constructor(mcpClient: MCPClient, mcpTool: MCPTool) {
    super()
    this.mcpClient = mcpClient
    this.mcpTool = mcpTool
    
    // Set tool properties from MCP tool definition
    this.name = mcpTool.name
    this.description = mcpTool.description || `MCP tool: ${mcpTool.name}`
    
    // Convert MCP input schema to Zod schema if possible
    if (mcpTool.inputSchema && mcpTool.inputSchema.type === 'object') {
      this.schema = this.convertToZodSchema(mcpTool.inputSchema)
    }
  }

  async _call(input: any): Promise<string> {
    try {
      const result = await this.mcpClient.callTool(this.mcpTool.name, input)
      return JSON.stringify(result, null, 2)
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        tool: this.mcpTool.name
      })
    }
  }

  private convertToZodSchema(jsonSchema: any): z.ZodSchema {
    // Basic conversion from JSON Schema to Zod
    // This is simplified - a full implementation would handle all JSON Schema features
    const shape: Record<string, any> = {}
    
    if (jsonSchema.properties) {
      for (const [key, prop] of Object.entries(jsonSchema.properties as any)) {
        if (prop.type === 'string') {
          shape[key] = z.string().describe(prop.description || key)
        } else if (prop.type === 'number') {
          shape[key] = z.number().describe(prop.description || key)
        } else if (prop.type === 'boolean') {
          shape[key] = z.boolean().describe(prop.description || key)
        } else if (prop.type === 'array') {
          shape[key] = z.array(z.any()).describe(prop.description || key)
        } else if (prop.type === 'object') {
          shape[key] = z.object({}).describe(prop.description || key)
        } else {
          shape[key] = z.any().describe(prop.description || key)
        }
        
        // Make optional if not in required array
        if (!jsonSchema.required?.includes(key)) {
          shape[key] = shape[key].optional()
        }
      }
    }
    
    return z.object(shape)
  }
}

/**
 * Create all available MCP tools for LangGraph
 */
export async function createMCPTools(mcpClient?: MCPClient): Promise<Tool[]> {
  const client = mcpClient || await MCPClient.createDefault()
  
  const tools: Tool[] = [
    new ReadFileTool(client),
    new SearchFilesTool(client),
    new ListDirectoryTool(client),
    new FetchURLTool(client),
    new GitStatusTool(client),
    new GitLogTool(client),
  ]

  // Also create dynamic tools for any additional MCP tools discovered
  const mcpTools = client.getTools()
  const predefinedToolNames = new Set(tools.map(t => t.name))
  
  for (const mcpTool of mcpTools) {
    if (!predefinedToolNames.has(mcpTool.name)) {
      tools.push(new DynamicMCPTool(client, mcpTool))
    }
  }

  return tools
}

/**
 * Create filtered MCP tools based on categories
 */
export async function createFilteredMCPTools(
  categories: ('filesystem' | 'git' | 'web' | 'analysis')[],
  mcpClient?: MCPClient
): Promise<Tool[]> {
  const client = mcpClient || await MCPClient.createDefault()
  const tools: Tool[] = []

  if (categories.includes('filesystem')) {
    tools.push(
      new ReadFileTool(client),
      new SearchFilesTool(client),
      new ListDirectoryTool(client)
    )
  }

  if (categories.includes('git')) {
    tools.push(
      new GitStatusTool(client),
      new GitLogTool(client)
    )
  }

  if (categories.includes('web')) {
    tools.push(new FetchURLTool(client))
  }

  return tools
}