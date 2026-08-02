import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Clock, FileText, Lock, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

import { RetentionPolicies } from '@/components/governance/retention-policies';
import { requireEntitlement } from '@/lib/billing/entitlements';
import {
  getRetentionSchemaStatus,
  listRetentionExecutions,
  listRetentionPolicies,
} from '@/lib/data-governance/retention';
import {
  createLegalHold,
  releaseLegalHold,
} from '@/lib/retention/retention-engine';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';

export const metadata = { title: 'Document Retention | FormaOS' };

type LegalHold = {
  id: string;
  name: string;
  reason: string;
  status: string;
  created_at: string;
  released_at?: string | null;
  document_count: number;
};

function canManageRetention(role: string | null | undefined) {
  return role === 'owner' || role === 'admin';
}

async function createLegalHoldAction(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  await requireEntitlement(state.organization.id, 'retention_governance');

  if (!canManageRetention(state.role)) {
    redirect('/app/settings/retention?error=forbidden');
  }

  const name = String(formData.get('name') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();
  if (!name || !reason) {
    redirect('/app/settings/retention?error=hold-required');
  }

  await createLegalHold(state.organization.id, {
    name,
    reason,
    createdBy: state.user.id,
  });

  revalidatePath('/app/settings/retention');
  redirect('/app/settings/retention?hold=created');
}

async function releaseLegalHoldAction(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  await requireEntitlement(state.organization.id, 'retention_governance');

  if (!canManageRetention(state.role)) {
    redirect('/app/settings/retention?error=forbidden');
  }

  const holdId = String(formData.get('holdId') ?? '').trim();
  if (!holdId) redirect('/app/settings/retention?error=hold-required');

  await releaseLegalHold(state.organization.id, holdId, state.user.id);

  revalidatePath('/app/settings/retention');
  redirect('/app/settings/retention?hold=released');
}

async function getLegalHolds(orgId: string) {
  const db = await createSupabaseServerClient();
  const [{ data: holds, error: holdsError }, { data: holdDocs }] =
    await Promise.all([
      db
        .from('legal_holds')
        .select('id, name, reason, status, created_at, released_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }),
      db.from('legal_hold_documents').select('legal_hold_id').eq('org_id', orgId),
    ]);

  if (holdsError) {
    return { holds: [], unavailableReason: holdsError.message };
  }

  const counts: Record<string, number> = {};
  for (const document of holdDocs ?? []) {
    counts[document.legal_hold_id] =
      (counts[document.legal_hold_id] ?? 0) + 1;
  }

  return {
    holds: (holds ?? []).map((hold) => ({
      ...hold,
      document_count: counts[hold.id] ?? 0,
    })) as LegalHold[],
    unavailableReason: null,
  };
}

export default async function RetentionPage({
  searchParams,
}: {
  searchParams: Promise<{ hold?: string; error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const notices = await searchParams;
  const db = await createSupabaseServerClient();
  const { data: entitlement } = await db
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', state.organization.id)
    .eq('feature_key', 'retention_governance')
    .maybeSingle();

  if (entitlement?.enabled !== true) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <RetentionHeader />
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Retention governance is an Enterprise feature
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Policy creation, legal holds, dry-runs, and retention execution are
            disabled until retention_governance is enabled for this workspace.
          </p>
          <a
            href="/app/billing"
            className="mt-5 inline-flex rounded-md border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Review Billing
          </a>
        </section>
      </div>
    );
  }

  const [schema, policies, executions, legalHolds] = await Promise.all([
    getRetentionSchemaStatus(),
    listRetentionPolicies(state.organization.id),
    listRetentionExecutions(state.organization.id),
    getLegalHolds(state.organization.id),
  ]);

  const canManage = canManageRetention(state.role);
  const disabledReason = !schema.available
    ? `Retention schema is missing: ${schema.missing.join(', ')}.`
    : !canManage
      ? 'Only workspace owners and admins can manage retention policies.'
      : null;
  const activeHolds = legalHolds.holds.filter(
    (hold) => hold.status === 'active',
  ).length;
  const documentsHeld = legalHolds.holds.reduce(
    (sum, hold) => sum + hold.document_count,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <RetentionHeader />

      {notices.hold || notices.error ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            notices.error
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {notices.error
            ? notices.error.replaceAll('-', ' ')
            : notices.hold === 'released'
              ? 'Legal hold released.'
              : 'Legal hold created.'}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<Shield className="h-4 w-4" />} label="Policies" value={policies.length} />
        <StatCard icon={<Lock className="h-4 w-4" />} label="Active Holds" value={activeHolds} tone="danger" />
        <StatCard icon={<FileText className="h-4 w-4" />} label="Documents Held" value={documentsHeld} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Executions" value={executions.length} />
      </div>

      <RetentionPolicies
        orgId={state.organization.id}
        initialPolicies={policies}
        initialExecutions={executions}
        disabledReason={disabledReason}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Legal Holds
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Freeze deletion for documents involved in an investigation,
            regulator request, or dispute.
          </p>
          {legalHolds.unavailableReason ? (
            <p className="mt-4 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Legal hold tables are unavailable: {legalHolds.unavailableReason}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {legalHolds.holds.map((hold) => (
                <div
                  key={hold.id}
                  className={`rounded-lg border p-4 ${
                    hold.status === 'active'
                      ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-foreground">
                          {hold.name}
                        </h3>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {hold.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {hold.reason}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {hold.document_count} document
                        {hold.document_count === 1 ? '' : 's'} · Created{' '}
                        {new Date(hold.created_at).toLocaleDateString()}
                        {hold.released_at
                          ? ` · Released ${new Date(hold.released_at).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    {hold.status === 'active' && canManage ? (
                      <form action={releaseLegalHoldAction}>
                        <input type="hidden" name="holdId" value={hold.id} />
                        <button
                          type="submit"
                          className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Release Hold
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
              {legalHolds.holds.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No legal holds recorded.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <form
          action={createLegalHoldAction}
          className="rounded-lg border border-border bg-card p-5"
        >
          <h2 className="text-sm font-semibold text-foreground">
            Create Hold
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Name</span>
              <input
                name="name"
                disabled={!canManage || Boolean(legalHolds.unavailableReason)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground disabled:opacity-50"
                placeholder="Regulator request"
              />
            </label>
            <label className="block space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Reason</span>
              <textarea
                name="reason"
                rows={4}
                disabled={!canManage || Boolean(legalHolds.unavailableReason)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm normal-case tracking-normal text-foreground disabled:opacity-50"
                placeholder="Why documents must be preserved"
              />
            </label>
            <button
              type="submit"
              disabled={!canManage || Boolean(legalHolds.unavailableReason)}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Create Legal Hold
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RetentionHeader() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Document Retention</h1>
      <p className="text-sm text-muted-foreground">
        Manage retention policies, legal holds, dry-runs, and document lifecycle
        execution.
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone?: 'danger';
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={`text-2xl font-bold ${
          tone === 'danger' ? 'text-red-600' : 'text-foreground'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
