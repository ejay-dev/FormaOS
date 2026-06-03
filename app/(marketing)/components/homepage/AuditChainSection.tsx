'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  History,
  Lock,
  ShieldCheck,
} from 'lucide-react';
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

// Illustrative hash-chain rows. Each row's `prev` equals the previous row's
// `hmac`, so the linkage is internally consistent — it demonstrates the
// mechanism, not real customer data.
const CHAIN_ROWS = [
  { seq: '1024', hmac: 'a3f1…9c2', prev: '5e8b…41d' },
  { seq: '1025', hmac: '7c1e…0b4', prev: 'a3f1…9c2' },
  { seq: '1026', hmac: 'd92a…5f7', prev: '7c1e…0b4', top: true },
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
          className="mx-auto mb-12 max-w-2xl text-center lg:mb-14"
        >
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-white/15" />
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Cryptographic audit chain
            </p>
            <span className="h-px w-8 bg-white/15" />
          </div>
          <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
            Verifiable, not just &ldquo;we have logs&rdquo;
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400">
            Every org&apos;s audit log is hash-chained, RLS-locked against
            mutation, and anchored daily to Sigstore Rekor — the same
            append-only transparency log the Linux Foundation runs for signed
            open-source releases.
          </p>
        </ScrollReveal>

        {/* Hash-chain visual — rows linked by HMAC, anchored to Rekor */}
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="mx-auto mb-10 max-w-5xl rounded-2xl border border-white/[0.08] bg-white/[0.015] p-5 sm:mb-12 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                audit_log · append-only · hash-chained
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                illustrative
              </span>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              {CHAIN_ROWS.map((row) => (
                <div
                  key={row.seq}
                  className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center"
                >
                  <div className="flex-1 rounded-xl border border-white/[0.1] bg-[#0a0f1d] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-white">
                        #{row.seq}
                      </span>
                      {'top' in row && row.top ? (
                        <span className="rounded border border-white/15 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-slate-300">
                          chain top
                        </span>
                      ) : (
                        <Lock
                          className="h-3.5 w-3.5 text-slate-600"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <dl className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-600">hmac</dt>
                        <dd className="text-slate-200">{row.hmac}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-slate-600">prev</dt>
                        <dd className="text-slate-500">{row.prev}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex justify-center text-slate-600">
                    <ArrowRight
                      className="h-4 w-4 rotate-90 lg:rotate-0"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))}

              {/* External anchor */}
              <div className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-white">
                    Sigstore Rekor
                  </span>
                </div>
                <dl className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-600">proof</dt>
                    <dd className="text-slate-300">Merkle inclusion</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-600">anchored</dt>
                    <dd className="text-slate-300">05:30 UTC</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal
                key={pillar.title}
                variant="fadeUp"
                range={[idx * 0.05, 0.3 + idx * 0.05]}
              >
                <article className="h-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/20">
                  <Icon className="mb-4 h-5 w-5 text-slate-300" aria-hidden="true" />
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
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white underline-offset-4 hover:underline"
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
