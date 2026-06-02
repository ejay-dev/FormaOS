import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchSystemState } from '@/lib/system-state/server';
import { Mail, Calendar, Users, Clock } from 'lucide-react';
import { saveExecutiveDigestSettings } from './actions';

export const metadata = { title: 'Executive Digest Settings' };

export default async function ExecutiveDigestSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  const resolved = (await searchParams) ?? {};

  const db = await createSupabaseServerClient();

  const { data: setting } = await db
    .from('org_settings')
    .select('value')
    .eq('organization_id', state.organization.id)
    .eq('key', 'executive_digest')
    .maybeSingle();

  const config = (setting?.value as {
    enabled?: boolean;
    frequency?: string;
    recipients?: string[];
  }) ?? {
    enabled: false,
    frequency: 'weekly',
    recipients: [],
  };

  // Recipients = owner/admin members. The old query read the empty legacy
  // `org_memberships` with a broken `profiles` embed; use `org_members`
  // (RLS-readable) + a user_profiles lookup by user_id via the admin client
  // (user_profiles is not a tenant-scoped table; ids are this org's members).
  const { data: memberRows } = await db
    .from('org_members')
    .select('user_id, role')
    .eq('organization_id', state.organization.id)
    .in('role', ['owner', 'admin']);

  const memberIds = (memberRows ?? [])
    .map((m: { user_id: string }) => m.user_id)
    .filter(Boolean);

  let recipientsList: Array<{ email: string; name: string }> = [];
  if (memberIds.length > 0) {
    const admin = createSupabaseAdminClient();
    const { data: profiles } = await admin
      .from('user_profiles')
      .select('user_id, full_name, email')
      .in('user_id', memberIds);
    recipientsList = ((profiles ?? []) as Array<{
      full_name?: string | null;
      email?: string | null;
    }>)
      .filter((p) => !!p.email)
      .map((p) => ({ email: p.email as string, name: p.full_name || p.email! }));
  }

  const saved = resolved.saved === '1';
  const errored = typeof resolved.error === 'string';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Executive Digest</h1>
        <p className="text-muted-foreground">
          Configure automated compliance summary emails for your leadership
          team.
        </p>
      </div>

      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Digest settings saved.
        </div>
      )}
      {errored && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          Could not save your settings. Please try again.
        </div>
      )}

      <form
        action={saveExecutiveDigestSettings}
        className="border border-border rounded-lg p-6 bg-card space-y-6"
      >
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Enable Digest</p>
              <p className="text-sm text-muted-foreground">
                Send automated compliance summaries.
              </p>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={config.enabled ?? false}
              className="rounded border-input"
            />
            <span className="text-sm">Enabled</span>
          </label>
        </div>

        {/* Frequency */}
        <fieldset>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <legend className="text-sm font-medium">Frequency</legend>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="frequency"
                value="weekly"
                defaultChecked={(config.frequency ?? 'weekly') !== 'monthly'}
                className="mr-2"
              />
              <span className="text-sm font-medium">Weekly</span>
              <p className="text-xs text-muted-foreground mt-1">
                Mondays at 8:00 AM
              </p>
            </label>
            <label className="flex-1 p-3 rounded-lg border border-border cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="frequency"
                value="monthly"
                defaultChecked={config.frequency === 'monthly'}
                className="mr-2"
              />
              <span className="text-sm font-medium">Monthly</span>
              <p className="text-xs text-muted-foreground mt-1">
                1st of month at 8:00 AM
              </p>
            </label>
          </div>
        </fieldset>

        {/* Recipients */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Recipients</span>
          </div>
          <div className="space-y-1.5">
            {recipientsList.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No owner/admin members with an email on file.
              </p>
            ) : (
              recipientsList.map((r) => (
                <label
                  key={r.email}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="recipients"
                    value={r.email}
                    defaultChecked={config.recipients?.includes(r.email)}
                    className="rounded border-input"
                  />
                  <div>
                    <p className="text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Only owners and admins are shown.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Preview the digest from the executive dashboard.
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
