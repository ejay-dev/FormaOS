import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getMultiFrameworkRollup, getFrameworkComparison } from '@/lib/executive/multi-framework-rollup';
import { routeLog } from '@/lib/monitoring/server-logger';

/**
 * GET /api/executive/frameworks
 * Returns framework rollup with scores and trends
 * Restricted to owner/admin roles
 */
const log = routeLog('/api/executive/frameworks');

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
    log.error({ err: authError }, "[Executive Frameworks] Auth error:");
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Authentication failed.',
        code: 'AUTH_ERROR',
      },
      { status: 401 }
    );
  }

  // TENANT ISOLATION: Get organization and verify role
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

    // Check for executive-level role (owner or admin)
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Executive dashboard requires admin access.',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      );
    }

    orgId = membership.organization_id;
  } catch (orgError) {
    log.error({ err: orgError }, "[Executive Frameworks] Org lookup error:");
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
    const [rollup, comparison] = await Promise.all([
      getMultiFrameworkRollup(orgId),
      getFrameworkComparison(orgId),
    ]);

    return NextResponse.json({
      frameworks: rollup,
      comparison,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error({ err: error }, "[Executive Frameworks] Calculation error:");
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch framework rollup.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}
