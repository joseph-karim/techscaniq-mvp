# TechScanIQ Codebase Comprehensive Audit Report

## Executive Summary

This audit provides a comprehensive analysis of the TechScanIQ codebase, identifying legacy vs current code, understanding the LangGraph architecture evolution, and proposing a cleanup plan. The codebase shows significant evolution from simple workers to sophisticated LangGraph-based architecture with MCP (Model Context Protocol) integration.

## 1. Codebase Structure Overview

### 1.1 Project Type & Stack
- **Frontend**: React + TypeScript + Vite
- **Backend API**: Express.js (Node.js)
- **Python Backend**: FastAPI (techscaniq-v2/backend)
- **Workers**: BullMQ-based queue processing
- **Database**: Supabase (PostgreSQL)
- **Queue**: Redis + BullMQ
- **AI Integration**: Anthropic Claude, Google Gemini, LangChain/LangGraph

### 1.2 Directory Structure
```
techscaniq-mvp/
├── src/
│   ├── api/              # Express API server
│   ├── components/       # React components
│   ├── config/          # Configuration files
│   ├── examples/        # Usage examples
│   ├── lib/             # Shared libraries
│   ├── pages/           # React pages/routes
│   ├── routes/          # Route configurations
│   ├── services/        # Service layer
│   ├── tests/           # Test files
│   └── workers/         # Background workers (27 worker files)
├── techscaniq-v2/
│   └── backend/         # Python FastAPI backend
├── scripts/             # Utility scripts
├── docs/               # Documentation
└── tests/              # E2E/Integration tests
```

## 2. Worker Evolution Analysis

### 2.1 Evidence Collection Workers (12 variants)

#### Legacy Workers (Should be removed):
1. `evidence-collection-worker.ts` - Original basic implementation
2. `evidence-collection-worker-v2.ts` - Early iteration
3. `evidence-collection-worker-streaming.ts` - Experimental streaming
4. `evidence-collection-worker-real.ts` - Unclear purpose
5. `evidence-collection-worker-comprehensive.ts` - Superseded by deep variants

#### Current/Active Workers:
1. **`evidence-collection-worker-jina.ts`** - DEFAULT (used in npm scripts)
2. **`evidence-collection-worker-deep-simple.ts`** - Deep scanning variant
3. **`evidence-collection-worker-crawl4ai.ts`** - Advanced crawling

#### Specialized/Experimental:
1. `evidence-collection-worker-agentic.ts` - Agent-based approach
2. `evidence-collection-worker-deep.ts` - Deep analysis variant
3. `evidence-collection-worker-deep-research.ts` - Research-focused
4. `evidence-collection-worker-flexible.ts` - Configurable variant

### 2.2 Report Generation Workers (17 variants)

#### Legacy Workers (Should be removed):
1. `report-generation-worker.ts` - Original basic implementation
2. `report-generation-worker-v2.ts` - Early version
3. `report-generation-worker-v3.ts` - Intermediate version
4. `report-generation-worker-v4.ts` - Superseded
5. `report-generation-worker-v5.ts` - Superseded
6. `report-generation-worker-unified.ts` - Attempted unification
7. `report-generation-worker-staged.ts` - Staging approach

#### Current LangGraph Workers (Active):
1. **`report-generation-worker-langgraph-v4-backend.ts`** - LATEST with backend integration
2. **`report-generation-worker-langgraph-v3-mcp.ts`** - MCP integration variant
3. **`report-generation-worker-langgraph-v2.ts`** - Stable LangGraph version

#### Specialized Workers:
1. `report-generation-worker-claude-orchestrated.ts` - Claude-specific
2. `report-generation-worker-thesis-aligned.ts` - Investment thesis focused
3. `report-generation-worker-langgraph-v3-thesis.ts` - Thesis + LangGraph

## 3. Service Layer Analysis

### Current Services:
1. **`mcp-client.ts`** - MCP client for tool integration
2. **`langgraph-mcp-tools.ts`** - LangGraph MCP tool wrappers
3. **`langgraph-serena-tools.ts`** - Serena code analysis tools
4. **`serena-integration.ts`** - Serena service integration
5. **`langgraph-reports.ts`** - Report management service
6. **`storage.ts`** - Storage utilities

## 4. LangGraph Architecture Evolution

### Evolution Timeline:
1. **Phase 1**: Basic workers with simple AI calls
2. **Phase 2**: Introduction of LangGraph (`report-generation-worker-langgraph.ts`)
3. **Phase 3**: Version iterations (v2, v3)
4. **Phase 4**: MCP Integration (`v3-mcp`)
5. **Phase 5**: Backend Integration (`v4-backend`) - CURRENT

### Current Architecture Features:
- **StateGraph-based workflow** with defined nodes and edges
- **MCP tool integration** for filesystem, git, and web operations
- **Serena integration** for code analysis
- **Backend API communication** for enhanced processing
- **Comprehensive state management** with annotations

