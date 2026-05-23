import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * v4-029: shared Breadcrumbs primitive. Deep detail routes
 * previously rendered ad-hoc `<ArrowLeft>` back-links that varied
 * per page; this gives a consistent hierarchical nav (Home →
 * Section → Detail) for keyboard + screen-reader users.
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: 'Participants', href: '/app/participants' },
 *     { label: participantName },
 *   ]} />
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-muted-foreground ${className ?? ''}`}
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-foreground font-medium' : ''}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="h-3 w-3 text-muted-foreground/50"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
