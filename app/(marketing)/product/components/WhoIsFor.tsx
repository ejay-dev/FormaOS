'use client';

import { Shield, TrendingUp, Settings, FileCheck, AlertTriangle, Users, Lock, Building2, Activity } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const audiences = [
  { label: 'Chief Compliance Officers building defensible infrastructure', icon: Shield, role: 'CCO / Head of Compliance' },
  { label: 'CISOs who need governance aligned to security controls', icon: Lock, role: 'CISO' },
  { label: 'Executives accountable to regulators and boards', icon: TrendingUp, role: 'CEO / Executive Leadership' },
  { label: 'Operations directors managing cross-site compliance', icon: Settings, role: 'Director of Operations' },
  { label: 'Risk managers who need real-time control visibility', icon: Activity, role: 'Risk & Audit Manager' },
  { label: 'IT teams implementing identity and access governance', icon: Users, role: 'IT / Infrastructure Lead' },
  { label: 'External auditors who demand structured evidence', icon: FileCheck, role: 'External / Internal Auditor' },
  { label: 'Regulated providers who cannot afford compliance failure', icon: AlertTriangle, role: 'Healthcare / NDIS / Financial Services' },
];

export function WhoIsFor() {
  return (
    <section className="product-section product-section--core relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-12">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                Who FormaOS Is For
              </div>
            </ScrollReveal>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Built for Those Who
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                {' '}Can't Afford to Guess
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <SectionChoreography pattern="center-burst" stagger={0.04} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <div key={audience.label} className="product-chip flex items-start gap-3 px-5 py-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/20">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-teal-300 uppercase tracking-wide mb-1">{audience.role}</div>
                  <div className="text-sm text-gray-300 leading-snug">{audience.label}</div>
                </div>
              </div>
            );
          })}
        </SectionChoreography>
      </div>
    </section>
  );
}
