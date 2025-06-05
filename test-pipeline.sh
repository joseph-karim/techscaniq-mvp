#!/bin/bash

# Check if JWT token is set
if [ -z "$JWT_TOKEN" ]; then
  echo "Error: Please set JWT_TOKEN environment variable"
  echo "Generate token with: node generate-jwt.js"
  exit 1
fi

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
      "website": "https://testpe.com",
      "thesis": "We invest in B2B SaaS companies with strong technical moats and scalable architectures",
      "thesisTags": ["scalable-architecture", "api-first", "enterprise-ready", "security-focused"],
      "primaryCriteria": "Must have microservices architecture that can scale to 10x current load without major refactoring",
      "secondaryCriteria": "Prefer companies using modern DevOps practices with CI/CD and infrastructure as code",
      "companyDescription": "Ring4 is a communication platform that provides virtual phone numbers and VoIP services for businesses"
    }
  }' \
  http://localhost:54321/functions/v1/report-orchestrator-v3 