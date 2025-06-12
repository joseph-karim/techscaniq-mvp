#!/bin/bash
# Start script for LangGraph v3 workers with thesis alignment

echo "=== Starting LangGraph v3 Workers with Thesis Alignment ==="

# Kill any existing workers
echo "Stopping existing workers..."
pkill -f "report-generation-worker-langgraph" || true
pkill -f "report-generation-worker-thesis-aligned" || true
pkill -f "evidence-collection-worker" || true

# Wait a moment for processes to clean up
sleep 2

# Start evidence collection worker
echo "Starting evidence collection worker..."
NODE_ENV=development npx tsx src/workers/evidence-collection-worker-deep-research.ts &

# Start the enhanced LangGraph v3 worker (handles both standard and thesis-aligned)
echo "Starting LangGraph v3 report generation worker..."
NODE_ENV=development npx tsx src/workers/report-generation-worker-langgraph-v3-thesis.ts &

echo ""
echo "✅ LangGraph v3 workers started successfully!"
echo ""
echo "Workers running:"
echo "- Evidence collection worker (deep research)"
echo "- LangGraph v3 report generation (with thesis alignment)"
echo ""
echo "This worker automatically handles:"
echo "- Standard reports with full citation generation"
echo "- Thesis-aligned PE reports with weighted scoring"
echo "- Risk registers and value creation roadmaps"
echo ""
echo "To view logs, use: tail -f logs/worker-*.log"
echo "To stop workers, use: pkill -f 'langgraph|evidence-collection'"