#!/bin/bash

# Load environment variables from .env file
export $(cat .env | grep -v '^#' | xargs)

# Start the API server
echo "🚀 Starting API server with environment variables..."
npm run api:server