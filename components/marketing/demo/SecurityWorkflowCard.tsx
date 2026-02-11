'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Shield, Lock, Eye, FileCheck, CheckCircle, Clock } from 'lucide-react';
import { easing, duration } from '@/config/motion';

/**
 * Reusable automation-style workflow card for marketing sections.
 * Same design system as TaskShowcase's left-side glass card.
 * Themed for security / evidence chain context.
 */

const securityLifecycle = [
  {
    id: 'collect',
    label: 'Collect',
    icon: Eye,
    title: 'Evidence Collected',
    task: 'Quarterly Access Review',
    detail: 'Auto-captured from system audit log',
    meta: 'Source: IAM Provider • SHA-256 hashed',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/20',
    statusIcon: Clock,
    statusLabel: 'Ingested',
    statusColor: 'text-cyan-400',
  },
  {
    id: 'encrypt',
    label: 'Encrypt',
    icon: Lock,
    title: 'Encrypted at Rest',
    task: 'Quarterly Access Review',
    detail: 'AES-256 encryption applied automatically',
    meta: 'Key rotation: Active • Compliance: SOC 2 CC6.1',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
    statusIcon: Lock,
    statusLabel: 'Secured',
    statusColor: 'text-blue-400',
  },
  {
    id: 'verify',
    label: 'Verify',
    icon: FileCheck,
    title: 'Integrity Verified',
    task: 'Quarterly Access Review',
    detail: 'Tamper-evident seal applied to evidence',
    meta: 'Hash chain intact • Immutable timestamp recorded',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
    statusIcon: FileCheck,
    statusLabel: 'Verified',
    statusColor: 'text-purple-400',
  },
  {
    id: 'audit',
    label: 'Audit-Ready',
    icon: Shield,
    title: 'Audit Trail Complete',
    task: 'Quarterly Access Review',
    detail: 'Full chain of custody preserved',
    meta: 'Exportable • Regulator-ready • Zero gaps',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    statusIcon: CheckCircle,
    statusLabel: 'Complete',
    statusColor: 'text-emerald-400',
  },
];

const STEP_DURATION = 2800;

export default function SecurityWorkflowCard() {
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % securityLifecycle.length);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const handleStepClick = useCallback((i: number) => setActiveStep(i), []);

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-cyan-500/15 to-blue-500/15 blur-sm" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-5 sm:p-6 overflow-hidden">
        {/* Step timeline */}
        <div className="flex items-center gap-2 mb-6">
          {securityLifecycle.map((step, i) => {
            const isActive = i === activeStep;
            const isPast = i < activeStep;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(i)}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center transition-all
                    ${isActive ? `${step.bg} ring-2 ring-offset-1 ring-offset-[#0b1022] ${step.border.replace('border-', 'ring-')}` :
                      isPast ? 'bg-emerald-500/15' : 'bg-white/[0.04]'}
                  `}
                >
                  {isPast ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <step.icon className={`h-3.5 w-3.5 ${isActive ? step.color : 'text-slate-600'}`} />
                  )}
                </div>
                <span className={`text-[9px] font-medium ${isActive ? step.color : isPast ? 'text-emerald-400/60' : 'text-slate-600'}`}>
                  {step.label}
                </span>
              </button>
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
          >
            {(() => {
              const step = securityLifecycle[activeStep];
              const StatusIcon = step.statusIcon;
              return (
                <div className="space-y-3">
                  {/* Workflow step card */}
                  <div className={`rounded-xl border ${step.border} ${step.bg.replace('/15', '/[0.06]')} p-4`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg ${step.bg} flex items-center justify-center`}>
                          <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${step.color}`}>{step.title}</p>
                          <p className="text-[11px] text-slate-400">{step.detail}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${step.bg} ${step.statusColor}`}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {step.statusLabel}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 pl-10">{step.meta}</p>
                  </div>

                  {/* Evidence preview card */}
                  <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[11px] font-medium text-slate-200">{step.task}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5 text-blue-400" />
                        SOC 2 CC6.1
                      </span>
                      <span>ISO 27001 • A.9.2</span>
                      <span>Auto-enforced</span>
                    </div>
                    {activeStep >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 mt-2"
                      >
                        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                          <CheckCircle className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[10px] text-emerald-400">Integrity verified — chain of custody sealed</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
