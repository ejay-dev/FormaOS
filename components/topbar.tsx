"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

import { TopbarSearch } from "./topbar-search";
import {
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
  ChevronDown,
  UserCircle,
  CreditCard,
  ShieldCheck,
  LifeBuoy,
  Building2,
} from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";

// ✅ Notification Center Component
import { NotificationCenter } from "@/components/notifications/notification-center";

type RoleKey = "OWNER" | "COMPLIANCE_OFFICER" | "MANAGER" | "STAFF" | "VIEWER" | "AUDITOR";

export function TopBar({
  orgName,
  userEmail,
  userId,
  orgId,
  role,
}: {
  orgName: string;
  userEmail: string;
  userId: string;
  orgId: string;
  role: RoleKey;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!userId) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_path")
        .eq("user_id", userId)
        .maybeSingle();

      if (!isMounted) return;

      setDisplayName(profile?.full_name ?? null);

      if (!profile?.avatar_path) {
        setAvatarUrl(null);
        return;
      }

      const { data, error } = await supabase.storage
        .from("user-avatars")
        .createSignedUrl(profile.avatar_path, 60 * 60 * 12);

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load avatar:", error.message);
        setAvatarUrl(null);
        return;
      }

      setAvatarUrl(data?.signedUrl ?? null);
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [supabase, userId]);

  // Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  const initialsSource = displayName || userEmail || "";
  const initials = initialsSource
    ? initialsSource
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US";

  const menuItems = [
    { label: "Profile", icon: UserCircle, href: "/app/profile" },
    { label: "Account Settings", icon: Settings, href: "/app/settings" },
    { label: "Billing & Subscription", icon: CreditCard, href: "/app/billing" },
    { label: "Security", icon: ShieldCheck, href: "/app/settings" },
    { label: "Switch Organization", icon: Building2, href: "/app/settings" },
    { label: "Support", icon: LifeBuoy, href: "/contact" },
  ];

  return (
    <div className="flex h-full w-full items-center justify-between">
      
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-sidebar-foreground">
        <MobileSidebar role={role} />
        <span className="hidden sm:inline font-semibold text-sidebar-primary-foreground uppercase text-[11px] tracking-[0.2em]">
          Organization
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <span className="max-w-[160px] truncate px-3 py-1 rounded-md bg-card/70 text-card-foreground text-sm font-semibold border border-card-foreground/8">
          {orgName}
        </span>
      </div>

      {/* Middle: Search */}
      <div className="hidden flex-1 justify-center px-6 md:flex">
        <TopbarSearch />
      </div>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-3">

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative rounded-full p-2.5 text-sidebar-foreground/80 hover:bg-card/8 hover:text-card-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* DROPDOWN PANEL (only when open) */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 z-50">
              <NotificationCenter orgId={orgId} />
            </div>
          )}
        </div>

        {/* USER DROPDOWN */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            className="flex items-center gap-2 rounded-full border border-card-foreground/8 bg-card/70 pl-1 pr-3 py-1.5 hover:bg-card/80 transition-all shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[10px] font-bold text-slate-100">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                initials || <User className="h-4 w-4" />
              )}
            </div>
            <ChevronDown
              className={`h-3 w-3 text-slate-400 transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl border border-card-foreground/8 bg-card p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50"
              role="menu"
              onKeyDown={(event) => {
                if (event.key === "Escape") setShowUserMenu(false);
              }}
            >
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-xs font-bold text-slate-100">Signed in as</p>
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.href);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-slate-100 transition-colors text-left"
                    role="menuitem"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
