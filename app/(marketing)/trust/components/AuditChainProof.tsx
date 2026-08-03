// Server-rendered (not client), the audit-chain proof MUST land in the
// initial HTML response so crawlers, AI answer engines, and procurement
// reviewers can read it without executing JS. The homepage
// AuditChainSection and the /security hero both link here for the
// long-form explanation, so the claim chain has to stand up to a
// "view source" inspection.

const LINKS = [
  {
    label: 'The log itself',
    title: 'Every row is signed against the one before it',
    body:
      'Each audit row carries a sequence number and an HMAC-SHA256 signature over the previous row. A nightly job re-walks the chain end to end. If a row were altered or removed, the walk breaks at that point, and it surfaces as a chain-integrity break before your next audit rather than during it.',
  },
  {
    label: 'The external witness',
    title: 'The chain top is anchored outside our systems, daily',
    body:
      "Once a day at 05:30 UTC, each organisation's chain top is submitted to Sigstore Rekor, the Linux Foundation transparency log used for signed open-source releases. The submission is an RFC 6962-style Merkle entry. An auditor can confirm the timestamp of any event through Linux Foundation infrastructure, without taking our word for it.",
  },
  {
    label: 'The database rule',
    title: 'Append-only is enforced by Postgres, not by our code',
    body:
      'A BEFORE UPDATE OR DELETE trigger rejects any mutation of an audit row, backed by restrictive row-level security deny policies. An operator holding service-role credentials, which bypass row-level security, is still stopped by the trigger. Because the rule sits in the database, an application-level bypass is not a route around it.',
  },
] as const;

export function AuditChainProof() {
  return (
    <section
      aria-labelledby="trust-audit-chain-heading"
      className="mk-section relative"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2
          id="trust-audit-chain-heading"
          className="text-3xl sm:text-4xl font-bold text-white"
        >
          Verifiable, not just &ldquo;we have logs&rdquo;
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          The audit log is not a trust-us assertion. Three independent
          mechanisms have to agree before a record is accepted as
          untampered, and one of them sits outside our infrastructure
          entirely.
        </p>

        <ol className="mt-12 space-y-10 border-l border-white/10 pl-6 sm:pl-10">
          {LINKS.map((link) => (
            <li key={link.label} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.72rem] top-2 h-2.5 w-2.5 rounded-full bg-white/40 sm:-left-[2.72rem]"
              />
              <p className="text-sm text-slate-400">{link.label}</p>
              <h3 className="mt-1 text-xl font-semibold text-white">
                {link.title}
              </h3>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-300">
                {link.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-12 max-w-2xl text-sm leading-7 text-slate-400">
          The proof a buyer or auditor needs is in code paths checked into
          the repository, not in a marketing page. Ask for the anchoring job
          and the trigger definition during security review and you will get
          both.
        </p>
      </div>
    </section>
  );
}

export default AuditChainProof;
