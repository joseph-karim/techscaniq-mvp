"""Authentication utilities for the backend API"""

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import secrets
import logging

logger = logging.getLogger(__name__)

# API Security
security = HTTPBearer()

# API Key validation
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", secrets.token_urlsafe(32))
if os.getenv("ENVIRONMENT") == "production" and not os.getenv("BACKEND_API_KEY"):
    logger.warning("No BACKEND_API_KEY set in production! Using generated key: " + BACKEND_API_KEY)

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key for protected endpoints"""
    if credentials.credentials != BACKEND_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials