#!/bin/bash

# Kill existing workers
echo "Stopping existing workers..."
pkill -f "report-generation-worker"
pkill -f "evidence-collection-worker"

# Wait a moment
sleep 2

# Start evidence collection worker (using the crawl4ai version for comprehensive collection)
echo "Starting evidence collection worker (crawl4ai)..."
npm run worker:evidence:crawl4ai &

# Start Claude-orchestrated report generation worker
echo "Starting Claude-orchestrated report generation worker..."
tsx src/workers/report-generation-worker-claude-orchestrated.ts &

echo "Workers started!"
echo "Evidence collection worker PID: $(pgrep -f evidence-collection-worker-crawl4ai)"
echo "Report generation worker PID: $(pgrep -f report-generation-worker-claude)"

# Keep script running
echo "Press Ctrl+C to stop workers..."
wait