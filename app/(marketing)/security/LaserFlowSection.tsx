'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { Shield, CheckCircle, Lock, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { duration, easing } from '@/config/motion';

const signatureEase: [number, number, number, number] = [...easing.signature] as [number, number, number, number];

const PIPELINE_STEPS = [
  { label: 'Ingest', icon: FileText, color: 'text-cyan-400', borderColor: 'border-cyan-500/25', bgColor: 'bg-cyan-500/8', glowColor: 'shadow-[0_0_12px_rgba(6,182,212,0.15)]' },
  { label: 'Verify', icon: Shield, color: 'text-violet-400', borderColor: 'border-violet-500/25', bgColor: 'bg-violet-500/8', glowColor: 'shadow-[0_0_12px_rgba(139,92,246,0.15)]' },
  { label: 'Seal', icon: Lock, color: 'text-emerald-400', borderColor: 'border-emerald-500/25', bgColor: 'bg-emerald-500/8', glowColor: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]' },
];

export function LaserFlowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
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
      {/* Subtle background glow */}
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

        {/* 2-column layout: copy left, pipeline diagram right */}
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

          {/* ═══ RIGHT: Lightweight pipeline diagram ═══ */}
          <motion.div
            initial={sa ? { opacity: 0, x: 20 } : false}
            animate={isInView ? { opacity: 1, x: 0 } : undefined}
            transition={sa ? { duration: duration.slow, delay: 0.25, ease: signatureEase } : { duration: 0 }}
            className="relative"
          >
            {/* Pipeline flow card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">

              {/* Pipeline steps — vertical on mobile, horizontal on sm+ */}
              <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-0">
                {PIPELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.label}
                      initial={sa ? { opacity: 0, y: 16 } : false}
                      animate={isInView ? { opacity: 1, y: 0 } : undefined}
                      transition={sa ? { duration: 0.5, delay: 0.35 + i * 0.1, ease: signatureEase } : { duration: 0 }}
                      className="flex-1 flex flex-col sm:flex-row items-center"
                    >
                      {/* Step card */}
                      <div className={`flex-1 w-full rounded-xl ${step.bgColor} border ${step.borderColor} ${step.glowColor} p-4 sm:p-5 text-center`}>
                        <div className={`w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto mb-3`}>
                          <Icon className={`w-5 h-5 ${step.color}`} />
                        </div>
                        <div className="text-sm font-semibold text-white mb-1">{step.label}</div>
                        <div className="text-[11px] text-white/40">
                          {i === 0 && 'Timestamp + identity'}
                          {i === 1 && 'Integrity check'}
                          {i === 2 && 'Append-only store'}
                        </div>
                      </div>

                      {/* Connector arrow between steps */}
                      {i < PIPELINE_STEPS.length - 1 && (
                        <div className="flex items-center justify-center py-2 sm:py-0 sm:px-3">
                          <ArrowRight className="w-4 h-4 text-white/15 rotate-90 sm:rotate-0" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Connector line to result */}
              <div className="flex items-center justify-center my-4">
                <div className="w-px sm:w-32 h-6 sm:h-px bg-gradient-to-b sm:bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Result badge */}
              <motion.div
                initial={sa ? { opacity: 0, scale: 0.95 } : false}
                animate={isInView ? { opacity: 1, scale: 1 } : undefined}
                transition={sa ? { duration: 0.5, delay: 0.7, ease: signatureEase } : { duration: 0 }}
                className="flex items-center justify-center"
              >
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 shadow-[0_0_16px_rgba(52,211,153,0.1)]">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Audit log appended</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
