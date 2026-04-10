'use client';

import {
  motion,
  useReducedMotion,
  useInView,
  useMotionValue,
  useSpring,
  animate,
} from 'framer-motion';
import { Shield, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface MetricCard {
  label: string;
  value: number;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

interface MockMetricCardsProps {
  cards?: MetricCard[];
  ringValue?: number;
}

const DEFAULT_CARDS: MetricCard[] = [
  {
    label: 'Total Obligations',
    value: 47,
    borderColor: 'border-l-cyan-500',
    icon: Shield,
    iconColor: 'text-cyan-400',
  },
  {
    label: 'Overdue',
    value: 3,
    borderColor: 'border-l-red-500',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
  },
  {
    label: 'Due This Week',
    value: 8,
    borderColor: 'border-l-amber-500',
    icon: Clock,
    iconColor: 'text-amber-400',
  },
  {
    label: 'Completed',
    value: 36,
    borderColor: 'border-l-emerald-500',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
];

/** Animated number that counts up from 0 when entering viewport */
function CountUpValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/** Animated SVG ring that fills on viewport entry */
function AnimatedRing({ value }: { value: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true });
  const circumference = 2 * Math.PI * 14; // r=14
  const target = circumference * (value / 100);
  const dashOffset = useSpring(circumference, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (isInView) {
      dashOffset.set(circumference - target);
    }
  }, [isInView, circumference, target, dashOffset]);

  return (
    <div className="relative w-8 h-8">
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
          ref={ref}
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke="url(#mockRingGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
        <defs>
          <linearGradient id="mockRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4fb" />
            <stop offset="100%" stopColor="#a083ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <CountUpValue
          value={value}
          className="text-[8px] font-bold text-white"
        />
        <span className="text-[5px] text-white/40">%</span>
      </div>
    </div>
  );
}

export function MockMetricCards({
  cards = DEFAULT_CARDS,
  ringValue = 77,
}: MockMetricCardsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-5 gap-2">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            className={`rounded-lg border border-white/[0.08] bg-[#0d1428] p-2 border-l-4 ${card.borderColor}`}
          >
            <Icon className={`w-3 h-3 ${card.iconColor} mb-1`} />
            <div className="text-[6px] uppercase tracking-wider text-white/30 mb-0.5">
              {card.label}
            </div>
            {shouldReduceMotion ? (
              <span className="text-sm font-bold text-white font-mono">
                {card.value}
              </span>
            ) : (
              <CountUpValue
                value={card.value}
                className="text-sm font-bold text-white font-mono"
              />
            )}
          </motion.div>
        );
      })}
      {/* % Ring card */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="rounded-lg border border-white/[0.08] bg-[#0d1428] p-2 flex items-center justify-center"
      >
        {shouldReduceMotion ? (
          <div className="relative w-8 h-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="url(#mockRingGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 14 * (ringValue / 100)} ${2 * Math.PI * 14 * (1 - ringValue / 100)}`}
              />
              <defs>
                <linearGradient
                  id="mockRingGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#00d4fb" />
                  <stop offset="100%" stopColor="#a083ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">
                {ringValue}%
              </span>
            </div>
          </div>
        ) : (
          <AnimatedRing value={ringValue} />
        )}
      </motion.div>
    </div>
  );
}

export default MockMetricCards;
