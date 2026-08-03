'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, History, Menu } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  getIndustryNavigation,
  STAFF_NAV,
  type NavItem,
} from '@/lib/navigation/industry-sidebar';
import {
  MobileMoreSheet,
  type MoreSheetGroup,
  type MoreSheetItem,
} from './more-sheet';

/**
 * Four routed slots plus More. Both halves are built from the same
 * getIndustryNavigation() result the desktop sidebar renders, so labels,
 * targets and availability match the sidebar by construction: an aged-care
 * organisation gets "Residents", a financial-services one never sees a care
 * route at all, and a staff-role user gets the restricted staff nav. The
 * sheet then adds sub-nav routes and the cross-industry tail below, which
 * the desktop reaches through expansion and the user menu.
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

/**
 * Routes no industry sidebar carries as a top-level entry. On desktop they
 * hang off the user menu; on a phone the sheet is the only place they can
 * live, and the audit trail in particular had no other mobile entry point in
 * any care navigation.
 */
const CROSS_INDUSTRY_TAIL: (MoreSheetItem & { category: string })[] = [
  {
    href: '/app/audit-trail',
    label: 'Audit Trail',
    Icon: History,
    category: 'Intelligence',
  },
  {
    href: '/app/billing',
    label: 'Billing',
    Icon: CreditCard,
    category: 'Account',
  },
];

function buildMoreGroups(
  navigation: NavItem[],
  primaryHrefs: Set<string>,
  includeTail: boolean,
): MoreSheetGroup[] {
  const groups: MoreSheetGroup[] = [];
  const seen = new Set(primaryHrefs);

  const push = (category: string, item: MoreSheetItem) => {
    if (seen.has(item.href)) return;
    seen.add(item.href);
    let group = groups.find((g) => g.label === category);
    if (!group) {
      group = { label: category, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  };

  for (const item of navigation) {
    push(item.category, { href: item.href, label: item.name, Icon: item.icon });
    // Sub-nav routes only surface on desktop while their parent is expanded,
    // so the sheet is their sole mobile entry point — including when the
    // parent itself holds a primary slot and is skipped above.
    for (const child of item.children ?? []) {
      push(item.category, {
        href: child.href,
        label: `${item.name} · ${child.name}`,
        Icon: item.icon,
      });
    }
  }

  if (includeTail) {
    for (const { category, ...item } of CROSS_INDUSTRY_TAIL) {
      push(category, item);
    }
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
    // Restricted roles get STAFF_NAV back verbatim; comparing identity keeps
    // the list of those roles in the resolver rather than duplicated here.
    const restricted = navigation === STAFF_NAV;
    return {
      primary: selected,
      moreGroups: buildMoreGroups(navigation, primaryHrefs, !restricted),
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
