'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { signOut } from '@/app/app/actions/logout';
import { LogOut, Command, Shield, HeartPulse, FileText, BarChart3, Settings2 } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Button from './ui/button';
import { Badge } from './ui/badge';
import { useAppStore } from '@/lib/stores/app';
import { markSidebarRouteTransition } from '@/lib/monitoring/route-transition';
import {
  getIndustryNavigation,
  getIndustryLabel,
} from '@/lib/navigation/industry-sidebar';

type ContextMode = {
  label: string;
  color: string;
  icon: React.ElementType;
};

function resolveContextMode(pathname: string): ContextMode {
  if (
    pathname.startsWith('/app/participants') ||
    pathname.startsWith('/app/visits') ||
    pathname.startsWith('/app/care-plans') ||
    pathname.startsWith('/app/progress-notes')
  ) {
    return { label: 'Care Operations', color: 'text-rose-300 bg-rose-500/10 border-rose-400/20', icon: HeartPulse };
  }
  if (
    pathname.startsWith('/app/compliance') ||
    pathname.startsWith('/app/controls') ||
    pathname.startsWith('/app/frameworks') ||
    pathname.startsWith('/app/staff-compliance')
  ) {
    return { label: 'Compliance', color: 'text-primary bg-primary/10 border-primary/20', icon: Shield };
  }
  if (
    pathname.startsWith('/app/policies') ||
    pathname.startsWith('/app/registers') ||
    pathname.startsWith('/app/incidents') ||
    pathname.startsWith('/app/vault') ||
    pathname.startsWith('/app/tasks')
  ) {
    return { label: 'Governance', color: 'text-violet-300 bg-violet-500/10 border-violet-400/20', icon: FileText };
  }
  if (
    pathname.startsWith('/app/audit') ||
    pathname.startsWith('/app/reports') ||
    pathname.startsWith('/app/executive') ||
    pathname.startsWith('/app/intelligence')
  ) {
    return { label: 'Intelligence', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20', icon: BarChart3 };
  }
  if (
    pathname.startsWith('/app/settings') ||
    pathname.startsWith('/app/team') ||
    pathname.startsWith('/app/billing')
  ) {
    return { label: 'Administration', color: 'text-muted-foreground bg-white/5 border-white/10', icon: Settings2 };
  }
  return { label: 'Overview', color: 'text-primary bg-primary/10 border-primary/20', icon: Shield };
}

type UserRole = 'viewer' | 'member' | 'admin' | 'owner' | 'staff' | 'auditor';

export function Sidebar({ role = 'owner' }: { role?: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const organization = useAppStore((state) => state.organization);
  const industry = organization?.industry ?? null;
  const prefetchedRoutes = useRef(new Set<string>());
  const warmupScheduled = useRef(false);
  const contextMode = useMemo(() => resolveContextMode(pathname), [pathname]);

  // Get industry-specific navigation (memoized to prevent prefetch re-runs)
  const { navigation, categories } = useMemo(
    () => getIndustryNavigation(industry, role),
    [industry, role],
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

    const connection = (navigator as any).connection;
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
    const idleCallback = (window as any).requestIdleCallback as
      | ((callback: () => void, opts?: { timeout?: number }) => number)
      | undefined;

    if (idleCallback) {
      const id = idleCallback(
        () => {
          candidates.forEach(prefetchRoute);
        },
        { timeout: 1200 },
      );
      return () => {
        const cancelIdle = (window as any).cancelIdleCallback as
          | ((idleId: number) => void)
          | undefined;
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
    <div className="flex h-full w-full flex-col justify-between px-4 py-6">
      {/* Context Mode + Industry Badge */}
      <div className="mb-4 space-y-2 px-3">
        <div className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-300 ${contextMode.color}`}>
          <contextMode.icon className="h-3 w-3 shrink-0" />
          <span className="text-[11px] font-semibold tracking-wide">{contextMode.label}</span>
        </div>
        {industry && (
          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
            {getIndustryLabel(industry)}
          </Badge>
        )}
      </div>

      {/* Navigation */}
      <div className="space-y-8 overflow-y-auto no-scrollbar flex-1">
        <nav className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {cat}
              </h3>

              {navigation
                .filter((item) => item.category === cat)
                .map((item) => {
                  // Handle hash-based actions (e.g. #ai-assistant)
                  if (item.href.startsWith('#')) {
                    return (
                      <button
                        key={item.name}
                        data-testid={item.testId}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('app-action', { detail: item.href.slice(1) }),
                          );
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all text-foreground/70 hover:bg-muted/50 hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4 text-foreground/50" />
                        {item.name}
                      </button>
                    );
                  }

                  const isExact = pathname === item.href;
                  const isChildRoute =
                    item.href !== '/app' &&
                    pathname.startsWith(`${item.href}/`);
                  const isSettingsRoot = item.href === '/app/settings';
                  const isInsideSettings =
                    pathname.startsWith('/app/settings/');
                  const isActive =
                    isExact ||
                    isChildRoute ||
                    (isSettingsRoot &&
                      (pathname === '/app/settings' || isInsideSettings));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-testid={item.testId}
                      onClick={() => {
                        if (item.href !== pathname) {
                          markSidebarRouteTransition(item.href);
                        }
                      }}
                      onMouseEnter={() => prefetchRoute(item.href)}
                      onFocus={() => prefetchRoute(item.href)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/90 text-primary-foreground shadow-premium ring-1 ring-primary/30'
                          : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-primary-foreground' : 'text-foreground/50 group-hover:text-foreground/80'}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="space-y-2 border-t border-border pt-5">
        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Quick search */}
        <Button
          variant="ghost"
          type="button"
          onClick={() => {
            window.dispatchEvent(new Event('open-command-menu'));
          }}
          className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Command className="h-4 w-4 text-foreground/50" />
            <span>Quick Search</span>
          </div>
          <kbd className="px-2 py-1 text-xs font-mono glass-panel rounded-md text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        {/* Logout */}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted/50"
          >
            <LogOut className="h-4 w-4 text-foreground/50" />
            <span>Sign Out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
