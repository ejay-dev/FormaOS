import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function AppComplianceFrameworksLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading frameworks"
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
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>

      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}
