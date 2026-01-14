"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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
import Button from "./ui/button";

type UserRole = "viewer" | "member" | "admin" | "owner" | "staff" | "auditor";

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

export function Sidebar({ role = "owner" }: { role?: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = role === "staff" || role === "member" || role === "viewer" ? STAFF_NAV : ADMIN_NAV;
  const categories = ["Overview", "Governance", "Operations", "Intelligence", "System"].filter((cat) =>
    navigation.some((item) => item.category === cat)
  );

  /**
   * ⚡ PERFORMANCE: Prefetch all routes on mount
   * This loads route data in the background so clicks are instant
   */
  useEffect(() => {
    navigation.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router, navigation]);

  return (
    <div className="flex h-full w-full flex-col justify-between px-4 py-6">
      {/* Navigation */}
      <div className="space-y-8 overflow-y-auto no-scrollbar">
        <nav className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="space-y-2">
              <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
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
                      // ⚡ Prefetch on hover for even faster transitions
                      onMouseEnter={() => router.prefetch(item.href)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-premium-md"
                          : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "" : "text-foreground/50"}`} />
                      {item.name}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="space-y-2 border-t border-white/8 pt-5">
        {/* Quick search */}
        <Button 
          variant="ghost" 
          className="group flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/5"
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
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 text-foreground/50" />
            <span>Sign Out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
