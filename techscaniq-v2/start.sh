#!/bin/bash

echo "🚀 Starting TechScanIQ 2.0 Pipeline"
echo "=================================="

# Check Redis
echo "Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   brew services start redis (on macOS)"
    echo "   or: redis-server"
    exit 1
fi
echo "✅ Redis is running"

# Check environment variables
echo -e "\nChecking environment..."
if [ ! -f "../.env.local" ]; then
    echo "❌ .env.local file not found in parent directory"
    exit 1
fi
echo "✅ Environment file found"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\nInstalling dependencies..."
    npm install
fi

# Start the API server
echo -e "\n🚀 Starting API server..."
npm run dev:api