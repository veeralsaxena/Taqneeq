"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRainWind, Brain, MessageSquareCode, Database, Send, CheckCircle2 } from "lucide-react";

const workflowSteps = [
  {
    id: "detect",
    title: "1. Environmental Triggers",
    desc: "The system continuously polls Open-Meteo and traffic APIs. Suddenly, a massive snowstorm is detected on the primary route.",
    icon: <CloudRainWind className="w-8 h-8 text-rose-400" />,
    color: "bg-rose-500/20 border-rose-500/50",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]"
  },
  {
    id: "evaluate",
    title: "2. Supervisor Evaluation",
    desc: "The Network Supervisor calculates the disruption risk. Since the delay is critical, it triggers the Multi-Agent Framework.",
    icon: <Brain className="w-8 h-8 text-blue-400" />,
    color: "bg-blue-500/20 border-blue-500/50",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]"
  },
  {
    id: "negotiate",
    title: "3. Market Negotiation",
    desc: "Carrier Agents dynamically query Karrio and Fleetbase APIs for real rates and capacities, bidding against the Shipment Agent's budget.",
    icon: <MessageSquareCode className="w-8 h-8 text-purple-400" />,
    color: "bg-purple-500/20 border-purple-500/50",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]"
  },
  {
    id: "commit",
    title: "4. Immutable Event Log",
    desc: "Once a contract is struck, the entire negotiation trace is committed to the Postgres Event Store for auditing and vector-learning.",
    icon: <Database className="w-8 h-8 text-emerald-400" />,
    color: "bg-emerald-500/20 border-emerald-500/50",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]"
  },
  {
    id: "act",
    title: "5. Real-Time Execution",
    desc: "The decision broadcasts over FastAPI WebSockets to the Control Tower, while Native Automation APIs dispatch SMS and Slack alerts.",
    icon: <Send className="w-8 h-8 text-cyan-400" />,
    color: "bg-cyan-500/20 border-cyan-500/50",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.3)]"
  }
];

export function WorkflowExplainer() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 4000); // 4 seconds per step
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex-col lg:flex-row flex gap-8 items-center justify-center p-8 bg-black/40 border border-white/[0.08] rounded-3xl backdrop-blur-xl relative overflow-hidden">
      {/* Background Animated Gradient relative to active step */}
      <div 
        className="absolute inset-0 opacity-20 transition-colors duration-1000 blur-3xl -z-10"
        style={{
            background: `radial-gradient(circle at center, ${workflowSteps[activeStep].color.split(' ')[0].replace('bg-', 'var(--').replace('/20', '')})` 
        }}
      />
      
      {/* Left: Interactive Stepper */}
      <div className="flex-1 w-full flex flex-col gap-4 relative z-10">
        {workflowSteps.map((step, index) => {
            const isActive = index === activeStep;
            const isPast = index < activeStep;
            return (
                <div 
                    key={step.id} 
                    className={`flex gap-4 items-center p-4 rounded-2xl border transition-all duration-500 cursor-pointer ${isActive ? `${step.color} ${step.glow} scale-[1.02] bg-opacity-30` : 'border-white/[0.05] bg-white/[0.02] opacity-50 hover:opacity-80'}`}
                    onClick={() => setActiveStep(index)}
                >
                    <div className="relative">
                        <div className={`p-3 rounded-full border ${isActive ? step.color : 'border-neutral-700 bg-neutral-800 text-neutral-500'}`}>
                            {isPast && !isActive ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : step.icon}
                        </div>
                        {index < workflowSteps.length - 1 && (
                            <div className={`absolute left-1/2 top-full w-0.5 h-6 -translate-x-1/2 ${isPast ? 'bg-emerald-500' : 'bg-neutral-800'}`} />
                        )}
                    </div>
                    <div>
                        <h4 className={`font-bold text-lg mb-1 ${isActive ? 'text-white' : 'text-neutral-400'}`}>{step.title}</h4>
                        <p className={`text-sm leading-relaxed ${isActive ? 'text-white/80' : 'hidden'}`}>
                            {step.desc}
                        </p>
                    </div>
                </div>
            )
        })}
      </div>

      {/* Right: Visual 3D Representation / Focus */}
      <div className="flex-1 w-full h-[400px] bg-[#050505] rounded-2xl border border-neutral-800 relative flex items-center justify-center overflow-hidden">
          {/* Data packet traveling illustration */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 -translate-y-1/2" />
          
          <AnimatePresence mode="wait">
            <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -50 }}
                transition={{ type: "spring", damping: 20 }}
                className={`relative z-10 p-8 rounded-full border-2 ${workflowSteps[activeStep].color} ${workflowSteps[activeStep].glow} bg-black/60 backdrop-blur-md`}
            >
                {React.cloneElement(workflowSteps[activeStep].icon as React.ReactElement<Record<string, unknown>>, { className: "w-16 h-16 " + (workflowSteps[activeStep].icon as React.ReactElement<Record<string, unknown>>).props.className })}
            </motion.div>
          </AnimatePresence>
          
          {/* Connecting particles */}
          <div className="absolute inset-0 pointer-events-none">
             {[...Array(5)].map((_, i) => (
                 <motion.div
                    key={`p-${activeStep}-${i}`}
                    className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
                    initial={{ left: "0%", top: "50%", opacity: 0, scale: 0 }}
                    animate={{ left: "100%", opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                 />
             ))}
          </div>
      </div>
    </div>
  );
}
