import { ActivityFeed } from '@/components/activity/activity-feed';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';

export default async function ActivityPage() {
  const systemState = await fetchSystemState();

  if (!systemState) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-black uppercase tracking-[0.26em] text-sky-200">
          Activity Intelligence
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">
          Organization Activity Feed
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          Live audit-style activity for tasks, evidence, framework operations,
          team changes, workflow executions, and settings mutations.
        </p>
      </header>

      <ActivityFeed orgId={systemState.organization.id} />
    </div>
  );
}
