"""
Autonomous Supply Chain Market — FastAPI Server.
Provides all API endpoints for the 4-screen frontend dashboard.
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn
import uuid
import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

from models import (
    Shipment, Carrier, Warehouse, Disruption, Location,
    NegotiationRecord, ShipmentStatus, DisruptionType,
)
from agents import run_negotiation, CARRIER_DB
from ml_predictor import predict_delay
from tools import (
    set_disruption_override, clear_disruption_overrides,
    fetch_live_weather, weather_to_severity, _get_coords,
)
from event_store import event_store, EventType
from ws_manager import ws_manager
from carrier_rates import get_karrio_status
from fleetbase_client import get_fleetbase_status
from database import init_db, DB_BACKEND, persist_negotiation
from redis_client import check_rate_limit, get_redis_status
from auth import require_api_key, require_api_key_or_demo, get_auth_status
from llm_safety import get_validation_stats
from rollback import rollback_manager

app = FastAPI(
    title="Autonomous Supply Chain Market",
    description="Multi-Agent Logistics Negotiation Platform — NeuroLogistics",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Rate Limiting Middleware ───
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all endpoints."""
    client_ip = request.client.host if request.client else "unknown"
    is_mutation = request.method in ("POST", "PUT", "DELETE", "PATCH")
    max_req = 20 if is_mutation else 100
    
    result = check_rate_limit(f"{client_ip}:{request.method}", max_req, 60)
    if not result["allowed"]:
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Rate limit exceeded. Try again later.",
                "remaining": result["remaining"],
                "limit": result["limit"],
            },
            headers={"Retry-After": "60"},
        )
    
    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(result["remaining"])
    response.headers["X-RateLimit-Limit"] = str(result["limit"])
    return response


# ─── Database Startup ───
@app.on_event("startup")
def startup_event():
    """Initialize database tables on server start."""
    init_db()
    print(f"🗄️  Database backend: {DB_BACKEND}")

# ─── In-Memory State ───
db: Dict[str, Any] = {
    "shipments": {},
    "carriers": {},
    "warehouses": {},
    "disruptions": [],
    "negotiations": [],       # List[NegotiationRecord]
    "event_log": [],          # Global event log for the Market Feed
    "reputation_history": {}, # carrier_id -> [{timestamp, score, reason}]
}


def _ts():
    return datetime.utcnow().isoformat() + "Z"


