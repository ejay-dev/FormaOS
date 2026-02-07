import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateHealthScore } from '@/lib/customer-health/health-score-engine';
import type { HealthScoreInput } from '@/lib/customer-health/health-types';

/**
 * GET /api/customer-health/score
 * Returns the health score for the current user's organization
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
    console.error('[Health Score] Auth error:', authError);
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
      .select('organization_id, role')
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
    console.error('[Health Score] Org lookup error:', orgError);
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
    // Fetch organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, industry, created_at')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    // Fetch subscription data
    const { data: subscription } = await supabase
      .from('org_subscriptions')
      .select('plan_key, status, trial_expires_at')
      .eq('organization_id', orgId)
      .maybeSingle();

    const isTrialing = subscription?.status === 'trialing';
    let trialDaysRemaining: number | null = null;

    if (isTrialing && subscription?.trial_expires_at) {
      const trialEnd = new Date(subscription.trial_expires_at);
      const now = new Date();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    // Fetch member count
    const { count: memberCount } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Fetch login activity (from audit logs)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentLogins } = await supabase
      .from('org_audit_logs')
      .select('created_at')
      .eq('organization_id', orgId)
      .eq('action', 'user.login')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const loginCountLast7Days = recentLogins?.filter(
      (log: { created_at: string }) => new Date(log.created_at) >= sevenDaysAgo
    ).length || 0;

    const loginCountLast30Days = recentLogins?.length || 0;

    // Determine features used based on activity
    const { data: activityLogs } = await supabase
      .from('org_audit_logs')
      .select('action')
      .eq('organization_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const featuresUsed = new Set<string>();
    const totalFeatures = 12; // tasks, evidence, policies, controls, frameworks, team, vault, reports, workflows, patients, incidents, registers

    activityLogs?.forEach((log: { action?: string }) => {
      const action = log.action?.split('.')[0];
      if (action) featuresUsed.add(action);
    });

    // Fetch compliance scores (current and 30 days ago)
    const { data: complianceSnapshots } = await supabase
      .from('org_compliance_snapshots')
      .select('compliance_score, captured_at')
      .eq('organization_id', orgId)
      .order('captured_at', { ascending: false })
      .limit(30);

    const currentComplianceScore = complianceSnapshots?.[0]?.compliance_score || 0;
    const previousComplianceScore =
      complianceSnapshots?.[complianceSnapshots.length - 1]?.compliance_score ||
      currentComplianceScore;

    // Fetch workflow data
    const { count: workflowsConfigured } = await supabase
      .from('org_workflows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active');

    const { count: workflowsTriggered } = await supabase
      .from('org_workflow_runs')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('triggered_at', thirtyDaysAgo.toISOString());

    // Fetch overdue items
    const now = new Date().toISOString();

    const { count: overdueTasksCount } = await supabase
      .from('org_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'open')
      .lt('due_date', now);

    const { count: overdueEvidenceCount } = await supabase
      .from('org_evidence')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .lt('expires_at', now);

    const { count: overdueReviewsCount } = await supabase
      .from('org_care_plans')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .lt('review_date', now);

    // Build input for health score calculation
    const input: HealthScoreInput = {
      orgId: org.id,
      orgName: org.name,
      industry: org.industry,
      plan: subscription?.plan_key || 'basic',
      createdAt: org.created_at,
      memberCount: memberCount || 1,
      lastLoginAt: recentLogins?.[0]?.created_at || null,
      loginCountLast7Days,
      loginCountLast30Days,
      featuresUsed: Array.from(featuresUsed),
      totalFeatures,
      currentComplianceScore,
      previousComplianceScore,
      complianceTrendDays: 30,
      workflowsConfigured: workflowsConfigured || 0,
      workflowsTriggeredLast30Days: workflowsTriggered || 0,
      overdueTasksCount: overdueTasksCount || 0,
      overdueEvidenceCount: overdueEvidenceCount || 0,
      overdueReviewsCount: overdueReviewsCount || 0,
      isTrialing,
      trialDaysRemaining,
    };

    // Calculate health score
    const healthScore = calculateHealthScore(input);

    // Optionally cache the score
    await supabase.from('org_health_scores').upsert(
      {
        organization_id: orgId,
        score: healthScore.score,
        status: healthScore.status.toLowerCase().replace(' ', '_'),
        factors: healthScore.factors,
        alerts: healthScore.alerts,
        recommended_actions: healthScore.recommendedActions,
        last_login_at: healthScore.lastLoginAt,
        features_used: input.featuresUsed,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    );

    return NextResponse.json({
      healthScore,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health Score] Calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to calculate health score.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}
