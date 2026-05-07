import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { computeHealthRankings } from '@/lib/customer-health/compute-rankings';
import { isFounder } from '@/lib/utils/founder';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/customer-health/rankings');

/**
 * GET /api/customer-health/rankings
 * Returns health rankings for all organizations (founder only)
 */
export async function GET() {
  let userEmail: string;
  let userId: string;

  try {
    const supabase = await createSupabaseServerClient();
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
    log.error({ err: authError }, '[Health Rankings] Auth error:');
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
    const rankings = await computeHealthRankings(adminClient);

    return NextResponse.json({
      rankings,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error({ err: error }, '[Health Rankings] Error:');
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
