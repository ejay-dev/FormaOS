'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
} from 'framer-motion';
import { ArrowRight, Play, Sparkles, Shield, FileCheck, BarChart3, CheckCircle } from 'lucide-react';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const CAPABILITIES = [
  { icon: Shield, label: 'System-Enforced Controls' },
  { icon: FileCheck, label: 'Automated Evidence Capture' },
  { icon: BarChart3, label: 'Regulator-Ready Audit Packets' },
] as const;

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA', 'NDIS'] as const;

export function ProductScrollHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const shouldAnimate = !prefersReduced;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-20"
    >
      {/* Subtle background teal glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(20,184,166,0.10)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0a0f1c]" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-[55fr_45fr] gap-12 lg:gap-16 items-center">

          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slow, delay: 0.15 } : { duration: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-teal-400/25 bg-teal-500/10"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-300 font-medium tracking-wide">Compliance Operating System</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={shouldAnimate ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.27 } : { duration: 0 }}
              className="text-[2.25rem] sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-5 leading-[1.08] text-white"
            >
              The Compliance OS
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                for Real Organizations
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.39 } : { duration: 0 }}
              className="text-base sm:text-lg lg:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Turn regulatory obligations into system-enforced controls, owned evidence, and audit-ready outcomes — continuously and in real time.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.48 } : { duration: 0 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <motion.a
                href={`${appBase}/auth/signup`}
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                className="mk-btn mk-btn-primary group px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
              <Link
                href="/contact"
                className="mk-btn mk-btn-secondary group px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
              >
                <Play className="w-5 h-5" />
                <span>Request Demo</span>
              </Link>
            </motion.div>

            {/* Capability badges */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.6 } : { duration: 0 }}
              className="flex flex-wrap gap-2 mt-8 justify-center lg:justify-start"
            >
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.label}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-sm text-slate-400"
                  >
                    <Icon className="w-3.5 h-3.5 text-teal-400/70" />
                    {cap.label}
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right: Dashboard preview */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimate ? { duration: duration.slower, delay: 0.35 } : { duration: 0 }}
            whileHover={shouldAnimate ? { y: -4 } : undefined}
            className="relative w-full max-w-[520px] mx-auto"
          >
            {/* Dashboard card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
              {/* Top illumination */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent" />

              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.12]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.12]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.12]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-5 rounded-md bg-white/[0.04] flex items-center justify-center">
                    <span className="text-[10px] text-white/20 font-mono">app.formaos.com.au/dashboard</span>
                  </div>
                </div>
              </div>

              {/* App layout */}
              <div className="flex">
                {/* Sidebar */}
                <div className="hidden sm:flex flex-col w-[130px] border-r border-white/[0.04] p-2.5 gap-1">
                  {['Dashboard', 'Controls', 'Evidence', 'Tasks', 'Reports', 'Settings'].map((item, i) => (
                    <div
                      key={item}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] ${
                        i === 0
                          ? 'bg-teal-500/15 text-teal-300'
                          : 'text-white/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-teal-400' : 'bg-white/15'}`} />
                      {item}
                    </div>
                  ))}
                </div>

                {/* Content area */}
                <div className="flex-1 p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs font-semibold text-white/80">Compliance Dashboard</div>
                      <div className="text-[9px] text-white/30 mt-0.5">All frameworks · Q1 2026</div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[9px] font-bold text-emerald-400">94%</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { v: '142', l: 'Controls', c: 'text-teal-400' },
                      { v: '98%', l: 'Evidence', c: 'text-emerald-400' },
                      { v: '3', l: 'Findings', c: 'text-amber-400' },
                    ].map((s) => (
                      <div key={s.l} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                        <div className={`text-xs font-bold ${s.c}`}>{s.v}</div>
                        <div className="text-[8px] text-white/25">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Framework rows */}
                  <div className="space-y-1">
                    {[
                      { fw: 'SOC 2 Type II', s: 'Pass', c: 'emerald' },
                      { fw: 'ISO 27001', s: 'Pass', c: 'emerald' },
                      { fw: 'NDIS Practice Standards', s: 'Pass', c: 'emerald' },
                      { fw: 'GDPR', s: 'Review', c: 'amber' },
                    ].map((r) => (
                      <div key={r.fw} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${r.c}-400`} />
                        <span className="text-[9px] text-white/50 flex-1">{r.fw}</span>
                        <span className={`text-[8px] font-semibold text-${r.c}-400/70`}>{r.s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Framework badge strip */}
              <div className="border-t border-white/[0.05] px-4 py-2.5 flex items-center justify-center gap-4 bg-white/[0.01]">
                {FRAMEWORKS.map((fw) => (
                  <div key={fw} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400/50" />
                    <span className="text-[9px] text-white/30 font-medium">{fw}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Static badge accents */}
            <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/10">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Audit Ready</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -left-2 px-3 py-1.5 rounded-xl border border-teal-400/20 bg-teal-500/10">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-teal-400" />
                <span className="text-xs font-semibold text-teal-400">142 Controls Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ProductScrollHero;
