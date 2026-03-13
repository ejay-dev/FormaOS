'use client';

import {
  Activity,
  FileCheck,
  AlertTriangle,
  BarChart3,
  GitBranch,
  Database,
  Sparkles,
  Shield,
  Eye,
} from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const DemoComplianceScore = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceScore'),
  { ssr: false },
);

const intelligenceFeatures = [
  {
    label: 'Compliance Score Trends',
    description: 'Rolling trend view with sparkline visualization',
    icon: Activity,
  },
  {
    label: 'Framework Health Monitoring',
    description: 'Per-framework readiness with gap visibility (when enabled)',
    icon: FileCheck,
  },
  {
    label: 'Regression Alerts',
    description: 'Regression insights and alerts (early access)',
    icon: AlertTriangle,
  },
  {
    label: 'Automation Analytics',
    description: 'Task velocity, completion rates, and trigger history',
    icon: BarChart3,
  },
  {
    label: 'Master Control Deduplication',
    description:
      'Cross-framework mapping to reduce duplicate controls (roadmap)',
    icon: GitBranch,
  },
  {
    label: 'Historical Compliance Snapshots',
    description: 'Snapshot history when captured (early access)',
    icon: Database,
  },
  {
    label: 'Evidence Compliance Scoring',
    description:
      'Rule-based compliance scoring with real-time evidence validation',
    icon: Sparkles,
  },
  {
    label: 'Compliance Gate Enforcement',
    description:
      'Block non-compliant actions before they happen with real-time validation against control requirements',
    icon: Shield,
  },
  {
    label: 'Executive Risk Narratives',
    description: 'Executive dashboard with compliance posture analytics',
    icon: Eye,
  },
];

export function ComplianceIntelligence() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="text-center mb-16">
            <span className="mk-badge mk-badge--section mb-6">
              Compliance Intelligence Dashboard
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Live visibility into your{' '}
              <span className="text-teal-400">compliance posture</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built-in analytics engine provides real-time compliance insights,
              historical trends, and early regression alerts (where enabled), so
              teams spend less time building manual reports.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-2">
                <DemoComplianceScore />
              </div>
            </div>

            <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {intelligenceFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1.5">
                      {feature.label}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
