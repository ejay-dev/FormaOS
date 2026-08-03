import Link from 'next/link';
import { ArrowRight, History, Lock, ShieldCheck } from 'lucide-react';

// Cryptographic audit-chain proof section. Surfaces the Merkle + Sigstore
// Rekor anchoring (lib/audit/merkle.ts, lib/audit/external-anchor.ts) and the
// append-only immutability-trigger + RLS enforcement.
//
// Server component on purpose: this is the section a security reviewer is most
// likely to read, so its copy has to be in the initial HTML.
const PILLARS = [
  {
    icon: Lock,
    title: 'HMAC-chained rows',
    tag: 'Tamper-evident by construction',
    body: 'Each row carries a sequence number and an HMAC-SHA256 signature linking it to the previous row. A nightly cron re-walks the chain; any drift surfaces as a chain-integrity break before the next audit.',
  },
  {
    icon: History,
    title: 'External anchor at 05:30 UTC',
    tag: 'Verifiable without trusting us',
    body: "Daily, each org's chain top is submitted to Sigstore Rekor as an RFC 6962-style Merkle entry. An auditor can verify the timestamp of any event without trusting us, the proof goes through Linux Foundation infrastructure.",
  },
  {
    icon: ShieldCheck,
    title: 'Append-only at the database',
    tag: 'Immutable, even to platform admins',
    body: 'A BEFORE UPDATE OR DELETE trigger rejects any mutation of audit rows, backed by restrictive RLS deny policies. Even a platform admin with service-role credentials, which bypasses RLS, is stopped by the trigger. Enforced by Postgres, not application code.',
  },
] as const;

const CHAIN_FACTS = [
  { value: 'HMAC-SHA256', label: 'Row signature' },
  { value: 'RFC 6962', label: 'Merkle proof' },
  { value: '05:30 UTC', label: 'Daily anchor' },
  { value: 'Append-only', label: 'DB trigger + RLS' },
  { value: 'Sigstore Rekor', label: 'External log' },
] as const;

export function AuditChainSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Opens on the claim itself rather than a label above it. */}
        <div className="mb-12 max-w-3xl lg:mb-14">
          <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
            Verifiable, not just &ldquo;we have logs&rdquo;
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
            Every org&apos;s audit log is hash-chained, RLS-locked against
            mutation, and anchored daily to Sigstore Rekor, the same append-only
            transparency log the Linux Foundation runs for signed open-source
            releases.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.title}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-white/20"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                  <Icon className="h-5 w-5 text-zinc-300" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-1 text-[13px] text-zinc-400">{pillar.tag}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {pillar.body}
                </p>
              </article>
            );
          })}
        </div>

        {/* Facts bar, the technical primitives, hairline-divided */}
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-5">
          {CHAIN_FACTS.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-col gap-1 bg-marketing-bg px-5 py-5 transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <dt className="order-2 text-xs text-zinc-400">{fact.label}</dt>
              <dd className="order-1 font-display text-[15px] font-semibold tabular-nums text-white">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10">
          <Link
            href="/trust"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
          >
            Full architecture, retention, and hosting on /trust
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
