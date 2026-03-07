"""
MCP-style tools for the LangGraph agents.
Integrates real Open-Meteo weather API, Karrio carrier rates,
Fleetbase fleet data, and warehouse capacity tools.
"""
from langchain_core.tools import tool
import httpx
import random
import os
from dotenv import load_dotenv

load_dotenv()

from carrier_rates import get_real_carrier_rate
from fleetbase_client import get_fleet_positions

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "")


def fetch_live_traffic(lat: float, lng: float) -> float:
    """
    Fetches real-time traffic congestion from TomTom Traffic Flow API.
    Returns a congestion ratio 0-1 (0=free flow, 1=standstill).
    Falls back to random mock if no API key or API failure.
    Free tier: 2,500 requests/day — no credit card required.
    """
    if not TOMTOM_API_KEY:
        return random.uniform(0.1, 0.4)  # mock fallback
    try:
        url = (
            f"https://api.tomtom.com/traffic/services/4/flowSegmentData/"
            f"absolute/10/json?point={lat},{lng}&key={TOMTOM_API_KEY}"
        )
        resp = httpx.get(url, timeout=5)
        data = resp.json().get("flowSegmentData", {})
        current = data.get("currentSpeed", 50)
        free_flow = data.get("freeFlowSpeed", 60)
        if free_flow <= 0:
            return 0.2
        congestion = 1.0 - (current / free_flow)
        return max(0.0, min(1.0, congestion))
    except Exception:
        return random.uniform(0.1, 0.4)  # mock fallback


# ──────────────────────────────────────────────
# REAL API: Open-Meteo Weather (no key needed)
# ──────────────────────────────────────────────
COORD_MAP = {
    "Factory A":    (28.6139, 77.2090),   # Delhi
    "Factory B":    (19.0760, 72.8777),   # Mumbai
    "Retailer B":   (12.9716, 77.5946),   # Bangalore
    "Retailer C":   (22.5726, 88.3639),   # Kolkata
    "Hub Alpha":    (26.9124, 75.7873),   # Jaipur
    "Hub Beta":     (17.3850, 78.4867),   # Hyderabad
    "Hub Gamma":    (23.0225, 72.5714),   # Ahmedabad
}


def _get_coords(name: str):
    return COORD_MAP.get(name, (28.6139, 77.2090))


def fetch_live_weather(lat: float, lng: float) -> dict:
    """Fetches real-time weather from Open-Meteo (free, no API key)."""
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,windspeed_10m,precipitation,weathercode"
        )
        resp = httpx.get(url, timeout=5)
        data = resp.json().get("current", {})
        return {
            "temperature": data.get("temperature_2m", 25),
            "windspeed": data.get("windspeed_10m", 5),
            "precipitation": data.get("precipitation", 0),
            "weathercode": data.get("weathercode", 0),
        }
    except Exception:
        return {"temperature": 25, "windspeed": 5, "precipitation": 0, "weathercode": 0}


def weather_to_severity(weather: dict) -> float:
    """Converts real weather data into a 0-1 severity score."""
    score = 0.0
    wc = weather.get("weathercode", 0)
    # WMO weather codes: 0-3 clear, 45-48 fog, 51-67 drizzle/rain, 71-77 snow, 80+ showers/thunderstorms
    if wc >= 95:
        score += 0.9   # thunderstorm
    elif wc >= 71:
        score += 0.7   # snow
    elif wc >= 61:
        score += 0.5   # rain
    elif wc >= 51:
        score += 0.3   # drizzle
    elif wc >= 45:
        score += 0.2   # fog

    # Wind contribution
    wind = weather.get("windspeed", 0)
    if wind > 60:
        score += 0.3
    elif wind > 40:
        score += 0.2
    elif wind > 20:
        score += 0.1

    # Precipitation
    precip = weather.get("precipitation", 0)
    if precip > 10:
        score += 0.2
    elif precip > 5:
        score += 0.1

    return min(1.0, score)


def _disruption_type_from_code(wc: int) -> str:
    if wc >= 95:
        return "THUNDERSTORM"
    elif wc >= 71:
        return "SNOWSTORM"
    elif wc >= 61:
        return "HEAVY_RAIN"
    elif wc >= 51:
        return "DRIZZLE"
    elif wc >= 45:
        return "FOG"
    return "CLEAR"


# Store for overrides (injected disruptions)
_disruption_overrides: dict = {}


def set_disruption_override(source: str, destination: str, override: dict):
    """Called by the API to inject artificial disruptions for demo."""
    _disruption_overrides[f"{source}->{destination}"] = override


def clear_disruption_overrides():
    _disruption_overrides.clear()


# ──────────────────────────────────────────
#  MCP Tool 1: Route Disruption Score
# ──────────────────────────────────────────
@tool
def get_route_disruption_score(source: str, destination: str) -> dict:
    """
    Fetches real-time weather/traffic disruption score for a route.
    Uses the real Open-Meteo weather API for live data.
    Args:
        source: Starting location name.
        destination: Ending location name.
    """
    key = f"{source}->{destination}"

    # Check if there is an injected override (for demo chaos panel)
    if key in _disruption_overrides:
        return _disruption_overrides[key]

    # Real API call
    src_lat, src_lng = _get_coords(source)
    dst_lat, dst_lng = _get_coords(destination)

    # Fetch weather at source and destination, take the worst
    src_weather = fetch_live_weather(src_lat, src_lng)
    dst_weather = fetch_live_weather(dst_lat, dst_lng)

    src_severity = weather_to_severity(src_weather)
    dst_severity = weather_to_severity(dst_weather)
    weather_severity = max(src_severity, dst_severity)
    worst_weather = src_weather if src_severity >= dst_severity else dst_weather

    # Real TomTom Traffic API (falls back to mock if no key)
    traffic_index = fetch_live_traffic(src_lat, src_lng)

    # Approximate distance
    import math
    dist_deg = math.sqrt((src_lat - dst_lat)**2 + (src_lng - dst_lng)**2)
    distance_km = dist_deg * 111  # rough conversion

    disruption_type = _disruption_type_from_code(worst_weather.get("weathercode", 0))

    return {
        "traffic_index": round(traffic_index, 3),
        "weather_severity": round(weather_severity, 3),
        "disruption_type": disruption_type,
        "distance_km": round(distance_km, 1),
        "raw_weather": worst_weather,
        "source_coords": {"lat": src_lat, "lng": src_lng},
        "dest_coords": {"lat": dst_lat, "lng": dst_lng},
    }


