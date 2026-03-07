"""
Multi-Agent Negotiation Engine — LangGraph.
Implements the full Observe → Reason → Decide → Act → Learn loop
with 5 agent nodes and conditional branching.
"""
import os
import uuid
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from datetime import datetime

from tools import (
    get_route_disruption_score,
    request_carrier_quote,
    check_hub_capacity,
    get_carrier_fleet_status,
)
from ml_predictor import predict_delay
from llm_reasoning import (
    reason_about_disruption,
    explain_bid_selection,
    generate_learning_insight,
)
from guardrails import GuardrailPolicy
from decision_tracker import tracker as decision_tracker


# ─── State Definition ───
class AgentState(TypedDict):
    # Shipment context
    shipment_id: str
    current_carrier_id: str
    source: str
    destination: str
    budget: float

    # Observation layer
    disruption_detected: bool
    delay_prediction: Dict[str, Any]  # full ML prediction result
    route_data: Dict[str, Any]        # raw weather + traffic data

    # Negotiation layer
    warehouse_responses: List[Dict[str, Any]]
    bids: List[Dict[str, Any]]

    # Decision layer
    chosen_carrier_id: str
    final_cost: float
    outcome: str  # SUCCESS, ESCALATED, NO_ACTION

    # Guardrails
    guardrail_result: Dict[str, Any]
    decision_id: str

    # Learning layer
    reputation_updates: List[Dict[str, Any]]

    # Logging
    negotiation_log: List[str]
    timestamp: str


# Carrier database reference (shared with main.py)
CARRIER_DB = {
    "carrier_a": {"name": "Express Logistics", "reliability": 0.95, "rate": 1.2},
    "carrier_b": {"name": "Budget Freight",    "reliability": 0.78, "rate": 0.8},
    "carrier_c": {"name": "Premium Haulers",   "reliability": 0.99, "rate": 2.0},
    "carrier_d": {"name": "Swift Transport",   "reliability": 0.85, "rate": 1.0},
    "carrier_e": {"name": "Eco Movers",        "reliability": 0.70, "rate": 1.5},
}


# ─── NODE 1: Network Supervisor (Observer + Reasoner) ───
def network_supervisor(state: AgentState) -> AgentState:
    """
    OBSERVE: Calls MCP Weather API + ML Predictor.
    REASON:  Determines if delay risk exceeds threshold.
    """
    log = state["negotiation_log"]
    log.append(f"[Network Supervisor] 🔍 Scanning route: {state['source']} → {state['destination']}")

    # MCP Tool Call: Real weather data
    route_data = get_route_disruption_score.invoke({
        "source": state["source"],
        "destination": state["destination"],
    })
    state["route_data"] = route_data

    log.append(
        f"[Network Supervisor] 🌤️ Weather API: severity={route_data['weather_severity']}, "
        f"traffic={route_data['traffic_index']}, type={route_data['disruption_type']}"
    )

    # Get carrier reliability
    carrier_id = state["current_carrier_id"]
    reliability = CARRIER_DB.get(carrier_id, {}).get("reliability", 0.8)

    # ML Prediction
    prediction = predict_delay(
        traffic=route_data["traffic_index"],
        weather=route_data["weather_severity"],
        reliability=reliability,
        distance_km=route_data["distance_km"],
    )
    state["delay_prediction"] = prediction

    delay = prediction["predicted_delay_hours"]
    risk = prediction["risk_level"]
    conf = prediction["confidence"]

    log.append(
        f"[Network Supervisor] 🧠 ML Prediction: {delay:.1f}hrs delay "
        f"(risk={risk}, confidence={conf:.0%})"
    )

    # Decision: trigger negotiation?
    if delay > 2.0:
        state["disruption_detected"] = True
        log.append(
            f"[Network Supervisor] ⚠️ ALERT: Predicted {delay:.1f}hrs delay due to "
            f"{route_data['disruption_type']}! Initiating multi-agent negotiation."
        )

        # 🤖 Gemini LLM: contextual disruption reasoning
        carrier_id = state["current_carrier_id"]
        carrier_info = CARRIER_DB.get(carrier_id, {})
        llm_assessment = reason_about_disruption(route_data, prediction, carrier_info)
        log.append(f"[Gemini 🤖] {llm_assessment}")
    else:
        state["disruption_detected"] = False
        log.append(f"[Network Supervisor] ✅ Route healthy. No intervention needed.")

    return state


