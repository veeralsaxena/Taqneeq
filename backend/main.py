"""
Autonomous Supply Chain Market — FastAPI Server.
Provides all API endpoints for the 4-screen frontend dashboard.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import uuid
import asyncio
import json
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

app = FastAPI(
    title="Autonomous Supply Chain Market",
    description="Multi-Agent Logistics Negotiation Platform",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.post("/api/negotiate/all")
def negotiate_all_at_risk():
    """Runs negotiation for all shipments currently DELAYED or IN_TRANSIT."""
    results = []
    for sid, s in db["shipments"].items():
        if s.status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELAYED]:
            result = trigger_negotiation(sid)
            results.append(result)
    return {"total": len(results), "results": results}


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
