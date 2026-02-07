import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateHealthScore } from '@/lib/customer-health/health-score-engine';
import type {
  HealthRankings,
  HealthSummary,
  CustomerHealthScore,
  HealthScoreInput,
} from '@/lib/customer-health/health-types';

/**
 * GET /api/customer-health/rankings
 * Returns health rankings for all organizations (founder only)
 */
export async function GET() {
  let supabase;
  let userId: string;
  let userEmail: string;

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
    userEmail = user.email || '';
  } catch (authError) {
    console.error('[Health Rankings] Auth error:', authError);
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication failed.',
        code: 'AUTH_ERROR',
      },
      { status: 401 }
    );
  }

  // AUTHORIZATION: Founder check
  const FOUNDER_EMAILS = (process.env.FOUNDER_EMAILS || '').split(',').map((e) => e.trim());
  const isFounder = FOUNDER_EMAILS.includes(userEmail);

  if (!isFounder) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'This endpoint is restricted to founders.',
        code: 'FOUNDER_REQUIRED',
      },
      { status: 403 }
    );
  }

  try {
    // Use admin client to access all organizations
    const adminClient = createSupabaseAdminClient();

    // Fetch all organizations with subscriptions
    const { data: organizations, error: orgsError } = await adminClient
      .from('organizations')
      .select(`
        id,
        name,
        industry,
        created_at,
        org_subscriptions (
          plan_key,
          status,
          trial_expires_at
        )
      `)
      .order('created_at', { ascending: false });

    if (orgsError) {
      throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
    }

    const healthScores: CustomerHealthScore[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate health score for each organization
    for (const org of organizations || []) {
      try {
        const subscription = org.org_subscriptions?.[0];
        const isTrialing = subscription?.status === 'trialing';
        let trialDaysRemaining: number | null = null;

        if (isTrialing && subscription?.trial_expires_at) {
          const trialEnd = new Date(subscription.trial_expires_at);
          trialDaysRemaining = Math.max(
            0,
            Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          );
        }

        // Fetch member count
        const { count: memberCount } = await adminClient
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Fetch login activity
        const { data: recentLogins } = await adminClient
          .from('org_audit_logs')
          .select('created_at')
          .eq('organization_id', org.id)
          .eq('action', 'user.login')
          .gte('created_at', thirtyDaysAgo.toISOString());

        const loginCountLast7Days =
          recentLogins?.filter((log: { created_at: string }) => new Date(log.created_at) >= sevenDaysAgo).length || 0;

        const loginCountLast30Days = recentLogins?.length || 0;

        // Fetch features used
        const { data: activityLogs } = await adminClient
          .from('org_audit_logs')
          .select('action')
          .eq('organization_id', org.id)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .limit(100);

        const featuresUsed = new Set<string>();
        activityLogs?.forEach((log: { action?: string }) => {
          const action = log.action?.split('.')[0];
          if (action) featuresUsed.add(action);
        });

        // Fetch compliance scores
        const { data: complianceSnapshots } = await adminClient
          .from('org_compliance_snapshots')
          .select('compliance_score')
          .eq('organization_id', org.id)
          .order('captured_at', { ascending: false })
          .limit(2);

        const currentComplianceScore = complianceSnapshots?.[0]?.compliance_score || 0;
        const previousComplianceScore =
          complianceSnapshots?.[1]?.compliance_score || currentComplianceScore;

        // Fetch workflow data
        const { count: workflowsConfigured } = await adminClient
          .from('org_workflows')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'active');

        const { count: workflowsTriggered } = await adminClient
          .from('org_workflow_runs')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .gte('triggered_at', thirtyDaysAgo.toISOString());

        // Fetch overdue items
        const { count: overdueTasksCount } = await adminClient
          .from('org_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('status', 'open')
          .lt('due_date', now.toISOString());

        // Build input
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
          totalFeatures: 12,
          currentComplianceScore,
          previousComplianceScore,
          complianceTrendDays: 30,
          workflowsConfigured: workflowsConfigured || 0,
          workflowsTriggeredLast30Days: workflowsTriggered || 0,
          overdueTasksCount: overdueTasksCount || 0,
          overdueEvidenceCount: 0,
          overdueReviewsCount: 0,
          isTrialing,
          trialDaysRemaining,
        };

        const healthScore = calculateHealthScore(input);
        healthScores.push(healthScore);
      } catch (orgError) {
        console.error(`[Health Rankings] Error processing org ${org.id}:`, orgError);
        // Continue with other organizations
      }
    }

    // Sort by score (lowest first to prioritize at-risk)
    healthScores.sort((a, b) => a.score - b.score);

    // Calculate summary
    const summary: HealthSummary = {
      total: healthScores.length,
      healthy: healthScores.filter((h) => h.status === 'Healthy').length,
      warning: healthScores.filter((h) => h.status === 'Warning').length,
      atRisk: healthScores.filter((h) => h.status === 'At Risk').length,
      critical: healthScores.filter((h) => h.status === 'Critical').length,
      averageScore: healthScores.length > 0
        ? Math.round(healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length)
        : 0,
      trialing: healthScores.filter((h) => h.isTrialing).length,
      activeSubscriptions: healthScores.filter((h) => !h.isTrialing).length,
    };

    const rankings: HealthRankings = {
      organizations: healthScores,
      summary,
      calculatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      rankings,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health Rankings] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to calculate health rankings.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}