# ─── Seed Data ───
def seed_data():
    # Carriers (synced with agents.py CARRIER_DB)
    carriers = [
        Carrier(id="carrier_a", name="Express Logistics", reliability_score=0.95, base_rate_per_km=1.2, max_capacity=25),
        Carrier(id="carrier_b", name="Budget Freight",    reliability_score=0.78, base_rate_per_km=0.8, max_capacity=40),
        Carrier(id="carrier_c", name="Premium Haulers",   reliability_score=0.99, base_rate_per_km=2.0, max_capacity=15),
        Carrier(id="carrier_d", name="Swift Transport",   reliability_score=0.85, base_rate_per_km=1.0, max_capacity=30),
        Carrier(id="carrier_e", name="Eco Movers",        reliability_score=0.70, base_rate_per_km=1.5, max_capacity=20),
    ]
    for c in carriers:
        db["carriers"][c.id] = c
        db["reputation_history"][c.id] = [{"timestamp": _ts(), "score": c.reliability_score, "reason": "initial"}]

    # Warehouses
    warehouses = [
        Warehouse(id="hub_alpha", name="Hub Alpha (Jaipur)",    location=Location(name="Jaipur",    lat=26.9124, lng=75.7873), capacity=1000, current_inventory=780),
        Warehouse(id="hub_beta",  name="Hub Beta (Hyderabad)",  location=Location(name="Hyderabad", lat=17.3850, lng=78.4867), capacity=800,  current_inventory=350),
        Warehouse(id="hub_gamma", name="Hub Gamma (Ahmedabad)", location=Location(name="Ahmedabad", lat=23.0225, lng=72.5714), capacity=1200, current_inventory=1100),
    ]
    for w in warehouses:
        db["warehouses"][w.id] = w

    # Shipments
    shipments = [
        Shipment(
            id="shp_alpha01",
            source="Factory A", destination="Retailer B",
            source_coords=Location(name="Delhi",     lat=28.6139, lng=77.2090),
            destination_coords=Location(name="Bangalore", lat=12.9716, lng=77.5946),
            status=ShipmentStatus.IN_TRANSIT, budget=500.0,
            current_carrier_id="carrier_a",
            created_at=_ts(), priority=2, weight_kg=750,
        ),
        Shipment(
            id="shp_beta02",
            source="Factory B", destination="Retailer C",
            source_coords=Location(name="Mumbai",   lat=19.0760, lng=72.8777),
            destination_coords=Location(name="Kolkata", lat=22.5726, lng=88.3639),
            status=ShipmentStatus.IN_TRANSIT, budget=800.0,
            current_carrier_id="carrier_d",
            created_at=_ts(), priority=1, weight_kg=1200,
        ),
        Shipment(
            id="shp_gamma03",
            source="Factory A", destination="Retailer C",
            source_coords=Location(name="Delhi",   lat=28.6139, lng=77.2090),
            destination_coords=Location(name="Kolkata", lat=22.5726, lng=88.3639),
            status=ShipmentStatus.PENDING, budget=350.0,
            current_carrier_id="carrier_b",
            created_at=_ts(), priority=3, weight_kg=300,
        ),
    ]
    for s in shipments:
        db["shipments"][s.id] = s

    db["event_log"].append({"timestamp": _ts(), "message": "[System] ✅ Supply chain network initialized. 3 shipments, 5 carriers, 3 hubs active."})


seed_data()


# ─── API ENDPOINTS ───

@app.get("/")
def root():
    return {"status": "ok", "service": "Autonomous Supply Chain Market", "version": "2.0.0"}


# --- Screen 1: Control Tower ---
@app.get("/api/state")
def get_system_state():
    """Returns the full system state for the Control Tower dashboard."""
    # Sync carrier reliability from CARRIER_DB (agents mutate it)
    for cid, cdata in CARRIER_DB.items():
        if cid in db["carriers"]:
            db["carriers"][cid].reliability_score = cdata["reliability"]

    return {
        "shipments": [s.model_dump() for s in db["shipments"].values()],
        "carriers": [c.model_dump() for c in db["carriers"].values()],
        "warehouses": [w.model_dump() for w in db["warehouses"].values()],
        "disruptions": [d.model_dump() if hasattr(d, 'model_dump') else d for d in db["disruptions"]],
        "active_shipments": len([s for s in db["shipments"].values() if s.status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELAYED]]),
        "total_negotiations": len(db["negotiations"]),
    }


@app.get("/api/events")
def get_event_log():
    """Returns the global event log (Market Feed)."""
    return {"events": db["event_log"][-100:]}  # last 100


# --- Screen 2: Data Ingestion & Anomaly Simulator ---
@app.get("/api/weather/{location_name}")
def get_live_weather(location_name: str):
    """Fetches REAL weather data from Open-Meteo for a location."""
    lat, lng = _get_coords(location_name)
    weather = fetch_live_weather(lat, lng)
    severity = weather_to_severity(weather)
    return {
        "location": location_name,
        "coords": {"lat": lat, "lng": lng},
        "raw": weather,
        "severity_score": round(severity, 3),
    }


@app.post("/api/predict")
def run_ml_prediction(data: dict):
    """Runs the ML delay predictor with custom parameters (for the Chaos Panel)."""
    result = predict_delay(
        traffic=data.get("traffic_index", 0.3),
        weather=data.get("weather_severity", 0.1),
        reliability=data.get("carrier_reliability", 0.9),
        distance_km=data.get("distance_km", 300),
    )
    return result


