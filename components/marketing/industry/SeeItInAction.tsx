'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Monitor, FileText, Bell } from 'lucide-react';
import type { ReactNode } from 'react';

export interface DemoTab {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

export interface SeeItInActionProps {
  tabs: DemoTab[];
}

export function SeeItInAction({ tabs }: SeeItInActionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '');
  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0d1117] to-[#0a0e1a]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-400 mb-6">
            <Monitor className="h-3.5 w-3.5" />
            See It In Action
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] mb-4">
            Experience the Platform
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Explore real workflows without creating an account.
          </p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveId(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeId === tab.id
                  ? 'bg-violet-500/15 border border-violet-500/25 text-white shadow-lg shadow-violet-500/10'
                  : 'border border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content panel */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab && (
              <motion.div
                key={activeTab.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── Helper sub-components for demo tab content ─────── */

export function DemoDashboardContent({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; status: 'green' | 'amber' | 'red' }[];
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
        {title}
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <span className="text-sm text-white">{row.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{row.value}</span>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  row.status === 'green'
                    ? 'bg-emerald-500'
                    : row.status === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoAuditExport({
  sections,
}: {
  sections: { name: string; score: string; items: number }[];
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-5 w-5 text-cyan-400" />
        <div>
          <div className="text-sm font-semibold text-white">
            Audit Evidence Pack
          </div>
          <div className="text-[10px] text-slate-500">
            Generated · Framework-structured · PDF-ready
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.name}
            className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          >
            <div>
              <div className="text-sm text-white">{section.name}</div>
              <div className="text-[10px] text-slate-500">
                {section.items} evidence items attached
              </div>
            </div>
            <div className="text-sm font-mono text-cyan-400">
              {section.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoNotificationTimeline({
  steps,
}: {
  steps: {
    time: string;
    label: string;
    status: 'complete' | 'active' | 'pending';
  }[];
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-5 w-5 text-violet-400" />
        <div>
          <div className="text-sm font-semibold text-white">
            Notification Timeline
          </div>
          <div className="text-[10px] text-slate-500">
            Regulatory notification workflow
          </div>
        </div>
      </div>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex gap-4">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={`h-3 w-3 rounded-full border-2 mt-1 ${
                  step.status === 'complete'
                    ? 'border-emerald-500 bg-emerald-500'
                    : step.status === 'active'
                      ? 'border-cyan-500 bg-cyan-500 animate-pulse'
                      : 'border-white/20 bg-transparent'
                }`}
              />
              {i < steps.length - 1 && (
                <div
                  className={`w-px flex-1 min-h-[32px] ${
                    step.status === 'complete'
                      ? 'bg-emerald-500/30'
                      : 'bg-white/[0.06]'
                  }`}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-6">
              <div className="text-[10px] font-mono text-slate-600">
                {step.time}
              </div>
              <div
                className={`text-sm ${step.status === 'pending' ? 'text-slate-500' : 'text-white'}`}
              >
                {step.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
