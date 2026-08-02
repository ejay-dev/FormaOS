import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';

export default function AppComplianceCrossMapLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading the cross-map"
      className="space-y-6 animate-in fade-in duration-300"
    >
      {/* Mirrors the PageHero band this route resolves into so the page does
          not restructure when data arrives. */}
      <section className="relative overflow-hidden rounded-xl border border-border bg-card">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-primary" />
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-8 w-14" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <SkeletonTable rows={4} />

      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}
