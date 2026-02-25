'use client';

import { ShieldCheck } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { TrustHeroVisual } from './TrustHeroVisual';

export function TrustHero() {
  return (
    <ImmersiveHero
      theme="trust"
      visualContent={<TrustHeroVisual />}
      badge={{
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        text: 'Trust-as-Revenue',
        colorClass: 'emerald',
      }}
      headline={
        <>
          Enterprise Trust Center
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            for Faster Security Reviews
          </span>
        </>
      }
      subheadline="FormaOS gives customers and auditors controlled visibility into live compliance posture, evidence integrity, and security governance artifacts."
      primaryCta={{ href: '/auth/signup?source=trust_center', label: 'Start Trust-Ready Trial' }}
      secondaryCta={{ href: '/contact', label: 'Request Security Review Walkthrough' }}
    />
  );
}
