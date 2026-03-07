"""
event_store.py — Append-only event sourcing for negotiation audit trails.
Every agent action is captured as an immutable event.
Any negotiation can be replayed from scratch.
"""

import uuid
from datetime import datetime, timezone
from typing import Any
from enum import Enum


class EventType(str, Enum):
    NEGOTIATION_STARTED = "NEGOTIATION_STARTED"
    DISRUPTION_DETECTED = "DISRUPTION_DETECTED"
    ROUTE_SCANNED = "ROUTE_SCANNED"
    ML_PREDICTION = "ML_PREDICTION"
    LLM_REASONING = "LLM_REASONING"
    RFQ_BROADCAST = "RFQ_BROADCAST"
    BID_SUBMITTED = "BID_SUBMITTED"
    BID_DECLINED = "BID_DECLINED"
    CAPACITY_CHECK = "CAPACITY_CHECK"
    BID_SELECTED = "BID_SELECTED"
    ESCALATED = "ESCALATED"
    NO_ACTION = "NO_ACTION"
    REPUTATION_UPDATED = "REPUTATION_UPDATED"
    NEGOTIATION_COMPLETED = "NEGOTIATION_COMPLETED"


class NegotiationEvent:
    """Immutable event in the negotiation audit trail."""

    __slots__ = (
        "event_id", "negotiation_id", "shipment_id", "timestamp",
        "agent_name", "event_type", "payload", "sequence_number",
    )

    def __init__(
        self,
        negotiation_id: str,
        shipment_id: str,
        agent_name: str,
        event_type: EventType,
        payload: dict[str, Any],
        sequence_number: int,
    ):
        self.event_id = f"evt_{uuid.uuid4().hex[:12]}"
        self.negotiation_id = negotiation_id
        self.shipment_id = shipment_id
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.agent_name = agent_name
        self.event_type = event_type
        self.payload = payload
        self.sequence_number = sequence_number

    def to_dict(self) -> dict[str, Any]:
        return {
            "event_id": self.event_id,
            "negotiation_id": self.negotiation_id,
            "shipment_id": self.shipment_id,
            "timestamp": self.timestamp,
            "agent_name": self.agent_name,
            "event_type": self.event_type.value,
            "payload": self.payload,
            "sequence_number": self.sequence_number,
        }


# ─── Append-Only Event Store ───
class EventStore:
    """
    In-memory append-only event store.
    In production, this would be backed by Postgres/Redis with JSONB columns.
    """

    def __init__(self):
        self._events: list[NegotiationEvent] = []
        self._sequence_counters: dict[str, int] = {}  # negotiation_id → next seq

    def append(
        self,
        negotiation_id: str,
        shipment_id: str,
        agent_name: str,
        event_type: EventType,
        payload: dict[str, Any] | None = None,
    ) -> NegotiationEvent:
        """Append an immutable event to the store."""
        seq = self._sequence_counters.get(negotiation_id, 0) + 1
        self._sequence_counters[negotiation_id] = seq

        event = NegotiationEvent(
            negotiation_id=negotiation_id,
            shipment_id=shipment_id,
            agent_name=agent_name,
            event_type=event_type,
            payload=payload or {},
            sequence_number=seq,
        )
        self._events.append(event)
        return event

    def get_events(
        self,
        negotiation_id: str | None = None,
        shipment_id: str | None = None,
        event_type: EventType | None = None,
        limit: int = 500,
    ) -> list[dict[str, Any]]:
        """Query events with optional filters. Returns ordered by sequence."""
        results = self._events

        if negotiation_id:
            results = [e for e in results if e.negotiation_id == negotiation_id]
        if shipment_id:
            results = [e for e in results if e.shipment_id == shipment_id]
        if event_type:
            results = [e for e in results if e.event_type == event_type]

        results = sorted(results, key=lambda e: (e.negotiation_id, e.sequence_number))
        return [e.to_dict() for e in results[-limit:]]

    def replay_negotiation(self, negotiation_id: str) -> dict[str, Any]:
        """
        Replay a negotiation from its event stream.
        Returns a structured timeline showing every agent action in order.
        """
        events = [e for e in self._events if e.negotiation_id == negotiation_id]
        events.sort(key=lambda e: e.sequence_number)

        if not events:
            return {"negotiation_id": negotiation_id, "found": False, "events": []}

        # Build timeline
        timeline = []
        for evt in events:
            timeline.append({
                "step": evt.sequence_number,
                "timestamp": evt.timestamp,
                "agent": evt.agent_name,
                "action": evt.event_type.value,
                "details": evt.payload,
            })

        return {
            "negotiation_id": negotiation_id,
            "shipment_id": events[0].shipment_id,
            "found": True,
            "total_events": len(events),
            "started_at": events[0].timestamp,
            "completed_at": events[-1].timestamp,
            "timeline": timeline,
        }

    def get_audit_summary(self) -> dict[str, Any]:
        """Returns a high-level audit summary across all negotiations."""
        neg_ids = set(e.negotiation_id for e in self._events)
        event_types_count: dict[str, int] = {}
        for e in self._events:
            event_types_count[e.event_type.value] = event_types_count.get(e.event_type.value, 0) + 1

        return {
            "total_events": len(self._events),
            "total_negotiations": len(neg_ids),
            "event_type_distribution": event_types_count,
            "negotiation_ids": sorted(neg_ids),
        }

    @property
    def event_count(self) -> int:
        return len(self._events)


# ─── Singleton ───
event_store = EventStore()
