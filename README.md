<p align="center">
  <h1 align="center">🚀 NeuroLogistics</h1>
  <p align="center"><strong>Autonomous Multi-Agent Supply Chain Operations Layer</strong></p>
  <p align="center">
    <em>Team Orion — B042</em><br/>
    <strong>Veeral Saxena</strong> · <strong>Srishtee Varule</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/LangGraph-State_Machine-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Gemini_2.0-Flash-4285F4?style=for-the-badge&logo=google" />
  <img src="https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=for-the-badge&logo=scikit-learn" />
  <img src="https://img.shields.io/badge/Next.js-Frontend-000?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi" />
</p>

---

## 📋 Problem Statement

**Problem 2: Agentic AI for Logistics & Supply Chain Operations**

> "Every day, thousands of shipments move across regions, each with dependencies on inventory availability, routing decisions, partner reliability, and time constraints. Delays rarely come from a single failure; they emerge gradually from small disruptions. I need a system that doesn't just report issues, but **actively reasons about them and intervenes early.**"

## 💡 Our Solution

NeuroLogistics is an **intelligent operations layer** that continuously observes shipment flows, reasons about emerging risks using ML + LLM, and autonomously intervenes before SLAs are breached.

The system follows a strict **Observe → Reason → Decide → Act → Learn** loop orchestrated by Google's LangGraph framework.

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVE → REASON → DECIDE → ACT → LEARN     │
│                                                                 │
│  🔍 Supervisor ──→ 💰 Carriers + 🏭 Warehouse ──→ 📦 Shipment ──→ 🧠 Learning │
│     (ML + APIs)       (sealed-bid auction)         (guardrails)    (reputation) │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ Architecture

### 5 Specialized AI Agents

| Agent | Role | Data Sources |
|-------|------|-------------|
| **Network Supervisor** | Monitors routes, predicts delays via ML, triggers negotiations | Open-Meteo API, TomTom Traffic API, Random Forest model |
| **Carrier Agents (×5)** | Compete in sealed-bid auctions with dynamic pricing | Fleetbase API, Karrio SDK |
| **Warehouse Agent** | Validates hub capacity, prevents cascading failures | Internal capacity database |
| **Shipment Agent** | Picks best bid via utility function, enforces 3-tier guardrails | All bids + guardrail policy |
| **Learning Agent** | Updates carrier reputation, generates strategic insights | PostgreSQL, Gemini LLM |

### 3-Tier Guardrail System

