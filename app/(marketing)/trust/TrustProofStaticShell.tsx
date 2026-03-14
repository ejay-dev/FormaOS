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
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm sm:p-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Procurement Snapshot
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Core trust answers available in the first render
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
            This static layer exposes the answers enterprise buyers usually ask
            first, while the interactive trust center still handles the deeper
            walkthrough below.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TRUST_AREAS.map((area) => (
            <article
              key={area.title}
              className="rounded-2xl border border-white/10 bg-slate-950/45 p-6"
            >
              <div className="inline-flex rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                <area.icon className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">
                {area.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {area.detail}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {area.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20"
          >
            Review trust packet
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
