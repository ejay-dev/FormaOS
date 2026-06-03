'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, History, Lock, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

// Cryptographic audit-chain proof section. Surfaces the Merkle + Sigstore
// Rekor anchoring (lib/audit/merkle.ts, lib/audit/external-anchor.ts) and the
// append-only immutability-trigger + RLS enforcement.
const PILLARS = [
  {
    icon: Lock,
    eyebrow: 'R3 · audit_log',
    title: 'HMAC-chained rows',
    body: 'Each row carries a sequence number and an HMAC-SHA256 signature linking it to the previous row. A nightly cron re-walks the chain; any drift surfaces as a chain-integrity break before the next audit.',
  },
  {
    icon: History,
    eyebrow: 'R4 · sigstore rekor',
    title: 'External anchor at 05:30 UTC',
    body: "Daily, each org's chain top is submitted to Sigstore Rekor as an RFC 6962-style Merkle entry. An auditor can verify the timestamp of any event without trusting us — the proof goes through Linux Foundation infrastructure.",
  },
  {
    icon: ShieldCheck,
    eyebrow: 'postgres · rls',
    title: 'Append-only at the database',
    body: 'A BEFORE UPDATE OR DELETE trigger rejects any mutation of audit rows, backed by restrictive RLS deny policies. Even a platform admin with service-role credentials — which bypasses RLS — is stopped by the trigger. Enforced by Postgres, not application code.',
  },
] as const;

const CHAIN_FACTS = [
  { value: 'HMAC-SHA256', label: 'Row signature' },
  { value: 'RFC 6962', label: 'Merkle proof' },
  { value: '05:30 UTC', label: 'Daily anchor' },
  { value: 'Append-only', label: 'DB trigger + RLS' },
  { value: 'Sigstore Rekor', label: 'External log' },
] as const;

// ── The chain re-walker: a small agent that patrols the cards and, while the
// cursor is over them, follows it and looks at it (pupils track the pointer).
// A literal stand-in for the nightly cron that re-walks the chain. lg-only;
// parked + still under prefers-reduced-motion.
function AuditBoard({ children }: { children: ReactNode }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const board = boardRef.current;
    const bot = botRef.current;
    const pupils = pupilsRef.current;
    if (!board || !bot || !pupils) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bot.style.left = '50%';
      return;
    }

    const st = {
      x: 50,
      target: 50,
      hovering: false,
      t: 0,
      cursorX: 0,
      cursorY: 0,
      px: 0,
      py: 0,
    };
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!st.hovering) {
        st.t += dt;
        st.target = 50 + 32 * Math.sin(st.t * 0.5);
      }
      st.x += (st.target - st.x) * Math.min(1, dt * 6);
      bot.style.left = `${st.x}%`;

      // Eye tracking — pupils ease toward the cursor while hovering.
      const rect = board.getBoundingClientRect();
      const cx = rect.left + (st.x / 100) * rect.width;
      const cy = rect.top;
      let tpx = 0;
      let tpy = 0;
      if (st.hovering) {
        const dx = st.cursorX - cx;
        const dy = st.cursorY - cy;
        const d = Math.hypot(dx, dy) || 1;
        const max = 2.4;
        tpx = (dx / d) * max;
        tpy = Math.max(-1.6, Math.min(2, (dy / d) * max));
      }
      st.px += (tpx - st.px) * Math.min(1, dt * 8);
      st.py += (tpy - st.py) * Math.min(1, dt * 8);
      pupils.setAttribute(
        'transform',
        `translate(${st.px.toFixed(2)} ${st.py.toFixed(2)})`,
      );

      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: MouseEvent) => {
      const rect = board.getBoundingClientRect();
      st.target = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
      st.cursorX = e.clientX;
      st.cursorY = e.clientY;
      if (!st.hovering) {
        st.hovering = true;
        bot.classList.add('audit-bot--awake');
      }
    };
    const onLeave = () => {
      st.hovering = false;
      bot.classList.remove('audit-bot--awake');
    };

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(board);
    board.addEventListener('mousemove', onMove);
    board.addEventListener('mouseleave', onLeave);
    start();

    return () => {
      stop();
      io.disconnect();
      board.removeEventListener('mousemove', onMove);
      board.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={boardRef} className="relative">
      <div className="pointer-events-none absolute -top-5 left-0 right-0 z-20 hidden h-10 lg:block">
        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div ref={botRef} className="audit-bot absolute top-1/2">
          {/* antenna */}
          <span className="absolute left-1/2 -top-2.5 h-2 w-px -translate-x-1/2 bg-white/30" />
          <span className="absolute left-1/2 -top-[13px] h-1.5 w-1.5 -translate-x-1/2 animate-pulse rounded-full bg-white" />
          {/* glow */}
          <span className="audit-bot-glow absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-lg" />
          {/* head */}
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-[#141b2e] to-[#0a0f1d] shadow-lg shadow-black/50">
            <svg viewBox="0 0 44 24" className="h-[18px] w-[34px]">
              <rect x="3" y="3" width="16" height="18" rx="6" fill="#060a13" />
              <rect x="25" y="3" width="16" height="18" rx="6" fill="#060a13" />
              <g ref={pupilsRef}>
                <circle cx="11" cy="12" r="3.1" fill="#e2e8f0" />
                <circle cx="33" cy="12" r="3.1" fill="#e2e8f0" />
              </g>
            </svg>
          </div>
          {/* scan beam */}
          <span className="audit-bot-beam absolute left-1/2 top-full h-10 w-px -translate-x-1/2 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </div>
      {children}
    </div>
  );
}

export function AuditChainSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header — matches the "Operational mechanics" section */}
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Cryptographic audit chain
            </p>
            <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
              Verifiable, not just &ldquo;we have logs&rdquo;
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Every org&apos;s audit log is hash-chained, RLS-locked against
              mutation, and anchored daily to Sigstore Rekor — the same
              append-only transparency log the Linux Foundation runs for signed
              open-source releases.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards + chain re-walker agent */}
        <AuditBoard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <ScrollReveal
                  key={pillar.title}
                  variant="fadeUp"
                  range={[idx * 0.05, 0.3 + idx * 0.05]}
                >
                  <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-white/20">
                    <div className="mb-4 flex items-center gap-2.5">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03]">
                        <Icon
                          className="h-5 w-5 text-slate-300"
                          aria-hidden="true"
                        />
                      </span>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        {pillar.eyebrow}
                      </p>
                    </div>
                    <h3 className="text-base font-semibold text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                      {pillar.body}
                    </p>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </AuditBoard>

        {/* Facts bar — the technical primitives, hairline-divided */}
        <ScrollReveal variant="slideUp" range={[0.1, 0.4]}>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-5">
            {CHAIN_FACTS.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col gap-1 bg-[#070b14] px-5 py-5 transition-colors duration-300 hover:bg-[#0a0f1a]"
              >
                <dt className="order-2 text-xs text-slate-500">{fact.label}</dt>
                <dd className="order-1 font-mono text-sm font-semibold text-white">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </ScrollReveal>

        <div className="mt-10 text-center">
          <Link
            href="/trust"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
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
