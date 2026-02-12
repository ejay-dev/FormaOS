'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Lock,
  Shield,
  BarChart3,
  Users,
  Settings,
  CreditCard,
  Search,
  Plus,
  Upload,
  UserPlus,
  User,
  ShieldCheck,
  HelpCircle,
  History,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  keywords?: string[];
  shortcut?: string;
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const NAVIGATION_ITEMS: CommandItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/app',
    keywords: ['home', 'overview', 'main'],
  },
  {
    id: 'nav-tasks',
    label: 'Tasks',
    icon: CheckSquare,
    href: '/app/tasks',
    keywords: ['todo', 'roadmap', 'checklist'],
  },
  {
    id: 'nav-policies',
    label: 'Policies',
    icon: FileText,
    href: '/app/policies',
    keywords: ['documents', 'governance', 'rules'],
  },
  {
    id: 'nav-vault',
    label: 'Evidence Vault',
    icon: Lock,
    href: '/app/vault',
    keywords: ['files', 'evidence', 'upload', 'storage'],
  },
  {
    id: 'nav-compliance',
    label: 'Compliance',
    icon: Shield,
    href: '/app/registers',
    keywords: ['registers', 'compliance', 'audit'],
  },
  {
    id: 'nav-audit',
    label: 'Audit Trail',
    icon: History,
    href: '/app/audit',
    keywords: ['log', 'history', 'trail', 'activity'],
  },
  {
    id: 'nav-reports',
    label: 'Reports',
    icon: BarChart3,
    href: '/app/reports',
    keywords: ['analytics', 'charts', 'metrics', 'insights'],
  },
  {
    id: 'nav-team',
    label: 'Team',
    icon: Users,
    href: '/app/team',
    keywords: ['members', 'people', 'staff', 'workforce'],
  },
  {
    id: 'nav-settings',
    label: 'Settings',
    icon: Settings,
    href: '/app/settings',
    keywords: ['preferences', 'config', 'organization'],
  },
  {
    id: 'nav-billing',
    label: 'Billing',
    icon: CreditCard,
    href: '/app/settings/billing',
    keywords: ['subscription', 'plan', 'payment', 'invoice'],
  },
];

const ACTION_ITEMS: CommandItem[] = [
  {
    id: 'action-create-task',
    label: 'Create Task',
    icon: Plus,
    href: '/app/tasks?new=true',
    keywords: ['new task', 'add task', 'todo'],
  },
  {
    id: 'action-upload-evidence',
    label: 'Upload Evidence',
    icon: Upload,
    href: '/app/vault?upload=true',
    keywords: ['upload', 'file', 'evidence', 'document'],
  },
  {
    id: 'action-new-policy',
    label: 'New Policy',
    icon: FileText,
    href: '/app/policies?new=true',
    keywords: ['create policy', 'add policy', 'document'],
  },
  {
    id: 'action-invite-member',
    label: 'Invite Team Member',
    icon: UserPlus,
    href: '/app/team?invite=true',
    keywords: ['add member', 'invite', 'user'],
  },
];

const QUICK_LINK_ITEMS: CommandItem[] = [
  {
    id: 'link-profile',
    label: 'Profile',
    icon: User,
    href: '/app/settings/profile',
    keywords: ['account', 'my profile', 'personal'],
  },
  {
    id: 'link-security',
    label: 'Security Settings',
    icon: ShieldCheck,
    href: '/app/settings/security',
    keywords: ['password', 'mfa', '2fa', 'authentication'],
  },
  {
    id: 'link-help',
    label: 'Help & Support',
    icon: HelpCircle,
    href: '/app/help',
    keywords: ['support', 'documentation', 'faq', 'contact'],
  },
];

const COMMAND_GROUPS: CommandGroup[] = [
  { heading: 'Navigation', items: NAVIGATION_ITEMS },
  { heading: 'Actions', items: ACTION_ITEMS },
  { heading: 'Quick Links', items: QUICK_LINK_ITEMS },
];

// ---------------------------------------------------------------------------
// Overlay animation variants
// ---------------------------------------------------------------------------

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 400 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: { duration: 0.15 },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Platform detection for shortcut display
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.platform?.toLowerCase().includes('mac') ?? true;
  }, []);

  // -----------------------------------------------------------------------
  // Keyboard shortcut: Cmd+K / Ctrl+K
  // -----------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k';
      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && isK) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Listen for custom event from TopBar / Sidebar click
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-command-menu', openHandler);
    return () => window.removeEventListener('open-command-menu', openHandler);
  }, []);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // -----------------------------------------------------------------------
  // Run a command (navigate or execute action) and close
  // -----------------------------------------------------------------------
  const runCommand = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [router],
  );

  return (
    <>
      {/* Mobile floating trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-[0_8px_24px_rgba(0,212,251,0.3)] transition-transform hover:scale-105 active:scale-95 md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Command palette dialog */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="command-palette-overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog container */}
            <motion.div
              key="command-palette-dialog"
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh] sm:pt-[20vh]"
            >
              <Command
                className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1c]/95 shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl"
                label="Command Palette"
                loop
                shouldFilter={true}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
                  <Search className="h-4 w-4 shrink-0 text-slate-500" />
                  <Command.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Type a command or search..."
                    autoFocus
                    className="h-14 w-full border-none bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  />
                  <div className="flex shrink-0 items-center gap-1.5">
                    <kbd className="hidden select-none items-center rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-500 sm:inline-flex">
                      {isMac ? '\u2318' : 'Ctrl'}
                    </kbd>
                    <kbd className="hidden select-none items-center rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-500 sm:inline-flex">
                      K
                    </kbd>
                  </div>
                </div>

                {/* Results list */}
                <Command.List className="max-h-[320px] overflow-y-auto overscroll-contain p-2 scrollbar-hide">
                  <Command.Empty className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-3 h-8 w-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">
                      No results found
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Try a different search term
                    </p>
                  </Command.Empty>

                  {COMMAND_GROUPS.map((group) => (
                    <Command.Group
                      key={group.heading}
                      heading={group.heading}
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2',
                        '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold',
                        '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest',
                        '[&_[cmdk-group-heading]]:text-slate-500',
                      )}
                    >
                      {group.items.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={[item.label, ...(item.keywords ?? [])].join(
                            ' ',
                          )}
                          onSelect={() => runCommand(item)}
                          className={cn(
                            'group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                            'text-sm font-medium text-slate-400',
                            'transition-colors duration-100',
                            'aria-selected:bg-white/[0.06] aria-selected:text-slate-100',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              'bg-white/[0.04] text-slate-500',
                              'transition-colors duration-100',
                              'group-aria-selected:bg-cyan-500/10 group-aria-selected:text-cyan-400',
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.shortcut && (
                            <kbd className="hidden select-none rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-600 sm:inline-flex">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className="h-3 w-3 shrink-0 text-slate-600 opacity-0 transition-opacity group-aria-selected:opacity-100" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
                  <div className="flex items-center gap-3 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">
                        &uarr;
                      </kbd>
                      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">
                        &darr;
                      </kbd>
                      <span className="ml-0.5">Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">
                        &crarr;
                      </kbd>
                      <span className="ml-0.5">Select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[10px]">
                        Esc
                      </kbd>
                      <span className="ml-0.5">Close</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600">
                    FormaOS Command Palette
                  </span>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
