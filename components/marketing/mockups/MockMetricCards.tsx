'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Shield, AlertTriangle, Clock, CheckCircle2, Activity } from 'lucide-react';

interface MetricCard {
  label: string;
  value: string | number;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

interface MockMetricCardsProps {
  cards?: MetricCard[];
}

const DEFAULT_CARDS: MetricCard[] = [
  { label: 'Total Obligations', value: 47, borderColor: 'border-l-cyan-500', icon: Shield, iconColor: 'text-cyan-400' },
  { label: 'Overdue', value: 3, borderColor: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
  { label: 'Due This Week', value: 8, borderColor: 'border-l-amber-500', icon: Clock, iconColor: 'text-amber-400' },
  { label: 'Completed', value: 36, borderColor: 'border-l-emerald-500', icon: CheckCircle2, iconColor: 'text-emerald-400' },
];

export function MockMetricCards({ cards = DEFAULT_CARDS }: MockMetricCardsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-4 gap-2">
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
            <div className="text-sm font-bold text-white font-mono">{card.value}</div>
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
        <div className="relative w-8 h-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke="url(#mockRingGrad)" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${76.6 * 0.77} ${76.6 * 0.23}`}
            />
            <defs>
              <linearGradient id="mockRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d4fb" />
                <stop offset="100%" stopColor="#a083ff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">77%</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MockMetricCards;
