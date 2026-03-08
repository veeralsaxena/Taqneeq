"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart3, Trophy, DollarSign, Brain, TrendingDown, TrendingUp, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AnalyticsPage() {
  const [reputation, setReputation] = useState<any>({ leaderboard: [] });
  const [savings, setSavings] = useState<any>({});
  const [mlStats, setMlStats] = useState<any>({});
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [rep, sav, ml] = await Promise.all([
        axios.get(`${API}/analytics/reputation`),
        axios.get(`${API}/analytics/savings`),
        axios.get(`${API}/analytics/ml`),
      ]);
      setReputation(rep.data);
      setSavings(sav.data);
      setMlStats(ml.data);
    } catch {}
  };

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 5000); return () => clearInterval(i); }, []);

  const barColors = ["#34d399", "#22d3ee", "#a78bfa", "#f59e0b", "#f43f5e"];

  const selectedHistory = reputation.leaderboard?.find((c: any) => c.carrier_id === selectedCarrier)?.history || [];
  const historyChart = selectedHistory.map((h: any, i: number) => ({
    idx: i,
    score: (h.score * 100).toFixed(1),
    reason: h.reason,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-amber-400" />
        <h1 className="text-lg font-bold">Network Economics & Analytics</h1>
        <span className="text-[10px] text-neutral-600 ml-2">LEARN phase — Agent Memory & Evolution</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Negotiations", value: savings.total_negotiations ?? 0, icon: Target, color: "text-cyan-400" },
          { label: "Successful Reroutes", value: savings.successful ?? 0, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Escalated to Human", value: savings.escalated ?? 0, icon: TrendingDown, color: "text-rose-400" },
          { label: "Estimated Savings", value: `$${savings.estimated_savings?.toFixed(0) ?? 0}`, icon: DollarSign, color: "text-amber-400" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Carrier Leaderboard */}
        <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-neutral-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Carrier Trust Score Leaderboard
          </h3>

          {/* Bar Chart */}
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reputation.leaderboard?.map((c: any) => ({ name: c.name.split(" ")[0], score: (c.current_score * 100).toFixed(1), id: c.carrier_id }))}>
                <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(d: any) => setSelectedCarrier(d.id)}>
                  {reputation.leaderboard?.map((_: any, i: number) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="space-y-1.5">
            {reputation.leaderboard?.map((c: any, i: number) => (
              <div key={c.carrier_id}
                onClick={() => setSelectedCarrier(c.carrier_id === selectedCarrier ? null : c.carrier_id)}
                className={`flex items-center justify-between bg-[#0a0a0a] border rounded-lg p-2.5 cursor-pointer transition-all ${
                  selectedCarrier === c.carrier_id ? "border-amber-500/40" : "border-neutral-800 hover:border-neutral-700"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-600 w-4">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-neutral-200">{c.name}</p>
                    <p className="text-[10px] text-neutral-600">${c.base_rate}/km · {c.bids_won} bids won</p>
                  </div>
                </div>
                <span className={`text-sm font-bold font-mono ${c.current_score > 0.8 ? "text-emerald-400" : c.current_score > 0.5 ? "text-amber-400" : "text-rose-400"}`}>
                  {(c.current_score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Trust Evolution + ML Stats */}
        <div className="flex flex-col gap-5">
          {/* Trust Evolution Chart */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-4 flex-1">
            <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider">
              {selectedCarrier ? `Trust Evolution — ${reputation.leaderboard?.find((c: any) => c.carrier_id === selectedCarrier)?.name}` : "Select a carrier to view trust history"}
            </h3>
            {historyChart.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChart}>
                    <XAxis dataKey="idx" tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 11 }}
                      formatter={(value: any) => [`${value}%`, "Score"]}
                      labelFormatter={(label: any) => historyChart[label]?.reason || ""} />
                    <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-neutral-700 text-xs italic">
                Click a carrier in the leaderboard to view their trust evolution over time
              </div>
            )}
          </div>

          {/* ML Model Stats */}
          <div className="bg-[#111] border border-neutral-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-purple-400" /> ML Model Performance
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-purple-400">{mlStats.total_predictions ?? 0}</p>
                <p className="text-[10px] text-neutral-600">Predictions</p>
              </div>
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-amber-400">{mlStats.avg_predicted_delay ?? 0}h</p>
                <p className="text-[10px] text-neutral-600">Avg Delay</p>
              </div>
              <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-rose-400">{mlStats.max_predicted_delay ?? 0}h</p>
                <p className="text-[10px] text-neutral-600">Max Delay</p>
              </div>
            </div>

            {/* Feature Importances */}
            {mlStats.feature_importances && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Feature Importances</p>
                {Object.entries(mlStats.feature_importances).sort(([,a]: any, [,b]: any) => b - a).map(([key, val]: any) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500 w-32 truncate">{key.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${val * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-neutral-600 font-mono w-10 text-right">{(val * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
