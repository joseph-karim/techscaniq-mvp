# TechScanIQ Codebase Cleanup Action Plan

## Overview
This document provides a step-by-step action plan for cleaning up the TechScanIQ codebase based on the comprehensive audit findings.

## Phase 1: Preparation and Verification (Day 1)

### 1.1 Create Backup
```bash
# Create a backup branch
git checkout -b pre-cleanup-backup
git push origin pre-cleanup-backup
```

### 1.2 Document Current State
- [ ] List all active workers in production
- [ ] Document which npm scripts are used in deployment
- [ ] Verify CI/CD pipeline configurations
- [ ] Check for any hardcoded references to worker files

### 1.3 Create Deprecation Notices
Create a file `DEPRECATED_WORKERS.md`:
```markdown
# Deprecated Workers

The following workers are deprecated and will be removed:

## Evidence Collection Workers
- evidence-collection-worker.ts - Use evidence-collection-worker-jina.ts instead
- evidence-collection-worker-v2.ts - Use evidence-collection-worker-jina.ts instead
- evidence-collection-worker-streaming.ts - Experimental, no replacement
- evidence-collection-worker-real.ts - Use evidence-collection-worker-jina.ts instead
- evidence-collection-worker-comprehensive.ts - Use evidence-collection-worker-deep-simple.ts instead

## Report Generation Workers
- report-generation-worker.ts - Use report-generation-worker-langgraph-v4-backend.ts
- report-generation-worker-v2.ts - Use report-generation-worker-langgraph-v4-backend.ts
- report-generation-worker-v3.ts - Use report-generation-worker-langgraph-v4-backend.ts
- report-generation-worker-v4.ts - Use report-generation-worker-langgraph-v4-backend.ts
- report-generation-worker-v5.ts - Use report-generation-worker-langgraph-v4-backend.ts
- report-generation-worker-unified.ts - Use report-generation-worker-langgraph-v4-backend.ts
- report-generation-worker-staged.ts - Use report-generation-worker-langgraph-v4-backend.ts
```

## Phase 2: Code Reorganization (Day 2)

### 2.1 Create New Directory Structure
```bash
# Create new organized structure
mkdir -p src/workers/evidence
mkdir -p src/workers/report
mkdir -p src/workers/technical
mkdir -p src/workers/orchestration
mkdir -p src/workers/shared
mkdir -p src/workers/legacy
```

### 2.2 Move Active Workers
```bash
# Evidence Collection Workers
mv src/workers/evidence-collection-worker-jina.ts src/workers/evidence/jina.worker.ts
mv src/workers/evidence-collection-worker-deep-simple.ts src/workers/evidence/deep.worker.ts
mv src/workers/evidence-collection-worker-crawl4ai.ts src/workers/evidence/crawl4ai.worker.ts

# Report Generation Workers
mv src/workers/report-generation-worker-langgraph-v4-backend.ts src/workers/report/langgraph-backend.worker.ts
mv src/workers/report-generation-worker-langgraph-v3-mcp.ts src/workers/report/langgraph-mcp.worker.ts
mv src/workers/report-generation-worker-langgraph-v2.ts src/workers/report/langgraph-base.worker.ts

# Technical Analysis Workers
mv src/workers/technical-analysis/*.ts src/workers/technical/

# Shared Configuration
mv src/workers/queue-config.ts src/workers/shared/
```

### 2.3 Move Legacy Workers
```bash
# Move all deprecated workers to legacy folder
mv src/workers/evidence-collection-worker.ts src/workers/legacy/
mv src/workers/evidence-collection-worker-v2.ts src/workers/legacy/
mv src/workers/evidence-collection-worker-streaming.ts src/workers/legacy/
mv src/workers/evidence-collection-worker-real.ts src/workers/legacy/
mv src/workers/evidence-collection-worker-comprehensive.ts src/workers/legacy/
mv src/workers/report-generation-worker.ts src/workers/legacy/
mv src/workers/report-generation-worker-v2.ts src/workers/legacy/
mv src/workers/report-generation-worker-v3.ts src/workers/legacy/
mv src/workers/report-generation-worker-v4.ts src/workers/legacy/
mv src/workers/report-generation-worker-v5.ts src/workers/legacy/
mv src/workers/report-generation-worker-unified.ts src/workers/legacy/
mv src/workers/report-generation-worker-staged.ts src/workers/legacy/
```

## Phase 3: Update References (Day 2-3)

