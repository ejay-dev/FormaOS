'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useSpring,
} from 'framer-motion';
import { ArrowRight, Play, Sparkles, Shield, FileCheck, BarChart3, CheckCircle } from 'lucide-react';
import { duration, easing } from '@/config/motion';
import { brand } from '@/config/brand';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { useDeviceTier } from '@/lib/device-tier';

const appBase = brand.seo.appUrl.replace(/\/$/, '');
const signatureEase: [number, number, number, number] = [...easing.signature] as [number, number, number, number];

const CAPABILITIES = [
  { icon: Shield, label: 'Structured Controls', color: 'from-violet-500/20 to-violet-600/10', dot: 'bg-violet-400' },
  { icon: FileCheck, label: 'Live Evidence', color: 'from-emerald-500/20 to-emerald-600/10', dot: 'bg-emerald-400' },
  { icon: BarChart3, label: 'Audit-Ready Reports', color: 'from-cyan-500/20 to-cyan-600/10', dot: 'bg-cyan-400' },
];

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'];

export function ProductScrollHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const tierConfig = useDeviceTier();
  const sa = !prefersReduced;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Subtle parallax on scroll (content lifts, visual sinks)
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0.7]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Atmosphere */}
      <HeroAtmosphere topColor="violet" bottomColor="blue" particleIntensity="normal" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 sm:-top-32 sm:-left-32 w-[420px] sm:w-[600px] h-[420px] sm:h-[600px] bg-gradient-to-br from-violet-500/12 via-blue-500/8 to-transparent rounded-full blur-3xl"
          animate={sa ? { scale: [1, 1.08, 1], opacity: [0.2, 0.3, 0.2] } : undefined}
          transition={sa ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 sm:-bottom-32 sm:-right-32 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl"
          animate={sa ? { scale: [1, 1.12, 1], opacity: [0.15, 0.25, 0.15] } : undefined}
          transition={sa ? { duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 } : undefined}
        />
      </div>

      {/* Main content grid */}
      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 pt-28 sm:pt-32 pb-16 sm:pb-20"
        style={sa ? { opacity: sectionOpacity } : undefined}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ═══ LEFT: Text Content ═══ */}
          <motion.div
            className="text-center lg:text-left"
            style={sa ? { y: contentY } : undefined}
          >
            {/* Badge */}
            <motion.div
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slow, delay: 0.15, ease: signatureEase } : { duration: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/25 mb-6 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-400 font-medium tracking-wide">Compliance Operating System</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={sa ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.27, ease: signatureEase } : { duration: 0 }}
              className="text-[2.25rem] sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-5 leading-[1.08] text-white"
            >
              The Compliance OS
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                for Real Organizations
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.39, ease: signatureEase } : { duration: 0 }}
              className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.48, ease: signatureEase } : { duration: 0 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <motion.a
                href={`${appBase}/auth/signup`}
                whileHover={sa ? { scale: 1.03, boxShadow: '0 0 30px rgba(139,92,246,0.3)' } : undefined}
                whileTap={sa ? { scale: 0.98 } : undefined}
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

            {/* Capability chips */}
            <motion.div
              initial={sa ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.6, ease: signatureEase } : { duration: 0 }}
              className="flex flex-wrap gap-3 mt-8 justify-center lg:justify-start"
            >
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60"
                  >
                    <Icon className="w-3.5 h-3.5 text-white/40" />
                    {cap.label}
                  </div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* ═══ RIGHT: Product Visual ═══ */}
          <motion.div
            className="relative flex items-center justify-center"
            style={sa ? { y: visualY } : undefined}
          >
            <motion.div
              initial={sa ? { opacity: 0, scale: 0.92 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={sa ? { duration: duration.slower, delay: 0.35, ease: signatureEase } : { duration: 0 }}
              className="relative w-full max-w-[520px] mx-auto"
            >
              {/* Glow behind the card */}
              <div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)',
                  filter: tierConfig.enableBlur ? 'blur(40px)' : 'blur(20px)',
                }}
              />

              {/* Product preview card */}
              <div
                className="relative rounded-2xl sm:rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.07] to-white/[0.02] shadow-[0_0_80px_rgba(139,92,246,0.08),0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden"
                style={{ backdropFilter: tierConfig.enableBlur ? 'blur(14px)' : undefined }}
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                  </div>
                  <div className="flex-1 mx-4 sm:mx-8">
                    <div className="h-5 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <span className="text-[9px] sm:text-[10px] text-white/20 font-mono">app.formaos.com/dashboard</span>
                    </div>
                  </div>
                </div>

                {/* App layout */}
                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden sm:flex flex-col w-[130px] lg:w-[140px] border-r border-white/[0.04] p-2.5 gap-1">
                    {['Dashboard', 'Controls', 'Evidence', 'Tasks', 'Reports', 'Settings'].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] ${i === 0 ? 'bg-violet-500/15 text-violet-300' : 'text-white/30'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-violet-400' : 'bg-white/15'}`} />
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-white/80">Compliance Dashboard</div>
                        <div className="text-[9px] sm:text-[10px] text-white/30 mt-0.5">All frameworks &bull; Q1 2026</div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400">94%</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                      {[
                        { v: '142', l: 'Controls', c: 'text-cyan-400' },
                        { v: '98%', l: 'Evidence', c: 'text-emerald-400' },
                        { v: '3', l: 'Findings', c: 'text-amber-400' },
                      ].map((s) => (
                        <div key={s.l} className="text-center p-1.5 sm:p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                          <div className={`text-xs sm:text-sm font-bold ${s.c}`}>{s.v}</div>
                          <div className="text-[7px] sm:text-[8px] text-white/25">{s.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Framework rows */}
                    <div className="space-y-1">
                      {[
                        { fw: 'SOC 2 Type II', s: 'Pass', c: 'emerald' },
                        { fw: 'ISO 27001', s: 'Pass', c: 'emerald' },
                        { fw: 'GDPR', s: 'Review', c: 'amber' },
                        { fw: 'HIPAA', s: 'Pass', c: 'emerald' },
                      ].map((r) => (
                        <div key={r.fw} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                          <div className={`w-1.5 h-1.5 rounded-full bg-${r.c}-400`} />
                          <span className="text-[9px] sm:text-[10px] text-white/50 flex-1">{r.fw}</span>
                          <span className={`text-[8px] sm:text-[9px] font-semibold text-${r.c}-400/70`}>{r.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Framework badge strip at bottom */}
                <div className="border-t border-white/[0.05] px-4 py-2.5 flex items-center justify-center gap-4">
                  {FRAMEWORKS.map((fw) => (
                    <div key={fw} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400/50" />
                      <span className="text-[9px] sm:text-[10px] text-white/30 font-medium">{fw}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating accents */}
              {sa && (
                <>
                  <motion.div
                    className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 backdrop-blur-sm"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-semibold text-emerald-400">Audit Ready</span>
                    </div>
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/25 backdrop-blur-sm"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] sm:text-xs font-semibold text-violet-400">142 Controls</span>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom gradient fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(6,10,20,0.8))' }}
      />
    </section>
  );
}

export default ProductScrollHero;
