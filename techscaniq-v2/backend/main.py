"""
TechScanIQ Backend API Server

Provides code analysis capabilities using Serena MCP tools.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Dict, Any
import asyncio

from .api import code_analysis
from .services.mcp_client_service import mcp_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting TechScanIQ Backend API")
    
    try:
        # Initialize MCP client
        await mcp_client.connect()
        logger.info("MCP client connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect MCP client: {e}")
        # Continue running in degraded mode
    
    yield
    
    # Shutdown
    logger.info("Shutting down TechScanIQ Backend API")
    try:
        await mcp_client.disconnect()
    except Exception as e:
        logger.error(f"Error disconnecting MCP client: {e}")


# Create FastAPI app
app = FastAPI(
    title="TechScanIQ Backend API",
    description="Code analysis backend using Serena MCP tools",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiting configuration
request_counts = defaultdict(list)
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60  # seconds

# Configure CORS - restrict in production
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
]

# Add production frontend URL if set
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Trust only specific hosts in production
if os.getenv("ENVIRONMENT") == "production":
    allowed_hosts = ["localhost"]
    if os.getenv("ALLOWED_HOSTS"):
        allowed_hosts.extend(os.getenv("ALLOWED_HOSTS").split(","))
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts
    )


# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks
    if request.url.path in ["/", "/health", "/metrics"]:
        return await call_next(request)
    
    client_ip = request.client.host
    now = time.time()
    
    # Clean old requests
    request_counts[client_ip] = [
        req_time for req_time in request_counts[client_ip] 
        if now - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check rate limit
    if len(request_counts[client_ip]) >= RATE_LIMIT_REQUESTS:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Add current request
    request_counts[client_ip].append(now)
    
    response = await call_next(request)
    return response

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__
        }
    )


# Include routers
app.include_router(code_analysis.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "TechScanIQ Backend API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "code_analysis": "/api/code-analysis",
            "health": "/api/code-analysis/health"
        }
    }


# Health check
@app.get("/health")
async def health():
    """Overall health check"""
    health_checks = {}
    
    # Check MCP connection
    health_checks["mcp"] = {
        "connected": mcp_client.connected,
        "tools_available": len(mcp_client.available_tools) if mcp_client.connected else 0
    }
    
    # Overall status
    all_healthy = all(
        check.get("connected", False) if isinstance(check, dict) else check
        for check in health_checks.values()
    )
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": health_checks
    }


# Metrics endpoint
@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint"""
    return {
        "mcp_connected": mcp_client.connected,
        "available_tools": mcp_client.get_available_tools() if mcp_client.connected else [],
        "tool_count": len(mcp_client.available_tools) if mcp_client.connected else 0
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("BACKEND_PORT", "8000"))
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENV", "development") == "development",
        log_level="info"
    )