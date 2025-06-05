#!/bin/bash

# Test the new v2 pipeline with concurrent evidence collection
if [ -z "$JWT_TOKEN" ]; then
  echo "Error: Please set JWT_TOKEN environment variable"
  echo "Generate token with: node generate-jwt.js"
  exit 1
fi

echo "Testing new v2 pipeline with concurrent evidence collection..."
echo ""

curl -i -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "Ring4",
      "website": "https://ring4.com"
    },
    "analysisDepth": "deep",
    "investorProfile": {
      "firmName": "Test PE Firm",
      "website": "https://testpe.com"
    }
  }' \
  http://localhost:54321/functions/v1/report-orchestrator-v3 