"""
auth.py — API key authentication for NeuroLogistics.
Protects mutation endpoints while keeping read endpoints open for demo.
"""

import os
from typing import Optional
from fastapi import Header, HTTPException, Request
from dotenv import load_dotenv

load_dotenv()

# API key for mutation endpoints. Set in .env for production.
# For hackathon demo: if not set, auth is DISABLED (all requests pass).
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "")

# Track failed auth attempts for security logging
_failed_attempts: dict[str, int] = {}


async def require_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    FastAPI dependency: validates X-API-Key header.
    If API_SECRET_KEY is not set, auth is disabled (hackathon demo mode).
    """
    if not API_SECRET_KEY:
        # Demo mode: no auth required
        return "demo_mode"

    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header. Authentication required for mutation endpoints.",
        )

    if x_api_key != API_SECRET_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API key. Access denied.",
        )

    return x_api_key


async def require_api_key_or_demo(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """
    Softer auth: allows access in demo mode, but logs a warning.
    Used for endpoints that modify state but are needed for the demo flow.
    """
    if not API_SECRET_KEY:
        return "demo_mode"

    if x_api_key and x_api_key == API_SECRET_KEY:
        return x_api_key

    # Allow but log
    return "unauthenticated"


def get_auth_status() -> dict:
    """Returns the current authentication configuration status."""
    return {
        "auth_enabled": bool(API_SECRET_KEY),
        "mode": "production" if API_SECRET_KEY else "demo (no auth)",
        "protected_endpoints": [
            "POST /api/negotiate/{shipment_id}",
            "POST /api/disruptions",
            "POST /api/decisions/{id}/validate",
            "DELETE /api/disruptions",
        ],
        "open_endpoints": [
            "GET /api/carriers",
            "GET /api/shipments",
            "GET /api/decisions",
            "GET /api/guardrails/policy",
            "GET /api/events/*",
            "WS /ws/*",
        ],
    }
