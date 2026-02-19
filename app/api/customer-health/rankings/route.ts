import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { calculateHealthScore } from '@/lib/customer-health/health-score-engine';
import { isFounder } from '@/lib/utils/founder';
import type {
  HealthRankings,
  HealthSummary,
  CustomerHealthScore,
  HealthScoreInput,
} from '@/lib/customer-health/health-types';

type OrgRow = {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
  org_subscriptions?: {
    plan_key?: string | null;
    status?: string | null;
    trial_expires_at?: string | null;
  }[];
};

type OrgIdRow = {
  organization_id: string;
};

type LoginRow = {
  organization_id: string;
  created_at: string;
};

type ActivityRow = {
  organization_id: string;
  action: string | null;
};

type ComplianceRow = {
  organization_id: string;
  compliance_score: number | null;
  captured_at: string;
};

function addCount(map: Map<string, number>, orgId: string) {
  map.set(orgId, (map.get(orgId) ?? 0) + 1);
}

/**
 * GET /api/customer-health/rankings
 * Returns health rankings for all organizations (founder only)
 */
export async function GET() {
  let supabase;
  let userEmail: string;
  let userId: string;

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
        { status: 401 },
      );
    }

    userEmail = user.email || '';
    userId = user.id;
  } catch (authError) {
    console.error('[Health Rankings] Auth error:', authError);
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication failed.',
        code: 'AUTH_ERROR',
      },
      { status: 401 },
    );
  }

  if (!isFounder(userEmail, userId)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'This endpoint is restricted to founders.',
        code: 'FOUNDER_REQUIRED',
      },
      { status: 403 },
    );
  }

  try {
    const adminClient = createSupabaseAdminClient();

    const { data: organizations, error: orgsError } = await adminClient
      .from('organizations')
      .select(
        `
        id,
        name,
        industry,
        created_at,
        org_subscriptions (
          plan_key,
          status,
          trial_expires_at
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (orgsError) {
      throw new Error(`Failed to fetch organizations: ${orgsError.message}`);
    }

    const orgRows = (organizations ?? []) as OrgRow[];
    if (!orgRows.length) {
      const emptySummary: HealthSummary = {
        total: 0,
        healthy: 0,
        warning: 0,
        atRisk: 0,
        critical: 0,
        averageScore: 0,
        trialing: 0,
        activeSubscriptions: 0,
      };

      const rankings: HealthRankings = {
        organizations: [],
        summary: emptySummary,
        calculatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ rankings, generatedAt: new Date().toISOString() });
    }

    const orgIds = orgRows.map((org) => org.id);
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      { data: members },
      { data: loginRows },
      { data: activityRows },
      { data: complianceRows },
      { data: workflows },
      { data: workflowRuns },
      { data: overdueTasks },
    ] = await Promise.all([
      adminClient
        .from('org_members')
        .select('organization_id')
        .in('organization_id', orgIds),
      adminClient
        .from('org_audit_logs')
        .select('organization_id, created_at')
        .in('organization_id', orgIds)
        .eq('action', 'user.login')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false }),
      adminClient
        .from('org_audit_logs')
        .select('organization_id, action')
        .in('organization_id', orgIds)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(10000),
      adminClient
        .from('org_compliance_snapshots')
        .select('organization_id, compliance_score, captured_at')
        .in('organization_id', orgIds)
        .order('captured_at', { ascending: false })
        .limit(10000),
      adminClient
        .from('org_workflows')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('status', 'active'),
      adminClient
        .from('org_workflow_runs')
        .select('organization_id')
        .in('organization_id', orgIds)
        .gte('triggered_at', thirtyDaysAgo.toISOString())
        .limit(10000),
      adminClient
        .from('org_tasks')
        .select('organization_id')
        .in('organization_id', orgIds)
        .eq('status', 'open')
        .lt('due_date', now.toISOString())
        .limit(10000),
    ]);

    const memberCountByOrg = new Map<string, number>();
    ((members ?? []) as OrgIdRow[]).forEach((row) => {
      addCount(memberCountByOrg, row.organization_id);
    });

    const loginStatsByOrg = new Map<
      string,
      { lastLoginAt: string | null; last7: number; last30: number }
    >();
    ((loginRows ?? []) as LoginRow[]).forEach((row) => {
      const current =
        loginStatsByOrg.get(row.organization_id) ??
        ({ lastLoginAt: null, last7: 0, last30: 0 } as const);

      const next = {
        lastLoginAt: current.lastLoginAt ?? row.created_at,
        last7:
          current.last7 +
          (new Date(row.created_at).getTime() >= sevenDaysAgo.getTime() ? 1 : 0),
        last30: current.last30 + 1,
      };

      loginStatsByOrg.set(row.organization_id, next);
    });

    const featuresByOrg = new Map<string, Set<string>>();
    ((activityRows ?? []) as ActivityRow[]).forEach((row) => {
      const action = row.action?.split('.')[0];
      if (!action) return;
      const set = featuresByOrg.get(row.organization_id) ?? new Set<string>();
      set.add(action);
      featuresByOrg.set(row.organization_id, set);
    });

    const complianceByOrg = new Map<string, number[]>();
    ((complianceRows ?? []) as ComplianceRow[]).forEach((row) => {
      const list = complianceByOrg.get(row.organization_id) ?? [];
      if (typeof row.compliance_score === 'number') {
        if (list.length < 2) {
          list.push(row.compliance_score);
          complianceByOrg.set(row.organization_id, list);
        }
      }
    });

    const workflowsByOrg = new Map<string, number>();
    ((workflows ?? []) as OrgIdRow[]).forEach((row) => {
      addCount(workflowsByOrg, row.organization_id);
    });

    const workflowRunsByOrg = new Map<string, number>();
    ((workflowRuns ?? []) as OrgIdRow[]).forEach((row) => {
      addCount(workflowRunsByOrg, row.organization_id);
    });

    const overdueTasksByOrg = new Map<string, number>();
    ((overdueTasks ?? []) as OrgIdRow[]).forEach((row) => {
      addCount(overdueTasksByOrg, row.organization_id);
    });

    const healthScores: CustomerHealthScore[] = [];

    for (const org of orgRows) {
      const subscription = org.org_subscriptions?.[0];
      const isTrialing = subscription?.status === 'trialing';

      let trialDaysRemaining: number | null = null;
      if (isTrialing && subscription?.trial_expires_at) {
        const trialEnd = new Date(subscription.trial_expires_at);
        trialDaysRemaining = Math.max(
          0,
          Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        );
      }

      const loginStats = loginStatsByOrg.get(org.id);
      const complianceScores = complianceByOrg.get(org.id) ?? [];
      const currentComplianceScore = complianceScores[0] ?? 0;
      const previousComplianceScore =
        complianceScores[1] ?? currentComplianceScore;

      const input: HealthScoreInput = {
        orgId: org.id,
        orgName: org.name,
        industry: org.industry,
        plan: subscription?.plan_key || 'basic',
        createdAt: org.created_at,
        memberCount: memberCountByOrg.get(org.id) || 1,
        lastLoginAt: loginStats?.lastLoginAt ?? null,
        loginCountLast7Days: loginStats?.last7 ?? 0,
        loginCountLast30Days: loginStats?.last30 ?? 0,
        featuresUsed: Array.from(featuresByOrg.get(org.id) ?? []),
        totalFeatures: 12,
        currentComplianceScore,
        previousComplianceScore,
        complianceTrendDays: 30,
        workflowsConfigured: workflowsByOrg.get(org.id) ?? 0,
        workflowsTriggeredLast30Days: workflowRunsByOrg.get(org.id) ?? 0,
        overdueTasksCount: overdueTasksByOrg.get(org.id) ?? 0,
        overdueEvidenceCount: 0,
        overdueReviewsCount: 0,
        isTrialing,
        trialDaysRemaining,
      };

      healthScores.push(calculateHealthScore(input));
    }

    healthScores.sort((a, b) => a.score - b.score);

    const summary: HealthSummary = {
      total: healthScores.length,
      healthy: healthScores.filter((h) => h.status === 'Healthy').length,
      warning: healthScores.filter((h) => h.status === 'Warning').length,
      atRisk: healthScores.filter((h) => h.status === 'At Risk').length,
      critical: healthScores.filter((h) => h.status === 'Critical').length,
      averageScore:
        healthScores.length > 0
          ? Math.round(
              healthScores.reduce((sum, h) => sum + h.score, 0) /
                healthScores.length,
            )
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
      { status: 500 },
    );
  }
}
