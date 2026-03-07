"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import { GitBranch, Play, Eye } from "lucide-react";

const API = "http://localhost:8000/api";

const nodeColors: Record<string, string> = {
  observer: "#3b82f6",
  bidder: "#22d3ee",
  gatekeeper: "#a78bfa",
  decider: "#34d399",
  memory: "#f59e0b",
};

function AgentNode({ data }: { data: any }) {
  const color = nodeColors[data.type] || "#666";
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (data.active) {
      setActive(true);
      const t = setTimeout(() => setActive(false), 2000);
      return () => clearTimeout(t);
    }
  }, [data.active]);

  return (
    <div className={`rounded-xl border-2 px-5 py-3 min-w-[180px] transition-all duration-300 ${active ? "scale-105" : ""}`}
      style={{
        background: "#111",
        borderColor: active ? color : "#333",
        boxShadow: active ? `0 0 25px ${color}40` : "none",
      }}>
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-xs font-bold text-white">{data.label}</span>
      </div>
      <p className="text-[10px] text-neutral-500">{data.description}</p>
      <p className="text-[9px] mt-1 uppercase tracking-wider font-mono" style={{ color }}>{data.type}</p>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  );
}

const nodeTypes = { agentNode: AgentNode };

export default function WorkflowPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [selectedNeg, setSelectedNeg] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const r = await axios.get(`${API}/graph`);
        const positions: Record<string, { x: number; y: number }> = {
          supervisor: { x: 300, y: 0 },
          carriers: { x: 150, y: 150 },
          warehouse: { x: 450, y: 150 },
          shipment: { x: 300, y: 300 },
          learning: { x: 300, y: 450 },
        };

        const flowNodes: Node[] = r.data.nodes.map((n: any) => ({
          id: n.id,
          type: "agentNode",
          position: positions[n.id] || { x: 0, y: 0 },
          data: { ...n, active: false },
        }));

        const flowEdges: Edge[] = r.data.edges.map((e: any, i: number) => ({
          id: `e-${i}`,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: { stroke: e.conditional ? "#f59e0b" : "#333", strokeWidth: 2 },
          labelStyle: { fill: "#666", fontSize: 10 },
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch {}
    };
    fetchGraph();

    const fetchNeg = async () => {
      try { const r = await axios.get(`${API}/negotiations`); setNegotiations(r.data.negotiations || []); } catch {}
    };
    fetchNeg();
    const i = setInterval(fetchNeg, 5000);
    return () => clearInterval(i);
  }, []);

  const triggerDemo = async () => {
    setRunning(true);
    try {
      // Animate nodes sequentially
      const order = ["supervisor", "carriers", "warehouse", "shipment", "learning"];
      for (const nodeId of order) {
        setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, active: n.id === nodeId } })));
        await new Promise(r => setTimeout(r, 1200));
      }
      setNodes(prev => prev.map(n => ({ ...n, data: { ...n.data, active: false } })));

      // Refresh negotiations
      const r = await axios.get(`${API}/negotiations`);
      setNegotiations(r.data.negotiations || []);
    } catch {}
    setRunning(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <h1 className="text-lg font-bold">Agent Workflow Visualizer</h1>
          <span className="text-[10px] text-neutral-600 ml-2">DECIDE phase — LangGraph State Machine</span>
        </div>
        <button onClick={triggerDemo} disabled={running}
          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50">
          <Play className="w-3.5 h-3.5" /> {running ? "Running..." : "Simulate Flow"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* React Flow Graph */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-neutral-800 rounded-xl overflow-hidden" style={{ height: 550 }}>
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: "#0a0a0a" }}>
            <Background color="#1a1a1a" gap={20} />
            <Controls style={{ background: "#111", border: "1px solid #333", borderRadius: 8, }} />
            <MiniMap style={{ background: "#111" }} nodeColor="#333" maskColor="#0a0a0a80" />
          </ReactFlow>
        </div>

        {/* Negotiation History */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 max-h-[550px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> Negotiation Records
          </h3>
          {negotiations.length === 0 ? (
            <p className="text-neutral-700 text-xs italic text-center mt-10">No negotiations yet. Inject a disruption first.</p>
          ) : (
            <div className="space-y-2">
              {negotiations.slice(-10).reverse().map((n: any, i: number) => (
                <div key={i} onClick={() => setSelectedNeg(selectedNeg?.id === n.id ? null : n)}
                  className={`bg-[#0a0a0a] border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedNeg?.id === n.id ? "border-purple-500/50" : "border-neutral-800 hover:border-neutral-700"
                  }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-neutral-500">{n.shipment_id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                      n.outcome === "SUCCESS" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                      n.outcome === "ESCALATED" ? "text-rose-400 border-rose-500/30 bg-rose-500/10" :
                      "text-neutral-500 border-neutral-700"
                    }`}>{n.outcome}</span>
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-1">
                    Delay: {n.delay_prediction_hours?.toFixed(1)}h | Bids: {n.bids?.length || 0} | Cost: ${n.final_cost?.toFixed(2) || "N/A"}
                  </p>
                  {selectedNeg?.id === n.id && (
                    <div className="mt-2 pt-2 border-t border-neutral-800 space-y-1">
                      {n.log?.map((l: string, j: number) => (
                        <p key={j} className="text-[10px] text-neutral-500 font-mono leading-relaxed">{l}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
