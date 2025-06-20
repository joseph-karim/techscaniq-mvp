#!/bin/bash

# Start TechScanIQ with Backend MCP Integration
# This script starts all necessary services for the full MCP-enhanced system

echo "🚀 Starting TechScanIQ with Backend MCP Integration"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis is not running. Please start Redis first.${NC}"
    echo "   On macOS: brew services start redis"
    echo "   On Linux: sudo systemctl start redis"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill all child processes
    pkill -P $$
    
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM EXIT

# Start Backend API
echo "1️⃣  Starting Backend API Server..."
cd techscaniq-v2/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}   ✅ Backend API is running${NC}"
else
    echo -e "${RED}   ❌ Backend API failed to start${NC}"
    exit 1
fi

# Start API Server
echo ""
echo "2️⃣  Starting TechScanIQ API Server..."
npm run api:server &
API_PID=$!

# Wait for API to start
sleep 3

# Start Evidence Collection Worker
echo ""
echo "3️⃣  Starting Evidence Collection Worker..."
npm run worker:evidence &
EVIDENCE_PID=$!

# Start Report Generation Worker with Backend Integration
echo ""
echo "4️⃣  Starting Report Generation Worker (Backend-Enhanced)..."
npm run worker:report:langgraph:backend &
REPORT_PID=$!

# Start Frontend (optional)
echo ""
echo "5️⃣  Starting Frontend Development Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo "📍 Service URLs:"
echo "   - Frontend: http://localhost:3000"
echo "   - API Server: http://localhost:3001"
echo "   - Backend API: http://localhost:8000"
echo "   - Backend API Docs: http://localhost:8000/docs"
echo ""
echo "📊 Health Check URLs:"
echo "   - Backend Health: http://localhost:8000/health"
echo "   - MCP Health: http://localhost:8000/api/code-analysis/health"
echo ""
echo "🛠️  To test the integration:"
echo "   npm run test:backend:mcp"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================================="

# Wait for all processes
wait