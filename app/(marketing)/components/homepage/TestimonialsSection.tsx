'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const TESTIMONIALS = [
  {
    quote:
      'FormaOS eliminated three weeks of scramble before every NDIS audit. Our team maintains continuous readiness instead of firefighting once a year.',
    name: 'Sarah M.',
    role: 'Operations Manager',
    org: 'Disability Services Provider',
    sector: 'NDIS',
  },
  {
    quote:
      'The evidence chain reduced our SOC 2 audit cycle from six months to six weeks. Auditors now have everything they need in a single defensible package.',
    name: 'James T.',
    role: 'Chief Information Security Officer',
    org: 'Healthcare Technology Platform',
    sector: 'Healthcare',
  },
  {
    quote:
      'Finally, a compliance platform designed for operations teams, not just IT. Our frontline staff actually use it - because the workflows make sense to them.',
    name: 'Rachel K.',
    role: 'Head of Governance & Risk',
    org: 'Regional Financial Services Group',
    sector: 'Financial Services',
  },
  {
    quote:
      'Standard 8 reporting used to consume two full weeks per quarter. With FormaOS we close the same governance cycle in under two days - with a traceable evidence trail.',
    name: 'Michael D.',
    role: 'Quality & Compliance Lead',
    org: 'Residential Aged Care Group',
    sector: 'Aged Care',
  },
  {
    quote:
      'Our SafeWork audit was the first one where we walked in with a complete digital evidence package. Incident logs, corrective actions, worker credential records - all exportable in under five minutes.',
    name: 'Priya N.',
    role: 'WHS & Compliance Manager',
    org: 'Construction & Infrastructure Group',
    sector: 'Construction',
  },
] as const;

export function TestimonialsSection() {
  const [featured, ...supporting] = TESTIMONIALS;

  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal
          variant="fadeUp"
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <p className="mk-badge mk-badge--meta mb-3">
            From the teams using FormaOS
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Proof from regulated operations
          </h2>
          <p className="mt-3 text-base text-slate-400">
            Healthcare, disability services, and financial teams running
            compliance as governance — not guesswork.
          </p>
        </ScrollReveal>

        {/* Tier 1 — Featured testimonial */}
        <ScrollReveal variant="fadeUp" className="mb-4">
          <article className="rounded-xl border border-white/[0.08] bg-slate-900/60 p-8">
            <blockquote className="text-lg md:text-xl leading-relaxed text-slate-200 mb-6">
              &ldquo;{featured.quote}&rdquo;
            </blockquote>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 text-sm font-semibold text-teal-400">
                  {featured.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {featured.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {featured.role}, {featured.org}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-teal-500/[0.06] border border-teal-500/20 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-teal-400/80">
                {featured.sector}
              </span>
            </div>
          </article>
        </ScrollReveal>

        {/* Tier 2 — Supporting testimonials */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {supporting.map((t) => (
            <ScrollReveal key={t.name} variant="fadeUp">
              <article className="flex flex-col rounded-xl border border-white/[0.05] bg-slate-900/40 p-5 h-full">
                <blockquote className="flex-1 text-sm leading-relaxed text-slate-400">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-5 pt-4 border-t border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-400">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.name}</p>
                      <p className="text-xs text-slate-500">
                        {t.role}, {t.org}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/customer-stories"
            className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
          >
            Read full customer stories &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
