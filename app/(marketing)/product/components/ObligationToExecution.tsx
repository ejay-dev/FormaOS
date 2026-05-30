'use client';

import { Fragment } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Activity,
  UserCheck,
  FileText,
  Shield,
  CheckSquare,
  Lock,
  BarChart3,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const flow = [
  {
    step: 'Obligations',
    becomes: 'structured controls',
  },
  {
    step: 'Controls',
    becomes: 'owned tasks',
  },
  {
    step: 'Tasks',
    becomes: 'live evidence',
  },
  {
    step: 'Evidence',
    becomes: 'complete audit trail',
  },
] as const;

// Static, monochrome rendering of the compliance lifecycle. Replaces the
// auto-cycling neon "demo chain" HUD (teal/emerald/amber chips, fake
// personas, "Complete" badges) that read as vibe-coded — now presented as
// a calm process strip matching the WhatIsFormaOS / OperatingModel panels.
const lifecycle = [
  { label: 'Obligation', icon: FileText, detail: 'Framework requirements mapped' },
  { label: 'Control', icon: Shield, detail: 'Ownership and cadence assigned' },
  { label: 'Task', icon: CheckSquare, detail: 'Routed to the accountable owner' },
  { label: 'Evidence', icon: Lock, detail: 'Artifacts linked and sealed' },
  { label: 'Audit', icon: BarChart3, detail: 'Exportable compliance trail' },
] as const;

export function ObligationToExecution() {
  return (
    <section className="product-section product-section--process relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-white/25" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  From Obligation to Execution
                </span>
                <span className="h-px w-8 bg-white/25" />
              </div>
            </ScrollReveal>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              You Don't Just Record
              <span className="text-foreground">
                {' '}
                Compliance. You Run It.
              </span>
            </h2>

            <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Most compliance platforms stop at documentation. FormaOS goes
              further. It operationalizes compliance across your organization.
            </p>
          </div>
        </ScrollReveal>

        <SectionChoreography
          pattern="cascade"
          stagger={0.04}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {flow.map((item, index) => (
            <div key={item.step} className="relative group">
              <div className="product-panel product-panel--interactive relative z-10 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all">
                <div className="inline-flex px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.05] text-slate-300 text-xs font-semibold mb-4">
                  {item.step}
                </div>
                <p className="text-gray-400">
                  become{' '}
                  <span className="text-white font-medium">{item.becomes}</span>
                </p>
              </div>
              {index < flow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </SectionChoreography>

        <ScrollReveal variant="slideUp" range={[0.1, 0.4]}>
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                One connected lifecycle
              </p>

              <SectionChoreography
                pattern="cascade"
                stagger={0.05}
                className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-0"
              >
                {lifecycle.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <Fragment key={stage.label}>
                      <div className="flex flex-1 flex-col items-center px-3 text-center">
                        <div className="mb-3 inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] p-3">
                          <Icon className="h-5 w-5 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {stage.label}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-slate-400">
                          {stage.detail}
                        </p>
                      </div>
                      {index < lifecycle.length - 1 && (
                        <div className="flex items-center justify-center lg:pt-5">
                          <ArrowRight className="h-4 w-4 rotate-90 text-white/20 lg:rotate-0" />
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </SectionChoreography>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="perspectiveUp" range={[0.12, 0.42]}>
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
            <div className="product-panel product-panel--soft flex items-center justify-center gap-2 rounded-xl p-4 text-sm text-gray-400">
              <Activity className="w-4 h-4 text-slate-400" />
              Every action is tracked
            </div>
            <div className="product-panel product-panel--soft flex items-center justify-center gap-2 rounded-xl p-4 text-sm text-gray-400">
              <UserCheck className="w-4 h-4 text-slate-400" />
              Every control has an owner
            </div>
            <div className="product-panel product-panel--soft flex items-center justify-center gap-2 rounded-xl p-4 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-slate-400" />
              Every outcome is provable
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
