#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting TechScanIQ Services...${NC}"

# Check if Redis is running
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running. Starting...${NC}"
    brew services start redis
fi

# Kill any existing processes
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "tsx.*workers.ts" || true
pkill -f "tsx.*server.ts" || true

# Start workers in background
echo -e "${YELLOW}Starting workers...${NC}"
npm run workers > logs/workers.log 2>&1 &
WORKERS_PID=$!
echo -e "${GREEN}✅ Workers started (PID: $WORKERS_PID)${NC}"

# Start API server in background
echo -e "${YELLOW}Starting API server...${NC}"
npm run dev:api > logs/api.log 2>&1 &
API_PID=$!
echo -e "${GREEN}✅ API server started (PID: $API_PID)${NC}"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check if API is responding
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${RED}❌ API is not responding${NC}"
fi

echo -e "${GREEN}All services started!${NC}"
echo -e "${YELLOW}Workers log: logs/workers.log${NC}"
echo -e "${YELLOW}API log: logs/api.log${NC}"
echo -e "${YELLOW}To stop: pkill -f tsx${NC}"