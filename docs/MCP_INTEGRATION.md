# MCP Integration for TechScanIQ LangGraph Worker

## Overview

This implementation integrates Model Context Protocol (MCP) tools into the TechScanIQ LangGraph report generation worker. MCP tools provide enhanced capabilities for:

- **Repository Analysis**: Direct access to git repositories for code inspection
- **Filesystem Operations**: Reading and searching files
- **Web Content Fetching**: Enhanced web scraping capabilities
- **Semantic Code Analysis**: Integration with Serena for deep code understanding

## Architecture

### Components

1. **MCP Client Service** (`src/services/mcp-client.ts`)
   - Manages MCP server connections
   - Provides tool discovery and invocation
   - Handles MCP server lifecycle

2. **LangGraph MCP Tools** (`src/services/langgraph-mcp-tools.ts`)
   - Wraps MCP tools as LangChain tools
   - Provides typed interfaces for tool inputs
   - Handles error handling and response parsing

3. **Enhanced LangGraph Worker** (`src/workers/report-generation-worker-langgraph-v3-mcp.ts`)
   - Integrates MCP tools into the analysis workflow
   - New nodes: `enrich_with_mcp` and `analyze_codebase`
   - Enhanced evidence parsing with MCP data

4. **MCP Server Configuration** (`src/config/mcp-servers.ts`)
   - Defines available MCP servers
   - Configures server environments
   - Manages optional servers like Serena

## Available MCP Tools

### Filesystem Tools
- `read_file`: Read contents of any file
- `list_directory`: List directory contents
- `search_files`: Search for files matching patterns

### Git Tools
- `git_status`: Check repository status
- `git_log`: View commit history

### Web Tools
- `fetch_url`: Fetch content from URLs with full response data

### Serena Tools (when enabled)
- `analyze_code_structure`: Semantic code structure analysis
- `find_symbols`: Find specific code symbols
- `detect_security_issues`: Security vulnerability detection
- `analyze_dependencies`: Dependency and framework detection

## Usage

### Running the MCP-Enhanced Worker

```bash
# Run the MCP-enhanced LangGraph worker
npm run worker:report:langgraph:mcp

# Run with specific MCP servers enabled
ENABLE_SERENA_MCP=true npm run worker:report:langgraph:mcp
```

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_api_key
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional MCP Configuration
ENABLE_SERENA_MCP=true
GITHUB_TOKEN=your_github_token  # For GitHub MCP server
```

## Workflow Enhancement

The MCP integration adds two new nodes to the LangGraph workflow:

1. **enrich_with_mcp**: 
   - Extracts repository URLs from evidence
   - Fetches README files and package.json
   - Performs security scans on code
   - Attempts to fetch API documentation

2. **analyze_codebase**:
   - Uses Serena tools for semantic analysis
   - Analyzes code structure and symbols
   - Detects security issues
   - Identifies dependencies and frameworks

## Benefits

1. **Deeper Technical Analysis**
   - Direct access to source code repositories
   - Semantic understanding of code structure
   - Automated security vulnerability detection

2. **Enhanced Evidence**
   - Repository README content
   - Package dependencies and versions
   - Code quality metrics

3. **Higher Confidence Scores**
   - MCP-enhanced analyses receive confidence boosts
   - More comprehensive data for decision making

## Implementation Details

### MCP Tool Integration Pattern

```typescript
// Creating MCP tools
const mcpClient = await MCPClient.createDefault()
const tools = await createMCPTools(mcpClient)

// Using in LangGraph node
async function enrichWithMCPTools(state: ResearchState) {
  const repoUrls = extractRepositoryUrls(state.evidenceCollected)
  
  for (const repo of repoUrls) {
    const readmeTool = tools.find(t => t.name === 'read_file')
    const result = await readmeTool.invoke({ 
      path: `${repo}/README.md` 
    })
    // Process result...
  }
}
```

### Adding New MCP Servers

1. Add server configuration to `src/config/mcp-servers.ts`
2. Update tool discovery in `MCPClient.discoverTools()`
3. Create typed tool wrappers in `langgraph-mcp-tools.ts`

## Future Enhancements

1. **Dynamic Tool Discovery**
   - Implement actual MCP protocol communication
   - Auto-discover tools from running servers
   - Support for custom MCP servers

2. **Caching Layer**
   - Cache MCP tool results
   - Reuse repository analysis across scans

3. **Advanced Analysis**
   - Integration with more specialized MCP servers
   - Custom MCP servers for domain-specific analysis

## Troubleshooting

### MCP Tools Not Available
- Check that MCP servers are properly installed
- Verify environment variables are set
- Check logs for initialization errors

### Performance Issues
- Limit repository analysis to top 3 repos
- Use caching for repeated analyses
- Consider async/parallel tool execution

### Security Considerations
- MCP filesystem access is restricted to safe directories
- Web fetch includes user agent identification
- Git operations are read-only