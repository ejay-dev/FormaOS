import { createSupabaseServerClient } from '@/lib/supabase/server';

// ------------------------------------------------------------------
// Policy Lifecycle Engine
// ------------------------------------------------------------------

export async function createPolicyVersion(
  orgId: string,
  policyId: string,
  data: {
    title: string;
    content: string;
    changeSummary?: string;
    createdBy: string;
  },
) {
  const db = await createSupabaseServerClient();

  // Get next version number
  const { data: latest } = await db
    .from('policy_versions')
    .select('version_number')
    .eq('org_id', orgId)
    .eq('policy_id', policyId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latest?.version_number || 0) + 1;

  const { data: version, error } = await db
    .from('policy_versions')
    .insert({
      org_id: orgId,
      policy_id: policyId,
      version_number: nextVersion,
      title: data.title,
      content: data.content,
      change_summary: data.changeSummary,
      status: 'draft',
      created_by: data.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return version;
}

export async function submitForApproval(
  orgId: string,
  versionId: string,
  approverIds: string[],
) {
  const db = await createSupabaseServerClient();

  await db
    .from('policy_versions')
    .update({ status: 'pending_approval' })
    .eq('id', versionId)
    .eq('org_id', orgId);

  const approvals = approverIds.map((id) => ({
    org_id: orgId,
    policy_version_id: versionId,
    approver_id: id,
    decision: 'pending' as const,
  }));

  await db.from('policy_approvals').insert(approvals);
}

export async function recordApprovalDecision(
  orgId: string,
  approvalId: string,
  decision: 'approved' | 'rejected',
  comment?: string,
) {
  const db = await createSupabaseServerClient();

  await db
    .from('policy_approvals')
    .update({ decision, comment, decided_at: new Date().toISOString() })
    .eq('id', approvalId)
    .eq('org_id', orgId);

  // Check if all approvals decided for this version
  const { data: approval } = await db
    .from('policy_approvals')
    .select('policy_version_id')
    .eq('id', approvalId)
    .single();

  if (!approval) return;

  const { data: pending } = await db
    .from('policy_approvals')
    .select('id')
    .eq('policy_version_id', approval.policy_version_id)
    .eq('decision', 'pending');

  if (!pending || pending.length === 0) {
    // All decided — check if any rejected
    const { data: rejected } = await db
      .from('policy_approvals')
      .select('id')
      .eq('policy_version_id', approval.policy_version_id)
      .eq('decision', 'rejected');

    const finalStatus = rejected && rejected.length > 0 ? 'draft' : 'approved';
    await db
      .from('policy_versions')
      .update({ status: finalStatus })
      .eq('id', approval.policy_version_id);
  }
}

export async function publishVersion(orgId: string, versionId: string) {
  const db = await createSupabaseServerClient();

  // Get the policy_id to archive previous published versions
  const { data: version } = await db
    .from('policy_versions')
    .select('policy_id')
    .eq('id', versionId)
    .eq('org_id', orgId)
    .single();

  if (!version) throw new Error('Version not found');

  // Archive any current published version
  await db
    .from('policy_versions')
    .update({ status: 'archived' })
    .eq('org_id', orgId)
    .eq('policy_id', version.policy_id)
    .eq('status', 'published');

  // Publish this version
  await db
    .from('policy_versions')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', versionId)
    .eq('org_id', orgId);
}

export async function acknowledgePolicy(
  orgId: string,
  policyId: string,
  versionId: string,
  userId: string,
) {
  const db = await createSupabaseServerClient();

  const { error } = await db.from('policy_acknowledgments').upsert(
    {
      org_id: orgId,
      policy_id: policyId,
      policy_version_id: versionId,
      user_id: userId,
    },
    { onConflict: 'policy_version_id,user_id' },
  );

  if (error) throw error;
}

export async function getAcknowledgmentStatus(
  orgId: string,
  policyId: string,
  versionId: string,
) {
  const db = await createSupabaseServerClient();

  const [{ count: acked }, { count: totalMembers }] = await Promise.all([
    db
      .from('policy_acknowledgments')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('policy_version_id', versionId),
    db
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),
  ]);

  return {
    acknowledged: acked || 0,
    total: totalMembers || 0,
    percentage: totalMembers
      ? Math.round(((acked || 0) / totalMembers) * 100)
      : 0,
  };
}

export async function getPoliciesDueForReview(orgId: string) {
  const db = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await db
    .from('policy_review_schedules')
    .select('*')
    .eq('org_id', orgId)
    .lte('next_review_date', today)
    .order('next_review_date');

  return data || [];
}

export async function scheduleReview(
  orgId: string,
  policyId: string,
  frequency: 'quarterly' | 'semi_annual' | 'annual' | 'biennial',
  reviewerIds: string[],
) {
  const db = await createSupabaseServerClient();

  const monthsMap: Record<string, number> = {
    quarterly: 3,
    semi_annual: 6,
    annual: 12,
    biennial: 24,
  };
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + monthsMap[frequency]);

  const { error } = await db.from('policy_review_schedules').upsert(
    {
      org_id: orgId,
      policy_id: policyId,
      review_frequency: frequency,
      next_review_date: nextDate.toISOString().split('T')[0],
      reviewer_ids: reviewerIds,
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
}