# ─── NODE 2: Carrier Agents (Bidders) ───
def carrier_agents(state: AgentState) -> AgentState:
    """
    Each Carrier Agent independently evaluates the RFQ and submits a bid.
    Dynamic pricing based on weather conditions.
    """
    if not state["disruption_detected"]:
        return state

    log = state["negotiation_log"]
    log.append(f"[Shipment {state['shipment_id']}] 📢 Broadcasting RFQ to all available carriers...")

    bids = []
    weather_sev = state["route_data"].get("weather_severity", 0)
    distance = state["route_data"].get("distance_km", 300)

    for cid, cdata in CARRIER_DB.items():
        if cid == state["current_carrier_id"]:
            continue  # skip the failing carrier

        # Check fleet availability first
        fleet = get_carrier_fleet_status.invoke({"carrier_id": cid})
        if fleet["available"] <= 0:
            log.append(f"[{cdata['name']}] ❌ No trucks available. Declining RFQ.")
            continue

        # Get dynamic quote
        quote = request_carrier_quote.invoke({
            "carrier_id": cid,
            "shipment_id": state["shipment_id"],
            "distance_km": distance,
            "weather_severity": weather_sev,
        })

        bids.append({
            **quote,
            "carrier_name": cdata["name"],
            "reliability": cdata["reliability"],
            "available_trucks": fleet["available"],
        })
        log.append(
            f"[{cdata['name']}] 💰 Bid: ${quote['quoted_price']:.2f} | "
            f"ETA: {quote['estimated_delivery_hours']:.1f}hrs | "
            f"Rep: {cdata['reliability']:.0%} | Trucks: {fleet['available']}"
        )

    state["bids"] = bids
    return state


# ─── NODE 3: Warehouse Agent (Gatekeeper) ───
def warehouse_agent(state: AgentState) -> AgentState:
    """
    Checks if the destination warehouse can accept a rerouted shipment.
    """
    if not state["disruption_detected"]:
        return state

    log = state["negotiation_log"]

    # Check destination hub
    hub_data = check_hub_capacity.invoke({"hub_id": state["destination"].lower().replace(" ", "_")})
    state["warehouse_responses"].append(hub_data)

    status_emoji = "🟢" if hub_data["accepting_shipments"] else "🔴"
    log.append(
        f"[Warehouse {hub_data.get('hub_name', state['destination'])}] {status_emoji} "
        f"Capacity: {hub_data['occupancy_pct']}% | Status: {hub_data['congestion_status']} | "
        f"Accepting: {'Yes' if hub_data['accepting_shipments'] else 'NO'}"
    )

    if not hub_data["accepting_shipments"]:
        log.append(
            f"[Warehouse Agent] ⚠️ Destination at critical capacity! "
            f"Recommending alternate hub."
        )

    return state


