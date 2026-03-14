import Link from 'next/link';
import { getAdminFetchConfig } from '@/app/admin/lib';
import { AddNoteForm } from '@/app/admin/components/add-note-form';
import { MemberManagementActions } from '@/app/admin/components/member-management-actions';
import { EntitlementOverrideRow } from '@/app/admin/components/entitlement-override-row';
import { OrgActionButtons } from '@/app/admin/components/org-action-buttons';

type OrgDetailProps = {
  params: Promise<{ orgId: string }>;
};

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-AU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

async function fetchOrgDetail(orgId: string) {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/orgs/${orgId}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminOrgDetailPage({ params }: OrgDetailProps) {
  const { orgId } = await params;
  const data = await fetchOrgDetail(orgId);

  if (!data?.organization) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Organization not found.
      </div>
    );
  }

  const organization = data.organization;
  const subscription = data.subscription;
  const members = data.members ?? [];
  const notes = data.notes ?? [];
  const entitlements = data.entitlements ?? [];
  const supportRequests = data.supportRequests ?? [];
  const activity = data.activity ?? [];
  const sessions = data.sessions ?? [];
  const security = data.security ?? [];
  const customerHealth = data.customerHealth;
  const exportsData = data.exports ?? { compliance: [], reports: [] };
  const totalExports =
    (exportsData.compliance?.length ?? 0) + (exportsData.reports?.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {organization.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Customer 360 workspace for support, billing, security, and tenant
            operations.
          </p>
        </div>
        <Link
          href="/admin/orgs"
          className="text-sm text-sky-300 hover:text-sky-200"
        >
          Back to orgs
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Plan
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {organization.plan_key ?? 'N/A'}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Created {formatDate(organization.created_at)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Subscription
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {subscription?.status ?? 'N/A'}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Trial ends{' '}
            {formatDate(
              subscription?.trial_expires_at ??
                subscription?.current_period_end,
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Active Sessions
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {sessions.length}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Recent activity {activity.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Lifecycle / Health
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">
            {organization.lifecycle_status ?? 'active'} /{' '}
            {customerHealth?.activation?.score ?? 0}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Activation and operator lifecycle
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Lifecycle & Rescue
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Current access state, activation progress, and next operator
                  actions.
                </p>
              </div>
              <OrgActionButtons
                orgId={orgId}
                currentPlan={organization.plan_key}
                currentSubscriptionStatus={subscription?.status ?? 'pending'}
                currentLifecycleStatus={organization.lifecycle_status ?? 'active'}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Activation
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {customerHealth?.activation?.score ?? 0}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {customerHealth?.activation?.label ?? 'Unknown'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Billing Risk
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {customerHealth?.billingRisk?.level ?? 'low'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Trial days remaining{' '}
                  {customerHealth?.billingRisk?.trialDaysRemaining ?? 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Health Score
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {customerHealth?.healthScore?.score ?? 'N/A'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {customerHealth?.healthScore?.status ?? 'Not calculated'}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">
                  Next Best Actions
                </p>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(customerHealth?.nextBestActions ?? []).slice(0, 6).map((action: string) => (
                    <div
                      key={action}
                      className="rounded-lg border border-border px-3 py-2"
                    >
                      {action}
                    </div>
                  ))}
                  {(customerHealth?.nextBestActions ?? []).length === 0 ? (
                    <p>No immediate operator actions recommended.</p>
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">
                  Activation Milestones
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(customerHealth?.activation?.milestones ?? {}).map(
                    ([key, done]) => (
                      <span
                        key={key}
                        className={`rounded-full border px-2 py-1 text-[11px] ${
                          done
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        {key}
                      </span>
                    ),
                  )}
                </div>
                {organization.lifecycle_reason ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Latest lifecycle reason: {organization.lifecycle_reason}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-foreground">Members</h2>
              <span className="text-xs text-muted-foreground">
                {members.length} total
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Added</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member: any) => (
                    <tr key={member.user_id}>
                      <td className="py-3">{member.email}</td>
                      <td className="py-3 capitalize">{member.role}</td>
                      <td className="py-3">{formatDate(member.created_at)}</td>
                      <td className="py-3 text-right">
                        <MemberManagementActions
                          orgId={orgId}
                          userId={member.user_id}
                          currentRole={member.role}
                        />
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No members found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Entitlement Overrides
            </h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {entitlements.length > 0 ? (
                entitlements.map((entitlement: any) => (
                  <EntitlementOverrideRow
                    key={entitlement.feature_key}
                    orgId={orgId}
                    featureKey={entitlement.feature_key}
                    enabled={Boolean(entitlement.enabled)}
                    limitValue={entitlement.limit_value ?? null}
                  />
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No entitlement rows found for this organization.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Internal Notes
            </h2>
            <AddNoteForm orgId={orgId} />
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              {notes.map((note: any) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-border bg-[hsl(var(--card))] p-4"
                >
                  <div className="text-xs text-muted-foreground">
                    {formatDate(note.created_at)}
                  </div>
                  <div className="mt-2 text-sm text-foreground">{note.note}</div>
                </div>
              ))}
              {notes.length === 0 ? (
                <div className="text-sm text-muted-foreground">No notes yet.</div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Support Requests
            </h2>
            <div className="mt-4 space-y-3">
              {supportRequests.length > 0 ? (
                supportRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        {request.subject}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {request.name ?? request.email}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {request.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No support requests linked to this organization.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Activity
            </h2>
            <div className="mt-4 space-y-3">
              {activity.length > 0 ? (
                activity.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {entry.action}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.user_email ?? 'Unknown user'} · {formatDate(entry.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.route ?? entry.entity_type ?? 'activity'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent org activity.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Sessions & Security
            </h2>
            <div className="mt-4 space-y-3">
              {sessions.slice(0, 5).map((session: any) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <p className="text-sm font-medium text-foreground">
                    {session.user_email ?? session.user_id}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last seen {formatDate(session.last_seen_at)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[session.geo_city, session.geo_country].filter(Boolean).join(', ') || 'Unknown location'}
                  </p>
                </div>
              ))}
              {security.slice(0, 5).map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <p className="text-sm font-medium text-foreground">
                    {event.type}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.user_email ?? 'Unknown user'} · {event.severity}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.created_at)}
                  </p>
                </div>
              ))}
              {customerHealth?.billingRisk?.reasons?.map((reason: string) => (
                <div
                  key={reason}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
                >
                  <p className="text-sm font-medium text-amber-100">
                    Billing / activation risk
                  </p>
                  <p className="mt-1 text-xs text-amber-100/80">{reason}</p>
                </div>
              ))}
              {sessions.length === 0 && security.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active sessions or recent security events.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">Exports</h2>
            <div className="mt-4 space-y-3">
              {[...(exportsData.compliance ?? []), ...(exportsData.reports ?? [])]
                .slice(0, 8)
                .map((job: any) => (
                  <div
                    key={job.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {job.framework_slug ?? job.report_type ?? 'Export'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {job.status} · {formatDate(job.created_at)}
                    </p>
                    {job.file_url ? (
                      <a
                        href={job.file_url}
                        className="mt-2 inline-block text-xs text-sky-300 hover:text-sky-200"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open file
                      </a>
                    ) : null}
                  </div>
                ))}
              {totalExports === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No export jobs for this organization.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