| Level | Condition | Action |
|-------|-----------|--------|
| 🟢 **AUTONOMOUS** | Cost < $500, Delay < 4h | Agent executes immediately |
| 🟡 **RECOMMEND** | Cost $500–$2,000 | Agent recommends, human reviews |
| 🔴 **ESCALATE** | Cost > $2,000, Delay > 8h | Slack Block Kit alert sent to human dispatcher |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Orchestration** | LangGraph (compiled StateGraph) |
| **LLM** | Gemini 2.0 Flash (domain-tuned with 1,500-char logistics system prompt) |
| **ML Model** | Scikit-Learn Random Forest (R² ≈ 0.93, 6 features, 2ms inference) |
| **Backend** | FastAPI (async, WebSocket streaming) |
| **Frontend** | Next.js 14 + Framer Motion + Tailwind CSS |
| **Database** | PostgreSQL (event store + reputation) |
| **Cache/PubSub** | Redis (real-time event broadcasting) |
| **Containerization** | Docker + Docker Compose |
| **Weather** | Open-Meteo API (free, no key needed) |
| **Traffic** | TomTom Traffic Flow API |
| **Shipping Rates** | Karrio SDK (multi-carrier aggregation) |
| **Fleet Tracking** | Fleetbase API |
| **SMS Alerts** | Twilio (simulation mode with full payload logging) |
| **Escalation** | Slack Block Kit (interactive Approve/Reject buttons) |
| **PDF Generation** | ReportLab (auto-generated dispatch orders) |
| **LLM Safety** | Custom PII filter + hallucination check + domain relevance validator |

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Google Gemini API Key** ([Get one free](https://aistudio.google.com/apikey))

### 1. Clone & Configure

```bash
git clone https://github.com/veeralsaxena/Taqneeq.git
cd Taqneeq

# Set your Gemini API key
echo "GOOGLE_API_KEY=your_key_here" > backend/.env
```

### 2. Run with Docker

```bash
docker compose up --build
```

This starts:
- **Backend** (FastAPI) → `http://localhost:8000`
- **Frontend** (Next.js) → `http://localhost:3000`
- **PostgreSQL** → port 5432
- **Redis** → port 6379

### 3. Run Locally (without Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📱 Pages

| Page | URL | Description |
|------|-----|-------------|
| **Landing Page** | `/` | 12-slide horizontal pitch deck covering all 7 judging criteria |
| **Control Tower** | `/dashboard` | Live operational dashboard with KPIs, map, shipments, carrier trust scores |
| **Workflow Visualizer** | `/workflow` | Interactive LangGraph execution viewer with agent log streaming |
| **Analytics** | `/analytics` | Decision accuracy, cost savings, carrier performance metrics |
| **Simulator** | `/simulator` | Chaos engineering panel to inject disruptions and test agent responses |

## 🔄 How It Works (Live Demo Flow)

1. **Inject Disruption** — Click "Inject Snowstorm" on the Dashboard or Workflow page
2. **Supervisor Detects** — Open-Meteo returns weather code 95 (thunderstorm), TomTom returns congestion 0.71
3. **ML Predicts** — Random Forest predicts 7.4 hours delay with 89% confidence → CRITICAL risk
4. **RFQ Broadcast** — 4 carrier agents receive the Request for Quote (failing carrier excluded)
5. **Sealed Bids** — Each carrier calculates `base_rate × distance × (1 + weather_severity × 0.5)`
6. **Warehouse Check** — Hub Beta at 44% occupancy → MODERATE → ✅ Accepted
7. **Utility Score** — `price_score + time_score - reliability_bonus` → Swift Transport wins at $415
8. **Guardrails** — $415 < $500 autonomous limit → ✅ AUTONOMOUS ACTION APPROVED
9. **Execution** — PDF dispatch generated, Twilio SMS sent, WebSocket broadcast to Control Tower
10. **Learning** — Express Logistics penalized (95% → 85%), Swift Transport rewarded (+1%)

## 🧪 What Makes This Agentic (Not Just a Script)

| Capability | Why It Can't Be Hardcoded |
|-----------|--------------------------|
| **LLM Reasoning** | Gemini writes novel, situation-specific disruption assessments |
| **ML Prediction** | Random Forest interpolates across 6 features — not a lookup table |
| **Dynamic Pricing** | Carrier bids change based on live weather × distance × load |
| **Self-Improvement** | Carrier reputation evolves autonomously; bad carriers get priced out |
| **Game Theory** | Competing agent goals create emergent behavior (cheap vs. reliable vs. capacity) |

## 📁 Project Structure

```
taqneeq/
├── backend/
│   ├── main.py              # FastAPI server + WebSocket + all API routes
│   ├── agents.py            # LangGraph state machine with 5 agent nodes
│   ├── ml_predictor.py      # Random Forest delay prediction
│   ├── delay_predictor.joblib # Pre-trained ML model
│   ├── llm_reasoning.py     # Gemini 2.0 Flash integration
│   ├── llm_safety.py        # PII filter + hallucination check
│   ├── domain_tuning.py     # 1,500-char logistics system prompt
│   ├── guardrails.py        # 3-tier approval policy engine
│   ├── carrier_rates.py     # Karrio SDK multi-carrier rates
│   ├── fleetbase_client.py  # Fleet tracking integration
│   ├── automation_engine.py # Twilio SMS + Slack + PDF dispatch
│   ├── event_store.py       # Immutable event-sourced audit log
│   ├── decision_tracker.py  # Accuracy tracking + false positive detection
│   ├── rollback.py          # Pre-action snapshots + auto-rollback
│   ├── tools.py             # Open-Meteo + TomTom API wrappers
│   ├── database.py          # PostgreSQL + carrier reputation persistence
│   ├── redis_client.py      # Redis pub/sub for real-time events
│   └── ws_manager.py        # WebSocket connection manager
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx          # 12-slide horizontal pitch deck
│   │   ├── dashboard/        # Control Tower with live map
│   │   ├── workflow/         # LangGraph agent workflow visualizer
│   │   ├── analytics/        # Business impact analytics
│   │   └── simulator/        # Chaos engineering panel
│   └── src/components/       # Reusable UI components
├── docker-compose.yml        # Full-stack orchestration
└── README.md
```

## 👥 Team Orion — B042

| Member | Role |
|--------|------|
| **Veeral Saxena** | Full-Stack Development, AI/ML Pipeline, System Architecture |
| **Srishtee Varule** | UI/UX Design, Frontend Development, Presentation |

---

<p align="center">
  Built with ❤️ for the Taqneeq Hackathon<br/>
  <strong>Observe → Reason → Decide → Act → Learn</strong>
</p>