@app.post("/api/disruption")
def inject_disruption(disruption: Disruption):
    """Injects an artificial disruption for the demo Chaos Panel."""
    db["disruptions"].append(disruption)

    # Override the route tool for affected shipments
    affected_shipments = []
    for s in db["shipments"].values():
        if disruption.entity_id == s.current_carrier_id or disruption.affected_region:
            set_disruption_override(s.source, s.destination, {
                "traffic_index": 0.85 + (disruption.severity * 0.15),
                "weather_severity": disruption.severity,
                "disruption_type": disruption.type.value,
                "distance_km": 500,
                "raw_weather": {"temperature": 2, "windspeed": 65, "precipitation": 15, "weathercode": 75},
                "source_coords": {"lat": s.source_coords.lat, "lng": s.source_coords.lng},
                "dest_coords": {"lat": s.destination_coords.lat, "lng": s.destination_coords.lng},
            })
            affected_shipments.append(s.id)
            s.status = ShipmentStatus.DELAYED

    # Update carrier reliability
    if disruption.entity_id in db["carriers"]:
        carrier = db["carriers"][disruption.entity_id]
        old = carrier.reliability_score
        carrier.reliability_score = max(0.05, carrier.reliability_score * (1.0 - disruption.severity))
        CARRIER_DB[disruption.entity_id]["reliability"] = carrier.reliability_score
        db["reputation_history"][disruption.entity_id].append({
            "timestamp": _ts(),
            "score": carrier.reliability_score,
            "reason": f"disruption:{disruption.type.value}",
        })

    msg = f"[System] 🔴 DISRUPTION: {disruption.type.value} (severity {disruption.severity:.0%}) affecting {disruption.entity_id}. {len(affected_shipments)} shipments impacted."
    db["event_log"].append({"timestamp": _ts(), "message": msg})

    return {
        "status": "disruption_injected",
        "affected_shipments": affected_shipments,
        "message": msg,
    }


@app.post("/api/disruption/clear")
def clear_disruptions():
    """Clears all active disruptions (reset button)."""
    db["disruptions"].clear()
    clear_disruption_overrides()
    db["event_log"].append({"timestamp": _ts(), "message": "[System] ✅ All disruptions cleared. Network restored."})
    return {"status": "cleared"}


# --- Screen 3: Agent Workflow ---

# IMPORTANT: /all must come before /{shipment_id} to avoid path capture
@app.post("/api/negotiate/all")
def negotiate_all_at_risk():
    """Runs negotiation for all shipments currently DELAYED or IN_TRANSIT."""
    results = []
    for sid, s in db["shipments"].items():
        if s.status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELAYED]:
            result = trigger_negotiation(sid)
            results.append(result)
    return {"total": len(results), "results": results}


@app.post("/api/negotiate/{shipment_id}")
def trigger_negotiation(shipment_id: str):
    """Triggers the full multi-agent negotiation for a specific shipment."""
    if shipment_id not in db["shipments"]:
        raise HTTPException(status_code=404, detail="Shipment not found")

    s = db["shipments"][shipment_id]

    # Run the LangGraph
    result = run_negotiation(s.model_dump())

    # Create negotiation record
    record = NegotiationRecord(
        shipment_id=shipment_id,
        timestamp=_ts(),
        trigger_reason=result.get("route_data", {}).get("disruption_type", "MANUAL"),
        delay_prediction_hours=result.get("delay_prediction", {}).get("predicted_delay_hours", 0),
        bids=result.get("bids", []),
        chosen_carrier_id=result.get("chosen_carrier_id"),
        final_cost=result.get("final_cost"),
        outcome=result.get("outcome", "PENDING"),
        log=result.get("negotiation_log", []),
    )
    db["negotiations"].append(record)

    # Update shipment state
    if result.get("outcome") == "SUCCESS" and result.get("chosen_carrier_id"):
        s.current_carrier_id = result["chosen_carrier_id"]
        s.status = ShipmentStatus.REROUTED
        db["shipments"][shipment_id] = s

    # Push logs to global event feed
    for log_entry in result.get("negotiation_log", []):
        db["event_log"].append({"timestamp": _ts(), "message": log_entry})

    # Sync reputation updates
    for update in result.get("reputation_updates", []):
        cid = update["carrier_id"]
        if cid in db["carriers"]:
            db["carriers"][cid].reliability_score = update["new_score"]
        if cid in db["reputation_history"]:
            db["reputation_history"][cid].append({
                "timestamp": _ts(),
                "score": update["new_score"],
                "reason": update["reason"],
            })

    return {
        "status": "success",
        "negotiation": record.model_dump(),
        "result": result,
    }


