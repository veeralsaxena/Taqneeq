"""
llm_reasoning.py — Gemini 2.0 Flash powered reasoning for agent narratives.
Provides contextual disruption analysis, bid explanations, and learning insights.
"""

import os
from typing import Any

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


def _ask_llm(prompt: str) -> str:
    """Send a prompt to Gemini and return the text response."""
    if not _LLM_AVAILABLE or _llm is None:
        return ""
    try:
        response = _llm.invoke(prompt)
        return response.content.strip() if hasattr(response, "content") else str(response).strip()
    except Exception as e:
        return f"(LLM unavailable: {e})"


def reason_about_disruption(
    route_data: dict[str, Any],
    prediction: dict[str, Any],
    carrier_info: dict[str, Any],
) -> str:
    """Generate a contextual disruption analysis using Gemini."""
    prompt = (
        "You are an AI logistics analyst. In ONE concise sentence (max 40 words), "
        "analyze this supply chain disruption and suggest urgency level.\n\n"
        f"Disruption: {route_data.get('disruption_type', 'unknown')}\n"
        f"Severity: {route_data.get('severity', 'N/A')}/10\n"
        f"Predicted delay: {prediction.get('predicted_delay_hours', '?')} hours\n"
        f"Risk level: {prediction.get('risk_level', '?')}\n"
        f"Current carrier trust: {carrier_info.get('trust_score', '?')}\n"
        "Response:"
    )
    result = _ask_llm(prompt)
    return result or (
        f"Disruption '{route_data.get('disruption_type', 'unknown')}' detected — "
        f"severity {route_data.get('severity', '?')}/10, "
        f"est. {prediction.get('predicted_delay_hours', '?')}hr delay. "
        f"Recommend immediate multi-carrier bidding."
    )


def explain_bid_selection(
    bids: list[dict[str, Any]],
    chosen_bid: dict[str, Any],
    budget: float,
    warehouse_status: list[Any] | None = None,
) -> str:
    """Explain why a particular carrier bid was selected."""
    bid_summary = "; ".join(
        f"{b.get('carrier_id', '?')}: ${b.get('quoted_price', 0):.0f}, "
        f"ETA {b.get('estimated_hours', '?')}h, trust {b.get('trust_score', '?')}"
        for b in bids[:5]
    )
    prompt = (
        "You are an AI procurement analyst. In ONE concise sentence (max 40 words), "
        "explain why this carrier was chosen over others.\n\n"
        f"Budget: ${budget:.0f}\n"
        f"Bids: {bid_summary}\n"
        f"Winner: {chosen_bid.get('carrier_id', '?')} "
        f"(${chosen_bid.get('quoted_price', 0):.0f}, "
        f"trust: {chosen_bid.get('trust_score', '?')})\n"
        "Response:"
    )
    result = _ask_llm(prompt)
    return result or (
        f"Selected {chosen_bid.get('carrier_id', '?')} — best utility score "
        f"balancing ${chosen_bid.get('quoted_price', 0):.0f} cost, "
        f"{chosen_bid.get('estimated_hours', '?')}h ETA, and "
        f"{chosen_bid.get('trust_score', '?')} trust rating."
    )


def generate_learning_insight(
    reputation_updates: list[dict[str, Any]],
    outcome: str,
    negotiation_log: list[str] | None = None,
) -> str:
    """Generate a strategic learning insight from the negotiation outcome."""
    updates_str = "; ".join(
        f"{u.get('carrier_id', '?')}: {u.get('old_score', '?')} → {u.get('new_score', '?')}"
        for u in reputation_updates[:5]
    )
    prompt = (
        "You are an AI learning engine. In ONE concise sentence (max 40 words), "
        "describe what the system learned from this negotiation cycle.\n\n"
        f"Outcome: {outcome}\n"
        f"Reputation changes: {updates_str}\n"
        "Response:"
    )
    result = _ask_llm(prompt)
    return result or (
        f"Outcome: {outcome}. Reputation database updated for "
        f"{len(reputation_updates)} carriers. System memory strengthened."
    )
