#!/bin/bash

echo "🧪 Running TechScanIQ Tool Tests"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo -e "${YELLOW}🔧 Testing: $test_name${NC}"
    echo "----------------------------------------"
    
    if npx tsx "$test_file"; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
    else
        echo -e "${RED}❌ $test_name: FAILED${NC}"
    fi
    
    echo ""
    echo ""
}

# Change to the correct directory
cd /Users/josephkarim/techscaniq-mvp/techscaniq-v2

# Check Python dependencies first
echo -e "${YELLOW}📦 Checking Python dependencies...${NC}"
if command -v python3 &> /dev/null; then
    echo "✅ Python3 found"
    
    # Check for crawl4ai
    if python3 -c "import crawl4ai" 2>/dev/null; then
        echo "✅ crawl4ai installed"
    else
        echo -e "${RED}❌ crawl4ai not installed${NC}"
        echo "Installing Python dependencies..."
        pip3 install -r /Users/josephkarim/techscaniq-mvp/src/workers/requirements.txt
    fi
else
    echo -e "${RED}❌ Python3 not found${NC}"
fi

echo ""
echo "🚀 Starting tool tests..."
echo ""

# Run individual tests with shorter timeouts
export TEST_TIMEOUT=30000

# Test 1: WebTech Detector (Fast, reliable)
run_test "WebTech Detector" "test-tools/test-webtech-detector.ts"

# Test 2: API Discovery (Fast, reliable)
run_test "API Discovery" "test-tools/test-api-discovery.ts"

# Test 3: Technical Collector (Medium speed, may have SSL issues)
run_test "Technical Collector" "test-tools/test-technical-collector.ts"

# Test 4: Operator Analyzer (Slow, browser automation)
run_test "Operator Analyzer" "test-tools/test-operator-analyzer.ts"

# Test 5: Crawl4AI (Depends on Python setup)
run_test "Crawl4AI Integration" "test-tools/test-crawl4ai.ts"

echo "================================"
echo "🏁 All tests completed!"
echo ""
echo "💡 Next steps:"
echo "1. Fix any failing tests before integration"
echo "2. Consider timeout settings for production"
echo "3. Ensure all API keys are configured"
echo "4. Monitor resource usage during concurrent execution"