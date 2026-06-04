'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  FileText,
  Shield,
  CheckSquare,
  Lock,
  BarChart3,
  BookOpen,
  FileCheck,
  Users,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

// Bespoke homepage presentation of the compliance lifecycle. The shared
// DemoComplianceChain / DemoComplianceScore components still power /pricing
// and /our-story; this section tells the story as a connected pipeline that
// produces a posture, rather than two static side-by-side widgets.
const LIFECYCLE = [
  {
    n: '01',
    label: 'Obligation',
    icon: FileText,
    detail: 'Framework requirements mapped to controls',
  },
  {
    n: '02',
    label: 'Control',
    icon: Shield,
    detail: 'Ownership and review cadence assigned',
  },
  {
    n: '03',
    label: 'Task',
    icon: CheckSquare,
    detail: 'Work routed to the accountable owner',
  },
  {
    n: '04',
    label: 'Evidence',
    icon: Lock,
    detail: 'Artifacts linked and sealed to the control',
  },
  {
    n: '05',
    label: 'Audit',
    icon: BarChart3,
    detail: 'Complete, exportable compliance trail',
  },
];

const CATEGORIES = [
  { label: 'Policies', score: 94, items: 32, icon: BookOpen },
  { label: 'Evidence', score: 87, items: 128, icon: FileCheck },
  { label: 'Training', score: 91, items: 47, icon: Users },
  { label: 'Risk Register', score: 78, items: 15, icon: AlertTriangle },
  { label: 'Controls', score: 96, items: 64, icon: ShieldCheck },
];

const OVERALL = 89;
const TOTAL_ITEMS = CATEGORIES.reduce((sum, c) => sum + c.items, 0);

export function ComplianceEngineDemo() {
  return (
    <section className="mk-section home-section home-section--process relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Editorial header */}
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="mb-12 grid gap-x-10 gap-y-6 border-b border-white/[0.06] pb-10 lg:mb-14 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-white/25" />
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Compliance engine
                </span>
              </div>
              <h2 className="text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
                How the compliance engine{' '}
                <span className="text-slate-400">works</span>
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                One connected lifecycle, obligations become controls, controls
                generate tasks, tasks produce evidence, and every step stays
                audit-ready.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* The engine: a pipeline that produces a posture */}
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-10">
            {/* ── Pipeline ── */}
            <div className="relative">
              {/* Connecting rail + travelling pulse (desktop) */}
              <div className="pointer-events-none absolute left-[10%] right-[10%] top-7 hidden h-px bg-gradient-to-r from-white/5 via-white/20 to-white/5 md:block" />
              <span className="engine-pulse pointer-events-none absolute top-7 hidden h-[3px] w-20 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[1px] md:block" />

              <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
                {LIFECYCLE.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.n}
                      className="group relative flex flex-col items-center text-center"
                    >
                      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.12] bg-[#0a0f1d] text-slate-200 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-white/30 group-hover:text-white">
                        <Icon className="h-6 w-6" strokeWidth={1.6} />
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/10 bg-[#0a0f1d] px-1 font-mono text-[10px] font-semibold text-slate-400">
                          {step.n}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-white">
                        {step.label}
                      </p>
                      <p className="mt-1 max-w-[190px] text-xs leading-relaxed text-slate-500">
                        {step.detail}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* ── Output: resulting posture ── */}
            <div className="mt-10 border-t border-white/[0.07] pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="hidden text-slate-600 sm:block">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.03]">
                    <span className="text-2xl font-bold tabular-nums text-white">
                      {OVERALL}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Resulting posture
                    </p>
                    <p className="mt-0.5 text-sm text-slate-300">
                      {TOTAL_ITEMS} items across {CATEGORIES.length} categories
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Illustrative
                </span>
              </div>

              {/* Category breakdown */}
              <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.label}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-300">
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                          <span className="truncate">{cat.label}</span>
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-white">
                          {cat.score}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-slate-300/80"
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-slate-600">
                        {cat.items} items
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
