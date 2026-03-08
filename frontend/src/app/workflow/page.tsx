"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  GitBranch,
  Play,
  Eye,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Zap,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Truck,
  RotateCcw,
  Terminal,
  AlertTriangle,
  MessageSquare,
  Phone,
  FileText,
  Settings2,
  BarChart3,
  History,
  Sparkles,
  X,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Bot,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ─── Agent ↔ Node mapping ───
const AGENT_NODE_MAP: Record<string, string> = {
  "Network Supervisor": "supervisor",
  "Supervisor": "supervisor",
  "Carrier": "carriers",
  "Express Logistics": "carriers",
  "Budget Freight": "carriers",
  "Premium Haulers": "carriers",
  "Swift Transport": "carriers",
  "Eco Movers": "carriers",
  "Warehouse": "warehouse",
  "Shipment": "shipment",
  "Guardrails": "shipment",
  "Gemini": "shipment",
  "Rollback": "shipment",
  "Learning Agent": "learning",
};

const nodeColors: Record<string, string> = {
  observer: "#3b82f6",
  bidder: "#22d3ee",
  gatekeeper: "#a78bfa",
  decider: "#34d399",
  memory: "#f59e0b",
};

function detectAgent(log: string): string | null {
  for (const [keyword, nodeId] of Object.entries(AGENT_NODE_MAP)) {
    if (log.includes(`[${keyword}`)) return nodeId;
  }
  return null;
}

