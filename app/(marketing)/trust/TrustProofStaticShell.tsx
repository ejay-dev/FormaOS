import Link from 'next/link';
import { ArrowRight, Fingerprint, Database, ShieldCheck } from 'lucide-react';

const TRUST_AREAS = [
  {
    icon: Fingerprint,
    title: 'Identity and access controls',
    detail:
      'Enterprise sign-on, MFA enforcement, and accountable approval histories are part of the buying conversation, not an afterthought.',
    bullets: ['SAML 2.0 SSO', 'MFA enforcement', 'Role-aware access reviews'],
  },
  {
    icon: Database,
    title: 'Data handling and residency posture',
    detail:
      'Buyers can inspect how evidence, exports, and regulated data move through the system before they request a full vendor packet.',
    bullets: ['Encrypted storage paths', 'Residency posture visibility', 'Documented retention controls'],
  },
  {
    icon: ShieldCheck,
    title: 'Evidence integrity and auditability',
    detail:
      'The trust story is strongest when the platform shows exactly how approvals, artifacts, and exports stay connected in one defensible chain.',
    bullets: ['Immutable audit trail', 'Export-ready evidence bundles', 'Procurement artifact workflow'],
  },
] as const;

export function TrustProofStaticShell() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-10">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            The answers security reviewers ask first
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            Identity, data handling, and evidence integrity, summarised here and
            documented in full further down the page.
          </p>
        </div>

        <dl className="mt-8 divide-y divide-white/[0.08] border-t border-white/[0.08]">
          {TRUST_AREAS.map((area) => (
            <div
              key={area.title}
              className="grid gap-3 py-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8"
            >
              <dt className="flex items-start gap-3">
                <area.icon
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <span className="text-lg font-semibold text-white">
                  {area.title}
                </span>
              </dt>
              <dd>
                <p className="text-sm leading-7 text-slate-300">
                  {area.detail}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {area.bullets.join(' · ')}
                </p>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/security-review"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Open security review
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/trust/packet"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Review trust packet
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
