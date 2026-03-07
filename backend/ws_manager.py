"""
ws_manager.py — WebSocket connection manager for real-time Market Feed.
Broadcasts agent negotiation events to all connected clients instantly.
Supports global feed and per-shipment subscriptions.
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Any
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections for the real-time Market Feed."""

    def __init__(self):
        # Global feed subscribers
        self._global_connections: list[WebSocket] = []
        # Per-shipment subscribers: shipment_id → [WebSocket]
        self._shipment_connections: dict[str, list[WebSocket]] = {}
        # Lock for thread safety
        self._lock = asyncio.Lock()

    async def connect_global(self, websocket: WebSocket):
        """Accept a global feed connection."""
        await websocket.accept()
        async with self._lock:
            self._global_connections.append(websocket)
        # Send welcome message
        await self._safe_send(websocket, {
            "type": "connected",
            "feed": "global",
            "message": "Connected to Autonomous Supply Chain Market Feed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    async def connect_shipment(self, websocket: WebSocket, shipment_id: str):
        """Accept a per-shipment feed connection."""
        await websocket.accept()
        async with self._lock:
            if shipment_id not in self._shipment_connections:
                self._shipment_connections[shipment_id] = []
            self._shipment_connections[shipment_id].append(websocket)
        await self._safe_send(websocket, {
            "type": "connected",
            "feed": "shipment",
            "shipment_id": shipment_id,
            "message": f"Subscribed to live negotiation feed for {shipment_id}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    async def disconnect_global(self, websocket: WebSocket):
        """Remove a global feed connection."""
        async with self._lock:
            if websocket in self._global_connections:
                self._global_connections.remove(websocket)

    async def disconnect_shipment(self, websocket: WebSocket, shipment_id: str):
        """Remove a per-shipment feed connection."""
        async with self._lock:
            if shipment_id in self._shipment_connections:
                conns = self._shipment_connections[shipment_id]
                if websocket in conns:
                    conns.remove(websocket)
                if not conns:
                    del self._shipment_connections[shipment_id]

    async def broadcast(self, message: dict[str, Any]):
        """Broadcast a message to ALL global feed subscribers."""
        msg = {
            **message,
            "timestamp": message.get("timestamp", datetime.now(timezone.utc).isoformat()),
        }
        async with self._lock:
            dead: list[WebSocket] = []
            for ws in self._global_connections:
                if not await self._safe_send(ws, msg):
                    dead.append(ws)
            for ws in dead:
                self._global_connections.remove(ws)

    async def send_to_shipment(self, shipment_id: str, message: dict[str, Any]):
        """Send a message to all subscribers of a specific shipment."""
        msg = {
            **message,
            "shipment_id": shipment_id,
            "timestamp": message.get("timestamp", datetime.now(timezone.utc).isoformat()),
        }
        # Send to shipment-specific subscribers
        async with self._lock:
            conns = self._shipment_connections.get(shipment_id, [])
            dead: list[WebSocket] = []
            for ws in conns:
                if not await self._safe_send(ws, msg):
                    dead.append(ws)
            for ws in dead:
                conns.remove(ws)

        # Also broadcast to global feed
        await self.broadcast(msg)

    async def broadcast_log_entry(self, shipment_id: str, log_entry: str):
        """Convenience: broadcast a single negotiation log line."""
        await self.send_to_shipment(shipment_id, {
            "type": "negotiation_log",
            "message": log_entry,
        })

    async def broadcast_event(self, event_data: dict[str, Any]):
        """Broadcast a structured event (from event_store)."""
        await self.broadcast({
            "type": "event",
            **event_data,
        })

    @staticmethod
    async def _safe_send(websocket: WebSocket, data: dict[str, Any]) -> bool:
        """Send data to a websocket. Returns False if the connection is dead."""
        try:
            await websocket.send_json(data)
            return True
        except Exception:
            return False

    @property
    def global_connection_count(self) -> int:
        return len(self._global_connections)

    @property
    def shipment_subscriptions(self) -> dict[str, int]:
        return {sid: len(conns) for sid, conns in self._shipment_connections.items()}

    def get_status(self) -> dict[str, Any]:
        """Returns WebSocket manager status for the dashboard."""
        return {
            "global_subscribers": self.global_connection_count,
            "shipment_subscriptions": self.shipment_subscriptions,
            "total_connections": self.global_connection_count + sum(
                len(c) for c in self._shipment_connections.values()
            ),
        }


# ─── Singleton ───
ws_manager = ConnectionManager()
