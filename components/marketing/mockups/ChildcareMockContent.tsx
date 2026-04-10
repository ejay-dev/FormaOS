'use client';

import { motion, useReducedMotion, useInView, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface QualityArea {
  label: string;
  short: string;
  pct: number;
}

const NQF_AREAS: QualityArea[] = [
  { label: 'QA1: Educational Program', short: 'QA1', pct: 78 },
  { label: "QA2: Children's Health", short: 'QA2', pct: 92 },
  { label: 'QA3: Physical Environment', short: 'QA3', pct: 85 },
  { label: 'QA4: Staffing Arrangements', short: 'QA4', pct: 71 },
  { label: 'QA5: Relationships with Children', short: 'QA5', pct: 88 },
  { label: 'QA6: Collaborative Partnerships', short: 'QA6', pct: 65 },
  { label: 'QA7: Governance & Leadership', short: 'QA7', pct: 79 },
];

const OVERALL = 79.7;

function barColor(pct: number): string {
  if (pct >= 85) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

function barTextColor(pct: number): string {
  if (pct >= 85) return 'text-emerald-400';
  if (pct >= 70) return 'text-amber-400';
  return 'text-red-400';
}

/** Count-up integer display */
function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {display}%
    </span>
  );
}

/** Count-up decimal display */
function CountUpDecimal({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true });
  const [display, setDisplay] = useState('0.0');

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v.toFixed(1)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {display}%
    </span>
  );
}

export function ChildcareMockContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex-1 overflow-hidden p-3 space-y-3 bg-[#0a0f1e]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-wider font-bold text-white/30">
          NQF Quality Areas
        </span>
        <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[7px] font-medium text-cyan-400">
          ACECQA NQF
        </span>
      </div>

      {/* Quality area bars */}
      <div className="rounded-lg border border-white/[0.08] bg-[#0d1428] p-3 space-y-2">
        {NQF_AREAS.map((area, i) => (
          <motion.div
            key={area.short}
            initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            className="space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-white/50 truncate">
                {area.label}
              </span>
              {shouldReduceMotion ? (
                <span
                  className={`text-[8px] font-bold font-mono ${barTextColor(area.pct)}`}
                >
                  {area.pct}%
                </span>
              ) : (
                <CountUp
                  value={area.pct}
                  className={`text-[8px] font-bold font-mono ${barTextColor(area.pct)}`}
                />
              )}
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor(area.pct)}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${area.pct}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  delay: 0.4 + i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall score with mini ring */}
      <div className="rounded-lg border border-white/[0.08] bg-[#0d1428] p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[7px] uppercase tracking-wider font-bold text-white/30">
            Overall Rating
          </span>
          <span className="text-[10px] font-bold text-amber-400">
            Meeting NQS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Mini SVG ring */}
          <div className="relative w-5 h-5">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="url(#childcareRingGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 14}
                initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                whileInView={{
                  strokeDashoffset: 2 * Math.PI * 14 * (1 - OVERALL / 100),
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 1,
                  delay: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
              <defs>
                <linearGradient
                  id="childcareRingGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {shouldReduceMotion ? (
            <span className="text-[8px] font-mono text-white/40">
              {OVERALL}%
            </span>
          ) : (
            <CountUpDecimal
              value={OVERALL}
              className="text-[8px] font-mono text-white/40"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ChildcareMockContent;