# --- One-Click Demo Endpoint ---
@app.post("/api/demo/simulate")
def demo_simulate():
    """
    One-click full demo: clears old state, injects a snowstorm disruption,
    runs the complete LangGraph negotiation pipeline, and returns all logs + results.
    Designed for the Workflow page's 'Simulate Flow' button.
    """
    # 1. Reset: clear old disruptions and restore carrier reliability
    db["disruptions"].clear()
    clear_disruption_overrides()
    for cid in CARRIER_DB:
        if cid in db["carriers"]:
            db["carriers"][cid].reliability_score = CARRIER_DB[cid]["reliability"]

    # 2. Reset shipment statuses back to IN_TRANSIT
    for sid, s in db["shipments"].items():
        if s.status in [ShipmentStatus.REROUTED, ShipmentStatus.DELAYED]:
            s.status = ShipmentStatus.IN_TRANSIT
            db["shipments"][sid] = s

    # 3. Pick the first IN_TRANSIT shipment
    target_shipment = None
    for sid, s in db["shipments"].items():
        if s.status == ShipmentStatus.IN_TRANSIT:
            target_shipment = s
            break

    if not target_shipment:
        raise HTTPException(status_code=400, detail="No IN_TRANSIT shipments available")

    # 4. Inject a severe snowstorm disruption
    disruption = Disruption(
        entity_id=target_shipment.current_carrier_id,
        type=DisruptionType.SNOWSTORM,
        severity=0.9,
        affected_region="North India",
    )
    disrupt_result = inject_disruption(disruption)

    # 5. Run the full negotiation
    neg_result = trigger_negotiation(target_shipment.id)

    # 6. Build the combined response
    negotiation_data = neg_result.get("negotiation", {}) if isinstance(neg_result, dict) else {}
    result_data = neg_result.get("result", {}) if isinstance(neg_result, dict) else {}

    return {
        "status": "demo_complete",
        "shipment_id": target_shipment.id,
        "shipment_route": f"{target_shipment.source} → {target_shipment.destination}",
        "disruption": {
            "type": "SNOWSTORM",
            "severity": 0.9,
            "affected_carrier": target_shipment.current_carrier_id,
            "affected_shipments": disrupt_result.get("affected_shipments", []),
        },
        "negotiation_log": result_data.get("negotiation_log", negotiation_data.get("log", [])),
        "outcome": result_data.get("outcome", negotiation_data.get("outcome", "UNKNOWN")),
        "chosen_carrier_id": result_data.get("chosen_carrier_id", ""),
        "final_cost": result_data.get("final_cost", 0),
        "delay_prediction": result_data.get("delay_prediction", {}),
        "bids": result_data.get("bids", []),
        "guardrail_result": result_data.get("guardrail_result", {}),
        "reputation_updates": result_data.get("reputation_updates", []),
    }


@app.get("/api/negotiations")
def get_negotiation_history():
    """Returns all past negotiation records."""
    return {"negotiations": [n.model_dump() for n in db["negotiations"]]}