## 5. Key Scripts and Entry Points

### Primary npm Scripts:
```json
{
  "dev": "vite",                                          // Frontend dev
  "api:server": "tsx src/api/server.ts",                // API server
  "worker:evidence": "tsx src/workers/evidence-collection-worker-jina.ts",
  "worker:report:langgraph:backend": "tsx src/workers/report-generation-worker-langgraph-v4-backend.ts",
  "backend:start": "cd techscaniq-v2/backend && python -m uvicorn main:app --reload"
}
```

### Startup Scripts:
- `scripts/start-with-backend.sh` - Full stack startup with backend

## 6. Configuration and Environment

### Key Configuration Files:
1. `src/config/mcp-servers.ts` - MCP server configurations
2. `src/lib/config/environment.ts` - Environment management
3. `.env` files for secrets and configuration

### Required Services:
- Redis (for BullMQ)
- Supabase (database)
- Python backend (port 8000)
- Node.js API (port 3001)
- Frontend (port 3000)

## 7. Routes and Pages

### Admin Routes:
- `/admin/langgraph-report/:id` - LangGraph report viewer
- `/admin/sales-intelligence/:accountId` - Sales intelligence reports
- `/admin/pe-diligence/:companyId` - PE diligence reports

### Report Generation:
- `/reports/generate-langgraph` - LangGraph report generation UI

## 8. Cleanup Recommendations

### 8.1 Workers to Remove:
```
# Evidence Collection Workers to Remove:
- evidence-collection-worker.ts
- evidence-collection-worker-v2.ts
- evidence-collection-worker-streaming.ts
- evidence-collection-worker-real.ts
- evidence-collection-worker-comprehensive.ts

# Report Generation Workers to Remove:
- report-generation-worker.ts
- report-generation-worker-v2.ts
- report-generation-worker-v3.ts
- report-generation-worker-v4.ts
- report-generation-worker-v5.ts
- report-generation-worker-unified.ts
- report-generation-worker-staged.ts
```

### 8.2 Workers to Keep:
```
# Evidence Collection (Keep these 3):
- evidence-collection-worker-jina.ts (DEFAULT)
- evidence-collection-worker-deep-simple.ts
- evidence-collection-worker-crawl4ai.ts

# Report Generation (Keep these 3):
- report-generation-worker-langgraph-v4-backend.ts (LATEST)
- report-generation-worker-langgraph-v3-mcp.ts
- report-generation-worker-langgraph-v2.ts
```

### 8.3 Code Organization Recommendations:

1. **Create Clear Naming Convention**:
   ```
   workers/
   ├── evidence/
   │   ├── jina.worker.ts
   │   ├── deep.worker.ts
   │   └── crawl4ai.worker.ts
   └── report/
       ├── langgraph-backend.worker.ts
       ├── langgraph-mcp.worker.ts
       └── langgraph-base.worker.ts
   ```

2. **Update npm Scripts**:
   - Remove references to deprecated workers
   - Create aliases for common configurations

3. **Documentation Updates**:
   - Update README with current architecture
   - Remove references to deprecated workers
   - Create migration guide for any breaking changes

## 9. Technical Debt and Risks

### High Priority:
1. **Worker Proliferation**: 27 worker files with unclear purposes
2. **Inconsistent Naming**: Mix of versioning schemes (v2, v3, etc.)
3. **Dead Code**: Multiple unused worker implementations

### Medium Priority:
1. **Configuration Complexity**: Multiple ways to configure workers
2. **Test Coverage**: Limited test files (only 2 in src/tests)
3. **Documentation Gaps**: Many workers lack inline documentation

### Low Priority:
1. **Script Organization**: Testing scripts mixed with operational scripts
2. **Example Code**: Limited examples for new features

## 10. Migration Path

### Phase 1: Audit and Documentation (1 day)
1. Document which workers are actively used in production
2. Create deprecation notices for legacy workers
3. Update documentation

### Phase 2: Code Cleanup (2-3 days)
1. Remove deprecated workers
2. Reorganize remaining workers
3. Update all references in scripts and code

### Phase 3: Testing and Validation (2 days)
1. Test all npm scripts
2. Verify production deployments
3. Update CI/CD pipelines

### Phase 4: Optimization (1-2 days)
1. Consolidate common code
2. Improve error handling
3. Add monitoring/logging

## Conclusion

The TechScanIQ codebase has evolved significantly, particularly in the worker architecture moving from simple implementations to sophisticated LangGraph-based systems with MCP integration. The main challenge is the accumulation of legacy code that needs systematic cleanup while preserving the current functional implementations.

The recommended approach is to:
1. Keep only the latest LangGraph workers (v4-backend, v3-mcp, v2)
2. Maintain 3 evidence collection variants for different use cases
3. Remove all legacy implementations
4. Reorganize code structure for clarity
5. Update documentation and scripts

This cleanup will significantly improve maintainability and reduce confusion for new developers joining the project.