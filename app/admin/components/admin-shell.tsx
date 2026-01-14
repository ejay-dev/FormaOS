'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { brand } from '@/config/brand';

/**
 * =========================================================
 * ADMIN CONSOLE SHELL - PLATFORM OPERATIONS CENTER
 * =========================================================
 * Executive-grade platform control interface.
 * Minimal, secure, operational.
 */

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Organizations', href: '/admin/orgs', icon: Building2 },
  { name: 'Billing', href: '/admin/billing', icon: CreditCard },
  { name: 'Trials', href: '/admin/trials', icon: Clock },
  { name: 'Features', href: '/admin/features', icon: Zap },
  { name: 'Security', href: '/admin/security', icon: Shield },
  { name: 'System', href: '/admin/system', icon: Activity },
  { name: 'Audit', href: '/admin/audit', icon: FileText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const client = createSupabaseClient();
    await client.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm z-40 flex items-center justify-between px-6">
        {/* Left: Logo + Branding */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image
              src={brand.logo.mark}
              alt={brand.appName}
              width={32}
              height={32}
              priority
              className="rounded-md"
            />
            <div className="hidden sm:block">
              <div className="text-sm font-bold">{brand.appName} Admin</div>
              <div className="text-xs text-slate-500">Platform Console</div>
            </div>
          </Link>
        </div>

        {/* Right: Status + User + Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Healthy</span>
          </div>
          <div className="hidden sm:block text-xs text-slate-500">
            ejazhussaini313@gmail.com
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static w-64 h-[calc(100vh-64px)] border-r border-slate-800 bg-slate-900 overflow-y-auto transition-transform duration-300 z-30 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'bg-slate-800 text-slate-50 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
