"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/app/actions/logout";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Laptop,
  Users,
  History,
  Settings,
  Lock,
  Printer,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Mail,
  Command,
  HeartPulse,
  NotebookPen,
} from "lucide-react";

type RoleKey = "OWNER" | "COMPLIANCE_OFFICER" | "MANAGER" | "STAFF" | "VIEWER" | "AUDITOR";

const ADMIN_NAV = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard, category: "Overview" },
  { name: "Policies", href: "/app/policies", icon: FileText, category: "Governance" },
  { name: "Registers", href: "/app/registers", icon: Laptop, category: "Governance" },
  { name: "Tasks", href: "/app/tasks", icon: CheckSquare, category: "Governance" },
  { name: "People", href: "/app/people", icon: Users, category: "Operations" },
  { name: "Patients", href: "/app/patients", icon: HeartPulse, category: "Operations" },
  { name: "Progress Notes", href: "/app/progress-notes", icon: NotebookPen, category: "Operations" },
  { name: "Evidence Vault", href: "/app/vault", icon: Lock, category: "Operations" },
  { name: "Reports", href: "/app/reports", icon: Printer, category: "Intelligence" },
  { name: "Audit Trail", href: "/app/audit", icon: History, category: "Intelligence" },
  { name: "Settings", href: "/app/settings", icon: Settings, category: "System" },
  { name: "Email Preferences", href: "/app/settings/email-preferences", icon: Mail, category: "System" },
];

const STAFF_NAV = [
  { name: "Dashboard", href: "/app/staff", icon: LayoutDashboard, category: "Overview" },
  { name: "Tasks", href: "/app/tasks", icon: CheckSquare, category: "Operations" },
  { name: "Patients", href: "/app/patients", icon: HeartPulse, category: "Operations" },
  { name: "Progress Notes", href: "/app/progress-notes", icon: NotebookPen, category: "Operations" },
  { name: "Evidence Vault", href: "/app/vault", icon: Lock, category: "Operations" },
];

export function Sidebar({ role = "OWNER" }: { role?: RoleKey }) {
  const pathname = usePathname();

  const navigation = role === "STAFF" ? STAFF_NAV : ADMIN_NAV;
  const categories = ["Overview", "Governance", "Operations", "Intelligence", "System"].filter((cat) =>
    navigation.some((item) => item.category === cat)
  );

  return (
    <div className="flex h-screen w-64 flex-col justify-between border-r border-white/10 bg-gradient-to-b from-[#0B1220] to-[#0A101C] px-4 py-5">
      <div className="space-y-7 overflow-y-auto no-scrollbar">
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-100 shadow-[0_0_18px_rgba(56,189,248,0.2)]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-slate-100 leading-none">
              FormaOS
            </span>
            <span className="text-[10px] font-semibold text-sky-300 uppercase tracking-[0.2em] mt-1">
              Enterprise
            </span>
          </div>
        </div>

        {/* Navigation Links grouped by Category */}
        <nav className="space-y-5">
          {categories.map((cat) => (
            <div key={cat} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                {cat}
              </h3>

              {navigation
                .filter((item) => item.category === cat)
                .map((item) => {
                  const isExact = pathname === item.href;
                  const isChildRoute = item.href !== "/app" && pathname.startsWith(`${item.href}/`);

                  const isSettingsRoot = item.href === "/app/settings";
                  const isInsideSettings = pathname.startsWith("/app/settings/");
                  const isActive =
                    isExact ||
                    isChildRoute ||
                    (isSettingsRoot && (pathname === "/app/settings" || isInsideSettings));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold transition-all ${
                        isActive
                          ? "bg-white/10 text-slate-100 ring-1 ring-white/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                          : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? "text-slate-100"
                              : "text-slate-400 group-hover:text-slate-100"
                          }`}
                        />
                        {item.name}
                      </div>

                      {isExact && <ChevronRight className="h-3 w-3 text-slate-400" />}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom: Quick Search + Logout */}
      <div className="space-y-3 border-t border-white/10 pt-4 mt-4">
        {/* Quick Search Hint (ties into CommandPalette) */}
        <button
          type="button"
          className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-xs font-semibold text-slate-300 bg-white/10 border border-white/10 hover:text-slate-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors">
              <Command className="h-4 w-4 text-slate-400" />
            </div>
            Quick Search
          </div>
          <kbd className="px-2 py-1 text-[10px] font-mono bg-white/10 border border-white/10 rounded-md text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Logout */}
        <form action={signOut}>
          <button
            type="submit"
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-slate-300 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 transition-colors">
              <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover:text-rose-300" />
            </div>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