// ─── Custom ReactFlow Node ───
function AgentNode({ data }: { data: any }) {
  const color = nodeColors[data.type] || "#666";
  const isActive = data.active;
  const isCompleted = data.completed;

  return (
    <div
      className={`rounded-xl border-2 px-4 py-2.5 min-w-[180px] transition-all duration-500 ${
        isActive ? "scale-110" : ""
      }`}
      style={{
        background: isActive ? `${color}15` : "#111",
        borderColor: isActive ? color : isCompleted ? `${color}60` : "#333",
        boxShadow: isActive
          ? `0 0 40px ${color}50, 0 0 80px ${color}20`
          : isCompleted
          ? `0 0 15px ${color}20`
          : "none",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div className="flex items-center gap-2 mb-0.5">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: isActive || isCompleted ? color : "#444" }} />
          {isActive && (
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping" style={{ background: color, opacity: 0.5 }} />
          )}
        </div>
        <span className="text-xs font-bold text-white">{data.label}</span>
        {data.guardrail && (
          <div className="ml-auto">
            {data.guardrail === "AUTONOMOUS" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
            {data.guardrail === "RECOMMEND" && <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />}
            {data.guardrail === "ESCALATE" && <ShieldX className="w-3.5 h-3.5 text-rose-400" />}
          </div>
        )}
      </div>
      <p className="text-[9px] text-neutral-500">{data.description}</p>
      <p className="text-[8px] mt-0.5 uppercase tracking-wider font-mono" style={{ color: isActive || isCompleted ? color : "#555" }}>
        {data.type}
      </p>
      {isActive && (
        <div className="mt-1 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[8px] text-cyan-400 font-mono">PROCESSING...</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

// ─── Tabs ───
type TabId = "live" | "impact" | "history" | "config";

// ─── Main Component ───
export default function WorkflowPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [running, setRunning] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [demoResult, setDemoResult] = useState<any>(null);
  const [phase, setPhase] = useState<string>("idle");
  const [activeTab, setActiveTab] = useState<TabId>("live");
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationData, setEscalationData] = useState<any>(null);
  const [replayNeg, setReplayNeg] = useState<any>(null);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [savings, setSavings] = useState<any>(null);
  const [allResults, setAllResults] = useState<any[]>([]);
  const hasMounted = useRef(false);

  // ─── Restore from sessionStorage AFTER mount (avoids hydration mismatch) ───
  useEffect(() => {
    try {
      const savedLogs = sessionStorage.getItem("wf_logs");
      const savedResult = sessionStorage.getItem("wf_result");
      const savedPhase = sessionStorage.getItem("wf_phase");
      const savedAll = sessionStorage.getItem("wf_allResults");
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (parsed.length > 0) setLogEntries(parsed);
      }
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        if (parsed) setDemoResult(parsed);
      }
      if (savedPhase && savedPhase !== "streaming" && savedPhase !== "negotiating" && savedPhase !== "disrupting") {
        setPhase(savedPhase);
      }
      if (savedAll) {
        const parsed = JSON.parse(savedAll);
        if (parsed.length > 0) setAllResults(parsed);
      }
    } catch {}
    // Mark as mounted AFTER restore is done so persist effect doesn't clobber
    hasMounted.current = true;
  }, []);
  const logRef = useRef<HTMLDivElement>(null);

  // ─── Persist state to sessionStorage (only after initial restore) ───
  useEffect(() => {
    if (!hasMounted.current) return; // Skip the first render to avoid overwriting restored data
    try {
      sessionStorage.setItem("wf_logs", JSON.stringify(logEntries));
      sessionStorage.setItem("wf_result", JSON.stringify(demoResult));
      sessionStorage.setItem("wf_phase", phase === "streaming" || phase === "negotiating" || phase === "disrupting" ? "idle" : phase);
      sessionStorage.setItem("wf_allResults", JSON.stringify(allResults));
    } catch {}
  }, [logEntries, demoResult, phase, allResults]);

  // Guardrail config (Priority 6)
  const [config, setConfig] = useState({
    costAutoLimit: 500,
    costEscalateLimit: 2000,
    delayAutoLimit: 4.0,
    delayEscalateLimit: 8.0,
    minConfidence: 0.5,
    minCarrierReliability: 0.4,
  });

  // ─── Fetch graph & negotiations ───
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const r = await axios.get(`${API}/graph`);
        const positions: Record<string, { x: number; y: number }> = {
          supervisor: { x: 250, y: 0 },
          carriers: { x: 50, y: 180 },
          warehouse: { x: 450, y: 180 },
          shipment: { x: 250, y: 360 },
          learning: { x: 250, y: 520 },
        };
        setNodes(
          r.data.nodes.map((n: any) => ({
            id: n.id,
            type: "agentNode",
            position: positions[n.id] || { x: 0, y: 0 },
            data: { ...n, active: false, completed: false, guardrail: null },
          }))
        );
        setEdges(
          r.data.edges.map((e: any, i: number) => ({
            id: `e-${i}`,
            source: e.source,
            target: e.target,
            label: e.label,
            animated: false,
            style: { stroke: "#333", strokeWidth: 2 },
            labelStyle: { fill: "#666", fontSize: 9 },
          }))
        );
      } catch {}
    };
    fetchGraph();
    fetchNegotiations();
    fetchSavings();
  }, []);

  const fetchNegotiations = async () => {
    try {
      const r = await axios.get(`${API}/negotiations`);
      setNegotiations(r.data.negotiations || []);
    } catch {}
  };

  const fetchSavings = async () => {
    try {
      const r = await axios.get(`${API}/analytics/savings`);
      setSavings(r.data);
    } catch {}
  };

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logEntries]);

  // ─── Node control helpers ───
  const activateNode = useCallback((nodeId: string | null, guardrail?: string) => {
    setActiveNodeId(nodeId);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          active: n.id === nodeId,
          completed: n.id !== nodeId && n.data.completed,
          guardrail: n.id === "shipment" && guardrail ? guardrail : n.data.guardrail,
        },
      }))
    );
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        animated: e.source === nodeId || e.target === nodeId,
        style: {
          stroke: e.source === nodeId || e.target === nodeId ? "#22d3ee" : "#333",
          strokeWidth: e.source === nodeId || e.target === nodeId ? 3 : 2,
        },
      }))
    );
  }, []);

  const completeNode = useCallback((nodeId: string) => {
    setCompletedNodes((prev) => new Set([...prev, nodeId]));
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, active: false, completed: n.id === nodeId || n.data.completed },
      }))
    );
  }, []);

  const resetGraph = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) => ({ ...n, data: { ...n.data, active: false, completed: false, guardrail: null } }))
    );
    setEdges((prev) =>
      prev.map((e) => ({ ...e, animated: false, style: { stroke: "#333", strokeWidth: 2 } }))
    );
    setCompletedNodes(new Set());
    setActiveNodeId(null);
  }, []);

  // ─── Stream log entries ───
  const streamLogs = useCallback(
    async (logs: string[], result: any) => {
      setPhase("streaming");
      let lastNode: string | null = null;

      for (let i = 0; i < logs.length; i++) {
        const entry = logs[i];
        const detectedNode = detectAgent(entry);

        if (detectedNode && detectedNode !== lastNode) {
          if (lastNode) completeNode(lastNode);
          let guardrail: string | undefined;
          if (entry.includes("[Guardrails")) {
            if (entry.includes("✅")) guardrail = "AUTONOMOUS";
            else if (entry.includes("RECOMMEND")) guardrail = "RECOMMEND";
            else if (entry.includes("ESCALATION")) guardrail = "ESCALATE";
          }
          activateNode(detectedNode, guardrail);
          lastNode = detectedNode;
        }

        // Detect guardrail lines
        if (entry.includes("[Guardrails")) {
          let g = "AUTONOMOUS";
          if (entry.includes("RECOMMEND")) g = "RECOMMEND";
          if (entry.includes("ESCALATION")) g = "ESCALATE";
          setNodes((prev) =>
            prev.map((n) => ({
              ...n,
              data: { ...n.data, guardrail: n.id === "shipment" ? g : n.data.guardrail },
            }))
          );
          // Show escalation modal if ESCALATE
          if (g === "ESCALATE") {
            setEscalationData({
              shipment_id: result.shipment_id,
              cost: result.final_cost || result.bids?.[0]?.quoted_price || 0,
              delay: result.delay_prediction?.predicted_delay_hours || 0,
              reason: entry,
              bids: result.bids || [],
            });
            setShowEscalationModal(true);
          }
        }

        setLogEntries((prev) => [...prev, entry]);
        const delay = entry.includes("ALERT") || entry.includes("SUCCESS") || entry.includes("ESCALATION")
          ? 1200
          : entry.includes("Gemini")
          ? 1000
          : 600;
        await new Promise((r) => setTimeout(r, delay));
      }

      if (lastNode) completeNode(lastNode);
      setDemoResult(result);
      setAllResults((prev) => [...prev, result]);
      setPhase("complete");
      fetchNegotiations();
      fetchSavings();
    },
    [activateNode, completeNode]
  );

  // ─── Pre-cached fallback demo (for when backend is slow or unreachable) ───
  const FALLBACK_DEMO = {
    status: "demo_complete",
    shipment_id: "SHIP-001",
    shipment_route: "Factory A → Retailer B",
    disruption: { type: "SNOWSTORM", severity: 0.9, affected_carrier: "carrier_a" },
    outcome: "SUCCESS",
    chosen_carrier_id: "carrier_d",
    final_cost: 340.0,
    delay_prediction: { predicted_delay_hours: 8.5, risk_level: "CRITICAL", confidence: 0.89 },
    bids: [
      { carrier_id: "carrier_b", carrier_name: "Budget Freight", quoted_price: 385.50, estimated_delivery_hours: 14.2, reliability: 0.78 },
      { carrier_id: "carrier_c", carrier_name: "Premium Haulers", quoted_price: 520.00, estimated_delivery_hours: 6.8, reliability: 0.99 },
      { carrier_id: "carrier_d", carrier_name: "Swift Transport", quoted_price: 340.00, estimated_delivery_hours: 10.5, reliability: 0.85 },
      { carrier_id: "carrier_e", carrier_name: "Eco Movers", quoted_price: 410.75, estimated_delivery_hours: 16.0, reliability: 0.70 },
    ],
    guardrail_result: { approval_level: "AUTONOMOUS", requires_human: false, reason: "All parameters within safe limits" },
    negotiation_log: [
      "[Network Supervisor] 🔍 Scanning route: Factory A → Retailer B",
      "[Network Supervisor] 🌤️ Weather API: severity=0.9, traffic=0.85, type=SNOWSTORM",
      "[Network Supervisor] 🧠 ML Prediction: 8.5hrs delay (risk=CRITICAL, confidence=89%)",
      "[Network Supervisor] ⚠️ ALERT: Predicted 8.5hrs delay due to SNOWSTORM! Initiating multi-agent negotiation.",
      "[Gemini 🤖] The severe snowstorm (0.9 severity) combined with 0.85 traffic congestion creates a cascading delay risk on the Delhi–Bangalore corridor. Express Logistics (carrier_a) has a strong 95% reliability record, but weather conditions render the primary route unsafe. Immediate reroute through alternative carriers is critical to meeting the SLA window.",
      "[Shipment SHIP-001] 📢 Broadcasting RFQ to all available carriers...",
      "[Budget Freight] 💰 Bid: $385.50 | ETA: 14.2hrs | Rep: 78% | Trucks: 3",
      "[Premium Haulers] 💰 Bid: $520.00 | ETA: 6.8hrs | Rep: 99% | Trucks: 5",
      "[Swift Transport] 💰 Bid: $340.00 | ETA: 10.5hrs | Rep: 85% | Trucks: 4",
      "[Eco Movers] 💰 Bid: $410.75 | ETA: 16.0hrs | Rep: 70% | Trucks: 2",
      "[Warehouse Retailer B] 🟢 Capacity: 62% | Status: normal | Accepting: Yes",
      "[Guardrails 🛡️] ✅ All parameters within safe limits. Autonomous action approved.",
      "[Shipment SHIP-001] 🤝 NEGOTIATION SUCCESS: Selected Swift Transport for $340.00 (ETA: 10.5hrs)",
      "[Shipment SHIP-001] 📊 Runner-up was Budget Freight at $385.50. Won due to better utility score.",
      "[Gemini 🤖] Swift Transport was selected because it offers the optimal balance: $340 is 34% under budget, 10.5hr ETA is acceptable given the disruption severity, and its 85% reliability exceeds the minimum threshold. Premium Haulers was faster but $520 triggered cost concern. Budget Freight was cheaper per hour but lower reliability created risk.",
      "[Learning Agent] 📉 Express Logistics reputation: 95% → 81% (disruption penalty)",
      "[Learning Agent] 📈 Swift Transport reputation: 85% → 86% (successful delivery bonus)",
      "[Gemini 🤖] Key Insight: Carriers with reliability below 80% are increasingly being outbid. The market is self-correcting toward quality. Recommend monitoring Budget Freight for potential exclusion if reliability drops below 75%.",
      "[Rollback 🔄] Pre-action snapshot saved. Rollback available for decision a1b2c3d4.",
    ],
  };

  // ─── SIMULATE FLOW ───
  const runDemo = async () => {
    setRunning(true);
    setLogEntries([]);
    setDemoResult(null);
    setPhase("disrupting");
    setActiveTab("live");
    resetGraph();

    setLogEntries(["[System] 🔴 Injecting severe snowstorm disruption (severity 90%)..."]);
    await new Promise((r) => setTimeout(r, 1200));
    setLogEntries((prev) => [...prev, "[System] ❄️ Snowstorm on primary route. Triggering multi-agent negotiation..."]);
    await new Promise((r) => setTimeout(r, 800));
    setPhase("negotiating");
    
    const loadingMessage = "[System] ⏳ Agents negotiating via Gemini LLM...";
    setLogEntries((prev) => [
      ...prev,
      "[System] ⚡ LangGraph state machine invoked — 5-agent pipeline starting...",
      "─────────────────────────────────────────",
      loadingMessage,
    ]);
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Race: real backend call vs 12-second timeout
      const backendCall = axios.post(`${API}/demo/simulate`);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), 12000)
      );
      const response = await Promise.race([backendCall, timeout]) as any;
      setLogEntries((prev) => prev.filter(e => e !== loadingMessage));
      await streamLogs(response.data.negotiation_log || [], response.data);
    } catch (err: any) {
      // Fallback to pre-cached demo data — demo ALWAYS works
      console.warn("Backend slow/unavailable, using cached demo:", err?.message);
      setLogEntries((prev) => [
        ...prev.filter(e => e !== loadingMessage),
        "[System] ⚡ Using cached agent pipeline result...",
      ]);
      await new Promise((r) => setTimeout(r, 400));
      await streamLogs(FALLBACK_DEMO.negotiation_log, FALLBACK_DEMO);
    } finally {
      setRunning(false);
    }
  };

  // ─── REPLAY (Priority 5) ───
  const startReplay = async (neg: any) => {
    setReplayNeg(neg);
    setReplayIdx(0);
    setReplayPlaying(true);
    setActiveTab("live");
    setLogEntries([]);
    setDemoResult(null);
    setPhase("streaming");
    resetGraph();

    const logs = neg.log || [];
    let lastNode: string | null = null;

    for (let i = 0; i < logs.length; i++) {
      if (!replayPlaying) break; // Allow stopping
      const entry = logs[i];
      const detectedNode = detectAgent(entry);
      if (detectedNode && detectedNode !== lastNode) {
        if (lastNode) completeNode(lastNode);
        activateNode(detectedNode);
        lastNode = detectedNode;
      }
      setLogEntries((prev) => [...prev, entry]);
      setReplayIdx(i);
      await new Promise((r) => setTimeout(r, 500));
    }
    if (lastNode) completeNode(lastNode);
    setPhase("complete");
    setReplayPlaying(false);
    setDemoResult({
      outcome: neg.outcome,
      shipment_id: neg.shipment_id,
      final_cost: neg.final_cost,
      delay_prediction: { predicted_delay_hours: neg.delay_prediction_hours },
      bids: neg.bids,
      chosen_carrier_id: neg.chosen_carrier_id,
    });
  };

  const resetDemo = () => {
    setPhase("idle");
    setLogEntries([]);
    setDemoResult(null);
    setReplayNeg(null);
    resetGraph();
  };

  // ─── Tab content ───
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "live", label: "Live Agent Log", icon: Terminal },
    { id: "impact", label: "Impact Dashboard", icon: BarChart3 },
    { id: "history", label: "Replay History", icon: History },
    { id: "config", label: "Guardrail Config", icon: Settings2 },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <GitBranch className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              Agent Workflow Visualizer
              {phase !== "idle" && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                  phase === "complete" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 animate-pulse"
                }`}>
                  {phase === "disrupting" ? "INJECTING DISRUPTION"
                   : phase === "negotiating" ? "CALLING LANGGRAPH"
                   : phase === "streaming" ? "AGENTS ACTIVE"
                   : "NEGOTIATION COMPLETE"}
                </span>
              )}
            </h1>
            <span className="text-[10px] text-neutral-600">
              Real LangGraph State Machine • Gemini LLM Reasoning • Human-in-the-Loop Guardrails
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === "complete" && (
            <button onClick={resetDemo} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
          <button onClick={runDemo} disabled={running}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 ${
              running ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-400 hover:to-cyan-400 shadow-lg shadow-purple-500/25"
            }`}>
            {running ? (
              <><div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> Agents Running...</>
            ) : (
              <><Play className="w-4 h-4" /> Simulate Flow</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ═══ LEFT: ReactFlow Graph ═══ */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-neutral-800 rounded-xl overflow-hidden" style={{ height: 620 }}>
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView
            proOptions={{ hideAttribution: true }} style={{ background: "#0a0a0a" }}>
            <Background color="#1a1a1a" gap={20} />
            <Controls style={{ background: "#111", border: "1px solid #333", borderRadius: 8 }} />
            <MiniMap style={{ background: "#111" }} nodeColor="#333" maskColor="#0a0a0a80" />
          </ReactFlow>
        </div>

        {/* ═══ CENTER: Tabbed Panel ═══ */}
        <div className="lg:col-span-4 flex flex-col gap-0" style={{ height: 620 }}>
          {/* Tab bar */}
          <div className="flex bg-[#0a0a0a] border border-neutral-800 rounded-t-xl overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    activeTab === tab.id ? "text-cyan-400 bg-cyan-500/5 border-b-2 border-cyan-400" : "text-neutral-600 hover:text-neutral-400"
                  }`}>
                  <Icon className="w-3 h-3" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 bg-[#0a0a0a] border border-t-0 border-neutral-800 rounded-b-xl overflow-hidden">
            {/* ── Live Agent Log ── */}
            {activeTab === "live" && (
              <div className="h-full flex flex-col">
                <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px]">
                  {logEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-700">
                      <Bot className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-xs">Click &quot;Simulate Flow&quot; to trigger the pipeline</p>
                      <p className="text-[10px] mt-1 text-neutral-800">
                        Real agents • Gemini reasoning • Live guardrails
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {logEntries.map((entry, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}
                          className={`leading-relaxed py-0.5 ${
                            entry.includes("─────") ? "text-neutral-800 text-[9px]"
                            : entry.includes("🔴") || entry.includes("❌") || entry.includes("ESCALATION") ? "text-rose-400"
                            : entry.includes("✅") || entry.includes("SUCCESS") ? "text-emerald-400"
                            : entry.includes("⚠️") || entry.includes("ALERT") ? "text-amber-400"
                            : entry.includes("Gemini 🤖") ? "text-blue-400 italic"
                            : entry.includes("Guardrails 🛡️") ? "text-purple-400"
                            : entry.includes("💰") || entry.includes("Bid") ? "text-cyan-400"
                            : entry.includes("[System]") ? "text-neutral-400"
                            : "text-neutral-500"
                          }`}>
                          {entry}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {/* Result Summary */}
                <AnimatePresence>
                  {demoResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`border-t p-3 ${
                        demoResult.outcome === "SUCCESS" ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-rose-500/30 bg-rose-500/5"
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          {demoResult.outcome === "SUCCESS" ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldX className="w-3.5 h-3.5 text-rose-400" />}
                          {demoResult.outcome === "SUCCESS" ? "Negotiation Resolved" : "Escalated to Human"}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${
                          demoResult.outcome === "SUCCESS" ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30"
                        }`}>{demoResult.outcome}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[10px]">
                        <div className="bg-black/40 rounded-lg p-2 text-center">
                          <Clock className="w-3 h-3 text-amber-400 mx-auto mb-0.5" />
                          <p className="text-amber-400 font-bold">{demoResult.delay_prediction?.predicted_delay_hours?.toFixed(1) || "—"}h</p>
                          <p className="text-neutral-600">Delay</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-2 text-center">
                          <DollarSign className="w-3 h-3 text-emerald-400 mx-auto mb-0.5" />
                          <p className="text-emerald-400 font-bold">${demoResult.final_cost?.toFixed(0) || "—"}</p>
                          <p className="text-neutral-600">Cost</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-2 text-center">
                          <Shield className="w-3 h-3 text-purple-400 mx-auto mb-0.5" />
                          <p className={`font-bold ${
                            demoResult.guardrail_result?.approval_level === "AUTONOMOUS" ? "text-emerald-400"
                            : demoResult.guardrail_result?.approval_level === "RECOMMEND" ? "text-yellow-400"
                            : "text-rose-400"
                          }`}>{demoResult.guardrail_result?.approval_level || "—"}</p>
                          <p className="text-neutral-600">Guard</p>
                        </div>
                        <div className="bg-black/40 rounded-lg p-2 text-center">
                          <Truck className="w-3 h-3 text-cyan-400 mx-auto mb-0.5" />
                          <p className="text-cyan-400 font-bold text-[9px]">{demoResult.bids?.length || 0} bids</p>
                          <p className="text-neutral-600">Carrier</p>
                        </div>
                      </div>
                      {/* Bids */}
                      {demoResult.bids?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {demoResult.bids.map((bid: any, i: number) => (
                            <div key={i} className={`flex justify-between text-[10px] px-2 py-1 rounded ${
                              bid.carrier_id === demoResult.chosen_carrier_id
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                : "text-neutral-600"
                            }`}>
                              <span>{bid.carrier_name || bid.carrier_id} {bid.carrier_id === demoResult.chosen_carrier_id ? "✓" : ""}</span>
                              <span className="font-mono">${bid.quoted_price?.toFixed(0)} • {bid.estimated_delivery_hours?.toFixed(1)}h</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Impact Dashboard (Priority 4) ── */}
            {activeTab === "impact" && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold">Business Impact Summary</h3>
                </div>

                {/* Aggregate Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-400">${savings?.estimated_savings?.toFixed(0) || "0"}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Total Estimated Savings</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
                    <Brain className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-400">{savings?.total_negotiations || 0}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Negotiations Executed</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-cyan-400">{savings?.successful || 0}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Auto-Resolved</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 rounded-xl p-4 text-center">
                    <ShieldAlert className="w-6 h-6 text-rose-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-rose-400">{savings?.escalated || 0}</p>
                    <p className="text-[10px] text-neutral-500 mt-1">Required Human</p>
                  </div>
                </div>

                {/* Per-negotiation before/after */}
                {allResults.length > 0 && (
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Before / After Comparison</p>
                    {allResults.slice(-5).reverse().map((r, i) => (
                      <div key={i} className="bg-[#111] border border-neutral-800 rounded-lg p-3 mb-2">
                        <div className="flex items-center gap-2 text-[11px] mb-2">
                          <span className="text-neutral-400 font-mono">{r.shipment_id}</span>
                          <span className="text-[9px] text-neutral-600">{r.shipment_route}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <div className="flex-1 bg-rose-500/5 border border-rose-500/20 rounded-lg p-2 text-center">
                            <p className="text-neutral-500 text-[9px]">BEFORE</p>
                            <p className="text-rose-400 font-bold">{r.delay_prediction?.predicted_delay_hours?.toFixed(1)}h delay</p>
                            <p className="text-neutral-600">Original carrier failing</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                          <div className="flex-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 text-center">
                            <p className="text-neutral-500 text-[9px]">AFTER</p>
                            <p className="text-emerald-400 font-bold">${r.final_cost?.toFixed(0)} reroute</p>
                            <p className="text-neutral-600">{r.outcome === "SUCCESS" ? "Auto-resolved" : "Escalated"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {allResults.length === 0 && !savings?.total_negotiations && (
                  <div className="text-center text-neutral-700 mt-10">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Run simulations to see impact data</p>
                  </div>
                )}

                {/* Automation status */}
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Native Automations Status</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: MessageSquare, label: "Slack Block Kit Escalation", status: "Simulation Mode", desc: "Logs payload when ESCALATE guardrail triggers" },
                      { icon: Phone, label: "Twilio SMS Alerts", status: "Simulation Mode", desc: "Logs SMS body on CRITICAL risk detection" },
                      { icon: FileText, label: "PDF Dispatch Generation", status: "Active", desc: "Auto-generates Bill of Lading PDFs on reroute" },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#111] border border-neutral-800 rounded-lg p-2.5">
                        <a.icon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-neutral-300 font-medium">{a.label}</p>
                          <p className="text-[9px] text-neutral-600 truncate">{a.desc}</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border flex-shrink-0 ${
                          a.status === "Active" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                        }`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Replay History (Priority 5) ── */}
            {activeTab === "history" && (
              <div className="h-full overflow-y-auto p-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold">Negotiation Replay</h3>
                  <span className="ml-auto text-[9px] text-neutral-600 font-mono">{negotiations.length} records</span>
                </div>
                {negotiations.length === 0 ? (
                  <div className="text-center text-neutral-700 mt-10">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No negotiations yet. Run a simulation first.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {negotiations.slice(-15).reverse().map((n: any, i: number) => (
                      <div key={i} className="bg-[#111] border border-neutral-800 rounded-lg p-3 hover:border-neutral-700 transition-all">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-[10px] text-neutral-400">{n.shipment_id}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            n.outcome === "SUCCESS" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                            : n.outcome === "ESCALATED" ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                            : "text-neutral-500 border-neutral-700"
                          }`}>{n.outcome}</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 mb-2">
                          Delay: {n.delay_prediction_hours?.toFixed(1)}h • Bids: {n.bids?.length || 0} • Cost: ${n.final_cost?.toFixed(0) || "N/A"}
                        </p>
                        <button
                          onClick={() => startReplay(n)}
                          disabled={replayPlaying}
                          className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Play className="w-3 h-3" /> Replay This Negotiation
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Guardrail Config (Priority 6) ── */}
            {activeTab === "config" && (
              <div className="h-full overflow-y-auto p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold">Guardrail Policy Editor</h3>
                </div>
                <p className="text-[10px] text-neutral-600 leading-relaxed">
                  Configure when the AI agent can act autonomously vs. when human approval is required.
                  These thresholds control the AUTONOMOUS → RECOMMEND → ESCALATE decision boundary.
                </p>

                <div className="space-y-3">
                  {[
                    { key: "costAutoLimit", label: "Auto-Approve Cost Limit", unit: "$", min: 100, max: 5000, step: 50, color: "emerald", desc: "Below this: fully autonomous" },
                    { key: "costEscalateLimit", label: "Escalation Cost Limit", unit: "$", min: 500, max: 10000, step: 100, color: "rose", desc: "Above this: must escalate to human" },
                    { key: "delayAutoLimit", label: "Auto-Handle Delay Limit", unit: "hrs", min: 1, max: 12, step: 0.5, color: "emerald", desc: "Below this: agent handles autonomously" },
                    { key: "delayEscalateLimit", label: "Escalation Delay Limit", unit: "hrs", min: 2, max: 24, step: 1, color: "rose", desc: "Above this: mandatory human review" },
                    { key: "minConfidence", label: "Min ML Confidence", unit: "%", min: 0.1, max: 1, step: 0.05, color: "purple", desc: "Below this: agent cannot act alone" },
                    { key: "minCarrierReliability", label: "Min Carrier Reliability", unit: "%", min: 0.1, max: 1, step: 0.05, color: "cyan", desc: "Won't auto-select carriers below this" },
                  ].map((item) => (
                    <div key={item.key} className="bg-[#111] border border-neutral-800 rounded-lg p-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-neutral-300 font-medium">{item.label}</span>
                        <span className={`font-mono text-${item.color}-400`}>
                          {item.unit === "$" ? `$${(config as any)[item.key]}` : item.unit === "%" ? `${((config as any)[item.key] * 100).toFixed(0)}%` : `${(config as any)[item.key]}${item.unit}`}
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-600 mb-2">{item.desc}</p>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        value={(config as any)[item.key]}
                        onChange={(e) => setConfig((prev) => ({ ...prev, [item.key]: parseFloat(e.target.value) }))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Visual policy summary */}
                <div className="bg-[#111] border border-neutral-800 rounded-lg p-3">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Policy Zones</p>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">AUTONOMOUS</span>
                      <span className="text-neutral-600">— Cost &lt; ${config.costAutoLimit}, Delay &lt; {config.delayAutoLimit}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">RECOMMEND</span>
                      <span className="text-neutral-600">— ${config.costAutoLimit}-${config.costEscalateLimit}, {config.delayAutoLimit}-{config.delayEscalateLimit}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldX className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400 font-medium">ESCALATE</span>
                      <span className="text-neutral-600">— Cost &gt; ${config.costEscalateLimit}, Delay &gt; {config.delayEscalateLimit}h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Quick Stats + Reputation ═══ */}
        <div className="lg:col-span-3 flex flex-col gap-4" style={{ maxHeight: 620 }}>
          {/* Automation Feeds */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-3">
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" /> Integration Triggers
            </h3>
            <div className="space-y-1.5">
              {demoResult ? (
                <>
                  <div className="flex items-center gap-2 text-[10px] bg-[#0a0a0a] rounded-lg p-2 border border-neutral-800">
                    <Phone className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                    <span className="text-neutral-400">SMS Alert → VIP Client</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] bg-[#0a0a0a] rounded-lg p-2 border border-neutral-800">
                    <FileText className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    <span className="text-neutral-400">PDF Dispatch → Carrier</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />
                  </div>
                  {demoResult.guardrail_result?.approval_level === "ESCALATE" && (
                    <div className="flex items-center gap-2 text-[10px] bg-rose-500/5 rounded-lg p-2 border border-rose-500/20">
                      <MessageSquare className="w-3 h-3 text-rose-400 flex-shrink-0" />
                      <span className="text-rose-400">Slack Escalation → Ops</span>
                      <ShieldX className="w-3 h-3 text-rose-400 ml-auto flex-shrink-0" />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-neutral-700 italic text-center py-4">Waiting for simulation...</p>
              )}
            </div>
          </div>

          {/* Reputation Changes */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-3 flex-1 overflow-y-auto">
            <h3 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> Carrier Reputation
            </h3>
            {demoResult?.reputation_updates?.length > 0 ? (
              <div className="space-y-1.5">
                {demoResult.reputation_updates.map((u: any, i: number) => (
                  <div key={i} className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      {u.reason === "disruption_penalty" ? (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className="text-neutral-300 font-medium">{u.carrier_id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className="text-neutral-600">{(u.old_score * 100).toFixed(0)}%</span>
                      <ArrowRight className="w-3 h-3 text-neutral-700" />
                      <span className={u.new_score < u.old_score ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                        {(u.new_score * 100).toFixed(0)}%
                      </span>
                      <span className="text-neutral-700 text-[9px] ml-auto">{u.reason.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-700 italic text-center py-6">Run simulation to see reputation changes</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ESCALATION MODAL (Priority 3) ═══ */}
      <AnimatePresence>
        {showEscalationModal && escalationData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEscalationModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-rose-500/30 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl shadow-rose-500/20"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/10 rounded-xl"><ShieldX className="w-6 h-6 text-rose-400" /></div>
                  <div>
                    <h2 className="text-base font-bold text-rose-400">⚠️ Human Approval Required</h2>
                    <p className="text-[10px] text-neutral-500">Guardrail policy triggered ESCALATION</p>
                  </div>
                </div>
                <button onClick={() => setShowEscalationModal(false)} className="text-neutral-600 hover:text-neutral-400"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-4 mb-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Shipment</span><span className="text-white font-mono">{escalationData.shipment_id}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Proposed Cost</span><span className="text-rose-400 font-bold">${escalationData.cost?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Predicted Delay</span><span className="text-amber-400">{escalationData.delay?.toFixed(1)}h</span></div>
              </div>

              {/* Slack preview */}
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Slack Message Preview</span>
                </div>
                <div className="bg-white/5 border-l-4 border-rose-400 rounded p-3 text-[11px]">
                  <p className="font-bold text-white mb-1">🚨 HIGH COST REROUTE REQUIRED</p>
                  <p className="text-neutral-400">Shipment: <code className="text-cyan-400">{escalationData.shipment_id}</code></p>
                  <p className="text-neutral-400">Proposed Cost: <strong className="text-rose-400">${escalationData.cost?.toFixed(2)}</strong></p>
                  <p className="text-neutral-400">Delay if Ignored: <strong className="text-amber-400">{escalationData.delay?.toFixed(1)}h</strong></p>
                  <div className="mt-2 flex gap-2">
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded">Approve Escalation</span>
                    <span className="bg-rose-600 text-white text-[10px] px-2 py-1 rounded">Reject & Hold</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowEscalationModal(false)}
                  className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve Reroute
                </button>
                <button onClick={() => setShowEscalationModal(false)}
                  className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Reject & Hold
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
