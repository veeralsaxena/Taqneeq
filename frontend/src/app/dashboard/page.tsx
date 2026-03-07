"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Package, Truck, Building2, Terminal, Activity,
  AlertTriangle, ShieldCheck, Zap, ArrowRight,
  Map as MapIcon,
} from "lucide-react";
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const API = "http://localhost:8000/api";

export default function ControlTower() {
  const [state, setState] = useState<any>({ shipments: [], carriers: [], warehouses: [], disruptions: [] });
  const [events, setEvents] = useState<any[]>([]);
  const [negotiating, setNegotiating] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    try {
      const [s, e] = await Promise.all([axios.get(`${API}/state`), axios.get(`${API}/events`)]);
      setState(s.data);
      setEvents(e.data.events || []);
    } catch {}
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 3000); return () => clearInterval(i); }, []);
  useEffect(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }); }, [events]);

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
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Active Shipments", value: state.active_shipments ?? state.shipments?.length, icon: Package, color: "text-cyan-400" },
            { label: "Carriers Online", value: state.carriers?.length, icon: Truck, color: "text-emerald-400" },
            { label: "Warehouses", value: state.warehouses?.length, icon: Building2, color: "text-purple-400" },
            { label: "Negotiations", value: state.total_negotiations ?? 0, icon: Activity, color: "text-amber-400" },
          ].map((kpi, i) => (
            <div key={i} className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-neutral-900 ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div>
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-[11px] text-neutral-500">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={injectDisruption} disabled={negotiating}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] disabled:opacity-50">
            <AlertTriangle className="w-4 h-4" />
            {negotiating ? "Agents Negotiating..." : "⚡ Inject Snowstorm Disruption"}
          </button>
          <button onClick={clearAll} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            Reset Network
          </button>
        </div>

        {/* Mapbox God's Eye View */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl overflow-hidden h-80 relative">
          <div className="absolute top-3 left-3 z-10 bg-[#0a0a0a]/80 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">Live Routing Map</span>
          </div>
          <Map
            initialViewState={{
              longitude: 78.9629,
              latitude: 20.5937,
              zoom: 3.5
            }}
            mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
            attributionControl={false}
          >
            <NavigationControl position="bottom-right" />
            
            {/* Draw factories/hubs */}
            {state.warehouses?.map((w: any) => (
              <Marker key={`w-${w.id}`} longitude={w.location.lng} latitude={w.location.lat}>
                <div className="w-3 h-3 bg-purple-500 rounded-sm shadow-[0_0_10px_#a855f7]" />
                <p className="text-[9px] font-mono mt-1 text-neutral-400 bg-black/50 px-1 rounded">{w.name}</p>
              </Marker>
            ))}

            {/* Draw active shipments (animating between source and destination simplified) */}
            {state.shipments?.map((s: any) => {
              // Simplistic representation: if delayed, show near source; if transit, middle; if rerouted, near dest
              const progress = s.status === 'DELAYED' ? 0.2 : s.status === 'REROUTED' ? 0.8 : 0.5;
              const lng = s.source_coords.lng + (s.destination_coords.lng - s.source_coords.lng) * progress;
              const lat = s.source_coords.lat + (s.destination_coords.lat - s.source_coords.lat) * progress;
              const color = s.status === 'DELAYED' ? '#f43f5e' : s.status === 'REROUTED' ? '#22d3ee' : '#34d399';
              
              return (
                <Marker key={`s-${s.id}`} longitude={lng} latitude={lat}>
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>
                    <span className="relative inline-flex rounded-full h-4 w-4" style={{ backgroundColor: color }}></span>
                  </div>
                </Marker>
              );
            })}
          </Map>
        </div>

        {/* Shipments */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-400 mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Shipments</h3>
          <div className="space-y-2">
            {state.shipments?.map((s: any) => (
              <div key={s.id} className="bg-[#0a0a0a] rounded-lg p-3 border border-neutral-800 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-neutral-600">{s.id}</span>
                  <span className="text-sm font-medium">{s.source}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-600" />
                  <span className="text-sm font-medium">{s.destination}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-cyan-400">{s.current_carrier_id?.replace("carrier_", "Carrier ").toUpperCase()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusColor(s.status)}`}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carriers */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-400 mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Carrier Trust Scores</h3>
          <div className="grid grid-cols-5 gap-2">
            {state.carriers?.map((c: any) => (
              <div key={c.id} className="bg-[#0a0a0a] rounded-lg p-3 border border-neutral-800 text-center">
                <p className="text-xs font-medium text-neutral-300 truncate">{c.name}</p>
                <p className={`text-lg font-bold mt-1 ${c.reliability_score > 0.8 ? "text-emerald-400" : c.reliability_score > 0.5 ? "text-amber-400" : "text-rose-400"}`}>
                  {(c.reliability_score * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-neutral-600 mt-0.5">${c.base_rate_per_km}/km</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Market Feed */}
      <div className="lg:col-span-4 bg-[#0a0a0a] border border-neutral-800 rounded-xl flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
        <div className="p-3 border-b border-neutral-800 bg-[#111] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <h2 className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">Agent Market Feed</h2>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" /><div className="w-2 h-2 rounded-full bg-amber-500" /><div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        </div>
        <div ref={feedRef} className="flex-1 p-3 overflow-y-auto font-mono text-[11px] flex flex-col gap-1.5">
          {events.length === 0 ? (
            <div className="flex-1 flex items-center justify-center flex-col text-neutral-700 gap-2">
              <Activity className="w-5 h-5 animate-pulse" />
              <p className="italic text-[10px]">Awaiting events...</p>
            </div>
          ) : events.map((e: any, i: number) => {
            const msg = e.message || e;
            let cl = "border-neutral-800 text-neutral-500";
            if (msg.includes("⚠") || msg.includes("ALERT")) cl = "border-amber-500/60 text-amber-200 bg-amber-500/5";
            else if (msg.includes("🔴") || msg.includes("DISRUPTION") || msg.includes("FATAL") || msg.includes("ESCALAT")) cl = "border-rose-500/60 text-rose-300 bg-rose-500/5";
            else if (msg.includes("🤝") || msg.includes("SUCCESS") || msg.includes("✅")) cl = "border-emerald-500/60 text-emerald-300 bg-emerald-500/5";
            else if (msg.includes("💰") || msg.includes("Bid")) cl = "border-cyan-500/40 text-cyan-200";
            else if (msg.includes("📉") || msg.includes("📈") || msg.includes("Learning")) cl = "border-purple-500/40 text-purple-300 bg-purple-500/5";
            else if (msg.includes("Supervisor") || msg.includes("🔍") || msg.includes("🧠")) cl = "border-blue-500/40 text-blue-200";
            return (
              <div key={i} className={`border-l-2 pl-2 py-1 rounded-r ${cl} animate-slide-up leading-relaxed`}>
                {msg}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
