'use client';

/**
 * Interactive, tamper-evident audit-chain visualizer.
 *
 * Honesty: hashes are REAL SHA-256 (Web Crypto), and chaining mirrors the
 * production design described on /trust, each row's hash is derived from
 * the previous row's hash plus its own content, so editing any sealed row
 * makes its recomputed hash diverge from the stored seal and breaks every
 * block after it. The Rekor anchor footer is labelled illustrative;
 * production anchors the chain head to Sigstore Rekor daily and enforces
 * append-only at the database layer (Postgres trigger + RLS), not app code.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ShieldAlert, Plus, RotateCcw, Anchor, Pencil, Lock } from 'lucide-react';

const GENESIS = '0'.repeat(64);

interface Block {
  seq: number;
  label: string;
  actor: string;
  detail: string;
  /** Hash of the block this one was sealed against (immutable). */
  prevHash: string;
  /** SHA-256 sealed at creation from prevHash + original content (immutable). */
  hash: string;
  /** Set when the row is edited after sealing: recomputed hash of new content. */
  liveHash: string | null;
}

interface RenderRow extends Block {
  status: 'sealed' | 'broken';
  /** This row's own content still matches its seal. */
  sealOk: boolean;
}

type EventInput = Pick<Block, 'label' | 'actor' | 'detail'>;

const SEED: ReadonlyArray<EventInput> = [
  { label: 'Control verified', actor: 'Security Reviewer', detail: 'ISO 27001 A.9.2.3 · privileged access' },
  { label: 'Evidence sealed', actor: 'Evidence Reviewer', detail: 'Q4 access-review export' },
  { label: 'Policy approved', actor: 'Policy Owner', detail: 'Data Retention Policy v3.0' },
  { label: 'Audit packet exported', actor: 'Compliance Lead', detail: 'SOC 2 Type II · FY26' },
];

const APPENDABLE: ReadonlyArray<EventInput> = [
  { label: 'Incident logged', actor: 'On-call Engineer', detail: 'SEV-2 access anomaly' },
  { label: 'Risk assessed', actor: 'Risk Analyst', detail: 'Third-party vendor review' },
  { label: 'Control verified', actor: 'Security Reviewer', detail: 'MFA coverage at 100%' },
  { label: 'Evidence sealed', actor: 'Evidence Reviewer', detail: 'Backup restoration test' },
  { label: 'Worker screened', actor: 'People Ops', detail: 'NDIS Worker Screening renewal' },
];

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const canonical = (seq: number, label: string, actor: string, detail: string): string =>
  `${seq}|${label}|${actor}|${detail}`;

async function sealChain(events: ReadonlyArray<EventInput>): Promise<Block[]> {
  const blocks: Block[] = [];
  let prevHash = GENESIS;
  for (let i = 0; i < events.length; i += 1) {
    const seq = i + 1;
    const { label, actor, detail } = events[i];
    const hash = await sha256(prevHash + canonical(seq, label, actor, detail));
    blocks.push({ seq, label, actor, detail, prevHash, hash, liveHash: null });
    prevHash = hash;
  }
  return blocks;
}

const short = (hash: string): string => `${hash.slice(0, 10)}…${hash.slice(-4)}`;

