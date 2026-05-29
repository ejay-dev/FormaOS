'use client';

import Link from 'next/link';
import { ArrowUpRight, Lock, Shield, Eye, FileCheck, Key } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SecurityHeroVisual } from './components/SecurityHeroVisual';
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  compliancePlanHref,
  PUBLIC_CTA_LABELS,
  securityReviewHref,
} from '@/lib/marketing/cta';

const SECURITY_PILLS = [
  { icon: Lock, label: 'AES-256 + TLS 1.3' },
  { icon: FileCheck, label: 'Tamper-Evident Logs' },
  { icon: Eye, label: 'Chain of Custody' },
  { icon: Key, label: 'SAML 2.0 SSO' },
];

export function SecurityHero() {
  return (
    <div className="relative isolate overflow-hidden">
      <SectionMedia src="/marketing-media/security.jpg" objectPosition="50% 35%" opacity={0.85} scrim="center" />
    <ImmersiveHero
      theme="security"
      visualContent={<SecurityHeroVisual />}
      badge={{
        icon: <Shield className="w-4 h-4 text-cyan-400" />,
        text: 'Security Architecture',
        colorClass: 'cyan',
      }}
      headline={
        <>
          Enterprise Security
          <br />
          <span className="text-foreground">
            by Design
          </span>
        </>
      }
      subheadline="AES-256 encryption, SAML 2.0 SSO, tamper-evident audit logs, and compliance workflow gates - built for organizations where a breach is a regulatory event."
      extras={
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            {SECURITY_PILLS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {/*
            Audit row #31: "Tamper-Evident Logs" and "Chain of Custody"
            are strong technical claims. Buyers want to know what
            algorithm/anchor backs them. The detailed model lives at
            /trust/data-handling. Inline link makes the buyer
            one-click away from the substantive explanation instead
            of leaving them with a pill they have to trust.
          */}
          <Link
            href="/trust/data-handling"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-300/80 hover:text-cyan-200 transition"
          >
            How tamper-evident logging + chain of custody works
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      }
      primaryCta={{
        href: compliancePlanHref('security_hero'),
        label: PUBLIC_CTA_LABELS.compliancePlan,
      }}
      secondaryCta={{
        href: securityReviewHref('security_hero'),
        label: PUBLIC_CTA_LABELS.securityReview,
      }}
    />
    </div>
  );
}
