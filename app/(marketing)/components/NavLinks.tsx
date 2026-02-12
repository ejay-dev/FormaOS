'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

const links = [
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
  { href: '/customer-stories', label: 'Customer Stories' },
  { href: '/compare', label: 'Compare' },
  { href: '/status', label: 'Status' },
  { href: '/docs', label: 'Documentation' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/* ─── Accessible dropdown for desktop nav ────────────────── */

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

  // Close on outside click
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
      const firstItem = ref.current?.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
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
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="true"
        className={clsx(
          'mk-nav-link flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
          hasActiveChild && 'mk-nav-link--active text-white',
        )}
      >
        {label}
        <ChevronDown
          className={clsx(
            'h-3.5 w-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div
          className={clsx(
            'mk-dropdown-panel absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-lg',
            wide ? 'min-w-[14rem]' : 'min-w-[12rem]',
          )}
          role="menu"
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
                    const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                    next?.focus();
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
                    prev?.focus();
                  }
                }}
                className={clsx(
                  'block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-200'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
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

/* ─── NavLinks ───────────────────────────────────────────── */

interface NavLinksProps {
  variant?: 'desktop' | 'mobile';
  onLinkClick?: () => void;
}

export function NavLinks({ variant = 'desktop', onLinkClick }: NavLinksProps) {
  const pathname = usePathname() || '/';

  if (variant === 'mobile') {
    return (
      <div className="text-sm space-y-1">
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
              aria-current={isActive ? 'page' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
        <div className="mx-4 my-2 h-px bg-white/10" />
        {links.map((l) => {
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
              aria-current={isActive ? 'page' : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 text-[13.5px] lg:text-[14px] font-medium tracking-[0.01em]">
      <NavDropdown label="Outcomes" items={outcomeLinks} pathname={pathname} />
      <NavDropdown label="Resources" items={resourceLinks} pathname={pathname} wide />
      {links.map((l) => {
        const isActive = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={clsx(
              'mk-nav-link rounded-lg px-3 py-1.5 text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
              isActive && 'mk-nav-link--active text-white',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
