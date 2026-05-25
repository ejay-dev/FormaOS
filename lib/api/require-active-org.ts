import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  resolveActiveMembership,
  type ActiveMembershipResult,
} from '@/lib/auth/membership-cache';

/**
 * One-call helper for v1 API routes that need an authenticated user
 * AND an unambiguous active organization.
 *
 * Returns either an `ok` result with the resolved orgId, or a
 * `NextResponse` ready to be returned from the handler.
 *
 *   const ctx = await requireActiveOrgContext(supabase);
 *   if (!ctx.ok) return ctx.response;
 *   const { userId, orgId, role } = ctx;
 *
 * Status codes:
 *  - 401 for unauthenticated users
 *  - 400 if the user has no org memberships
 *  - 409 when a multi-org user has not selected an active org. The
 *    response body lists their memberships so the client can prompt
 *    a switch via /api/v1/account/active-organization.
 */
export type ActiveOrgContext =
  | {
      ok: true;
      userId: string;
      orgId: string;
      role: string | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function requireActiveOrgContext(
  supabase?: SupabaseClient,
): Promise<ActiveOrgContext> {
  const result: ActiveMembershipResult = await resolveActiveMembership(
    supabase,
  );

  switch (result.kind) {
    case 'ok':
      return {
        ok: true,
        userId: result.userId,
        orgId: result.organizationId,
        role: result.role,
      };
    case 'unauthorized':
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        ),
      };
    case 'none':
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'No organization' },
          { status: 400 },
        ),
      };
    case 'ambiguous':
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'active_org_required',
            message:
              'You belong to multiple organisations. Select an active organisation before calling this endpoint.',
            memberships: result.memberships,
          },
          { status: 409 },
        ),
      };
  }
}
