import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchSystemState } from '@/lib/system-state/server';
import {
  isMissingSupabaseColumnError,
  isMissingSupabaseTableError,
} from '@/lib/supabase/schema-compat';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import {
  CAPA_STATUS_LABELS,
  CAPA_STATUSES,
  type CapaStatus,
} from './constants';
import {
  RecordCard,
  RecordList,
  EmptyRecordState,
} from '@/components/mobile/record-card';
import {
  StatusBadge,
  severityStatus,
} from '@/components/compliance/StatusBadge';

export const metadata = { title: 'CAPA Register' };

type SearchParams = {
  status?: string;
  severity?: string;
  owner?: string;
  error?: string;
};

type CapaItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  severity: string | null;
  priority: string | null;
  status: string;
  owner_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  source_type: string | null;
  source_id: string | null;
  incident_id: string | null;
  verified_at: string | null;
  closed_at: string | null;
  created_at: string;
};

function fmtDate(value?: string | null) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return '-';
  }
}

function isClosedStatus(status: string) {
  return status === 'closed' || status === 'archived';
}

function getStatusLabel(status: string) {
  return CAPA_STATUS_LABELS[status as CapaStatus] ?? status.replace(/_/g, ' ');
}

function getMemberLabel(
  userId: string | null | undefined,
  names: Map<string, string>,
) {
  if (!userId) return '-';
  return names.get(userId) ?? userId.slice(0, 8);
}

function sourceHref(item: CapaItem) {
  if (!item.source_id) return null;
  if (item.source_type === 'incident') return `/app/incidents/${item.source_id}`;
  if (item.source_type === 'policy') return `/app/policies/${item.source_id}`;
  if (item.source_type === 'obligation') {
    return `/app/tasks?q=${encodeURIComponent(item.source_id)}`;
  }
  return null;
}

function sourceLabel(item: CapaItem) {
  if (item.source_type === 'incident') return 'Incident';
  if (item.source_type === 'policy') return 'Policy';
  if (item.source_type === 'obligation') return 'Task';
  return item.source_type ?? 'manual';
}

