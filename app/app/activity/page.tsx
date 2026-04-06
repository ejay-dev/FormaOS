import { ActivityFeed } from '@/components/activity/activity-feed';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';

export default async function ActivityPage() {
  const systemState = await fetchSystemState();

  if (!systemState) {
    redirect('/auth/signin');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Feed</h1>
          <p className="page-description">Live audit-style activity for tasks, evidence, team changes, and more</p>
        </div>
      </div>

      <div className="page-content space-y-4">
      <ActivityFeed orgId={systemState.organization.id} />
      </div>
    </div>
  );
}
