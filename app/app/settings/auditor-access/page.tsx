import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { listAuditorAccess, getAuditorActivity } from '@/lib/auditor/portal';
import { Shield, Clock, Eye, Plus } from 'lucide-react';

export const metadata = { title: 'Auditor Access | Settings | FormaOS' };

export default async function AuditorAccessPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const tokens = await listAuditorAccess(state.organization.id);
  const activity = await getAuditorActivity(state.organization.id);

  const statusBadge: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400',
    expired: 'bg-gray-500/10 text-gray-400',
    revoked: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auditor Access</h1>
          <p className="text-sm text-muted-foreground">
            Manage external auditor access to your compliance data.
          </p>
        </div>
        <a
          href="/app/settings/auditor-access/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Grant Access
        </a>
      </div>

      {/* Active tokens */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Access Grants ({tokens.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {tokens.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t.auditor_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.auditor_email}{' '}
                    {t.auditor_company ? `• ${t.auditor_company}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {t.access_count ?? 0} views
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(t.expires_at).toLocaleDateString()}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[t.status] ?? ''}`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
          {tokens.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No auditor access grants yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Recent Activity</h2>
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
    </div>
  );
}
