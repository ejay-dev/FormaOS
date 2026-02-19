"use client";

import Link from "next/link";
import { Layers, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { duration } from '@/config/motion';

const layers = [
  {
    label: "Governance Layer",
    sublabel: "Policy · Controls · Obligations",
    from: "from-cyan-500/20",
    to: "to-blue-500/10",
    border: "border-cyan-500/30",
    dot: "bg-cyan-400",
  },
  {
    label: "Execution Layer",
    sublabel: "Workflows · Tasks · Owners",
    from: "from-blue-500/20",
    to: "to-indigo-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  {
    label: "Evidence Layer",
    sublabel: "Capture · Versioning · Chain",
    from: "from-indigo-500/20",
    to: "to-purple-500/10",
    border: "border-indigo-500/30",
    dot: "bg-indigo-400",
  },
  {
    label: "Audit Layer",
    sublabel: "Export · Defend · Report",
    from: "from-purple-500/20",
    to: "to-pink-500/10",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
];

export function ProductHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Single static radial gradient at top-center */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT: Text content */}
          <div className="flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: duration.slow }}
              className="inline-flex items-center gap-2 sm:gap-2.5 glass-intense rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-secondary/30"
            >
              <Layers className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              Platform Architecture
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: duration.slower }}
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] font-display tracking-tight mb-4 sm:mb-6"
            >
              Compliance Infrastructure
              <br />
              <span className="text-gradient">Built for Audit Defense</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: duration.slower }}
              className="text-base sm:text-xl text-foreground/70 leading-relaxed mb-8 sm:mb-10"
            >
              Connect policies, tasks, evidence, and audit trails into a defensible compliance workflow. Built for organizations that answer to regulators.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: duration.slower }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <Link href="/product" className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group">
                Explore the Platform
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start">
                Request Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT: Architecture diagram */}
          <div className="relative flex flex-col gap-3">
            {layers.map((layer, i) => (
              <motion.div
                key={layer.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.12, duration: duration.slower }}
                className={`relative rounded-xl bg-gradient-to-r ${layer.from} ${layer.to} border ${layer.border} px-6 py-4 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${layer.dot} shrink-0`} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{layer.label}</div>
                    <div className="text-xs text-foreground/50 mt-0.5">{layer.sublabel}</div>
                  </div>
                </div>
                {/* Connector line between layers */}
                {i < layers.length - 1 && (
                  <div className="absolute -bottom-3 left-9 w-px h-3 bg-white/10" />
                )}
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
