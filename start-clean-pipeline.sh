#!/bin/bash

echo "Starting clean pipeline..."

# Kill existing workers
pkill -f "evidence-collection-worker" || true
pkill -f "research-worker" || true
pkill -f "report-generation" || true

sleep 2

# Start the orchestrator
echo "Starting evidence orchestrator..."
npx tsx src/workers/evidence-orchestrator.ts > logs/orchestrator.log 2>&1 &

# Start flexible report generator
echo "Starting flexible report generator..."
npx tsx src/workers/report-generator-flexible.ts > logs/report-flexible.log 2>&1 &

# Keep existing technical workers running
echo "Technical workers should already be running:"
ps aux | grep -E "playwright|webtech|security|skyvern" | grep -v grep | wc -l

echo "Clean pipeline started!"
echo ""
echo "Monitor logs:"
echo "  tail -f logs/orchestrator.log"
echo "  tail -f logs/report-flexible.log"