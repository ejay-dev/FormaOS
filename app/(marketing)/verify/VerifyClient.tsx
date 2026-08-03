'use client';

import { useState } from 'react';
import {
  verifyMerkleBundle,
  type MerkleVerificationResult,
  type VerificationStep,
} from '@/lib/audit/verify-export-merkle-client';
import {
  verifyRekorAnchor,
  type RekorVerificationResult,
} from '@/lib/audit/verify-rekor-anchor-client';

type LoadState = 'idle' | 'running' | 'done';

export default function VerifyClient() {
  const [bundleText, setBundleText] = useState('');
  const [merkleResult, setMerkleResult] = useState<MerkleVerificationResult | null>(null);
  const [merkleError, setMerkleError] = useState<string | null>(null);
  const [merkleState, setMerkleState] = useState<LoadState>('idle');

  const [rekorUuid, setRekorUuid] = useState('');
  const [rekorHash, setRekorHash] = useState('');
  const [rekorResult, setRekorResult] = useState<RekorVerificationResult | null>(null);
  const [rekorError, setRekorError] = useState<string | null>(null);
  const [rekorState, setRekorState] = useState<LoadState>('idle');

  async function runMerkle() {
    setMerkleState('running');
    setMerkleError(null);
    setMerkleResult(null);
    try {
      const parsed = JSON.parse(bundleText);
      const out = await verifyMerkleBundle(parsed);
      setMerkleResult(out);
    } catch (err) {
      setMerkleError((err as Error).message ?? String(err));
    } finally {
      setMerkleState('done');
    }
  }

  async function runRekor() {
    setRekorState('running');
    setRekorError(null);
    setRekorResult(null);
    try {
      const out = await verifyRekorAnchor({
        uuid: rekorUuid.trim(),
        expectedTopHash: rekorHash.trim().toLowerCase(),
      });
      setRekorResult(out);
    } catch (err) {
      setRekorError((err as Error).message ?? String(err));
    } finally {
      setRekorState('done');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Verify a FormaOS audit export
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Paste an export bundle to recompute its Merkle root, or paste a Sigstore Rekor entry
          to confirm the published top-of-chain hash was witnessed by the public transparency log.
          Both verifications run entirely in your browser via SubtleCrypto, nothing leaves your machine
          except the public Rekor lookup.
        </p>
      </header>

      <section
        className="mb-10 rounded-2xl border border-border bg-card p-5 sm:p-6"
        data-testid="verify-merkle-section"
      >
        <h2 className="text-lg font-semibold sm:text-xl">1. Merkle bundle verifier</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste the JSON contents of <code className="font-mono text-xs">audit-log-*.json</code>.
          Verifies every leaf hash + every inclusion proof against the published root.
        </p>
        <textarea
          value={bundleText}
          onChange={(e) => setBundleText(e.target.value)}
          rows={8}
          spellCheck={false}
          placeholder='{"manifest": {...}, "merkle": {...}, "entries": [...]}'
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
          data-testid="merkle-input"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={runMerkle}
            disabled={merkleState === 'running' || bundleText.trim().length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="merkle-verify-btn"
          >
            {merkleState === 'running' ? 'Verifying…' : 'Verify bundle'}
          </button>
          {merkleResult && <ResultBadge ok={merkleResult.ok} />}
        </div>
        {merkleError && (
          <p className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-destructive">
            Parse error: {merkleError}
          </p>
        )}
        {merkleResult && <StepList steps={merkleResult.steps} />}
        {merkleResult && merkleResult.summary.root && (
          <dl className="mt-4 grid gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
            <SummaryRow label="Root" value={merkleResult.summary.root} mono />
            <SummaryRow
              label="Tree size"
              value={merkleResult.summary.tree_size?.toLocaleString() ?? '—'}
            />
            <SummaryRow
              label="Generated"
              value={merkleResult.summary.generated_at ?? '—'}
            />
          </dl>
        )}
      </section>

      <section
        className="rounded-2xl border border-border bg-card p-5 sm:p-6"
        data-testid="verify-rekor-section"
      >
        <h2 className="text-lg font-semibold sm:text-xl">2. Rekor anchor verifier</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirms the named Sigstore Rekor entry recorded the expected top-of-chain hash + verifies
          the signature against the entry&apos;s embedded public key.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-foreground">
              Rekor entry UUID
            </span>
            <input
              value={rekorUuid}
              onChange={(e) => setRekorUuid(e.target.value)}
              spellCheck={false}
              placeholder="24296fb24b8ad77a…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
              data-testid="rekor-uuid-input"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-foreground">
              Expected top-of-chain hash (hex)
            </span>
            <input
              value={rekorHash}
              onChange={(e) => setRekorHash(e.target.value)}
              spellCheck={false}
              placeholder="8c6ae24fa604c7da…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
              data-testid="rekor-hash-input"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={runRekor}
            disabled={
              rekorState === 'running' ||
              rekorUuid.trim().length === 0 ||
              rekorHash.trim().length === 0
            }
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="rekor-verify-btn"
          >
            {rekorState === 'running' ? 'Verifying…' : 'Verify anchor'}
          </button>
          {rekorResult && <ResultBadge ok={rekorResult.ok} />}
        </div>
        {rekorError && (
          <p className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-destructive">
            {rekorError}
          </p>
        )}
        {rekorResult && <StepList steps={rekorResult.steps} />}
        {rekorResult && rekorResult.summary.recorded_hash && (
          <dl className="mt-4 grid gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs sm:grid-cols-2">
            <SummaryRow label="Recorded hash" value={rekorResult.summary.recorded_hash} mono />
            <SummaryRow label="Integrated at" value={rekorResult.summary.integrated_at ?? '—'} />
            <SummaryRow
              label="Log index"
              value={rekorResult.summary.log_index?.toLocaleString() ?? '—'}
            />
            <SummaryRow label="Log ID" value={rekorResult.summary.log_id ?? '—'} mono />
          </dl>
        )}
      </section>

      <footer className="mt-10 text-xs text-muted-foreground">
        <p>
          Want the source? The CLI equivalents live at{' '}
          <code className="font-mono">scripts/verify-export-merkle.mjs</code> and{' '}
          <code className="font-mono">scripts/verify-rekor-anchor.mjs</code> in the FormaOS
          repository. This page wraps the same logic in client-side SubtleCrypto so an auditor
          can verify without installing anything.
        </p>
      </footer>
    </main>
  );
}

function ResultBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-semibold ${
        ok ? 'text-success' : 'text-destructive'
      }`}
      data-testid="verify-result-badge"
      data-result={ok ? 'pass' : 'fail'}
    >
      {ok ? 'Verified' : 'Failed'}
    </span>
  );
}

function StepList({ steps }: { steps: VerificationStep[] }) {
  return (
    <ol className="mt-4 space-y-2" data-testid="verify-step-list">
      {steps.map((step, idx) => (
        <li
          key={idx}
          className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-3 py-2"
        >
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold ${
              step.status === 'pass' ? 'text-success' : 'text-destructive'
            }`}
          >
            {step.status === 'pass' ? '✓' : '✗'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{step.label}</p>
            {step.detail && (
              <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  );
}
