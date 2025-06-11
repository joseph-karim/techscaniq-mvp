#!/bin/bash

# Kill existing workers
echo "Stopping existing workers..."
pkill -f "report-generation-worker"
pkill -f "evidence-collection-worker"

# Wait a moment
sleep 2

# Start evidence collection worker (using the deep research version)
echo "Starting deep research evidence collection worker..."
npm run worker:evidence:deep &

# Start LangGraph report generation worker
echo "Starting LangGraph report generation worker v2..."
tsx src/workers/report-generation-worker-langgraph-v2.ts &

echo "LangGraph workers started!"
echo "Evidence collection worker PID: $(pgrep -f evidence-collection-worker)"
echo "Report generation worker PID: $(pgrep -f report-generation-worker-langgraph)"

# Keep script running
echo "Press Ctrl+C to stop workers..."
wait