import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Link2,
  Search,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  isMissingSupabaseColumnError,
  isMissingSupabaseTableError,
} from '@/lib/supabase/schema-compat';
import { EntityEvidencePanel } from '@/components/compliance/EntityEvidencePanel';
import { AuditTrailPanel } from '@/components/compliance/AuditTrailPanel';
import { CAPA_STATUS_LABELS, type CapaStatus } from '../constants';
import {
  addCorrectiveAction,
  addPreventiveAction,
  addRootCause,
  assignCapaOwner,
  closeCapa,
  updateCapa,
  updateCapaStatus,
  verifyCapa,
} from '../actions';

export const metadata = { title: 'CAPA Detail | FormaOS' };

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
  root_cause: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  verification_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MemberOption = {
  user_id: string;
  role: string | null;
};

type CapaEvent = {
  id: string;
  event_type: string;
  actor_id: string | null;
  comment: string | null;
  created_at: string;
};

const NEXT_STATUSES: Record<string, CapaStatus[]> = {
  draft: ['open', 'archived'],
  open: ['investigating', 'action_assigned', 'archived'],
  investigating: ['action_assigned', 'archived'],
  action_assigned: ['verification', 'investigating', 'archived'],
  verification: ['action_assigned', 'archived'],
  closed: ['archived'],
  archived: [],
};

function fmtDate(value?: string | null) {
  if (!value) return 'Not set';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return 'Not set';
  }
}

function fmtDateTime(value?: string | null) {
  if (!value) return 'Not set';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Not set';
  }
}

function statusLabel(status: string) {
  return CAPA_STATUS_LABELS[status as CapaStatus] ?? status.replace(/_/g, ' ');
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Clock;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

async function getMemberOptions(db: ReturnType<typeof createSupabaseAdminClient>, orgId: string) {
  const { data: members } = await db
    .from('org_members')
    .select('user_id, role')
    .eq('organization_id', orgId)
    .order('role');
  const rows = (members ?? []) as MemberOption[];
  const userIds = rows.map((row) => row.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await db
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', userIds)
      : { data: [] as { user_id?: string; full_name?: string | null }[] };
  const nameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      (profile.full_name as string | null)?.trim() || (profile.user_id as string).slice(0, 8),
    ]),
  );
  return rows.map((row) => ({
    userId: row.user_id,
    role: row.role ?? 'member',
    label: nameById.get(row.user_id) ?? row.user_id.slice(0, 8),
  }));
}

async function getSourceSummary(
  db: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  item: CapaItem,
) {
  if (!item.source_id || !item.source_type || item.source_type === 'manual') {
    return null;
  }

  const config = {
    incident: {
      table: 'org_incidents',
      href: `/app/incidents/${item.source_id}`,
      label: 'Incident',
      select: 'id, title',
    },
    policy: {
      table: 'org_policies',
      href: `/app/policies/${item.source_id}`,
      label: 'Policy',
      select: 'id, title',
    },
    obligation: {
      table: 'org_tasks',
      href: `/app/tasks?q=${encodeURIComponent(item.source_id)}`,
      label: 'Task',
      select: 'id, title',
    },
  }[item.source_type as 'incident' | 'policy' | 'obligation'];

  if (!config) return null;

  const { data } = await db
    .from(config.table)
    .select(config.select)
    .eq('id', item.source_id)
    .eq('organization_id', orgId)
    .maybeSingle();

  return {
    href: config.href,
    label: config.label,
    title:
      data && 'title' in data && typeof data.title === 'string'
        ? data.title
        : item.source_id.slice(0, 8),
  };
}

