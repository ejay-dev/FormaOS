import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateCareScorecard } from '@/lib/care-scorecard/scorecard-service';
import { generateCredentialAlerts } from '@/lib/care-scorecard/credential-monitor';
import type { CareIndustry, CareScorecardAPIResponse, CareScorecardAlert } from '@/lib/care-scorecard/types';

// Industries that support care operations scorecard
const CARE_INDUSTRIES = ['ndis', 'healthcare', 'aged_care', 'childcare'];

/**
 * GET /api/care-operations/scorecard
 * Returns care operations scorecard for the current user's organization
 * Only available for NDIS/Healthcare/Aged Care/Childcare industries
 */
export async function GET() {
  let supabase;
  let userId: string;
  let orgId: string;
  let industry: CareIndustry;

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
    console.error('[Care Scorecard] Auth error:', authError);
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

    // Get organization industry
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('industry')
      .eq('id', orgId)
      .single();

    if (orgError || !org?.industry) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Organization industry not configured.',
          code: 'INDUSTRY_NOT_SET',
        },
        { status: 403 }
      );
    }

    // Check if industry supports care operations
    if (!CARE_INDUSTRIES.includes(org.industry)) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Care operations scorecard is only available for NDIS, Healthcare, Aged Care, and Childcare industries.',
          code: 'INDUSTRY_NOT_SUPPORTED',
        },
        { status: 403 }
      );
    }

    industry = org.industry as CareIndustry;
  } catch (orgError) {
    console.error('[Care Scorecard] Org lookup error:', orgError);
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
    // Generate scorecard and alerts in parallel
    const [scorecard, credentialAlerts] = await Promise.all([
      generateCareScorecard(orgId, industry),
      generateCredentialAlerts(orgId),
    ]);

    // Generate additional alerts based on scorecard data
    const alerts: CareScorecardAlert[] = [...credentialAlerts];

    // Visit alerts
    if (scorecard.visits.missed > 0) {
      alerts.push({
        type: 'warning',
        category: 'visits',
        message: `${scorecard.visits.missed} visits missed this week`,
        actionUrl: '/app/visits?filter=missed',
        count: scorecard.visits.missed,
      });
    }

    // Care plan alerts
    if (scorecard.carePlans.reviewsDue > 0) {
      alerts.push({
        type: scorecard.carePlans.reviewsDue > 5 ? 'critical' : 'warning',
        category: 'care_plans',
        message: `${scorecard.carePlans.reviewsDue} care plan reviews overdue`,
        actionUrl: '/app/care-plans?filter=review_due',
        count: scorecard.carePlans.reviewsDue,
      });
    }

    // Incident alerts
    if (scorecard.incidents.openCount > 10) {
      alerts.push({
        type: 'warning',
        category: 'incidents',
        message: `${scorecard.incidents.openCount} open incidents require attention`,
        actionUrl: '/app/incidents?filter=open',
        count: scorecard.incidents.openCount,
      });
    }

    if (scorecard.incidents.overdueFollowUp > 0) {
      alerts.push({
        type: 'critical',
        category: 'incidents',
        message: `${scorecard.incidents.overdueFollowUp} incidents have overdue follow-ups`,
        actionUrl: '/app/incidents?filter=overdue_followup',
        count: scorecard.incidents.overdueFollowUp,
      });
    }

    // Workload alerts
    if (scorecard.workload.overloaded > 0) {
      alerts.push({
        type: 'warning',
        category: 'workload',
        message: `${scorecard.workload.overloaded} staff members are overloaded`,
        actionUrl: '/app/team/workload',
        count: scorecard.workload.overloaded,
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (scorecard.staffCompliance.percentage < 100) {
      recommendations.push(
        `Address ${scorecard.staffCompliance.nonCompliant + scorecard.staffCompliance.pending} staff with pending or expired credentials.`
      );
    }

    if (scorecard.visits.completionRate < 90) {
      recommendations.push(
        'Review scheduling to improve visit completion rate.'
      );
    }

    if (scorecard.carePlans.reviewsDue > 0) {
      recommendations.push(
        'Schedule time to complete overdue care plan reviews.'
      );
    }

    if (scorecard.incidents.openCount > 5) {
      recommendations.push(
        'Prioritize resolution of open incidents to maintain quality of care.'
      );
    }

    if (scorecard.workload.overloaded > scorecard.workload.underutilized) {
      recommendations.push(
        'Consider redistributing workload from overloaded to underutilized staff.'
      );
    }

    const response: CareScorecardAPIResponse = {
      scorecard,
      alerts: alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 };
        return priority[a.type] - priority[b.type];
      }),
      recommendations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Care Scorecard] Calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to generate care operations scorecard.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}
