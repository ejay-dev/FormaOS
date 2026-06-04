'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight, Bot } from 'lucide-react';

// Mechanic-grounded scenarios. The "after" state names a real artifact
// (table, cron, statutory timeline) so the section reads like a product
// brief, not a customer-success deck.
const proofScenarios = [
  {
    title: 'Audit preparation',
    impact: 'Auditor bundle, on demand',
    before:
      'Evidence scattered across email threads, shared drives, and spreadsheets. Days lost reconstructing trails.',
    after:
      'On-demand ZIP export: framework summary, evidence references with SHA-256 hashes, automation log, score history, chain top anchored to Sigstore Rekor.',
    state: { before: 'Reconstructed by hand', after: 'Hash-chained', tag: 'Verifiable' },
  },
  {
    title: 'Incident response',
    impact: 'Statutory clock, automated',
    before:
      'Email threads, ad-hoc severity tagging, statutory timelines tracked by memory.',
    after:
      'org_incidents writes carry severity classification, named owner, and the NDIS SIRS 24h-immediate / 5-business-day-detailed clock encoded in the predicate.',
    state: { before: 'Tracked by memory', after: 'Encoded in schema', tag: '24h / 5bd' },
  },
  {
    title: 'Compliance posture',
    impact: 'Refreshed nightly',
    before:
      'Manual status reconciliation. Board gets a stale quarterly snapshot. Drift surfaces too late.',
    after:
      'Nightly cron at 06:00 UTC iterates orgs in batches, writes to org_control_evaluations; /app/compliance/health renders the live posture with a 4-week sparkline.',
    state: { before: 'Quarterly snapshot', after: 'Live, nightly', tag: 'Cron-driven' },
  },
] as const;

// Numbers below match lib/compliance/evaluators/register.ts and the
// cron schedule in vercel.json. Any reader can count the imports and
// the cron entries and arrive at the same totals.
const outcomeStats = [
  { value: '8', label: 'Framework packs' },
  { value: '252', label: 'Controls mapped' },
  { value: '102', label: 'Auto-evaluated' },
  { value: '150', label: 'Manual attestations' },
  { value: '16', label: 'Production crons' },
] as const;

type Scenario = (typeof proofScenarios)[number];

