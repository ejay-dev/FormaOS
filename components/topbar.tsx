"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

import { TopbarSearch } from "./topbar-search";
import { Bell, ChevronRight, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";

// ✅ Notification Center Component
import { NotificationCenter } from "@/components/notifications/notification-center";

type RoleKey = "OWNER" | "COMPLIANCE_OFFICER" | "MANAGER" | "STAFF" | "VIEWER" | "AUDITOR";

export function TopBar({
  orgName,
  userEmail,
  orgId,
  role,
}: {
  orgName: string;
  userEmail: string;
  orgId: string;
  role: RoleKey;
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const supabase = createSupabaseClient();

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

  // Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/signin");
  };

  return (
    <header className="relative z-40 flex h-16 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0B1220] via-[#0E1526] to-[#0B1220] px-6">
      
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <MobileSidebar role={role} />
        <span className="hidden sm:inline font-semibold text-slate-50 uppercase text-[11px] tracking-[0.2em]">
          Organization
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <span className="max-w-[160px] truncate px-3 py-1 rounded-md bg-white/10 text-slate-100 text-sm font-semibold border border-white/10">
          {orgName}
        </span>
      </div>

      {/* Middle: Search */}
      <div className="hidden md:flex flex-1 justify-center px-6">
        <TopbarSearch />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative rounded-full p-2.5 text-slate-400 hover:bg-white/10 hover:text-slate-100 transition-colors"
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
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 pl-1 pr-3 py-1.5 hover:bg-white/10 transition-all shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-100">
              {userEmail?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
            </div>
            <ChevronDown
              className={`h-3 w-3 text-slate-400 transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0B1220] p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-xs font-bold text-slate-100">Signed in as</p>
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              </div>

              <button
                onClick={() => router.push("/app/settings")}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-slate-100 transition-colors text-left"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition-colors text-left mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
