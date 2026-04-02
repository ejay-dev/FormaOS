import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type FreshnessStatus = 'current' | 'expiring_soon' | 'expired' | 'needs_review';

/**
 * Calculate the freshness status for a single evidence item.
 */
export function calculateFreshness(evidence: {
  valid_until?: string | null;
  review_cycle_days?: number | null;
  last_reviewed_at?: string | null;
}): FreshnessStatus {
  const now = new Date();

  if (evidence.valid_until) {
    const expiry = new Date(evidence.valid_until);
    if (expiry < now) return 'expired';
    const daysUntilExpiry =
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 30) return 'expiring_soon';
  }

  if (evidence.review_cycle_days && evidence.last_reviewed_at) {
    const lastReview = new Date(evidence.last_reviewed_at);
    const daysSinceReview =
      (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReview > evidence.review_cycle_days) return 'needs_review';
  }

  return 'current';
}

/**
 * Get evidence expiring within N days.
 */
export async function getExpiringEvidence(orgId: string, withinDays = 30) {
  const db = createSupabaseAdminClient();
  const futureDate = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data } = await db
    .from('org_evidence')
    .select('id, title, valid_until, freshness_status')
    .eq('organization_id', orgId)
    .not('valid_until', 'is', null)
    .lte('valid_until', futureDate)
    .gte('valid_until', new Date().toISOString().slice(0, 10))
    .order('valid_until', { ascending: true });

  return data ?? [];
}

/**
 * Get all expired evidence.
 */
export async function getExpiredEvidence(orgId: string) {
  const db = createSupabaseAdminClient();

  const { data } = await db
    .from('org_evidence')
    .select('id, title, valid_until, freshness_status')
    .eq('organization_id', orgId)
    .eq('freshness_status', 'expired')
    .order('valid_until', { ascending: true });

  return data ?? [];
}

/**
 * Get evidence that is past its review cycle without a recent review.
 */
export async function getStaleEvidence(orgId: string) {
  const db = createSupabaseAdminClient();

  const { data } = await db
    .from('org_evidence')
    .select('id, title, review_cycle_days, last_reviewed_at, freshness_status')
    .eq('organization_id', orgId)
    .eq('freshness_status', 'needs_review')
    .order('last_reviewed_at', { ascending: true });

  return data ?? [];
}

/**
 * Configure the review cycle for an evidence item.
 */
export async function setReviewCycle(
  orgId: string,
  evidenceId: string,
  cycleDays: number,
) {
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('org_evidence')
    .update({ review_cycle_days: cycleDays })
    .eq('id', evidenceId)
    .eq('organization_id', orgId);

  if (error) throw new Error(`Failed to set review cycle: ${error.message}`);
}

/**
 * Mark evidence as reviewed.
 */
export async function markAsReviewed(
  orgId: string,
  evidenceId: string,
  reviewedBy: string,
) {
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('org_evidence')
    .update({
      last_reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
      freshness_status: 'current',
    })
    .eq('id', evidenceId)
    .eq('organization_id', orgId);

  if (error) throw new Error(`Failed to mark as reviewed: ${error.message}`);
}
