'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { TrustHeroVisual } from './TrustHeroVisual';

export function TrustHero() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <ImmersiveHero
      theme="trust"
      visualContent={<TrustHeroVisual />}
      badge={{
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        text: 'Trust Center',
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
      subheadline="Controlled visibility into live compliance posture, evidence integrity, encryption, SSO, data residency, and procurement artifacts for enterprise buyers."
      extras={
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <Link
            href="/security"
            onClick={() =>
              trackCtaClick({
                surface: 'trust',
                section: 'hero',
                location: 'security_page',
                ctaLabel: 'Review security posture',
                ctaHref: '/security',
                variant: 'resource',
              })
            }
            className="font-medium text-emerald-300 underline decoration-emerald-500/60 underline-offset-4 hover:text-emerald-200"
          >
            Review security posture
          </Link>
          <Link
            href="/pricing"
            onClick={() =>
              trackCtaClick({
                surface: 'trust',
                section: 'hero',
                location: 'pricing',
                ctaLabel: 'See pricing',
                ctaHref: '/pricing',
                variant: 'resource',
              })
            }
            className="font-medium text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white"
          >
            See pricing
          </Link>
          <Link
            href="/compare"
            onClick={() =>
              trackCtaClick({
                surface: 'trust',
                section: 'hero',
                location: 'compare',
                ctaLabel: 'Compare FormaOS',
                ctaHref: '/compare',
                variant: 'resource',
              })
            }
            className="font-medium text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white"
          >
            Compare FormaOS
          </Link>
        </div>
      }
      primaryCta={{ href: '/auth/signup?source=trust_center', label: 'Start Trust-Ready Trial' }}
      secondaryCta={{ href: '/contact', label: 'Security Walkthrough' }}
      onPrimaryCtaClick={() =>
        trackCtaClick({
          surface: 'trust',
          section: 'hero',
          location: 'hero_primary',
          ctaLabel: 'Start Trust-Ready Trial',
          ctaHref: '/auth/signup?source=trust_center',
          variant: 'primary',
        })
      }
      onSecondaryCtaClick={() =>
        trackCtaClick({
          surface: 'trust',
          section: 'hero',
          location: 'hero_secondary',
          ctaLabel: 'Security Walkthrough',
          ctaHref: '/contact',
          variant: 'secondary',
        })
      }
    />
  );
}
