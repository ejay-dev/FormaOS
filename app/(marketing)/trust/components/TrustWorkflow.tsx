'use client';

import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Reveal } from '@/components/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const trustWorkflow = [
  {
    step: 'Evaluate',
    detail:
      'Security and procurement teams review architecture, data handling, and governance posture.',
  },
  {
    step: 'Validate',
    detail:
      'Buyer stakeholders verify control ownership, evidence traceability, and operational accountability.',
  },
  {
    step: 'Accelerate',
    detail:
      'Teams move into trial or procurement with fewer blockers and reusable trust artifacts.',
  },
] as const;

export function TrustWorkflow() {
  const graphRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const { scrollYProgress } = useScroll({
    target: graphRef,
    offset: ['start 80%', 'end 20%'],
  });

  const pathA = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const pathB = useTransform(scrollYProgress, [0.2, 0.7], [0, 1]);
  const pathC = useTransform(scrollYProgress, [0.35, 0.9], [0, 1]);
  const graphGlow = useTransform(scrollYProgress, [0, 1], [0.25, 0.65]);

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <Reveal variant="fadeInUp">
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-transparent p-7 backdrop-blur-sm lg:p-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Trust Workflow
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            FormaOS trust artifacts are structured to support enterprise review
            gates from early evaluation through procurement.
          </p>

          <div
            ref={graphRef}
            className="mt-6 rounded-xl border border-cyan-500/20 bg-slate-950/45 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
              <span>Compliance Signal Graph</span>
              <span>Live trust pathways</span>
            </div>
            <motion.div
              className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-slate-950/60 p-3"
              style={{ boxShadow: 'inset 0 0 28px rgba(34,211,238,0.06)' }}
            >
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.16), transparent 68%)',
                  opacity: reducedMotion ? 0.35 : graphGlow,
                }}
              />
              <svg
                viewBox="0 0 640 180"
                className="relative z-10 h-[150px] w-full"
                role="img"
                aria-label="Animated compliance graph connecting trust workflow stages"
              >
                <defs>
                  <linearGradient id="trustPathA" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.1)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0.9)" />
                  </linearGradient>
                  <linearGradient id="trustPathB" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.1)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0.9)" />
                  </linearGradient>
                  <linearGradient id="trustPathC" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(16,185,129,0.1)" />
                    <stop offset="100%" stopColor="rgba(16,185,129,0.9)" />
                  </linearGradient>
                </defs>

                <motion.path
                  d="M80 140 C 160 80, 230 80, 300 95"
                  fill="none"
                  stroke="url(#trustPathA)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ pathLength: reducedMotion ? 1 : pathA }}
                />
                <motion.path
                  d="M300 95 C 360 110, 420 70, 500 90"
                  fill="none"
                  stroke="url(#trustPathB)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ pathLength: reducedMotion ? 1 : pathB }}
                />
                <motion.path
                  d="M500 90 C 540 100, 570 120, 600 55"
                  fill="none"
                  stroke="url(#trustPathC)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ pathLength: reducedMotion ? 1 : pathC }}
                />

                {[
                  { x: 80, y: 140, color: 'rgba(34,211,238,0.9)' },
                  { x: 300, y: 95, color: 'rgba(59,130,246,0.9)' },
                  { x: 500, y: 90, color: 'rgba(16,185,129,0.9)' },
                  { x: 600, y: 55, color: 'rgba(251,191,36,0.95)' },
                ].map((node, index) => (
                  <g key={`${node.x}-${node.y}`}>
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r="4.5"
                      fill={node.color}
                      animate={
                        reducedMotion
                          ? undefined
                          : { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] }
                      }
                      transition={{
                        duration: 2.4,
                        delay: index * 0.25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r="9"
                      fill="transparent"
                      stroke={node.color}
                      strokeWidth="1.2"
                      animate={
                        reducedMotion
                          ? undefined
                          : { scale: [1, 1.55], opacity: [0.4, 0] }
                      }
                      transition={{
                        duration: 2.2,
                        delay: index * 0.3,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  </g>
                ))}
              </svg>
            </motion.div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {trustWorkflow.map((item, i) => (
              <ScrollReveal key={item.step} variant={i % 2 === 0 ? 'fadeUp' : 'fadeLeft'} range={[i * 0.04, 0.3 + i * 0.04]}>
                <article className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                    {item.step}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {item.detail}
                  </p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