export function AuditChainVisualizer() {
  const reduce = useReducedMotion();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [ready, setReady] = useState(false);
  const appendIdx = useRef(0);
  const blocksRef = useRef<Block[]>([]);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    let active = true;
    sealChain(SEED).then((seeded) => {
      if (active) {
        setBlocks(seeded);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const append = useCallback(async () => {
    const cur = blocksRef.current;
    const event = APPENDABLE[appendIdx.current % APPENDABLE.length];
    appendIdx.current += 1;
    const seq = cur.length + 1;
    const prevHash = cur.length ? cur[cur.length - 1].hash : GENESIS;
    const hash = await sha256(prevHash + canonical(seq, event.label, event.actor, event.detail));
    setBlocks((prev) => [
      ...prev,
      { seq, label: event.label, actor: event.actor, detail: event.detail, prevHash, hash, liveHash: null },
    ]);
  }, []);

  const toggleTamper = useCallback(async (seq: number) => {
    const target = blocksRef.current.find((b) => b.seq === seq);
    if (!target) return;
    if (target.liveHash) {
      // restore
      setBlocks((prev) =>
        prev.map((b) =>
          b.seq === seq
            ? { ...b, liveHash: null, detail: b.detail.replace(/ \(altered\)$/, '') }
            : b,
        ),
      );
      return;
    }
    const altered = `${target.detail} (altered)`;
    const liveHash = await sha256(target.prevHash + canonical(seq, target.label, target.actor, altered));
    setBlocks((prev) =>
      prev.map((b) => (b.seq === seq ? { ...b, detail: altered, liveHash } : b)),
    );
  }, []);

  const reset = useCallback(() => {
    setReady(false);
    appendIdx.current = 0;
    sealChain(SEED).then((seeded) => {
      setBlocks(seeded);
      setReady(true);
    });
  }, []);

  // Derive integrity: a row's seal is OK when it hasn't been edited; the first
  // edited row breaks the chain and every block after it inherits the break.
  const rows: RenderRow[] = useMemo(() => {
    let broken = false;
    return blocks.map((b) => {
      const sealOk = b.liveHash === null;
      const ok = sealOk && !broken;
      if (!ok) broken = true;
      return { ...b, status: ok ? 'sealed' : 'broken', sealOk };
    });
  }, [blocks]);

  const firstBroken = rows.find((r) => r.status === 'broken');
  const intact = !firstBroken;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.02]">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border ${
              intact
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                : 'border-rose-400/30 bg-rose-400/10 text-rose-400'
            }`}
          >
            {intact ? <Check className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          </span>
          <span className="text-sm font-semibold text-white">
            {intact ? 'Chain verified' : `Tamper detected at entry #${firstBroken?.seq}`}
          </span>
          <span className="hidden font-mono text-[11px] text-slate-500 sm:inline">
            SHA-256 · {rows.length} blocks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={append}
            disabled={!ready}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.08] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Append event
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/[0.16] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Blocks */}
      <ol className="divide-y divide-white/[0.05]">
        {rows.map((row) => {
          const broken = row.status === 'broken';
          const edited = !row.sealOk;
          return (
            <motion.li
              key={row.seq}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
              className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-4 px-5 py-3.5 transition-colors ${
                broken ? 'bg-rose-500/[0.04]' : ''
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-[11px] font-semibold ${
                  broken
                    ? 'border-rose-400/30 bg-rose-400/[0.08] text-rose-300'
                    : 'border-white/[0.12] bg-white/[0.04] text-slate-300'
                }`}
              >
                {row.seq}
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-white">{row.label}</span>
                  <span className="text-xs text-slate-500">· {row.actor}</span>
                </div>
                <p className="truncate text-[13px] text-slate-400">{row.detail}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px]">
                  <span className="text-slate-500">
                    prev <span className="text-slate-600">{short(row.prevHash)}</span>
                  </span>
                  {edited ? (
                    <>
                      <span className="text-rose-400">recomputed {short(row.liveHash as string)}</span>
                      <span className="text-slate-600">≠ sealed {short(row.hash)}</span>
                    </>
                  ) : (
                    <span className={broken ? 'text-rose-400' : 'text-slate-400'}>
                      hash {short(row.hash)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] sm:inline-flex ${
                    broken ? 'border-rose-400/30 text-rose-300' : 'border-emerald-400/25 text-emerald-300/90'
                  }`}
                >
                  {broken ? <ShieldAlert className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {broken ? (edited ? 'Altered' : 'Broken') : 'Sealed'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleTamper(row.seq)}
                  aria-pressed={edited}
                  title={edited ? 'Restore original content' : 'Edit this sealed entry'}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                    edited
                      ? 'border-rose-400/40 bg-rose-400/10 text-rose-300'
                      : 'border-white/[0.1] text-slate-500 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {/* Anchor footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.015] px-5 py-3">
        <span className="flex items-center gap-2 text-[11px] text-slate-500">
          <Anchor className="h-3.5 w-3.5 text-slate-400" />
          Chain head anchored daily to Sigstore Rekor · 05:30 UTC
        </span>
        <span className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Illustrative · live SHA-256
        </span>
      </div>
    </div>
  );
}