export default async function CapaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const { id } = await params;
  const { error } = await searchParams;
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
          <div className="flex items-center gap-3">
            <Link
              href="/app/capa"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div>
              <h1 className="page-title">CAPA management is not enabled</h1>
              <p className="page-description">
                This CAPA requires the capa_management entitlement.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data, error: itemError } = await db
    .from('org_capa_items')
    .select(
      'id, title, description, type, severity, priority, status, owner_id, assigned_to, due_date, source_type, source_id, incident_id, root_cause, corrective_action, preventive_action, verification_notes, verified_by, verified_at, closed_at, created_at, updated_at',
    )
    .eq('id', id)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (
    isMissingSupabaseTableError(itemError, 'org_capa_items') ||
    isMissingSupabaseColumnError(itemError, 'org_capa_items')
  ) {
    return (
      <div className="flex h-full flex-col">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <Link
              href="/app/capa"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div>
              <h1 className="page-title">CAPA unavailable</h1>
              <p className="page-description">
                Apply the CAPA lifecycle migration before opening CAPA records.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) notFound();

  const item = {
    ...(data as CapaItem),
    severity: (data as CapaItem).severity ?? (data as CapaItem).priority ?? 'medium',
    owner_id: (data as CapaItem).owner_id ?? (data as CapaItem).assigned_to ?? null,
  };
  const canAuthor = ['owner', 'admin'].includes(state.role);
  const [memberOptions, sourceSummary, eventsResult] = await Promise.all([
    getMemberOptions(db, state.organization.id),
    getSourceSummary(db, state.organization.id, item),
    db
      .from('org_capa_events')
      .select('id, event_type, actor_id, comment, created_at')
      .eq('organization_id', state.organization.id)
      .eq('capa_id', item.id)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);
  const events = (eventsResult.data ?? []) as CapaEvent[];
  const ownerLabel =
    memberOptions.find((member) => member.userId === item.owner_id)?.label ??
    (item.owner_id ? item.owner_id.slice(0, 8) : 'Unassigned');
  const allowedNextStatuses = NEXT_STATUSES[item.status] ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/app/capa"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <h1 className="page-title">{item.title}</h1>
            <p className="page-description">
              Corrective and preventive action detail
            </p>
          </div>
        </div>
      </div>

      <div className="page-content grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Section title="Overview" icon={FileText}>
            <form action={updateCapa} className="space-y-4">
              <input type="hidden" name="id" value={item.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-medium">
                  Title
                  <input
                    name="title"
                    defaultValue={item.title}
                    disabled={!canAuthor}
                    required
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Severity
                  <select
                    name="severity"
                    defaultValue={item.severity ?? 'medium'}
                    disabled={!canAuthor}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                  Description
                  <textarea
                    name="description"
                    defaultValue={item.description ?? ''}
                    disabled={!canAuthor}
                    rows={3}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Due date
                  <input
                    name="due_date"
                    type="date"
                    defaultValue={item.due_date ?? ''}
                    disabled={!canAuthor}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                  />
                </label>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Source
                  </p>
                  <p className="mt-2 text-sm capitalize">
                    {sourceSummary ? (
                      <Link
                        href={sourceSummary.href}
                        className="text-primary hover:underline"
                      >
                        {sourceSummary.label}: {sourceSummary.title}
                      </Link>
                    ) : (
                      item.source_type ?? 'manual'
                    )}
                  </p>
                </div>
              </div>
              {canAuthor && (
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Save overview
                </button>
              )}
            </form>
          </Section>

          <Section title="Root Cause" icon={Search}>
            <form action={addRootCause} className="space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <textarea
                name="root_cause"
                defaultValue={item.root_cause ?? ''}
                disabled={!canAuthor}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                placeholder="Document the root cause analysis."
              />
              {canAuthor && (
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Save root cause
                </button>
              )}
            </form>
          </Section>

          <Section title="Corrective Action" icon={Wrench}>
            <form action={addCorrectiveAction} className="space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <textarea
                name="corrective_action"
                defaultValue={item.corrective_action ?? ''}
                disabled={!canAuthor}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                placeholder="Document the corrective action that resolves the current issue."
              />
              {canAuthor && (
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Save corrective action
                </button>
              )}
            </form>
          </Section>

          <Section title="Preventive Action" icon={ShieldCheck}>
            <form action={addPreventiveAction} className="space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <textarea
                name="preventive_action"
                defaultValue={item.preventive_action ?? ''}
                disabled={!canAuthor}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                placeholder="Document the preventive action that reduces recurrence risk."
              />
              {canAuthor && (
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Save preventive action
                </button>
              )}
            </form>
          </Section>

          <Section title="Verification" icon={CheckCircle2}>
            <form action={verifyCapa} className="space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <textarea
                name="verification_notes"
                defaultValue={item.verification_notes ?? ''}
                disabled={!canAuthor || item.status !== 'verification'}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-70"
                placeholder="Describe how the action was verified and accepted."
              />
              <div className="flex flex-wrap items-center gap-2">
                {canAuthor && item.status === 'verification' && (
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                  >
                    Save verification
                  </button>
                )}
              </div>
            </form>
            {canAuthor && item.status === 'verification' && item.verification_notes && (
              <form action={closeCapa} className="mt-3">
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Close CAPA
                </button>
              </form>
            )}
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Verified
                </dt>
                <dd>{fmtDateTime(item.verified_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Closed
                </dt>
                <dd>{fmtDateTime(item.closed_at)}</dd>
              </div>
            </dl>
          </Section>

          <EntityEvidencePanel
            entityId={item.id}
            entityType="capa"
            heading="CAPA Evidence"
            emptyState="Attach verification screenshots, signed records, photos, or other evidence for this CAPA."
          />

          <AuditTrailPanel entityId={item.id} entityType="capa" maxEntries={30} />
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Lifecycle
            </div>
            <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm font-medium capitalize">
              {statusLabel(item.status)}
            </div>
            {canAuthor && allowedNextStatuses.length > 0 && (
              <form action={updateCapaStatus} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <select
                  name="status"
                  defaultValue={allowedNextStatuses[0]}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {allowedNextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {CAPA_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Wrench className="h-4 w-4" />
                  Move status
                </button>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              Owner
            </div>
            <p className="mt-3 text-sm">{ownerLabel}</p>
            {canAuthor && (
              <form action={assignCapaOwner} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <select
                  name="owner_id"
                  defaultValue={item.owner_id ?? ''}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {memberOptions.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.label} ({member.role})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                >
                  Assign owner
                </button>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              Source
            </div>
            <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2">
              {sourceSummary ? (
                <Link href={sourceSummary.href} className="text-primary hover:underline">
                  {sourceSummary.label}: {sourceSummary.title}
                </Link>
              ) : (
                <span className="text-muted-foreground">Manual CAPA</span>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              CAPA Events
            </div>
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div className="font-medium">{event.event_type.replace(/_/g, ' ')}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {fmtDateTime(event.created_at)}
                    {event.comment ? ` · ${event.comment}` : ''}
                  </div>
                </div>
              ))}
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground">No CAPA events recorded yet.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Dates
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Due
                </dt>
                <dd>{fmtDate(item.due_date)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Created
                </dt>
                <dd>{fmtDateTime(item.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Last updated
                </dt>
                <dd>{fmtDateTime(item.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
