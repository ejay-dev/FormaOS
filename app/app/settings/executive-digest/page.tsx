import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { Mail, Calendar, Users, Clock } from 'lucide-react';

export const metadata = { title: 'Executive Digest Settings' };

export default async function ExecutiveDigestSettingsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

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

  // Fetch members for recipient selection
  const { data: members } = await db
    .from('org_memberships')
    .select('profiles(email, display_name)')
    .eq('organization_id', state.organization.id)
    .in('role', ['owner', 'admin']);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Executive Digest</h1>
        <p className="text-muted-foreground">
          Configure automated compliance summary emails for your leadership
          team.
        </p>
      </div>

      <div className="border border-border rounded-lg p-6 bg-card space-y-6">
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
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              config.enabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Frequency */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="digest-frequency" className="text-sm font-medium">
              Frequency
            </label>
          </div>
          <div className="flex gap-3">
            <div
              className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                config.frequency === 'weekly'
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <p className="text-sm font-medium">Weekly</p>
              <p className="text-xs text-muted-foreground">
                Mondays at 8:00 AM
              </p>
            </div>
            <div
              className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                config.frequency === 'monthly'
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <p className="text-sm font-medium">Monthly</p>
              <p className="text-xs text-muted-foreground">
                1st of month at 8:00 AM
              </p>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <label htmlFor="digest-recipients" className="text-sm font-medium">
              Recipients
            </label>
          </div>
          <div className="space-y-1.5">
            {(members ?? []).map((m) => {
              const profileRaw = m.profiles as any;
              const profile = Array.isArray(profileRaw)
                ? profileRaw[0]
                : profileRaw;
              if (!profile?.email) return null;
              const isSelected = config.recipients?.includes(profile.email);
              return (
                <label
                  key={profile.email}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    defaultChecked={isSelected}
                    className="rounded border-input"
                    disabled
                  />
                  <div>
                    <p className="text-sm">
                      {profile.display_name ?? profile.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Only owners and admins are shown. Additional recipients can be added
            via API.
          </p>
        </div>

        {/* Last sent */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Settings are updated via the settings API. Preview digest from the
          executive dashboard.
        </div>
      </div>
    </div>
  );
}
