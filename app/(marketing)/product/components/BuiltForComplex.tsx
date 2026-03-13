'use client';

import { Globe, GitBranch, Users, Eye } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const scales = [
  { label: 'Multi-site operations', icon: Globe },
  { label: 'Cross-departmental governance', icon: GitBranch },
  { label: 'External auditors and regulators', icon: Users },
  { label: 'Executive oversight', icon: Eye },
];

export function BuiltForComplex() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 p-8 sm:p-12 text-center">
            <span className="mk-badge mk-badge--section mb-6">
              Built for Complex Organizations
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              One System. One Source of Truth.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10">
              Whether you manage one site or hundreds, FormaOS scales across:
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {scales.map((scale) => {
                const Icon = scale.icon;
                return (
                  <div
                    key={scale.label}
                    className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-slate-900/50"
                  >
                    <Icon className="w-5 h-5 text-teal-400" />
                    <span className="text-sm text-slate-300">
                      {scale.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-lg font-medium text-white">
              Full organizational alignment.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
