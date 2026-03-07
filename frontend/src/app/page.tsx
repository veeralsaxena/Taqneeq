"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Zap,
  Target,
  Brain,
  Database,
  Cpu,
  Share2,
  MousePointer2,
  GitBranch,
  Radio,
  BarChart3,
  Map,
  Truck,
  Package,
  Shield,
} from "lucide-react";
import { SplineScene } from "@/components/ui/SplineScene";
import { GooeyText } from "@/components/ui/GooeyText";
import { Spotlight } from "@/components/ui/Spotlight";
import LogisticsNetwork from "@/components/ui/LogisticsNetwork";

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

export default function PitchDeck() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: window.innerWidth, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full h-[calc(100vh-4rem)] hide-scrollbar"
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

      {/* ═══════════════════ SLIDE 1: Hero ═══════════════════ */}
      <section className="flex-none w-screen h-full snap-center relative flex items-center overflow-hidden">
        {/* Animated logistics network background */}
        <div className="absolute inset-0 -z-20">
          <LogisticsNetwork />
        </div>

        {/* Deep dark vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,black_80%)] -z-10" />

        {/* Spotlight beam sweep */}
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 z-[1]" fill="white" />

        {/* Video background (optional) */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover -z-25 opacity-15 mix-blend-screen"
          src="/bg-logistics.mp4"
        />

        <div className="relative z-20 container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text content */}
            <motion.div
              className="flex flex-col justify-center space-y-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            >
              <motion.div custom={0} variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Agentic AI for Logistics & Supply Chain
                </div>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} className="mt-4">
                <div className="h-[70px] md:h-[80px] w-full flex justify-start items-center overflow-visible">
                  <GooeyText
                    texts={["NeuroLogistics", "Self-Negotiating", "Autonomous Market"]}
                    morphTime={1.4}
                    cooldownTime={1.5}
                    className="h-[70px] md:h-[80px]"
                    textClassName="text-white text-4xl md:text-[4rem] font-black tracking-tighter h-[70px] md:h-[80px] leading-[70px] md:leading-[80px]"
                  />
                </div>
              </motion.div>

              <motion.p custom={2} variants={fadeUp} className="text-lg text-neutral-400 max-w-xl leading-relaxed">
                Supply chains fail from cascading micro-disruptions. Our AI agents don&apos;t just detect problems — they{" "}
                <span className="text-cyan-400 font-semibold">negotiate solutions autonomously</span>.
              </motion.p>

              {/* Mini stats row */}
              <motion.div custom={2.5} variants={fadeUp} className="flex gap-8 py-4 border-t border-white/[0.06]">
                {[
                  { value: "5", label: "AI Agents" },
                  { value: "< 2s", label: "Resolution" },
                  { value: "100%", label: "Autonomous" },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div custom={3} variants={fadeUp} className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="group relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.03] shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:shadow-[0_0_60px_rgba(34,211,238,0.35)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center gap-2">
                    <MousePointer2 className="w-5 h-5" />
                    Launch Dashboard
                  </span>
                </Link>
                <button
                  onClick={scrollNext}
                  className="group flex items-center gap-2 px-7 py-4 border border-white/10 text-neutral-300 rounded-2xl font-medium hover:border-white/25 hover:text-white transition-all duration-300 hover:scale-[1.03] backdrop-blur-sm bg-white/[0.02]"
                >
                  Explore Architecture
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>

            {/* Right: 3D Robot */}
            <motion.div
              className="relative h-[450px] lg:h-[550px] hidden lg:block"
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

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-600"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </motion.div>
      </section>

      {/* ═══════════════════ SLIDE 2: Architecture ═══════════════════ */}
      <section className="flex-none w-screen h-full snap-center relative flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black -z-20" />
        <div className="absolute inset-0 -z-10">
          <LogisticsNetwork />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80 -z-5" />

        <div className="max-w-6xl w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
                <Share2 className="w-3 h-3" /> Multi-Agent Architecture
              </div>
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                Not a monolithic bot. <br />An intelligent economy.
              </h2>
              <p className="text-neutral-400 leading-relaxed">
                A 5-node LangGraph state machine where agents have competing utility functions. Shipments want cheap/fast delivery. Carriers want maximum profit. They negotiate.
              </p>
              <div className="space-y-3">
                {[
                  { title: "Observer Agent", desc: "Polls real-time Open-Meteo weather data via MCP.", icon: "🔍" },
                  { title: "Shipment Agent", desc: "Calculates utility across multiple carrier bids.", icon: "📦" },
                  { title: "Carrier Agents", desc: "Dynamic pricing based on weather/traffic severity.", icon: "🚛" },
                  { title: "Learning Agent", desc: "Updates pgvector Reputation DB. Penalizes bad actors.", icon: "🧠" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-300 group">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-neutral-200 text-sm">{item.title}</h4>
                      <p className="text-xs text-neutral-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/60 border border-white/[0.06] rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl group">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[80px]" />
              <h3 className="text-2xl font-bold mb-6 relative z-10">The O.R.D.A.L Loop</h3>
              <ul className="space-y-0 relative z-10">
                {[
                  { phase: "Observe", detail: "ML Predictor + Live APIs", color: "bg-blue-500" },
                  { phase: "Reason", detail: "Calculate Delay Risk", color: "bg-purple-500" },
                  { phase: "Decide", detail: "Multi-Agent Bidding (RFQ)", color: "bg-cyan-500" },
                  { phase: "Act", detail: "Reroute & Update DB", color: "bg-rose-500" },
                  { phase: "Learn", detail: "Adjust Trust Scoring", color: "bg-amber-500" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 py-4 border-b border-white/[0.04] last:border-0 group/item hover:pl-2 transition-all">
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-[0_0_10px_currentColor]`} />
                    <span className="font-bold text-sm text-neutral-200 w-20">{item.phase}</span>
                    <span className="text-xs text-neutral-500 font-mono">{item.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <button onClick={scrollNext} className="absolute bottom-8 right-12 flex items-center gap-2 text-neutral-600 hover:text-white transition-colors group">
          <span className="text-[10px] tracking-[0.3em] uppercase font-mono">Tech Stack</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
        </button>
      </section>

      {/* ═══════════════════ SLIDE 3: Tech Stack ═══════════════════ */}
      <section className="flex-none w-screen h-full snap-center relative flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black -z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-900/15 via-transparent to-transparent -z-10" />

        <motion.div
          className="flex flex-col items-center text-center max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div variants={fadeUp} custom={0} className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wider uppercase mb-6">
              <Database className="w-3 h-3" /> Open Source Powered
            </div>
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Production-Grade Stack
            </h2>
            <p className="text-lg text-neutral-500 mt-4 max-w-2xl mx-auto">
              Every component is open-source, battle-tested, and enterprise-ready.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
            {[
              { label: "LangGraph", desc: "Agent Orchestration", icon: GitBranch, accent: "from-emerald-500/20 to-transparent" },
              { label: "pgvector", desc: "Vector DB + Memory", icon: Database, accent: "from-purple-500/20 to-transparent" },
              { label: "MCP", desc: "Secure Tool Calling", icon: Shield, accent: "from-blue-500/20 to-transparent" },
              { label: "Open-Meteo", desc: "Live Weather API", icon: Radio, accent: "from-cyan-500/20 to-transparent" },
              { label: "Scikit-Learn", desc: "ML Predictor", icon: Brain, accent: "from-rose-500/20 to-transparent" },
              { label: "FastAPI", desc: "High-Perf Backend", icon: Zap, accent: "from-amber-500/20 to-transparent" },
              { label: "Next.js", desc: "React Frontend", icon: Cpu, accent: "from-indigo-500/20 to-transparent" },
              { label: "React Flow", desc: "Workflow Viz", icon: Share2, accent: "from-teal-500/20 to-transparent" },
            ].map((tech, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                className="relative bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl flex flex-col items-center justify-center text-center hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-500 group overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${tech.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <tech.icon className="w-6 h-6 text-neutral-500 group-hover:text-white mb-3 transition-colors relative z-10" />
                <span className="font-bold text-neutral-200 mb-0.5 group-hover:text-white transition-colors relative z-10 text-sm">{tech.label}</span>
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest leading-tight relative z-10">{tech.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <button onClick={scrollNext} className="absolute bottom-8 right-12 flex items-center gap-2 text-neutral-600 hover:text-white transition-colors group">
          <span className="text-[10px] tracking-[0.3em] uppercase font-mono">Demo Guide</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
        </button>
      </section>

      {/* ═══════════════════ SLIDE 4: Demo Guide ═══════════════════ */}
      <section className="flex-none w-screen h-full snap-center relative flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-black -z-20" />
        <div className="absolute inset-0 -z-10">
          <LogisticsNetwork />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_75%)] -z-5" />

        <div className="w-full flex flex-col justify-center max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-6">
              <Target className="w-3 h-3" /> Hackathon Demo
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-4">
              Demo Walkthrough
            </h2>
            <p className="text-neutral-500">Follow these 4 screens to blow the judges&apos; minds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {[
              { icon: Map, color: "cyan", borderColor: "hover:border-cyan-500/40", iconColor: "text-cyan-400", glowColor: "from-cyan-500/10", title: "1. Control Tower", desc: "Start here. The killer feature is the Agent Market Feed terminal — proving agents negotiate live." },
              { icon: Radio, color: "rose", borderColor: "hover:border-rose-500/40", iconColor: "text-rose-400", glowColor: "from-rose-500/10", title: "2. Anomaly Simulator", desc: "Hit the Chaos Panel. Inject a Snowstorm. Watch the ML Predictor gauge jump to CRITICAL risk." },
              { icon: GitBranch, color: "purple", borderColor: "hover:border-purple-500/40", iconColor: "text-purple-400", glowColor: "from-purple-500/10", title: "3. Workflow Visualizer", desc: 'Show the "brain." Click Simulate Flow to watch the LangGraph state machine light up.' },
              { icon: BarChart3, color: "emerald", borderColor: "hover:border-emerald-500/40", iconColor: "text-emerald-400", glowColor: "from-emerald-500/10", title: "4. Analytics", desc: "End here. Prove the bad carrier lost 15% trust. The system learns and adapts." },
            ].map((item, i) => (
              <div
                key={i}
                className={`bg-black/40 backdrop-blur-xl border border-white/[0.06] p-6 rounded-2xl relative overflow-hidden group ${item.borderColor} transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6 relative z-50">
            <Link
              href="/dashboard"
              className="group relative bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white px-10 py-4 rounded-full font-bold text-lg transition-all hover:scale-[1.03] flex items-center gap-3 shadow-[0_0_50px_rgba(34,211,238,0.2)] hover:shadow-[0_0_70px_rgba(34,211,238,0.35)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-3">
                <MousePointer2 className="w-6 h-6" /> Launch Dashboard
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
