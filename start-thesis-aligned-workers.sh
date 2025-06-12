#!/bin/bash
# Start script for thesis-aligned report generation workers

echo "=== Starting Thesis-Aligned Report Generation Workers ==="

# Kill any existing workers
echo "Stopping existing workers..."
pkill -f "report-generation-worker-thesis-aligned" || true

# Wait a moment for processes to clean up
sleep 2

# Start the new thesis-aligned report generation worker
echo "Starting thesis-aligned report generation worker..."
NODE_ENV=development npx tsx src/workers/report-generation-worker-thesis-aligned.ts &

echo ""
echo "✅ Thesis-aligned workers started successfully!"
echo ""
echo "Workers running:"
echo "- Thesis-aligned report generation worker"
echo ""
echo "To view logs, use: tail -f logs/worker-*.log"
echo "To stop workers, use: pkill -f 'report-generation-worker-thesis-aligned'"