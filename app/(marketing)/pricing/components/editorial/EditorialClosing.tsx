'use client';

import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialButton,
  EditorialRule,
} from './primitives';

const PATHS = [
  {
    id: 'self-serve',
    eyebrow: 'Path A',
    label: 'Self-serve',
    title: 'Foundation, Growth, or Scale',
    body: 'Sign up, configure your first framework, and start enforcing controls today. Stripe-secured. Cancel anytime. Full evidence export included.',
    notes: [
      'Stripe Checkout',
      'Guided onboarding, audit-ready in days',
      'Cancel or downgrade with full data portability',
    ],
    ctaLabel: 'Start setup',
    ctaHref: '/auth/signup?source=pricing_final',
    primary: true,
  },
  {
    id: 'enterprise',
    eyebrow: 'Path B',
    label: 'Enterprise',
    title: 'Procurement-led rollout',
    body: 'Custom contract, security review, white-glove onboarding, dedicated CSM, SSO, and tailored compliance architecture for your network.',
    notes: [
      'Procurement and security review pack',
      'SAML SSO, directory sync, DPA, custom SLA',
      'Audit-period support and Commission review assistance',
    ],
    ctaLabel: 'Talk to procurement',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing_final',
    primary: false,
  },
];

/**
 * EditorialClosing — closing page of the feature. Two paths set as
 * editorial sub-articles, stacked on narrow viewports, side-by-side on
 * wide ones. Each has eyebrow / kicker title / body / inline action.
 */
export function EditorialClosing() {
  const { trackCtaClick } = useMarketingTelemetry();
  const today = new Date();
  const signature = today.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <EditorialSection id="begin" num="08" label="To begin" width="wide">
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          Stop relying on people to remember compliance.{' '}
          <em>Let the system enforce it.</em>
        </EditorialHeadline>
        <EditorialLead>
          Same compliance engine, same architecture, same data model &mdash;
          two ways in, sorted by buying motion. Pick the path that matches
          how your organisation procures software, and we will handle the
          rest.
        </EditorialLead>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {PATHS.map((path) => (
          <article
            key={path.id}
            className="border-t border-[color:var(--ed-rule-strong)] pt-6"
          >
            <p className="ed-eyebrow mb-3">
              {path.eyebrow} &mdash; {path.label}
            </p>
            <h3 className="font-serif text-[1.5rem] font-semibold text-[var(--ed-ink)] leading-tight">
              {path.title}
            </h3>
            <p className="ed-body-serif mt-3">{path.body}</p>
            <ul className="mt-5 space-y-2">
              {path.notes.map((note) => (
                <li
                  key={note}
                  className="grid grid-cols-[auto_1fr] items-baseline gap-3 text-[0.9375rem] text-[var(--ed-ink-soft)]"
                >
                  <span className="text-[var(--ed-accent)]">§</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <EditorialButton
                href={path.ctaHref}
                variant={path.primary ? 'accent' : 'solid'}
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
              >
                {path.ctaLabel} &rarr;
              </EditorialButton>
            </div>
          </article>
        ))}
      </div>

      <EditorialRule strong className="mt-14" />
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <p className="ed-caption">
          FormaOS &mdash; Compliance Operating System.{' '}
          <span className="not-italic font-medium text-[var(--ed-ink)]">
            Edition closes {signature}.
          </span>
        </p>
        <p className="ed-footnote">
          Prices in AUD, GST inclusive. Subject to change with 30 days' notice.
        </p>
      </div>
    </EditorialSection>
  );
}
