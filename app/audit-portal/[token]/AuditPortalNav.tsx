'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  { label: 'Overview', segment: '' },
  { label: 'Evidence', segment: 'evidence' },
  { label: 'Controls', segment: 'controls' },
  { label: 'Reports', segment: 'reports' },
];

export function AuditPortalNav({ token }: { token: string }) {
  const pathname = usePathname();
  const base = `/audit-portal/${token}`;

  return (
    <nav
      className="border-b border-border bg-card/50"
      aria-label="Audit portal"
    >
      <div className="mx-auto flex max-w-6xl gap-1 px-6">
        {SECTIONS.map((section) => {
          const href = section.segment ? `${base}/${section.segment}` : base;
          const isCurrent = pathname === href;
          return (
            <Link
              key={section.label}
              href={href}
              // Rendering a portal page writes to the auditor activity log, so
              // hovering a tab must not count as the auditor opening it.
              prefetch={false}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'border-b-2 border-foreground px-4 py-2.5 text-sm font-medium text-foreground'
                  : 'border-b-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground hover:border-border hover:text-foreground'
              }
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
