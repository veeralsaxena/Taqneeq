"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Target,
  Brain,
  Database,
  Cpu,
  Share2,
  MousePointer2,
  GitBranch,
  BarChart3,
  Map,
  Truck,
  Package,
  Shield,
  Activity,
  History,
  Lock,
  Globe2,
  AlertTriangle,
  FileCode2,
  CloudRainWind,
  Network,
  Timer,
  RefreshCcw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Gauge,
  Server,
  Github,
  Eye,
  Lightbulb,
  BookOpen,
  Layers,
  ArrowDownUp,
  CircleDot,
  MessageSquareCode,
  Search,
  Coins,
  Users,
  Swords,
  X,
} from "lucide-react";
import LogisticsNetwork from "@/components/ui/LogisticsNetwork";
import { InteractiveGlobe } from "@/components/ui/InteractiveGlobe";
import { AgentNetworkDiagram } from "@/components/ui/AgentNetworkDiagram";
import { TerminalAuditLog } from "@/components/ui/TerminalAuditLog";
import { SplineScene } from "@/components/ui/SplineScene";
import { GooeyText } from "@/components/ui/GooeyText";
import { Spotlight } from "@/components/ui/Spotlight";
import { SparklesCore } from "@/components/ui/SparklesCore";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { WorkflowExplainer } from "@/components/ui/WorkflowExplainer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ─── Helper: Glassmorphism Stat Card ─── */
function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-${color}-500/20 p-5 group hover:border-${color}-500/40 transition-all duration-300`}>
      <div className={`absolute -right-6 -top-6 w-20 h-20 bg-${color}-500/10 blur-[40px] rounded-full group-hover:bg-${color}-500/20 transition-colors`} />
      <div className="relative z-10 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl md:text-3xl font-black text-white">{value}</p>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ────── Feedback Loop Step ────── */
function LoopStep({ number, title, desc, icon, color, isLast }: { number: number; title: string; desc: string; icon: React.ReactNode; color: string; isLast?: boolean }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full bg-${color}-500/20 border border-${color}-500/40 flex items-center justify-center text-${color}-400 font-bold text-sm shrink-0`}>
          {number}
        </div>
        {!isLast && <div className={`w-px h-full bg-gradient-to-b from-${color}-500/40 to-transparent min-h-[40px]`} />}
      </div>
      <div className="pb-6">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h4 className="font-bold text-white text-sm">{title}</h4>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function PitchDeck() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="fixed inset-0 -z-50 pointer-events-none bg-black">
        <LogisticsNetwork />
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen"
          src="/bg-logistics.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col lg:flex-row overflow-y-auto lg:overflow-y-hidden lg:overflow-x-auto scroll-smooth w-full h-[calc(100dvh-5rem)] hide-scrollbar relative z-10"
        style={{ scrollbarWidth: "none" }}
      >
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out 2s infinite; }
      `}} />

      {/* ═══════════════ SLIDE 1: What the Agent Does (Criterion 1) ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[100vw] lg:h-full relative flex items-center py-16 lg:py-0 pr-0 lg:pr-24">
        <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={30}
            className="w-full h-full"
            particleColor="#10b981"
          />
        </div>

        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 z-[1]" fill="white" />

        <div className="relative z-20 container mx-auto px-6 md:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              className="flex flex-col justify-center space-y-6 relative z-10"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            >
              <motion.div custom={0} variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" /> Criterion 1 — What The Agent Does
                </div>
              </motion.div>

              <motion.div custom={1} variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 text-xs font-medium tracking-wider uppercase mb-3">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  The Problem: Supply Chains Are Reactive
                </div>
              </motion.div>

              <motion.div custom={2} variants={fadeUp} className="mt-2">
                <div className="min-h-[80px] md:min-h-[100px] w-full flex justify-start items-center overflow-visible">
                  <GooeyText
                    texts={["NeuroLogistics", "Self-Negotiating", "Autonomous Market"]}
                    morphTime={1.4}
                    cooldownTime={1.5}
                    className="h-full"
                    textClassName="text-white text-[28px] sm:text-4xl md:text-[4rem] font-black tracking-tighter leading-tight whitespace-nowrap"
                  />
                </div>
              </motion.div>

              <motion.p custom={3} variants={fadeUp} className="text-base md:text-lg text-neutral-400 max-w-xl leading-relaxed">
                <span className="text-white font-semibold">Core Mission:</span> An autonomous AI operations layer that <span className="text-cyan-400 font-semibold">observes disruptions, reasons about risk, negotiates reroutes, and learns from outcomes</span> — replacing the reactive, manual scramble that loses millions daily.
              </motion.p>

              <motion.div custom={4} variants={fadeUp} className="flex flex-wrap gap-4 md:gap-8 py-4 border-t border-white/[0.06]">
                {[
                  { value: "5", label: "Autonomous Agents" },
                  { value: "< 2s", label: "Decision Latency" },
                  { value: "100%", label: "Real Data Feeds" },
                ].map((stat, i) => (
                  <div key={i} className="min-w-[120px]">
                    <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[10px] md:text-[11px] text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute inset-0 lg:relative h-[600px] lg:h-[550px] lg:translate-x-12 xl:translate-x-20 opacity-30 lg:opacity-100 pointer-events-none lg:pointer-events-auto -z-0 lg:z-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="absolute inset-0 z-0 pointer-events-none" style={{
                background: "radial-gradient(ellipse 50% 60% at 50% 55%, rgba(34,211,238,0.08) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)"
              }} />
              <div className="absolute inset-0 grayscale contrast-[1.15] brightness-[1.05]">
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-neutral-600"
          animate={{ x: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll →</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 2: How the Agent Thinks (Criterion 2) ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="max-w-7xl w-full flex flex-col items-center relative z-10 space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
            <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-4">
                  <Brain className="w-3 h-3" /> Criterion 2 — How The Agent Thinks
                </div>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                  Observe → Reason → Decide → Act
                </h2>
                <p className="text-neutral-400 mt-4">Follow the path of a disruption from detection to autonomous resolution. Each step is a distinct agent with its own logic.</p>
            </motion.div>

            <motion.div variants={fadeUp} className="w-full">
                <WorkflowExplainer />
            </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 3: System Structure (Criterion 3) ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <div className="max-w-7xl w-full relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="space-y-6 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
              <Layers className="w-3 h-3" /> Criterion 3 — System Structure
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              5 Agents. One State Machine.<br />LangGraph Orchestration.
            </h2>
            <p className="text-neutral-400 leading-relaxed text-sm md:text-base max-w-xl">
              Built on Google{"'"}s LangGraph — each agent is a node in a compiled StateGraph with conditional edges. They share an immutable <code className="text-cyan-400">AgentState</code> TypedDict and fire in strict dependency order.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                { title: "Network Supervisor", desc: "Observes live weather + traffic. Runs ML delay prediction. Triggers negotiation if risk > threshold.", icon: <Brain className="w-5 h-5 text-blue-400"/> },
                { title: "Carrier Agents", desc: "Each carrier is a sealed-bid agent. Checks Fleetbase fleet capacity, then submits a dynamic Karrio-priced quote.", icon: <Truck className="w-5 h-5 text-cyan-400"/> },
                { title: "Warehouse Agent", desc: "Gatekeeps hub capacity. Vetoes reroutes if destination is at 90%+ occupancy to prevent cascading congestion.", icon: <Database className="w-5 h-5 text-purple-400"/> },
                { title: "Shipment + Learning", desc: "Decision-maker picks the best bid via utility function. Learning Agent penalizes/rewards carrier reputation.", icon: <Package className="w-5 h-5 text-emerald-400"/> },
              ].map((item, i) => (
                <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex gap-4 items-start p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-300 group">
                  <div className="mt-0.5 p-2 bg-white/[0.04] rounded-lg border border-white/[0.04]">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-neutral-200 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full max-w-[500px]">
             <AgentNetworkDiagram />
          </div>
        </div>
      </section>

      {/* ═══════════════ SLIDE 4: Performance & Efficiency (Criterion 4) — NEW ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="max-w-6xl w-full relative z-10 space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
              <Gauge className="w-3 h-3" /> Criterion 4 — Performance & Efficiency
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent leading-tight">
              Designed for Speed.<br />Engineered for Scale.
            </h2>
            <p className="text-neutral-400 mt-4 max-w-lg mx-auto">Every millisecond counts in logistics. Our system is optimized for real-time operations, not batch processing.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Timer className="w-5 h-5 text-amber-400" />} value="< 2s" label="Full Negotiation Cycle" color="amber" />
            <StatCard icon={<Cpu className="w-5 h-5 text-orange-400" />} value="~2ms" label="ML Inference Time" color="orange" />
            <StatCard icon={<Zap className="w-5 h-5 text-yellow-400" />} value="Real-Time" label="WebSocket Broadcast" color="yellow" />
            <StatCard icon={<Server className="w-5 h-5 text-red-400" />} value="< 256MB" label="Memory Footprint" color="red" />
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Throughput</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                FastAPI async backend handles concurrent shipment negotiations without blocking. Each negotiation runs through the LangGraph state machine independently.
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><ArrowDownUp className="w-4 h-4 text-orange-400" /> Streaming Architecture</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Redis pub/sub broadcasts every agent event in real-time via WebSockets. The frontend dashboard updates live without polling.
              </p>
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Cpu className="w-4 h-4 text-red-400" /> Lean ML</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Random Forest with 100 estimators loads from a pre-trained <code className="text-amber-400">.joblib</code> file — no GPU required. Inference is pure NumPy, running in microseconds.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 5: Built to Work in Reality (Criterion 5) ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="flex flex-col w-full max-w-6xl mx-auto space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
            <motion.div variants={fadeUp} custom={0} className="w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-6">
                <Globe2 className="w-3 h-3" /> Criterion 5 — Built for Reality
              </div>
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                No mock toys. Real APIs.
              </h2>
              <p className="text-lg text-neutral-400 mt-4 leading-relaxed max-w-xl">
                We integrated actual supply chain software and domain grounding to prove this handles real enterprise loads.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="w-full max-w-[400px] mx-auto lg:max-w-none flex justify-center lg:justify-end mt-8 lg:mt-0">
                <InteractiveGlobe />
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="w-full">
            <BentoGrid className="lg:grid-rows-2">
            {[
              {
                name: "FedEx/UPS Live Rates",
                description: "Integrated Karrio SDK. Agents pull real carrier estimates instead of guessing.",
                Icon: Truck,
                href: "/dashboard",
                cta: "See Agents",
                background: <img src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="shipping containers" />,
                className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3"
              },
              {
                name: "Open-Meteo Weather API",
                description: "Live weather data at source + destination coordinates. No API key required.",
                Icon: CloudRainWind,
                href: "/dashboard",
                cta: "View Data",
                background: <img src="https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="weather storm" />,
                className: "lg:col-start-2 lg:col-end-4 lg:row-start-1 lg:row-end-2"
              },
              {
                name: "TomTom Traffic API",
                description: "Real-time highway congestion ratios feed directly into the ML delay model.",
                Icon: Map,
                href: "/dashboard",
                cta: "Track Routes",
                background: <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="map navigation" />,
                className: "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3"
              },
              {
                name: "Twilio + Slack",
                description: "SMS alerts for critical disruptions. Slack Block Kit for human-in-the-loop approval.",
                Icon: Zap,
                href: "/dashboard",
                cta: "View Alerts",
                background: <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="network connections" />,
                className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-3"
              },
            ].map((tech, i) => (
              <BentoCard
                key={i}
                {...tech}
              />
            ))}
          </BentoGrid>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 6: Learning & Improvement (Criterion 6) — NEW ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="max-w-6xl w-full relative z-10 flex flex-col lg:flex-row gap-12 items-start"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeUp} className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold tracking-wider uppercase">
              <RefreshCcw className="w-3 h-3" /> Criterion 6 — Learning & Improvement
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent leading-tight">
              The AI That Corrects<br />Its Own Mistakes.
            </h2>
            <p className="text-neutral-400 leading-relaxed text-sm md:text-base max-w-xl">
              Every decision is tracked. Every outcome is validated. If the agent reroutes to a carrier and they still deliver late, the system detects the false positive, auto-rollbacks, and permanently penalizes the unreliable carrier.
            </p>

            {/* Feedback Loop Visual */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl mt-4">
              <h4 className="font-bold text-white mb-4 text-sm flex items-center gap-2"><GitBranch className="w-4 h-4 text-green-400" /> The Feedback Loop</h4>
              <LoopStep number={1} title="Agent Decides" desc="Shipment Agent selects Carrier B for reroute based on utility score." icon={<CircleDot className="w-3.5 h-3.5 text-blue-400" />} color="blue" />
              <LoopStep number={2} title="Rollback Snapshot Saved" desc="rollback.py saves pre-action state so the system can undo." icon={<History className="w-3.5 h-3.5 text-cyan-400" />} color="cyan" />
              <LoopStep number={3} title="Outcome Validated" desc="Post-delivery, decision_tracker compares predicted vs actual delay." icon={<Eye className="w-3.5 h-3.5 text-amber-400" />} color="amber" />
              <LoopStep number={4} title="Incorrect? Auto-Rollback" desc="If SLA was breached after reroute → carrier gets extra -5% rep penalty." icon={<XCircle className="w-3.5 h-3.5 text-red-400" />} color="red" />
              <LoopStep number={5} title="System Memory Updated" desc="Learning Agent writes strategic insight. Future decisions avoid same mistake." icon={<TrendingUp className="w-3.5 h-3.5 text-green-400" />} color="green" isLast />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex-1 space-y-4 w-full">
            <h3 className="text-lg font-bold text-white">Decision Accuracy Tracking</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 p-5 rounded-2xl text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">Correct</p>
                <p className="text-xs text-neutral-500 mt-1">SLA met after reroute</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 p-5 rounded-2xl text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">False Positive</p>
                <p className="text-xs text-neutral-500 mt-1">Unnecessary reroute detected</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-amber-500/20 p-5 rounded-2xl text-center">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">False Negative</p>
                <p className="text-xs text-neutral-500 mt-1">Missed disruption caught</p>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-purple-500/20 p-5 rounded-2xl text-center">
                <RefreshCcw className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">Auto-Rollback</p>
                <p className="text-xs text-neutral-500 mt-1">Self-correcting mechanism</p>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border border-white/[0.06] p-5 rounded-2xl mt-4">
              <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> Carrier Reputation Memory</h4>
              <p className="text-xs text-neutral-500 leading-relaxed mb-3">Every carrier{"'"}s reliability score is persisted in Postgres and evolves on every negotiation cycle:</p>
              <div className="space-y-2">
                {[
                  { name: "Express Logistics", score: "95%", delta: "+1%", color: "text-green-400" },
                  { name: "Budget Freight", score: "78%", delta: "-5%", color: "text-red-400" },
                  { name: "Premium Haulers", score: "99%", delta: "+1%", color: "text-green-400" },
                  { name: "Swift Transport", score: "85%", delta: "-2%", color: "text-amber-400" },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{c.score}</span>
                      <span className={`${c.color} font-semibold`}>{c.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 7: Advanced Intelligence (Criterion 7) — NEW ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="max-w-6xl w-full relative z-10 space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold tracking-wider uppercase mb-4">
              <Lightbulb className="w-3 h-3" /> Criterion 7 — Advanced Intelligence
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent leading-tight">
              Not Just an LLM Wrapper.<br />Real ML + Real AI.
            </h2>
            <p className="text-neutral-400 mt-4 max-w-lg mx-auto">We combine a trained ML model for quantitative prediction with a domain-tuned LLM for qualitative reasoning. Neither alone would suffice.</p>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ML Model Card */}
            <div className="bg-black/40 backdrop-blur-xl border border-violet-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <BarChart3 className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Scikit-Learn Delay Predictor</h3>
                  <p className="text-xs text-neutral-500">Random Forest · 100 estimators · R² ≈ 0.93</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Feature Importances</p>
                {[
                  { name: "Carrier Reliability", pct: 35, color: "bg-violet-500" },
                  { name: "Weather Severity", pct: 28, color: "bg-blue-500" },
                  { name: "Traffic Index", pct: 18, color: "bg-cyan-500" },
                  { name: "Distance (km)", pct: 12, color: "bg-emerald-500" },
                  { name: "Hour of Day", pct: 5, color: "bg-amber-500" },
                  { name: "Weekend Factor", pct: 2, color: "bg-neutral-500" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-32 shrink-0">{f.name}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${f.color} rounded-full`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${f.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-8 text-right">{f.pct}%</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 mt-2">
                <p className="text-[10px] text-neutral-500 font-mono leading-relaxed">
                  <span className="text-violet-400">predict_delay</span>(traffic=0.85, weather=0.9, reliability=0.3, dist=500km)<br/>
                  → <span className="text-amber-400">8.2hrs</span> delay | Risk: <span className="text-red-400">CRITICAL</span> | Confidence: <span className="text-green-400">87%</span>
                </p>
              </div>
            </div>

            {/* LLM Card */}
            <div className="bg-black/40 backdrop-blur-xl border border-fuchsia-500/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
                  <Brain className="w-6 h-6 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Gemini 2.0 Flash</h3>
                  <p className="text-xs text-neutral-500">Domain-tuned · 1,500-char system prompt · Safety-validated</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <p className="text-[10px] text-fuchsia-400 font-semibold uppercase tracking-wider mb-2">Why LLM, Not Rules?</p>
                  <div className="space-y-2">
                    {[
                      { title: "Contextual Disruption Analysis", desc: "Synthesizes weather, traffic, SLA tier & financial penalty into novel sentences" },
                      { title: "Bid Selection Explanation", desc: "Generates human-readable justification for why a carrier won" },
                      { title: "Strategic Learning Insights", desc: "Identifies cross-session patterns across carrier performance" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-white font-semibold">{r.title}</p>
                          <p className="text-[10px] text-neutral-500">{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-2">LLM Safety Layer</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <Lock className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <p className="text-[9px] text-neutral-500">PII Filter</p>
                    </div>
                    <div>
                      <Shield className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                      <p className="text-[9px] text-neutral-500">Hallucination Check</p>
                    </div>
                    <div>
                      <Target className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                      <p className="text-[9px] text-neutral-500">Domain Relevance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 8: Enterprise Safety (Guardrails + Audit) ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="max-w-7xl w-full flex flex-col lg:flex-row gap-12 items-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
            <motion.div variants={fadeUp} className="flex-1 w-full space-y-6 order-2 lg:order-1">
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-black/40 backdrop-blur-xl border border-purple-500/30 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)] group hover:border-purple-500/50 transition-colors">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full group-hover:bg-purple-500/30 transition-colors" />
                        <Shield className="w-8 h-8 text-purple-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Human-in-the-Loop Guardrails</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">Cost {'<'} $500 → autonomous. Cost {'>'} $2,000 → Slack escalation with approve/reject buttons. Carrier reliability {'<'} 40% → blocked from selection.</p>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-rose-500/30 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.1)] group hover:border-rose-500/50 transition-colors">
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full group-hover:bg-rose-500/30 transition-colors" />
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <History className="w-8 h-8 text-rose-400" />
                            <div>
                                <h3 className="text-xl font-bold text-white">Event Sourcing Audit Trail</h3>
                                <p className="text-xs text-neutral-400">Every agent action is an immutable event. Full replay capability.</p>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <TerminalAuditLog />
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex-1 space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wider uppercase">
                <Lock className="w-3 h-3" /> Guardrails & Compliance
                </div>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent leading-tight">
                Built for safety.<br />Designed for trust.
                </h2>
                <p className="text-neutral-400 leading-relaxed text-sm md:text-base max-w-xl">
                The system features strict 3-tier guardrails (AUTONOMOUS / RECOMMEND / ESCALATE), an LLM safety layer that blocks PII and hallucinations, and an immutable event-sourced audit trail for every single agent action.
                </p>
            </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 9: GitHub + Tech Summary — NEW ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="max-w-5xl w-full relative z-10 space-y-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold tracking-wider uppercase mb-4">
              <Github className="w-3 h-3" /> Open Source · Code-First
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent leading-tight">
              Full Stack. Fully Open.
            </h2>
          </motion.div>

          {/* Tech Stack Grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { name: "LangGraph", desc: "Multi-Agent FSM", icon: <Share2 className="w-5 h-5" /> },
              { name: "Gemini 2.0", desc: "Domain-tuned LLM", icon: <Brain className="w-5 h-5" /> },
              { name: "Scikit-Learn", desc: "Delay Predictor", icon: <BarChart3 className="w-5 h-5" /> },
              { name: "FastAPI", desc: "Async Backend", icon: <Zap className="w-5 h-5" /> },
              { name: "Next.js 14", desc: "React Frontend", icon: <Layers className="w-5 h-5" /> },
              { name: "PostgreSQL", desc: "Persistent State", icon: <Database className="w-5 h-5" /> },
              { name: "Redis", desc: "Pub/Sub Events", icon: <Activity className="w-5 h-5" /> },
              { name: "Docker", desc: "Containerized", icon: <Server className="w-5 h-5" /> },
              { name: "Open-Meteo", desc: "Live Weather", icon: <CloudRainWind className="w-5 h-5" /> },
              { name: "TomTom", desc: "Traffic Data", icon: <Map className="w-5 h-5" /> },
              { name: "Twilio", desc: "SMS Alerts", icon: <Cpu className="w-5 h-5" /> },
              { name: "Slack", desc: "Block Kit HITL", icon: <Network className="w-5 h-5" /> },
            ].map((tech, i) => (
              <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-black/40 backdrop-blur-xl border border-white/[0.06] p-4 rounded-xl text-center hover:border-cyan-500/30 transition-colors group">
                <div className="text-neutral-500 group-hover:text-cyan-400 transition-colors mx-auto mb-2 flex justify-center">{tech.icon}</div>
                <p className="text-sm font-bold text-white">{tech.name}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{tech.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* O-R-D-A-L Loop Summary */}
          <motion.div variants={fadeUp} className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-4 text-center">The Complete Agent Loop</p>
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
              {[
                { step: "Observe", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
                { step: "→", color: "text-neutral-600" },
                { step: "Reason", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
                { step: "→", color: "text-neutral-600" },
                { step: "Decide", color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
                { step: "→", color: "text-neutral-600" },
                { step: "Act", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                { step: "→", color: "text-neutral-600" },
                { step: "Learn", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
              ].map((s, i) =>
                s.step === "→" ? (
                  <ArrowRight key={i} className={`w-4 h-4 ${s.color}`} />
                ) : (
                  <span key={i} className={`px-4 py-2 rounded-full border text-xs font-bold ${s.color}`}>{s.step}</span>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 10: Meet The Agents — Deep Dive ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[100vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-12 py-16 lg:py-0">
        <motion.div
          className="max-w-7xl w-full relative z-10 space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-3">
              <Users className="w-3 h-3" /> Meet the AI Agents
            </div>
            <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              5 Agents. 5 Roles. One Mission.
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Agent 1 */}
            <div className="bg-black/50 backdrop-blur-xl border border-rose-500/20 rounded-2xl p-4 relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/10 blur-[40px] rounded-full group-hover:bg-rose-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <Search className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-rose-400 font-bold tracking-widest uppercase">Agent 1</p>
                    <h4 className="text-sm font-bold text-white">Supervisor</h4>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">Continuously monitors routes. Calls <span className="text-rose-300 font-semibold">Open-Meteo</span> + <span className="text-rose-300 font-semibold">TomTom</span> APIs, feeds data into the ML model.</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" /><span className="text-neutral-500">Predicts delay via Random Forest</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" /><span className="text-neutral-500">Triggers alarm if delay {'>'}2hrs</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" /><span className="text-neutral-500">Sends Twilio SMS on CRITICAL</span></div>
                </div>
              </div>
            </div>

            {/* Agent 2 */}
            <div className="bg-black/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyan-500/10 blur-[40px] rounded-full group-hover:bg-cyan-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Coins className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">Agent 2</p>
                    <h4 className="text-sm font-bold text-white">Carriers (×5)</h4>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">Compete in a <span className="text-cyan-300 font-semibold">sealed-bid auction</span>. Each checks fleet via <span className="text-cyan-300 font-semibold">Fleetbase</span>, calculates dynamic price.</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /><span className="text-neutral-500">Dynamic pricing (weather × distance)</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /><span className="text-neutral-500">Failing carrier excluded from bids</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" /><span className="text-neutral-500">Real Karrio SDK rate lookups</span></div>
                </div>
              </div>
            </div>

            {/* Agent 3 */}
            <div className="bg-black/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full group-hover:bg-purple-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Database className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-purple-400 font-bold tracking-widest uppercase">Agent 3</p>
                    <h4 className="text-sm font-bold text-white">Warehouse</h4>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">Checks destination hub <span className="text-purple-300 font-semibold">capacity + congestion</span>. Can reject reroutes to prevent cascading failures.</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" /><span className="text-neutral-500">Occupancy % monitoring</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" /><span className="text-neutral-500">Blocks if hub {'>'} 90% full</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" /><span className="text-neutral-500">Recommends alternate hubs</span></div>
                </div>
              </div>
            </div>

            {/* Agent 4 */}
            <div className="bg-black/50 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase">Agent 4</p>
                    <h4 className="text-sm font-bold text-white">Shipment</h4>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">Picks best bid via <span className="text-emerald-300 font-semibold">utility function</span>. Enforces <span className="text-emerald-300 font-semibold">3-tier guardrails</span> before execution.</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /><span className="text-neutral-500">price + time − reliability score</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /><span className="text-neutral-500">AUTONOMOUS / ESCALATE guardrail</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /><span className="text-neutral-500">Generates PDF + Slack alert</span></div>
                </div>
              </div>
            </div>

            {/* Agent 5 */}
            <div className="bg-black/50 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-4 relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 blur-[40px] rounded-full group-hover:bg-amber-500/20 transition-colors" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Brain className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[9px] text-amber-400 font-bold tracking-widest uppercase">Agent 5</p>
                    <h4 className="text-sm font-bold text-white">Learning</h4>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed mb-3">Updates <span className="text-amber-300 font-semibold">carrier reputation</span> after every cycle. Bad carriers get priced out automatically.</p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" /><span className="text-neutral-500">Penalizes failing carrier (−15%)</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" /><span className="text-neutral-500">Rewards winning carrier (+1%)</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" /><span className="text-neutral-500">Gemini writes strategic insight</span></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Flow Diagram */}
          <motion.div variants={fadeUp} className="bg-black/30 backdrop-blur-md border border-white/[0.06] rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold">
              <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">🔍 Supervisor</span>
              <ArrowRight className="w-4 h-4 text-neutral-600" />
              <div className="flex items-center gap-1.5">
                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">💰 Carriers</span>
                <span className="text-neutral-600 text-[9px]">+</span>
                <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">🏭 Warehouse</span>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-600" />
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">📦 Shipment</span>
              <ArrowRight className="w-4 h-4 text-neutral-600" />
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">🧠 Learning</span>
              <span className="text-neutral-600 text-[9px] px-2">Orchestrated by</span>
              <span className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white">LangGraph</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 11: Why Not Just Hardcode? ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[100vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-12 py-16 lg:py-0">
        <motion.div
          className="max-w-6xl w-full relative z-10 space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-3">
              <Swords className="w-3 h-3" /> The Hard Question
            </div>
            <h2 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent leading-tight">
              {"\"Can't this all be hardcoded?\""}
            </h2>
            <p className="text-neutral-400 mt-3 max-w-lg mx-auto text-sm">Parts of it can — and we did. But here are the 5 things that <span className="text-white font-semibold">cannot</span> be replicated by a script.</p>
          </motion.div>

          {/* Two columns: Can vs Can't */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: What IS hardcoded */}
            <div className="lg:col-span-4 bg-black/40 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> What We DID Hardcode</h3>
              <div className="space-y-2 text-xs text-neutral-500">
                {[
                  "5 seeded carriers with base rates",
                  "Utility function formula (price + time − reliability)",
                  "Guardrail thresholds ($500 / $2,000)",
                  "Weather severity → disruption score mapping",
                  "Hub capacity data structure",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500/60 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-600 mt-3 italic">Deterministic logic stays deterministic. That&apos;s good engineering.</p>
            </div>

            {/* Right: What CANNOT be hardcoded */}
            <div className="lg:col-span-8 space-y-3">
              {[
                {
                  num: "1",
                  title: "LLM Contextual Reasoning",
                  desc: "Gemini synthesizes weather severity, carrier SLA tier, and penalty exposure into a novel, situation-specific assessment. A rule engine would need thousands of if/else branches for every combination.",
                  icon: <Brain className="w-5 h-5 text-blue-400" />,
                  cardCls: "border-blue-500/20 hover:border-blue-500/40",
                  iconBg: "bg-blue-500/10 border-blue-500/20",
                  pillCls: "text-blue-400 bg-blue-500/10",
                  example: '"Severe thunderstorm with 0.71 congestion creates cascading hub risk. Recommend immediate reroute."',
                },
                {
                  num: "2",
                  title: "ML Delay Prediction",
                  desc: "The Random Forest interpolates across 6 features (traffic × weather × reliability × distance × hour × weekend) producing a continuous prediction. Not a lookup table.",
                  icon: <BarChart3 className="w-5 h-5 text-violet-400" />,
                  cardCls: "border-violet-500/20 hover:border-violet-500/40",
                  iconBg: "bg-violet-500/10 border-violet-500/20",
                  pillCls: "text-violet-400 bg-violet-500/10",
                  example: "predict_delay() → 8.47 hours | Confidence: 89% | Risk: CRITICAL",
                },
                {
                  num: "3",
                  title: "Dynamic Carrier Pricing",
                  desc: "Budget Freight quotes $280 on sunny days but $420 in a snowstorm. Each carrier's bid changes based on live conditions. A script would need thousands of branches.",
                  icon: <Coins className="w-5 h-5 text-cyan-400" />,
                  cardCls: "border-cyan-500/20 hover:border-cyan-500/40",
                  iconBg: "bg-cyan-500/10 border-cyan-500/20",
                  pillCls: "text-cyan-400 bg-cyan-500/10",
                  example: "base_rate × distance × (1 + weather_severity × 0.5) × surge_factor",
                },
                {
                  num: "4",
                  title: "Self-Improvement Over Time",
                  desc: "After 10 negotiations, a repeatedly failing carrier drops from 95% → 60% reliability. The utility function naturally stops picking them. No human updates a blacklist.",
                  icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
                  cardCls: "border-amber-500/20 hover:border-amber-500/40",
                  iconBg: "bg-amber-500/10 border-amber-500/20",
                  pillCls: "text-amber-400 bg-amber-500/10",
                  example: "Express Logistics: 95% → 80% → 65% → Auto-excluded from future bids",
                },
                {
                  num: "5",
                  title: "Competing Agent Goals (Game Theory)",
                  desc: "Shipment Agent wants cheap. Carriers want profit. Warehouse might reject the cheapest option if the hub is full. Competing interests create emergent behavior a linear script can't replicate.",
                  icon: <Swords className="w-5 h-5 text-rose-400" />,
                  cardCls: "border-rose-500/20 hover:border-rose-500/40",
                  iconBg: "bg-rose-500/10 border-rose-500/20",
                  pillCls: "text-rose-400 bg-rose-500/10",
                  example: "Cheapest bid rejected → Warehouse at 95% → Next best carrier auto-selected",
                },
              ].map((item, i) => (
                <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className={`bg-black/40 backdrop-blur-xl border ${item.cardCls} rounded-xl p-4 flex gap-4 items-start transition-all group`}
                >
                  <div className={`p-2 rounded-lg border ${item.iconBg} shrink-0 mt-0.5`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black ${item.pillCls} px-1.5 py-0.5 rounded`}>{item.num}</span>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-2">{item.desc}</p>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5">
                      <p className="text-[10px] text-neutral-400 font-mono">{item.example}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ SLIDE 12: Demo CTA ═══════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <div className="w-full flex flex-col justify-center max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-6">
              <Target className="w-3 h-3" /> Live Demo
            </div>
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent mb-4 tracking-tight">
              Experience It Live.
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">Launch the 3D Control Tower. Trigger a disruption. Watch 5 agents negotiate in real time.</p>
          </div>

          <div className="flex justify-center mt-6 relative z-50">
            <Link
              href="/dashboard"
              className="group relative bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white px-12 py-5 rounded-full font-black text-xl transition-all hover:scale-[1.03] flex items-center gap-3 shadow-[0_0_50px_rgba(34,211,238,0.3)] hover:shadow-[0_0_80px_rgba(34,211,238,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
              <span className="relative z-10 flex items-center gap-3">
                <MousePointer2 className="w-6 h-6" /> Launch Control Tower
              </span>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