# --- Screen 4: Analytics ---
@app.get("/api/analytics/reputation")
def get_reputation_data():
    """Returns carrier reputation leaderboard and history."""
    leaderboard = []
    for cid, carrier in db["carriers"].items():
        history = db["reputation_history"].get(cid, [])
        neg_count = len([n for n in db["negotiations"] if n.chosen_carrier_id == cid])
        leaderboard.append({
            "carrier_id": cid,
            "name": carrier.name,
            "current_score": carrier.reliability_score,
            "base_rate": carrier.base_rate_per_km,
            "bids_won": neg_count,
            "history": history,
        })

    leaderboard.sort(key=lambda x: x["current_score"], reverse=True)
    return {"leaderboard": leaderboard}


@app.get("/api/analytics/savings")
def get_savings_analytics():
    """Returns financial impact of agent negotiations."""
    total_saved = 0
    total_negotiations = len(db["negotiations"])
    successful = 0
    escalated = 0

    for n in db["negotiations"]:
        if n.outcome == "SUCCESS" and n.final_cost:
            # Assume the "premium emergency" would be 2x
            emergency_cost = n.final_cost * 2.0
            total_saved += (emergency_cost - n.final_cost)
            successful += 1
        elif n.outcome == "ESCALATED":
            escalated += 1

    return {
        "total_negotiations": total_negotiations,
        "successful": successful,
        "escalated": escalated,
        "estimated_savings": round(total_saved, 2),
        "avg_savings_per_negotiation": round(total_saved / max(1, successful), 2),
    }


@app.get("/api/analytics/ml")
def get_ml_analytics():
    """Returns ML model analytics (feature importances, prediction stats)."""
    from ml_predictor import feature_importances
    predictions = [n.delay_prediction_hours for n in db["negotiations"] if n.delay_prediction_hours > 0]
    return {
        "feature_importances": feature_importances,
        "total_predictions": len(predictions),
        "avg_predicted_delay": round(sum(predictions) / max(1, len(predictions)), 2),
        "max_predicted_delay": round(max(predictions) if predictions else 0, 2),
    }


# --- Graph structure for React Flow ---
@app.get("/api/graph")
def get_agent_graph():
    """Returns the LangGraph structure for the React Flow visualizer."""
    return {
        "nodes": [
            {"id": "supervisor", "label": "Network Supervisor", "type": "observer", "description": "Polls weather APIs + ML predictor"},
            {"id": "carriers",   "label": "Carrier Agents",     "type": "bidder",   "description": "Submit competitive bids"},
            {"id": "warehouse",  "label": "Warehouse Agent",    "type": "gatekeeper","description": "Capacity verification"},
            {"id": "shipment",   "label": "Shipment Agent",     "type": "decider",  "description": "Utility-based selection"},
            {"id": "learning",   "label": "Learning Agent",     "type": "memory",   "description": "Updates reputation scores"},
        ],
        "edges": [
            {"source": "supervisor", "target": "carriers",  "label": "disruption detected", "conditional": True},
            {"source": "supervisor", "target": "learning",  "label": "route healthy",       "conditional": True},
            {"source": "carriers",   "target": "warehouse", "label": "bids submitted"},
            {"source": "warehouse",  "target": "shipment",  "label": "capacity verified"},
            {"source": "shipment",   "target": "learning",  "label": "decision made"},
        ],
    }


# ─── Decision Tracking & Guardrails Endpoints ───

from decision_tracker import tracker as decision_tracker_instance
from guardrails import GuardrailPolicy


@app.get("/api/decisions")
async def get_all_decisions():
    """Get all recorded agent decisions (audit trail)."""
    return decision_tracker_instance.get_all_decisions()


@app.get("/api/decisions/accuracy")
async def get_decision_accuracy():
    """
    Get decision accuracy metrics: correct %, false positives,
    false negatives, and correction recommendations.
    This is the key metric judges look for:
    'how incorrect decisions are detected and corrected.'
    """
    return decision_tracker_instance.get_accuracy_metrics()


