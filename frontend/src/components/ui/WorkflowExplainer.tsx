"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudRainWind,
  Brain,
  Truck,
  Database,
  Send,
  CheckCircle2,
  Package,
  Shield,
  TrendingUp,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";

/* ─── Workflow Steps with simulated terminal logs ─── */
const workflowSteps = [
  {
    id: "observe",
    phase: "OBSERVE",
    title: "Disruption Detected",
    desc: "Network Supervisor polls live Open-Meteo & TomTom APIs. A severe thunderstorm is detected on the Delhi → Bangalore route.",
    icon: <CloudRainWind className="w-6 h-6" />,
    color: "rose",
    logs: [
      { time: "00:00.0", agent: "Supervisor", msg: "🔍 Scanning route: Delhi → Bangalore", type: "info" },
      { time: "00:00.3", agent: "Open-Meteo", msg: "⛈️  Weather code 95 (Thunderstorm). Severity: 0.92/1.0", type: "warn" },
      { time: "00:00.5", agent: "TomTom", msg: "🚗 Traffic congestion ratio: 0.71 (heavy)", type: "warn" },
      { time: "00:00.8", agent: "ML Model", msg: "🧠 Predicted delay: 7.4hrs | Risk: CRITICAL | Conf: 89%", type: "error" },
      { time: "00:01.0", agent: "Supervisor", msg: "⚠️  ALERT: Delay > 2hr threshold. Triggering negotiation.", type: "error" },
    ],
  },
  {
    id: "reason",
    phase: "REASON",
    title: "AI Reasoning & Analysis",
    desc: "Gemini 2.0 Flash analyzes the disruption with domain-tuned logistics expertise and quantifies the financial exposure.",
    icon: <Brain className="w-6 h-6" />,
    color: "blue",
    logs: [
      { time: "00:01.2", agent: "Gemini", msg: "📋 Loading 1,500-char domain system prompt...", type: "info" },
      { time: "00:01.5", agent: "Gemini", msg: "🔎 Carrier SLA: Express Logistics (Tier 1, 95% reliable)", type: "info" },
      { time: "00:01.8", agent: "Gemini", msg: "💰 Financial exposure: 7.4hr × ₹3,000/hr × 2.5x priority = ₹55,500 penalty", type: "warn" },
      { time: "00:02.0", agent: "Gemini", msg: "🤖 \"Severe thunderstorm with 0.71 congestion creates cascading hub risk. Immediate multi-carrier RFQ recommended.\"", type: "info" },
    ],
  },
  {
    id: "decide",
    phase: "DECIDE",
    title: "Multi-Agent Bidding War",
    desc: "4 Carrier Agents check fleet capacity via Fleetbase, then submit sealed dynamic bids. The Warehouse Agent validates hub capacity.",
    icon: <Truck className="w-6 h-6" />,
    color: "purple",
    logs: [
      { time: "00:02.2", agent: "System", msg: "📢 Broadcasting RFQ to 4 carriers...", type: "info" },
      { time: "00:02.5", agent: "Budget Freight", msg: "💰 Bid: $384.20 | ETA: 11.2hrs | Reliability: 78% | 12 trucks", type: "info" },
      { time: "00:02.7", agent: "Swift Transport", msg: "💰 Bid: $415.00 | ETA: 8.5hrs | Reliability: 85% | 12 trucks", type: "info" },
      { time: "00:02.9", agent: "Premium Haulers", msg: "💰 Bid: $892.00 | ETA: 5.1hrs | Reliability: 99% | 1 truck", type: "info" },
      { time: "00:03.1", agent: "Eco Movers", msg: "❌ No trucks available. Declining RFQ.", type: "warn" },
      { time: "00:03.3", agent: "Warehouse", msg: "🏭 Hub Beta: 44% occupancy. Status: MODERATE. ✅ Accepting.", type: "info" },
    ],
  },
  {
    id: "act",
    phase: "ACT",
    title: "Guardrailed Execution",
    desc: "The Shipment Agent ranks bids via utility function, checks guardrails, and executes the reroute autonomously.",
    icon: <Shield className="w-6 h-6" />,
    color: "emerald",
    logs: [
      { time: "00:03.5", agent: "Shipment", msg: "📊 Utility scores: Swift=0.42 ✨ | Budget=0.51 | Premium=0.88", type: "info" },
      { time: "00:03.7", agent: "Shipment", msg: "🏆 WINNER: Swift Transport — $415.00, ETA 8.5hrs, 85% reliable", type: "info" },
      { time: "00:03.9", agent: "Guardrails", msg: "🛡️ Cost $415 < $500 autonomous limit. ✅ AUTONOMOUS ACTION APPROVED.", type: "info" },
      { time: "00:04.1", agent: "Rollback", msg: "🔄 Pre-action snapshot saved. Rollback available if needed.", type: "info" },
      { time: "00:04.3", agent: "Automation", msg: "📄 PDF Dispatch Order generated: Dispatch_SH001.pdf", type: "info" },
      { time: "00:04.5", agent: "Twilio", msg: "📱 SMS alert sent to VIP client: \"Reroute in progress. ETA updating.\"", type: "info" },
    ],
  },
  {
    id: "learn",
    phase: "LEARN",
    title: "Memory & Improvement",
    desc: "The Learning Agent penalizes the failing carrier, rewards the winner, and updates the permanent reputation database.",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "amber",
    logs: [
      { time: "00:04.7", agent: "Learning", msg: "📉 Express Logistics: 95% → 85% (thunderstorm disruption penalty)", type: "warn" },
      { time: "00:04.9", agent: "Learning", msg: "📈 Swift Transport: 85% → 86% (successful bid bonus)", type: "info" },
      { time: "00:05.1", agent: "Postgres", msg: "🗄️ 2 reputation updates persisted to database.", type: "info" },
      { time: "00:05.3", agent: "Gemini", msg: "🤖 \"Express Logistics shows weather-correlated failures on southern routes. Consider route-specific reliability weighting.\"", type: "info" },
      { time: "00:05.5", agent: "System", msg: "✅ NEGOTIATION COMPLETE — Rerouted via Swift Transport at $415.00", type: "info" },
    ],
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string; pill: string }> = {
  rose:    { border: "border-rose-500/40",    bg: "bg-rose-500/10",    text: "text-rose-400",    glow: "shadow-[0_0_20px_rgba(244,63,94,0.2)]",   pill: "bg-rose-500/20 text-rose-300" },
  blue:    { border: "border-blue-500/40",    bg: "bg-blue-500/10",    text: "text-blue-400",    glow: "shadow-[0_0_20px_rgba(59,130,246,0.2)]",  pill: "bg-blue-500/20 text-blue-300" },
  purple:  { border: "border-purple-500/40",  bg: "bg-purple-500/10",  text: "text-purple-400",  glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]", pill: "bg-purple-500/20 text-purple-300" },
  emerald: { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400", glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",  pill: "bg-emerald-500/20 text-emerald-300" },
  amber:   { border: "border-amber-500/40",   bg: "bg-amber-500/10",   text: "text-amber-400",   glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",  pill: "bg-amber-500/20 text-amber-300" },
};

export function WorkflowExplainer() {
  const [activeStep, setActiveStep] = useState(-1); // -1 = idle
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalLogs = workflowSteps.reduce((sum, s) => sum + s.logs.length, 0);

  // Get a flat list of all logs with step index
  const allLogs = workflowSteps.flatMap((step, stepIdx) =>
    step.logs.map((log) => ({ ...log, stepIdx, color: step.color }))
  );

  // Auto-play: type out logs one by one
  useEffect(() => {
    if (!isRunning) return;

    if (visibleLogs >= totalLogs) {
      setIsRunning(false);
      setIsComplete(true);
      return;
    }

    // Figure out which step this log belongs to
    const currentLog = allLogs[visibleLogs];
    if (currentLog && currentLog.stepIdx !== activeStep) {
      setActiveStep(currentLog.stepIdx);
    }

    const delay = visibleLogs === 0 ? 300 : 400 + Math.random() * 200; // variable timing for realism
    const timer = setTimeout(() => {
      setVisibleLogs((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isRunning, visibleLogs, totalLogs, activeStep, allLogs]);

  const startDemo = useCallback(() => {
    setActiveStep(0);
    setVisibleLogs(0);
    setIsRunning(true);
    setIsComplete(false);
  }, []);

  const resetDemo = useCallback(() => {
    setActiveStep(-1);
    setVisibleLogs(0);
    setIsRunning(false);
    setIsComplete(false);
  }, []);

  const currentStepColors = activeStep >= 0 ? colorMap[workflowSteps[activeStep].color] : null;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch">
      {/* Left: Step Progress */}
      <div className="lg:w-[280px] shrink-0 flex flex-col gap-2">
        {workflowSteps.map((step, idx) => {
          const colors = colorMap[step.color];
          const isActive = idx === activeStep;
          const isPast = activeStep > idx;

          return (
            <motion.div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 cursor-pointer ${
                isActive
                  ? `${colors.border} ${colors.bg} ${colors.glow}`
                  : isPast
                  ? "border-white/[0.08] bg-white/[0.02] opacity-90"
                  : "border-white/[0.04] bg-white/[0.01] opacity-40"
              }`}
              onClick={() => {
                if (!isRunning) {
                  setActiveStep(idx);
                  // Show all logs up to and including this step
                  let count = 0;
                  for (let i = 0; i <= idx; i++) count += workflowSteps[i].logs.length;
                  setVisibleLogs(count);
                }
              }}
              animate={isActive ? { scale: 1.02 } : { scale: 1 }}
            >
              <div className={`p-2 rounded-lg shrink-0 ${isActive ? `${colors.bg} ${colors.border}` : isPast ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-white/[0.03] border border-white/[0.06]"}`}>
                {isPast && !isActive ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <span className={isActive ? colors.text : "text-neutral-600"}>{step.icon}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive ? colors.text : isPast ? "text-emerald-400" : "text-neutral-600"}`}>
                    {step.phase}
                  </span>
                </div>
                <p className={`text-xs font-semibold truncate ${isActive ? "text-white" : isPast ? "text-neutral-300" : "text-neutral-500"}`}>
                  {step.title}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Play/Reset Button */}
        <div className="mt-3 flex gap-2">
          {!isRunning && !isComplete && (
            <button
              onClick={startDemo}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:scale-[1.02] transition-transform active:scale-95"
            >
              <Play className="w-4 h-4" /> Run Demo
            </button>
          )}
          {isComplete && (
            <button
              onClick={startDemo}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:scale-[1.02] transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Replay
            </button>
          )}
          {isRunning && (
            <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-neutral-400 text-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Zap className="w-4 h-4 text-cyan-400" />
              </motion.div>
              Running...
            </div>
          )}
          {(isRunning || isComplete) && (
            <button
              onClick={resetDemo}
              className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-neutral-500 hover:text-white hover:border-white/[0.15] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Terminal Log */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] rounded-2xl border border-neutral-800 overflow-hidden min-h-[420px]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-[10px] text-neutral-600 font-mono ml-2">neuro-logistics — agent_negotiation.log</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-600 font-mono">{visibleLogs}/{totalLogs} events</span>
            {isRunning && (
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>
        </div>

        {/* Log Output */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-0.5 scroll-smooth" id="log-output">
          {activeStep === -1 && (
            <div className="flex items-center justify-center h-full text-neutral-600 text-center">
              <div>
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click <span className="text-cyan-400 font-bold">&quot;Run Demo&quot;</span> to watch</p>
                <p className="text-sm">the full agent negotiation cycle</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {allLogs.slice(0, visibleLogs).map((log, i) => {
              const stepColors = colorMap[log.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 py-1"
                >
                  <span className="text-neutral-600 shrink-0 w-14">{log.time}</span>
                  <span className={`shrink-0 w-[110px] truncate font-semibold ${
                    log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : stepColors.text
                  }`}>
                    [{log.agent}]
                  </span>
                  <span className={`${
                    log.type === "error" ? "text-red-300" : log.type === "warn" ? "text-amber-200" : "text-neutral-400"
                  }`}>
                    {log.msg}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Blinking cursor */}
          {isRunning && (
            <motion.span
              className="inline-block w-2 h-4 bg-cyan-400 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
            />
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 pt-4 border-t border-neutral-800 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Full O→R→D→A→L Cycle Complete in 5.5s
              </div>
            </motion.div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-neutral-900">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500"
            animate={{ width: `${(visibleLogs / totalLogs) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
