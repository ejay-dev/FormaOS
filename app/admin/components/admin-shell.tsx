'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  Building2,
  CreditCard,
  Clock,
  Zap,
  Shield,
  Activity,
  FileText,
  FileArchive,
  LogOut,
  Menu,
  X,
  DollarSign,
  LifeBuoy,
  Settings,
  Tag,
  ShieldAlert,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { createSupabaseClient } from '@/lib/supabase/client';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';
import { EnterpriseTrustStrip } from '@/components/trust/EnterpriseTrustStrip';
import { AdminQuickSearch } from '@/app/admin/components/admin-quick-search';

/* Admin Console Shell — Platform Operations Center */

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
      { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Organizations', href: '/admin/orgs', icon: Building2 },
      { name: 'Billing', href: '/admin/billing', icon: CreditCard },
      { name: 'Trials', href: '/admin/trials', icon: Clock },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        name: 'Command Center',
        href: '/admin/control-plane',
        icon: SlidersHorizontal,
      },
      { name: 'Features', href: '/admin/features', icon: Zap },
      { name: 'Security', href: '/admin/security', icon: Shield },
      {
        name: 'Security Live',
        href: '/admin/security-live',
        icon: ShieldAlert,
      },
      {
        name: 'Risk Triage',
        href: '/admin/security/triage',
        icon: ShieldAlert,
      },
      { name: 'Sessions', href: '/admin/sessions', icon: Users },
      { name: 'Activity', href: '/admin/activity', icon: Activity },
      { name: 'System', href: '/admin/system', icon: Activity },
      { name: 'Audit', href: '/admin/audit', icon: FileText },
      { name: 'Releases', href: '/admin/releases', icon: Tag },
      { name: 'Exports', href: '/admin/exports', icon: FileArchive },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Support', href: '/admin/support', icon: LifeBuoy },
      { name: 'Bulk Actions', href: '/admin/bulk', icon: Layers },
      { name: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Admin surface was designed dark-first; many nested components use hardcoded
  // slate tokens that render unreadably on a light background. Lock dark while
  // mounted and restore the user's previous preference on unmount so the rest
  // of the app still respects their theme choice.
  useEffect(() => {
    const previous = theme;
    if (previous !== 'dark') setTheme('dark');
    return () => {
      if (previous && previous !== 'dark') setTheme(previous);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    const client = createSupabaseClient();
    await client.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-sm z-50 flex items-center justify-between px-6">
        {/* Left: Logo + Branding */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Logo variant="mark" size={40} />
            <div className="hidden sm:block">
              <div className="text-sm font-bold">{brand.appName} Admin</div>
              <div className="text-xs text-muted-foreground">
                Platform Console
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Status + User + Logout */}
        <div className="flex items-center gap-4">
          <AdminQuickSearch />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Healthy</span>
          </div>
          <div className="hidden sm:block text-xs text-muted-foreground truncate max-w-[200px]">
            {email || 'Admin'}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Logout"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:relative top-16 lg:top-0 left-0 w-64 h-[calc(100vh-4rem)] border-r border-border bg-sidebar overflow-y-auto transition-transform duration-200 z-40 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-3 space-y-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin' &&
                        pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 h-[calc(100vh-4rem)] overflow-y-auto">
          <EnterpriseTrustStrip surface="admin" />
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
          }}
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
