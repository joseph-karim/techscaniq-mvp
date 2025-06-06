#!/bin/bash

echo "🚀 Setting up Deep Evidence Collection dependencies..."

# Install required Node packages
echo "📦 Installing Node.js dependencies..."
npm install --save crawl4ai openai

# Check if Docker is installed for testssl
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. Please install Docker for SSL analysis features."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
else
    echo "✅ Docker found"
    # Pull testssl image
    echo "🐳 Pulling testssl Docker image..."
    docker pull drwetter/testssl.sh
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis not running. Starting Redis..."
    if command -v docker &> /dev/null; then
        echo "🐳 Starting Redis with Docker..."
        docker run -d -p 6379:6379 --name techscaniq-redis redis:7-alpine
    else
        echo "❌ Redis not found. Please install Redis or use Docker."
        echo "   brew install redis"
        echo "   brew services start redis"
    fi
else
    echo "✅ Redis is running"
fi

# Check for required environment variables
echo ""
echo "🔧 Checking environment variables..."

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env with:"
    echo "  VITE_SUPABASE_URL=your-supabase-url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "  OPENAI_API_KEY=your-openai-key"
    echo "  GOOGLE_API_KEY=your-google-api-key (optional)"
    echo "  GOOGLE_CSE_ID=your-google-cse-id (optional)"
    exit 1
fi

# Check required env vars
required_vars=("VITE_SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "OPENAI_API_KEY")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env; then
        missing_vars+=($var)
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "Please add them to your .env file"
    exit 1
else
    echo "✅ All required environment variables found"
fi

# Optional tools
echo ""
echo "📌 Optional tools for enhanced analysis:"
echo "  - Lighthouse: npm install -g lighthouse"
echo "  - Nuclei: https://github.com/projectdiscovery/nuclei"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 To run the Mixpanel test:"
echo "  1. Start the deep evidence worker: npm run worker:evidence:deep"
echo "  2. In another terminal: npm run test:mixpanel"
echo ""
echo "Or run everything together:"
echo "  npm run dev:api:deep"
echo "  Then in another terminal: npm run test:mixpanel"