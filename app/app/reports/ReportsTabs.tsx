import Link from 'next/link';

const TABS = [
  { href: '/app/reports', label: 'Standard' },
  { href: '/app/reports/custom', label: 'My reports' },
  { href: '/app/reports/trends', label: 'Trends' },
] as const;

export type ReportsTab = (typeof TABS)[number]['href'];

/**
 * One switch for the three report surfaces. The current tab is plain text,
 * not a chip, so nothing that cannot be clicked looks clickable.
 */
export function ReportsTabs({ current }: { current: ReportsTab }) {
  return (
    <nav aria-label="Reports sections" className="flex items-center gap-1">
      {TABS.map((tab) =>
        tab.href === current ? (
          <span
            key={tab.href}
            aria-current="page"
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tab.label}
          </Link>
        ),
      )}
    </nav>
  );
}
