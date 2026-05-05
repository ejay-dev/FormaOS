import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
