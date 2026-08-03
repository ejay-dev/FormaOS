'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { name: 'Admin audit trail', href: '/admin/security' },
  { name: 'Live alerts', href: '/admin/security-live' },
  { name: 'Triage queue', href: '/admin/security/triage' },
] as const;

export function SecurityTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Security views"
      className="flex flex-wrap gap-6 border-b border-border"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${
              isActive
                ? 'border-foreground font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
