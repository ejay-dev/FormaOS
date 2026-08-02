'use client';

import Link from 'next/link';
import { BookOpen, Code, Shield, Scale, Activity } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { DocsHeroVisual } from './DocsHeroVisual';

const quickLinks = [
  {
    title: 'API reference',
    description: 'Endpoints, scopes, and the OpenAPI spec',
    icon: Code,
    href: '/documentation/api',
  },
  {
    title: 'Security',
    description: 'Encryption, isolation, and audit integrity',
    icon: Shield,
    href: '/security',
  },
  {
    title: 'Trust Center',
    description: 'DPA, sub-processors, SLA, and incidents',
    icon: Scale,
    href: '/trust',
  },
  {
    title: 'Platform status',
    description: 'Live subsystem health checks',
    icon: Activity,
    href: '/status',
  },
];

function DocsHeroExtras() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
      {quickLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.title}
            href={link.href}
            className="group flex flex-col items-center text-center p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-2">
              <Icon className="w-5 h-5 text-slate-300" />
            </div>
            <span className="text-sm font-medium text-white group-hover:text-slate-200 transition-colors">
              {link.title}
            </span>
            <span className="text-xs text-slate-500 mt-1">
              {link.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function DocsHero() {
  return (
    <ImmersiveHero
      theme="docs"
      visualContent={<DocsHeroVisual />}
      badge={{
        icon: <BookOpen className="w-4 h-4" />,
        text: 'Documentation',
      }}
      headline={
        <>
          FormaOS{' '}
          <span className="text-slate-400">
            Documentation
          </span>
        </>
      }
      subheadline="The API reference, the security and procurement documents, and the operational pages, indexed in one place."
      extras={<DocsHeroExtras />}
      primaryCta={{ href: '/documentation/api', label: 'Open the API reference' }}
    />
  );
}
