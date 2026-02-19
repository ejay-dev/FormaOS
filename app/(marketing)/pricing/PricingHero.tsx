"use client";

import Link from "next/link";
import { TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { duration } from '@/config/motion';

const valuePills = [
  "No setup fees",
  "14-day free trial",
  "Cancel anytime",
];

export function PricingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Asymmetric gradient background — warm amber/gold top-right, blue bottom-left */}
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[600px] rounded-full bg-amber-500/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[500px] rounded-full bg-blue-500/8 blur-[80px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: duration.slow }}
          className="inline-flex items-center gap-2 sm:gap-2.5 glass-intense rounded-full px-4 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-6 sm:mb-8 border border-secondary/30"
        >
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
          Transparent, Usage-Based Pricing
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: duration.slower }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] sm:leading-[1.08] font-display tracking-tight mb-4 sm:mb-6"
        >
          One Platform,
          <br />
          <span className="text-gradient">Every Compliance Need</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: duration.slower }}
          className="text-base sm:text-xl md:text-2xl text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-8"
        >
          From solo compliance leads to enterprise risk teams. Pay for what you use. Scale without switching tools.
        </motion.p>

        {/* Value-prop pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: duration.slower }}
          className="flex flex-wrap items-center justify-center gap-4 mb-10"
        >
          {valuePills.map((pill) => (
            <span key={pill} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {pill}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: duration.slower }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#pricing-plans"
            className="w-full sm:w-auto rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            See Pricing Plans
          </a>
          <Link
            href="/contact"
            className="w-full sm:w-auto text-sm font-semibold leading-6 text-foreground hover:text-primary transition-colors flex items-center justify-center sm:justify-start"
          >
            Talk to Sales <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
