"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Radio, CloudSnow, Truck, Wind, Gauge, AlertTriangle, Thermometer, Droplets, RotateCcw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const locations = ["Factory A", "Factory B", "Retailer B", "Retailer C", "Hub Alpha", "Hub Beta"];
const disruptions = [
  { label: "❄️ Severe Snowstorm", type: "SNOWSTORM", severity: 0.9, icon: CloudSnow },
  { label: "🌧️ Heavy Rain",      type: "HEAVY_RAIN", severity: 0.7, icon: Droplets },
  { label: "🚛 Truck Breakdown",  type: "TRUCK_BREAKDOWN", severity: 0.85, icon: Truck },
  { label: "🚧 Traffic Jam",      type: "TRAFFIC_JAM", severity: 0.6, icon: Wind },
];

export default function Simulator() {
  const [weatherData, setWeatherData] = useState<Record<string, any>>({});
  const [mlResult, setMlResult] = useState<any>(null);
  const [sliders, setSliders] = useState({ traffic_index: 0.3, weather_severity: 0.1, carrier_reliability: 0.9, distance_km: 300 });
  const [injecting, setInjecting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Fetch live weather for all locations
  useEffect(() => {
    const fetchWeather = async () => {
      const results: Record<string, any> = {};
      for (const loc of locations) {
        try {
          const r = await axios.get(`${API}/weather/${encodeURIComponent(loc)}`);
          results[loc] = r.data;
        } catch { results[loc] = null; }
      }
      setWeatherData(results);
    };
    fetchWeather();
    const i = setInterval(fetchWeather, 30000);
    return () => clearInterval(i);
  }, []);

  // Fetch events
  useEffect(() => {
    const f = async () => { try { const r = await axios.get(`${API}/events`); setEvents(r.data.events?.slice(-20) || []); } catch {} };
    f(); const i = setInterval(f, 3000); return () => clearInterval(i);
  }, []);

  const runPrediction = async () => {
    try {
      const r = await axios.post(`${API}/predict`, sliders);
      setMlResult(r.data);
    } catch {}
  };

  useEffect(() => { runPrediction(); }, [sliders]);

  const injectDisruption = async (type: string, severity: number) => {
    setInjecting(true);
    try {
      await axios.post(`${API}/disruption`, { entity_id: "carrier_a", type, severity, affected_region: "North India" });
      await axios.post(`${API}/negotiate/all`);
      const r = await axios.get(`${API}/events`);
      setEvents(r.data.events?.slice(-20) || []);
    } catch {}
    setInjecting(false);
  };

  const clearAll = async () => {
    await axios.post(`${API}/disruption/clear`);
    const r = await axios.get(`${API}/events`);
    setEvents(r.data.events?.slice(-20) || []);
  };

  const riskColor = (level: string) => {
    if (level === "CRITICAL") return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    if (level === "HIGH") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    if (level === "MEDIUM") return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-5 h-5 text-rose-400" />
        <h1 className="text-lg font-bold">Data Ingestion & Anomaly Simulator</h1>
        <span className="text-[10px] text-neutral-600 ml-2">OBSERVE + REASON phases</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Weather Feeds */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5" /> Live Weather API (Open-Meteo)
          </h3>
          <div className="space-y-2">
            {locations.map(loc => {
              const w = weatherData[loc];
              return (
                <div key={loc} className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-2.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-neutral-300 font-medium">{loc}</span>
                    {w && <span className={`px-1.5 py-0.5 rounded text-[9px] border ${w.severity_score > 0.5 ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"}`}>
                      sev: {w.severity_score}
                    </span>}
                  </div>
                  {w ? (
                    <div className="text-neutral-600 grid grid-cols-2 gap-x-3">
                      <span>🌡️ {w.raw.temperature}°C</span>
                      <span>💨 {w.raw.windspeed} km/h</span>
                      <span>🌧️ {w.raw.precipitation} mm</span>
                      <span>📟 code: {w.raw.weathercode}</span>
                    </div>
                  ) : <span className="text-neutral-700">Loading...</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chaos Panel */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Chaos Panel — Disruption Injection
          </h3>
          <div className="space-y-2 mb-4">
            {disruptions.map(d => (
              <button key={d.type} onClick={() => injectDisruption(d.type, d.severity)} disabled={injecting}
                className="w-full bg-[#0a0a0a] border border-neutral-800 hover:border-rose-500/40 rounded-lg p-3 text-left text-sm transition-all flex items-center justify-between group disabled:opacity-50">
                <span className="flex items-center gap-2">
                  <d.icon className="w-4 h-4 text-neutral-500 group-hover:text-rose-400 transition" />
                  <span className="text-neutral-300">{d.label}</span>
                </span>
                <span className="text-[10px] text-neutral-600">sev: {d.severity}</span>
              </button>
            ))}
          </div>
          <button onClick={clearAll} className="w-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded-lg p-2.5 text-sm text-neutral-400 flex items-center justify-center gap-2 transition">
            <RotateCcw className="w-3.5 h-3.5" /> Reset All Disruptions
          </button>
        </div>

        {/* ML Predictor */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-purple-400" /> ML Delay Predictor (Interactive)
          </h3>

          <div className="space-y-3 mb-4">
            {Object.entries(sliders).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                  <span>{key.replace(/_/g, " ")}</span>
                  <span className="font-mono">{typeof val === "number" ? val.toFixed(2) : val}</span>
                </div>
                <input type="range" min={key === "distance_km" ? 50 : 0} max={key === "distance_km" ? 2000 : 1} step={key === "distance_km" ? 10 : 0.01}
                  value={val}
                  onChange={e => setSliders(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            ))}
          </div>

          {mlResult && (
            <div className={`rounded-xl p-4 border ${riskColor(mlResult.risk_level)} text-center animate-slide-up`}>
              <p className="text-3xl font-bold">{mlResult.predicted_delay_hours}h</p>
              <p className="text-sm mt-1">Predicted Delay</p>
              <div className="flex justify-center gap-4 mt-2 text-[10px] opacity-80">
                <span>Risk: {mlResult.risk_level}</span>
                <span>Conf: {(mlResult.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini event log */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[11px]">
        <p className="text-neutral-600 text-[10px] uppercase tracking-wider mb-2">Recent Events</p>
        {events.map((e: any, i: number) => (
          <p key={i} className="text-neutral-500 leading-relaxed">{e.message || e}</p>
        ))}
      </div>
    </div>
  );
}
