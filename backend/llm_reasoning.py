"""
llm_reasoning.py — Gemini 2.0 Flash powered reasoning for agent narratives.
Provides contextual disruption analysis, bid explanations, and learning insights.
Domain-tuned with logistics expertise via domain_tuning.py.
"""

import os
from typing import Any
from llm_safety import validate_and_return

from domain_tuning import (
    get_domain_system_prompt,
    get_carrier_sla_context,
    get_penalty_context,
)

# Try to use Gemini; fall back to mock if unavailable
try:
    from langchain_google_genai import ChatGoogleGenerativeAI

    _llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY", ""),
        temperature=0.3,
        max_output_tokens=200,
    )
    _LLM_AVAILABLE = bool(os.getenv("GOOGLE_API_KEY"))
except Exception:
    _LLM_AVAILABLE = False
    _llm = None

# Pre-load domain system prompt
_DOMAIN_PROMPT = get_domain_system_prompt()


def _ask_llm(prompt: str) -> str:
    """Send a domain-tuned prompt to Gemini and return the text response."""
    if not _LLM_AVAILABLE or _llm is None:
        return ""
    try:
        full_prompt = f"{_DOMAIN_PROMPT}\n\n{prompt}"
        response = _llm.invoke(full_prompt)
        return response.content.strip() if hasattr(response, "content") else str(response).strip()
    except Exception as e:
        return f"(LLM unavailable: {e})"


def reason_about_disruption(
    route_data: dict[str, Any],
    prediction: dict[str, Any],
    carrier_info: dict[str, Any],
) -> str:
    """Generate a contextual disruption analysis using Gemini with domain grounding."""
    carrier_context = get_carrier_sla_context(
        carrier_info.get("reliability", 0.5),
        carrier_info.get("name", "Unknown Carrier"),
    )
    penalty_context = get_penalty_context(
        prediction.get("predicted_delay_hours", 0),
        500.0,  # default budget for context
        2,  # default priority
    )
    prompt = (
        "You are an AI logistics analyst. In ONE concise sentence (max 40 words), "
        "analyze this supply chain disruption and suggest urgency level.\n\n"
        f"Disruption: {route_data.get('disruption_type', 'unknown')}\n"
        f"Weather severity: {route_data.get('weather_severity', 'N/A')}/1.0\n"
        f"Traffic index: {route_data.get('traffic_index', 'N/A')}/1.0\n"
        f"Predicted delay: {prediction.get('predicted_delay_hours', '?')} hours\n"
        f"Risk level: {prediction.get('risk_level', '?')}\n"
        f"{carrier_context}\n"
        f"{penalty_context}\n"
        "Response:"
    )
    fallback = (
        f"Disruption '{route_data.get('disruption_type', 'unknown')}' detected — "
        f"weather severity {route_data.get('weather_severity', '?')}/1.0, "
        f"est. {prediction.get('predicted_delay_hours', '?')}hr delay. "
        f"Recommend immediate multi-carrier bidding."
    )
    result = _ask_llm(prompt)
    return validate_and_return(result, fallback, context="disruption_analysis") if result else fallback


def explain_bid_selection(
    bids: list[dict[str, Any]],
    chosen_bid: dict[str, Any],
    budget: float,
    warehouse_status: list[Any] | None = None,
) -> str:
    """Explain why a particular carrier bid was selected, with domain context."""
    bid_summary = "; ".join(
        f"{b.get('carrier_name', b.get('carrier_id', '?'))}: ${b.get('quoted_price', 0):.0f}, "
        f"ETA {b.get('estimated_delivery_hours', '?')}h, "
        f"reliability {b.get('reliability', '?')}"
        for b in bids[:5]
    )
    chosen_name = chosen_bid.get("carrier_name", chosen_bid.get("carrier_id", "?"))
    prompt = (
        "You are an AI procurement analyst. In ONE concise sentence (max 40 words), "
        "explain why this carrier was chosen over others.\n\n"
        f"Budget: ${budget:.0f}\n"
        f"Bids: {bid_summary}\n"
        f"Winner: {chosen_name} "
        f"(${chosen_bid.get('quoted_price', 0):.0f}, "
        f"reliability: {chosen_bid.get('reliability', '?')})\n"
        "Response:"
    )
    fallback = (
        f"Selected {chosen_name} — best utility score "
        f"balancing ${chosen_bid.get('quoted_price', 0):.0f} cost, "
        f"{chosen_bid.get('estimated_delivery_hours', '?')}h ETA, and "
        f"{chosen_bid.get('reliability', '?')} reliability."
    )
    result = _ask_llm(prompt)
    return validate_and_return(result, fallback, context="bid_selection") if result else fallback


def generate_learning_insight(
    reputation_updates: list[dict[str, Any]],
    outcome: str,
    negotiation_log: list[str] | None = None,
) -> str:
    """Generate a strategic learning insight from the negotiation outcome."""
    updates_str = "; ".join(
        f"{u.get('carrier_id', '?')}: {u.get('old_score', '?'):.0%} → {u.get('new_score', '?'):.0%} ({u.get('reason', '?')})"
        for u in reputation_updates[:5]
    )
    prompt = (
        "You are an AI learning engine. In ONE concise sentence (max 40 words), "
        "describe what the system learned from this negotiation cycle.\n\n"
        f"Outcome: {outcome}\n"
        f"Reputation changes: {updates_str}\n"
        "Response:"
    )
    fallback = (
        f"Outcome: {outcome}. Reputation database updated for "
        f"{len(reputation_updates)} carriers. System memory strengthened."
    )
    result = _ask_llm(prompt)
    return validate_and_return(result, fallback, context="learning_insight") if result else fallback

