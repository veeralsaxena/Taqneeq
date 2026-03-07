# UI/UX Screens Architecture: Autonomous Supply Chain Market

To win this hackathon, our UI cannot just be a single dashboard. We must prove to the judges that we have built a **complete Agentic Operations System**. They need to see the raw data coming in, the agents "thinking" in real-time, the economic impact, and the final real-world actions.

We propose a **Multi-Screen Application** (using Next.js + Tailwind CSS) segmented into four distinct views. Each view addresses a different phase of the **Observe → Reason → Decide → Act → Learn** loop.

---

## Screen 1: The Global Control Tower (The Main Dashboard)
*The default home screen, designed to give a high-level, cinematic view of the entire global supply chain.*

### 📍 What It Shows:
- **The "God's Eye" Map (Mapbox GL JS):** A dark-themed glowing map occupying the center. It shows all active shipments migrating along their delivery routes (like green pulsing dots). 
- **The Autonomous Market Feed:** A scrolling, terminal-like sidebar on the right. This is the heartbeat of the application. It prints out exactly what the LangGraph agents are doing in plain English (e.g., `[Shipment_101] Broadcasting Reroute Request. Budget $500.`).
- **Live System Health Metrics:** High-level KPIs (Total Active Shipments, Current Network Congestion %, Agent Action Volume).

### 🤖 Agent / Workflow Focus:
- This screen highlights the **ACT** phase.
- When an agent decides to reroute a shipment, the user instantly sees the green dot change its path line on the Mapbox visualizer, accompanied by a success ping in the Market Feed.

---

## Screen 2: Data Ingestion & Anomaly Simulator
*The interactive playground tailored for the judges. This is where we inject the chaos that forces the agents to act.*

### 📍 What It Shows:
- **Live API Feeds Matrix:** A grid showing real-time raw data streams flowing into the system. Look like a developer tool:
  - Open-Meteo Weather JSON block polling.
  - TomTom Traffic Flow Index chart.
  - EasyPost simulated container location webhooks.
- **The Chaos Panel (Disruption Testing):** A dedicated control panel with red sliders and buttons to inject artificial disruptions directly into the live data streams:
  - Set a region to "Severe Snowstorm" (Weather API override).
  - Create a "10-mile backlog" on Route 8 (Traffic API override).
  - Simulate a "Truck Breakdown Event" trigger.
- **The ML Predictor Gauge:** Located directly under the data feeds. It takes the raw data parameters and dynamically calculates the real-time `Predicted_Delay_Hours` using Scikit-learn.

### 🤖 Agent / Workflow Focus:
- This screen highlights the **OBSERVE** and **REASON** phases.
- The **Network Supervisor Agent** constantly watches these anomaly meters. By toggling the anomalies, the judges physically see the ML Predictor spike into the "Danger Zone" (>2 hours delay), forcing the Network Supervisor to trigger an alert.

---

## Screen 3: The Agentic Workflow Visualizer (React Flow)
*A deeply technical screen proving that we didn't just hard-code an LLM API call. We visualize the actual LangGraph state machine.*

### 📍 What It Shows:
- **Interactive Node Graph (React Flow):** A visual branching flowchart showing the exact LangGraph nodes defined in our Python backend. 
  - `[Network Supervisor]` → `[Carrier Agents (A, B, C)]` → `[Warehouse Agent]` → `[Shipment Agent Decision]`
- **Real-Time Node Highlighting:** As a live negotiation happens, the nodes genuinely light up and pulse. Data packets (small animated dots) physically travel between the nodes.
- **Agent Inspector Modal:** Clicking on any Node (Agent) pauses it and opens an inspector pane. You can see the exact "Prompt/Context" currently in that agent's LLM memory, demonstrating its unique Utility Function and current constraints.

### 🤖 Agent / Workflow Focus:
- This screen highlights the **DECIDE** phase.
- Here, the judges witness the actual multi-agent negotiation. They see the Carrier Agents bidding against each other simultaneously, the Warehouse rejecting a bid, and the Shipment Agent making the final utility calculation.

---

## Screen 4: Network Economics & Carrier Reputation Analytics
*The system doesn't just act; it learns. This screen proves the economic viability and learning loop of the market.*

### 📍 What It Shows:
- **Carrier Trust Score Leaderboard:** A ranked table of all delivery partners (`carrier_a`, `carrier_b`, `carrier_c`). Shows their dynamic SLA Reliability Scores (0.0 to 1.0) and their average bid win rates.
- **The Trust Evolution Chart (Tremor Library):** A line graph showing how a specific partner's reputation has decreased or increased over the last week based on actual delivery outcomes.
- **Financial Savings Impact Widget:** A dollar value indicating how much capital the Shipment Agents have saved by opting for cheaper, reliable carriers rather than defaulting to expensive emergency freight.

### 🤖 Agent / Workflow Focus:
- This screen highlights the **LEARN** phase.
- Handled by the **Learning Agent (Memory).** If a judge injects an anomaly that forces `carrier_a` to fail an SLA, they will flip to this screen and watch `carrier_a`'s reputation score literally drop, meaning the Shipment Agent will avoid them in the next negotiation loop.

---

## 🧭 The UI Navigation Flow Example (The Hackathon Pitch)

1. Start on **Screen 1 (Control Tower)** to show the smooth, normal state of logistics.
2. Navigate to **Screen 2 (Simulator)**. "Let's introduce a Hurricane using our Weather API hooks." Hit the button.
3. Rapidly click to **Screen 3 (Workflow Visualizer)**. Show the judges the graph going crazy as the agents wake up, talk to each other, and negotiate a new cheaper carrier outside the hurricane path.
4. Back to **Screen 1 (Control Tower)**. They see the map dynamically redraw the shipment's route.
5. End on **Screen 4 (Economics)**. "And as you can see, the carrier who was trapped in the hurricane took a small reputation hit. The system learned."
