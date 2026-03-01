'use client';

import { Building2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { IndustriesHeroVisual } from './IndustriesHeroVisual';
import { useDeviceTier } from '@/lib/device-tier';

const VERTICALS = [
  { label: 'NDIS', color: 'bg-pink-400' },
  { label: 'Health', color: 'bg-blue-400' },
  { label: 'Finance', color: 'bg-amber-400' },
  { label: 'Gov', color: 'bg-emerald-400' },
];

const PILLS = [
  { color: 'bg-pink-400', label: 'NDIS & Aged Care' },
  { color: 'bg-blue-400', label: 'Healthcare & Allied Health' },
  { color: 'bg-amber-400', label: 'Financial Services' },
  { color: 'bg-emerald-400', label: 'Education & Childcare' },
  { color: 'bg-orange-400', label: 'Construction & Infrastructure' },
];

export function IndustriesHero() {
  return (
    <ImmersiveHero
      theme="industries"
      visualContent={<IndustriesHeroVisual />}
      badge={{
        icon: <Building2 className="w-4 h-4 text-blue-400" />,
        text: 'Industry Solutions',
        colorClass: 'blue',
      }}
      headline={
        <>
          One OS. Multiple
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            Regulatory Frameworks.
          </span>
        </>
      }
      subheadline="FormaOS adapts to your industry's regulatory requirements — NDIS, AHPRA, NSQHS, ASIC, AUSTRAC, WHS, NQF. Pre-built frameworks. System-enforced controls. Evidence that regulators, auditors, and procurement teams trust."
      extras={<IndustriesExtras />}
      primaryCta={{ href: '/auth/signup', label: 'Start Free Trial' }}
      secondaryCta={{ href: '/contact', label: 'Request Demo' }}
    />
  );
}

function IndustriesExtras() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const allowAmbientMotion =
    !shouldReduceMotion && tierConfig.tier === 'high' && !tierConfig.isTouch;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="text-sm text-gray-500 mb-3">
        5 regulated industries covered — from NDIS Commission to ASIC and AHPRA
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
        {PILLS.map((pill) => (
          <span
            key={pill.label}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pill.color}`} />
            {pill.label}
          </span>
        ))}
      </div>

      {/* Industry pulse signature */}
      <div className="mt-5 flex items-end justify-center gap-6">
        {VERTICALS.map((vertical, index) => (
          <div key={vertical.label} className="flex flex-col items-center gap-2">
            <div className="relative h-12 w-px bg-white/15 overflow-visible">
              <motion.span
                className={`absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 rounded-full ${vertical.color}`}
                animate={
                  !allowAmbientMotion
                    ? undefined
                    : { y: [0, -36, 0], opacity: [0.5, 1, 0.5], scale: [0.9, 1.2, 0.9] }
                }
                transition={
                  allowAmbientMotion
                    ? {
                        duration: 2.8,
                        delay: index * 0.25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }
                    : undefined
                }
              />
            </div>
            <span className="text-[11px] uppercase tracking-wider text-gray-500">
              {vertical.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default IndustriesHero;
