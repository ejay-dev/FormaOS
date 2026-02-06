'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

import { TopbarSearch } from './topbar-search';
import {
  Bell,
  Search,
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
} from 'lucide-react';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { TrialDaysRemaining } from '@/components/billing/TrialDaysRemaining';

import Button from './ui/button';

// ✅ Notification Center Component
import { NotificationCenter } from '@/components/notifications/notification-center';

type UserRole = 'viewer' | 'member' | 'admin' | 'owner' | 'staff' | 'auditor';

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
  role: UserRole;
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!userId) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_path')
        .eq('user_id', userId)
        .maybeSingle();

      if (!isMounted) return;

      setDisplayName(profile?.full_name ?? null);

      if (!profile?.avatar_path) {
        setAvatarUrl(null);
        return;
      }

      const { data, error } = await supabase.storage
        .from('user-avatars')
        .createSignedUrl(profile.avatar_path, 60 * 60 * 12);

      if (!isMounted) return;

      if (error) {
        console.error('Failed to load avatar:', error.message);
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
    router.push('/auth/signin');
  };

  const initialsSource = displayName || userEmail || '';
  const initials = initialsSource
    ? initialsSource
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'US';

  const menuItems = [
    { label: 'Profile', icon: UserCircle, href: '/app/profile' },
    { label: 'Account Settings', icon: Settings, href: '/app/settings' },
    { label: 'Billing & Subscription', icon: CreditCard, href: '/app/billing' },
    { label: 'Security', icon: ShieldCheck, href: '/app/settings' },
    { label: 'Switch Organization', icon: Building2, href: '/app/settings' },
    { label: 'Support', icon: LifeBuoy, href: '/contact' },
  ];

  return (
    <div className="flex h-full w-full items-center justify-between gap-3 min-w-0">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-sidebar-foreground min-w-0">
        <MobileSidebar role={role} />
        <span className="hidden sm:inline font-semibold text-sidebar-primary-foreground uppercase text-[11px] tracking-[0.2em]">
          Organization
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <span className="max-w-[120px] sm:max-w-[200px] truncate px-2.5 sm:px-3 py-1 rounded-md bg-card/70 text-card-foreground text-xs sm:text-sm font-semibold border border-card-foreground/8">
          {orgName}
        </span>
      </div>

      {/* Middle: Search */}
      <div className="hidden flex-1 justify-center px-6 md:flex">
        <TopbarSearch />
      </div>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {/* Trial days remaining badge */}
        <TrialDaysRemaining />

        {/* Mobile search trigger */}
        <Button
          variant="ghost"
          onClick={() => {
            window.dispatchEvent(new Event('open-command-menu'));
          }}
          className="md:hidden rounded-full p-2.5 text-sidebar-foreground/90 hover:bg-card/8 transition-colors"
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* 🔔 NOTIFICATIONS */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            onClick={() => setShowNotifications((v) => !v)}
            className="relative rounded-full p-2.5 text-sidebar-foreground/90 hover:bg-card/8 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* DROPDOWN PANEL (only when open) */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 z-50">
              <NotificationCenter orgId={orgId} />
            </div>
          )}
        </div>

        {/* USER DROPDOWN */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1.5"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/8 text-[10px] font-bold text-card-foreground">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || <User className="h-4 w-4" />
              )}
            </div>
            <ChevronDown
              className={`h-3 w-3 text-card-foreground/70 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-card-foreground/8 bg-card p-2 shadow-xl z-50"
              role="menu"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setShowUserMenu(false);
              }}
            >
              <div className="px-3 py-2 border-b border-card-foreground/8 mb-1">
                <p className="text-xs font-bold text-card-foreground">
                  Signed in as
                </p>
                <p className="text-xs text-muted truncate">{userEmail}</p>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      router.push(item.href);
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-card-foreground hover:bg-card/8 transition-colors text-left"
                    role="menuitem"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-card-foreground/8" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-rose-500/10 transition-colors text-left"
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