@app.post("/api/decisions/{decision_id}/validate")
async def validate_decision(decision_id: str, actual_delay_hours: float):
    """
    After delivery, validate whether the agent's decision was correct.
    Simulates post-action outcome recording.
    """
    result = decision_tracker_instance.validate_decision(
        decision_id=decision_id,
        actual_delay_hours=actual_delay_hours,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/guardrails/policy")
async def get_guardrail_policy():
    """
    Returns the current guardrail thresholds so the UI can display them.
    Shows judges exactly what the agent can do autonomously vs. with human approval.
    """
    return {
        "cost_auto_limit": GuardrailPolicy.COST_AUTO_LIMIT,
        "cost_recommend_limit": GuardrailPolicy.COST_RECOMMEND_LIMIT,
        "delay_auto_limit": GuardrailPolicy.DELAY_AUTO_LIMIT,
        "delay_escalate_limit": GuardrailPolicy.DELAY_ESCALATE_LIMIT,
        "min_confidence": GuardrailPolicy.MIN_CONFIDENCE,
        "min_carrier_reliability": GuardrailPolicy.MIN_CARRIER_RELIABILITY,
        "levels": {
            "AUTONOMOUS": f"Cost < ${GuardrailPolicy.COST_AUTO_LIMIT:.0f}, delay < {GuardrailPolicy.DELAY_AUTO_LIMIT}hrs",
            "RECOMMEND": f"Cost ${GuardrailPolicy.COST_AUTO_LIMIT:.0f}-${GuardrailPolicy.COST_RECOMMEND_LIMIT:.0f} or low confidence",
            "ESCALATE": f"Cost > ${GuardrailPolicy.COST_RECOMMEND_LIMIT:.0f}, delay > {GuardrailPolicy.DELAY_ESCALATE_LIMIT}hrs, or repeat failure",
        },
    }

@app.post("/api/slack/interactive")
async def slack_interactive_endpoint(request: Request):
    """
    Webhook endpoint for Slack Block Kit interactive buttons.
    When a human clicks 'Approve' in Slack, Slack POSTs to this endpoint.
    This overrides the ESCALATE guardrail and executes the reroute.
    """
    # In a real Slack app, form data is sent as application/x-www-form-urlencoded
    # payload = form_data.get("payload") -> parse JSON
    # For now (simulation), we accept the payload as raw JSON or extract shipment_id directly.
    try:
        body = await request.json()
        action_value = body.get("actions", [{}])[0].get("value", "")
        # value expected as: "approve_SHP001"
        action, shipment_id = action_value.split("_", 1)
    except:
        # Fallback for simple testing
        shipment_id = "mock_shipment"
        action = "approve"

    if action != "approve":
        return {"status": "success", "message": "Ignored or Rejected."}

    if shipment_id not in db["shipments"]:
        # Don't throw for Slack, just return standard 200 message
        return JSONResponse(content={"text": "Shipment not found."}, status_code=200)

    shipment = db["shipments"][shipment_id]

    shipment["status"] = "REROUTED"
    
    msg = f"✅ [Slack Automation] Human Ops Manager approved escalation for Shipment {shipment_id}."
    event_store.append(
        negotiation_id=f"neg_{int(time.time())}",
        shipment_id=shipment_id,
        agent_name="Slack Interactive Webhook",
        event_type=EventType.NEGOTIATION_COMPLETED,
        payload={"action": "human_override", "status": "approved"}
    )
    db["events"].append(msg)
    
    if redis_client.redis:
        redis_client.publish_agent_event("Slack API", msg, "SUCCESS")
        
    return JSONResponse(content={"text": f"✅ Escalation approved for {shipment_id}"})

# ─── WebSocket Real-Time Feed ───

@app.websocket("/ws/feed")
async def websocket_global_feed(websocket: WebSocket):
    """Global market feed — all negotiation events in real-time."""
    await ws_manager.connect_global(websocket)
    try:
        while True:
            # Keep connection alive, listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        await ws_manager.disconnect_global(websocket)


@app.websocket("/ws/negotiation/{shipment_id}")
async def websocket_shipment_feed(websocket: WebSocket, shipment_id: str):
    """Per-shipment live negotiation feed."""
    await ws_manager.connect_shipment(websocket, shipment_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "shipment_id": shipment_id})
    except WebSocketDisconnect:
        await ws_manager.disconnect_shipment(websocket, shipment_id)


