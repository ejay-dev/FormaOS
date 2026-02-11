'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, UserPlus, RefreshCw, CheckCircle, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { easing, duration } from '@/config/motion';

const lifecycle = [
  {
    id: 'create',
    label: 'Created',
    icon: Plus,
    title: 'Task Created',
    task: 'Review Access Control Policy',
    detail: 'Auto-generated from ISO 27001 control A.9.2',
    meta: 'Priority: High • Due: 15 Feb 2026',
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/20',
    statusIcon: Clock,
    statusLabel: 'Pending',
    statusColor: 'text-slate-400',
  },
  {
    id: 'assign',
    label: 'Assigned',
    icon: UserPlus,
    title: 'Assigned to Sarah Chen',
    task: 'Review Access Control Policy',
    detail: 'Compliance Officer • Auto-assigned by role matching',
    meta: 'Email notification sent',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/20',
    statusIcon: Clock,
    statusLabel: 'In Progress',
    statusColor: 'text-blue-400',
  },
  {
    id: 'progress',
    label: 'Updated',
    icon: RefreshCw,
    title: 'Status Updated',
    task: 'Review Access Control Policy',
    detail: 'Policy reviewed and changes annotated',
    meta: 'Escalation timer reset • 2 days remaining',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/20',
    statusIcon: RefreshCw,
    statusLabel: 'In Review',
    statusColor: 'text-amber-400',
  },
  {
    id: 'complete',
    label: 'Completed',
    icon: CheckCircle,
    title: 'Task Completed',
    task: 'Review Access Control Policy',
    detail: 'Completion logged with immutable timestamp',
    meta: 'Evidence auto-linked • Compliance score updated',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/20',
    statusIcon: CheckCircle,
    statusLabel: 'Completed',
    statusColor: 'text-emerald-400',
  },
];

const STEP_DURATION = 2500;

export default function TaskShowcase() {
  const prefersReducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % lifecycle.length);
    }, STEP_DURATION);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const handleStepClick = useCallback((i: number) => setActiveStep(i), []);

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/8 to-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Mini demo (reversed order from EvidenceShowcase) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slow, ease: easing.signature }}
            className="order-2 md:order-1"
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-500/15 to-purple-500/15 blur-sm" />

              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-5 sm:p-6 overflow-hidden">
                {/* Step timeline */}
                <div className="flex items-center gap-2 mb-6">
                  {lifecycle.map((step, i) => {
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
                        {/* Connector line */}
                        {i < lifecycle.length - 1 && (
                          <div className={`absolute h-0.5 w-[calc(25%-16px)] top-4 ${isPast ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`}
                            style={{ left: `calc(${(i + 0.5) * 25}% + 8px)` }} />
                        )}
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
                      const step = lifecycle[activeStep];
                      const StatusIcon = step.statusIcon;
                      return (
                        <div className="space-y-3">
                          {/* Task card */}
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

                          {/* Task preview card */}
                          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                              <span className="text-[11px] font-medium text-slate-200">{step.task}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                                High Priority
                              </span>
                              <span>ISO 27001 • A.9.2</span>
                              <span>Due: 15 Feb 2026</span>
                            </div>
                            {activeStep >= 1 && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-1.5 mt-2"
                              >
                                <div className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                  <span className="text-[6px] font-bold text-white">SC</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Sarah Chen</span>
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
          </motion.div>

          {/* Right: Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slow, ease: easing.signature, delay: 0.1 }}
            className="order-1 md:order-2"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 mb-5">
              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">Task Orchestration</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
              Every Control Has an{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Owner
              </span>
            </h3>

            <p className="text-base text-slate-400 mb-8 leading-relaxed">
              Compliance tasks are auto-generated from framework controls, assigned by role, tracked with escalation timers,
              and completed with immutable logs. Nothing falls through the cracks.
            </p>

            <div className="space-y-4">
              {[
                { icon: UserPlus, text: 'Auto-assignment based on role and expertise' },
                { icon: Clock, text: 'Deadline tracking with escalation workflows' },
                { icon: CheckCircle, text: 'Immutable completion logs with evidence linking' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm text-slate-300">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
