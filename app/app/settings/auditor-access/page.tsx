import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { listAuditorAccess, getAuditorActivity } from '@/lib/auditor/portal';
import { revokeAuditorGrant } from '@/app/app/actions/auditor-access';
import { Shield, Clock, Eye, Plus } from 'lucide-react';
import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { StatusBadge, type StatusTone } from '@/components/compliance/StatusBadge';
import { AuditorLink } from './auditor-link';
import { getAppBaseUrl } from '@/lib/urls';

export const metadata = { title: 'Auditor access | Settings | FormaOS' };

const GRANT_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  expired: { label: 'Expired', tone: 'neutral' },
  revoked: { label: 'Revoked', tone: 'danger' },
};

const ERROR_MESSAGES: Record<string, string> = {
  forbidden:
    'Only workspace owners and admins can grant or revoke auditor access.',
  'revoke-failed': 'That grant could not be revoked. Refresh and try again.',
};

export default async function AuditorAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ granted?: string; revoked?: string; error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const { granted, revoked, error } = await searchParams;
  const canManage = state.role === 'owner' || state.role === 'admin';
  const tokens = await listAuditorAccess(state.organization.id);
  const activity = await getAuditorActivity(state.organization.id);
  const grantedUrl = granted
    ? `${getAppBaseUrl()}/audit-portal/${encodeURIComponent(granted)}`
    : null;

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Auditor access"
        description="Time-limited, read-only links you issue to an external auditor."
        action={
          canManage ? (
            <Link
              href="/app/settings/auditor-access/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" />
              Grant access
            </Link>
          ) : null
        }
      />

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {ERROR_MESSAGES[error] ?? 'Something went wrong. Try again.'}
        </p>
      ) : null}

      {revoked ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
          Access revoked. The link no longer opens the auditor portal.
        </p>
      ) : null}

      {grantedUrl ? (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground">
            Send this link to the auditor
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            This is the only time the link is shown — it is stored hashed, so
            it cannot be looked up later. If you lose it, revoke the grant and
            issue a new one.
          </p>
          <AuditorLink url={grantedUrl} />
        </section>
      ) : null}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Access grants ({tokens.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {tokens.map((t) => {
            const status = GRANT_STATUS[t.status] ?? GRANT_STATUS.expired;

            return (
              <div
                key={t.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.auditor_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.auditor_email}{' '}
                      {t.auditor_company ? `• ${t.auditor_company}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {t.access_count ?? 0} views
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {t.status === 'revoked'
                      ? 'Revoked'
                      : `Expires ${new Date(t.expires_at).toLocaleDateString()}`}
                  </span>
                  <StatusBadge label={status.label} tone={status.tone} />
                  {canManage && t.status === 'active' ? (
                    <form action={revokeAuditorGrant}>
                      <input type="hidden" name="tokenId" value={t.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border px-2.5 py-1 text-sm font-medium text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Revoke
                        <span className="sr-only">
                          {' '}
                          access for {t.auditor_name}
                        </span>
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
          {tokens.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No auditor access grants yet.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Recent activity</h2>
        </div>
        <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
          {activity.slice(0, 50).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between px-4 py-2 text-xs"
            >
              <span className="text-muted-foreground">
                {a.action.replace('_', ' ')}
              </span>
              {a.resource_type && (
                <span className="text-muted-foreground">{a.resource_type}</span>
              )}
              <span className="text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </span>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </SettingsPageShell>
  );
}
