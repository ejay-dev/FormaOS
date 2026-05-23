'use client';

import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsStamp,
  DsSeal,
  DsButton,
  DsSignature,
  DsPerf,
} from './primitives';

const PATHS = [
  {
    id: 'self-serve',
    eyebrow: 'PATH A',
    label: 'SELF-SERVE',
    title: 'Foundation, Growth, or Scale',
    body: 'Sign up, configure your first framework, and start enforcing controls today. Stripe-secured. Cancel anytime.',
    notes: ['Stripe Checkout', 'Guided onboarding, audit-ready in days', 'Cancel or downgrade with full data portability'],
    ctaLabel: 'Start setup',
    ctaHref: '/auth/signup?source=pricing_final',
    primary: true,
  },
  {
    id: 'enterprise',
    eyebrow: 'PATH B',
    label: 'ENTERPRISE',
    title: 'Procurement-led rollout',
    body: 'Custom contract, security review, white-glove onboarding, dedicated CSM, SSO, and tailored compliance architecture.',
    notes: ['Procurement and security review pack', 'SAML SSO, directory sync, DPA, custom SLA', 'Audit-period support and Commission review assistance'],
    ctaLabel: 'Talk to procurement',
    ctaHref: '/contact?type=enterprise&plan=enterprise&source=pricing_final',
    primary: false,
  },
];

/**
 * DsClosing — "Sign Here" folio. The dossier closes with two side-by-side
 * procurement paths, a notarized signature block at the bottom carrying
 * a wax seal, and a final "APPROVED FOR ISSUE" stamp.
 */
export function DsClosing() {
  const { trackCtaClick } = useMarketingTelemetry();
  const today = new Date();
  const signature = today.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DsContainer width="wide">
      <DsFolio
        id="begin"
        tabLabel="§ SIGN HERE / TO BEGIN"
        tabTone="wax"
        watermark="SIGN HERE"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§08</strong> / TO BEGIN</DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                TWO PATHS &middot; SAME ENGINE
              </DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr_auto] mb-10">
          <DsDisplay as="h2" size="xl">
            Stop relying on people to remember compliance.{' '}
            <em>Let the system enforce it.</em>
          </DsDisplay>
          <DsLead>
            Same compliance engine, same architecture, same data model
            &mdash; two ways in, sorted by buying motion.
          </DsLead>
          <div className="hidden lg:block">
            <DsStamp tone="green" size="lg" rotation="right">
              APPROVED FOR ISSUE
            </DsStamp>
          </div>
        </div>

        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2">
          {PATHS.map((path, idx) => (
            <article
              key={path.id}
              className={`relative border-t-2 border-[var(--ds-rule-strong)] pt-6 ${idx === 0 ? 'lg:pr-8 lg:border-r lg:border-r-dashed lg:border-r-[var(--ds-rule)]' : 'lg:pl-8'}`}
            >
              <DsMeta>
                {path.eyebrow} &middot; <strong>{path.label}</strong>
              </DsMeta>
              <h3 className="mt-3 font-serif text-[1.5rem] font-semibold leading-tight text-[var(--ds-ink)]">
                {path.title}
              </h3>
              <p className="mt-3 ds-body">{path.body}</p>
              <ul className="mt-5 space-y-2 ds-body text-[0.9375rem]">
                {path.notes.map((n) => (
                  <li key={n} className="flex items-baseline gap-3">
                    <span className="text-[var(--ds-wax)]">§</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <DsButton
                  href={path.ctaHref}
                  variant={path.primary ? 'wax' : 'solid'}
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
                </DsButton>
              </div>
            </article>
          ))}
        </div>

        <DsPerf strong className="mt-12 mb-3" />
        <DsSignature
          who="FormaOS — Compliance Operating System"
          on={`Edition issued ${signature} · FY26 · No. 04`}
          seal={
            <DsSeal>
              FOS
              <br />
              FY26
            </DsSeal>
          }
        />
      </DsFolio>
    </DsContainer>
  );
}
