'use client';

import { BookOpen, Search, Rocket, Code, Shield, Zap } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { DocsHeroVisual } from './DocsHeroVisual';

const quickLinks = [
  {
    title: 'Quick Start',
    description: 'Get running in 15 minutes',
    icon: Rocket,
    href: '#getting-started',
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: Code,
    href: '#integrations',
  },
  {
    title: 'Security Docs',
    description: 'Enterprise security details',
    icon: Shield,
    href: '#security',
  },
  {
    title: 'Troubleshooting',
    description: 'Solve common issues',
    icon: Zap,
    href: '#support',
  },
];

function DocsHeroExtras() {
  return (
    <>
      {/* Search bar */}
      <div className="w-full max-w-xl mx-auto mb-10 relative">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-sm text-lg"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-white/[0.06] px-2 py-1 rounded-md border border-white/[0.1]">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.title}
              href={link.href}
              className="group flex flex-col items-center text-center p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 hover:bg-white/[0.06] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                {link.title}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {link.description}
              </span>
            </a>
          );
        })}
      </div>
    </>
  );
}

export function DocsHero() {
  return (
    <ImmersiveHero
      theme="docs"
      visualContent={<DocsHeroVisual />}
      badge={{
        icon: <BookOpen className="w-4 h-4" />,
        text: 'Knowledge Base',
      }}
      headline={
        <>
          FormaOS{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Documentation
          </span>
        </>
      }
      subheadline="Comprehensive guides, tutorials, and API references to help you master the compliance operating system."
      extras={<DocsHeroExtras />}
      primaryCta={{ href: '#getting-started', label: 'Get Started' }}
    />
  );
}
