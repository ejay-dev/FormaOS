'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { easing, duration } from '@/config/motion';

const links = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Product' },
  { href: '/industries', label: 'Industries' },
  { href: '/security', label: 'Security' },
  { href: '/trust', label: 'Trust' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const outcomeLinks = [
  { href: '/evaluate', label: 'Evaluate' },
  { href: '/prove', label: 'Prove' },
  { href: '/operate', label: 'Operate' },
  { href: '/govern', label: 'Govern' },
];

const resourceLinks = [
  { href: '/security-review', label: 'Security Review Packet' },
  { href: '/frameworks', label: 'Framework Coverage' },
  { href: '/customer-stories', label: 'Customer Stories' },
  { href: '/compare', label: 'Compare' },
  { href: '/docs', label: 'Documentation' },
];

interface NavLinksProps {
  variant?: 'desktop' | 'mobile';
  onLinkClick?: () => void;
}

export function NavLinks({ variant = 'desktop', onLinkClick }: NavLinksProps) {
  const pathname = usePathname() || '/';

  if (variant === 'mobile') {
    return (
      <div className="text-sm space-y-1">
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          Outcome Journeys
        </div>
        {outcomeLinks.map((l, idx) => {
          const isActive = pathname === l.href;
          return (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: idx * 0.05,
                duration: duration.fast,
                ease: easing.signature,
              }}
            >
              <Link
                href={l.href}
                onClick={onLinkClick}
                className={clsx(
                  'block rounded-xl px-4 py-3 transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </motion.div>
          );
        })}
        <div className="mx-4 my-2 h-px bg-white/10" />
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          Resources
        </div>
        {resourceLinks.map((l, idx) => {
          const isActive = pathname === l.href;
          return (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: idx * 0.05,
                duration: duration.fast,
                ease: easing.signature,
              }}
            >
              <Link
                href={l.href}
                onClick={onLinkClick}
                className={clsx(
                  'block rounded-xl px-4 py-3 transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </motion.div>
          );
        })}
        <div className="mx-4 my-2 h-px bg-white/10" />
        {links.map((l, idx) => {
          const isActive = pathname === l.href;
          return (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: idx * 0.05,
                duration: duration.fast,
                ease: easing.signature,
              }}
            >
              <Link
                href={l.href}
                onClick={onLinkClick}
                className={clsx(
                  'block rounded-xl px-4 py-3 transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium">
      <details className="group relative">
        <summary className="mk-nav-link flex list-none cursor-pointer items-center gap-1.5 text-gray-300 transition-colors hover:text-white">
          Outcomes
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 top-8 z-50 w-48 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
          {outcomeLinks.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-200'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </details>
      <details className="group relative">
        <summary className="mk-nav-link flex list-none cursor-pointer items-center gap-1.5 text-gray-300 transition-colors hover:text-white">
          Resources
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 top-8 z-50 w-56 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
          {resourceLinks.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'block rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-200'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </details>
      {links.map((l) => {
        const isActive = pathname === l.href;
        return (
          <motion.div
            key={l.href}
            whileHover={{ y: -1 }}
            transition={{
              duration: duration.fast,
              ease: easing.signature,
            }}
          >
            <Link
              href={l.href}
              className={clsx(
                'mk-nav-link text-gray-300 transition-colors',
                isActive && 'text-white',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {l.label}
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
