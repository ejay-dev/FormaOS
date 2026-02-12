'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, Tag, CheckCircle, Shield, Lock, FileCheck, ArrowRight } from 'lucide-react';
import { easing, duration } from '@/config/motion';

const steps = [
  {
    id: 'upload',
    label: 'Upload',
    icon: Upload,
    title: 'Evidence Uploaded',
    detail: 'SOC 2 Type II Report.pdf',
    meta: '2.4 MB • Marcus Rivera',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
  },
  {
    id: 'tag',
    label: 'Categorize',
    icon: Tag,
    title: 'Tagged & Categorized',
    detail: 'Audit Reports → SOC 2 → Q1 2026',
    meta: 'Auto-linked to 3 controls',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
  },
  {
    id: 'approve',
    label: 'Approve',
    icon: CheckCircle,
    title: 'Reviewed & Approved',
    detail: 'Approved by Sarah Chen',
    meta: 'Chain of custody recorded',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
  },
  {
    id: 'seal',
    label: 'Audit-Ready',
    icon: Shield,
    title: 'Immutable Audit Stamp',
    detail: 'SHA-256 hash locked',
    meta: 'Tamper-evident • Exportable',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
  },
];

const STEP_DURATION = 2500;

export default function EvidenceShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const handleStepClick = useCallback((i: number) => setActiveStep(i), []);

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/8 to-pink-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slow, ease: easing.signature }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 mb-5">
              <Lock className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Evidence Vault</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
              Audit-Ready Evidence,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Always
              </span>
            </h3>

            <p className="text-base text-slate-400 mb-8 leading-relaxed">
              Every document timestamped. Every chain of custody preserved. Every export defensible.
              FormaOS transforms evidence management from a scramble into a system.
            </p>

            <div className="space-y-4">
              {[
                { icon: FileCheck, text: 'Immutable audit trail with SHA-256 integrity' },
                { icon: Tag, text: 'Auto-categorization linked to framework controls' },
                { icon: Shield, text: 'One-click regulatory export packages' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Mini demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slow, ease: easing.signature, delay: 0.1 }}
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple-500/15 to-pink-500/15 blur-sm" />

              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-5 sm:p-6 overflow-hidden">
                {/* Step indicators */}
                <div className="flex items-center gap-1 mb-6">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i === activeStep;
                    const isPast = i < activeStep;

                    return (
                      <div key={step.id} className="flex items-center flex-1">
                        <button
                          type="button"
                          onClick={() => handleStepClick(i)}
                          aria-label={`Show ${step.label} step`}
                          className={`
                            relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all w-full justify-center
                            ${isActive ? `${step.bg} ${step.color} border ${step.border}` :
                              isPast ? 'bg-white/[0.04] text-emerald-400' : 'bg-white/[0.02] text-slate-600'}
                          `}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="sr-only">{step.label}</span>
                          <span className="hidden sm:inline">{step.label}</span>
                        </button>
                        {i < steps.length - 1 && (
                          <ArrowRight className={`h-3 w-3 mx-1 flex-shrink-0 ${i < activeStep ? 'text-emerald-500/40' : 'text-white/[0.08]'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Active step card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: duration.normal, ease: easing.signature }}
                    className="space-y-3"
                  >
                    {(() => {
                      const step = steps[activeStep];
                      const Icon = step.icon;
                      return (
                        <div className={`rounded-xl border ${step.border} ${step.bg.replace('/15', '/[0.06]')} p-4`}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`h-9 w-9 rounded-lg ${step.bg} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${step.color}`} />
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${step.color}`}>{step.title}</p>
                              <p className="text-xs text-slate-400">{step.detail}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-12">{step.meta}</p>
                        </div>
                      );
                    })()}

                    {/* File preview mock */}
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-red-400">PDF</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-300 truncate">SOC_2_Type_II_Report_Q1_2026.pdf</p>
                        <p className="text-[9px] text-slate-500">2.4 MB • Uploaded 10 Feb 2026 16:42</p>
                      </div>
                      {activeStep >= 2 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
