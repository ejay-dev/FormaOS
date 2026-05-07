import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { createInvitation } from '@/lib/invitations/create-invitation';

const log = routeLog('/api/v1/members/invite');
const VALID_ROLES = new Set(['owner', 'admin', 'member', 'viewer']);
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
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const inviterRole = (membership?.role as string | undefined) ?? '';
    const canInvite = inviterRole === 'owner' || inviterRole === 'admin';
    if (!canInvite) {
      return NextResponse.json(
        { error: 'Forbidden - only owners and admins can invite members' },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      invites?: Array<{ email?: string; role?: string }>;
    };
    const invites = Array.isArray(body.invites)
      ? body.invites.slice(0, 10)
      : [];
    if (invites.length === 0) {
      return NextResponse.json(
        { error: 'No invites provided' },
        { status: 400 },
      );
    }

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
      const email = (inv.email || '').trim().toLowerCase();
      const role = VALID_ROLES.has(inv.role || '')
        ? (inv.role as InviteRole)
        : 'member';
      // Only owners can grant owner role
      if (role === 'owner' && inviterRole !== 'owner') {
        results.push({
          email,
          ok: false,
          error: 'Only owners can invite other owners',
        });
        continue;
      }
      if (!email) {
        results.push({ email, ok: false, error: 'Missing email' });
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
