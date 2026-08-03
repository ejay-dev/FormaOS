'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Lock,
  Shield,
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
  Building2,
  DollarSign,
  Activity,
  Tag,
  LifeBuoy,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getIndustryNavigation,
  type NavItem,
} from '@/lib/navigation/industry-sidebar';

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

type SearchResultType = 'policy' | 'task' | 'evidence';

type SearchResultItem = {
  id: string;
  title: string;
  type: SearchResultType;
};

const RESULT_TYPE_LABELS: Record<SearchResultType, string> = {
  policy: 'Policy',
  task: 'Task',
  evidence: 'Evidence',
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

/**
 * The Navigation group is generated from the same getIndustryNavigation()
 * call the sidebar and the mobile bottom nav render, so a label, a target
 * or an entire module can never drift between the palette and the rest of
 * the product — including the care operations a support worker needs and
 * the compliance home at /app/compliance.
 *
 * Sub-items are included because a palette is where deep routes belong;
 * on the desktop sidebar they only appear once their parent is active.
 */
function buildNavigationItems(navigation: NavItem[]): CommandItem[] {
  const items: CommandItem[] = [];

  for (const entry of navigation) {
    if (entry.href.startsWith('#')) continue;

    items.push({
      id: `nav-${entry.href}`,
      label: entry.name,
      icon: entry.icon,
      href: entry.href,
      keywords: [entry.category],
    });

    for (const child of entry.children ?? []) {
      items.push({
        id: `nav-${child.href}`,
        label: `${entry.name} · ${child.name}`,
        icon: ChevronRight,
        href: child.href,
        keywords: [entry.category, child.name],
      });
    }
  }

  return items;
}

/**
 * `module` is the nav route the action lives inside. An action is only
 * offered when that route is in the person's navigation, so a support
 * worker on the restricted staff navigation is not invited to write a
 * policy or add a team member.
 */
const ACTION_ITEMS: (CommandItem & { module: string })[] = [
  {
    id: 'action-create-task',
    label: 'Create task',
    icon: Plus,
    href: '/app/tasks?new=true',
    module: '/app/tasks',
    keywords: ['new task', 'add task', 'todo'],
  },
  {
    id: 'action-upload-evidence',
    label: 'Upload evidence',
    icon: Upload,
    href: '/app/vault?upload=true',
    module: '/app/vault',
    keywords: ['upload', 'file', 'evidence', 'document'],
  },
  {
    id: 'action-new-policy',
    label: 'New policy',
    icon: FileText,
    href: '/app/policies?new=true',
    module: '/app/policies',
    keywords: ['create policy', 'add policy', 'document'],
  },
  {
    id: 'action-invite-member',
    label: 'Invite team member',
    icon: UserPlus,
    href: '/app/team?invite=true',
    module: '/app/team',
    keywords: ['add member', 'invite', 'user'],
  },
];

const QUICK_LINK_ITEMS: CommandItem[] = [
  {
    id: 'link-profile',
    label: 'Profile',
    icon: User,
    href: '/app/profile',
    keywords: ['account', 'my profile', 'personal'],
  },
  {
    id: 'link-security',
    label: 'Security settings',
    icon: ShieldCheck,
    href: '/app/settings/security',
    keywords: ['password', 'mfa', '2fa', 'authentication'],
  },
  {
    id: 'link-help',
    label: 'Help and support',
    icon: HelpCircle,
    href: '/documentation',
    keywords: ['support', 'documentation', 'faq', 'contact'],
  },
];

function buildAppCommandGroups(
  industry: string | null,
  role: string,
): CommandGroup[] {
  const { navigation } = getIndustryNavigation(industry, role);
  const moduleHrefs = new Set(navigation.map((item) => item.href));
  const navigationItems = buildNavigationItems(navigation);

  // Every industry navigation carries /app/team, but the default one an org
  // uses before it picks an industry does not — so a full membership would
  // otherwise lose both the Team route and the invite action that keys off it.
  // Added here on the same signal as Billing below rather than by narrowing
  // the palette to whatever the sidebar happens to list.
  if (moduleHrefs.has('/app/settings') && !moduleHrefs.has('/app/team')) {
    moduleHrefs.add('/app/team');
    navigationItems.push({
      id: 'nav-/app/team',
      label: 'Team',
      icon: Users,
      href: '/app/team',
      keywords: ['members', 'roles', 'permissions'],
    });
  }

  const quickLinks = [...QUICK_LINK_ITEMS];
  // Billing is reached from the account menu rather than any sidebar, so it
  // has to be added by hand — but only for the navigations that carry
  // organisation settings, which is what separates a full membership from
  // the restricted staff view.
  if (moduleHrefs.has('/app/settings')) {
    quickLinks.push({
      id: 'link-billing',
      label: 'Billing',
      icon: CreditCard,
      href: '/app/billing',
      keywords: ['subscription', 'plan', 'payment', 'invoice'],
    });
  }

  return [
    { heading: 'Navigation', items: navigationItems },
    {
      heading: 'Actions',
      items: ACTION_ITEMS.filter((item) => moduleHrefs.has(item.module)),
    },
    { heading: 'Quick links', items: quickLinks },
  ];
}

const ADMIN_NAV_ITEMS: CommandItem[] = [
  {
    id: 'admin-dashboard',
    label: 'Platform Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    keywords: ['overview', 'platform', 'metrics'],
  },
  {
    id: 'admin-orgs',
    label: 'Organizations',
    icon: Building2,
    href: '/admin/orgs',
    keywords: ['tenants', 'customers', 'accounts'],
  },
  {
    id: 'admin-users',
    label: 'Users',
    icon: Users,
    href: '/admin/users',
    keywords: ['members', 'accounts', 'identity'],
  },
  {
    id: 'admin-revenue',
    label: 'Revenue',
    icon: DollarSign,
    href: '/admin/revenue',
    keywords: ['mrr', 'arr', 'billing'],
  },
  {
    id: 'admin-trials',
    label: 'Trials',
    icon: CreditCard,
    href: '/admin/trials',
    keywords: ['conversion', 'trialing'],
  },
  {
    id: 'admin-security',
    label: 'Security',
    icon: Shield,
    href: '/admin/security',
    keywords: ['incidents', 'alerts'],
  },
  {
    id: 'admin-security-triage',
    label: 'Risk Triage',
    icon: ShieldCheck,
    href: '/admin/security/triage',
    keywords: ['triage', 'response', 'incident queue'],
  },
  {
    id: 'admin-system',
    label: 'System Health',
    icon: Activity,
    href: '/admin/system',
    keywords: ['status', 'ops', 'runtime'],
  },
  {
    id: 'admin-audit',
    label: 'Audit Stream',
    icon: History,
    href: '/admin/audit',
    keywords: ['changes', 'activity', 'trail'],
  },
  {
    id: 'admin-releases',
    label: 'Releases',
    icon: Tag,
    href: '/admin/releases',
    keywords: ['deploy', 'release', 'version'],
  },
  {
    id: 'admin-support',
    label: 'Support',
    icon: LifeBuoy,
    href: '/admin/support',
    keywords: ['tickets', 'helpdesk'],
  },
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    icon: Settings,
    href: '/admin/settings',
    keywords: ['preferences', 'configuration'],
  },
];

