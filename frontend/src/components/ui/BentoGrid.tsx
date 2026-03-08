"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  glowColor = "rgba(168, 85, 247, 0.15)",
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  glowColor?: string;
}) => {
  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className={cn(
        "row-span-1 border border-white/[0.08] backdrop-blur-md bg-black/40 rounded-3xl p-6 justify-between flex flex-col space-y-4 relative overflow-hidden group/bento",
        className
      )}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 ease-in-out"
        style={{
           background: `radial-gradient(ellipse at 50% -20%, ${glowColor}, transparent 70%)`
        }}
      />
      <div className="flex-1 w-full bg-black/60 border border-white/[0.04] rounded-2xl overflow-hidden relative min-h-[6rem]">
          {header}
      </div>
      <div className="group-hover/bento:-translate-y-2 transition duration-500 delay-75 z-10 relative">
        <div className="mb-3 p-3 w-fit bg-white/[0.04] rounded-xl border border-white/[0.04] group-hover/bento:scale-110 transition-transform duration-500">
            {icon}
        </div>
        <div className="font-sans font-bold text-white mb-2 text-lg">
          {title}
        </div>
        <div className="font-sans font-normal text-neutral-400 text-sm leading-relaxed">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
