'use client';

import { CheckCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const outcomes = [
  {
    outcome: 'Continuous compliance posture — not periodic audit scrambles',
    stat: '24/7',
  },
  { outcome: 'Audit preparation reduced from weeks to hours', stat: '~90%' },
  {
    outcome: 'Every control has a named owner, status, and evidence trail',
    stat: '100%',
  },
  {
    outcome: 'Regulator-ready evidence packages exportable in minutes',
    stat: '< 2 min',
  },
  {
    outcome: 'Cross-framework coverage without duplicating work',
    stat: '9 packs',
  },
  {
    outcome: 'A governance layer that runs while your teams operate',
    stat: 'Always-on',
  },
  { outcome: 'Real-time drift alerts before auditors find gaps', stat: 'Live' },
  {
    outcome: 'Compliance history preserved for multi-year audit cycles',
    stat: 'Immutable',
  },
] as const;

export function TheOutcome() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="text-center mb-12">
            <span className="mk-badge mk-badge--section mb-5">The Outcome</span>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              What regulated organizations achieve with FormaOS
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Not promises. These are the operational outcomes teams reach when
              compliance is a system, not a spreadsheet.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-3">
              {outcomes.map(({ outcome, stat }) => (
                <div
                  key={outcome}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-900/50 px-4 py-3"
                >
                  <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-sm text-slate-300 flex-1 leading-snug">
                    {outcome}
                  </span>
                  <span className="text-xs font-bold text-teal-400/70 shrink-0 tabular-nums">
                    {stat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
