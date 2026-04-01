import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function OnboardingRoadmapLoading() {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Roadmap</p>
        <h1 className="text-2xl font-bold text-foreground/50">Industry Roadmap</h1>
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
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
    </div>
  );
}
