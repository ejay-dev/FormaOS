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
  BarChart3,
  Gauge,
  HeartPulse,
  KeyRound,
  Mail,
  Server,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';
import { AdminQuickSearch } from '@/app/admin/components/admin-quick-search';

/* Admin Console Shell — Platform Operations Center */

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
      { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
      {
        name: 'Usage analytics',
        href: '/admin/usage-analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Customers',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Organizations', href: '/admin/orgs', icon: Building2 },
      { name: 'Customer health', href: '/admin/customer-health', icon: Gauge },
      { name: 'Billing', href: '/admin/billing', icon: CreditCard },
      { name: 'Trials', href: '/admin/trials', icon: Clock },
      { name: 'Support', href: '/admin/support', icon: LifeBuoy },
      { name: 'Bulk actions', href: '/admin/bulk', icon: Layers },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        name: 'Control plane',
        href: '/admin/control-plane',
        icon: SlidersHorizontal,
      },
      { name: 'Features', href: '/admin/features', icon: Zap },
      { name: 'Security', href: '/admin/security', icon: Shield },
      { name: 'Sessions', href: '/admin/sessions', icon: KeyRound },
      { name: 'Activity', href: '/admin/activity', icon: Activity },
      { name: 'Audit log', href: '/admin/audit', icon: FileText },
      { name: 'System status', href: '/admin/system', icon: Server },
      { name: 'System health', href: '/admin/health', icon: HeartPulse },
      { name: 'Releases', href: '/admin/releases', icon: Tag },
      { name: 'Exports', href: '/admin/exports', icon: FileArchive },
      { name: 'Emails', href: '/admin/emails', icon: Mail },
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
                <div className="px-3 mb-1.5 text-xs font-medium text-muted-foreground">
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

        {/* Main Content. v4-029: id="main-content" anchors the
            global Skip-to-main link in app/layout.tsx. */}
        <main
          id="main-content"
          className="flex-1 min-w-0 h-[calc(100vh-4rem)] overflow-y-auto"
        >
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
