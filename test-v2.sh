#!/bin/bash

# Test the new v2 pipeline with concurrent evidence collection
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJzdWIiOiJhZG1pbl9pZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpc3MiOiJzdXBhYmFzZS1kZW1vIiwiaWF0IjoxNzQ4MzkwMzY0LCJleHAiOjE3NDgzOTM5NjR9.LFvd7ibWgu2_P73Ewe-t2zCMLPgVLwbUhZ_RlbwxabA"

echo "Testing new v2 pipeline with concurrent evidence collection..."
echo ""

curl -i -H "Authorization: Bearer $JWT" \
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