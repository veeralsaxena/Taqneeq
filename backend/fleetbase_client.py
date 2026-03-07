"""
fleetbase_client.py — Fleetbase REST API client for real fleet position data.
Falls back to mock fleet data when API key is unavailable.
"""

import os
import httpx
from typing import Any

FLEETBASE_HOST = os.getenv("FLEETBASE_HOST", "https://api.fleetbase.io")
FLEETBASE_API_KEY = os.getenv("FLEETBASE_API_KEY", "")

_FLEETBASE_AVAILABLE = bool(FLEETBASE_API_KEY)

# ─── Internal carrier → Fleetbase fleet mapping ───
CARRIER_FLEET_MAP: dict[str, str] = {
    "carrier_a": "fleet_express_logistics",
    "carrier_b": "fleet_budget_freight",
    "carrier_c": "fleet_premium_haulers",
    "carrier_d": "fleet_swift_transport",
    "carrier_e": "fleet_eco_movers",
}


def _fleetbase_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {FLEETBASE_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def fetch_fleet_vehicles(fleet_id: str = "") -> list[dict[str, Any]]:
    """
    Fetch vehicles from Fleetbase API.
    Returns a list of vehicle objects with position, status, etc.
    """
    if not _FLEETBASE_AVAILABLE:
        return []

    try:
        url = f"{FLEETBASE_HOST}/api/v1/vehicles"
        params = {}
        if fleet_id:
            params["fleet"] = fleet_id

        resp = httpx.get(url, headers=_fleetbase_headers(), params=params, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("data", data.get("vehicles", []))
        else:
            print(f"⚠️  Fleetbase API returned {resp.status_code}")
            return []
    except Exception as e:
        print(f"⚠️  Fleetbase API call failed: {e}")
        return []


def fetch_fleet_drivers(fleet_id: str = "") -> list[dict[str, Any]]:
    """Fetch drivers from Fleetbase API."""
    if not _FLEETBASE_AVAILABLE:
        return []

    try:
        url = f"{FLEETBASE_HOST}/api/v1/drivers"
        params = {}
        if fleet_id:
            params["fleet"] = fleet_id

        resp = httpx.get(url, headers=_fleetbase_headers(), params=params, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("data", data.get("drivers", []))
        return []
    except Exception as e:
        print(f"⚠️  Fleetbase drivers API failed: {e}")
        return []


def get_fleet_positions(carrier_id: str) -> dict[str, Any] | None:
    """
    Get fleet status for a carrier via Fleetbase.
    Returns None if Fleetbase is unavailable (caller should use fallback).

    Transforms Fleetbase vehicle data into our internal format:
    {total_trucks, active, available, utilization_pct, positions[]}
    """
    if not _FLEETBASE_AVAILABLE:
        return None

    fleet_id = CARRIER_FLEET_MAP.get(carrier_id, "")
    vehicles = fetch_fleet_vehicles(fleet_id)

    if not vehicles:
        return None

    total = len(vehicles)
    active = sum(1 for v in vehicles if v.get("status") in ("active", "en-route", "in_use"))
    available = total - active

    positions = []
    for v in vehicles:
        loc = v.get("location") or v.get("position") or {}
        positions.append({
            "vehicle_id": v.get("id", v.get("public_id", "unknown")),
            "name": v.get("name", v.get("display_name", "Vehicle")),
            "status": v.get("status", "unknown"),
            "lat": loc.get("latitude", loc.get("lat", 0)),
            "lng": loc.get("longitude", loc.get("lng", 0)),
            "speed_kmh": v.get("speed", 0),
            "heading": v.get("heading", 0),
        })

    return {
        "carrier_id": carrier_id,
        "total_trucks": total,
        "active": active,
        "available": max(1, available),  # Always report at least 1 for demo
        "utilization_pct": round(active / max(1, total) * 100, 1),
        "positions": positions,
        "source": "fleetbase_live",
    }


def get_fleetbase_status() -> dict[str, Any]:
    """Returns the status of Fleetbase integration for the dashboard."""
    return {
        "fleetbase_available": _FLEETBASE_AVAILABLE,
        "host": FLEETBASE_HOST,
        "fleets_mapped": len(CARRIER_FLEET_MAP),
    }
