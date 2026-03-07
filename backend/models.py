"""
Data models for the Autonomous Supply Chain Market.
Rich entities with coordinates, history tracking, and negotiation records.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class ShipmentStatus(str, Enum):
    PENDING = "PENDING"
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    REROUTED = "REROUTED"
    DELIVERED = "DELIVERED"


class DisruptionType(str, Enum):
    SNOWSTORM = "SNOWSTORM"
    HEAVY_RAIN = "HEAVY_RAIN"
    TRAFFIC_JAM = "TRAFFIC_JAM"
    TRUCK_BREAKDOWN = "TRUCK_BREAKDOWN"
    PORT_CONGESTION = "PORT_CONGESTION"


class Location(BaseModel):
    name: str
    lat: float
    lng: float


class Carrier(BaseModel):
    id: str
    name: str
    reliability_score: float = Field(ge=0.0, le=1.0)
    base_rate_per_km: float
    current_load: int = 0  # number of active shipments
    max_capacity: int = 50
    fuel_cost_index: float = 1.0  # multiplier for fuel
    reputation_history: List[Dict[str, Any]] = []  # [{timestamp, score, reason}]


class Warehouse(BaseModel):
    id: str
    name: str
    location: Location
    capacity: int
    current_inventory: int
    throughput_rate: int = 100  # units per hour


class Shipment(BaseModel):
    id: str
    source: str
    destination: str
    source_coords: Location
    destination_coords: Location
    status: ShipmentStatus = ShipmentStatus.IN_TRANSIT
    budget: float
    current_carrier_id: Optional[str] = None
    eta: Optional[str] = None
    created_at: str
    priority: int = 1  # 1=normal, 2=express, 3=critical
    weight_kg: float = 500.0


class Disruption(BaseModel):
    entity_id: str
    type: DisruptionType
    severity: float = Field(ge=0.0, le=1.0)
    affected_region: Optional[str] = None


class NegotiationRecord(BaseModel):
    id: str = Field(default_factory=lambda: f"neg_{uuid.uuid4().hex[:8]}")
    shipment_id: str
    timestamp: str
    trigger_reason: str
    delay_prediction_hours: float
    bids: List[Dict[str, Any]] = []
    chosen_carrier_id: Optional[str] = None
    final_cost: Optional[float] = None
    outcome: str = "PENDING"  # PENDING, SUCCESS, ESCALATED
    log: List[str] = []


class WeatherData(BaseModel):
    temperature: float
    windspeed: float
    precipitation: float
    weathercode: int
    location: str


class TrafficData(BaseModel):
    flow_speed_kmh: float
    free_flow_speed_kmh: float
    congestion_index: float  # 0-1
    incidents: int
    route: str


class MLPrediction(BaseModel):
    traffic_index: float
    weather_severity: float
    carrier_reliability: float
    distance_km: float
    predicted_delay_hours: float
    confidence: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
