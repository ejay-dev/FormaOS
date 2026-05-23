import Link from 'next/link';
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

/**
 * ProcurementReadiness — enterprise-buyer assurance section. Strips the
 * StampPattern background, custom rounded-pill eyebrow, and gradient
 * Review-Security-Packet button; routes through the canonical
 * SystemSection + IconFrame + mk-btn pattern.
 */
const assurancePillars = [
  {
    icon: ClipboardCheck,
    title: 'Security review packet',
    detail:
      'Structured packet covering architecture, identity, encryption, data handling, and audit defensibility for buyer review.',
  },
  {
    icon: FileCheck2,
    title: 'Procurement artifacts',
    detail:
      'DPA, vendor assurance materials, enterprise service terms, and trust-center links for legal, risk, and procurement review.',
  },
  {
    icon: ShieldCheck,
    title: 'Operational proof',
    detail:
      'Export compliance posture snapshots on demand: evidence packages, control coverage reports, and framework alignment summaries without spreadsheet reconstruction.',
  },
  {
    icon: Lock,
    title: 'Enterprise identity controls',
    detail:
      'SAML SSO, MFA controls, role-based access by organisational boundary, and session policy management reviewed during enterprise evaluation.',
  },
] as const;

export function ProcurementReadiness() {
  return (
    <SystemSection variant="cyan">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={Sparkles} tone="live">
          Procurement assurance
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Built to survive{' '}
          <AccentText>security and procurement scrutiny.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Enterprise buyers need a clear review path. FormaOS surfaces the
          materials, controls, and operating context early so security and
          procurement teams can evaluate with less back-and-forth.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {assurancePillars.map((pillar) => (
          <article
            key={pillar.title}
            className={`flex flex-col p-6 ${systemPanelClass}`}
          >
            <IconFrame icon={pillar.icon} tone="valid" />
            <h3 className="mt-5 text-base font-semibold text-white">
              {pillar.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {pillar.detail}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/security-review"
          className="mk-btn mk-btn-primary inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-sm font-semibold"
        >
          Review security packet
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/contact?type=procurement&source=pricing_procurement"
          className="mk-btn mk-btn-secondary inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-sm font-semibold"
        >
          Talk with sales engineering
        </Link>
      </div>
    </SystemSection>
  );
}
