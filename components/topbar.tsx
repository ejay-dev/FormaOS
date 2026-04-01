'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

import { TopbarSearch } from './topbar-search';
import {
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
import { useHelpAssistant } from '@/components/help/help-assistant-context';
// Product tour disabled — import removed
// import { useProductTour } from '@/lib/onboarding/product-tour';

import Button from './ui/button';
import { Badge } from './ui/badge';

// ✅ Notification Center Component
import { NotificationCenter } from '@/components/notifications/notification-center';
import { ThemeSwitcher, ThemeToggle } from '@/components/theme-switcher';

type UserRole = 'viewer' | 'member' | 'admin' | 'owner' | 'staff' | 'auditor';
type MenuItem = {
  label: string;
  icon: typeof UserCircle;
  href?: string;
  action?: () => void;
};

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { open: openHelp } = useHelpAssistant();

  const userMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

      // Query profiles table for display name and avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (!isMounted) return;

      setDisplayName(profile?.full_name ?? null);
      setAvatarUrl(profile?.avatar_url ?? null);
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

  const menuItems: MenuItem[] = [
    { label: 'Profile', icon: UserCircle, href: '/app/profile' },
    { label: 'Account Settings', icon: Settings, href: '/app/settings' },
    { label: 'Billing & Subscription', icon: CreditCard, href: '/app/billing' },
    { label: 'Security', icon: ShieldCheck, href: '/app/settings' },
    { label: 'Switch Organization', icon: Building2, href: '/app/settings' },
    {
      label: 'Help Center',
      icon: LifeBuoy,
      action: () => openHelp('home'),
    },
  ];

  return (
    <div className="flex h-full w-full items-center justify-between gap-2 sm:gap-3 min-w-0">
      {/* Left: Breadcrumbs + Role badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-sm text-sidebar-foreground min-w-0">
        <MobileSidebar role={role} />
        <span className="hidden sm:inline font-semibold text-sidebar-primary-foreground uppercase text-[11px] tracking-[0.2em]">
          Organization
        </span>
        <ChevronRight className="hidden sm:block h-4 w-4 text-muted-foreground" />
        <span className="max-w-[110px] sm:max-w-[200px] truncate px-2 sm:px-3 py-1 rounded-md bg-card/70 text-card-foreground text-[11px] sm:text-sm font-semibold border border-card-foreground/8">
          {orgName}
        </span>
        <Badge variant="outline" className="hidden md:inline-flex uppercase tracking-wider font-bold">
          {role}
        </Badge>
      </div>

      {/* Middle: Search */}
      <div className="hidden flex-1 justify-center px-6 md:flex">
        <TopbarSearch />
      </div>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Trial days remaining badge */}
        <div className="hidden md:flex">
          <TrialDaysRemaining />
        </div>

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

        <NotificationCenter orgId={orgId} userId={userId} />

        {/* Help Assistant */}
        <Button
          variant="ghost"
          onClick={() => openHelp('home')}
          className="hidden sm:inline-flex rounded-full p-2.5 text-sidebar-foreground/90 hover:bg-card/8 transition-colors"
          aria-label="Open help assistant"
        >
          <LifeBuoy className="h-5 w-5" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* USER DROPDOWN */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            className="flex items-center gap-1 sm:gap-2 rounded-full pl-1 pr-2.5 sm:pr-3 py-1.5"
          >
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-bold text-card-foreground">
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
              className="dropdown-enter absolute right-0 top-full mt-1 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl border border-card-foreground/8 bg-card p-2 shadow-xl z-50"
              role="menu"
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setShowUserMenu(false);
              }}
            >
              <div className="px-3 py-2 border-b border-card-foreground/8 mb-1">
                <p className="text-xs font-bold text-card-foreground">
                  Signed in as
                </p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if ('action' in item && item.action) {
                        item.action();
                      } else if ('href' in item && item.href) {
                        router.push(item.href);
                      }
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

              {/* Theme switcher */}
              <ThemeSwitcher />

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
