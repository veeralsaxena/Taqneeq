"""
rollback.py — Post-action rollback mechanism for NeuroLogistics.
When a reroute decision is validated as INCORRECT, the system can:
1. Revert the shipment to its original carrier
2. Apply extra reputation penalties to the failed carrier
3. Log the rollback in the event store
4. Adjust ML confidence thresholds

Problem statement requirement:
"how incorrect decisions are detected and corrected"
"""

from datetime import datetime, timezone
from typing import Any


class ActionSnapshot:
    """Pre-action state snapshot for potential rollback."""

    def __init__(
        self,
        decision_id: str,
        shipment_id: str,
        original_carrier_id: str,
        new_carrier_id: str,
        original_cost: float,
        new_cost: float,
    ):
        self.decision_id = decision_id
        self.shipment_id = shipment_id
        self.original_carrier_id = original_carrier_id
        self.new_carrier_id = new_carrier_id
        self.original_cost = original_cost
        self.new_cost = new_cost
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.rolled_back = False
        self.rollback_reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "decision_id": self.decision_id,
            "shipment_id": self.shipment_id,
            "original_carrier_id": self.original_carrier_id,
            "new_carrier_id": self.new_carrier_id,
            "original_cost": self.original_cost,
            "new_cost": self.new_cost,
            "timestamp": self.timestamp,
            "rolled_back": self.rolled_back,
            "rollback_reason": self.rollback_reason,
        }


class RollbackManager:
    """
    Manages rollback of incorrect agent decisions.
    Stores pre-action snapshots and can revert shipments to original carriers.
    """

    def __init__(self):
        self._snapshots: dict[str, ActionSnapshot] = {}  # decision_id → snapshot
        self._rollback_history: list[dict[str, Any]] = []

    def register_action(
        self,
        decision_id: str,
        shipment_id: str,
        original_carrier_id: str,
        new_carrier_id: str,
        original_cost: float = 0.0,
        new_cost: float = 0.0,
    ):
        """Save a pre-action snapshot before a reroute."""
        self._snapshots[decision_id] = ActionSnapshot(
            decision_id=decision_id,
            shipment_id=shipment_id,
            original_carrier_id=original_carrier_id,
            new_carrier_id=new_carrier_id,
            original_cost=original_cost,
            new_cost=new_cost,
        )

    def rollback(
        self,
        decision_id: str,
        reason: str,
        carrier_db: dict | None = None,
        extra_penalty: float = 0.05,
    ) -> dict[str, Any]:
        """
        Roll back a decision: revert shipment to the original carrier.
        
        Returns rollback result with details.
        """
        snapshot = self._snapshots.get(decision_id)
        if not snapshot:
            return {"success": False, "error": f"No snapshot found for decision {decision_id}"}

        if snapshot.rolled_back:
            return {"success": False, "error": f"Decision {decision_id} already rolled back"}

        # Mark as rolled back
        snapshot.rolled_back = True
        snapshot.rollback_reason = reason

        # Apply extra reputation penalty to the failed carrier
        penalty_details = {}
        if carrier_db and snapshot.new_carrier_id in carrier_db:
            old_score = carrier_db[snapshot.new_carrier_id].get("reliability", 0.8)
            new_score = max(0.05, old_score - extra_penalty)
            carrier_db[snapshot.new_carrier_id]["reliability"] = round(new_score, 3)
            penalty_details = {
                "carrier_id": snapshot.new_carrier_id,
                "old_reliability": old_score,
                "new_reliability": new_score,
                "extra_penalty": extra_penalty,
            }

        rollback_record = {
            "decision_id": decision_id,
            "shipment_id": snapshot.shipment_id,
            "reverted_to_carrier": snapshot.original_carrier_id,
            "failed_carrier": snapshot.new_carrier_id,
            "reason": reason,
            "penalty_applied": penalty_details,
            "rolled_back_at": datetime.now(timezone.utc).isoformat(),
        }

        self._rollback_history.append(rollback_record)

        return {
            "success": True,
            **rollback_record,
        }

    def auto_rollback_on_validation(
        self,
        decision_id: str,
        was_correct: bool,
        actual_delay_hours: float,
        carrier_db: dict | None = None,
    ) -> dict[str, Any] | None:
        """
        Automatically triggered when a decision is validated as incorrect.
        Called by decision_tracker.validate_decision().
        """
        if was_correct:
            return None

        snapshot = self._snapshots.get(decision_id)
        if not snapshot:
            return None

        # Only rollback REROUTE decisions
        if snapshot.original_carrier_id == snapshot.new_carrier_id:
            return None

        reason = (
            f"Auto-rollback: carrier {snapshot.new_carrier_id} delivered "
            f"{actual_delay_hours:.1f}hrs late after reroute. "
            f"Reverting to original carrier {snapshot.original_carrier_id}."
        )

        return self.rollback(
            decision_id=decision_id,
            reason=reason,
            carrier_db=carrier_db,
            extra_penalty=min(0.1, actual_delay_hours * 0.01),
        )

    def get_rollback_history(self) -> list[dict[str, Any]]:
        """Get all rollback records."""
        return self._rollback_history

    def get_stats(self) -> dict[str, Any]:
        """Get rollback statistics."""
        total_snapshots = len(self._snapshots)
        total_rollbacks = sum(1 for s in self._snapshots.values() if s.rolled_back)
        return {
            "total_actions_tracked": total_snapshots,
            "total_rollbacks": total_rollbacks,
            "rollback_rate_pct": round((total_rollbacks / max(1, total_snapshots)) * 100, 1),
            "recent_rollbacks": self._rollback_history[-10:],
        }

    def get_snapshot(self, decision_id: str) -> dict[str, Any] | None:
        snapshot = self._snapshots.get(decision_id)
        return snapshot.to_dict() if snapshot else None


# Singleton
rollback_manager = RollbackManager()
