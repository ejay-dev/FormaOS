'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Rocket } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

const PATHS = [
  {
    id: 'self-serve',
    code: 'A',
    icon: Rocket,
    label: 'Self-serve',
    title: 'Foundation, Growth, or Scale',
    body: 'Sign up, configure your first framework, and start enforcing controls today. Stripe-secured. Cancel anytime.',
    bullets: [
      'Stripe Checkout',
      'Guided onboarding · audit-ready quickly',
      'Cancel or downgrade with full data portability',
    ],
    ctaLabel: 'Start setup',
    ctaHref: '/auth/signup?source=pricing_final',
    ctaVariant: 'primary' as const,
  },
  {
    id: 'enterprise',
    code: 'B',
    icon: Building2,
    label: 'Enterprise',
    title: 'Procurement-led rollout',
    body: 'Custom contract, security review, white-glove onboarding, dedicated CSM, SSO, and tailored compliance architecture.',
    bullets: [
      'Procurement & security review pack',
      'SAML SSO · directory sync · DPA · custom SLA',
      'Audit-period support and Commission review assistance',
    ],
    ctaLabel: 'Talk to procurement',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing_final',
    ctaVariant: 'secondary' as const,
  },
];

export function FinalCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <section className="relative isolate overflow-hidden py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(255,255,255,0.04),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header — centered label flanked by hairlines */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Two ways to start
            </span>
            <span className="h-px w-10 bg-white/20" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Stop relying on people to{' '}
            <span className="text-slate-500">remember</span> compliance.
            <br className="hidden sm:block" />
            Let the system enforce it.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Choose a path that matches your buying motion. Same compliance
            engine, same architecture, just different procurement and onboarding.
          </p>
        </ScrollReveal>

        {/* Dual-path frame */}
        <ScrollReveal variant="depthSlide" range={[0.05, 0.4]}>
          <div className="grid gap-5 lg:grid-cols-2">
            {PATHS.map((path) => {
              const Icon = path.icon;
              const isPrimary = path.ctaVariant === 'primary';

              return (
                <article
                  key={path.id}
                  className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-white/[0.025] p-7 transition-colors duration-300 hover:border-white/[0.18] sm:p-9"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {path.label}
                    </span>
                    <span className="h-px flex-1 mx-4 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                      <Icon
                        className="h-5 w-5 text-slate-200"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-white">
                        {path.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-slate-400">
                        {path.body}
                      </p>
                    </div>
                  </div>

                  {/* Bullets */}
                  <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-5">
                    {path.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-300"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={path.ctaHref}
                    onClick={() =>
                      trackCtaClick({
                        surface: 'pricing',
                        section: 'final_cta',
                        location: `final_${path.id}`,
                        ctaLabel: path.ctaLabel,
                        ctaHref: path.ctaHref,
                        variant: 'final',
                      })
                    }
                    className={`mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold transition ${
                      isPrimary
                        ? 'bg-foreground text-background hover:opacity-90'
                        : 'border border-white/[0.1] bg-white/[0.04] text-white hover:border-white/[0.2] hover:bg-white/[0.08]'
                    }`}
                  >
                    {path.ctaLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Footer assurance row */}
        <ScrollReveal
          variant="fadeUp"
          range={[0.1, 0.45]}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/[0.06] pt-6 text-[10px] uppercase tracking-[0.22em] text-slate-500"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Assessment-led scoping
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            No arbitrary feature gates
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Full platform access
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Procurement-ready
          </span>
        </ScrollReveal>
      </div>
    </section>
  );
}
