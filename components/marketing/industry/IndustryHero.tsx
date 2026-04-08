'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Shield, CheckCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export interface IndustryHeroProps {
  eyebrow: string;
  headline: ReactNode;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  trustSignals: string[];
  dashboardVisual: ReactNode;
}

export function IndustryHero({
  eyebrow,
  headline,
  subheadline,
  primaryCta,
  secondaryCta,
  trustSignals,
  dashboardVisual,
}: IndustryHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,212,251,0.08)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/4 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(160,131,255,0.06)_0%,transparent_70%)]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy column */}
          <div className="max-w-2xl">
            {/* Eyebrow badge */}
            <motion.div {...fadeUp(0)} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan-300">
                <Shield className="h-3.5 w-3.5" />
                {eyebrow}
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.1)}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.08] tracking-tight text-white font-[var(--font-display)]"
            >
              {headline}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp(0.2)}
              className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-400 max-w-xl"
            >
              {subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              {...fadeUp(0.3)}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href={primaryCta.href}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:brightness-110"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20"
              >
                {secondaryCta.label}
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              {...fadeUp(0.4)}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {trustSignals.map((signal) => (
                <span
                  key={signal}
                  className="inline-flex items-center gap-1.5 text-[13px] text-slate-500"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-cyan-500/70" />
                  {signal}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Dashboard visual column */}
          <motion.div {...fadeUp(0.3)} className="relative lg:pl-4">
            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-1 shadow-2xl shadow-black/40">
              <div className="rounded-xl bg-[#0d1117]/80 backdrop-blur-sm overflow-hidden">
                {dashboardVisual}
              </div>
            </div>
            {/* Glow effect behind dashboard */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-cyan-500/10 blur-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
