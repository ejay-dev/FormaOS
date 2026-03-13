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
      'The evidence chain reduced our SOC 2 audit cycle from six months to six weeks. Auditors have everything in a single defensible package.',
    name: 'James T.',
    role: 'CISO',
    org: 'Healthcare Technology Platform',
    sector: 'Healthcare',
  },
  {
    quote:
      'Finally a compliance platform designed for operations teams, not just IT. Our frontline staff actually use it — because the workflows make sense to them.',
    name: 'Rachel K.',
    role: 'Head of Governance & Risk',
    org: 'Regional Financial Services Group',
    sector: 'Financial Services',
  },
  {
    quote:
      'Standard 8 reporting used to consume two full weeks per quarter. With FormaOS we close the same cycle in under two days with a traceable evidence trail.',
    name: 'Michael D.',
    role: 'Quality & Compliance Lead',
    org: 'Residential Aged Care Group',
    sector: 'Aged Care',
  },
] as const;

const TRUST_STATS = [
  { value: 'SOC 2-aligned', label: 'Trust framework' },
  { value: 'AES-256', label: 'Encryption at rest' },
  { value: 'AU-hosted', label: 'US / EU residency on roadmap' },
  { value: 'SAML 2.0', label: 'Enterprise SSO + MFA' },
  { value: '14-day', label: 'Free trial — no card required' },
] as const;

export function TestimonialsSection() {
  const [featured, ...rest] = TESTIMONIALS;

  return (
    <section className="mk-section home-section relative">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">

        {/* Section label */}
        <ScrollReveal variant="fadeUp">
          <p className="mb-12 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600">
            From regulated teams
          </p>
        </ScrollReveal>

        {/* Featured testimonial — editorial, full-width */}
        <ScrollReveal variant="fadeUp">
          <blockquote className="mb-8 relative">
            <span className="absolute -top-4 -left-2 text-5xl leading-none text-white/[0.06] font-serif select-none" aria-hidden>
              &ldquo;
            </span>
            <p className="text-xl font-medium leading-[1.65] text-slate-200 max-w-3xl sm:text-2xl">
              {featured.quote}
            </p>
            <footer className="mt-6 flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/15 text-sm font-semibold text-teal-400">
                {featured.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{featured.name}</p>
                <p className="text-xs text-slate-500">
                  {featured.role} · {featured.org}
                </p>
              </div>
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-teal-500/60 border border-teal-500/20 rounded-full px-2.5 py-1">
                {featured.sector}
              </span>
            </footer>
          </blockquote>
        </ScrollReveal>

        {/* Supporting testimonials — 3-column */}
        <div className="grid gap-2 sm:grid-cols-3 mb-12">
          {rest.map((t) => (
            <ScrollReveal key={t.name} variant="fadeUp">
              <article className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-5 h-full flex flex-col">
                <blockquote className="flex-1 text-sm leading-[1.7] text-slate-400">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="mt-5 pt-4 border-t border-white/[0.05] flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-400">
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{t.name}</p>
                    <p className="text-[11px] text-slate-600 truncate">{t.org}</p>
                  </div>
                </footer>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust strip — inline, no card chrome */}
        <ScrollReveal variant="fadeUp">
          <div className="border-t border-white/[0.06] pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xs font-semibold text-slate-300">{stat.value}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
