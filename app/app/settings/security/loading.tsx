import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function SecuritySettingsLoading() {
  return (
    <div className="space-y-8 pb-24 max-w-5xl animate-in fade-in duration-300">
      <header className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-foreground/50">
              Security Controls
            </h1>
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
