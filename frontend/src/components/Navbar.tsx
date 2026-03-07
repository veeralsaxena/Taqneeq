"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Map, Radio, GitBranch, BarChart3, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { href: "/dashboard", label: "Control Tower", icon: Map },
  { href: "/simulator", label: "Simulator", icon: Radio },
  { href: "/workflow", label: "Workflow", icon: GitBranch },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "bg-black/40 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          : "bg-black/20 backdrop-blur-xl border-b border-white/[0.03]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.15em] uppercase text-white/90 group-hover:text-white transition-colors leading-tight">
              Neural Logistics
            </span>
            <span className="text-[9px] text-white/30 tracking-wider uppercase font-medium">
              Autonomous Supply Chain
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-2xl p-1 border border-white/[0.04]">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                  active
                    ? "text-white bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_3px_rgba(0,0,0,0.3)]"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <l.icon className="w-3.5 h-3.5" />
                {l.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: Launch button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/dashboard"
            className="group relative px-5 py-2 rounded-xl text-xs font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/80 to-violet-500/80 rounded-xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-[1px] bg-black/40 rounded-[10px] backdrop-blur-sm" />
            <span className="relative z-10 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Launch
            </span>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.05]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/60 backdrop-blur-2xl border-t border-white/[0.06] p-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.05] transition-all text-sm"
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