### 3.1 Update package.json Scripts
```json
{
  "scripts": {
    // Evidence Workers
    "worker:evidence": "tsx src/workers/evidence/jina.worker.ts",
    "worker:evidence:deep": "tsx src/workers/evidence/deep.worker.ts",
    "worker:evidence:crawl4ai": "tsx src/workers/evidence/crawl4ai.worker.ts",
    
    // Report Workers
    "worker:report": "tsx src/workers/report/langgraph-backend.worker.ts",
    "worker:report:mcp": "tsx src/workers/report/langgraph-mcp.worker.ts",
    "worker:report:base": "tsx src/workers/report/langgraph-base.worker.ts",
    
    // Aliases for backward compatibility
    "worker:report:langgraph:backend": "npm run worker:report",
    "worker:report:langgraph:mcp": "npm run worker:report:mcp",
    "worker:report:langgraph": "npm run worker:report:base"
  }
}
```

### 3.2 Update Import Paths
Search and replace all imports:
```typescript
// Old
import { QueueConfig } from '../workers/queue-config'

// New
import { QueueConfig } from '../workers/shared/queue-config'
```

### 3.3 Update Script Files
Update all shell scripts and JavaScript files that reference worker paths:
- `scripts/start-with-backend.sh`
- Any deployment scripts
- CI/CD configuration files

## Phase 4: Testing and Validation (Day 3-4)

### 4.1 Test All NPM Scripts
```bash
# Test each worker script
npm run worker:evidence
npm run worker:evidence:deep
npm run worker:evidence:crawl4ai
npm run worker:report
npm run worker:report:mcp
npm run worker:report:base
```

### 4.2 Integration Testing
```bash
# Run full integration tests
npm run test:backend:mcp
npm run test:integration
```

### 4.3 Local Environment Testing
```bash
# Start full stack
./scripts/start-with-backend.sh

# Test scan creation and processing
npm run test:complete-flow
```

## Phase 5: Documentation Updates (Day 4)

### 5.1 Update README.md
- Remove references to deprecated workers
- Update architecture diagrams
- Update setup instructions

### 5.2 Create Migration Guide
Create `MIGRATION_GUIDE.md`:
```markdown
# Worker Migration Guide

## For Developers
If you were using deprecated workers, please update your references:

### Evidence Collection
- `evidence-collection-worker.ts` → `evidence/jina.worker.ts`
- `evidence-collection-worker-deep.ts` → `evidence/deep.worker.ts`

### Report Generation
- `report-generation-worker-v*.ts` → `report/langgraph-backend.worker.ts`

## For DevOps
Update your deployment scripts to use new worker paths.
```

### 5.3 Update Documentation Files
- Update `docs/pipeline-architecture-complete.md`
- Update `docs/queue-based-architecture-setup.md`
- Create new `docs/worker-architecture.md`

## Phase 6: Cleanup and Optimization (Day 5)

### 6.1 Remove Legacy Directory
After confirming everything works:
```bash
# Remove legacy workers (after 30 days)
rm -rf src/workers/legacy
```

### 6.2 Code Quality Improvements
- Add TypeScript interfaces for worker configurations
- Improve error handling in active workers
- Add comprehensive logging

### 6.3 Create Shared Utilities
Extract common code into shared modules:
```typescript
// src/workers/shared/base-worker.ts
export abstract class BaseWorker {
  // Common initialization
  // Error handling
  // Logging
}
```

## Phase 7: Monitoring and Rollback Plan

### 7.1 Monitoring Checklist
- [ ] All workers starting correctly
- [ ] Queue processing functioning
- [ ] No errors in production logs
- [ ] Performance metrics stable

### 7.2 Rollback Plan
If issues arise:
```bash
# Quick rollback
git checkout pre-cleanup-backup
npm install
# Redeploy
```

## Success Criteria

1. **Functional**: All features work as before
2. **Performance**: No degradation in processing times
3. **Clarity**: New developers can understand structure
4. **Maintainability**: Easier to add new workers
5. **Documentation**: Complete and accurate

## Timeline Summary

- **Day 1**: Preparation and verification
- **Day 2**: Code reorganization
- **Day 3**: Update references and initial testing
- **Day 4**: Documentation updates
- **Day 5**: Final cleanup and optimization

Total estimated time: 5 working days

## Risk Mitigation

1. **Backup Everything**: Multiple backups before starting
2. **Incremental Changes**: Test after each phase
3. **Communication**: Notify team of changes
4. **Monitoring**: Watch for issues post-deployment
5. **Rollback Ready**: Keep rollback plan accessible

## Next Steps

1. Review this plan with the team
2. Schedule cleanup during low-traffic period
3. Assign responsibilities for each phase
4. Create tracking tickets for each task
5. Begin Phase 1 preparation