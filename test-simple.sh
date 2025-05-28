#!/bin/bash

# Simple test to validate JINA API and pipeline
curl -i -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJzdWIiOiJhZG1pbl9pZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpc3MiOiJzdXBhYmFzZS1kZW1vIiwiaWF0IjoxNzQ4MzczMzM5LCJleHAiOjE3NDgzNzY5Mzl9.vwIAPsL4i5B-7dlzHg24zje0R_SGHiFI4MZUs2Uotqw" \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "Ring4",
      "website": "https://ring4.com"
    },
    "analysisDepth": "shallow",
    "investorProfile": {
      "firmName": "Test PE Firm",
      "website": "https://testpe.com"
    }
  }' \
  http://localhost:54321/functions/v1/report-orchestrator-v3 