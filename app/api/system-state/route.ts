import { NextResponse } from 'next/server';
import { fetchSystemState } from '@/lib/system-state/server';

/**
 * =========================================================
 * HYDRATION ENDPOINT: /api/system-state
 * =========================================================
 * 
 * Fetches complete user/org/entitlements state once per session.
 * 
 * Called by:
 * - AppHydrator component (on mount, once)
 * - Client pages as fallback if hydration failed
 * 
 * Response includes:
 * - User (id, email, name)
 * - Organization (id, name, plan)
 * - Role & permissions
 * - Trial status
 * - Founder flag
 * 
 * ⚡ Performance: ~80-120ms (one Supabase multi-query)
 */

export async function GET(_request: Request) {
  try {
    // Check if user is authenticated
    const systemState = await fetchSystemState();

    if (!systemState) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return normalized state for client consumption
    return NextResponse.json({
      user: systemState.user,
      organization: systemState.organization,
      role: systemState.role,
      isFounder: systemState.isFounder,
      entitlements: systemState.entitlements,
    });
  } catch (error) {
    console.error('[/api/system-state] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system state' },
      { status: 500 }
    );
  }
}