const ADMIN_ACTION_ITEMS: CommandItem[] = [
  {
    id: 'admin-action-risk-triage',
    label: 'Open Risk Triage',
    icon: ShieldCheck,
    href: '/admin/security/triage',
    keywords: ['triage', 'risk', 'alerts'],
  },
  {
    id: 'admin-action-org-search',
    label: 'Search Organizations',
    icon: Search,
    href: '/admin/orgs',
    keywords: ['tenant lookup', 'org search'],
  },
  {
    id: 'admin-action-user-search',
    label: 'Search Users',
    icon: User,
    href: '/admin/users',
    keywords: ['user lookup', 'email search'],
  },
];

const ADMIN_COMMAND_GROUPS: CommandGroup[] = [
  { heading: 'Admin Navigation', items: ADMIN_NAV_ITEMS },
  { heading: 'Operator Actions', items: ADMIN_ACTION_ITEMS },
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

const dialogVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({
  industry = null,
  role = 'owner',
}: {
  /** Organisation industry, so the Navigation group matches the sidebar. */
  industry?: string | null;
  /** Membership role — staff and viewer see the restricted navigation. */
  role?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [remoteResults, setRemoteResults] = useState<SearchResultItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isAdminContext = pathname?.startsWith('/admin') ?? false;
  const commandGroups = useMemo(
    () =>
      isAdminContext
        ? ADMIN_COMMAND_GROUPS
        : buildAppCommandGroups(industry, role),
    [isAdminContext, industry, role],
  );

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

  // Reset search when closing; focus input when opening
  useEffect(() => {
    if (!open) {
      setSearch('');
      setRemoteResults([]);
      setRemoteLoading(false);
    } else {
      // Defer focus until after animation frame so cmdk is mounted
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // -----------------------------------------------------------------------
  // Org-scoped remote search (server-backed)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!open || isAdminContext) return;

    const q = search.trim();
    if (q.length < 2) {
      setRemoteResults([]);
      setRemoteLoading(false);
      return;
    }

    const controller = new AbortController();
    const t = window.setTimeout(async () => {
      setRemoteLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&limit=6`,
          { method: 'GET', signal: controller.signal },
        );
        if (!res.ok) {
          setRemoteResults([]);
          setRemoteLoading(false);
          return;
        }
        const json = await res.json();
        const results = (json?.results ?? []) as SearchResultItem[];
        setRemoteResults(results);
        setRemoteLoading(false);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setRemoteResults([]);
        setRemoteLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(t);
    };
  }, [open, search, isAdminContext]);

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
      {/* Admin has no small-viewport search of its own — the admin quick
          search is lg-and-up — so the palette carries its own trigger
          there. Inside /app the topbar already has a mobile search button
          wired to the same event, and the bottom-right corner is already
          carrying the help and feedback controls. */}
      {isAdminContext && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open command palette"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-opacity hover:opacity-90 md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

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
              // Audit Sprint 6b: token-scaled. Command palette is a
              // top-level modal; uses the same backdrop/content tokens
              // as the shared dialog primitive.
              style={{ zIndex: 'var(--z-modal-backdrop)' }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog container */}
            <motion.div
              key="command-palette-dialog"
              variants={
                prefersReducedMotion ? dialogVariantsReduced : dialogVariants
              }
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              style={{ zIndex: 'var(--z-modal)' }}
              className="fixed inset-0 flex items-start justify-center px-4 pt-[6vh] pb-[max(env(safe-area-inset-bottom),1rem)] sm:pt-[20vh]"
              // This container sits over the backdrop and fills the screen,
              // so the backdrop's own click handler never sees a click on
              // empty space. Dismissal has to be handled here.
              onClick={(event) => {
                if (event.target === event.currentTarget) setOpen(false);
              }}
            >
              <Command
                className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-popover shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl"
                label="Command Palette"
                loop
                shouldFilter={true}
              >
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <Command.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder={
                      isAdminContext
                        ? 'Type an admin command or route...'
                        : 'Type a command or search...'
                    }
                    className="h-14 w-full border-none bg-transparent text-sm text-foreground/90 outline-none placeholder:text-muted-foreground/60"
                  />
                  <div className="flex shrink-0 items-center gap-1.5">
                    <kbd className="hidden select-none items-center rounded-md border border-border bg-surface-1 px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground/60 sm:inline-flex">
                      {isMac ? '\u2318' : 'Ctrl'}
                    </kbd>
                    <kbd className="hidden select-none items-center rounded-md border border-border bg-surface-1 px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground/60 sm:inline-flex">
                      K
                    </kbd>
                  </div>
                </div>

                {/* Results list */}
                {/* On a phone the on-screen keyboard takes roughly half the
                    viewport, so the list is capped against the dynamic
                    viewport rather than a fixed pixel height. */}
                <Command.List className="max-h-[min(320px,45dvh)] overflow-y-auto overscroll-contain p-2 scrollbar-hide">
                  <Command.Empty className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No results found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/40">
                      Try a different search term
                    </p>
                  </Command.Empty>

                  {!isAdminContext && search.trim().length >= 2 ? (
                    <Command.Group
                      heading="Results"
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2',
                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                        '[&_[cmdk-group-heading]]:text-muted-foreground',
                      )}
                    >
                      {remoteLoading ? (
                        <Command.Item
                          value="Loading results"
                          disabled
                          className={cn(
                            'flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5',
                            'text-sm font-medium text-muted-foreground/60',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              'bg-surface-1 text-muted-foreground/40',
                            )}
                          >
                            <Search className="h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate">
                            Searching your workspace...
                          </span>
                        </Command.Item>
                      ) : null}

                      {!remoteLoading && remoteResults.length === 0 ? (
                        <Command.Item
                          value="No workspace results"
                          disabled
                          className={cn(
                            'flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5',
                            'text-sm font-medium text-muted-foreground/40',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              'bg-surface-1 text-muted-foreground/30',
                            )}
                          >
                            <Search className="h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate">
                            No workspace matches
                          </span>
                        </Command.Item>
                      ) : null}

                      {!remoteLoading
                        ? remoteResults.map((r) => {
                            const icon =
                              r.type === 'policy'
                                ? FileText
                                : r.type === 'task'
                                  ? CheckSquare
                                  : Lock;
                            const href =
                              r.type === 'policy'
                                ? `/app/policies/${r.id}`
                                : r.type === 'task'
                                  ? '/app/tasks'
                                  : '/app/vault';

                            return (
                              <Command.Item
                                key={`${r.type}:${r.id}`}
                                value={[r.title, r.type].join(' ')}
                                onSelect={() =>
                                  runCommand({
                                    id: `result-${r.type}-${r.id}`,
                                    label: r.title,
                                    icon,
                                    href,
                                  })
                                }
                                className={cn(
                                  'group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5',
                                  'text-sm font-medium text-muted-foreground',
                                  'transition-colors duration-100',
                                  'aria-selected:bg-surface-2 aria-selected:text-foreground',
                                )}
                              >
                                <div
                                  className={cn(
                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                    'bg-surface-1 text-muted-foreground/60',
                                    'transition-colors duration-100',
                                    'group-aria-selected:bg-primary/10 group-aria-selected:text-primary',
                                  )}
                                >
                                  {React.createElement(icon, {
                                    className: 'h-4 w-4',
                                  })}
                                </div>
                                <span className="flex-1 truncate">
                                  {r.title}
                                </span>
                                <span className="hidden shrink-0 rounded-md border border-border bg-surface-1 px-2 py-1 text-xs font-medium text-muted-foreground/60 sm:inline">
                                  {RESULT_TYPE_LABELS[r.type]}
                                </span>
                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-aria-selected:opacity-100" />
                              </Command.Item>
                            );
                          })
                        : null}
                    </Command.Group>
                  ) : null}

                  {commandGroups.map((group) => (
                    <Command.Group
                      key={group.heading}
                      heading={group.heading}
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2',
                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                        '[&_[cmdk-group-heading]]:text-muted-foreground',
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
                            'text-sm font-medium text-muted-foreground',
                            'transition-colors duration-100',
                            'aria-selected:bg-surface-2 aria-selected:text-foreground',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              'bg-surface-1 text-muted-foreground/60',
                              'transition-colors duration-100',
                              'group-aria-selected:bg-primary/10 group-aria-selected:text-primary',
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.shortcut && (
                            <kbd className="hidden select-none rounded-md border border-border bg-surface-1 px-1.5 py-0.5 font-mono text-xs text-muted-foreground/40 sm:inline-flex">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-aria-selected:opacity-100" />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                  <div className="hidden items-center gap-3 text-[11px] text-muted-foreground/40 sm:flex">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border bg-surface-1 px-1 py-0.5 font-mono text-xs">
                        &uarr;
                      </kbd>
                      <kbd className="rounded border border-border bg-surface-1 px-1 py-0.5 font-mono text-xs">
                        &darr;
                      </kbd>
                      <span className="ml-0.5">Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border bg-surface-1 px-1 py-0.5 font-mono text-xs">
                        &crarr;
                      </kbd>
                      <span className="ml-0.5">Select</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded border border-border bg-surface-1 px-1 py-0.5 font-mono text-xs">
                        Esc
                      </kbd>
                      <span className="ml-0.5">Close</span>
                    </span>
                  </div>
                  {/* There is no Escape key on a phone, so touch gets an
                      explicit way out. */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="-my-2 flex min-h-[44px] items-center px-1 text-sm font-medium text-muted-foreground sm:hidden"
                  >
                    Close
                  </button>
                  <span className="hidden text-[11px] text-muted-foreground/40 sm:inline">
                    FormaOS command palette
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
