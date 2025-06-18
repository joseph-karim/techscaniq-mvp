#!/bin/bash
cd /Users/josephkarim/techscaniq-mvp/techscaniq-v2
export ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
export ENABLE_CRAWL4AI=true
export ENABLE_OPERATOR=false
export ENABLE_SKYVERN=false
echo "Starting orchestration worker with enhanced tools..."
npx tsx src/services/queue/workers/orchestrationWorker.ts