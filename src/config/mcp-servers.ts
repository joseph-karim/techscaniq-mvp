/**
 * MCP Server Configuration for TechScanIQ
 * 
 * Defines the MCP servers to use for enhanced analysis capabilities
 */

import { MCPServerConfig } from '../services/mcp-client'

export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem'],
    env: {
      // Restrict filesystem access to safe directories
      ALLOWED_DIRECTORIES: '/tmp,/var/tmp'
    }
  },
  {
    name: 'git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git'],
    env: {
      // Git server configuration
    }
  },
  {
    name: 'fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    env: {
      // Web fetch configuration
      USER_AGENT: 'TechScanIQ/1.0'
    }
  },
  {
    name: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
    }
  }
]

// Serena MCP server configuration (if available)
export const SERENA_SERVER: MCPServerConfig = {
  name: 'serena',
  command: 'serena',
  args: ['--mcp'],
  env: {
    SERENA_MODE: 'mcp'
  }
}

// Export all servers including optional ones
export function getAllMCPServers(): MCPServerConfig[] {
  const servers = [...MCP_SERVERS]
  
  // Add Serena if available
  if (process.env.ENABLE_SERENA_MCP === 'true') {
    servers.push(SERENA_SERVER)
  }
  
  return servers
}