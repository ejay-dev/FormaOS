'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const BEFORE_ITEMS = [
  'No control enforcement — just documentation',
  'Point-in-time snapshots, not continuous posture',
  'Manual evidence collection before every audit',
  'Ownership assumed, never assigned or enforced',
  'No single source of truth when regulators ask',
] as const;

const AFTER_ITEMS = [
  'Controls block non-compliance before work proceeds',
  'Real-time continuous compliance posture',
  'Immutable, timestamped evidence trail',
  'Every control owned by a named person or team',
  'Audit packets ready to export in minutes',
] as const;

export function ValueProposition() {
  return (
    <section className="mk-section home-section home-section--contrast">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="text-center mb-16">
            <div className="mk-badge mk-badge--section mb-6">
              Operating System Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Built different. Works different.
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              FormaOS is the operating system that runs your compliance program.
              Not a repository. Not a checklist. A live system that enforces
              governance, tracks accountability, and produces defensible
              evidence.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h3 className="text-base font-medium text-slate-300 mb-5 flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/15 bg-rose-500/10 text-sm text-rose-400">
                  ✕
                </span>
                Other tools store documents.
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                Static repositories. Spreadsheets passed around. Evidence
                reconstructed days before audits.
              </p>
              <ul className="space-y-2.5">
                {BEFORE_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-500"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* After */}
          <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
            <div className="rounded-xl border border-teal-500/15 bg-teal-500/[0.03] p-6">
              <h3 className="text-base font-medium text-white mb-5 flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-sm text-teal-400">
                  ✓
                </span>
                FormaOS runs your program.
              </h3>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                A live operating layer. Controls are enforced. Evidence is
                generated as teams operate. Accountability is structural.
              </p>
              <ul className="space-y-2.5">
                {AFTER_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
