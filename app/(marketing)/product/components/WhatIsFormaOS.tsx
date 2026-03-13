'use client';

import {
  Building2,
  FileCheck,
  Database,
  AlertTriangle,
  Shield,
  CheckCircle,
  Users,
  Lock,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

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
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="text-center mb-12">
            <span className="mk-badge mk-badge--section mb-6">
              What Is FormaOS?
            </span>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-5 text-white">
              An end-to-end{' '}
              <span className="text-teal-400">Compliance Operating System</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Not a GRC checklist tool. Not a document repository. FormaOS is an
              operational layer that enforces compliance as your organization
              works — continuously, with evidence generated automatically.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-8 sm:p-10">
            <h3 className="text-lg font-semibold text-white text-center mb-8">
              FormaOS unifies:
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {UNIFIES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center text-center rounded-xl border border-white/[0.06] bg-slate-900/50 px-2 py-3 sm:px-3 sm:py-4 last:col-span-2 sm:last:col-span-1"
                  >
                    <div className="inline-flex items-center justify-center rounded-xl border border-teal-400/20 bg-teal-500/10 p-3 mb-3">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-xs text-slate-400 leading-snug">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-slate-600 mt-8 text-sm">
              Unified in a single, continuously operating compliance layer.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-slate-400">
              {PROOF_POINTS.map((point) => (
                <span key={point} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
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
