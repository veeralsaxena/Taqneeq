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
  Activity,
  History,
  Lock,
  Globe2,
  AlertTriangle,
  FileCode2,
  CloudRainWind,
  MessageSquareCode,
  Network
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

export default function PitchDeck() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: window.innerWidth, behavior: "smooth" });
    }
  };

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
        className="flex flex-col lg:flex-row overflow-y-auto lg:overflow-y-hidden lg:overflow-x-auto scroll-smooth w-full h-[calc(100dvh-4rem)] hide-scrollbar relative z-10"
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

      {/* ═══════════════════ SLIDE 1: Hero & Problem ═══════════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[100vw] lg:h-full relative flex items-center py-16 lg:py-0 pr-0 lg:pr-24">
        {/* Sparkles Background */}
        <div className="absolute inset-0 w-full h-full -z-10 overflow-hidden">
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={30}
            className="w-full h-full"
            particleColor="#10b981" // subtle emerald sparkles
          />
        </div>

        {/* Spotlight beam sweep */}
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20 z-[1]" fill="white" />

        <div className="relative z-20 container mx-auto px-6 md:px-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text content */}
            <motion.div
              className="flex flex-col justify-center space-y-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
            >
              <motion.div custom={0} variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 text-xs font-semibold tracking-wider uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  The Problem: Supply Chains Are Reactive
                </div>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} className="mt-4">
                <div className="h-auto w-full flex justify-start items-center overflow-visible">
                  <GooeyText
                    texts={["NeuroLogistics", "Self-Negotiating", "Autonomous Market"]}
                    morphTime={1.4}
                    cooldownTime={1.5}
                    className="h-[60px] md:h-[80px]"
                    textClassName="text-white text-3xl md:text-[4rem] font-black tracking-tighter leading-tight"
                  />
                </div>
              </motion.div>

              <motion.p custom={2} variants={fadeUp} className="text-base md:text-lg text-neutral-400 max-w-xl leading-relaxed">
                When a snowstorm hits or a truck breaks down, millions are lost in latency while humans manually scramble to call carriers and compare rates. We built an <span className="text-cyan-400 font-semibold">Autonomous Agentic Economy</span> that detects, negotiates, and resolves disruptions in sub-seconds.
              </motion.p>

              {/* Mini stats row */}
              <motion.div custom={2.5} variants={fadeUp} className="flex flex-wrap gap-4 md:gap-8 py-4 border-t border-white/[0.06]">
                {[
                  { value: "5", label: "Autonomous Agents" },
                  { value: "< 2ms", label: "Resolve Latency" },
                  { value: "100%", label: "Real Data Feeds" },
                ].map((stat, i) => (
                  <div key={i} className="min-w-[120px]">
                    <p className="text-xl md:text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[10px] md:text-[11px] text-neutral-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: 3D Robot */}
            <motion.div
              className="relative h-[450px] lg:h-[550px] hidden lg:block lg:translate-x-12 xl:translate-x-20"
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
          className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-neutral-600"
          animate={{ x: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[10px] tracking-[0.3em] uppercase">Swipe To Explore</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ═══════════════════ SLIDE 2: Multi-Agent Architecture ═══════════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <div className="max-w-7xl w-full relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="space-y-6 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
              <Share2 className="w-3 h-3" /> LangGraph Multi-Agent Economy
            </div>
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              Not a monolithic bot. <br />We built a free market.
            </h2>
            <p className="text-neutral-400 leading-relaxed text-sm md:text-base max-w-xl">
              Using the latest LangGraph state machine, we designed 5 distinct AI nodes with competing utility functions. The Shipment Agent wants cheap/fast delivery. The Carrier Agents want maximum profit. They negotiate against each other using Game Theory.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                { title: "Network Supervisor", desc: "Polls live weather/traffic. Calculates risk via ML.", icon: <Brain className="w-5 h-5 text-blue-400"/> },
                { title: "Carrier Agents", desc: "Dynamic pricing via real Karrio FedEx/UPS APIs.", icon: <Truck className="w-5 h-5 text-cyan-400"/> },
                { title: "Warehouse Agent", desc: "Monitors real-time capacity and port congestion.", icon: <Database className="w-5 h-5 text-purple-400"/> },
                { title: "Shipment Agent", desc: "Utility-based bid selection (Cost vs ETA).", icon: <Package className="w-5 h-5 text-emerald-400"/> },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-300 group">
                  <div className="mt-0.5 p-2 bg-white/[0.04] rounded-lg border border-white/[0.04]">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-neutral-200 text-sm mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full max-w-[500px]">
             <AgentNetworkDiagram />
          </div>
        </div>
      </section>

      {/* ═══════════════════ SLIDE 3: Execution & Real Data ═══════════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="flex flex-col w-full max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-10 w-full">
            <motion.div variants={fadeUp} custom={0} className="w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-6">
                <Globe2 className="w-3 h-3" /> Real-World Integrations
              </div>
              <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                No mock toys. Real APIs.
              </h2>
              <p className="text-lg text-neutral-400 mt-4 leading-relaxed max-w-xl">
                Hackathons are full of simple LLM wrappers. We integrated actual supply chain software and domain grounding to prove this handles real enterprise loads.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="w-full max-w-[400px] mx-auto lg:max-w-none flex justify-center lg:justify-end mt-8 lg:mt-0">
                <InteractiveGlobe />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════ SLIDE 3B: Bento Grid Stack ═══════════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <motion.div
          className="flex flex-col w-full max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} className="text-center mb-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-white">
                Powered by a serious stack.
              </h2>
          </motion.div>

          <motion.div variants={fadeUp} className="w-full">
            <BentoGrid className="lg:grid-rows-2">
            {[
              { 
                name: "FedEx/UPS Live Rates", 
                description: "Integrated Karrio SDK. Agents pull real estimates instead of guessing.", 
                Icon: Truck, 
                href: "/dashboard",
                cta: "See Agents",
                background: <img src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="shipping containers" />,
                className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3" 
              },
              { 
                name: "Domain Fine-Tuning", 
                description: "A 1,500+ character logistics system prompt injected via Gemini 2.0.", 
                Icon: FileCode2,
                href: "/dashboard",
                cta: "View Prompts", 
                background: <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="ai processor" />,
                className: "lg:col-start-2 lg:col-end-4 lg:row-start-1 lg:row-end-2" 
              },
              { 
                name: "Fleetbase Integration", 
                description: "REST client querying actual fleet positioning data and capacity.", 
                Icon: Map,
                href: "/dashboard",
                cta: "Track Fleet", 
                background: <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="map navigation" />,
                className: "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3" 
              },
              { 
                name: "WebSockets", 
                description: "FastAPI WebSocket routes broadcast every negotiation in milliseconds.", 
                Icon: Zap,
                href: "/dashboard",
                cta: "View Feed", 
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

      {/* ═══════════════════ SLIDE 4: Enterprise Safety ═══════════════════ */}
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
                        <p className="text-sm text-neutral-400 leading-relaxed">AI shouldn't have a blank check. If a reroute costs {'<'} $500, the agents execute it instantly. Above $1,000 algorithms immediately halt the process and escalate to a human dispatcher.</p>
                    </div>
                    
                    <div className="bg-black/40 backdrop-blur-xl border border-rose-500/30 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.1)] group hover:border-rose-500/50 transition-colors">
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-rose-500/20 blur-[50px] rounded-full group-hover:bg-rose-500/30 transition-colors" />
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <History className="w-8 h-8 text-rose-400" />
                            <div>
                                <h3 className="text-xl font-bold text-white">Event Sourcing Audit Trail</h3>
                                <p className="text-xs text-neutral-400">Zero black box AI. Frame-by-frame replay.</p>
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
                <Lock className="w-3 h-3" /> Enterprise Ready AI
                </div>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent leading-tight">
                Built for safety.<br />Designed for scale.
                </h2>
                <p className="text-neutral-400 leading-relaxed text-sm md:text-base max-w-xl">
                We anticipated the major critiques of LLM orchestration: "How do you audit it?" and "What if it spends too much?". Our architecture specifically features rollbacks, strict guardrail thresholds, and mathematical reputation penalization via pgvector databases.
                </p>
            </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════ SLIDE 5: 3D Workflow Explainer ═══════════════════ */}
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
                  <Network className="w-3 h-3" /> Architecture Flow
                </div>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                  The End-to-End Autonomous Lifecycle
                </h2>
                <p className="text-neutral-400 mt-4">Follow the path of a disruption from detection to autonomous resolution.</p>
            </motion.div>
            
            <motion.div variants={fadeUp} className="w-full">
                <WorkflowExplainer />
            </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════ SLIDE 6: Demo Guide CTA ═══════════════════ */}
      <section className="flex-none min-h-[100dvh] lg:min-h-0 min-w-full lg:min-w-[85vw] lg:h-full relative flex items-center justify-center p-6 md:p-8 lg:pr-24 py-16 lg:py-0">
        <div className="w-full flex flex-col justify-center max-w-5xl mx-auto space-y-8 relative z-10">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-6">
              <Target className="w-3 h-3" /> Impact
            </div>
            <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent mb-4 tracking-tight">
              Experience The Future
            </h2>
            <p className="text-neutral-400 text-lg">Click the button below to launch the live 3D Control Tower and initiate an AI negotiation.</p>
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