# ─── NODE 4: Shipment Agent (Decision Maker) ───
def shipment_agent(state: AgentState) -> AgentState:
    """
    DECIDE: Evaluates bids using utility function.
    ACT: Selects best carrier or escalates to human.
    GUARDRAILS: Checks policy before acting.
    """
    log = state["negotiation_log"]
    decision_id = str(uuid.uuid4())[:8]
    state["decision_id"] = decision_id

    if not state["disruption_detected"]:
        state["chosen_carrier_id"] = state["current_carrier_id"]
        state["outcome"] = "NO_ACTION"
        state["guardrail_result"] = {"approval_level": "AUTONOMOUS", "requires_human": False, "risk_factors": []}
        # Record decision for tracking
        decision_tracker.record_decision(
            decision_id=decision_id,
            shipment_id=state["shipment_id"],
            action="NO_ACTION",
            chosen_carrier_id=state["current_carrier_id"],
            predicted_delay_hours=state.get("delay_prediction", {}).get("predicted_delay_hours", 0),
            predicted_cost=0.0,
            confidence=state.get("delay_prediction", {}).get("confidence", 1.0),
            approval_level="AUTONOMOUS",
        )
        return state

    bids = state["bids"]
    budget = state["budget"]

    # Filter within budget
    valid_bids = [b for b in bids if b["quoted_price"] <= budget]

    if not valid_bids:
        state["outcome"] = "ESCALATED"
        state["chosen_carrier_id"] = state["current_carrier_id"]
        state["guardrail_result"] = {"approval_level": "ESCALATE", "requires_human": True, "risk_factors": ["No bids within budget"]}
        log.append(
            f"[Shipment {state['shipment_id']}] 🚨 ESCALATION: No carriers within "
            f"${budget:.2f} budget. Requires human approval!"
        )
        decision_tracker.record_decision(
            decision_id=decision_id,
            shipment_id=state["shipment_id"],
            action="ESCALATED",
            chosen_carrier_id=state["current_carrier_id"],
            predicted_delay_hours=state.get("delay_prediction", {}).get("predicted_delay_hours", 0),
            predicted_cost=0.0,
            confidence=state.get("delay_prediction", {}).get("confidence", 0.5),
            approval_level="ESCALATE",
        )
        return state

    # Utility function: minimize (normalized_price + time_penalty - reliability_bonus)
    def utility(bid):
        price_score = bid["quoted_price"] / budget  # 0-1
        time_score = bid["estimated_delivery_hours"] / 24  # normalized
        reliability_bonus = bid.get("reliability", 0.5) * 0.3
        return price_score + time_score - reliability_bonus

    # Sort by utility (lower = better)
    valid_bids.sort(key=utility)
    best = valid_bids[0]

    # ──── GUARDRAIL CHECK ────
    prediction = state.get("delay_prediction", {})
    guardrail = GuardrailPolicy.evaluate_action(
        cost=best["quoted_price"],
        predicted_delay=prediction.get("predicted_delay_hours", 0),
        confidence=prediction.get("confidence", 0.5),
        carrier_reliability=best.get("reliability", 0.5),
    )
    state["guardrail_result"] = guardrail

    if guardrail["approval_level"] == "ESCALATE":
        state["outcome"] = "ESCALATED"
        state["chosen_carrier_id"] = state["current_carrier_id"]
        log.append(
            f"[Guardrails 🛡️] ESCALATION REQUIRED — {guardrail['reason']}"
        )
        log.append(
            f"[Shipment {state['shipment_id']}] 🚨 Action blocked by guardrails. "
            f"Human approval needed for ${best['quoted_price']:.2f} reroute."
        )
        decision_tracker.record_decision(
            decision_id=decision_id,
            shipment_id=state["shipment_id"],
            action="ESCALATED",
            chosen_carrier_id=best["carrier_id"],
            predicted_delay_hours=prediction.get("predicted_delay_hours", 0),
            predicted_cost=best["quoted_price"],
            confidence=prediction.get("confidence", 0.5),
            approval_level="ESCALATE",
        )
        return state

    if guardrail["approval_level"] == "RECOMMEND":
        log.append(
            f"[Guardrails 🛡️] RECOMMEND mode — {guardrail['reason']}"
        )
        log.append(
            f"[Shipment {state['shipment_id']}] ⚠️ Agent recommends reroute but "
            f"flagged for human review. Proceeding with advisory."
        )

    if guardrail["approval_level"] == "AUTONOMOUS":
        log.append(
            f"[Guardrails 🛡️] ✅ All parameters within safe limits. Autonomous action approved."
        )

    state["chosen_carrier_id"] = best["carrier_id"]
    state["final_cost"] = best["quoted_price"]
    state["outcome"] = "SUCCESS"

    log.append(
        f"[Shipment {state['shipment_id']}] 🤝 NEGOTIATION SUCCESS: "
        f"Selected {best.get('carrier_name', best['carrier_id'])} for "
        f"${best['quoted_price']:.2f} (ETA: {best['estimated_delivery_hours']:.1f}hrs)"
    )

    # Show why this bid won
    if len(valid_bids) > 1:
        runner_up = valid_bids[1]
        log.append(
            f"[Shipment {state['shipment_id']}] 📊 Runner-up was "
            f"{runner_up.get('carrier_name', runner_up['carrier_id'])} at "
            f"${runner_up['quoted_price']:.2f}. Won due to better utility score."
        )

    # 🤖 Gemini LLM: explain bid selection reasoning
    llm_explanation = explain_bid_selection(
        bids=bids,
        chosen_bid=best,
        budget=budget,
        warehouse_status=state.get("warehouse_responses", []),
    )
    log.append(f"[Gemini 🤖] {llm_explanation}")

    # Record decision for post-action tracking
    decision_tracker.record_decision(
        decision_id=decision_id,
        shipment_id=state["shipment_id"],
        action="REROUTE",
        chosen_carrier_id=best["carrier_id"],
        predicted_delay_hours=prediction.get("predicted_delay_hours", 0),
        predicted_cost=best["quoted_price"],
        confidence=prediction.get("confidence", 0.5),
        approval_level=guardrail["approval_level"],
    )

    return state


