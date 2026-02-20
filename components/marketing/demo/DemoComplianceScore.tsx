'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Shield, FileCheck,
  Users, BookOpen, AlertTriangle,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

/**
 * DemoComplianceScore — Animated compliance score dashboard.
 * Shows overall score with category breakdowns + animated progress bars.
 * Props-driven for different use-case theming.
 */

interface ScoreCategory {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
  items: number;
}

const defaultCategories: ScoreCategory[] = [
  { label: 'Policies', score: 94, icon: BookOpen, items: 32 },
  { label: 'Evidence', score: 87, icon: FileCheck, items: 128 },
  { label: 'Training', score: 91, icon: Users, items: 47 },
  { label: 'Risk Register', score: 78, icon: AlertTriangle, items: 15 },
  { label: 'Controls', score: 96, icon: Shield, items: 64 },
];

function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-amber-400';
  return 'text-red-400';
}

function barColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function barGlow(score: number): string {
  if (score >= 90) return 'shadow-emerald-500/20';
  if (score >= 75) return 'shadow-amber-500/20';
  return 'shadow-red-500/20';
}

interface DemoComplianceScoreProps {
  categories?: ScoreCategory[];
  overallScore?: number;
  glowColor?: string;
  accentColor?: string;
}

export default function DemoComplianceScore({
  categories = defaultCategories,
  overallScore,
  glowColor = 'from-teal-500/15 to-emerald-500/15',
  accentColor = 'teal',
}: DemoComplianceScoreProps) {
  const prefersReducedMotion = useReducedMotion();
  const [animated, setAnimated] = useState(false);

  const computedOverall = overallScore ?? Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length,
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimated(true);
      return;
    }
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  return (
    <div className="relative">
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`} />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-4 sm:p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <BarChart3 className={`h-3.5 w-3.5 text-${accentColor}-400`} />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Compliance Score</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-400 font-medium">
            <TrendingUp className="h-2.5 w-2.5" />
            Audit-Ready
          </div>
        </div>

        {/* Overall Score */}
        <div className="flex items-center gap-4 mb-5">
          <motion.div
            initial={prefersReducedMotion ? undefined : { scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: duration.slow, ease: easing.signature }}
            className="relative"
          >
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-white/[0.08] flex items-center justify-center bg-white/[0.02]">
              <span className={`text-2xl sm:text-3xl font-bold ${scoreColor(computedOverall)}`}>
                {animated ? computedOverall : 0}
              </span>
            </div>
            <div className={`absolute -inset-0.5 rounded-full border-2 ${computedOverall >= 90 ? 'border-emerald-500/30' : computedOverall >= 75 ? 'border-amber-500/30' : 'border-red-500/30'}`} style={{
              clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
            }} />
          </motion.div>
          <div>
            <p className="text-xs font-semibold text-slate-200">Overall Compliance</p>
            <p className="text-[10px] text-slate-500">
              {categories.reduce((sum, c) => sum + c.items, 0)} items across {categories.length} categories
            </p>
            <p className={`text-[10px] font-medium mt-1 ${scoreColor(computedOverall)}`}>
              {computedOverall >= 90 ? 'Excellent' : computedOverall >= 75 ? 'Good — needs attention' : 'At Risk — action required'}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-2.5">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.label}
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: duration.fast, ease: easing.signature, delay: i * 0.06 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3 text-slate-500" />
                    <span className="text-[10px] text-slate-400">{cat.label}</span>
                    <span className="text-[8px] text-slate-600">({cat.items})</span>
                  </div>
                  <span className={`text-[10px] font-semibold ${scoreColor(cat.score)}`}>
                    {animated ? cat.score : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${barColor(cat.score)} shadow-sm ${barGlow(cat.score)}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${cat.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: prefersReducedMotion ? 0 : 1, ease: easing.signature, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
