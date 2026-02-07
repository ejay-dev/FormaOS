import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateTrialValue, generateValueRecapMessage } from '@/lib/trial-engagement/value-calculator';
import { TRIAL_DURATION_DAYS } from '@/lib/trial/constants';

/**
 * GET /api/trial/value-recap
 * Returns trial value metrics for the current user's organization
 */
export async function GET() {
  let supabase;
  let userId: string;
  let orgId: string;

  // TENANT ISOLATION: Authenticate user
  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Session expired. Please sign in again.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }

    userId = user.id;
  } catch (authError) {
    console.error('[Trial Value Recap] Auth error:', authError);
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication failed.',
        code: 'AUTH_ERROR',
      },
      { status: 401 }
    );
  }

  // TENANT ISOLATION: Get organization
  try {
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership?.organization_id) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Organization membership not found.',
          code: 'ORG_NOT_FOUND',
        },
        { status: 403 }
      );
    }

    orgId = membership.organization_id;
  } catch (orgError) {
    console.error('[Trial Value Recap] Org lookup error:', orgError);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to lookup organization.',
        code: 'ORG_LOOKUP_ERROR',
      },
      { status: 500 }
    );
  }

  try {
    // Get subscription data
    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('status, trial_expires_at, created_at')
      .eq('organization_id', orgId)
      .maybeSingle();

    // Only calculate for trial users
    if (subscription?.status !== 'trialing') {
      return NextResponse.json({
        metrics: null,
        message: null,
        isTrialing: false,
      });
    }

    // Calculate trial dates
    const trialStartDate = subscription.created_at
      ? new Date(subscription.created_at)
      : new Date();

    const trialEndDate = subscription.trial_expires_at
      ? new Date(subscription.trial_expires_at)
      : new Date(trialStartDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

    // Calculate value metrics
    const metrics = await calculateTrialValue(orgId, trialStartDate, trialEndDate);

    // Generate recap message
    const message = generateValueRecapMessage(metrics);

    return NextResponse.json({
      metrics,
      message,
      isTrialing: true,
      trialStartDate: trialStartDate.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
    });
  } catch (error) {
    console.error('[Trial Value Recap] Calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to calculate trial value.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}
