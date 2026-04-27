import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/app/app/actions/audit-events';

export const metadata = { title: 'CAPA Detail | FormaOS' };

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  implemented: 'Implemented',
  verified: 'Verified',
  closed: 'Closed',
};

async function updateCapaStatus(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!id || !Object.keys(STATUS_LABELS).includes(status)) {
    redirect('/app/capa?error=invalid-status');
  }

  const db = createSupabaseAdminClient();
  const { data: existing } = await db
    .from('org_capa_items')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (!existing) notFound();

  const patch: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'verified' || status === 'closed') {
    patch.verified_by = state.user.id;
    patch.verified_at = new Date().toISOString();
  }

  const { error } = await db
    .from('org_capa_items')
    .update(patch)
    .eq('id', id)
    .eq('organization_id', state.organization.id);

  if (error) {
    redirect(`/app/capa/${id}?error=${encodeURIComponent(error.message)}`);
  }

  await logAuditEvent(
    {
      organizationId: state.organization.id,
      actorUserId: state.user.id,
      actorRole: state.role,
      entityType: 'capa',
      entityId: id,
      actionType: 'CAPA_STATUS_CHANGED',
      beforeState: { status: existing.status },
      afterState: { status },
      reason: 'capa_detail_status_form',
    },
    { required: true },
  );

  redirect(`/app/capa/${id}`);
}

function fmtDate(value?: string | null) {
  if (!value) return 'Not set';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return 'Not set';
  }
}

export default async function CapaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const { id } = await params;
  const { error } = await searchParams;
  const db = createSupabaseAdminClient();
  const { data: item } = await db
    .from('org_capa_items')
    .select(
      'id, title, description, type, priority, status, due_date, verification_method, verified_at, effectiveness_check_date, effectiveness_status, incident_id, created_at, updated_at',
    )
    .eq('id', id)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (!item) notFound();

  return (
    <div className="flex flex-col h-full">
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

      <div className="page-content grid gap-4 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-lg border border-border bg-card p-5">
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Type
              </p>
              <p className="mt-1 capitalize">{item.type}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Priority
              </p>
              <p className="mt-1 capitalize">{item.priority}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Due date
              </p>
              <p className="mt-1">{fmtDate(item.due_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Effectiveness
              </p>
              <p className="mt-1 capitalize">
                {item.effectiveness_status ?? 'pending'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {item.description || 'No description recorded.'}
            </p>
          </div>

          {item.incident_id && (
            <div className="mt-6">
              <Link
                href={`/app/incidents/${item.incident_id}`}
                className="text-sm text-primary hover:underline"
              >
                Open linked incident
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Status
            </div>
            <form action={updateCapaStatus} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <select
                name="status"
                defaultValue={item.status}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Wrench className="h-4 w-4" />
                Update status
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Lifecycle
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Created
                </dt>
                <dd>{fmtDate(item.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Last updated
                </dt>
                <dd>{fmtDate(item.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Verified
                </dt>
                <dd className="inline-flex items-center gap-1">
                  {item.verified_at ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {fmtDate(item.verified_at)}
                    </>
                  ) : (
                    'Not verified'
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
