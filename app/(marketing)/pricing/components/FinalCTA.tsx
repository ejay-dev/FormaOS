'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Rocket } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { SectionMedia } from '@/components/marketing/SectionMedia';

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
      <SectionMedia src="/marketing-media/enterprise.jpg" objectPosition="50% 40%" opacity={0.6} scrim="center" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(113,113,122,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_70%,rgba(148,163,184,0.1),transparent_45%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto mb-12 max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <span className="h-px w-6 bg-white/25" />
            <span className="text-slate-400">Closing decision</span>
            <span className="text-slate-600">·</span>
            <span>two procurement paths</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Stop relying on people to{' '}
            <span className="text-slate-500">remember</span> compliance.
            <br />
            <span className="text-foreground">
              Let the system enforce it.
            </span>
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            Choose a path that matches your buying motion. Same compliance
            engine, same architecture — different procurement and onboarding.
          </p>
        </ScrollReveal>

        {/* Dual-path frame */}
        <ScrollReveal variant="depthSlide" range={[0.05, 0.4]}>
          <div className="grid gap-5 lg:grid-cols-2">
            {PATHS.map((path) => {
              const Icon = path.icon;
              const isPrimary = path.ctaVariant === 'primary';
              const accentBorder = 'border-white/[0.12]';
              const accentText = 'text-slate-200';
              const accentChip =
                'border-white/[0.12] bg-white/[0.06] text-slate-200';
              const cornerTop = 'border-white/30';
              const cornerBottom = 'border-white/20';

              return (
                <article
                  key={path.id}
                  className={`relative overflow-hidden rounded-3xl border ${accentBorder} bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-7 sm:p-9`}
                >
                  {/* Corner accents */}
                  <span
                    className={`pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t ${cornerTop}`}
                  />
                  <span
                    className={`pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t ${cornerTop}`}
                  />
                  <span
                    className={`pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l ${cornerBottom}`}
                  />
                  <span
                    className={`pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r ${cornerBottom}`}
                  />

                  {/* Stage marker */}
                  <div className="mb-6 flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accentBorder} bg-white/[0.03] font-mono text-sm ${accentText}`}
                    >
                      {path.code}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      Path / {path.id.toUpperCase()}
                    </span>
                    <span className="ml-auto h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${accentChip}`}
                    >
                      {path.label}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                      <Icon
                        className={`h-5 w-5 ${accentText}`}
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
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/[0.06] pt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500"
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
