'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock3,
  FileCheck,
  Play,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const OUTCOME_METRICS = [
  {
    label: 'Live Control Coverage',
    value: '147 controls',
    trend: '+12 this quarter',
  },
  {
    label: 'Evidence Continuity',
    value: '99.98%',
    trend: 'Chain verified',
  },
  {
    label: 'Audit Packet Delivery',
    value: '94 sec',
    trend: 'P95 export time',
  },
] as const;

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    label: 'System-Enforced Controls',
    detail: 'Controls become enforceable workflows with named ownership.',
  },
  {
    icon: FileCheck,
    label: 'Defensible Evidence Chain',
    detail: 'Tamper-evident artifacts with traceable approvals and history.',
  },
  {
    icon: BarChart3,
    label: 'Executive Readiness Reporting',
    detail: 'Always-current posture, findings, and board-ready evidence packs.',
  },
] as const;

const WORKFLOW_STAGES = [
  {
    stage: 'Detect Drift',
    owner: 'Control Ops',
    sla: '9 min',
    status: 'Stable',
  },
  {
    stage: 'Assign & Escalate',
    owner: 'Risk Lead',
    sla: '14 min',
    status: 'Healthy',
  },
  {
    stage: 'Verify Resolution',
    owner: 'Assurance',
    sla: '31 min',
    status: 'Tracked',
  },
  {
    stage: 'Export Audit Packet',
    owner: 'Reporting',
    sla: '94 sec',
    status: 'Ready',
  },
] as const;

const ASSURANCE_SIGNALS = [
  { label: 'Open Findings', value: '3', tone: 'amber' },
  { label: 'Critical Risks', value: '0', tone: 'emerald' },
  { label: 'Upcoming Audits', value: '2', tone: 'cyan' },
  { label: 'Board Reports', value: 'Weekly', tone: 'slate' },
] as const;

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'NDIS'] as const;

function signalToneClasses(
  tone: (typeof ASSURANCE_SIGNALS)[number]['tone'],
): { dot: string; text: string; badge: string } {
  switch (tone) {
    case 'amber':
      return {
        dot: 'bg-amber-400',
        text: 'text-amber-300',
        badge: 'border-amber-400/20 bg-amber-500/10',
      };
    case 'emerald':
      return {
        dot: 'bg-emerald-400',
        text: 'text-emerald-300',
        badge: 'border-emerald-400/20 bg-emerald-500/10',
      };
    case 'cyan':
      return {
        dot: 'bg-cyan-400',
        text: 'text-cyan-300',
        badge: 'border-cyan-400/20 bg-cyan-500/10',
      };
    default:
      return {
        dot: 'bg-slate-300',
        text: 'text-slate-300',
        badge: 'border-slate-300/15 bg-slate-500/10',
      };
  }
}

export function ProductScrollHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const shouldAnimate = !prefersReduced;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[90vh] items-center overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_74%_52%_at_48%_-12%,rgba(6,182,212,0.14)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0a0f1c]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-[56fr_44fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slow, delay: 0.15 } : { duration: 0 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-500/10 px-4 py-2"
            >
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-semibold tracking-wide text-teal-300">
                Compliance Operating System
              </span>
            </motion.div>

            <motion.h1
              initial={shouldAnimate ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.27 } : { duration: 0 }}
              className="mb-5 text-[2.25rem] font-bold leading-[1.08] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Run Compliance Like
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                Mission-Critical Operations
              </span>
            </motion.h1>

            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.39 } : { duration: 0 }}
              className="mx-auto mb-7 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg lg:mx-0 lg:text-xl"
            >
              FormaOS turns obligations into governed execution loops with owned evidence,
              real-time posture visibility, and audit packets leadership can defend.
            </motion.p>

            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.45 } : { duration: 0 }}
              className="mb-8 grid gap-2.5 sm:grid-cols-3"
            >
              {OUTCOME_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-white/[0.1] bg-slate-950/50 px-3.5 py-3 text-left"
                >
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{metric.value}</p>
                  <p className="mt-1 text-[11px] text-emerald-300">{metric.trend}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.52 } : { duration: 0 }}
              className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start"
            >
              <motion.a
                href={`${appBase}/auth/signup`}
                whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
                className="mk-btn mk-btn-primary group min-h-[48px] w-full justify-center px-8 py-4 text-base sm:w-auto sm:text-lg"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.a>
              <Link
                href="/contact"
                className="mk-btn mk-btn-secondary group min-h-[48px] w-full justify-center px-8 py-4 text-base sm:w-auto sm:text-lg"
              >
                <Play className="h-5 w-5" />
                <span>Request Demo</span>
              </Link>
            </motion.div>

            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 15 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimate ? { duration: duration.slower, delay: 0.6 } : { duration: 0 }}
              className="mt-8 grid gap-2.5 sm:grid-cols-3"
            >
              {CAPABILITIES.map((capability) => {
                const Icon = capability.icon;
                return (
                  <div
                    key={capability.label}
                    className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-3 text-left"
                  >
                    <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
                      <Icon className="h-4 w-4 text-cyan-300" />
                    </div>
                    <p className="text-sm font-semibold text-white">{capability.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{capability.detail}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimate ? { duration: duration.slower, delay: 0.34 } : { duration: 0 }}
            whileHover={shouldAnimate ? { y: -4 } : undefined}
            className="relative mx-auto w-full max-w-[540px]"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-slate-950/70 shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-sm">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />

              <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-300" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    Operating Snapshot
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  <Clock3 className="h-3 w-3" />
                  Live
                </span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {ASSURANCE_SIGNALS.map((signal) => {
                    const tone = signalToneClasses(signal.tone);
                    return (
                      <div
                        key={signal.label}
                        className={`rounded-lg border px-3 py-2 ${tone.badge}`}
                      >
                        <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300/90">{signal.label}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          <span className={`text-sm font-semibold ${tone.text}`}>{signal.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-teal-300" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                      Governance Workflow
                    </p>
                  </div>
                  <div className="space-y-2">
                    {WORKFLOW_STAGES.map((stage) => (
                      <div
                        key={stage.stage}
                        className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-white/[0.06] bg-slate-900/45 px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{stage.stage}</p>
                          <p className="text-[11px] text-slate-400">{stage.owner}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-cyan-300">{stage.sla}</p>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                            {stage.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/[0.08] bg-slate-900/55 px-3.5 py-2.5">
                  <p className="text-[11px] text-slate-300">
                    Next audit packet scheduled in{' '}
                    <span className="font-semibold text-white">4h 12m</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/[0.08] bg-white/[0.02] px-4 py-3">
                {FRAMEWORKS.map((framework) => (
                  <span
                    key={framework}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300"
                  >
                    <CheckCircle className="h-3 w-3 text-emerald-300/80" />
                    {framework}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute -right-3 -top-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5">
              <p className="text-xs font-semibold text-cyan-300">Board Brief Ready</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ProductScrollHero;
