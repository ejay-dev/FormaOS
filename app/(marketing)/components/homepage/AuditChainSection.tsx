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

      // Eye tracking, pupils ease toward the cursor while hovering.
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
          {/* glow */}
          <span className="audit-bot-glow absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-lg" />
          {/* robot */}
          <svg
            viewBox="0 0 48 56"
            className="relative h-[52px] w-[44px] drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="audit-bot-head" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1b2438" />
                <stop offset="100%" stopColor="#0a0f1d" />
              </linearGradient>
              <radialGradient id="audit-bot-eye" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#9fb4d6" />
              </radialGradient>
            </defs>

            {/* antenna */}
            <line x1="24" y1="11" x2="24" y2="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="24" cy="3.6" r="2.2" fill="#ffffff" className="animate-pulse" />

            {/* side ears */}
            <rect x="2.5" y="27" width="4" height="11" rx="2" fill="#26304a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" />
            <rect x="41.5" y="27" width="4" height="11" rx="2" fill="#26304a" stroke="rgba(255,255,255,0.1)" strokeWidth="0.75" />

            {/* head casing */}
            <rect x="7" y="11" width="34" height="38" rx="12" fill="url(#audit-bot-head)" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
            {/* top highlight */}
            <rect x="12" y="14" width="24" height="7" rx="5" fill="rgba(255,255,255,0.06)" />

            {/* face screen */}
            <rect x="11" y="19.5" width="26" height="19" rx="8" fill="#05080f" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* eyes (blink) → pupils (cursor tracking) */}
            <g className="audit-bot-eyes">
              <g ref={pupilsRef}>
                <circle cx="19" cy="28.5" r="5" fill="#ffffff" opacity="0.14" />
                <circle cx="29" cy="28.5" r="5" fill="#ffffff" opacity="0.14" />
                <circle cx="19" cy="28.5" r="3.2" fill="url(#audit-bot-eye)" />
                <circle cx="29" cy="28.5" r="3.2" fill="url(#audit-bot-eye)" />
              </g>
            </g>

            {/* mouth grille */}
            <g stroke="rgba(255,255,255,0.22)" strokeWidth="1.3" strokeLinecap="round">
              <line x1="20.5" y1="43" x2="20.5" y2="45.6" />
              <line x1="24" y1="43" x2="24" y2="45.6" />
              <line x1="27.5" y1="43" x2="27.5" y2="45.6" />
            </g>
          </svg>
          {/* scan beam */}
          <span className="audit-bot-beam absolute left-1/2 top-full h-9 w-px -translate-x-1/2 bg-gradient-to-b from-white/25 to-transparent" />
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
        {/* Header, matches the "Operational mechanics" section */}
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
              mutation, and anchored daily to Sigstore Rekor, the same
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
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon
                        className="h-5 w-5 text-slate-300"
                        aria-hidden="true"
                      />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-slate-500">
                      {pillar.tag}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                      {pillar.body}
                    </p>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </AuditBoard>

        {/* Facts bar, the technical primitives, hairline-divided */}
        <ScrollReveal variant="slideUp" range={[0.1, 0.4]}>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-5">
            {CHAIN_FACTS.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-col gap-1 bg-[#070b14] px-5 py-5 transition-colors duration-300 hover:bg-[#0a0f1a]"
              >
                <dt className="order-2 text-xs text-slate-500">{fact.label}</dt>
                <dd className="order-1 text-[15px] font-semibold text-white">
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
