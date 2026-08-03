'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { signOut } from '@/app/app/actions/logout';
import { LogOut, Command, Shield, ChevronRight } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Button from './ui/button';
import { Avatar } from './ui/avatar-stack';
import { useCurrentUserAvatar } from '@/lib/users/use-current-user-avatar';
import { useAppStore } from '@/lib/stores/app';
import { markSidebarRouteTransition } from '@/lib/monitoring/route-transition';
import {
  getIndustryNavigation,
  type NavItem,
} from '@/lib/navigation/industry-sidebar';
import { useComplianceStore } from '@/lib/stores/compliance';
import { useOnboarding } from '@/lib/onboarding/onboarding-context';

type ContextMode = {
  label: string;
  icon: React.ElementType;
};

/**
 * The chip at the top of the sidebar names the area the user is in.
 *
 * It used to carry its own hand-written route-to-area map, which disagreed
 * with the nav categories rendered directly beneath it: /app/incidents said
 * "Governance" while the nav filed Incidents under Care Operations, and
 * /app/team said "Administration" against a Workforce heading. Two
 * taxonomies, one screen apart.
 *
 * It now reads the category off whichever nav item matches the current
 * route, so there is only one grouping to disagree with.
 */
function resolveContextMode(
  pathname: string,
  navigation: NavItem[],
): ContextMode {
  const match = navigation
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  if (!match) return { label: 'Overview', icon: Shield };
  return { label: match.category, icon: match.icon };
}

type UserRole = 'viewer' | 'member' | 'admin' | 'owner' | 'staff' | 'auditor';

/** RAG dot color + accessible label for sidebar nav items based on compliance store status */
function useRAGDot(
  ragKey: NavItem['ragKey'],
): { className: string; label: string } | null {
  const summary = useComplianceStore((s) => s.summary);
  if (!ragKey || !summary) return null;
  switch (ragKey) {
    case 'obligations': {
      if (summary.overdue > 0)
        return { className: 'bg-destructive', label: 'Overdue' };
      if (summary.dueSoon > 0)
        return { className: 'bg-warning', label: 'Due soon' };
      return { className: 'bg-success', label: 'On track' };
    }
    case 'incidents':
      return summary.overdue > 0
        ? { className: 'bg-destructive', label: 'Overdue' }
        : { className: 'bg-success', label: 'On track' };
    case 'evidence':
    case 'policies':
    case 'staff':
      return null; // These only show dots when API data is available
    default:
      return null;
  }
}

/** Task count badge for sidebar */
function useTaskBadge(badgeKey: NavItem['badgeKey']): number | null {
  const summary = useComplianceStore((s) => s.summary);
  if (!badgeKey || !summary) return null;
  if (badgeKey === 'tasks') {
    return summary.overdue + summary.dueSoon;
  }
  return null;
}

