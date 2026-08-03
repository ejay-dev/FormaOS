'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  getIndustryNavigation,
  type NavItem,
} from '@/lib/navigation/industry-sidebar';
import { MobileMoreSheet, type MoreSheetGroup } from './more-sheet';

/**
 * Four routed slots plus More. Both halves are built from the same
 * getIndustryNavigation() result the desktop sidebar renders, so labels,
 * targets and availability match the sidebar by construction: an aged-care
 * organisation gets "Residents", a financial-services one never sees a care
 * route at all, and a staff-role user gets the restricted staff nav.
 */
const PRIMARY_SLOTS = 4;

/**
 * What a worker reaches for while out on a shift, in preference order.
 * Only entries the resolved navigation actually contains are used, so an
 * industry without care operations simply falls through to its own nav
 * order rather than being offered routes it does not have.
 */
const FIELD_PRIORITY = [
  '/app/participants',
  '/app/visits',
  '/app/incidents',
  '/app/progress-notes',
];

function selectPrimary(navigation: NavItem[]): NavItem[] {
  const primary: NavItem[] = [];
  const taken = new Set<string>();

  const take = (item: NavItem | undefined) => {
    if (!item || taken.has(item.href) || primary.length >= PRIMARY_SLOTS)
      return;
    primary.push(item);
    taken.add(item.href);
  };

  // Slot one is whatever the navigation calls home.
  take(navigation[0]);

  for (const href of FIELD_PRIORITY) {
    take(navigation.find((item) => item.href === href));
  }

  for (const item of navigation) {
    take(item);
  }

  return primary;
}

function buildMoreGroups(
  navigation: NavItem[],
  primaryHrefs: Set<string>,
): MoreSheetGroup[] {
  const groups: MoreSheetGroup[] = [];

  for (const item of navigation) {
    if (primaryHrefs.has(item.href)) continue;
    let group = groups.find((g) => g.label === item.category);
    if (!group) {
      group = { label: item.category, items: [] };
      groups.push(group);
    }
    group.items.push({ href: item.href, label: item.name, Icon: item.icon });
  }

  return groups;
}

function isActive(href: string, pathname: string) {
  // The dashboard would otherwise claim every route beneath /app.
  if (href === '/app') {
    return pathname === '/app' || pathname === '/app/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav({
  industry,
  role,
}: {
  industry: string | null;
  role: string;
}) {
  const pathname = usePathname() ?? '/app';
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  const { primary, moreGroups } = useMemo(() => {
    const { navigation } = getIndustryNavigation(industry, role);
    const selected = selectPrimary(navigation);
    const primaryHrefs = new Set(selected.map((item) => item.href));
    return {
      primary: selected,
      moreGroups: buildMoreGroups(navigation, primaryHrefs),
    };
  }, [industry, role]);

  const onPrimaryRoute = primary.some((item) => isActive(item.href, pathname));

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'md:hidden fixed inset-x-0 bottom-0 z-40',
          'border-t border-border bg-background',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <ul className="grid grid-cols-5 items-stretch">
          {primary.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 flex-col items-center justify-center gap-1 px-1',
                    'transition-colors',
                    // Inset rule rather than a border: it echoes the active
                    // edge on the desktop sidebar without shifting the row
                    // by two pixels as tabs change.
                    active
                      ? 'text-foreground shadow-[inset_0_2px_0_0_hsl(var(--primary))]'
                      : 'text-muted-foreground',
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight">
                    {item.name}
                  </span>
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
                'flex h-14 w-full flex-col items-center justify-center gap-1 px-1',
                'transition-colors',
                // The current route lives in the sheet when no slot claims it.
                !onPrimaryRoute
                  ? 'text-foreground shadow-[inset_0_2px_0_0_hsl(var(--primary))]'
                  : 'text-muted-foreground',
              )}
            >
              <Menu className="h-[18px] w-[18px] shrink-0" />
              <span className="text-[11px] font-medium leading-tight">
                More
              </span>
            </button>
          </li>
        </ul>
      </nav>
      <MobileMoreSheet
        open={moreOpen}
        onClose={closeMore}
        groups={moreGroups}
      />
    </>
  );
}
