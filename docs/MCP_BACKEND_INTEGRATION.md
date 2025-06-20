# MCP Backend Integration for TechScanIQ

## Overview

This document describes the integration of Serena MCP (Model Context Protocol) tools into TechScanIQ's backend infrastructure. The integration enables deep code analysis capabilities through a Python backend service that communicates with the TypeScript LangGraph worker.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   LangGraph Worker  │────▶│   Backend API       │────▶│   Serena MCP       │
│   (TypeScript)      │◀────│   (Python/FastAPI)  │◀────│   Server           │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │                            │
         │                           │                            │
         ▼                           ▼                            ▼
    Evidence Data              Code Analysis              Semantic Analysis
    Extraction                 Orchestration             LSP-based Tools
```

## Components

### 1. Backend MCP Client Service (`mcp_client_service.py`)

Manages the connection to Serena MCP server:

- **Connection Management**: Handles server startup, health checks, and graceful shutdown
- **Tool Discovery**: Automatically discovers available MCP tools
- **Error Handling**: Implements retry logic and connection monitoring
- **JSON-RPC Communication**: Manages protocol-level communication with MCP server

Key features:
```python
# Auto-connect with retry
await mcp_client.connect(retry_count=3, retry_delay=2.0)

# Call MCP tools
result = await mcp_client.call_tool("analyze_code_structure", {
    "code": code_files,
    "language": "javascript"
})

# Health monitoring
health = await check_mcp_health()
```

### 2. Code Analysis API (`code_analysis.py`)

RESTful API endpoint for code analysis:

- **Endpoint**: `POST /api/code-analysis/analyze`
- **Features**:
  - Multi-language support (JavaScript, TypeScript, Python, Java, etc.)
  - Security vulnerability detection
  - Framework and dependency analysis
  - Parallel analysis execution

Request format:
```json
{
  "code": {
    "app.js": "// JavaScript code",
    "style.css": "/* CSS code */"
  },
  "url": "example.com",
  "options": {
    "includeSecurityScan": true,
    "detectFrameworks": true,
    "analyzeDependencies": true
  }
}
```

Response format:
```json
{
  "symbols": [...],
  "patterns": [...],
  "securityIssues": [
    {
      "type": "hardcoded_password",
      "severity": "critical",
      "description": "Hardcoded password found in source code",
      "locations": ["app.js"],
      "occurrences": 1
    }
  ],
  "dependencies": ["react", "axios", "express"],
  "frameworks": [
    {
      "name": "React",
      "confidence": 0.95,
      "version": "Unknown",
      "evidence": "React hooks and JSX detected"
    }
  ],
  "metadata": {
    "analysis_time": 2.5,
    "file_count": 3,
    "total_lines": 150
  }
}
```

### 3. Enhanced LangGraph Worker (`report-generation-worker-langgraph-v4-backend.ts`)

Integration points:

1. **Code Extraction Node**: Extracts code from various evidence types
2. **Backend Analysis Node**: Sends code to backend API for deep analysis
3. **Enhanced Parsing**: Combines backend insights with existing evidence

New workflow nodes:
```typescript
// Extract code from evidence
.addNode('extract_code', extractCodeNode)

// Analyze with backend
.addNode('analyze_code_backend', analyzeCodeWithBackend)
```

### 4. Serena Tools Integration

Available MCP tools:

1. **analyze_code_structure**: Semantic code structure analysis
2. **find_code_patterns**: Pattern matching with context
3. **find_symbols**: Symbol search and navigation
4. **detect_security_issues**: Security vulnerability detection
5. **analyze_dependencies**: Dependency and import analysis

## Deployment

### Backend Setup

1. Install Python dependencies:
```bash
cd techscaniq-v2/backend
pip install -r requirements.txt
```

2. Start the backend server:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

3. Verify MCP connection:
```bash
curl http://localhost:8000/api/code-analysis/health
```

### Worker Configuration

1. Set environment variables:
```bash
BACKEND_API_URL=http://localhost:8000
```

2. Start the enhanced worker:
```bash
npm run worker:report:langgraph:backend
```

## Error Handling

### Graceful Degradation

The system is designed to continue functioning even if components fail:

1. **MCP Server Down**: Backend continues with limited functionality
2. **Backend API Down**: Worker continues with existing evidence
3. **Partial Analysis Failure**: Individual tool failures don't stop the entire analysis

### Health Monitoring

Health check endpoints:
- Backend health: `GET /health`
- MCP health: `GET /api/code-analysis/health`
- Metrics: `GET /metrics`

## Security Considerations

1. **Code Isolation**: Analyzed code runs in temporary sandboxed directories
2. **Input Validation**: All code inputs are validated before analysis
3. **Timeout Protection**: Analysis operations have configurable timeouts
4. **Resource Limits**: Memory and CPU usage are monitored

## Performance Optimization

1. **Parallel Analysis**: Multiple analyses run concurrently
2. **Caching**: MCP tool results are cached for repeated analyses
3. **Streaming**: Large code files are processed in chunks
4. **Connection Pooling**: MCP connections are reused

## Testing

Run the integration tests:
```bash
# Test backend MCP integration
npm run test:backend:mcp

# Or directly
tsx src/tests/test-backend-mcp-integration.ts
```

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**
   - Check if Serena is installed: `pip show serena`
   - Verify MCP server can start: `uvx --from serena serena --help`

2. **Backend API Timeout**
   - Increase timeout in worker: `timeout: 60000`
   - Check backend logs for errors

3. **No Code Extracted**
   - Verify evidence contains code blocks
   - Check extraction patterns match content format

### Debug Mode

Enable debug logging:
```bash
# Backend
LOG_LEVEL=DEBUG python -m uvicorn main:app

# Worker
DEBUG=* npm run worker:report:langgraph:backend
```

## Future Enhancements

1. **Additional MCP Servers**: Integration with more MCP tools
2. **Real-time Analysis**: WebSocket support for live updates
3. **Distributed Analysis**: Scale across multiple backend instances
4. **ML-Enhanced Insights**: Integration with AI models for deeper analysis
5. **Custom Tool Development**: Create domain-specific MCP tools

## API Reference

See the full API documentation at: `http://localhost:8000/docs` (when backend is running)