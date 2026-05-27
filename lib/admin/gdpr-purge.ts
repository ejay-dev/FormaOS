import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { revokeAllSessions } from '@/lib/auth/session-revocation';
import { recordSubjectForRedaction } from '@/lib/audit/redact-purged-subjects';
import { authLogger } from '@/lib/observability/structured-logger';

// Audit 2026-05-26 — P0-8: GDPR Right-to-Erasure implementation.
//
// Policy decisions encoded here come from
// docs/audit/2026-05-26-gdpr-purge-user-decision-matrix.md.
//
// Sequence per job (processUserPurge):
//   1. Refuse if user is sole owner of any active org (Q5).
//   2. For each DELETE table — hard delete rows where user_id = subject.
//   3. For each ANONYMIZE column — NULL the actor reference, leave the
//      row otherwise intact (Q1, plus org_* actor columns).
//   4. revokeAllSessions(subject) — invalidates any JWT cached anywhere.
//   5. auth.admin.deleteUser(subject) — cascades the auth.users row +
//      its FK dependents (Q3).
//   6. Mark the user_purge_jobs row 'completed' (or 'partial' if any
//      non-fatal step recorded an error in table_counts).
//
// Audit/billing tables are RETAINED in place (Q4). Subject PII inside
// those rows is scrubbed at *export* time by a separate redaction
// helper — not here, because mutating audit_log rows would break the
// hash chain that customers' auditors trust.

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;
type TableAction = 'delete' | 'anonymize' | 'skipped' | 'capture';
type TableOutcome = {
  action: TableAction;
  rows: number;
  error?: string;
};

