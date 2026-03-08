"use client";
import { motion } from "framer-motion";
import { Brain, Package, Truck, Database, Share2 } from "lucide-react";

const nodes = [
  { id: "observer", label: "Network Supervisor", icon: Brain, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", x: "50%", y: "15%" },
  { id: "shipment", label: "Shipment Agent", icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", x: "50%", y: "50%" },
  { id: "carrier1", label: "Carrier A", icon: Truck, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", x: "15%", y: "85%" },
  { id: "carrier2", label: "Carrier B", icon: Truck, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", x: "85%", y: "85%" },
  { id: "warehouse", label: "Warehouse", icon: Database, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", x: "85%", y: "15%" },
];

export function AgentNetworkDiagram() {
  return (
    <div className="w-full aspect-square md:aspect-video lg:aspect-square relative rounded-3xl bg-[#0a0a0a] border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden isolate p-4 md:p-8">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />

      {/* Connection Lines (SVGs) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="line-grad-1" x1="50%" y1="15%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="line-grad-2" x1="85%" y1="15%" x2="50%" y2="15%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="line-grad-3" x1="50%" y1="50%" x2="15%" y2="85%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="line-grad-4" x1="50%" y1="50%" x2="85%" y2="85%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Observer to Shipment */}
        <line x1="50%" y1="15%" x2="50%" y2="50%" stroke="url(#line-grad-1)" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
        {/* Warehouse to Observer */}
        <line x1="85%" y1="15%" x2="50%" y2="15%" stroke="url(#line-grad-2)" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
        {/* Shipment to Carrier 1 */}
        <line x1="50%" y1="50%" x2="15%" y2="85%" stroke="url(#line-grad-3)" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />
        {/* Shipment to Carrier 2 */}
        <line x1="50%" y1="50%" x2="85%" y2="85%" stroke="url(#line-grad-4)" strokeWidth="2" strokeDasharray="4 4" className="opacity-50" />

        {/* Animated Packets */}
        <motion.circle r="3" fill="#10b981"
          animate={{ cx: ["50%", "50%"], cy: ["15%", "50%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle r="3" fill="#06b6d4"
          animate={{ cx: ["15%", "50%"], cy: ["85%", "50%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.circle r="3" fill="#f97316"
          animate={{ cx: ["85%", "50%"], cy: ["85%", "50%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
         <motion.circle r="3" fill="#3b82f6"
          animate={{ cx: ["85%", "50%"], cy: ["15%", "15%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className={`absolute w-20 h-20 md:w-24 md:h-24 -ml-10 -mt-10 md:-ml-12 md:-mt-12 rounded-2xl ${node.bg} border ${node.border} backdrop-blur-md flex flex-col items-center justify-center gap-2 group cursor-pointer shadow-[0_0_30px_rgba(0,0,0,0.5)]`}
          style={{ left: node.x, top: node.y }}
          whileHover={{ scale: 1.1, zIndex: 10 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <node.icon className={`w-8 h-8 md:w-10 md:h-10 ${node.color} drop-shadow-lg group-hover:scale-110 transition-transform`} />
          <span className="text-[9px] md:text-[10px] font-bold text-center text-white/90 leading-tight px-1 uppercase tracking-wider">{node.label}</span>
          
          {/* Active Ping */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${node.bg.replace('/10', '/80')} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${node.bg.replace('/10', '')} border ${node.border}`}></span>
          </span>
        </motion.div>
      ))}

      {/* Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] z-10 backdrop-blur-md">
        <Share2 className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-xs font-semibold text-neutral-300">Live Agent Negotiation Graph</span>
      </div>
    </div>
  );
}
