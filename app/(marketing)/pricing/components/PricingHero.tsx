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
          Not a productivity tool. Not a document repository.
          <br />
          A compliance operating system — priced for regulated accountability.
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
    <div className="flex flex-col items-center gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full text-sm">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="block font-semibold text-white text-sm">No lock-in</span>
            <span className="text-xs text-slate-400">Upgrade, downgrade, or exit on your terms</span>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="block font-semibold text-white text-sm">Enterprise-ready</span>
            <span className="text-xs text-slate-400">SSO, SAML, audit export, and data residency controls</span>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="block font-semibold text-white text-sm">Procurement support</span>
            <span className="text-xs text-slate-400">Security review packet, DPA, and vendor assurance docs</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1">
          Security review packet
        </span>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1">
          No setup fee
        </span>
        <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
          14-day trial included
        </span>
        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1">
          Invoice billing available
        </span>
      </div>
      <Link
        href="/security-review"
        className="text-sm font-medium text-cyan-300 underline decoration-cyan-500/60 underline-offset-4 hover:text-cyan-200"
      >
        Review procurement and security packet →
      </Link>
    </div>
  );
}
