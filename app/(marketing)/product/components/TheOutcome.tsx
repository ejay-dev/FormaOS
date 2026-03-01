'use client';

import { TrendingUp, CheckCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const outcomes = [
  { outcome: 'Continuous compliance posture — not periodic audit scrambles', stat: '24/7' },
  { outcome: 'Audit preparation reduced from weeks to hours', stat: '~90%' },
  { outcome: 'Every control has a named owner, status, and evidence trail', stat: '100%' },
  { outcome: 'Regulator-ready evidence packages exportable in minutes', stat: '< 2 min' },
  { outcome: 'Cross-framework coverage without duplicating work', stat: '9 packs' },
  { outcome: 'A governance layer that runs while your teams operate', stat: 'Always-on' },
  { outcome: 'Real-time drift alerts before auditors find gaps', stat: 'Live' },
  { outcome: 'Compliance history preserved for multi-year audit cycles', stat: 'Immutable' },
] as const;

export function TheOutcome() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium mb-5">
              <TrendingUp className="w-4 h-4" />
              The Outcome
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              What regulated organizations achieve with FormaOS
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Not promises. These are the operational outcomes teams reach when compliance is a system, not a spreadsheet.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slideUp" range={[0.05, 0.4]}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

            <SectionChoreography pattern="cascade" stagger={0.04} className="grid sm:grid-cols-2 gap-3">
              {outcomes.map(({ outcome, stat }) => (
                <div
                  key={outcome}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 hover:border-emerald-400/15 hover:bg-white/[0.04] transition-all duration-200"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-slate-300 flex-1 leading-snug">{outcome}</span>
                  <span className="text-xs font-bold text-emerald-400/70 shrink-0 tabular-nums">{stat}</span>
                </div>
              ))}
            </SectionChoreography>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
