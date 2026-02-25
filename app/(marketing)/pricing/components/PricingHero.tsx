'use client';

import Link from 'next/link';
import { Check, DollarSign } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { PricingHeroVisual } from './PricingHeroVisual';

export function PricingHero() {
  return (
    <ImmersiveHero
      theme="pricing"
      visualContent={<PricingHeroVisual />}
      badge={{
        icon: <DollarSign className="w-4 h-4 text-violet-400" />,
        text: 'Transparent Pricing',
        colorClass: 'violet',
      }}
      headline={
        <>
          Compliance Infrastructure,
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Scaled to Your Organization
          </span>
        </>
      }
      subheadline={
        <>
          FormaOS is not a productivity tool.
          <br />
          It is a compliance operating system.
        </>
      }
      extras={<PricingExtras />}
      primaryCta={{ href: '/auth/signup', label: 'Start Free Trial', testId: 'pricing-hero-start-trial' }}
      secondaryCta={{ href: '/contact', label: 'Contact Sales' }}
    />
  );
}

function PricingExtras() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-base text-gray-500 max-w-2xl mx-auto text-center leading-relaxed">
        Our pricing reflects the level of governance, automation, and regulatory accountability
        your organization requires, from foundational process tracking to enterprise-wide audit
        infrastructure.
      </p>
      <p className="text-xs text-gray-500 max-w-2xl mx-auto text-center">
        Used by compliance teams. Aligned to ISO/SOC frameworks. Built for audit defensibility.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          Clear feature tiers
        </span>
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          Transparent entitlements
        </span>
        <span className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          Upgrade any time
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1">
          Security review packet
        </span>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1">
          No setup fee
        </span>
        <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
          14-day trial
        </span>
      </div>
      <Link
        href="/security-review"
        className="text-sm font-medium text-cyan-300 underline decoration-cyan-500/60 underline-offset-4 hover:text-cyan-200"
      >
        Review procurement security packet
      </Link>
    </div>
  );
}
