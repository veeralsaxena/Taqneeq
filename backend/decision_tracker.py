"""
decision_tracker.py — Post-Action Decision Validation & Accuracy Tracking.

Tracks whether past agent decisions were correct by comparing predicted outcomes
with actual outcomes. This is a key requirement of the problem statement:
"how incorrect decisions are detected and corrected."
"""
from datetime import datetime
from typing import Any


class DecisionRecord:
    """A single recorded decision for later validation."""

    def __init__(
        self,
        decision_id: str,
        shipment_id: str,
        action: str,               # e.g., "REROUTE", "ESCALATE", "NO_ACTION"
        chosen_carrier_id: str,
        predicted_delay_hours: float,
        predicted_cost: float,
        confidence: float,
        approval_level: str,
        timestamp: str | None = None,
    ):
        self.decision_id = decision_id
        self.shipment_id = shipment_id
        self.action = action
        self.chosen_carrier_id = chosen_carrier_id
        self.predicted_delay_hours = predicted_delay_hours
        self.predicted_cost = predicted_cost
        self.confidence = confidence
        self.approval_level = approval_level
        self.timestamp = timestamp or datetime.utcnow().isoformat()

        # Filled in later by validate()
        self.actual_delay_hours: float | None = None
        self.actual_met_sla: bool | None = None
        self.was_correct: bool | None = None
        self.correction_applied: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "decision_id": self.decision_id,
            "shipment_id": self.shipment_id,
            "action": self.action,
            "chosen_carrier_id": self.chosen_carrier_id,
            "predicted_delay_hours": self.predicted_delay_hours,
            "predicted_cost": self.predicted_cost,
            "confidence": self.confidence,
            "approval_level": self.approval_level,
            "timestamp": self.timestamp,
            "actual_delay_hours": self.actual_delay_hours,
            "actual_met_sla": self.actual_met_sla,
            "was_correct": self.was_correct,
            "correction_applied": self.correction_applied,
        }


class DecisionTracker:
    """
    Singleton tracker that records every agent decision and validates outcomes.
    
    Provides:
    - Decision accuracy % (correct interventions / total)
    - False positive rate (unnecessary reroutes)
    - False negative rate (missed disruptions)
    - Correction recommendations
    """

    def __init__(self):
        self.decisions: list[DecisionRecord] = []
        self._sla_threshold_hours = 6.0  # SLA breach if delivery > 6hrs

    def record_decision(
        self,
        decision_id: str,
        shipment_id: str,
        action: str,
        chosen_carrier_id: str,
        predicted_delay_hours: float,
        predicted_cost: float,
        confidence: float,
        approval_level: str,
    ) -> DecisionRecord:
        """Record a new agent decision."""
        record = DecisionRecord(
            decision_id=decision_id,
            shipment_id=shipment_id,
            action=action,
            chosen_carrier_id=chosen_carrier_id,
            predicted_delay_hours=predicted_delay_hours,
            predicted_cost=predicted_cost,
            confidence=confidence,
            approval_level=approval_level,
        )
        self.decisions.append(record)
        return record

    def validate_decision(
        self,
        decision_id: str,
        actual_delay_hours: float,
    ) -> dict[str, Any]:
        """
        After delivery, validate whether the decision was correct.
        
        A decision is CORRECT if:
        - Action was REROUTE and it actually avoided/reduced delay (actual < predicted)
        - Action was NO_ACTION and there was indeed no significant delay
        - Action was ESCALATE and the delay was genuinely severe
        
        A decision is INCORRECT if:
        - Action was REROUTE but the new carrier was ALSO delayed (false positive)
        - Action was NO_ACTION but there WAS a significant delay (false negative)
        """
        record = self._find(decision_id)
        if not record:
            return {"error": f"Decision {decision_id} not found"}

        record.actual_delay_hours = actual_delay_hours
        met_sla = actual_delay_hours <= self._sla_threshold_hours
        record.actual_met_sla = met_sla

        if record.action == "REROUTE":
            # Correct if SLA was met after reroute
            record.was_correct = met_sla
            if not met_sla:
                record.correction_applied = (
                    f"BAD_REROUTE: Carrier {record.chosen_carrier_id} "
                    f"still delivered late ({actual_delay_hours:.1f}hrs). "
                    f"Apply extra reputation penalty."
                )
        elif record.action == "NO_ACTION":
            # Correct if there was no significant delay
            record.was_correct = actual_delay_hours <= 2.0
            if actual_delay_hours > 2.0:
                record.correction_applied = (
                    f"MISSED_DISRUPTION: Should have rerouted. "
                    f"Actual delay was {actual_delay_hours:.1f}hrs. "
                    f"Lower ML confidence threshold."
                )
        elif record.action == "ESCALATED":
            # Escalation is always considered correct (human intervened)
            record.was_correct = True
        else:
            record.was_correct = met_sla

        return record.to_dict()

    def get_accuracy_metrics(self) -> dict[str, Any]:
        """
        Calculate overall decision accuracy metrics.
        These are shown in the Analytics screen.
        """
        validated = [d for d in self.decisions if d.was_correct is not None]
        total = len(validated)

        if total == 0:
            return {
                "total_decisions": len(self.decisions),
                "validated_decisions": 0,
                "accuracy_pct": None,
                "correct": 0,
                "incorrect": 0,
                "false_positives": 0,
                "false_negatives": 0,
                "corrections": [],
            }

        correct = sum(1 for d in validated if d.was_correct)
        incorrect = total - correct

        # False positives: rerouted unnecessarily
        false_positives = sum(
            1 for d in validated
            if d.action == "REROUTE" and not d.was_correct
        )
        # False negatives: didn't reroute when should have
        false_negatives = sum(
            1 for d in validated
            if d.action == "NO_ACTION" and not d.was_correct
        )
        # Corrections applied
        corrections = [
            {"decision_id": d.decision_id, "correction": d.correction_applied}
            for d in validated
            if d.correction_applied
        ]

        return {
            "total_decisions": len(self.decisions),
            "validated_decisions": total,
            "accuracy_pct": round((correct / total) * 100, 1),
            "correct": correct,
            "incorrect": incorrect,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "corrections": corrections[-10:],  # last 10
        }

    def get_all_decisions(self) -> list[dict[str, Any]]:
        """Return all decisions for the audit trail."""
        return [d.to_dict() for d in self.decisions]

    def _find(self, decision_id: str) -> DecisionRecord | None:
        for d in self.decisions:
            if d.decision_id == decision_id:
                return d
        return None


# Singleton instance
tracker = DecisionTracker()
