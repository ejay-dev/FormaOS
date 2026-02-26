'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { Shield, CheckCircle, Lock, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { LaserFlow } from '@/components/motion/LaserFlow';
import { useDeviceTier } from '@/lib/device-tier';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [...easing.signature] as [number, number, number, number];

const PIPELINE_STEPS = [
  { label: 'Ingest', icon: FileText, color: 'text-cyan-400', dotColor: 'bg-cyan-400', glowColor: 'rgba(6,182,212,0.3)' },
  { label: 'Verify', icon: Shield, color: 'text-violet-400', dotColor: 'bg-violet-400', glowColor: 'rgba(139,92,246,0.3)' },
  { label: 'Seal', icon: Lock, color: 'text-emerald-400', dotColor: 'bg-emerald-400', glowColor: 'rgba(52,211,153,0.3)' },
];

export function LaserFlowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const tierConfig = useDeviceTier();
  const isInView = useInView(sectionRef, { once: false, margin: '-50px' });
  const sa = !prefersReduced;

  return (
    <section
      ref={sectionRef}
      className="relative py-16 sm:py-20 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #030712 0%, #0a0f1f 50%, #0f172a 100%)',
      }}
    >
      {/* Subtle background glow — static radial, no animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 65% 50%, rgba(139,92,246,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 35% 40%, rgba(6,182,212,0.04) 0%, transparent 50%)
          `,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section heading */}
        <motion.div
          initial={sa ? { opacity: 0, y: 20 } : false}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={sa ? { duration: duration.slow, ease: signatureEase } : { duration: 0 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            Security Pipeline
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
            From event intake to{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              immutable audit evidence
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
            Every compliance event follows a secured pipeline — ingested, verified, and sealed into an immutable record.
          </p>
        </motion.div>

        {/* 2-column layout: copy left, device frame right */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* ═══ LEFT: Copy + bullets + CTA ═══ */}
          <motion.div
            initial={sa ? { opacity: 0, x: -20 } : false}
            animate={isInView ? { opacity: 1, x: 0 } : undefined}
            transition={sa ? { duration: duration.slow, delay: 0.15, ease: signatureEase } : { duration: 0 }}
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6">
              Audit-grade integrity at every step
            </h3>

            <div className="space-y-4 mb-8">
              {[
                { text: 'Events are ingested with cryptographic timestamps and actor identity', icon: FileText },
                { text: 'Multi-layer verification ensures data integrity before sealing', icon: Shield },
                { text: 'Immutable audit logs are append-only — no edits, no deletions', icon: Lock },
              ].map((bullet) => (
                <div key={bullet.text} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <bullet.icon className="w-4 h-4 text-cyan-400/70" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{bullet.text}</p>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-sm font-medium text-white hover:bg-white/[0.1] hover:border-white/[0.2] transition-colors group"
            >
              View Security Brief
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {/* ═══ RIGHT: Device frame with Laser Flow ═══ */}
          <motion.div
            initial={sa ? { opacity: 0, x: 20 } : false}
            animate={isInView ? { opacity: 1, x: 0 } : undefined}
            transition={sa ? { duration: duration.slow, delay: 0.25, ease: signatureEase } : { duration: 0 }}
            className="relative"
          >
            {/* Glow behind device frame */}
            <div
              className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 65%)',
              }}
            />

            {/* Device frame */}
            <div
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.10] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{
                backdropFilter: tierConfig.enableBlur ? 'blur(12px)' : undefined,
              }}
            >
              {/* Browser chrome bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 mx-6">
                  <div className="h-4 rounded-md bg-white/[0.03] flex items-center justify-center">
                    <span className="text-[9px] text-white/15 font-mono">security-pipeline</span>
                  </div>
                </div>
              </div>

              {/* Laser Flow canvas area */}
              <div className="relative h-[240px] sm:h-[300px] lg:h-[360px] overflow-hidden">
                {/* Radial mask for soft edges */}
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(ellipse 90% 85% at 50% 50%, transparent 50%, rgba(3,7,18,0.6) 80%, rgba(3,7,18,0.95) 100%)
                    `,
                  }}
                />

                {/* Laser Flow — only renders when in view */}
                {isInView && (
                  <LaserFlow
                    color="#8B5CF6"
                    horizontalBeamOffset={0.0}
                    verticalBeamOffset={-0.05}
                    flowSpeed={0.25}
                    verticalSizing={1.8}
                    horizontalSizing={0.8}
                    fogIntensity={0.35}
                    fogScale={0.25}
                    wispDensity={0.6}
                    wispSpeed={10}
                    wispIntensity={4}
                    flowStrength={0.2}
                    decay={1.0}
                    falloffStart={1.1}
                    fogFallSpeed={0.4}
                  />
                )}

                {/* ═══ Pipeline step chips — overlaid on the beam ═══ */}
                <div className="absolute inset-x-0 bottom-0 top-0 z-20 flex items-end justify-center pb-6 sm:pb-8 pointer-events-none">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {PIPELINE_STEPS.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <motion.div
                          key={step.label}
                          initial={sa ? { opacity: 0, y: 12 } : false}
                          animate={isInView ? { opacity: 1, y: 0 } : undefined}
                          transition={sa ? { duration: 0.5, delay: 0.4 + i * 0.12, ease: signatureEase } : { duration: 0 }}
                          className="flex items-center gap-1.5"
                        >
                          <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.1]"
                            style={{
                              backdropFilter: tierConfig.enableBlur ? 'blur(8px)' : undefined,
                              boxShadow: `0 0 12px ${step.glowColor}`,
                            }}
                          >
                            <Icon className={`w-3 h-3 ${step.color}`} />
                            <span className="text-[10px] sm:text-xs font-medium text-white/70">{step.label}</span>
                          </div>
                          {/* Connector arrow */}
                          {i < PIPELINE_STEPS.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-white/15" />
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Final badge */}
                    <motion.div
                      initial={sa ? { opacity: 0, scale: 0.9 } : false}
                      animate={isInView ? { opacity: 1, scale: 1 } : undefined}
                      transition={sa ? { duration: 0.5, delay: 0.8, ease: signatureEase } : { duration: 0 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 ml-1"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-400/80">Audit log appended</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
