import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { createInvitation } from '@/lib/invitations/create-invitation';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import {
  emailSchema,
  formatZodError,
  validateBody,
} from '@/lib/security/api-validation';

const log = routeLog('/api/v1/members/invite');

const inviteRequestSchema = z.object({
  invites: z
    .array(
      z.object({
        email: emailSchema,
        role: z
          .enum(['owner', 'admin', 'member', 'viewer'])
          .default('member'),
      }),
    )
    .min(1, 'No invites provided')
    .max(10, 'Maximum 10 invites per request'),
});
type InviteRole = 'owner' | 'admin' | 'member' | 'viewer';

export async function POST(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { orgId, role: inviterRole } = ctx;

    const canInvite = inviterRole === 'owner' || inviterRole === 'admin';
    if (!canInvite) {
      return NextResponse.json(
        { error: 'Forbidden - only owners and admins can invite members' },
        { status: 403 },
      );
    }

    const validation = await validateBody(request, inviteRequestSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const { invites } = validation.data;

    // Seat-limit enforcement. Read team_limit entitlement and current
    // members + pending invites; reject the whole batch if it would exceed
    // the limit. Plans with no limit (limit_value = null on enabled rows,
    // typically enterprise) bypass.
    const admin = createSupabaseAdminClient();
    const [
      { data: entitlement },
      { count: memberCount },
      { count: pendingInviteCount },
    ] = await Promise.all([
      admin
        .from('org_entitlements')
        .select('enabled, limit_value')
        .eq('organization_id', orgId)
        .eq('feature_key', 'team_limit')
        .maybeSingle(),
      admin
        .from('org_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      admin
        .from('team_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'pending'),
    ]);

    const teamLimit =
      entitlement?.enabled && typeof entitlement.limit_value === 'number'
        ? entitlement.limit_value
        : entitlement?.enabled
          ? null
          : 0;

    if (teamLimit !== null) {
      const used = (memberCount ?? 0) + (pendingInviteCount ?? 0);
      const remaining = Math.max(0, teamLimit - used);
      if (remaining <= 0) {
        return NextResponse.json(
          {
            error: 'Seat limit reached',
            message: `Your plan allows ${teamLimit} seats and you have used all of them. Upgrade or remove a member to invite more.`,
            code: 'SEAT_LIMIT_REACHED',
            limit: teamLimit,
            used,
          },
          { status: 402 },
        );
      }
      if (invites.length > remaining) {
        return NextResponse.json(
          {
            error: 'Invite batch exceeds remaining seats',
            message: `You have ${remaining} seat${remaining === 1 ? '' : 's'} left on your plan but tried to invite ${invites.length}.`,
            code: 'SEAT_LIMIT_EXCEEDED',
            limit: teamLimit,
            used,
            remaining,
          },
          { status: 402 },
        );
      }
    }

    const results: Array<{ email: string; ok: boolean; error?: string }> = [];
    for (const inv of invites) {
      // emailSchema already lowercased + trimmed; role already enum-coerced.
      const email = inv.email;
      const role: InviteRole = inv.role;
      // Only owners can grant owner role
      if (role === 'owner' && inviterRole !== 'owner') {
        results.push({
          email,
          ok: false,
          error: 'Only owners can invite other owners',
        });
        continue;
      }
      try {
        const invitation = await createInvitation({
          organizationId: orgId,
          email,
          role,
          invitedBy: user.id,
        });

        if (!invitation.success) {
          const errorMessage =
            invitation.error instanceof Error
              ? invitation.error.message
              : String(invitation.error ?? 'Failed');

          results.push({
            email,
            ok: false,
            error: errorMessage,
          });
          continue;
        }

        results.push({ email, ok: true });
      } catch (err) {
        log.warn({ err, email }, 'invitation failed');
        results.push({
          email,
          ok: false,
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
