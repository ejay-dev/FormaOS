'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MobileMoreSheet } from './more-sheet';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Pathname prefixes that should highlight this item as active. */
  matches: string[];
};

// Five-slot bottom nav. Slot 5 is "More" — opens the polished drawer for
// every other surface (incidents, visits, forms, billing, settings, admin)
// so the bar stays uncluttered while preserving deep navigation.
const ITEMS: NavItem[] = [
  {
    href: '/app',
    label: 'Home',
    Icon: LayoutDashboard,
    matches: ['/app$', '/app/dashboard'],
  },
  {
    href: '/app/participants',
    label: 'Care',
    Icon: Users,
    matches: [
      '/app/participants',
      '/app/care-plans',
      '/app/patients',
      '/app/visits',
      '/app/progress-notes',
    ],
  },
  {
    href: '/app/vault',
    label: 'Vault',
    Icon: ShieldCheck,
    matches: ['/app/vault', '/app/evidence'],
  },
  {
    href: '/app/compliance',
    label: 'Compliance',
    Icon: ShieldCheck,
    matches: ['/app/compliance', '/app/controls', '/app/audit-trail', '/app/audit-trail'],
  },
];

function isActive(item: NavItem, pathname: string) {
  return item.matches.some((pattern) =>
    pattern.endsWith('$')
      ? pathname === pattern.slice(0, -1)
      : pathname === pattern || pathname.startsWith(`${pattern}/`),
  );
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? '/app';
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'md:hidden fixed inset-x-0 bottom-0 z-40',
          // Soft glass panel + safe-area-aware padding. The blur + tint
          // matches the rest of the app shell.
          'border-t border-border/70 bg-background/85 backdrop-blur-xl',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <ul className="grid grid-cols-5 items-stretch text-[10px] font-semibold tracking-wide">
          {ITEMS.map((item) => {
            const active = isActive(item, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 min-h-[44px] flex-col items-center justify-center gap-1',
                    'transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground/80',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-all',
                      active
                        ? 'bg-foreground/10 shadow-[inset_0_0_0_1px_hsl(var(--border))]'
                        : 'bg-transparent',
                    )}
                  >
                    <item.Icon
                      className={cn(
                        'h-[18px] w-[18px]',
                        active ? 'opacity-100' : 'opacity-80',
                      )}
                    />
                  </span>
                  <span className="leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-label="Open more navigation"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={cn(
                'flex h-14 min-h-[44px] w-full flex-col items-center justify-center gap-1',
                'text-muted-foreground hover:text-foreground/80 transition-colors',
              )}
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full">
                <Menu className="h-[18px] w-[18px] opacity-80" />
              </span>
              <span className="leading-none">More</span>
            </button>
          </li>
        </ul>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
