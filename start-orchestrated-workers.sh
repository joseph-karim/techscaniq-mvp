#!/bin/bash
# Start script for Claude-Orchestrated LangGraph workers

echo "=== Starting Claude-Orchestrated Report Generation System ==="

# Kill any existing workers
echo "Stopping existing workers..."
pkill -f "report-generation-worker" || true
pkill -f "evidence-collection-worker" || true
pkill -f "playwright-crawler" || true
pkill -f "security-scanner" || true
pkill -f "deep_research_crawler" || true

# Wait a moment for processes to clean up
sleep 2

# Start evidence collection workers
echo "Starting evidence collection worker (deep research)..."
NODE_ENV=development npx tsx src/workers/evidence-collection-worker-deep-research.ts &

# Start technical analysis workers
echo "Starting technical analysis workers..."
NODE_ENV=development npx tsx src/workers/technical-analysis/playwright-crawler-worker.ts &
NODE_ENV=development npx tsx src/workers/technical-analysis/security-scanner-worker.ts &

# Start the orchestrated report generation worker
echo "Starting Claude-Orchestrated report generation worker..."
NODE_ENV=development npx tsx src/workers/report-generation-worker-langgraph-orchestrated.ts &

echo ""
echo "✅ Claude-Orchestrated system started successfully!"
echo ""
echo "Workers running:"
echo "- Evidence collection worker (deep research with Chain of RAG)"
echo "- Playwright crawler (technical analysis)"
echo "- Security scanner (infrastructure assessment)"
echo "- Claude-Orchestrated report generator (intelligent research loop)"
echo ""
echo "This system implements:"
echo "- Claude orchestrates the entire research process"
echo "- Iterative evidence gathering based on gaps"
echo "- Dynamic tool selection and configuration"
echo "- Citations generated from actual evidence usage"
echo "- PE-grade thesis-aligned reports"
echo ""
echo "To test: node test-orchestrated-pipeline.js"
echo "To stop: pkill -f 'orchestrated|crawler|scanner|evidence-collection'"