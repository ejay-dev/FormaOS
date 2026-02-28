'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

/* ── Link data ───────────────────────────────────────────── */

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Product' },
  { href: '/industries', label: 'Industries' },
  { href: '/security', label: 'Security' },
  { href: '/trust', label: 'Trust' },
  { href: '/pricing', label: 'Pricing' },
];

const outcomeLinks = [
  { href: '/evaluate', label: 'Evaluate' },
  { href: '/prove', label: 'Prove' },
  { href: '/operate', label: 'Operate' },
  { href: '/govern', label: 'Govern' },
];

const resourceLinks = [
  { href: '/security-review', label: 'Security Review Packet' },
  { href: '/security-review/faq', label: 'Security Review FAQ' },
  { href: '/trust/packet', label: 'Trust Packet (PDF)' },
  { href: '/frameworks', label: 'Framework Coverage' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/customer-stories', label: 'Customer Stories' },
  { href: '/compare', label: 'Compare' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/status', label: 'Status' },
  { href: '/docs', label: 'Documentation' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/* ── Accessible dropdown ─────────────────────────────────── */

function NavDropdown({
  label,
  items,
  pathname,
  wide,
}: {
  label: string;
  items: { href: string; label: string }[];
  pathname: string;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const baseId = label.toLowerCase().replace(/\s+/g, '-');
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      const first = ref.current?.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  const hasActiveChild = items.some((l) => pathname === l.href);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className={clsx(
          'mk-nav-item flex cursor-pointer items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
          hasActiveChild && 'mk-nav-item--active',
        )}
      >
        {label}
        <ChevronDown
          className={clsx(
            'h-3 w-3 opacity-50 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div
          className={clsx(
            'mk-dropdown-panel mk-dropdown-surface absolute right-0 top-full mt-3 z-50 rounded-xl p-1.5',
            wide ? 'min-w-[15rem]' : 'min-w-[11rem]',
          )}
          role="menu"
          id={menuId}
          aria-labelledby={triggerId}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                tabIndex={0}
                onClick={() => setOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
                  }
                }}
                className={clsx(
                  'block rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-200'
                    : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── NavLinks ────────────────────────────────────────────── */

interface NavLinksProps {
  variant?: 'desktop' | 'mobile';
  onLinkClick?: () => void;
}

export function NavLinks({ variant = 'desktop', onLinkClick }: NavLinksProps) {
  const pathname = usePathname() || '/';

  /* ── Mobile ──────────────────────────────────────────── */
  if (variant === 'mobile') {
    return (
      <div className="text-sm space-y-1">
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          Pages
        </div>
        {primaryLinks.map((l) => {
          const isActive = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onLinkClick}
              className={clsx(
                'block rounded-xl px-4 py-3 transition-all',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white',
              )}
              style={{ whiteSpace: 'nowrap' }}
              aria-current={isActive ? 'page' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
        <div className="mx-4 my-2 h-px bg-white/10" />
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          Outcome Journeys
        </div>
        {outcomeLinks.map((l) => {
          const isActive = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onLinkClick}
              className={clsx(
                'block rounded-xl px-4 py-3 transition-all',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white',
              )}
              style={{ whiteSpace: 'nowrap' }}
              aria-current={isActive ? 'page' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
        <div className="mx-4 my-2 h-px bg-white/10" />
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          Resources
        </div>
        {resourceLinks.map((l) => {
          const isActive = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onLinkClick}
              className={clsx(
                'block rounded-xl px-4 py-3 transition-all',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
                  : 'hover:bg-white/5 text-slate-300 hover:text-white',
              )}
              style={{ whiteSpace: 'nowrap' }}
              aria-current={isActive ? 'page' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    );
  }

  /* ── Desktop ─────────────────────────────────────────── */
  return (
    <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 lg:gap-1 text-[13.5px] lg:text-[14px] font-medium tracking-[0.01em]">
      {/* Primary links */}
      {primaryLinks.map((l) => {
        const isActive = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              'mk-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
              isActive && 'mk-nav-item--active',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {l.label}
          </Link>
        );
      })}

      {/* Divider */}
      <div className="mk-nav-divider" aria-hidden="true" />

      {/* Dropdowns on the right */}
      <NavDropdown label="Outcomes" items={outcomeLinks} pathname={pathname} />
      <NavDropdown label="Resources" items={resourceLinks} pathname={pathname} wide />
    </nav>
  );
}
