'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MoreSheetItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

export type MoreSheetGroup = {
  label: string;
  items: MoreSheetItem[];
};

/**
 * The overflow half of the mobile navigation. Every group and item is
 * handed in by the bottom nav, which builds them from the same
 * getIndustryNavigation() call the desktop sidebar uses — so the sheet
 * cannot offer a surface the sidebar lacks, name it differently, or show
 * an aged-care organisation a route that only exists for NDIS providers.
 */
export function MobileMoreSheet({
  open,
  onClose,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  groups: MoreSheetGroup[];
}) {
  const pathname = usePathname() ?? '';
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Pathname as at the moment the sheet opened. Used to close on a
  // navigation the sheet did not initiate (browser back, for example)
  // without closing on the render that opens it.
  const openedAtPath = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      openedAtPath.current = null;
      return;
    }
    if (openedAtPath.current === null) {
      openedAtPath.current = pathname;
      return;
    }
    if (openedAtPath.current !== pathname) onClose();
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
        className="absolute inset-0 bg-black/60 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full rounded-t-2xl bg-card border-t border-border shadow-2xl',
          'animate-in slide-in-from-bottom duration-200',
          'pb-[max(env(safe-area-inset-bottom),1rem)]',
          'max-h-[80dvh] overflow-y-auto overscroll-contain',
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">More</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-3 py-3">
          {groups.map((group) => (
            <section key={group.label}>
              <div className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              <ul className="grid grid-cols-1 gap-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-[48px] items-center gap-3 rounded-lg px-3 py-3',
                          'transition-colors',
                          active
                            ? 'bg-foreground/10 text-foreground'
                            : 'text-foreground/85 hover:bg-muted/40',
                        )}
                      >
                        <item.Icon className="h-5 w-5 shrink-0 opacity-80" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
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