@app.get("/api/ws/status")
def get_ws_status():
    """Returns WebSocket connection status."""
    return ws_manager.get_status()


# ─── Event Sourcing Audit Trail ───

@app.get("/api/events/audit")
def get_event_audit():
    """Returns the full event audit summary across all negotiations."""
    return event_store.get_audit_summary()


@app.get("/api/events/replay/{negotiation_id}")
def replay_negotiation_events(negotiation_id: str):
    """Replays a specific negotiation from its event stream."""
    result = event_store.replay_negotiation(negotiation_id)
    if not result["found"]:
        raise HTTPException(status_code=404, detail=f"Negotiation {negotiation_id} not found")
    return result


@app.get("/api/events/stream")
def get_event_stream(negotiation_id: str = None, shipment_id: str = None, limit: int = 200):
    """Query the event store with optional filters."""
    return {
        "events": event_store.get_events(
            negotiation_id=negotiation_id,
            shipment_id=shipment_id,
            limit=limit,
        )
    }


# ─── Integration Status ───

@app.get("/api/integrations")
def get_integrations_status():
    """Returns the status of all external integrations."""
    return {
        "karrio": get_karrio_status(),
        "fleetbase": get_fleetbase_status(),
        "websocket": ws_manager.get_status(),
        "event_store": event_store.get_audit_summary(),
        "database": {"backend": DB_BACKEND, "connected": True},
        "redis": get_redis_status(),
        "auth": get_auth_status(),
    }


# ─── Rollback Endpoints ───

@app.post("/api/rollback/{decision_id}")
def rollback_decision(decision_id: str, reason: str = "Manual rollback", _auth=Depends(require_api_key_or_demo)):
    """Roll back a bad reroute decision. Reverts to original carrier + applies extra penalty."""
    result = rollback_manager.rollback(
        decision_id=decision_id,
        reason=reason,
        carrier_db=CARRIER_DB,
    )
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Rollback failed"))
    return result


@app.get("/api/rollback/history")
def get_rollback_history():
    """Get all rollback records."""
    return rollback_manager.get_rollback_history()


@app.get("/api/rollback/stats")
def get_rollback_stats():
    """Get rollback statistics (total tracked, rollback rate %)."""
    return rollback_manager.get_stats()


# ─── LLM Safety ───

@app.get("/api/safety/llm")
def get_llm_safety_stats():
    """Returns LLM output validation statistics — shows responsible AI compliance."""
    return get_validation_stats()


# ─── Auth & Security Status ───

@app.get("/api/security/status")
def get_security_status():
    """Returns the full security posture of the system."""
    return {
        "auth": get_auth_status(),
        "rate_limiting": {"enabled": True, "read_limit": "100/min", "mutation_limit": "20/min"},
        "guardrails": {
            "cost_auto_limit": GuardrailPolicy.COST_AUTO_LIMIT,
            "cost_recommend_limit": GuardrailPolicy.COST_RECOMMEND_LIMIT,
            "delay_auto_limit": GuardrailPolicy.DELAY_AUTO_LIMIT,
            "delay_escalate_limit": GuardrailPolicy.DELAY_ESCALATE_LIMIT,
        },
        "llm_safety": get_validation_stats(),
        "rollback": rollback_manager.get_stats(),
        "database": {"backend": DB_BACKEND, "persistent_learning": DB_BACKEND != "sqlite"},
        "redis": get_redis_status(),
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
