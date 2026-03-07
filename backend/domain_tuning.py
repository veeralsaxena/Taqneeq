"""
domain_tuning.py — Logistics domain knowledge for Gemini fine-tuning.
Provides system prompts and contextual grounding to make the LLM
reason like a supply chain expert, not a generic AI assistant.
"""

from typing import Any


# ─── Master Domain System Prompt ───
DOMAIN_SYSTEM_PROMPT = """You are an expert AI agent operating within an autonomous supply chain market.
You have deep domain expertise in freight logistics, carrier negotiations, and supply chain resilience.

DOMAIN KNOWLEDGE:
- Carrier SLA tiers: Standard (48hr), Express (24hr), Critical (12hr). Breaching SLA incurs a penalty of 2% of shipment value per hour of delay.
- Insurance: Standard coverage is 1.5% of cargo value. High-value shipments (>₹5L) require additional insurance at 3%.
- Fuel surcharges fluctuate weekly. Current Indian diesel index: ₹89.62/L. Surcharge formula: base_rate × (current_diesel / reference_diesel).
- Dimensional weight: For air freight, use divisor 5000 (L×W×H cm / 5000). Billable weight = max(actual, dimensional).
- Indian regulations: E-way bill mandatory for goods >₹50,000. GST implications on inter-state transport (IGST vs CGST+SGST).
- Toll structures: NHAI toll averages ₹2.1/km for multi-axle vehicles on national highways.
- Cold chain: Reefer containers cost 40-60% premium. Temperature excursions void carrier liability.
- Hazmat: ADR/IMDG classified goods require certified carriers. Limited to 80% of standard payload capacity.

BEHAVIORAL RULES:
- Always quantify impact in hours and currency (₹/USD)
- Consider cascading effects: one delayed shipment can congest a hub, delaying 10+ others
- Prioritize reliability over cost for critical/express shipments
- Flag regulatory risks (e-way bill expiry, GST mismatch) proactively
- Use logistics terminology: RFQ, BOL, POD, LTL, FTL, TEU, demurrage, detention
"""


def get_domain_system_prompt() -> str:
    """Returns the full domain system prompt for Gemini."""
    return DOMAIN_SYSTEM_PROMPT


def get_domain_context(shipment_data: dict[str, Any]) -> str:
    """
    Generates shipment-specific domain context for grounding LLM responses.
    Uses the shipment's weight, priority, budget, and route to add relevant context.
    """
    weight = shipment_data.get("weight_kg", 500)
    priority = shipment_data.get("priority", 1)
    budget = shipment_data.get("budget", 0)
    source = shipment_data.get("source", "Unknown")
    destination = shipment_data.get("destination", "Unknown")

    # Determine SLA tier
    sla_tiers = {1: "Standard (48hr)", 2: "Express (24hr)", 3: "Critical (12hr)"}
    sla = sla_tiers.get(priority, "Standard (48hr)")

    # Weight class
    if weight > 5000:
        weight_class = "FTL (Full Truck Load)"
    elif weight > 1000:
        weight_class = "LTL (Less Than Truck Load) — heavy"
    elif weight > 100:
        weight_class = "LTL (Less Than Truck Load) — standard"
    else:
        weight_class = "Parcel / small freight"

    # Estimated cargo value (rough heuristic)
    estimated_value = weight * 150  # ₹150/kg average
    high_value = estimated_value > 500000

    # E-way bill requirement
    eway_required = estimated_value > 50000

    context = f"""SHIPMENT CONTEXT:
- Route: {source} → {destination}
- Weight: {weight:.0f} kg ({weight_class})
- SLA tier: {sla}
- Budget: ${budget:.2f}
- Est. cargo value: ₹{estimated_value:,.0f} {"⚠️ HIGH VALUE — requires additional insurance" if high_value else ""}
- E-way bill: {"REQUIRED (>₹50K)" if eway_required else "Not required"}
- Priority level: {priority}/3"""

    return context


def get_carrier_sla_context(carrier_reliability: float, carrier_name: str) -> str:
    """Returns SLA-relevant context about a specific carrier."""
    if carrier_reliability >= 0.95:
        tier = "Tier 1 (Premium)"
        note = "Eligible for guaranteed delivery windows. Lower insurance premiums."
    elif carrier_reliability >= 0.80:
        tier = "Tier 2 (Standard)"
        note = "Standard terms. Monitor for SLA drift."
    elif carrier_reliability >= 0.60:
        tier = "Tier 3 (Budget)"
        note = "Higher delay risk. Recommend only for non-critical, cost-sensitive shipments."
    else:
        tier = "Tier 4 (Probationary)"
        note = "CAUTION: Below minimum reliability threshold. Consider suspension from network."

    return f"Carrier {carrier_name}: {tier} (reliability {carrier_reliability:.0%}). {note}"


def get_penalty_context(delay_hours: float, budget: float, priority: int) -> str:
    """Calculate and describe the financial impact of a delay."""
    # SLA penalty: 2% of shipment value per hour
    estimated_value = budget * 3  # rough: budget is ~1/3 of cargo value
    hourly_penalty = estimated_value * 0.02
    total_penalty = hourly_penalty * delay_hours

    # Priority multiplier
    multiplier = {1: 1.0, 2: 1.5, 3: 2.5}.get(priority, 1.0)
    total_penalty *= multiplier

    return (
        f"Financial exposure: {delay_hours:.1f}hr delay × ₹{hourly_penalty:,.0f}/hr "
        f"× {multiplier}x priority multiplier = ₹{total_penalty:,.0f} potential SLA penalty."
    )
