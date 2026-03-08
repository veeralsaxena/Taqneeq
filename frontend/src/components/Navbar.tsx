"use client";
import Link from "next/link";
import { Zap, Map, Radio, GitBranch, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { name: "Control Tower", url: "/dashboard", icon: Map },
  { name: "Simulator", url: "/simulator", icon: Radio },
  { name: "Workflow", url: "/workflow", icon: GitBranch },
  { name: "Analytics", url: "/analytics", icon: BarChart3 },
];

import { TubelightNavbar } from "@/components/ui/tubelight-navbar";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[40] transition-all duration-700 ${
          scrolled
            ? "bg-black/60 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl"
            : "bg-black/30 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="NeuroLogistics" 
              className="h-16 w-auto object-contain group-hover:brightness-125 transition-all duration-300"
            />
            <span className="text-xl font-bold text-white tracking-tight">
              NeuroLogistics
            </span>
          </Link>

          {/* Tubelight Navbar Center */}
          <div className="hidden lg:flex flex-1 justify-center px-6">
             <TubelightNavbar items={links} />
          </div>

          {/* Right side: Launch button */}
          <div className="hidden md:flex items-center flex-shrink-0">
            <Link
              href="/dashboard"
              className="group relative px-5 py-2 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/80 to-violet-500/80 rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-[1px] bg-black/50 rounded-[10px] backdrop-blur-md" />
              <span className="relative z-10 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Launch App
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
