import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';

export default async function NotificationSettingsPage() {
  const systemState = await fetchSystemState();

  if (!systemState) {
    redirect('/auth/signin');
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.26em] text-sky-200">
          Notifications
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">
          Delivery Preferences
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Control in-app alerts, digests, Slack and Teams routing, plus quiet hours.
        </p>
      </header>

      <NotificationPreferences orgId={systemState.organization.id} />
    </div>
  );
}
