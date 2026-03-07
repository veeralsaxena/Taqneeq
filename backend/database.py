"""
database.py — SQLAlchemy Postgres persistence layer for NeuroLogistics.
Connects to the Postgres+pgvector container from docker-compose.
All agent state (reputation, decisions, events) persists across restarts.
"""

import os
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    create_engine, Column, String, Float, Integer, Boolean,
    DateTime, JSON, Text, Index,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/logistics_db",
)

# Graceful fallback: if Postgres isn't running, use SQLite
try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)
    # Quick connectivity check
    with engine.connect() as conn:
        conn.execute(
            __import__("sqlalchemy").text("SELECT 1")
        )
    DB_BACKEND = "postgres"
except Exception:
    # Fallback to SQLite for hackathon demo without Docker
    engine = create_engine("sqlite:///logistics.db", connect_args={"check_same_thread": False})
    DB_BACKEND = "sqlite"

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


# ─── Table Definitions ───

class CarrierRecord(Base):
    __tablename__ = "carriers"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    reliability_score = Column(Float, default=0.8)
    base_rate_per_km = Column(Float, default=1.0)
    max_capacity = Column(Integer, default=20)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ReputationHistory(Base):
    __tablename__ = "reputation_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    carrier_id = Column(String, nullable=False, index=True)
    score = Column(Float, nullable=False)
    reason = Column(String, default="initial")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("idx_rep_carrier_ts", "carrier_id", "timestamp"),)


class DecisionLog(Base):
    __tablename__ = "decisions"
    decision_id = Column(String, primary_key=True)
    shipment_id = Column(String, nullable=False, index=True)
    negotiation_id = Column(String, index=True)
    action = Column(String, nullable=False)  # REROUTE, ESCALATED, NO_ACTION
    chosen_carrier_id = Column(String)
    predicted_delay_hours = Column(Float)
    predicted_cost = Column(Float)
    confidence = Column(Float)
    approval_level = Column(String)
    # Post-action validation
    actual_delay_hours = Column(Float, nullable=True)
    was_correct = Column(Boolean, nullable=True)
    correction_applied = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    validated_at = Column(DateTime, nullable=True)


class EventLog(Base):
    __tablename__ = "events"
    event_id = Column(String, primary_key=True)
    negotiation_id = Column(String, nullable=False, index=True)
    shipment_id = Column(String, nullable=False, index=True)
    agent_name = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, default={})
    sequence_number = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (Index("idx_event_neg_seq", "negotiation_id", "sequence_number"),)


class NegotiationLog(Base):
    __tablename__ = "negotiations"
    id = Column(String, primary_key=True)
    shipment_id = Column(String, nullable=False, index=True)
    outcome = Column(String, default="PENDING")
    chosen_carrier_id = Column(String)
    final_cost = Column(Float, default=0.0)
    delay_prediction_hours = Column(Float, default=0.0)
    guardrail_level = Column(String, default="AUTONOMOUS")
    log_entries = Column(JSON, default=[])
    bids = Column(JSON, default=[])
    route_data = Column(JSON, default={})
    reputation_updates = Column(JSON, default=[])
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RollbackRecord(Base):
    __tablename__ = "rollbacks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    decision_id = Column(String, nullable=False, index=True)
    shipment_id = Column(String, nullable=False)
    original_carrier_id = Column(String, nullable=False)
    failed_carrier_id = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    rolled_back_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    extra_penalty_applied = Column(Float, default=0.0)


# ─── Initialization ───

def init_db():
    """Create all tables. Safe to call multiple times."""
    Base.metadata.create_all(bind=engine)
    print(f"✅ Database initialized ({DB_BACKEND}): {len(Base.metadata.tables)} tables created")


def get_db() -> Session:
    """FastAPI dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_sync() -> Session:
    """Synchronous session for agent code."""
    return SessionLocal()


# ─── Helper: Persist carrier reputation ───

def persist_reputation_update(
    carrier_id: str, new_score: float, reason: str,
):
    """Save a reputation change to Postgres."""
    session = get_db_sync()
    try:
        # Update carrier
        carrier = session.query(CarrierRecord).filter_by(id=carrier_id).first()
        if carrier:
            carrier.reliability_score = new_score
            carrier.updated_at = datetime.now(timezone.utc)

        # Append history
        entry = ReputationHistory(
            carrier_id=carrier_id,
            score=new_score,
            reason=reason,
        )
        session.add(entry)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"⚠️  DB persist_reputation failed: {e}")
    finally:
        session.close()


def persist_decision(decision_data: dict[str, Any]):
    """Save a decision record to Postgres."""
    session = get_db_sync()
    try:
        record = DecisionLog(**{
            k: v for k, v in decision_data.items()
            if k in DecisionLog.__table__.columns.keys()
        })
        session.merge(record)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"⚠️  DB persist_decision failed: {e}")
    finally:
        session.close()


def persist_negotiation(neg_data: dict[str, Any]):
    """Save a negotiation record to Postgres."""
    session = get_db_sync()
    try:
        record = NegotiationLog(
            id=neg_data.get("negotiation_id", ""),
            shipment_id=neg_data.get("shipment_id", ""),
            outcome=neg_data.get("outcome", "PENDING"),
            chosen_carrier_id=neg_data.get("chosen_carrier_id"),
            final_cost=neg_data.get("final_cost", 0),
            delay_prediction_hours=neg_data.get("delay_prediction", {}).get("predicted_delay_hours", 0),
            guardrail_level=neg_data.get("guardrail_result", {}).get("approval_level", "AUTONOMOUS"),
            log_entries=neg_data.get("negotiation_log", []),
            bids=neg_data.get("bids", []),
            route_data=neg_data.get("route_data", {}),
            reputation_updates=neg_data.get("reputation_updates", []),
        )
        session.merge(record)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"⚠️  DB persist_negotiation failed: {e}")
    finally:
        session.close()


def load_carrier_reputation(carrier_id: str) -> float | None:
    """Load the latest carrier reputation from Postgres."""
    session = get_db_sync()
    try:
        carrier = session.query(CarrierRecord).filter_by(id=carrier_id).first()
        return carrier.reliability_score if carrier else None
    except Exception:
        return None
    finally:
        session.close()


def get_reputation_history(carrier_id: str, limit: int = 50) -> list[dict]:
    """Get reputation history for a carrier."""
    session = get_db_sync()
    try:
        entries = (
            session.query(ReputationHistory)
            .filter_by(carrier_id=carrier_id)
            .order_by(ReputationHistory.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [
            {"timestamp": e.timestamp.isoformat(), "score": e.score, "reason": e.reason}
            for e in entries
        ]
    except Exception:
        return []
    finally:
        session.close()
