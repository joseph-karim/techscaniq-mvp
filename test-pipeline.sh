#!/bin/bash

curl -i -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJzdWIiOiJhZG1pbl9pZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpc3MiOiJzdXBhYmFzZS1kZW1vIiwiaWF0IjoxNzQ4MzY2ODgwLCJleHAiOjE3NDgzNzA0ODB9.MSN5WucW19IBw7XJlcPjQKpZem5yewmm27emwtgp2BA" \
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