export default async function CAPAPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const params = (await searchParams) ?? {};
  const db = createSupabaseAdminClient();
  const { data: entitlement } = await db
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', state.organization.id)
    .eq('feature_key', 'capa_management')
    .maybeSingle();

  if (entitlement?.enabled !== true) {
    return (
      <div className="flex h-full flex-col">
        <div className="page-header">
          <div>
            <h1 className="page-title">CAPA register</h1>
            <p className="page-description">
              Corrective and preventive action management
            </p>
          </div>
        </div>
        <div className="page-content">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">
              CAPA is not included in your current plan
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Upgrading turns on corrective and preventive actions: raising a
              CAPA, assigning an owner, attaching evidence, and recording
              verification and closure.
            </p>
            <Link
              href="/app/billing"
              className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              View plans
            </Link>
          </section>
        </div>
      </div>
    );
  }

  let query = db
    .from('org_capa_items')
    .select(
      'id, title, description, type, severity, priority, status, owner_id, assigned_to, due_date, source_type, source_id, incident_id, verified_at, closed_at, created_at',
    )
    .eq('organization_id', state.organization.id)
    .order('created_at', { ascending: false });

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.severity && params.severity !== 'all') {
    query = query.eq('severity', params.severity);
  }
  if (params.owner && params.owner !== 'all') {
    query = query.eq('owner_id', params.owner);
  }

  const { data: items, error: itemsError } = await query;
  const capaUnavailable =
    isMissingSupabaseTableError(itemsError, 'org_capa_items') ||
    isMissingSupabaseColumnError(itemsError, 'org_capa_items');

  const capaItems = ((items ?? []) as CapaItem[]).map((item) => ({
    ...item,
    severity: item.severity ?? item.priority ?? 'medium',
    owner_id: item.owner_id ?? item.assigned_to ?? null,
  }));

  const memberIds = Array.from(
    new Set(capaItems.map((item) => item.owner_id).filter(Boolean)),
  ) as string[];
  const { data: profiles } =
    memberIds.length > 0
      ? await db
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', memberIds)
      : { data: [] as { user_id?: string; full_name?: string | null }[] };
  const memberNames = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      (profile.full_name as string | null)?.trim() || (profile.user_id as string).slice(0, 8),
    ]),
  );

  const openCount = capaItems.filter((c) => !isClosedStatus(c.status)).length;
  const investigatingCount = capaItems.filter(
    (c) => c.status === 'investigating' || c.status === 'action_assigned',
  ).length;
  const overdueCount = capaItems.filter(
    (c) =>
      c.due_date &&
      new Date(c.due_date) < new Date() &&
      !isClosedStatus(c.status),
  ).length;
  const closedCount = capaItems.filter((c) => c.status === 'closed').length;

  const statusIcons: Record<string, typeof Clock> = {
    draft: Clock,
    open: Clock,
    investigating: Search,
    action_assigned: Wrench,
    verification: ShieldCheck,
    closed: CheckCircle2,
    archived: CheckCircle2,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <div>
          <h1 className="page-title">CAPA register</h1>
          <p className="page-description">
            Corrective and preventive actions with lifecycle, evidence, and
            audit traceability
          </p>
        </div>
        {capaUnavailable ? (
          <button
            type="button"
            disabled
            data-testid="capa-schema-disabled"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground"
          >
            <Lock className="h-3.5 w-3.5" /> CAPA unavailable
          </button>
        ) : (
          <Link
            href="/app/capa/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> New CAPA
          </Link>
        )}
      </div>

      <div className="page-content space-y-4">
        {capaUnavailable && (
          <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
            CAPA storage is not enabled for this workspace yet. Contact support
            to turn it on — until then, creating and updating CAPA records
            stays switched off.
          </div>
        )}
        {params.error && !capaUnavailable && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {params.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="metric-card metric-card-neutral">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Open
              </p>
            </div>
            <p className="text-2xl font-bold">{capaUnavailable ? 0 : openCount}</p>
          </div>
          <div className="metric-card metric-card-neutral">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Active
              </p>
            </div>
            <p className="text-2xl font-bold">
              {capaUnavailable ? 0 : investigatingCount}
            </p>
          </div>
          <div
            className={`metric-card ${
              overdueCount > 0 ? 'metric-card-danger' : 'metric-card-success'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overdue
              </p>
            </div>
            <p className="text-2xl font-bold">{capaUnavailable ? 0 : overdueCount}</p>
          </div>
          <div className="metric-card metric-card-success">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Closed
              </p>
            </div>
            <p className="text-2xl font-bold">{capaUnavailable ? 0 : closedCount}</p>
          </div>
        </div>

        {!capaUnavailable && (
          <form className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Status
              <select
                name="status"
                defaultValue={params.status ?? 'all'}
                className="min-w-40 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="all">All statuses</option>
                {CAPA_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CAPA_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Severity
              <select
                name="severity"
                defaultValue={params.severity ?? 'all'}
                className="min-w-36 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="all">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Apply filters
            </button>
          </form>
        )}

        {/* Mobile cards */}
        <div className="md:hidden">
          {capaUnavailable ? null : capaItems.length === 0 ? (
            <EmptyRecordState
              title="No CAPA items yet"
              description="Corrective actions and follow-ups will appear here."
            />
          ) : (
            <RecordList>
              {capaItems.map((item) => {
                const isOverdue =
                  item.due_date &&
                  new Date(item.due_date) < new Date() &&
                  !isClosedStatus(item.status);
                const severity = item.severity ?? 'medium';
                return (
                  <RecordCard
                    key={item.id}
                    href={`/app/capa/${item.id}`}
                    title={item.title}
                    subtitle={item.description ?? undefined}
                    status={<StatusBadge {...severityStatus(severity)} />}
                    meta={[
                      { label: 'Status', value: getStatusLabel(item.status) },
                      {
                        label: 'Due',
                        value: (
                          <span
                            className={
                              isOverdue ? 'font-medium text-destructive' : ''
                            }
                          >
                            {fmtDate(item.due_date)}
                          </span>
                        ),
                      },
                      {
                        label: 'Owner',
                        value: getMemberLabel(item.owner_id, memberNames),
                      },
                    ]}
                  />
                );
              })}
            </RecordList>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Severity</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Owner</th>
                <th className="px-4 py-3 text-left font-medium">Due date</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!capaUnavailable &&
                capaItems.map((item) => {
                  const Icon = statusIcons[item.status] ?? Clock;
                  const isOverdue =
                    item.due_date &&
                    new Date(item.due_date) < new Date() &&
                    !isClosedStatus(item.status);
                  const severity = item.severity ?? 'medium';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/30 ${
                        isOverdue ? 'bg-destructive/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/capa/${item.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                        {item.description && (
                          <p className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge {...severityStatus(severity)} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs capitalize">
                          <Icon className="h-3.5 w-3.5" /> {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getMemberLabel(item.owner_id, memberNames)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isOverdue ? 'font-medium text-destructive' : ''
                          }
                        >
                          {fmtDate(item.due_date)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize">
                        {sourceHref(item) ? (
                          <Link href={sourceHref(item)!} className="text-primary hover:underline">
                            {sourceLabel(item)}
                          </Link>
                        ) : (
                          item.source_type ?? 'manual'
                        )}
                      </td>
                    </tr>
                  );
                })}
              {!capaUnavailable && !capaItems.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No CAPA items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
