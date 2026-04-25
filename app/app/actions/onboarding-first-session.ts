'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { FirstSessionStepId } from '@/lib/onboarding/first-session';

const VALID_STEPS: readonly FirstSessionStepId[] = [
  'create-care-plan',
  'add-goal',
  'log-progress-note',
  'upload-evidence',
  'review-task',
];

type Result = { ok: true } | { ok: false; error: string };

/**
 * Marks a first-session guided step as "seen" so the completion toast doesn't
 * re-appear on the next page load. Tenancy is enforced by RLS on
 * org_first_session_progress — the authenticated user must be a member of
 * the resolved organization.
 */
export async function markFirstSessionStepSeen(
  stepId: FirstSessionStepId,
): Promise<Result> {
  if (!VALID_STEPS.includes(stepId)) {
    return { ok: false, error: 'invalid-step' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'unauthenticated' };

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)
    ?.organization_id;
  if (!orgId) return { ok: false, error: 'no-org' };

  try {
    const { data: existing } = await supabase
      .from('org_first_session_progress')
      .select('seen_steps')
      .eq('organization_id', orgId)
      .maybeSingle();
    const current = Array.isArray(existing?.seen_steps)
      ? (existing.seen_steps as string[])
      : [];
    if (current.includes(stepId)) return { ok: true };
    const next = [...current, stepId];

    const { error } = await supabase
      .from('org_first_session_progress')
      .upsert(
        {
          organization_id: orgId,
          seen_steps: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' },
      );
    if (error) return { ok: false, error: error.message };
  } catch (err) {
    // Migration not yet applied; fail soft so the UI doesn't break.
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }

  // Deliberately skip revalidatePath here: the toast dismisses locally and
  // the next natural navigation re-fetches the state. Revalidating /app from
  // this background action can clash with in-flight form submissions on
  // sibling routes (observed interfering with care-plan edits).
  return { ok: true };
}