// The cards plus an automation "agent" that travels along a track above them , 
// a literal stand-in for the crons/evaluators working the scenarios below.
// It auto-patrols when idle and chases the cursor while the mouse is over the
// board (eased, not 1:1). Monochrome + soft glow to stay on-brand; lg-only (the
// cards are a row there) and parked centred under prefers-reduced-motion.
function ScenarioBoard({ children }: { children: ReactNode }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const board = boardRef.current;
    const bot = botRef.current;
    if (!board || !bot) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bot.style.left = '50%';
      return;
    }

    // x/target are percentages of the board width (clamped to the track).
    const st = { x: 50, target: 50, hovering: false, t: 0 };
    let raf = 0;
    let last = performance.now();
    let visible = true;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!st.hovering) {
        st.t += dt;
        // Smooth idle patrol sweeping between the outer columns.
        st.target = 50 + 34 * Math.sin(st.t * 0.5);
      }
      st.x += (st.target - st.x) * Math.min(1, dt * 6);
      bot.style.left = `${st.x}%`;
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: MouseEvent) => {
      const rect = board.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      st.target = Math.max(8, Math.min(92, pct));
      // Any movement over the board counts as hovering, more reliable than
      // depending on mouseenter firing first.
      if (!st.hovering) {
        st.hovering = true;
        bot.classList.add('outcome-bot--awake');
      }
    };
    const onLeave = () => {
      st.hovering = false;
      bot.classList.remove('outcome-bot--awake');
    };

    // Pause the loop when the board scrolls out of view.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(board);

    board.addEventListener('mousemove', onMove);
    board.addEventListener('mouseleave', onLeave);
    if (visible) start();

    return () => {
      stop();
      io.disconnect();
      board.removeEventListener('mousemove', onMove);
      board.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div ref={boardRef} className="relative">
      <div className="pointer-events-none absolute -top-4 left-0 right-0 z-20 hidden h-8 lg:block">
        <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div ref={botRef} className="outcome-bot absolute top-1/2">
          <span className="outcome-bot-glow absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/10 blur-lg" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#0a0f1a] shadow-lg shadow-black/50">
            <Bot className="h-4 w-4 text-slate-200" />
          </span>
          <span className="outcome-bot-beam absolute left-1/2 top-full h-12 w-px -translate-x-1/2 bg-gradient-to-b from-white/25 to-transparent" />
        </div>
      </div>
      {children}
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-colors duration-300 hover:border-white/20">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{scenario.impact}</p>
        </div>

        {/* Before / After toggle */}
        <div
          role="group"
          aria-label={`${scenario.title}, before or after`}
          className="flex flex-shrink-0 rounded-lg border border-white/10 bg-black/20 p-0.5"
        >
          <button
            type="button"
            onClick={() => setShowAfter(false)}
            aria-pressed={!showAfter}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              showAfter
                ? 'text-slate-500 hover:text-slate-300'
                : 'bg-white/10 text-white'
            }`}
          >
            Before
          </button>
          <button
            type="button"
            onClick={() => setShowAfter(true)}
            aria-pressed={showAfter}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              showAfter
                ? 'bg-white/10 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            After
          </button>
        </div>
      </div>

      {/* Body, swaps with the toggle; min-height keeps the row from jumping */}
      <p
        key={showAfter ? 'after' : 'before'}
        className={`min-h-[7.5rem] animate-[fadeIn_0.25s_ease] text-[0.95rem] leading-relaxed lg:min-h-[8.5rem] ${
          showAfter ? 'text-slate-200' : 'text-slate-400'
        }`}
      >
        {showAfter ? scenario.after : scenario.before}
      </p>

      {/* State line, reflects the active side */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-600">
            {showAfter ? 'With FormaOS' : 'Without'}
          </p>
          <p
            className={`mt-0.5 text-sm font-semibold ${
              showAfter ? 'text-white' : 'text-slate-400'
            }`}
          >
            {showAfter ? scenario.state.after : scenario.state.before}
          </p>
        </div>
        {showAfter && (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-slate-300">
            {scenario.state.tag}
          </span>
        )}
      </div>
    </article>
  );
}

export function OutcomeProofSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-14">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              What ships, what runs
            </p>
            <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">
              Operational mechanics, not customer claims
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
              Every number below comes from the framework registry checked into
              the codebase or the cron schedule running in production. Toggle any
              card to see the shift &mdash; from the manual status quo to the
              actual table, predicate, or statutory clock doing the work.
            </p>
          </div>
        </ScrollReveal>

        <ScenarioBoard>
          <div className="grid gap-4 lg:grid-cols-3">
            {proofScenarios.map((scenario, idx) => (
              <ScrollReveal
                key={scenario.title}
                variant="fadeLeft"
                range={[idx * 0.04, 0.3 + idx * 0.04]}
              >
                <ScenarioCard scenario={scenario} />
              </ScrollReveal>
            ))}
          </div>
        </ScenarioBoard>

        {/* Metrics bar: tabular ledger, hairline-divided */}
        <ScrollReveal variant="slideUp" range={[0.1, 0.4]}>
          <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-5">
            {outcomeStats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 bg-[#070b14] px-6 py-7 transition-colors duration-300 hover:bg-[#0a0f1a]"
              >
                <dt className="order-2 text-xs text-slate-500">{stat.label}</dt>
                <dd className="order-1 font-display text-3xl font-bold tabular-nums text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </ScrollReveal>

        <div className="mt-10 text-center">
          <Link
            href="/customer-stories"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            See all customer outcomes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
