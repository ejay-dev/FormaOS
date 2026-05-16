'use client';

import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
  MxButton,
  MxPullQuote,
  MxRule,
} from './primitives';

const PATHS = [
  {
    id: 'self-serve',
    eyebrow: 'PATH A',
    label: 'SELF-SERVE',
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
    eyebrow: 'PATH B',
    label: 'ENTERPRISE',
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
 * MxClosing — ink block (final closer). Big editorial close: monumental
 * headline + pull quote across the top, then two paths as cream-on-ink
 * sub-articles with bold actions. Signature line at the bottom.
 */
export function MxClosing() {
  const { trackCtaClick } = useMarketingTelemetry();
  const today = new Date();
  const signature = today.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <MxBlock tone="ink" id="begin" rail="§08 / TO BEGIN">
      <MxContainer width="full">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-8">
            <p className="mx-eyebrow opacity-70">§08 / TO BEGIN</p>
            <MxDisplay as="h2" size="xxl" className="mt-5 max-w-3xl">
              Stop relying on people to remember compliance.{' '}
              <em>Let the system enforce it.</em>
            </MxDisplay>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:border-l lg:border-[var(--mx-bold-rule)] lg:pl-8">
            <MxPullQuote className="text-[var(--mx-mustard)]">
              Same engine, two procurement motions.
            </MxPullQuote>
          </div>
        </div>

        <MxRule bold className="mt-14 mb-12" />

        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          {PATHS.map((path, idx) => (
            <article
              key={path.id}
              className={`col-span-12 lg:col-span-6 ${idx === 1 ? 'lg:border-l lg:border-[var(--mx-bold-rule)] lg:pl-8' : 'lg:pr-8'}`}
            >
              <p className="mx-eyebrow opacity-70">
                {path.eyebrow} &mdash; {path.label}
              </p>
              <h3 className="mx-display mx-display--lg mt-4">{path.title}</h3>
              <MxLead className="mt-5 opacity-90">{path.body}</MxLead>
              <ul className="mt-7 space-y-2 mx-body opacity-90">
                {path.notes.map((n) => (
                  <li key={n} className="flex items-baseline gap-3">
                    <span className="text-[var(--mx-mustard)]">§</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <MxButton
                  href={path.ctaHref}
                  variant={path.primary ? 'solid-cream' : 'outline'}
                  className={path.primary ? '' : 'text-[var(--mx-cream)]'}
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
                </MxButton>
              </div>
            </article>
          ))}
        </div>

        <MxRule bold className="mt-14" />

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 opacity-80">
          <p className="mx-caption">
            FormaOS &mdash; Compliance Operating System.{' '}
            <span className="not-italic text-[var(--mx-cream)]">
              Edition closes {signature}.
            </span>
          </p>
          <p className="mx-eyebrow opacity-70">
            FY26 / NO. 04 / SET IN FRAUNCES &amp; INTER
          </p>
        </div>
      </MxContainer>
    </MxBlock>
  );
}
