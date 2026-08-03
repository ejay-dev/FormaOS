import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function OnboardingRoadmapLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading the onboarding roadmap"
      className="space-y-6 pb-12 animate-in fade-in duration-300"
    >
      {/* The heading names the org's industry, so it stays a placeholder
          bar rather than guessing a title the page will replace. */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-edge-2 bg-surface-1 p-6">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-edge-2 bg-background/40 p-4"
              >
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
}
