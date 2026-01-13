"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  CreditCard,
  Gauge,
  HeartPulse,
  LifeBuoy,
  Settings,
  Users,
  Wallet,
  Shield,
  FileText,
  AlertTriangle,
  CheckSquare,
  Network,
  TrendingUp,
  Zap,
} from "lucide-react";

/**
 * =========================================================
 * ADMIN SHELL - GOVERNANCE CONTROL CENTER
 * =========================================================
 * The admin dashboard reflects true governance logic,
 * not just metrics. It shows the health of the entire
 * compliance operating system across all organizations.
 */

const NAV_SECTIONS = [
  {
    title: "System Overview",
    items: [
      { name: "Command Center", href: "/admin", icon: Gauge, description: "Platform health & metrics" },
      { name: "System Health", href: "/admin/health", icon: Activity, description: "Infrastructure status" },
    ]
  },
  {
    title: "Entity Governance",
    items: [
      { name: "Organizations", href: "/admin/orgs", icon: Building2, description: "All tenant workspaces" },
      { name: "Users", href: "/admin/users", icon: Users, description: "Platform-wide user management" },
    ]
  },
  {
    title: "Financial Operations",
    items: [
      { name: "Billing", href: "/admin/billing", icon: CreditCard, description: "Subscription management" },
      { name: "Revenue", href: "/admin/revenue", icon: Wallet, description: "MRR & financial analytics" },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Support", href: "/admin/support", icon: LifeBuoy, description: "Tickets & escalations" },
      { name: "Settings", href: "/admin/settings", icon: Settings, description: "Platform configuration" },
    ]
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-slate-100">
      <div className="flex min-h-screen">
        {/* Enhanced Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-white/10 bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--background))] lg:flex">
          {/* Branding */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                FA
              </div>
              <div>
                <div className="text-base font-bold font-display">FormaOS</div>
                <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider">
                  Founder Admin
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href || 
                      (item.href !== "/admin" && pathname.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                          isActive 
                            ? "bg-white/10 text-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        }`}
                      >
                        <div className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-all ${
                          isActive 
                            ? "bg-gradient-to-br from-rose-500/20 to-orange-500/20 border-rose-400/40 text-rose-300" 
                            : "bg-white/5 border-white/10 text-slate-400 group-hover:border-white/20"
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-white/10">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System operational</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[hsl(var(--card))]/80 backdrop-blur-md px-8 py-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  Admin Console
                </div>
                <div className="text-lg font-semibold text-slate-100 mt-0.5">
                  Governance Control Center
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">All systems operational</span>
              </div>
              <div className="text-xs text-slate-500">
                Founder access only
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-8 py-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
