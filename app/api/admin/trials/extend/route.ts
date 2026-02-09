import { requireFounderAccess } from '@/app/app/admin/access';
import { logActivity } from '@/lib/audit-logger';
import { checkApiRateLimit, getClientIp } from '@/lib/ratelimit';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { MAX_TRIAL_EXTENSION_DAYS } from '@/lib/trial/constants';
import { NextResponse, type NextRequest } from 'next/server';
import { handleAdminError } from '@/app/api/admin/_helpers';
import { logRateLimitEvent } from '@/lib/security/rate-limit-log';

/**
 * =========================================================
 * ADMIN: Extend trial for an organization
 * =========================================================
 * PATCH /api/admin/trials/extend
 *
 * Body: { organization_id: string, additional_days: number }
 *
 * Security: Requires founder access.
 * Validation: Max extension is MAX_TRIAL_EXTENSION_DAYS.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireFounderAccess();

    // Rate limit: 10 requests per 60 s per IP
    const ip = getClientIp(request);
    const rl = await checkApiRateLimit(`admin:trials:extend:${ip}`);
    if (!rl.success) {
      void logRateLimitEvent({
        identifier: `admin:trials:extend:${ip}`,
        endpoint: request.nextUrl.pathname,
        requestCount: rl.limit,
        windowStart: rl.reset - 60 * 1000,
        blocked: true,
        ipAddress: ip,
      });
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const body = await request.json();
    const { organization_id, additional_days } = body;

    if (!organization_id || typeof organization_id !== 'string') {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 },
      );
    }

    if (
      !additional_days ||
      typeof additional_days !== 'number' ||
      additional_days < 1 ||
      additional_days > MAX_TRIAL_EXTENSION_DAYS
    ) {
      return NextResponse.json(
        {
          error: `additional_days must be between 1 and ${MAX_TRIAL_EXTENSION_DAYS}`,
        },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();

    // Get current subscription
    const { data: subscription, error: fetchError } = await admin
      .from('org_subscriptions')
      .select('id, status, trial_expires_at, current_period_end, plan_key')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (fetchError) {
      console.error('[admin/trials/extend] fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 },
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found for this organization' },
        { status: 404 },
      );
    }

    // Verify the target org actually exists (org-isolation guard)
    const { data: targetOrg, error: orgCheckError } = await admin
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .maybeSingle();

    if (orgCheckError || !targetOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 },
      );
    }

    // Calculate new trial end date
    const currentEnd =
      subscription.trial_expires_at ||
      subscription.current_period_end ||
      new Date().toISOString();

    const baseDate = new Date(currentEnd);
    // If trial already expired, extend from now
    const effectiveBase = baseDate < new Date() ? new Date() : baseDate;
    effectiveBase.setDate(effectiveBase.getDate() + additional_days);
    const newTrialEnd = effectiveBase.toISOString();

    // Update subscription
    const { error: updateError } = await admin
      .from('org_subscriptions')
      .update({
        trial_expires_at: newTrialEnd,
        current_period_end: newTrialEnd,
        status: 'trialing', // Re-activate trial if it was expired
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organization_id);

    if (updateError) {
      console.error('[admin/trials/extend] update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to extend trial' },
        { status: 500 },
      );
    }

    // Audit trail — persisted to org_audit_logs
    await logActivity({
      orgId: organization_id,
      action: 'trial.extended',
      targetId: subscription.id,
      diff: {
        before: { trial_expires_at: currentEnd },
        after: { trial_expires_at: newTrialEnd, additional_days },
      },
      metadata: { ip },
    });

    console.log('[admin/trials/extend] ✅ Trial extended', {
      organization_id,
      additional_days,
      new_trial_end: newTrialEnd,
      previous_end: currentEnd,
    });

    // Get org name for response
    const { data: org } = await admin
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      organization_id,
      organization_name: org?.name ?? 'Unknown',
      previous_trial_end: currentEnd,
      new_trial_end: newTrialEnd,
      additional_days,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/trials/extend');
  }
}
