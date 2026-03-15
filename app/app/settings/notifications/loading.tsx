import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function NotificationSettingsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-sky-200">
          Notifications
        </p>
        <h1 className="text-4xl font-black tracking-tight text-slate-100/50">
          Delivery Preferences
        </h1>
        <Skeleton className="h-4 w-[32rem]" />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-5"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-7 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
