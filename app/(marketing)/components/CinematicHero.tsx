'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { duration, easing } from '@/config/motion';
import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Zap, Shield, Activity } from 'lucide-react';
import {
  ParallaxLayer,
} from '@/components/motion';

const appBase = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au'
).replace(/\/$/, '');

export function CinematicHero() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return (
    <section className="home-hero relative min-h-[100svh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 md:pt-0">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Radial gradient overlays */}
      <div className="pointer-events-none absolute md:-top-40 md:left-1/2 md:-translate-x-1/2 md:h-[600px] md:w-[600px] md:blur-[120px] hidden md:block rounded-full bg-primary/20" />
      <div className="pointer-events-none absolute md:-bottom-40 md:left-1/4 md:h-[500px] md:w-[500px] md:blur-[100px] hidden md:block rounded-full bg-secondary/15" />
      <div className="pointer-events-none absolute md:top-1/2 md:right-1/4 md:h-[400px] md:w-[400px] md:blur-[80px] hidden md:block rounded-full bg-accent/10" />

      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 py-8 md:py-28">
        <div className="flex flex-col md:grid md:grid-cols-[0.9fr_1fr] gap-12 md:gap-16 items-center md:items-center">
          {/* Left: Text content */}
          <ParallaxLayer speed={0.3}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: duration.slower,
                ease: [...easing.signature],
              }}
              className="space-y-6 md:space-y-10 max-w-lg w-full mx-auto md:mx-0 md:max-w-lg text-center md:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: duration.slow }}
                className="inline-flex items-center gap-2.5 rounded-full glass-intense px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-primary/30 mx-auto md:mx-0"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
                Enterprise Compliance OS
              </motion.div>

              {/* Main headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: duration.slower }}
                className="space-y-2 md:space-y-3"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] font-hero tracking-[-0.02em]">
                  Operational
                </div>
                <span className="relative block pb-3 md:pb-4">
                  <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold leading-[1.02] font-hero tracking-[-0.025em] text-gradient">
                    Compliance
                  </span>
                  {/* Animated shimmer divider */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: duration.slower }}
                    className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full origin-left overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(90deg, rgb(56, 189, 248), rgb(139, 92, 246), rgb(6, 182, 212))',
                    }}
                  >
                    {/* Shimmer sweep effect */}
                    <motion.div
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        repeatDelay: 1,
                      }}
                      className="absolute inset-0 w-1/3"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                        filter: 'blur(8px)',
                      }}
                    />
                  </motion.div>
                </span>
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem] font-bold leading-[1.12] font-hero tracking-[-0.02em] text-foreground/90 pt-1">
                  Operating System
                </div>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: duration.slower }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/80 leading-relaxed pt-2 md:pt-4"
              >
                Transform regulatory obligations into{' '}
                <span className="font-semibold text-primary">
                  executable controls
                </span>
                ,{' '}
                <span className="font-semibold text-secondary">
                  traceable evidence
                </span>
                , and{' '}
                <span className="font-semibold text-accent">
                  audit-ready governance
                </span>
                .
              </motion.p>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: duration.slower }}
                className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 pt-2 md:pt-6 pb-2 md:pb-6"
              >
                {[
                  { icon: Activity, value: '94%', label: 'Avg. Posture' },
                  { icon: Shield, value: '127', label: 'Active Controls' },
                  { icon: Zap, value: '< 2min', label: 'Audit Export' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                    className="glass-panel rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 hover:glass-intense transition-all group"
                  >
                    <div className="rounded-md sm:rounded-lg bg-primary/10 p-1.5 sm:p-2 group-hover:scale-110 transition-transform">
                      <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-lg font-bold font-display">
                        {stat.value}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: duration.slower }}
                className="flex flex-col sm:flex-row gap-3 pt-4 md:pt-8 w-full sm:w-auto"
              >
                <Link
                  href={`${appBase}/auth/signup?plan=pro`}
                  className="btn btn-primary text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 shadow-premium-2xl hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-all group w-full sm:w-auto text-center"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-secondary text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 w-full sm:w-auto text-center"
                >
                  Request Demo
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: duration.slower }}
                className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-[11px] sm:text-xs md:text-sm text-foreground/60"
              >
                <span className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Region-aware hosting
                </span>
              </motion.div>
            </motion.div>
          </ParallaxLayer>

          {/* Right: Live Compliance Dashboard Preview */}
          <ParallaxLayer speed={0.5}>
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-none mx-auto md:mx-0 flex justify-center md:block">
              <div className="w-full" style={{ maxWidth: '500px' }}>
                <motion.div
                  initial={{ opacity: 0, y: 40, rotateY: -8 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-2xl overflow-hidden border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
                  style={{ perspective: '1000px' }}
                >
                  {/* Glass header bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06] backdrop-blur-xl border-b border-white/[0.08]">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-3 text-[11px] text-white/40 font-mono">formaos — compliance dashboard</span>
                  </div>
                  {/* Dashboard content */}
                  <div className="p-5 bg-gradient-to-br from-[#0d1320]/90 to-[#111827]/90 backdrop-blur-xl space-y-4">
                    {/* Posture score */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Compliance Posture</div>
                        <div className="text-3xl font-bold text-white">94<span className="text-lg text-emerald-400">%</span></div>
                      </div>
                      <div className="w-16 h-16 rounded-full border-[3px] border-emerald-400/60 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>
                    {/* Control bars */}
                    <div className="space-y-2.5">
                      {[
                        { label: 'Access Controls', pct: 96, color: 'bg-cyan-400' },
                        { label: 'Evidence Chain', pct: 91, color: 'bg-blue-400' },
                        { label: 'Policy Reviews', pct: 88, color: 'bg-purple-400' },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-white/60">{bar.label}</span>
                            <span className="text-white/80 font-medium">{bar.pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${bar.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${bar.pct}%` }}
                              transition={{ duration: 1.4, delay: 1 + Math.random() * 0.3, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Activity feed */}
                    <div className="pt-2 border-t border-white/[0.06] space-y-2">
                      {[
                        { action: 'Evidence verified', time: '2m ago', dot: 'bg-emerald-400' },
                        { action: 'Control mapped to ISO 27001', time: '8m ago', dot: 'bg-cyan-400' },
                        { action: 'Audit export generated', time: '14m ago', dot: 'bg-blue-400' },
                      ].map((item) => (
                        <div key={item.action} className="flex items-center gap-2.5 text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0`} />
                          <span className="text-white/60 truncate">{item.action}</span>
                          <span className="text-white/30 ml-auto shrink-0">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Glow overlay */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px rgba(6,182,212,0.08)' }} />
                </motion.div>
              </div>
            </div>
          </ParallaxLayer>
        </div>
      </div>
    </section>
  );
}
