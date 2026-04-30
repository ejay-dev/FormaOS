import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Phase 1 of the policy approval lifecycle wiring (audit P1 deferred item).
 *
 * Tables involved (created by 20260403_policy_lifecycle.sql, RLS repaired by
 * 20260430_007_policy_lifecycle_repair.sql):
 *
 *   - policy_versions       — every revision of a policy (monotonic version_number).
 *   - policy_approvals      — approval/rejection decisions per version + reviewer.
 *   - policy_acknowledgments — staff sign-off on a published version. (Phase 2.)
 *   - policy_review_schedules — periodic-review cadence. (Phase 3.)
 *
 * State machine (per policy_versions row):
 *
 *   draft ──submit──▶ pending_approval ──approve──▶ approved ──publish──▶ published
 *                          │
 *                          └──reject──▶ draft (a new revision starts fresh)
 *
 * org_policies.status mirrors the latest published version's lifecycle stage
 * for backward compatibility with existing list/detail UI.
 */

type AuditClient = Pick<SupabaseClient<any, any, any>, 'from'>;

export type PolicyVersionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'archived';

export interface PolicyVersionRow {
  id: string;
  org_id: string;
  policy_id: string;
  version_number: number;
  title: string;
  content: string;
  change_summary: string | null;
  status: PolicyVersionStatus;
  created_by: string;
  published_at: string | null;
  created_at: string;
}

interface CreateInitialVersionInput {
  orgId: string;
  policyId: string;
  title: string;
  content: string;
  createdBy: string;
}

/**
 * Insert version 1 for a freshly-created policy. Idempotent: if version 1
 * already exists for this policy, returns the existing row.
 */
export async function createInitialVersion(
  client: AuditClient,
  input: CreateInitialVersionInput,
): Promise<PolicyVersionRow | null> {
  const existing = await client
    .from('policy_versions')
    .select('*')
    .eq('policy_id', input.policyId)
    .eq('version_number', 1)
    .maybeSingle();

  if (existing.data) {
    return existing.data as PolicyVersionRow;
  }

  const { data, error } = await client
    .from('policy_versions')
    .insert({
      org_id: input.orgId,
      policy_id: input.policyId,
      version_number: 1,
      title: input.title,
      content: input.content ?? '',
      status: 'draft',
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error) {
    // Surface the error to the caller — Phase 1 callers wrap policy creation
    // in try/catch and degrade gracefully if the lifecycle table is missing.
    throw new Error(`policy_versions insert failed: ${error.message}`);
  }
  return data as PolicyVersionRow;
}

interface CreateNextDraftInput {
  orgId: string;
  policyId: string;
  title: string;
  content: string;
  changeSummary?: string | null;
  createdBy: string;
}

/**
 * Returns the latest version for a policy, or null if none exists.
 */
export async function getLatestVersion(
  client: AuditClient,
  policyId: string,
): Promise<PolicyVersionRow | null> {
  const { data, error } = await client
    .from('policy_versions')
    .select('*')
    .eq('policy_id', policyId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as PolicyVersionRow | null) ?? null;
}

/**
 * Returns the latest published version for a policy, or null.
 */
export async function getCurrentPublishedVersion(
  client: AuditClient,
  policyId: string,
): Promise<PolicyVersionRow | null> {
  const { data, error } = await client
    .from('policy_versions')
    .select('*')
    .eq('policy_id', policyId)
    .eq('status', 'published')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as PolicyVersionRow | null) ?? null;
}

/**
 * Update-or-create the active draft.
 *
 * Behavior:
 *   - If the latest version is `draft` (and same policy), update it in place.
 *     (Authors typically iterate on the same draft revision before submitting.)
 *   - If the latest version is `pending_approval`, throw — drafts shouldn't
 *     race with an in-flight approval.
 *   - Otherwise (latest is `approved`/`published`/`archived`), insert a new
 *     version with version_number = latest + 1, status = draft.
 */
export async function upsertDraftVersion(
  client: AuditClient,
  input: CreateNextDraftInput,
): Promise<PolicyVersionRow> {
  const latest = await getLatestVersion(client, input.policyId);

  if (latest && latest.status === 'pending_approval') {
    throw new Error(
      'Cannot edit policy while a version is awaiting approval. Approve or reject the pending version first.',
    );
  }

  if (latest && latest.status === 'draft') {
    const { data, error } = await client
      .from('policy_versions')
      .update({
        title: input.title,
        content: input.content ?? '',
        change_summary: input.changeSummary ?? latest.change_summary ?? null,
      })
      .eq('id', latest.id)
      .select('*')
      .single();

    if (error) throw new Error(`policy_versions update failed: ${error.message}`);
    return data as PolicyVersionRow;
  }

  const nextVersion = (latest?.version_number ?? 0) + 1;
  const { data, error } = await client
    .from('policy_versions')
    .insert({
      org_id: input.orgId,
      policy_id: input.policyId,
      version_number: nextVersion,
      title: input.title,
      content: input.content ?? '',
      change_summary: input.changeSummary ?? null,
      status: 'draft',
      created_by: input.createdBy,
    })
    .select('*')
    .single();

  if (error) throw new Error(`policy_versions insert failed: ${error.message}`);
  return data as PolicyVersionRow;
}

interface SubmitForReviewInput {
  versionId: string;
  approverIds: string[]; // explicit reviewer assignment; Phase 1 keeps it simple.
}

