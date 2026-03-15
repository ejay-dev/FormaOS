import { SkeletonCard } from '@/components/ui/skeleton';

export default function Soc2Loading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse" />
        <div className="mt-2 h-4 w-96 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <SkeletonCard className="h-64 w-64" />
        <SkeletonCard className="h-64" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>
      <SkeletonCard className="h-96" />
    </div>
  );
}