// R1 (Audit 2026-05-27): capture the subject's identifiers BEFORE
// the cascade so the export pipeline can later redact them from
// retained audit rows. Best-effort — if capture fails, the purge
// still proceeds; we'd rather miss a redaction than block a GDPR
// erasure request. The miss surfaces in tableCounts so ops can
// retry capture manually if needed.
async function captureSubjectForRedaction(
  admin: AdminClient,
  userId: string,
  jobId: string,
): Promise<TableOutcome> {
  try {
    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(
      userId,
    );
    if (userErr) {
      return { action: 'capture', rows: 0, error: userErr.message };
    }
    const subjectEmail = userRes?.user?.email ?? null;
    const metadataName =
      ((userRes?.user?.user_metadata ?? {}) as { full_name?: unknown })
        .full_name;
    let subjectFullName: string | null =
      typeof metadataName === 'string' ? metadataName : null;

    // Many deployments store the canonical display name in profiles
    // rather than user_metadata — pull it as a fallback and as
    // additional coverage for the redactor.
    const extraIdentifiers: string[] = [];
    try {
      const { data: profileRow } = await admin
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', userId)
        .maybeSingle();
      if (profileRow) {
        const profileName = (profileRow as { full_name?: unknown }).full_name;
        if (typeof profileName === 'string' && profileName.length > 0) {
          if (!subjectFullName) subjectFullName = profileName;
          else if (profileName !== subjectFullName) extraIdentifiers.push(profileName);
        }
        const profileEmail = (profileRow as { email?: unknown }).email;
        if (
          typeof profileEmail === 'string' &&
          profileEmail.length > 0 &&
          profileEmail.toLowerCase() !== (subjectEmail ?? '').toLowerCase()
        ) {
          extraIdentifiers.push(profileEmail);
        }
      }
    } catch {
      // profiles table missing or shape drift — non-fatal.
    }

    await recordSubjectForRedaction({
      userId,
      email: subjectEmail,
      fullName: subjectFullName,
      extraIdentifiers,
      purgeJobId: jobId,
    });
    return { action: 'capture', rows: 1 };
  } catch (err) {
    return {
      action: 'capture',
      rows: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const DELETE_TABLES: string[] = [
  'user_security',
  'user_preferences',
  'user_onboarding_state',
  'user_sessions',
  'password_history',
  'profiles',
  'user_profiles',
  'email_preferences',
  'notification_preferences',
  'notification_channels',
  'notification_digest_queue',
  'notification_digest_history',
  'notifications',
  'api_keys',
  'activity_feed',
  'user_activity',
  'ai_chat_conversations',
  'dashboard_layouts',
  'comment_reactions',
  'org_members',
  'memberships',
  'scim_group_links',
];

type AnonymizeRule = {
  table: string;
  columns: string[];
};

const ANONYMIZE_RULES: AnonymizeRule[] = [
  // Q1: comments — keep the content, null the authorship + mentions.
  { table: 'comments', columns: ['user_id'] },
  // Org-scoped actor refs on regulator-relevant data: scrub the actor,
  // keep the record so the team's compliance trail stays whole.
  { table: 'org_evidence', columns: ['uploaded_by'] },
  { table: 'org_policies', columns: ['created_by', 'updated_by'] },
  { table: 'org_tasks', columns: ['assigned_to', 'created_by'] },
  { table: 'org_care_plans', columns: ['created_by', 'updated_by', 'assigned_to'] },
  { table: 'org_visits', columns: ['created_by', 'assigned_to'] },
  { table: 'org_staff_credentials', columns: ['created_by'] },
  { table: 'org_risks', columns: ['created_by', 'updated_by'] },
  { table: 'org_assets', columns: ['created_by', 'updated_by'] },
  { table: 'org_compliance_blocks', columns: ['created_by'] },
];

export class PurgeRefusedError extends Error {
  constructor(public reason: string, public details?: unknown) {
    super(reason);
    this.name = 'PurgeRefusedError';
  }
}

/**
 * Find any active orgs where the subject is the only owner. If any
 * exist, the purge MUST be refused — deleting them would orphan the
 * org. Ops resolves by transferring ownership first, then re-triggers.
 */
export async function findSoleOwnedOrgs(
  admin: AdminClient,
  userId: string,
): Promise<string[]> {
  // Step 1: orgs where this user is an owner and the org isn't retired.
  const { data: myOwnedRows, error: ownedErr } = await admin
    .from('org_members')
    .select('organization_id, organizations!inner(lifecycle_status)')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .neq('organizations.lifecycle_status', 'retired');
  if (ownedErr) {
    throw new Error(`sole-owner lookup failed: ${ownedErr.message}`);
  }
  const candidateOrgs = (myOwnedRows ?? [])
    .map((row: { organization_id: string | null }) => row.organization_id)
    .filter((id: string | null): id is string => Boolean(id));
  if (candidateOrgs.length === 0) return [];

  // Step 2: of those, which have exactly one owner total?
  const { data: ownerCounts, error: countErr } = await admin
    .from('org_members')
    .select('organization_id')
    .in('organization_id', candidateOrgs)
    .eq('role', 'owner');
  if (countErr) {
    throw new Error(`sole-owner count failed: ${countErr.message}`);
  }

  const counts = new Map<string, number>();
  for (const row of ownerCounts ?? []) {
    const id = (row as { organization_id: string }).organization_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return candidateOrgs.filter((id) => (counts.get(id) ?? 0) <= 1);
}

/**
 * Insert a user_purge_jobs row in 'pending' status. Performs the
 * sole-owner check up-front so the admin gets a 409 with an actionable
 * error instead of a queued job that later fails. Returns the job id
 * on success, throws PurgeRefusedError if the user can't be purged.
 */
export async function enqueueUserPurge(args: {
  userId: string;
  requestedBy: string;
  reason: string;
  requestSource?: 'admin' | 'subject_request';
}): Promise<{ jobId: string }> {
  const admin = createSupabaseAdminClient();

  const soleOwned = await findSoleOwnedOrgs(admin, args.userId);
  if (soleOwned.length > 0) {
    // Record the refusal so the audit history shows attempts even when
    // they don't proceed — defensible from a SOX/SOC2 stance.
    await admin.from('user_purge_jobs').insert({
      user_id: args.userId,
      status: 'refused',
      requested_by: args.requestedBy,
      reason: args.reason,
      request_source: args.requestSource ?? 'admin',
      refuse_reason: 'sole_owner_of_active_orgs',
      table_counts: { sole_owned_orgs: soleOwned },
      completed_at: new Date().toISOString(),
    });
    throw new PurgeRefusedError(
      'User is the sole owner of one or more active organizations. Transfer ownership first.',
      { soleOwnedOrgs: soleOwned },
    );
  }

  const { data, error } = await admin
    .from('user_purge_jobs')
    .insert({
      user_id: args.userId,
      status: 'pending',
      requested_by: args.requestedBy,
      reason: args.reason,
      request_source: args.requestSource ?? 'admin',
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Failed to enqueue purge: ${error?.message ?? 'no row'}`);
  }
  return { jobId: data.id as string };
}

async function deleteRowsByUserId(
  admin: AdminClient,
  table: string,
  userId: string,
): Promise<TableOutcome> {
  const { error, count } = await admin
    .from(table)
    .delete({ count: 'exact' })
    .eq('user_id', userId);
  if (error) {
    return { action: 'delete', rows: 0, error: error.message };
  }
  return { action: 'delete', rows: count ?? 0 };
}

async function anonymizeColumns(
  admin: AdminClient,
  table: string,
  columns: string[],
  userId: string,
): Promise<TableOutcome> {
  let totalRows = 0;
  for (const column of columns) {
    const { error, count } = await admin
      .from(table)
      .update({ [column]: null }, { count: 'exact' })
      .eq(column, userId);
    if (error) {
      return {
        action: 'anonymize',
        rows: totalRows,
        error: `${column}: ${error.message}`,
      };
    }
    totalRows += count ?? 0;
  }
  return { action: 'anonymize', rows: totalRows };
}

/**
 * Run the cascade for a single pending job. Idempotent enough that a
 * crashed job can be re-run — deletes on already-empty rows return 0
 * with no error; anonymize updates on already-NULL columns are no-ops.
 *
 * Returns the final status ('completed' | 'partial' | 'failed') for
 * the caller's reporting; the user_purge_jobs row is updated in place.
 */
export async function processUserPurge(jobId: string): Promise<{
  status: 'completed' | 'partial' | 'failed';
  tableCounts: Record<string, TableOutcome>;
}> {
  const admin = createSupabaseAdminClient();

  const { data: job, error: jobErr } = await admin
    .from('user_purge_jobs')
    .select('id, user_id, status')
    .eq('id', jobId)
    .maybeSingle();
  if (jobErr || !job) {
    throw new Error(`purge job not found: ${jobErr?.message ?? 'missing'}`);
  }
  if (job.status !== 'pending') {
    throw new Error(
      `purge job ${jobId} is in status '${job.status}', not pending`,
    );
  }

  // Claim the job. Concurrent processors lose the race here.
  const { data: claim, error: claimErr } = await admin
    .from('user_purge_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (claimErr || !claim) {
    throw new Error(
      `purge job ${jobId} claim failed (concurrent processor?): ${claimErr?.message ?? 'no row'}`,
    );
  }

  const userId = job.user_id as string;
  const tableCounts: Record<string, TableOutcome> = {};
  let hadError = false;

  // R1 (Audit 2026-05-27): capture identifiers BEFORE the cascade so
  // the export-time redactor can scrub the subject's PII from
  // retained audit rows. Must run first — auth.admin.deleteUser
  // erases the email/full_name and we can't recover them after.
  const captureOutcome = await captureSubjectForRedaction(
    admin,
    userId,
    jobId,
  );
  tableCounts['purged_subject_redactions'] = captureOutcome;
  if (captureOutcome.error) hadError = true;

  for (const table of DELETE_TABLES) {
    const outcome = await deleteRowsByUserId(admin, table, userId);
    tableCounts[table] = outcome;
    if (outcome.error) hadError = true;
  }

  for (const rule of ANONYMIZE_RULES) {
    const outcome = await anonymizeColumns(
      admin,
      rule.table,
      rule.columns,
      userId,
    );
    tableCounts[rule.table] = outcome;
    if (outcome.error) hadError = true;
  }

  // Revoke any cached JWTs so a still-open tab can't act between here
  // and the auth.users delete. Best-effort; if it fails we still try
  // the delete.
  try {
    await revokeAllSessions(userId, {
      revokedBy: null,
      reason: 'gdpr_purge',
    });
    tableCounts['user_session_revocations'] = { action: 'delete', rows: 1 };
  } catch (err) {
    tableCounts['user_session_revocations'] = {
      action: 'delete',
      rows: 0,
      error: err instanceof Error ? err.message : String(err),
    };
    hadError = true;
  }

  // Final step: nuke auth.users. If this fails we mark the job
  // 'failed' (the subject still exists in auth) — ops needs to retry.
  let authDeleteError: string | null = null;
  try {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      authDeleteError = error.message;
    } else {
      tableCounts['auth.users'] = { action: 'delete', rows: 1 };
    }
  } catch (err) {
    authDeleteError = err instanceof Error ? err.message : String(err);
  }

  const finalStatus: 'completed' | 'partial' | 'failed' = authDeleteError
    ? 'failed'
    : hadError
      ? 'partial'
      : 'completed';

  await admin
    .from('user_purge_jobs')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      table_counts: tableCounts,
      failed_step: authDeleteError ? 'auth.users.delete' : null,
      error_message: authDeleteError,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  if (finalStatus !== 'completed') {
    authLogger.warn('gdpr_purge_partial_or_failed', {
      jobId,
      userId,
      status: finalStatus,
      authDeleteError,
      partialTableCount: Object.entries(tableCounts).filter(([, v]) => v.error)
        .length,
    });
  }

  return { status: finalStatus, tableCounts };
}