# ─── NODE 5: Learning Agent (Memory) ───
def learning_agent(state: AgentState) -> AgentState:
    """
    LEARN: Updates carrier reputation based on negotiation outcome.
    Records the event for future ML re-training.
    """
    log = state["negotiation_log"]

    if state["outcome"] == "NO_ACTION":
        return state

    updates = []

    # Penalize the carrier that caused the disruption
    failed_carrier = state["current_carrier_id"]
    if failed_carrier in CARRIER_DB and state["disruption_detected"]:
        old_score = CARRIER_DB[failed_carrier]["reliability"]
        penalty = min(0.15, state["delay_prediction"].get("predicted_delay_hours", 2) * 0.02)
        new_score = max(0.1, old_score - penalty)
        CARRIER_DB[failed_carrier]["reliability"] = round(new_score, 3)

        updates.append({
            "carrier_id": failed_carrier,
            "old_score": old_score,
            "new_score": new_score,
            "reason": "disruption_penalty",
        })
        log.append(
            f"[Learning Agent] 📉 {CARRIER_DB[failed_carrier]['name']} reputation: "
            f"{old_score:.0%} → {new_score:.0%} (disruption penalty)"
        )

    # Reward the winning carrier (small boost for accepting)
    if state["outcome"] == "SUCCESS" and state["chosen_carrier_id"] in CARRIER_DB:
        winner = state["chosen_carrier_id"]
        old_score = CARRIER_DB[winner]["reliability"]
        new_score = min(1.0, old_score + 0.01)
        CARRIER_DB[winner]["reliability"] = round(new_score, 3)

        updates.append({
            "carrier_id": winner,
            "old_score": old_score,
            "new_score": new_score,
            "reason": "bid_accepted_bonus",
        })
        log.append(
            f"[Learning Agent] 📈 {CARRIER_DB[winner]['name']} reputation: "
            f"{old_score:.0%} → {new_score:.0%} (successful bid bonus)"
        )

    state["reputation_updates"] = updates
    log.append(f"[Learning Agent] 💾 Outcome recorded. System memory updated.")

    # 🤖 Gemini LLM: generate strategic learning insight
    llm_insight = generate_learning_insight(
        reputation_updates=updates,
        outcome=state["outcome"],
        negotiation_log=log,
    )
    log.append(f"[Gemini 🤖] {llm_insight}")

    return state


# ─── Build the LangGraph ───
def _should_negotiate(state: AgentState) -> str:
    """Conditional edge: skip negotiation if no disruption detected."""
    if state["disruption_detected"]:
        return "Carriers"
    return "Learning"


def build_negotiation_graph():
    workflow = StateGraph(AgentState)

    # Add all 5 nodes
    workflow.add_node("Supervisor", network_supervisor)
    workflow.add_node("Carriers", carrier_agents)
    workflow.add_node("Warehouse", warehouse_agent)
    workflow.add_node("Shipment", shipment_agent)
    workflow.add_node("Learning", learning_agent)

    # Entry
    workflow.set_entry_point("Supervisor")

    # Conditional: negotiate or skip
    workflow.add_conditional_edges("Supervisor", _should_negotiate, {
        "Carriers": "Carriers",
        "Learning": "Learning",
    })

    # Linear negotiation flow
    workflow.add_edge("Carriers", "Warehouse")
    workflow.add_edge("Warehouse", "Shipment")
    workflow.add_edge("Shipment", "Learning")
    workflow.add_edge("Learning", END)

    return workflow.compile()


# Singleton
negotiation_graph = build_negotiation_graph()


def run_negotiation(shipment_data: dict) -> dict:
    """
    Entry point called by FastAPI.
    Returns full negotiation result with logs, outcome, and reputation updates.
    """
    initial_state: AgentState = {
        "shipment_id": shipment_data["id"],
        "current_carrier_id": shipment_data.get("current_carrier_id", "carrier_a"),
        "source": shipment_data["source"],
        "destination": shipment_data["destination"],
        "budget": shipment_data["budget"],
        "disruption_detected": False,
        "delay_prediction": {},
        "route_data": {},
        "warehouse_responses": [],
        "bids": [],
        "guardrail_result": {},
        "decision_id": "",
        "chosen_carrier_id": "",
        "final_cost": 0.0,
        "outcome": "PENDING",
        "reputation_updates": [],
        "negotiation_log": [],
        "timestamp": datetime.utcnow().isoformat(),
    }

    final_state = negotiation_graph.invoke(initial_state)

    return {
        "negotiation_log": final_state["negotiation_log"],
        "chosen_carrier_id": final_state.get("chosen_carrier_id"),
        "final_cost": final_state.get("final_cost", 0),
        "outcome": final_state.get("outcome", "PENDING"),
        "delay_prediction": final_state.get("delay_prediction", {}),
        "bids": final_state.get("bids", []),
        "reputation_updates": final_state.get("reputation_updates", []),
        "route_data": final_state.get("route_data", {}),
        "guardrail_result": final_state.get("guardrail_result", {}),
        "decision_id": final_state.get("decision_id", ""),
    }
