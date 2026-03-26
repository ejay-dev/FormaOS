'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import {
  platformLinks,
  solutionLinks,
  trustLinks,
  resourceLinks,
  outcomeLinks,
} from '@/config/navigation';

/* ── Accessible dropdown ─────────────────────────────────── */

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  pathname: string;
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
      const first =
        ref.current?.querySelector<HTMLElement>('[role="menuitem"]');
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
            'mk-dropdown-panel mk-dropdown-surface absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 rounded-xl p-1.5 min-w-[13rem]',
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
                    (
                      e.currentTarget.nextElementSibling as HTMLElement | null
                    )?.focus();
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    (
                      e.currentTarget
                        .previousElementSibling as HTMLElement | null
                    )?.focus();
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

/* ── Mobile collapsible section ──────────────────────────── */

function MobileSection({
  label,
  items,
  pathname,
  open,
  onToggle,
  onLinkClick,
}: {
  label: string;
  items: readonly { href: string; label: string }[];
  pathname: string;
  open: boolean;
  onToggle: () => void;
  onLinkClick?: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-400 transition-colors"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          className={clsx(
            'h-3 w-3 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="space-y-1">
          {items.map((l) => {
            const isActive = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={onLinkClick}
                className={clsx(
                  'block rounded-xl px-4 py-3 transition-all text-sm leading-relaxed break-words',
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
      )}
    </>
  );
}

/* ── NavLinks ────────────────────────────────────────────── */

interface NavLinksProps {
  variant?: 'desktop' | 'mobile';
  onLinkClick?: () => void;
}

export function NavLinks({ variant = 'desktop', onLinkClick }: NavLinksProps) {
  const pathname = usePathname() || '/';
  const [mobileOpen, setMobileOpen] = useState<Record<string, boolean>>({});

  function toggleMobileSection(key: string) {
    setMobileOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /* ── Mobile ──────────────────────────────────────────── */
  if (variant === 'mobile') {
    const sections = [
      { key: 'platform', label: 'Platform', items: platformLinks },
      { key: 'solutions', label: 'Solutions', items: solutionLinks },
      { key: 'trust', label: 'Trust & Security', items: trustLinks },
      { key: 'resources', label: 'Resources', items: resourceLinks },
      { key: 'outcomes', label: 'Outcome Journeys', items: outcomeLinks },
    ];

    return (
      <div className="text-sm space-y-1">
        {/* Pricing — always visible as a direct link */}
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          Pages
        </div>
        <Link
          href="/pricing"
          onClick={onLinkClick}
          className={clsx(
            'block rounded-xl px-4 py-3 transition-all text-sm leading-relaxed',
            pathname === '/pricing'
              ? 'bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-300 border border-cyan-400/20'
              : 'hover:bg-white/5 text-slate-300 hover:text-white',
          )}
          aria-current={pathname === '/pricing' ? 'page' : undefined}
        >
          Pricing
        </Link>

        {sections.map((section, i) => (
          <div key={section.key}>
            {i === 0 && (
              <div className="mx-4 my-2 h-px bg-white/10" />
            )}
            <MobileSection
              label={section.label}
              items={section.items}
              pathname={pathname}
              open={!!mobileOpen[section.key]}
              onToggle={() => toggleMobileSection(section.key)}
              onLinkClick={onLinkClick}
            />
            {i < sections.length - 1 && (
              <div className="mx-4 my-2 h-px bg-white/10" />
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ── Desktop ─────────────────────────────────────────── */
  return (
    <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 lg:gap-1 text-[13.5px] lg:text-[14px] font-medium tracking-[0.01em]">
      <NavDropdown label="Platform" items={platformLinks} pathname={pathname} />
      <NavDropdown
        label="Solutions"
        items={solutionLinks}
        pathname={pathname}
      />
      <NavDropdown
        label="Trust &amp; Security"
        items={trustLinks}
        pathname={pathname}
      />

      {/* Pricing — direct link, no dropdown */}
      <Link
        href="/pricing"
        className={clsx(
          'mk-nav-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40',
          pathname === '/pricing' && 'mk-nav-item--active',
        )}
        aria-current={pathname === '/pricing' ? 'page' : undefined}
      >
        Pricing
      </Link>

      <NavDropdown
        label="Resources"
        items={resourceLinks}
        pathname={pathname}
      />
    </nav>
  );
}
