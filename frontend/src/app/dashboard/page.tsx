"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Package, Truck, Building2, Terminal, Activity,
  AlertTriangle, ShieldCheck, Zap, ArrowRight,
  Map as MapIcon,
} from "lucide-react";
import InteractiveMap from "@/components/InteractiveMap";
import MarketFeed from "@/components/MarketFeed";
import CountUp from "react-countup";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ControlTower() {
  const [state, setState] = useState<any>({ shipments: [], carriers: [], warehouses: [], disruptions: [] });
  const [negotiating, setNegotiating] = useState(false);

  const fetchAll = async () => {
    try {
      const s = await axios.get(`${API}/state`);
      setState(s.data);
    } catch {}
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 3000); return () => clearInterval(i); }, []);

  const injectDisruption = async () => {
    setNegotiating(true);
    try {
      await axios.post(`${API}/disruption`, { entity_id: "carrier_a", type: "SNOWSTORM", severity: 0.9, affected_region: "North India" });
      await new Promise(r => setTimeout(r, 500));
      await axios.post(`${API}/negotiate/all`);
      await fetchAll();
    } catch {}
    setNegotiating(false);
  };

  const clearAll = async () => {
    await axios.post(`${API}/disruption/clear`);
    await fetchAll();
  };

  const statusColor = (s: string) => {
    if (s === "REROUTED") return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20";
    if (s === "DELAYED") return "text-rose-400 bg-rose-400/10 border-rose-400/20";
    if (s === "IN_TRANSIT") return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    return "text-neutral-400 bg-neutral-800 border-neutral-700";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: State */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Shipments", value: state.active_shipments ?? state.shipments?.length, icon: Package, color: "text-cyan-400" },
            { label: "Carriers Online", value: state.carriers?.length, icon: Truck, color: "text-emerald-400" },
            { label: "Warehouses", value: state.warehouses?.length, icon: Building2, color: "text-purple-400" },
            { label: "Negotiations", value: state.total_negotiations ?? 0, icon: Activity, color: "text-amber-400" },
          ].map((kpi, i) => (
            <div key={i} className="bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 flex items-center gap-3 relative overflow-hidden group hover:bg-white/[0.02] transition-colors shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className={`p-2 rounded-lg bg-neutral-900 ${kpi.color} relative z-10`}><kpi.icon className="w-4 h-4" /></div>
              <div className="relative z-10">
                <p className="text-2xl font-bold font-mono text-white">
                  <CountUp end={Number(kpi.value) || 0} preserveValue={true} separator="," duration={2} />
                </p>
                <p className="text-[11px] text-neutral-500">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={injectDisruption} disabled={negotiating}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] disabled:opacity-50">
            <AlertTriangle className="w-4 h-4" />
            {negotiating ? "Agents Negotiating..." : "⚡ Inject Snowstorm Disruption"}
          </button>
          <button onClick={clearAll} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-4 py-3 sm:py-2.5 w-full sm:w-auto rounded-xl text-sm font-medium transition-all">
            Reset Network
          </button>
        </div>

        {/* Mapbox God's Eye View */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden h-80 relative">
          <div className="absolute top-3 left-3 z-10 bg-[#0a0a0a]/80 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">Live Routing Map</span>
          </div>
          <InteractiveMap 
            shipments={state.shipments || []}
            warehouses={state.warehouses || []}
            disruptions={state.disruptions || []}
          />
        </div>

        {/* Shipments */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <h3 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2 relative z-10"><Package className="w-4 h-4 text-emerald-400" /> Active Shipments</h3>
          <div className="space-y-3 relative z-10">
            <AnimatePresence mode="popLayout">
              {state.shipments?.map((s: any) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  key={s.id} 
                  className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-lg p-3 border border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <span className="font-mono text-[11px] text-neutral-500">{s.id}</span>
                    <span className="text-sm font-medium text-neutral-200">{s.source}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-200">{s.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-cyan-400 font-mono tracking-wider">{s.current_carrier_id?.replace("carrier_", "Carrier ").toUpperCase()}</span>
                    <span className={`text-[10px] items-center px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusColor(s.status)}`}>{s.status}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Carriers */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/[0.02] to-transparent pointer-events-none" />
          <h3 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2 relative z-10"><Truck className="w-4 h-4 text-cyan-400" /> Carrier Trust Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
            <AnimatePresence>
              {state.carriers?.map((c: any) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={c.id} 
                  className="bg-white/[0.03] hover:bg-white/[0.05] transition-colors rounded-lg p-3 border border-white/[0.05] text-center shadow-lg"
                >
                  <p className="text-xs font-semibold text-neutral-300 truncate tracking-wide">{c.name}</p>
                  <p className={`text-xl font-black font-mono mt-1 ${c.reliability_score > 0.8 ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : c.reliability_score > 0.5 ? "text-amber-400" : "text-rose-400"}`}>
                    <CountUp end={Number((c.reliability_score * 100).toFixed(0))} preserveValue={true} duration={1} />%
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5 tracking-wider">${c.base_rate_per_km}/km</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: Market Feed */}
      <div className="lg:col-span-4 bg-[#0a0a0a] border border-neutral-800 rounded-xl flex flex-col h-[60vh] lg:h-[calc(100vh-5rem)] overflow-hidden">
        <MarketFeed />
      </div>
    </div>
  );
}
