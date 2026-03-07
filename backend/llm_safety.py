"""
llm_safety.py — Output validation for Gemini LLM responses.
Ensures AI agent responses are safe, relevant, and appropriately constrained.

This is critical for responsible AI compliance:
- Prevents hallucinated or toxic content from entering the system
- Enforces length limits on all LLM outputs
- Validates logistics relevance
- Logs all rejections for audit
"""

import re
from datetime import datetime, timezone
from typing import Any


# ─── Configuration ───
MAX_RESPONSE_LENGTH = 250  # characters
MIN_RESPONSE_LENGTH = 10

# Blocked patterns (PII, toxic, off-topic)
BLOCKED_PATTERNS = [
    r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",       # Phone numbers
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",  # Email addresses
    r"\b\d{3}-\d{2}-\d{4}\b",                # SSN pattern
    r"\b(kill|die|attack|weapon|bomb|hack)\b",  # Violence/harm
    r"\b(credit card|bank account|password)\b",  # Financial PII
]

# Logistics-relevant terms (response must contain at least one)
LOGISTICS_TERMS = [
    "carrier", "shipment", "delivery", "delay", "route", "truck",
    "warehouse", "logistics", "transport", "freight", "bid", "cost",
    "eta", "sla", "supply", "chain", "congestion", "traffic",
    "weather", "disruption", "reroute", "reliability", "reputation",
    "hub", "inventory", "capacity", "risk", "penalty", "score",
    "negotiate", "auction", "fleet", "dispatch", "predict",
    "selected", "chosen", "recommend", "escalat", "autonomous",
]

# Audit log of all validations
_validation_log: list[dict[str, Any]] = []


def validate(response: str, context: str = "general") -> dict[str, Any]:
    """
    Validate an LLM response for safety, relevance, and constraints.
    
    Returns:
        {
            "safe": bool,
            "sanitized_response": str,   # cleaned version if safe
            "rejection_reason": str | None,
            "warnings": list[str],
        }
    """
    warnings: list[str] = []
    
    # 1. Empty/missing check
    if not response or len(response.strip()) < MIN_RESPONSE_LENGTH:
        return _reject(response, "Response too short or empty", context)

    # 2. Length check
    if len(response) > MAX_RESPONSE_LENGTH:
        # Truncate rather than reject
        response = response[:MAX_RESPONSE_LENGTH].rsplit(" ", 1)[0] + "..."
        warnings.append(f"Truncated from {len(response)} to {MAX_RESPONSE_LENGTH} chars")

    # 3. Blocked pattern check (PII, toxic content)
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, response, re.IGNORECASE):
            return _reject(response, f"Blocked pattern detected: {pattern[:30]}...", context)

    # 4. Logistics relevance check
    response_lower = response.lower()
    relevant_terms_found = [t for t in LOGISTICS_TERMS if t in response_lower]
    if not relevant_terms_found:
        warnings.append("Low logistics relevance — no domain terms found")
        # Don't reject, but flag it

    # 5. Hallucination markers (obvious made-up data)
    if re.search(r"\$\d{6,}", response):  # Prices > $100,000
        warnings.append("Unusually high dollar figure detected")
    if re.search(r"\b\d{4,}\s*hours?\b", response):  # 1000+ hours
        warnings.append("Unusually high hour figure detected")

    result = {
        "safe": True,
        "sanitized_response": response.strip(),
        "rejection_reason": None,
        "warnings": warnings,
        "relevance_score": len(relevant_terms_found) / 5,  # 0-1+
    }

    _log_validation(response, result, context)
    return result


def validate_and_return(response: str, fallback: str, context: str = "general") -> str:
    """
    Convenience: validate response and return either it or the fallback.
    This is the primary function called by llm_reasoning.py.
    """
    result = validate(response, context)
    if result["safe"]:
        return result["sanitized_response"]
    else:
        _log_validation(response, result, context)
        return fallback


def get_validation_stats() -> dict[str, Any]:
    """Returns audit statistics for the dashboard."""
    total = len(_validation_log)
    safe = sum(1 for v in _validation_log if v.get("safe", False))
    rejected = total - safe
    rejection_reasons = {}
    for v in _validation_log:
        reason = v.get("rejection_reason", "")
        if reason:
            rejection_reasons[reason] = rejection_reasons.get(reason, 0) + 1

    return {
        "total_validations": total,
        "safe_responses": safe,
        "rejected_responses": rejected,
        "rejection_rate_pct": round((rejected / max(1, total)) * 100, 1),
        "rejection_reasons": rejection_reasons,
        "recent_warnings": [
            v for v in _validation_log[-10:]
            if v.get("warnings")
        ],
    }


def _reject(response: str, reason: str, context: str) -> dict[str, Any]:
    result = {
        "safe": False,
        "sanitized_response": "",
        "rejection_reason": reason,
        "warnings": [],
        "relevance_score": 0,
    }
    _log_validation(response, result, context)
    return result


def _log_validation(response: str, result: dict, context: str):
    _validation_log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "context": context,
        "response_preview": response[:80] + "..." if len(response) > 80 else response,
        "safe": result.get("safe", False),
        "rejection_reason": result.get("rejection_reason"),
        "warnings": result.get("warnings", []),
    })
    # Keep log bounded
    if len(_validation_log) > 1000:
        _validation_log[:] = _validation_log[-500:]