export function Sidebar({ role = 'owner' }: { role?: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const user = useAppStore((state) => state.user);
  const industry = organization?.industry ?? null;
  const prefetchedRoutes = useRef(new Set<string>());
  const warmupScheduled = useRef(false);
  const { state: onboardingState, isActive: onboardingActive } = useOnboarding();
  const nextStepHref = onboardingState?.nextStep?.href ?? null;
  const { displayName, avatarUrl } = useCurrentUserAvatar(user?.id);
  const userName = displayName || user?.name || user?.email || 'User';

  // Get industry-specific navigation (memoized to prevent prefetch re-runs)
  const { navigation, categories } = useMemo(
    () => getIndustryNavigation(industry, role),
    [industry, role],
  );

  const contextMode = useMemo(
    () => resolveContextMode(pathname, navigation),
    [pathname, navigation],
  );

  const prefetchRoute = useCallback(
    (href: string) => {
      if (!href || href === pathname || prefetchedRoutes.current.has(href))
        return;
      prefetchedRoutes.current.add(href);
      router.prefetch(href);
    },
    [pathname, router],
  );

  useEffect(() => {
    if (warmupScheduled.current) return;
    if (typeof window === 'undefined') return;

    const connection = (
      navigator as unknown as {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const saveData = connection?.saveData === true;
    const effectiveType = connection?.effectiveType as string | undefined;
    const isSlowNetwork =
      effectiveType === 'slow-2g' ||
      effectiveType === '2g' ||
      effectiveType === '3g';

    // Avoid eager prefetch on constrained networks.
    if (saveData || isSlowNetwork) return;

    const candidates = navigation
      .map((item) => item.href)
      .filter((href) => href !== pathname && !href.startsWith('#'))
      .slice(0, 6);

    if (candidates.length === 0) return;

    warmupScheduled.current = true;
    const idleCallback = (
      window as unknown as {
        requestIdleCallback?: (
          callback: () => void,
          opts?: { timeout?: number },
        ) => number;
      }
    ).requestIdleCallback;

    if (idleCallback) {
      const id = idleCallback(
        () => {
          candidates.forEach(prefetchRoute);
        },
        { timeout: 1200 },
      );
      return () => {
        const cancelIdle = (
          window as unknown as { cancelIdleCallback?: (idleId: number) => void }
        ).cancelIdleCallback;
        if (cancelIdle) cancelIdle(id);
      };
    }

    const timer = window.setTimeout(() => {
      for (const [index, href] of candidates.entries()) {
        window.setTimeout(() => prefetchRoute(href), index * 120);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [navigation, pathname, prefetchRoute]);

  return (
    <div className="flex h-full w-full flex-col justify-between px-3 py-4">
      {/* Context Mode */}
      <div className="mb-3 px-3">
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-muted-foreground">
          <contextMode.icon className="h-3 w-3 shrink-0" />
          <span className="text-[10px] font-semibold tracking-wide uppercase">
            {contextMode.label}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
        <nav className="space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="space-y-0.5">
              <h3 className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {cat}
              </h3>

              {navigation
                .filter((item) => item.category === cat)
                .map((item) => (
                  <SidebarNavItem
                    key={item.name}
                    item={item}
                    pathname={pathname}
                    onPrefetch={prefetchRoute}
                    nextStepHref={nextStepHref}
                    dimNonHighlighted={
                      onboardingActive && Boolean(nextStepHref)
                    }
                  />
                ))}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="space-y-0.5 border-t border-border pt-3">
        {/* User identity */}
        <Link
          href="/app/profile"
          className="mb-1 flex items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
        >
          <Avatar
            name={userName}
            src={avatarUrl}
            size="md"
            className="ring-0 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-foreground">
              {userName}
            </div>
            <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
              {role}
            </div>
          </div>
        </Link>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Quick search */}
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event('open-command-menu'));
          }}
          className="group flex w-full items-center justify-between rounded-md px-3 h-8 text-sm font-medium hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5 text-foreground/50" />
            <span>Quick Search</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono border border-border bg-surface-1 rounded text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Logout */}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="group flex w-full items-center gap-2 rounded-md px-3 h-8 text-sm font-medium hover:bg-muted/50"
          >
            <LogOut className="h-3.5 w-3.5 text-foreground/50" />
            <span>Sign Out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Individual nav item with RAG dots, badges, sub-items
// ──────────────────────────────────────────────
function SidebarNavItem({
  item,
  pathname,
  onPrefetch,
  nextStepHref = null,
  dimNonHighlighted = false,
}: {
  item: NavItem;
  pathname: string;
  onPrefetch: (href: string) => void;
  nextStepHref?: string | null;
  dimNonHighlighted?: boolean;
}) {
  const ragDot = useRAGDot(item.ragKey);
  const badgeCount = useTaskBadge(item.badgeKey);
  const isOnboardingTarget = Boolean(
    nextStepHref &&
      item.href !== '/app' &&
      (item.href === nextStepHref ||
        nextStepHref === `${item.href}/new` ||
        nextStepHref.startsWith(`${item.href}/`)),
  );
  const shouldDim =
    dimNonHighlighted &&
    !isOnboardingTarget &&
    item.href !== '/app' &&
    !pathname.startsWith(item.href);

  // Handle hash-based actions (e.g. #ai-assistant)
  if (item.href.startsWith('#')) {
    return (
      <button
        data-testid={item.testId}
        onClick={() => {
          window.dispatchEvent(
            new CustomEvent('app-action', {
              detail: item.href.slice(1),
            }),
          );
        }}
        className="group flex w-full items-center gap-2 rounded-md px-3 h-8 text-sm font-medium transition-all text-foreground/70 hover:bg-muted/50 hover:text-foreground"
      >
        <item.icon className="h-3.5 w-3.5 text-foreground/50" />
        {item.name}
      </button>
    );
  }

  const isExact = pathname === item.href;
  const isChildRoute =
    item.href !== '/app' && pathname.startsWith(`${item.href}/`);
  const isSettingsRoot = item.href === '/app/settings';
  const isInsideSettings = pathname.startsWith('/app/settings/');
  const isActive =
    isExact ||
    isChildRoute ||
    (isSettingsRoot && (pathname === '/app/settings' || isInsideSettings));
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = isActive && hasChildren;

  return (
    <div>
      <Link
        href={item.href}
        data-testid={item.testId}
        data-onboarding-target={isOnboardingTarget ? 'true' : undefined}
        onClick={() => {
          if (item.href !== pathname) {
            markSidebarRouteTransition(item.href);
          }
        }}
        onMouseEnter={() => onPrefetch(item.href)}
        onFocus={() => onPrefetch(item.href)}
        className={`group flex items-center gap-2 rounded-md px-3 h-8 text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'sidebar-link-active bg-accent/50 text-foreground border-l-2 border-l-primary'
              : isOnboardingTarget
                ? 'text-foreground bg-primary/10 border-l-2 border-l-primary hover:bg-primary/15'
              : shouldDim
                ? 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                : 'text-foreground/85 hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        <div className="relative shrink-0">
          <item.icon
            className={`h-3.5 w-3.5 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-foreground/70 group-hover:text-foreground/90'}`}
          />
          {/* RAG indicator dot */}
          {ragDot && (
            <span
              className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${ragDot.className} ring-1 ring-background`}
              role="img"
              aria-label={ragDot.label}
            />
          )}
        </div>
        <span className="flex-1">{item.name}</span>
        {/* Onboarding next-step pill */}
        {isOnboardingTarget && (
          <span
            className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary"
            data-testid="nav-onboarding-next"
          >
            Next
          </span>
        )}
        {/* Badge count */}
        {!isOnboardingTarget && badgeCount !== null && badgeCount > 0 && (
          <span className="ml-auto rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
        {/* Expand indicator for sub-items */}
        {hasChildren && (
          <ChevronRight
            className={`h-3 w-3 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            } ${isActive ? 'text-primary/70' : 'text-foreground/30'}`}
          />
        )}
      </Link>

      {/* Expanded sub-items */}
      {isExpanded && item.children && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-2.5">
          {item.children.map((child) => {
            const isChildActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                data-testid={child.testId}
                onMouseEnter={() => onPrefetch(child.href)}
                className={`block rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  isChildActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                {child.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
