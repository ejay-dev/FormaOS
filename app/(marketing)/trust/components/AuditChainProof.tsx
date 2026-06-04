import { History, Lock, ShieldCheck } from 'lucide-react';

// Server-rendered (not client) — the audit-chain proof MUST land in the
// initial HTML response so crawlers, AI answer engines, and procurement
// reviewers can read it without executing JS. The homepage
// AuditChainSection links here for the long-form explanation, so the
// claim chain has to stand up to a "view source" inspection.

const PILLARS = [
  {
    icon: Lock,
    eyebrow: 'R3 · audit_log',
    title: 'HMAC-chained rows',
    body:
      'Each row carries a sequence number and an HMAC-SHA256 signature linking it to the previous row. A nightly cron re-walks the chain end-to-end; any drift is surfaced as a chain-integrity break before the next audit, not during it.',
  },
  {
    icon: History,
    eyebrow: 'R4 · sigstore rekor',
    title: 'External anchor at 05:30 UTC',
    body:
      "Daily, each org's chain top is submitted to Sigstore Rekor, the Linux Foundation transparency log used for signed open-source releases. The submission is an RFC 6962-style Merkle entry. An auditor can verify the timestamp of any event without trusting FormaOS, because the proof goes through Linux Foundation infrastructure.",
  },
  {
    icon: ShieldCheck,
    eyebrow: 'postgres · rls',
    title: 'Append-only at the database',
    body:
      'A BEFORE UPDATE OR DELETE trigger rejects any mutation of audit rows, backed by restrictive RLS deny policies. A platform admin with service-role credentials (which bypasses RLS) is still stopped by the trigger. The rule is enforced by Postgres, not by application code, so an app-level bypass is not a vector.',
  },
] as const;

export function AuditChainProof() {
  return (
    <section
      aria-labelledby="trust-audit-chain-heading"
      className="mk-section relative"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-white/25" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Cryptographic audit chain
            </span>
          </div>
          <h2
            id="trust-audit-chain-heading"
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Verifiable, not just &ldquo;we have logs&rdquo;
          </h2>
          <p className="mt-3 text-slate-300 leading-relaxed">
            FormaOS&apos;s audit log isn&apos;t a trust-us assertion. Every
            row is HMAC-chained to the previous one, the chain top is
            anchored daily to a Linux Foundation transparency log, and the
            database itself denies mutation. The proof a buyer or auditor
            needs is in code paths checked into our repo, not in a marketing
            page.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.title}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6"
              >
                <Icon className="mb-4 h-5 w-5 text-slate-300" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {pillar.eyebrow}
                </p>
                <h3 className="mt-2 text-base font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {pillar.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AuditChainProof;
