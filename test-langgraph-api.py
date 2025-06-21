#!/usr/bin/env python3
"""
Test script for LangGraph API endpoints
"""

import sys
sys.path.insert(0, '/Users/josephkarim/techscaniq-mvp/techscaniq-v2/backend')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio

# Import just the LangGraph routes (skip MCP for now)
from api.langgraph_routes import router as langgraph_router

# Create a minimal test app
app = FastAPI(
    title="TechScanIQ LangGraph API Test",
    description="Test server for LangGraph endpoints",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include LangGraph router
app.include_router(langgraph_router)

@app.get("/")
async def root():
    return {"message": "LangGraph API Test Server", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "langgraph-api-test"}

if __name__ == "__main__":
    print("🚀 Starting LangGraph API test server...")
    print("📡 Available endpoints:")
    print("  - GET  /api/langgraph/")
    print("  - GET  /api/langgraph/{report_id}")
    print("  - GET  /api/langgraph/{report_id}/status")
    print("  - GET  /api/langgraph/health")
    print("")
    print("🔗 Test URLs:")
    print("  - http://localhost:8000/api/langgraph/")
    print("  - http://localhost:8000/api/langgraph/cibc-latest-2025-06-21")
    print("  - http://localhost:8000/api/langgraph/health")
    print("")
    
    uvicorn.run(
        "test-langgraph-api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )