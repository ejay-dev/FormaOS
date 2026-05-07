import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RecordList / RecordCard — the canonical mobile pattern for any data table
 * the app shows on desktop. Use it inside `<div className="md:hidden">`
 * alongside the existing `<table className="hidden md:table">` so each
 * record gets a tap-target sized card with clear hierarchy:
 *
 *   ┌────────────────────────────────────┐
 *   │ Title                  [Status]    │
 *   │ Subtitle / metadata line           │
 *   │ ▸ key: value · key: value          │
 *   │                          actions › │
 *   └────────────────────────────────────┘
 *
 * Cards are full-width, 64px+ tall, and either wrap a link (entire card is
 * tappable) or render plain when interactive children handle the tap.
 */

export type RecordMeta = {
  label: string;
  value: ReactNode;
};

interface BaseProps {
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  meta?: RecordMeta[];
  /** Optional secondary actions row at the bottom of the card. */
  actions?: ReactNode;
  className?: string;
}

interface LinkCardProps extends BaseProps {
  href: string;
  onClick?: never;
}
interface PlainCardProps extends BaseProps {
  href?: undefined;
  onClick?: () => void;
}

type RecordCardProps = LinkCardProps | PlainCardProps;

function CardBody({
  title,
  subtitle,
  status,
  meta,
  actions,
  showChevron,
}: BaseProps & { showChevron: boolean }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground leading-snug truncate">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-muted-foreground leading-snug truncate">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status}
          {showChevron && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
          )}
        </div>
      </div>
      {meta && meta.length > 0 && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {meta.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <dt className="uppercase tracking-wider text-muted-foreground/80">
                {m.label}
              </dt>
              <dd className="text-foreground/85 font-medium">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && (
        <div className="-mx-1 flex items-center gap-1 pt-1">{actions}</div>
      )}
    </div>
  );
}

export function RecordCard(props: RecordCardProps) {
  const { className, ...body } = props;
  const baseClass = cn(
    'block rounded-xl border border-border bg-card px-4 py-3.5',
    'min-h-[64px] active:scale-[0.99] transition-transform',
    'hover:border-border-strong hover:bg-muted/30 transition-colors',
    className,
  );

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={baseClass}>
        <CardBody {...body} showChevron />
      </Link>
    );
  }

  if ('onClick' in props && props.onClick) {
    return (
      <button type="button" onClick={props.onClick} className={cn(baseClass, 'text-left w-full')}>
        <CardBody {...body} showChevron={false} />
      </button>
    );
  }

  return (
    <div className={baseClass}>
      <CardBody {...body} showChevron={false} />
    </div>
  );
}

/**
 * Vertical stack of RecordCards with consistent spacing. Pair with
 * `<EmptyRecordState />` when the list is empty.
 */
export function RecordList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>;
}

export function EmptyRecordState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
