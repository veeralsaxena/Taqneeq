"use client";
import Link from "next/link";
import { Zap, Map, Radio, GitBranch, BarChart3, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TubelightNavbar } from "@/components/ui/tubelight-navbar";

const links = [
  { name: "Control Tower", url: "/dashboard", icon: Map },
  { name: "Simulator", url: "/simulator", icon: Radio },
  { name: "Workflow", url: "/workflow", icon: GitBranch },
  { name: "Analytics", url: "/analytics", icon: BarChart3 },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[50] transition-all duration-700 ${
          scrolled || mobileMenuOpen
            ? "bg-black/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl"
            : "bg-black/30 backdrop-blur-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between py-2.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <img 
              src="/logo.png" 
              alt="NeuroLogistics" 
              className="h-10 sm:h-12 w-auto object-contain group-hover:brightness-125 transition-all duration-300"
            />
            <span className="text-xl font-bold text-white tracking-tight">
              NeuroLogistics
            </span>
          </Link>

          {/* Tubelight Navbar Center (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center px-6">
             <TubelightNavbar items={links} />
          </div>

          {/* Right side: Launch button (Desktop) */}
          <div className="hidden lg:flex items-center flex-shrink-0">
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

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] pt-[72px] bg-black/95 backdrop-blur-3xl lg:hidden flex flex-col"
          >
            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Navigation</p>
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 text-lg font-medium text-neutral-300 hover:text-white p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                    >
                      <div className="p-2 rounded-lg bg-white/5">
                        <Icon className="w-5 h-5" />
                      </div>
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full group relative px-5 py-4 flex justify-center rounded-xl text-base font-bold text-white overflow-hidden transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/80 to-violet-500/80 rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-400 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-[1px] bg-black/50 rounded-[10px] backdrop-blur-md" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    Launch App
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
