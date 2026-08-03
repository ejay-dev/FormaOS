import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function NotificationSettingsLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading notification settings"
      className="space-y-8 animate-in fade-in duration-300"
    >
      <header className="space-y-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground/70">
          Delivery preferences
        </h1>
        <Skeleton className="h-4 w-[32rem]" />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="space-y-3 rounded-3xl border border-edge-2 bg-surface-1 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-2xl border border-edge-2 bg-background/40 px-4 py-5"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}
