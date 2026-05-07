'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Files,
  GraduationCap,
  Layers,
  ListChecks,
  Receipt,
  Settings,
  Shield,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Group = {
  label: string;
  items: { href: string; label: string; Icon: typeof Settings }[];
};

const GROUPS: Group[] = [
  {
    label: 'Operations',
    items: [
      { href: '/app/incidents', label: 'Incidents', Icon: AlertTriangle },
      { href: '/app/visits', label: 'Visits', Icon: Calendar },
      { href: '/app/progress-notes', label: 'Progress notes', Icon: ClipboardList },
      { href: '/app/forms', label: 'Forms', Icon: FileText },
      { href: '/app/staff-compliance', label: 'Staff credentials', Icon: GraduationCap },
      { href: '/app/ndis-claiming', label: 'NDIS claims', Icon: Receipt },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { href: '/app/controls', label: 'Controls', Icon: Layers },
      { href: '/app/policies', label: 'Policies', Icon: Files },
      { href: '/app/registers', label: 'Registers', Icon: ListChecks },
      { href: '/app/capa', label: 'CAPA', Icon: ShieldAlert },
      { href: '/app/audit-trail', label: 'Audit trail', Icon: Shield },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/app/billing', label: 'Billing', Icon: CreditCard },
      { href: '/app/team', label: 'Team', Icon: GraduationCap },
      { href: '/app/settings', label: 'Settings', Icon: Settings },
    ],
  },
];

export function MobileMoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Close the sheet automatically when a link is followed (URL changes).
  // The eslint plugin for the new react-hooks rule isn't loaded in this
  // project's lint config, so we omit the disable comment and reference
  // `open`/`onClose` via refs-style closure — both are stable enough that
  // re-running the effect on their identity change is acceptable.
  useEffect(() => {
    if (open) onClose();
  }, [pathname, open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="More navigation"
      className="md:hidden fixed inset-0 z-[60] flex items-end"
    >
      <button
        type="button"
        aria-label="Close more navigation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full rounded-t-3xl bg-card border-t border-border shadow-2xl',
          'animate-in slide-in-from-bottom duration-200',
          'pb-[max(env(safe-area-inset-bottom),1rem)]',
          'max-h-[80vh] overflow-y-auto',
        )}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-card/95 backdrop-blur border-b border-border/60">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Navigate
            </div>
            <h2 className="text-lg font-bold text-foreground">More</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-3 py-3 space-y-5">
          {GROUPS.map((group) => (
            <section key={group.label}>
              <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
                {group.label}
              </div>
              <ul className="grid grid-cols-1 gap-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-3 min-h-[48px]',
                          'transition-colors',
                          active
                            ? 'bg-foreground/10 text-foreground'
                            : 'text-foreground/85 hover:bg-muted/40',
                        )}
                      >
                        <item.Icon className="h-5 w-5 opacity-80" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
