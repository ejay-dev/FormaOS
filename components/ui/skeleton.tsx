/**
 * Reusable skeleton primitives for loading states.
 * Used by route-level loading.tsx files to show instant placeholders.
 */

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-white/5',
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4', className)}>
      <Skeleton className="h-4 w-1/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex gap-6 px-6 py-4 border-b border-white/10">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-white/5 last:border-b-0">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Page-level skeleton: header + stat cards + table */
export function PageSkeleton({
  title,
  cards = 0,
  tableRows = 5,
}: {
  title?: string;
  cards?: number;
  tableRows?: number;
}) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page header */}
      <div className="space-y-2">
        {title ? (
          <h1 className="text-3xl font-bold text-slate-100/50 tracking-tight">{title}</h1>
        ) : (
          <Skeleton className="h-8 w-48" />
        )}
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards */}
      {cards > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Table */}
      {tableRows > 0 && <SkeletonTable rows={tableRows} />}
    </div>
  );
}
