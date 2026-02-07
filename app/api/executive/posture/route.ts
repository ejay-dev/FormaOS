import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { calculateExecutivePosture } from '@/lib/executive/posture-calculator';
import type { ExecutivePosture } from '@/lib/executive/types';

/**
 * GET /api/executive/posture
 * Returns the executive compliance posture for the current user's organization
 * Restricted to owner/admin roles
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
    console.error('[Executive Posture] Auth error:', authError);
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
    console.error('[Executive Posture] Org lookup error:', orgError);
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
    const posture: ExecutivePosture = await calculateExecutivePosture(orgId);

    return NextResponse.json({
      posture,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Executive Posture] Calculation error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to calculate executive posture.',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    );
  }
}
