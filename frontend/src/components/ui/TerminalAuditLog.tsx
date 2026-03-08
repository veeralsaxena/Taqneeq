"use client";
import { Copy, Terminal, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const auditLogs = [
  { time: "14:02:11.431", type: "INFO", source: "[Observer]", msg: "Polling Open-Meteo API (Lat:28.6, Lng:77.2)" },
  { time: "14:02:11.892", type: "WARN", source: "[Observer]", msg: "CRITICAL WEATHER DETECTED: Snowstorm (Severity:0.9)" },
  { time: "14:02:12.015", type: "EVENT", source: "[System]", msg: "Triggering Logistics Re-Route Protocol" },
  { time: "14:02:12.103", type: "INFO", source: "[Carrier_A]", msg: "Generating bid via Karrio SDK..." },
  { time: "14:02:12.650", type: "BID", source: "[Carrier_A]", msg: "Quote: $1,450. ETA: 48h. Capacity: Verified via Fleetbase." },
  { time: "14:02:12.720", type: "INFO", source: "[Carrier_B]", msg: "Generating bid via Karrio SDK..." },
  { time: "14:02:13.110", type: "BID", source: "[Carrier_B]", msg: "Quote: $2,100. ETA: 24h. Capacity: Verified via Fleetbase." },
  { time: "14:02:13.400", type: "REASON", source: "[Shipment]", msg: "Evaluating utility: Carrier_A (Score: 0.85) vs Carrier_B (Score: 0.92)" },
  { time: "14:02:13.550", type: "DECIDE", source: "[Shipment]", msg: "Carrier_B Selected. High Cost justified by SLA requirement." },
  { time: "14:02:13.805", type: "ACT", source: "[Database]", msg: "Commit Event #88392 -> Postgres 'event_store' table." },
  { time: "14:02:14.210", type: "LEARN", source: "[Learning]", msg: "Updating Carrier_B Trust Vector Embeddings in pgvector." },
];

export function TerminalAuditLog() {
  const [logs, setLogs] = useState<typeof auditLogs>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;
    let i = 0;
    let timer: NodeJS.Timeout;

    const tick = () => {
      if (!isActive) return;
      
      if (i < auditLogs.length) {
        setLogs((prev) => {
          const nextLog = auditLogs[i];
          if (!nextLog) return prev;
          return [...prev, nextLog];
        });
        i++;
        timer = setTimeout(tick, 800);
      } else {
        timer = setTimeout(() => {
          if (!isActive) return;
          i = 0;
          setLogs([]);
          timer = setTimeout(tick, 800);
        }, 3000);
      }
    };

    setLogs([]);
    timer = setTimeout(tick, 800);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getColor = (type: string) => {
    switch (type) {
      case "INFO": return "text-emerald-400";
      case "WARN": return "text-amber-400";
      case "EVENT": return "text-purple-400";
      case "BID": return "text-cyan-400";
      case "REASON": return "text-blue-400";
      case "DECIDE": return "text-rose-400";
      case "ACT": return "text-green-400";
      case "LEARN": return "text-orange-400";
      default: return "text-neutral-400";
    }
  };

  return (
    <div className="w-full h-[400px] bg-[#050505] rounded-xl border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative group">
      {/* Top Bar */}
      <div className="h-10 border-b border-neutral-800 bg-[#0a0a0a] flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono font-medium">
            <Terminal className="w-3 h-3 text-emerald-400" />
            event_sourcing_tail.sh
            </div>
            <div className="text-[9px] text-neutral-600 uppercase tracking-widest mt-0.5">Immutable Ledger</div>
        </div>
        <Copy className="w-4 h-4 text-neutral-600 hover:text-white cursor-pointer transition-colors" />
      </div>

      {/* Terminal Content */}
      <div ref={scrollRef} className="flex-1 p-4 font-mono text-xs overflow-y-auto scroll-smooth hide-scrollbar space-y-2">
        <AnimatePresence>
            {logs.filter(Boolean).map((log, idx) => (
                <motion.div 
                    key={`${log.time}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3"
                >
                    <span className="text-neutral-600 flex-shrink-0">{log.time}</span>
                    <span className={`flex-shrink-0 font-bold w-14 ${getColor(log.type)}`}>
                        {log.type}
                    </span>
                    <span className="text-neutral-500 flex-shrink-0 w-24 hidden sm:block">
                        {log.source}
                    </span>
                    <span className="text-neutral-300">
                        {log.msg}
                    </span>
                </motion.div>
            ))}
        </AnimatePresence>
        
        {/* Blinking Cursor */}
        <div className="flex items-center gap-2 mt-2 text-emerald-400 animate-pulse">
            <ChevronRight className="w-4 h-4" />
            <div className="w-2 h-4 bg-emerald-400" />
        </div>
      </div>
      
      {/* Glare effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
    </div>
  );
}
