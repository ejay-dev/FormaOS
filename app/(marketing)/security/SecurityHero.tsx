'use client';

import { Lock, Shield, Eye, FileCheck } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SecurityHeroVisual } from './components/SecurityHeroVisual';

const SECURITY_PILLS = [
  { icon: Lock, label: 'Tenant Isolation' },
  { icon: FileCheck, label: 'Immutable Logs' },
  { icon: Eye, label: 'Evidence Chain' },
];

export function SecurityHero() {
  return (
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
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
            by Design
          </span>
        </>
      }
      subheadline="Audit-grade logging, tenant isolation, and compliance gates engineered for organizations where security and data integrity are regulatory requirements."
      extras={
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
      }
      primaryCta={{ href: '/auth/signup', label: 'Start Free Trial' }}
      secondaryCta={{ href: '/contact', label: 'Security Briefing' }}
    />
  );
}
