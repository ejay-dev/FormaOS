'use client';

import { Building2, FileCheck, Database, AlertTriangle, Shield, CheckCircle, Users, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const UNIFIES = [
  { icon: Building2, label: 'Governance structure and framework alignment' },
  { icon: FileCheck, label: 'Policy, control, and obligation execution' },
  { icon: Database, label: 'Automated evidence generation and vault' },
  { icon: AlertTriangle, label: 'Real-time risk scoring and drift detection' },
  { icon: Shield, label: 'Audit defense with exportable evidence packages' },
  { icon: Users, label: 'Control ownership across teams and entities' },
  { icon: Lock, label: 'Role-based accountability and access governance' },
] as const;

const PROOF_POINTS = [
  'No compliance silos',
  'No manual evidence reconciliation',
  'No last-minute audit reconstruction',
  'No undocumented ownership gaps',
] as const;

export function WhatIsFormaOS() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Subtle section background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.03] to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              What Is FormaOS?
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 text-white">
              An end-to-end{' '}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Compliance Operating System
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Not a GRC checklist tool. Not a document repository. FormaOS is an operational layer that enforces compliance as your organization works — continuously, with evidence generated automatically.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slideUp" range={[0.05, 0.4]}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />

            <h3 className="text-lg font-semibold text-white text-center mb-8">
              FormaOS unifies:
            </h3>

            <SectionChoreography pattern="cascade" stagger={0.04} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {UNIFIES.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ y: -2 }}
                    className="flex flex-col items-center text-center rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-4 hover:border-teal-400/15 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div className="inline-flex items-center justify-center rounded-xl border border-teal-400/20 bg-teal-500/10 p-3 mb-3">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-xs text-slate-400 leading-snug">{item.label}</span>
                  </motion.div>
                );
              })}
            </SectionChoreography>

            <p className="text-center text-slate-600 mt-8 text-sm">
              Unified in a single, continuously operating compliance layer.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-slate-400">
              {PROOF_POINTS.map((point) => (
                <span key={point} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {point}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