/**
 * Move a draft version into pending_approval and seed a `pending` row in
 * policy_approvals for each requested approver. Returns the updated version.
 */
export async function submitVersionForReview(
  client: AuditClient,
  input: SubmitForReviewInput,
): Promise<PolicyVersionRow> {
  const { data: version, error: fetchErr } = await client
    .from('policy_versions')
    .select('*')
    .eq('id', input.versionId)
    .maybeSingle();
  if (fetchErr || !version) {
    throw new Error('policy_version not found');
  }
  const versionRow = version as PolicyVersionRow;

  if (versionRow.status !== 'draft') {
    throw new Error(
      `cannot submit version in status="${versionRow.status}" (only draft is submittable)`,
    );
  }

  const { data: updated, error: updateErr } = await client
    .from('policy_versions')
    .update({ status: 'pending_approval' })
    .eq('id', versionRow.id)
    .select('*')
    .single();
  if (updateErr) {
    throw new Error(`policy_versions status update failed: ${updateErr.message}`);
  }

  if (input.approverIds.length > 0) {
    const rows = input.approverIds.map((approverId) => ({
      org_id: versionRow.org_id,
      policy_version_id: versionRow.id,
      approver_id: approverId,
      decision: 'pending',
    }));
    const { error: approvalErr } = await client
      .from('policy_approvals')
      .insert(rows);
    if (approvalErr) {
      // Roll back the status flip so the caller can retry.
      await client
        .from('policy_versions')
        .update({ status: 'draft' })
        .eq('id', versionRow.id);
      throw new Error(
        `policy_approvals seed failed: ${approvalErr.message}`,
      );
    }
  }

  return updated as PolicyVersionRow;
}

interface RecordDecisionInput {
  versionId: string;
  approverId: string;
  decision: 'approved' | 'rejected';
  comment?: string | null;
}

/**
 * Record an approver's decision and, if the decision flips the version to
 * approved/rejected, advance the policy_version status accordingly.
 *
 * Phase 1 single-approver semantics: any approval moves the version to
 * `approved`; any rejection moves it back to `draft`. Multi-approver quorum
 * is left for Phase 2.
 */
export async function recordApprovalDecision(
  client: AuditClient,
  input: RecordDecisionInput,
): Promise<PolicyVersionRow> {
  const { data: version, error: fetchErr } = await client
    .from('policy_versions')
    .select('*')
    .eq('id', input.versionId)
    .maybeSingle();
  if (fetchErr || !version) throw new Error('policy_version not found');
  const versionRow = version as PolicyVersionRow;

  if (versionRow.status !== 'pending_approval') {
    throw new Error(
      `cannot decide on version in status="${versionRow.status}" (must be pending_approval)`,
    );
  }

  const decidedAt = new Date().toISOString();

  // Record the decision. If a pending row exists for this approver, update
  // it; otherwise insert a fresh row (the approver wasn't pre-assigned).
  const { data: existing } = await client
    .from('policy_approvals')
    .select('id')
    .eq('policy_version_id', versionRow.id)
    .eq('approver_id', input.approverId)
    .eq('decision', 'pending')
    .maybeSingle();

  if (existing && (existing as { id: string }).id) {
    const { error: upErr } = await client
      .from('policy_approvals')
      .update({
        decision: input.decision,
        comment: input.comment ?? null,
        decided_at: decidedAt,
      })
      .eq('id', (existing as { id: string }).id);
    if (upErr) {
      throw new Error(`policy_approvals update failed: ${upErr.message}`);
    }
  } else {
    const { error: insErr } = await client.from('policy_approvals').insert({
      org_id: versionRow.org_id,
      policy_version_id: versionRow.id,
      approver_id: input.approverId,
      decision: input.decision,
      comment: input.comment ?? null,
      decided_at: decidedAt,
    });
    if (insErr) {
      throw new Error(`policy_approvals insert failed: ${insErr.message}`);
    }
  }

  const nextStatus: PolicyVersionStatus =
    input.decision === 'approved' ? 'approved' : 'draft';

  const { data: updated, error: stUpErr } = await client
    .from('policy_versions')
    .update({ status: nextStatus })
    .eq('id', versionRow.id)
    .select('*')
    .single();
  if (stUpErr) {
    throw new Error(`policy_versions status update failed: ${stUpErr.message}`);
  }

  return updated as PolicyVersionRow;
}

/**
 * Mark an approved version as published. Sets `published_at` and flips
 * status. Caller is responsible for synchronizing org_policies.status to
 * 'published' alongside this call.
 */
export async function publishApprovedVersion(
  client: AuditClient,
  versionId: string,
): Promise<PolicyVersionRow> {
  const { data: version, error: fetchErr } = await client
    .from('policy_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle();
  if (fetchErr || !version) throw new Error('policy_version not found');
  const versionRow = version as PolicyVersionRow;

  if (versionRow.status !== 'approved') {
    throw new Error(
      `cannot publish version in status="${versionRow.status}" (must be approved)`,
    );
  }

  const { data: updated, error: upErr } = await client
    .from('policy_versions')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', versionRow.id)
    .select('*')
    .single();
  if (upErr) throw new Error(`policy_versions publish failed: ${upErr.message}`);

  // Archive prior published versions for the same policy so list views
  // show only one as current.
  await client
    .from('policy_versions')
    .update({ status: 'archived' })
    .eq('policy_id', versionRow.policy_id)
    .eq('status', 'published')
    .neq('id', versionRow.id);

  return updated as PolicyVersionRow;
}
