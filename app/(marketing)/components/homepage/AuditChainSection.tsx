'use client';

import Link from 'next/link';
import { ArrowRight, History, Lock, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

// Cryptographic audit-chain proof section. Surfaces the
// Merkle + Sigstore Rekor anchoring (lib/audit/merkle.ts,
// lib/audit/external-anchor.ts) and the append-only
// immutability-trigger + RLS enforcement that lives in the
// codebase but was never
// represented in marketing copy until 2026-05-28.

const PILLARS = [
  {
    icon: Lock,
    eyebrow: 'R3 · audit_log',
    title: 'HMAC-chained rows',
    body:
      'Each row carries a sequence number and an HMAC-SHA256 signature linking it to the previous row. A nightly cron re-walks the chain; any drift surfaces as a chain-integrity break before the next audit.',
  },
  {
    icon: History,
    eyebrow: 'R4 · sigstore rekor',
    title: 'External anchor at 05:30 UTC',
    body:
      "Daily, each org's chain top is submitted to Sigstore Rekor as an RFC 6962-style Merkle entry. An auditor can verify the timestamp of any event without trusting us — the proof goes through Linux Foundation infrastructure.",
  },
  {
    icon: ShieldCheck,
    eyebrow: 'postgres · rls',
    title: 'Append-only at the database',
    body:
      'A BEFORE UPDATE OR DELETE trigger rejects any mutation of audit rows, backed by restrictive RLS deny policies. Even a platform admin with service-role credentials — which bypasses RLS — is stopped by the trigger. The rule is enforced by Postgres, not by application code.',
  },
] as const;

export function AuditChainSection() {
  return (
    <section className="mk-section relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.3]}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <Lock className="h-3.5 w-3.5" />
            Cryptographic audit chain
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Verifiable, not just &ldquo;we have logs&rdquo;
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            Every org&apos;s audit log is hash-chained, RLS-locked against
            mutation, and anchored daily to Sigstore Rekor — the same
            append-only transparency log the Linux Foundation runs for signed
            open-source releases.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal
                key={pillar.title}
                variant="fadeRight"
                range={[idx * 0.05, 0.3 + idx * 0.05]}
              >
                <article className="h-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <Icon className="mb-4 h-5 w-5 text-cyan-300/80" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {pillar.eyebrow}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-white">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {pillar.body}
                  </p>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        <div className="mt-10 text-center sm:mt-14">
          <Link
            href="/trust"
            className="text-sm font-semibold text-cyan-200 underline-offset-4 hover:underline"
          >
            Full architecture, retention, and hosting on /trust
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
