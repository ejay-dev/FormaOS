export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-56 animate-pulse rounded-md bg-slate-800" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
        <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
        <div className="h-24 animate-pulse rounded-lg bg-slate-900/60" />
      </div>
      <div className="h-28 animate-pulse rounded-lg bg-slate-900/60" />
      <div className="h-28 animate-pulse rounded-lg bg-slate-900/60" />
    </div>
  );
}