# ──────────────────────────────────────────
#  MCP Tool 2: Carrier Quote
# ──────────────────────────────────────────
@tool
def request_carrier_quote(carrier_id: str, shipment_id: str, distance_km: float, weather_severity: float = 0.0, weight_kg: float = 500.0, source: str = "", destination: str = "") -> dict:
    """
    Requests a dynamic price quote from a carrier agent.
    Tries Karrio real rates first, falls back to formula-based pricing.
    Args:
        carrier_id: The carrier's ID.
        shipment_id: The shipment's ID.
        distance_km: Route distance in km.
        weather_severity: Current weather severity (0-1) affecting operating costs.
        weight_kg: Shipment weight in kg.
        source: Source location name.
        destination: Destination location name.
    """
    # Try Karrio real carrier rates first
    karrio_rate = get_real_carrier_rate(
        carrier_id=carrier_id,
        weight_kg=weight_kg,
        source=source,
        destination=destination,
        distance_km=distance_km,
    )
    if karrio_rate:
        return {
            **karrio_rate,
            "shipment_id": shipment_id,
            "source": "karrio_live",
        }

    # Fallback: formula-based pricing
    base_rates = {
        "carrier_a": 1.2,
        "carrier_b": 0.8,
        "carrier_c": 2.0,
        "carrier_d": 1.0,
        "carrier_e": 1.5,
    }
    rate = base_rates.get(carrier_id, 1.5)

    # Dynamic pricing: weather drives up costs
    weather_multiplier = 1.0 + (weather_severity * 0.5)
    # Random market variance
    market_variance = random.uniform(0.95, 1.15)

    quote = rate * distance_km * weather_multiplier * market_variance

    # ETA: base speed 60km/h, weather slows down
    speed = max(20, 60 * (1 - weather_severity * 0.5))
    eta_hours = distance_km / speed

    return {
        "carrier_id": carrier_id,
        "shipment_id": shipment_id,
        "quoted_price": round(quote, 2),
        "estimated_delivery_hours": round(eta_hours, 1),
        "dynamic_multiplier": round(weather_multiplier * market_variance, 3),
        "source": "formula_fallback",
    }


# ──────────────────────────────────────────
#  MCP Tool 3: Warehouse Capacity
# ──────────────────────────────────────────
WAREHOUSE_DB = {
    "hub_alpha": {"total_capacity": 1000, "current_inventory": 780, "name": "Hub Alpha"},
    "hub_beta":  {"total_capacity": 800,  "current_inventory": 350, "name": "Hub Beta"},
    "hub_gamma": {"total_capacity": 1200, "current_inventory": 1100, "name": "Hub Gamma"},
}


@tool
def check_hub_capacity(hub_id: str) -> dict:
    """
    Checks warehouse capacity and congestion status.
    Args:
        hub_id: The warehouse hub ID.
    """
    hub = WAREHOUSE_DB.get(hub_id, {"total_capacity": 1000, "current_inventory": 500, "name": hub_id})
    occupancy = hub["current_inventory"] / hub["total_capacity"]

    if occupancy > 0.9:
        status = "CRITICAL"
        accepting = False
    elif occupancy > 0.75:
        status = "HIGH"
        accepting = True
    elif occupancy > 0.5:
        status = "MODERATE"
        accepting = True
    else:
        status = "LOW"
        accepting = True

    return {
        "hub_id": hub_id,
        "hub_name": hub["name"],
        "total_capacity": hub["total_capacity"],
        "current_inventory": hub["current_inventory"],
        "occupancy_pct": round(occupancy * 100, 1),
        "congestion_status": status,
        "accepting_shipments": accepting,
    }


# ──────────────────────────────────────────
#  MCP Tool 4: Carrier Fleet Status
# ──────────────────────────────────────────
@tool
def get_carrier_fleet_status(carrier_id: str) -> dict:
    """
    Gets the current fleet status for a carrier (truck availability, load).
    Tries Fleetbase live data first, falls back to mock data.
    Args:
        carrier_id: The carrier's ID.
    """
    # Try Fleetbase live fleet data first
    fleetbase_data = get_fleet_positions(carrier_id)
    if fleetbase_data:
        return fleetbase_data

    # Fallback: mock fleet data
    fleet_data = {
        "carrier_a": {"total_trucks": 25, "active": 22, "available": 3},
        "carrier_b": {"total_trucks": 40, "active": 28, "available": 12},
        "carrier_c": {"total_trucks": 15, "active": 14, "available": 1},
        "carrier_d": {"total_trucks": 30, "active": 18, "available": 12},
        "carrier_e": {"total_trucks": 20, "active": 15, "available": 5},
    }
    data = fleet_data.get(carrier_id, {"total_trucks": 20, "active": 10, "available": 10})
    return {
        "carrier_id": carrier_id,
        **data,
        "utilization_pct": round(data["active"] / data["total_trucks"] * 100, 1),
        "source": "mock_fallback",
    }
