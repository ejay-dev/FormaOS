'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Rocket, Sparkles } from 'lucide-react';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

/**
 * FinalCTA — two procurement paths (self-serve vs enterprise). Strips the
 * earlier corner-bracket / mono-eyebrow / Path-A/B terminal framing. Uses
 * the same SystemSection + systemPanel + IconFrame primitives the home
 * page does. Featured CTA uses mk-btn-primary (consistent with the rest of
 * the site); secondary is mk-btn-secondary.
 */
const PATHS = [
  {
    id: 'self-serve',
    icon: Rocket,
    label: 'Self-serve',
    title: 'Foundation, Growth, or Scale',
    body: 'Sign up, configure your first framework, and start enforcing controls today. Stripe-secured. Cancel anytime.',
    bullets: [
      'Stripe Checkout',
      'Guided onboarding, audit-ready quickly',
      'Cancel or downgrade with full data portability',
    ],
    ctaLabel: 'Start setup',
    ctaHref: '/auth/signup?source=pricing_final',
    primary: true,
  },
  {
    id: 'enterprise',
    icon: Building2,
    label: 'Enterprise',
    title: 'Procurement-led rollout',
    body: 'Custom contract, security review, white-glove onboarding, dedicated CSM, SSO, and tailored compliance architecture.',
    bullets: [
      'Procurement and security review pack',
      'SAML SSO, directory sync, DPA, custom SLA',
      'Audit-period support and Commission review assistance',
    ],
    ctaLabel: 'Talk to procurement',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing_final',
    primary: false,
  },
];

const ASSURANCE_ITEMS = [
  'Assessment-led scoping',
  'No arbitrary feature gates',
  'Full platform access',
  'Procurement-ready',
];

export function FinalCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <SystemSection variant="emerald">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={Sparkles} tone="valid">
          Closing decision
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Stop relying on people to remember compliance.
          <br />
          <AccentText>Let the system enforce it.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Choose a path that matches your buying motion. Same compliance
          engine, same architecture — different procurement and onboarding.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {PATHS.map((path) => (
          <article
            key={path.id}
            className={`flex flex-col p-7 sm:p-8 ${systemPanelClass}`}
          >
            <div className="flex items-start gap-4">
              <IconFrame
                icon={path.icon}
                tone={path.primary ? 'valid' : 'neutral'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold tracking-tight text-white">
                    {path.title}
                  </h3>
                  <StatusPill tone={path.primary ? 'valid' : 'neutral'}>
                    {path.label}
                  </StatusPill>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {path.body}
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-5">
              {path.bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-sm leading-snug text-slate-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                  />
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
              className={`mt-7 inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold ${
                path.primary
                  ? 'mk-btn mk-btn-primary'
                  : 'mk-btn mk-btn-secondary'
              }`}
            >
              {path.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>

      {/* Assurance row — plain pills, no mono, no neon dots */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/[0.06] pt-6 text-xs text-slate-400">
        {ASSURANCE_ITEMS.map((item, idx) => (
          <span key={item} className="flex items-center gap-2">
            {idx > 0 && (
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
            )}
            {item}
          </span>
        ))}
      </div>
    </SystemSection>
  );
}
