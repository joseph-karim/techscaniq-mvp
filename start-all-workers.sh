#!/bin/bash

echo "Starting all workers..."

# Check if Redis is running (Docker or local)
if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
    echo "✓ Redis is running"
elif docker ps | grep -q redis; then
    echo "✓ Redis is running in Docker"
else
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   docker-compose up -d redis"
    echo "   or: brew services start redis"
    exit 1
fi

# Kill any existing worker processes
echo "Stopping any existing workers..."
pkill -f "evidence-collection-worker"
pkill -f "report-generation-worker"
sleep 2

# Start evidence collection workers
echo ""
echo "Starting evidence collection workers..."

# Deep research worker (primary)
echo "  - Starting deep-research worker..."
npx tsx src/workers/evidence-collection-worker-deep-research.ts > logs/evidence-deep-research.log 2>&1 &
echo "    PID: $!"

# Iterative research worker
echo "  - Starting iterative research worker..."
npx tsx src/workers/research-worker-iterative.ts > logs/research-iterative.log 2>&1 &
echo "    PID: $!"

# Technical analysis workers
echo ""
echo "Starting technical analysis workers..."

echo "  - Starting playwright crawler worker..."
npx tsx src/workers/technical-analysis/playwright-crawler-worker.ts > logs/playwright-crawler.log 2>&1 &
echo "    PID: $!"

echo "  - Starting webtech analyzer worker..."
npx tsx src/workers/technical-analysis/webtech-analyzer-worker.ts > logs/webtech-analyzer.log 2>&1 &
echo "    PID: $!"

echo "  - Starting security scanner worker..."
npx tsx src/workers/technical-analysis/security-scanner-worker.ts > logs/security-scanner.log 2>&1 &
echo "    PID: $!"

echo "  - Starting Skyvern enhanced discovery worker..."
npx tsx src/workers/technical-analysis/skyvern-enhanced-worker.ts > logs/skyvern-discovery.log 2>&1 &
echo "    PID: $!"

# Start report generation workers
echo ""
echo "Starting report generation workers..."

# LangGraph v2 worker
echo "  - Starting langgraph-v2 worker..."
npx tsx src/workers/report-generation-worker-langgraph-v2.ts > logs/report-langgraph-v2.log 2>&1 &
echo "    PID: $!"

# LangGraph v3 thesis worker
echo "  - Starting langgraph-v3-thesis worker..."
npx tsx src/workers/report-generation-worker-langgraph-v3-thesis.ts > logs/report-langgraph-v3.log 2>&1 &
echo "    PID: $!"

# Orchestrated worker
echo "  - Starting orchestrated worker..."
npx tsx src/workers/report-generation-worker-langgraph-orchestrated.ts > logs/report-orchestrated.log 2>&1 &
echo "    PID: $!"

echo ""
echo "✓ All workers started!"
echo ""
echo "Monitor logs:"
echo "  tail -f logs/evidence-deep-research.log"
echo "  tail -f logs/report-langgraph-v3.log"
echo ""
echo "Check worker status:"
echo "  ps aux | grep -E 'worker|research' | grep -v grep"