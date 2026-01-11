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
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: Gauge },
  { name: "Organizations", href: "/admin/orgs", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Revenue", href: "/admin/revenue", icon: Wallet },
  { name: "Support", href: "/admin/support", icon: LifeBuoy },
  { name: "Health", href: "/admin/health", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-white/10 bg-[hsl(var(--card))] px-5 py-6 lg:flex">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">FormaOS</div>
            <div className="mt-2 text-lg font-semibold text-slate-100">Founder Admin</div>
          </div>
          <nav className="space-y-2 text-sm">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                    isActive ? "bg-white/10 text-slate-100" : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-[hsl(var(--card))] px-6 py-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin Console</div>
              <div className="text-lg font-semibold text-slate-100">Operational Control</div>
            </div>
            <div className="text-xs text-slate-400">Founder access only</div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
