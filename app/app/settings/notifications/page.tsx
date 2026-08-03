import Link from 'next/link';
import { redirect } from 'next/navigation';

import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { EmailPreferencesForm } from '@/components/settings/email-preferences-form';
import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { fetchSystemState } from '@/lib/system-state/server';

export const metadata = { title: 'Communications | Settings | FormaOS' };

export default async function CommunicationSettingsPage() {
  const systemState = await fetchSystemState();

  if (!systemState) {
    redirect('/auth/signin');
  }

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Communications"
        description="Choose how FormaOS reaches you and which emails you receive."
        action={
          <Link
            href="/app/settings/email-history"
            className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Email history
          </Link>
        }
      />

      <section id="channels" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Delivery channels
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Where each notification lands — in-app, email, Slack, or Teams —
            plus quiet hours.
          </p>
        </div>
        <NotificationPreferences orgId={systemState.organization.id} />
      </section>

      <section id="email" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Emails from FormaOS
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These settings cover email sent to your account address. Channel
            routing above decides which events reach email in the first place.
          </p>
        </div>
        <EmailPreferencesForm />
      </section>

      <section id="executive-digest" className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Executive digest
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A scheduled compliance summary sent to owners and admins. Configured
            for the whole organisation rather than per person.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Link
            href="/app/settings/executive-digest"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Configure the executive digest
          </Link>
        </div>
      </section>
    </SettingsPageShell>
  );
}
