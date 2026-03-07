"""
redis_client.py — Redis connection for real-time pub/sub, rate limiting, and caching.
Connects to the Redis container from docker-compose.
Falls back gracefully if Redis is not running.
"""

import os
import json
import time
from typing import Any
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
_redis = None
_REDIS_AVAILABLE = False

try:
    import redis as redis_lib
    _redis = redis_lib.Redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
    _redis.ping()
    _REDIS_AVAILABLE = True
    print("✅ Redis connected")
except Exception:
    _REDIS_AVAILABLE = False
    print("⚠️  Redis unavailable — using in-memory fallback")


# ─── Pub/Sub: Publish agent events ───

def publish_event(channel: str, data: dict[str, Any]):
    """Publish an event to a Redis channel."""
    if not _REDIS_AVAILABLE:
        return
    try:
        _redis.publish(channel, json.dumps(data, default=str))
    except Exception:
        pass


def publish_agent_event(event_data: dict[str, Any]):
    """Publish to the global agent events channel."""
    publish_event("agent_events", event_data)
    # Also publish to shipment-specific channel
    shipment_id = event_data.get("shipment_id", "")
    if shipment_id:
        publish_event(f"shipment:{shipment_id}", event_data)


# ─── Rate Limiting ───

# In-memory fallback for rate limiting when Redis is unavailable
_memory_rate_limits: dict[str, list[float]] = {}


def check_rate_limit(key: str, max_requests: int = 100, window_seconds: int = 60) -> dict[str, Any]:
    """
    Check if a request is within rate limits.
    Returns: {"allowed": bool, "remaining": int, "reset_at": float}
    """
    if _REDIS_AVAILABLE:
        return _redis_rate_check(key, max_requests, window_seconds)
    else:
        return _memory_rate_check(key, max_requests, window_seconds)


def _redis_rate_check(key: str, max_req: int, window: int) -> dict[str, Any]:
    rate_key = f"rate:{key}"
    try:
        pipe = _redis.pipeline()
        pipe.incr(rate_key)
        pipe.ttl(rate_key)
        count, ttl = pipe.execute()

        if ttl == -1:  # No TTL set yet
            _redis.expire(rate_key, window)
            ttl = window

        allowed = count <= max_req
        return {
            "allowed": allowed,
            "remaining": max(0, max_req - count),
            "reset_at": time.time() + ttl,
            "limit": max_req,
        }
    except Exception:
        return {"allowed": True, "remaining": max_req, "reset_at": 0, "limit": max_req}


def _memory_rate_check(key: str, max_req: int, window: int) -> dict[str, Any]:
    now = time.time()
    if key not in _memory_rate_limits:
        _memory_rate_limits[key] = []

    # Clean old entries
    _memory_rate_limits[key] = [t for t in _memory_rate_limits[key] if t > now - window]
    _memory_rate_limits[key].append(now)

    count = len(_memory_rate_limits[key])
    allowed = count <= max_req
    return {
        "allowed": allowed,
        "remaining": max(0, max_req - count),
        "reset_at": now + window,
        "limit": max_req,
    }


# ─── Cache ───

def cache_set(key: str, value: Any, ttl_seconds: int = 60):
    """Cache a value with TTL."""
    if not _REDIS_AVAILABLE:
        return
    try:
        _redis.setex(f"cache:{key}", ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def cache_get(key: str) -> Any | None:
    """Get a cached value."""
    if not _REDIS_AVAILABLE:
        return None
    try:
        data = _redis.get(f"cache:{key}")
        return json.loads(data) if data else None
    except Exception:
        return None


# ─── Status ───

def get_redis_status() -> dict[str, Any]:
    """Returns Redis connection status."""
    return {
        "available": _REDIS_AVAILABLE,
        "url": REDIS_URL.replace(REDIS_URL.split("@")[-1].split("/")[0], "***") if "@" in REDIS_URL else REDIS_URL,
        "backend": "redis" if _REDIS_AVAILABLE else "in-memory",
    }
