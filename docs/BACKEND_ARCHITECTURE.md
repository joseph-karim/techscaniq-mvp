# Backend Architecture (Post-Integration)

## Overview

The TechScanIQ backend has been refactored to implement comprehensive security measures and clean architecture principles. This document outlines the current state after DEV-004 implementation.

## Security Stack

### Python FastAPI Backend
- **Rate Limiting**: 10 requests per minute per IP address
- **CORS**: Restricted to approved origins (localhost:3000, localhost:5173, localhost:5174)
- **Trusted Hosts**: Production-only middleware restricting to approved domains
- **Security Headers**: 
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security: max-age=31536000; includeSubDomains
  - Referrer-Policy: strict-origin-when-cross-origin
- **HTTPS**: Enforced in production via HTTPSRedirectMiddleware
- **API Authentication**: Bearer token authentication for protected endpoints

### Input Validation
- **URL Validation**: 
  - Must be HTTP/HTTPS
  - Private IPs blocked in production (localhost, 127.*, 192.168.*, 10.*, 172.16-31.*)
  - Max length: 500 characters
- **Code Input Validation**:
  - Max 100 files per analysis
  - Max 1MB per file
  - Max 10MB total
  - Path traversal protection
  - Filename validation

### Frontend Validation
- **Input Validation**: URL validation with private IP blocking
- **Environment Validation**: Required environment variables checked at startup
- **Input Sanitization**: XSS protection through character stripping

## Active Workers

### Evidence Collection
- **Primary**: `evidence-collection-worker-crawl4ai.ts`
- **Fallback**: `evidence-collection-worker-deep-simple.ts`

### Report Generation
- **Current**: `report-generation-worker-langgraph-v4-backend.ts`
- **Backend**: Python FastAPI with MCP integration

## API Endpoints

### Core Endpoints
- `GET /` - Root endpoint with API information
- `GET /health` - Overall health check including MCP status
- `GET /metrics` - Basic metrics about MCP connection and tools

### Code Analysis API
- `POST /api/code-analysis/analyze` - Main analysis endpoint (protected)
  - Requires Bearer token authentication
  - Validates input according to security rules
  - Returns comprehensive code analysis results
- `GET /api/code-analysis/health` - Service-specific health check

## Removed Legacy Components

### Removed Workers
- ❌ All v2/v3 report generation workers
- ❌ Legacy evidence collection workers (v2, agentic, comprehensive, flexible, etc.)
- ❌ Evidence orchestrator files
- ❌ Research worker files
- ❌ Python crawler implementations
- ❌ Virtual environment directory

### Cleaned Scripts
- ❌ Legacy package.json scripts removed
- ✅ Modern scripts properly configured

## Environment Configuration

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

### Optional Variables
- `BACKEND_URL` - Backend API URL
- `BACKEND_API_KEY` - API authentication key (auto-generated if not set)
- `ENVIRONMENT` - Environment setting (development/production)
- `FRONTEND_URL` - Production frontend URL for CORS
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts

## Security Implementation Details

### Rate Limiting
```python
# 10 requests per 60-second window per IP
# Excludes health check endpoints
# Tracks requests in memory (consider Redis for production scaling)
```

### API Authentication
```python
# Bearer token authentication
# Token stored in BACKEND_API_KEY environment variable
# Auto-generates secure token if not provided
# Warning logged in production if using generated key
```

### Input Validation (Pydantic)
```python
# URL validation with regex and max length
# Code dictionary validation with size limits
# File count and size restrictions
# Path traversal protection
```

## Testing

### Integration Tests
- Security validation tests (`src/tests/integration/security-integration.test.ts`)
- URL validation including private IP blocking
- Environment variable validation
- Input sanitization tests

### Worker Tests
- Evidence collection worker startup validation
- Report generation worker startup validation
- Backend startup validation
- Combined stack integration testing

## Future Improvements

1. **Scaling Considerations**:
   - Move rate limiting to Redis for distributed deployments
   - Implement request queuing for heavy loads
   - Add horizontal scaling support

2. **Security Enhancements**:
   - Add request signing for frontend-backend communication
   - Implement refresh token mechanism
   - Add audit logging for security events

3. **Monitoring**:
   - Add APM integration (e.g., DataDog, New Relic)
   - Implement structured logging
   - Add performance metrics collection

## Deployment Notes

1. Ensure all required environment variables are set
2. Generate and securely store `BACKEND_API_KEY` for production
3. Configure `ALLOWED_HOSTS` for production domains
4. Enable HTTPS at the load balancer/reverse proxy level
5. Consider implementing a WAF for additional protection