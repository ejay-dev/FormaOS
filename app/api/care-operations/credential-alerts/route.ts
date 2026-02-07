import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getExpiringCredentials,
  getExpiredCredentials,
  getCredentialSummaryByType,
} from '@/lib/care-scorecard/credential-monitor';
import type { CredentialType, Credential } from '@/lib/care-scorecard/types';

/**
 * GET /api/care-operations/credential-alerts
 * Returns detailed credential expiry information
 */
export async function GET(request: NextRequest) {
  let supabase;
  let userId: string;
  let orgId: string;

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const daysAhead = parseInt(searchParams.get('days') || '90', 10);
  const credentialType = searchParams.get('type') as CredentialType | null;
  const filter = searchParams.get('filter'); // 'expired' | 'expiring' | 'all'

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
    console.error('[Credential Alerts] Auth error:', authError);
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

    // Only admins/owners can view all credential alerts
    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Admin access required to view credential alerts.',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      );
    }

    orgId = membership.organization_id;
  } catch (orgError) {
    console.error('[Credential Alerts] Org lookup error:', orgError);
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
    const credentialTypes = credentialType ? [credentialType] : undefined;

    // Fetch data based on filter
    let expiring: Credential[] = [];
    let expired: Credential[] = [];

    if (filter !== 'expired') {
      expiring = await getExpiringCredentials(orgId, {
        daysAhead,
        credentialTypes,
      });
    }

    if (filter !== 'expiring') {
      expired = await getExpiredCredentials(orgId);
      if (credentialTypes) {
        expired = expired.filter((c) => credentialTypes.includes(c.type));
      }
    }

    // Get summary by type
    const summary = await getCredentialSummaryByType(orgId);

    return NextResponse.json({
      expiring,
      expired,
      summary,
      filters: {
        daysAhead,
        credentialType,
        filter,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Credential Alerts] Fetch error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch credential alerts.',
        code: 'FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
