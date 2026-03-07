"""
guardrails.py — Human-in-the-Loop Guardrail Policy for NeuroLogistics.

Defines when agents can act autonomously vs. when human approval is required.
This is a key requirement of the hackathon problem statement.
"""
from enum import Enum
from typing import Any


class ApprovalLevel(str, Enum):
    AUTONOMOUS = "AUTONOMOUS"       # Agent acts on its own
    RECOMMEND = "RECOMMEND"         # Agent recommends, human approves
    ESCALATE = "ESCALATE"           # Agent blocks until human approves


class GuardrailPolicy:
    """
    Configurable guardrail thresholds that determine when human approval is needed.
    
    The problem statement says:
    "You must clearly define what actions the agent can take autonomously,
     when human approval is required, and how incorrect decisions are
     detected and corrected."
    """

    # Cost thresholds (USD)
    COST_AUTO_LIMIT = 500.0         # Below this: fully autonomous
    COST_RECOMMEND_LIMIT = 2000.0   # Below this: recommend, human approves
    # Above COST_RECOMMEND_LIMIT: must escalate and block

    # Delay severity thresholds (hours)
    DELAY_AUTO_LIMIT = 4.0          # < 4hrs: agent handles it
    DELAY_ESCALATE_LIMIT = 8.0      # > 8hrs: must escalate to ops manager

    # Confidence threshold
    MIN_CONFIDENCE = 0.5            # Below this: agent cannot act autonomously

    # Reliability threshold for carrier selection
    MIN_CARRIER_RELIABILITY = 0.4   # Won't auto-select a carrier below this

    @classmethod
    def evaluate_action(
        cls,
        cost: float,
        predicted_delay: float,
        confidence: float,
        carrier_reliability: float,
        is_repeat_failure: bool = False,
    ) -> dict[str, Any]:
        """
        Evaluate whether an agent action should be autonomous, recommended, or escalated.
        
        Returns:
            {
                "approval_level": ApprovalLevel,
                "reason": str,
                "requires_human": bool,
                "risk_factors": list[str],
            }
        """
        risk_factors: list[str] = []
        level = ApprovalLevel.AUTONOMOUS

        # Cost-based checks
        if cost > cls.COST_RECOMMEND_LIMIT:
            level = ApprovalLevel.ESCALATE
            risk_factors.append(f"Cost ${cost:.0f} exceeds escalation limit ${cls.COST_RECOMMEND_LIMIT:.0f}")
        elif cost > cls.COST_AUTO_LIMIT:
            level = max_level(level, ApprovalLevel.RECOMMEND)
            risk_factors.append(f"Cost ${cost:.0f} exceeds autonomous limit ${cls.COST_AUTO_LIMIT:.0f}")

        # Delay-based checks
        if predicted_delay > cls.DELAY_ESCALATE_LIMIT:
            level = max_level(level, ApprovalLevel.ESCALATE)
            risk_factors.append(f"Predicted delay {predicted_delay:.1f}hrs exceeds escalation threshold")
        elif predicted_delay > cls.DELAY_AUTO_LIMIT:
            level = max_level(level, ApprovalLevel.RECOMMEND)
            risk_factors.append(f"Predicted delay {predicted_delay:.1f}hrs requires oversight")

        # Confidence check
        if confidence < cls.MIN_CONFIDENCE:
            level = max_level(level, ApprovalLevel.RECOMMEND)
            risk_factors.append(f"ML confidence {confidence:.0%} below minimum {cls.MIN_CONFIDENCE:.0%}")

        # Carrier reliability check
        if carrier_reliability < cls.MIN_CARRIER_RELIABILITY:
            level = max_level(level, ApprovalLevel.RECOMMEND)
            risk_factors.append(f"Carrier reliability {carrier_reliability:.0%} below threshold")

        # Repeat failure escalation
        if is_repeat_failure:
            level = max_level(level, ApprovalLevel.ESCALATE)
            risk_factors.append("Repeat failure on this route — mandatory escalation")

        # Build reason string
        if level == ApprovalLevel.AUTONOMOUS:
            reason = "All parameters within safe autonomous limits."
        elif level == ApprovalLevel.RECOMMEND:
            reason = f"Agent recommends action but requires human review: {'; '.join(risk_factors)}"
        else:
            reason = f"ESCALATION REQUIRED — human must approve: {'; '.join(risk_factors)}"

        return {
            "approval_level": level.value,
            "reason": reason,
            "requires_human": level != ApprovalLevel.AUTONOMOUS,
            "risk_factors": risk_factors,
        }


def max_level(a: ApprovalLevel, b: ApprovalLevel) -> ApprovalLevel:
    """Return the stricter of two approval levels."""
    order = {ApprovalLevel.AUTONOMOUS: 0, ApprovalLevel.RECOMMEND: 1, ApprovalLevel.ESCALATE: 2}
    return a if order[a] >= order[b] else b
