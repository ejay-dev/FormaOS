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
import { SectionChoreography } from '@/components/motion/SectionChoreography';
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
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium mb-6">
                <Activity className="w-4 h-4" />
                Compliance Intelligence Dashboard
              </div>
            </ScrollReveal>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Live Visibility Into Your
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {' '}
                Compliance Posture
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built-in analytics engine provides real-time compliance insights,
              historical trends, and early regression alerts (where enabled), so
              teams spend less time building manual reports.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <ScrollReveal variant="splitLeft" range={[0, 0.35]} className="lg:col-span-2">
            <DemoComplianceScore glowColor="from-green-500/15 to-emerald-500/15" />
          </ScrollReveal>

          <SectionChoreography pattern="cascade" stagger={0.04} className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelligenceFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-green-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">
                    {feature.label}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </SectionChoreography>
        </div>
      </div>
    </section>
  );
}
