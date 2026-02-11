'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const links = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Product' },
  { href: '/industries', label: 'Industries' },
  { href: '/security', label: 'Security' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
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
    <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium">
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
